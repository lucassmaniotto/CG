import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

let parametrosGUI, camera, scene, renderer, objects = {};
let cameraFollowTarget = null, followDistance = 50, followHeight = 30; // dist/altura da câmera
let dirLight, pointLight, spotLight, dirHelper, pointHelper, spotHelper; // luzes GUI
let mixer, activeAction, loadFinished = false;
const animationActions = []; // legado; mantendo se precisar
const actions = { idle: null, walk: null, fly: null }; // mapeamento de animações usadas
const clock = new THREE.Clock();

// Estado de entrada (setas) e movimento
const input = { forward: false, back: false, left: false, right: false, ascend: false, descend: false };
const moveSpeed = 50; // unidades/segundo
const rotationSpeed = Math.PI / 2; // radianos/segundo (90°/s)
const verticalSpeed = 25; // unidades/segundo (subida/descida)

// Loader de textura
const textureLoader = new THREE.TextureLoader();

// Config de objetos
const objectConfigs = { 
  dragon: { 
    baseScale: 0.007,
    basePosition: { x: 0, y: -5, z: 0 } 
  } 
};

const loadObj = (objName, fileName, position = { x: 0, y: -5, z: 0 }, scale, rotation = { x: 0, y: 0, z: 0 }) => {
  const fbxPath = `./assets/models/${objName}/${fileName}`;
  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    fbxPath,
    (object) => {
      console.log(`${objName} carregado`);
      try {
        object.scale.set(scale, scale, scale);
        object.position.set(position.x, position.y, position.z);
        object.rotation.set(rotation.x, rotation.y, rotation.z);
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const texture = textureLoader.load("./assets/models/Dragon/textures/Dragon_ground_color.jpg");
            child.material = new THREE.MeshStandardMaterial({ map: texture });
            child.castShadow = true; child.receiveShadow = false;
          }
        });
      } catch (e) { 
        console.warn("Erro aplicando transformações ao objeto FBX:", e); 
      }
      scene.add(object); objects[objName.toLowerCase()] = object;

      /* 
       [0] - Animação de caminhar
       [1] - Animação de voar
       [2] - Animação de Idle
       [3] - Animação de correr
      */

      mixer = new THREE.AnimationMixer(object);
      // Cria as ações principais
      try {
        actions.idle = object.animations[2] ? mixer.clipAction(object.animations[2]) : null;
        actions.walk = object.animations[0] ? mixer.clipAction(object.animations[0]) : null;
        actions.fly  = object.animations[1] ? mixer.clipAction(object.animations[1]) : null;
        if (actions.idle) animationActions.push(actions.idle);
        if (actions.walk) animationActions.push(actions.walk);
        if (actions.fly)  animationActions.push(actions.fly);
      } catch (e) {
        console.warn("Não foi possível configurar as animações walk/idle:", e);
      }

      // Define animação ativa como idle
      activeAction = actions.idle || (object.animations[0] ? mixer.clipAction(object.animations[0]) : null);
      if (activeAction) activeAction.play();
      loadFinished = true;

      // Faz a câmera seguir o dragão (atrás e acima)
      if (objName.toLowerCase() === "dragon") {
        cameraFollowTarget = object;
        try {
          const dir = new THREE.Vector3(); 
          object.getWorldDirection(dir);
          const desiredPos = object.position.clone().addScaledVector(dir, -followDistance); 
          desiredPos.y = object.position.y + followHeight;
          camera.position.copy(desiredPos); 
          camera.lookAt(object.position);
        } catch (e) { 
          console.warn("Erro ao posicionar a câmera atrás do Dragon:", e); 
        }
      }
    },
    (progress) => { 
      if (progress && progress.loaded && progress.total) 
        console.log(objName + " " + (progress.loaded / progress.total) * 100 + "% loaded"); 
    },
    (error) => { 
      console.error(`Erro ao carregar o ${objName}:`, error); 
      console.log(`Verifique se o arquivo existe em: ${fbxPath}`); 
    }
  );
};

// Cria luz + helper + controles GUI
function createLightWithGui({ type, label, state, guiParent, intensityRange = [0, 5, 0.1] }) {
  // Definições de luzes
  const LIGHT_DEFS = {
    directional: {
      factory: () => new THREE.DirectionalLight(0xffffff, 0.6),
      helperFactory: (light) => new THREE.DirectionalLightHelper(light, 5, 0x00ffcc),
      afterCreate: (light) => { 
        light.castShadow = true; 
        const cameraShadow = light.shadow.camera; 
        const SIZE = 40; 
        cameraShadow.left = -SIZE; 
        cameraShadow.right = SIZE; 
        cameraShadow.top = SIZE; 
        cameraShadow.bottom = -SIZE; 
        cameraShadow.near = 0.5; 
        cameraShadow.far = 500; 
        cameraShadow.updateProjectionMatrix(); 
        light.shadow.mapSize.set(2048, 2048); 
      },
    },
    point: {
      factory: () => new THREE.PointLight(0xffffff, 2, 0, 2),
      helperFactory: (light) => new THREE.PointLightHelper(light, 2, 0xff00ff),
      afterCreate: (light) => { light.castShadow = true; },
    },
    spot: {
      factory: () => new THREE.SpotLight(0xffffff, 5, 0, 0.5, 0.2, 2),
      helperFactory: (light) => new THREE.SpotLightHelper(light, 0x00ffff),
      afterCreate: (light) => { 
        light.castShadow = true; 
        if (!light.target.parent) 
          scene.add(light.target); 
        light.target.position.set(0, 0, 0); 
      },
    },
  };

  // Cria luzes
  const def = LIGHT_DEFS[type]; 
  if (!def) throw new Error(`Tipo de luz desconhecido: ${type}`);
  const light = def.factory(); 
  light.visible = !!state.enabled;
  if (state.color) light.color.set(state.color);
  if (typeof state.intensity === "number") light.intensity = state.intensity;
  if (typeof state.x === "number" && typeof state.y === "number" && typeof state.z === "number") 
    light.position.set(state.x, state.y, state.z);
  if (type === "spot" && typeof state.angle === "number") 
    light.angle = state.angle;

  scene.add(light); def.afterCreate(light);

  let helper = null; 
  try { 
    helper = def.helperFactory(light); 
    scene.add(helper); 
    helper.visible = !!state.helper; 
  } catch (e) { 
    console.warn(`Não foi possível criar helper para ${label}:`, e); 
  }

  const folder = guiParent.addFolder(label); state.enabled ? folder.open() : folder.close();
  let helperController; // referência ao checkbox do helper

  folder.add(state, "enabled").name("Ativar").onChange((visible) => {
    light.visible = visible; 
    // Quando a luz é desativada força collapse do folder da GUI
    visible ? folder.open() : folder.close();
    if (!visible && state.helper) { // desliga helper ao desativar luz
      if (helperController && typeof helperController.setValue === "function") 
        helperController.setValue(false); 
      else { 
        state.helper = false; 
        if (helper) helper.visible = false; 
      }
    }
  });

  folder.addColor(state, "color").name("Cor").onChange((color) => { light.color.set(color); });

  const [iMin, iMax, iStep] = intensityRange;
  folder.add(state, "intensity", iMin, iMax, iStep).name("Intensidade").onChange((visible) => { light.intensity = visible; });

  helperController = folder.add(state, "helper").name("Helper").onChange((visible) => { 
    if (helper) { 
      helper.visible = visible; 
      if (type === "spot" && helper.update) 
        helper.update(); 
      } 
    }
  );

  const updateHelper = () => { 
    if (helper && helper.update) helper.update(); 
  };

  folder.add(state, "x", -200, 200, 1).name("Pos X").onChange((x) => { 
    light.position.x = x; updateHelper(); 
  });
  folder.add(state, "y", -200, 200, 1).name("Pos Y").onChange((y) => { 
    light.position.y = y; updateHelper(); 
  });
  folder.add(state, "z", -200, 200, 1).name("Pos Z").onChange((z) => { 
    light.position.z = z; updateHelper(); 
  });

  if (type === "spot") { 
    const HALF_PI = Math.PI / 2; 
    folder.add(state, "angle", 0.0, HALF_PI, 0.01).name("Ângulo").onChange((angle) => { 
      light.angle = angle; updateHelper(); 
    }); 
  }
  return { light, helper, folder };
}

const createGUI = () => {
  const gui = new GUI(); gui.width = 300;
  // Configuração de iluminação
  parametrosGUI = {
    iluminacao: {
      directional: { enabled: true, color: "#ffffff", intensity: 0.5, helper: false, x: 10, y: 20, z: 10 },
      point: { enabled: false, color: "#ffffff", intensity: 2.0, helper: false, x: -10, y: 15, z: 10 },
      spot: { enabled: false, color: "#ffffff", intensity: 500.0, helper: false, x: -10, y: 25, z: 10, angle: 0.5 },
    },
  };

  const lightsFolder = gui.addFolder("Iluminação"); lightsFolder.open();
  // Cria luzes com GUI
  { 
    const { light, helper } = createLightWithGui({ 
      type: "directional", 
      label: "Directional", 
      state: parametrosGUI.iluminacao.directional, 
      guiParent: lightsFolder, intensityRange: [0, 5, 0.1] }
    ); 
    dirLight = light; 
    dirHelper = helper; 
  }
  { 
    const { light, helper } = createLightWithGui({ 
      type: "point", 
      label: "Point", 
      state: parametrosGUI.iluminacao.point, 
      guiParent: lightsFolder, 
      intensityRange: [0, 50, 0.1] }
    ); 
    pointLight = light; 
    pointHelper = helper; 
  }
  { 
    const { light, helper } = createLightWithGui({ 
      type: "spot", 
      label: "Spot", 
      state: parametrosGUI.iluminacao.spot, 
      guiParent: lightsFolder, 
      intensityRange: [0, 1000, 0.1] }
    ); 
    spotLight = light;
    spotHelper = helper; 
  }
};

const loadAllObjects = () => { 
  loadObj("Dragon", "Dragon.fbx", 
    objectConfigs.dragon.basePosition, 
    objectConfigs.dragon.baseScale, 
    objectConfigs.dragon.baseRotation); 
};

export function init() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x87CEEB);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const grassPath = "./assets/grass.jpg";
  const grassTexture = textureLoader.load(
    grassPath,
    (tex) => { try { tex.encoding = THREE.sRGBEncoding; } catch (e) {} 
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; 
    tex.repeat.set(500, 500); },
    undefined,
    (err) => { console.warn("Não foi possível carregar a textura do chão", err); }
  );

  const groundMaterial = new THREE.MeshStandardMaterial(
    { map: grassTexture, side: THREE.DoubleSide, roughness: 1.0, metalness: 0.0 }
  );
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20000, 20000), 
    groundMaterial
  ); 
  ground.rotation.x = -Math.PI / 2; 
  ground.position.y = -6; 
  ground.receiveShadow = true; 
  scene.add(ground);

  renderer = new THREE.WebGLRenderer(); 
  renderer.shadowMap.enabled = true; 
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
  renderer.setSize(window.innerWidth, window.innerHeight); 
  try { renderer.outputEncoding = THREE.sRGBEncoding; } catch (e) {}

  createGUI(); loadAllObjects();
  camera.position.set(0, 0, 50); 
  camera.lookAt(0, 0, 0);
  document.body.appendChild(renderer.domElement);
  renderer.setAnimationLoop(animate); // loop de animação
  window.addEventListener("resize", onWindowResize);

  // Controles de teclado (setas)
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });
}

function animate() {
  const delta = clock.getDelta();
  if (loadFinished && mixer) { mixer.update(delta); }

  // Movimento do Dragão
  const dragon = objects["dragon"];
  if (dragon) {
    // Rotação em Y com setas esquerda/direita
    const turnDir = (input.left ? 1 : 0) + (input.right ? -1 : 0); // esquerda positivo, direita negativo
    if (turnDir !== 0) {
      dragon.rotation.y += turnDir * rotationSpeed * delta;
    }

    // Movimento vertical (Espaço sobe, Ctrl Esquerdo desce)
    if (input.ascend) {
      dragon.position.y += verticalSpeed * delta;
    }
    if (input.descend) {
      dragon.position.y -= verticalSpeed * delta;
      if (dragon.position.y < 0) dragon.position.y = 0; // chão em y=0
    }

    // Apenas translação conta como andar
    const anyMoving = input.forward || input.back;

    // Atualiza animação com base no estado (prioridade: voar > andar > idle)
    const isFlying = input.ascend || input.descend || dragon.position.y > 0.0;
    if (isFlying && actions.fly) {
      if (activeAction !== actions.fly) switchAction(actions.fly, 0.2);
    } else if (anyMoving && actions.walk) {
      if (activeAction !== actions.walk) switchAction(actions.walk, 0.2);
    } else if (actions.idle) {
      if (activeAction !== actions.idle) switchAction(actions.idle, 0.2);
    }

    if (anyMoving) {
      // Direção "frente" após rotação (apenas no plano XZ)
      const forward = new THREE.Vector3();
      dragon.getWorldDirection(forward);
      forward.y = 0; // manter no plano do chão
      if (forward.lengthSq() > 0) forward.normalize();

      const move = new THREE.Vector3();
      if (input.forward) move.add(forward);
      if (input.back) move.addScaledVector(forward, -1);
      if (move.lengthSq() > 0) {
        move.normalize();
        dragon.position.addScaledVector(move, moveSpeed * delta);
      }
    }
  }

  // Segue o Dragon
  if (cameraFollowTarget) {
    try {
      const dir = new THREE.Vector3(); cameraFollowTarget.getWorldDirection(dir);
      const desiredPos = cameraFollowTarget.position.clone().addScaledVector(dir, -followDistance); desiredPos.y = cameraFollowTarget.position.y + followHeight;
      camera.position.lerp(desiredPos, 0.12); camera.lookAt(cameraFollowTarget.position);
    } catch (e) { 
      console.warn("Erro ao atualizar a posição da câmera seguindo o alvo:", e);
    }
  }

  if (spotHelper) spotHelper.update(); // helper do SpotLight
  renderer.render(scene, camera);
}

function onWindowResize() { 
  camera.aspect = window.innerWidth / window.innerHeight; 
  camera.updateProjectionMatrix(); 
  renderer.setSize(window.innerWidth, window.innerHeight); 
}

// Alterna animações com crossfade
function switchAction(nextAction, duration = 0.2) {
  if (!nextAction) return;
  if (activeAction === nextAction) return;
  nextAction.reset().play();
  if (activeAction) activeAction.crossFadeTo(nextAction, duration, false);
  activeAction = nextAction;
}

// Handlers de teclado
function onKeyDown(e) {
  if (
    e.code === "ArrowUp" || 
    e.code === "ArrowDown" || 
    e.code === "ArrowLeft" || 
    e.code === "ArrowRight" || 
    e.code === "Space" || 
    e.code === "ControlLeft") {
    e.preventDefault();
  }
  switch (e.code) {
    case "ArrowUp": input.forward = true; break;
    case "ArrowDown": input.back = true; break;
    case "ArrowLeft": input.left = true; break;
    case "ArrowRight": input.right = true; break;
    case "Space": input.ascend = true; break;
    case "ControlLeft": input.descend = true; break;
  }
}

function onKeyUp(e) {
  if (e.code === "ArrowUp" || 
    e.code === "ArrowDown" || 
    e.code === "ArrowLeft" || 
    e.code === "ArrowRight" || 
    e.code === "Space" || 
    e.code === "ControlLeft") {
    e.preventDefault();
  }
  switch (e.code) {
    case "ArrowUp": input.forward = false; break;
    case "ArrowDown": input.back = false; break;
    case "ArrowLeft": input.left = false; break;
    case "ArrowRight": input.right = false; break;
    case "Space": input.ascend = false; break;
    case "ControlLeft": input.descend = false; break;
  }
}
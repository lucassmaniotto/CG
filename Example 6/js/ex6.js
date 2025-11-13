import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

let parametrosGUI, camera, scene, renderer, objects = [];
let cameraFollowTarget = null, followDistance = 50, followHeight = 40; // dist/altura da câmera
let dirLight, pointLight, spotLight, dirHelper, pointHelper, spotHelper; // luzes GUI
let mixer, activateAnimation, loadFinished = false; const animationActions = []; 
const clock = new THREE.Clock();

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
      const animation = mixer.clipAction(object.animations[2]); // idle
      animationActions.push(animation); 
      activateAnimation = animation; 
      loadFinished = true; 
      activateAnimation.play();

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
  const LIGHT_DEFS = {
    directional: {
      factory: () => new THREE.DirectionalLight(0xffffff, 0.6),
      helperFactory: (light) => new THREE.DirectionalLightHelper(light, 5, 0x00ffcc),
      afterCreate: (light) => { 
        light.castShadow = true; 
        const camera = light.shadow.camera; 
        const SIZE = 40; 
        camera.left = -SIZE; 
        camera.right = SIZE; 
        camera.top = SIZE; 
        camera.bottom = -SIZE; 
        camera.near = 0.5; 
        camera.far = 500; 
        camera.updateProjectionMatrix(); 
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

  const f = guiParent.addFolder(label); state.enabled ? f.open() : f.close();
  let helperController; // referência ao checkbox do helper

  f.add(state, "enabled").name("Ativar").onChange((visible) => {
    light.visible = visible; visible ? f.open() : f.close();
    if (!visible && state.helper) { // desliga helper ao desativar luz
      if (helperController && typeof helperController.setValue === "function") 
        helperController.setValue(false); 
      else { 
        state.helper = false; 
        if (helper) helper.visible = false; 
      }
    }
  });

  f.addColor(state, "color").name("Cor").onChange((color) => { light.color.set(color); });

  const [iMin, iMax, iStep] = intensityRange;
  f.add(state, "intensity", iMin, iMax, iStep).name("Intensidade").onChange((visible) => { light.intensity = visible; });

  helperController = f.add(state, "helper").name("Helper").onChange((visible) => { 
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

  f.add(state, "x", -200, 200, 1).name("Pos X").onChange((x) => { 
    light.position.x = x; updateHelper(); 
  });
  f.add(state, "y", -200, 200, 1).name("Pos Y").onChange((y) => { 
    light.position.y = y; updateHelper(); 
  });
  f.add(state, "z", -200, 200, 1).name("Pos Z").onChange((z) => { 
    light.position.z = z; updateHelper(); 
  });

  if (type === "spot") { 
    const HALF_PI = Math.PI / 2; 
    f.add(state, "angle", 0.0, HALF_PI, 0.01).name("Ângulo").onChange((angle) => { 
      light.angle = angle; updateHelper(); 
    }); 
  }
  return { light, helper, folder: f };
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
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x222222);
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
}

function animate() {
  const delta = clock.getDelta();
  if (loadFinished) { mixer.update(delta); activateAnimation.play(); }

  // Segue o alvo (ex: Dragon)
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
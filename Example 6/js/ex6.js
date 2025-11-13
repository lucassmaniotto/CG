import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

let parametrosGUI;
let camera, scene, renderer;
let objects = [];

let cameraFollowTarget = null;
let followDistance = 50; // distância da camera
let followHeight = 40; // altura da camera

// luzes que a GUI irá controlar
let dirLight, pointLight;
let dirHelper, pointHelper;

var mixer;
var animationActions = [];
var activateAnimation;
var loadFinished = false;
var clock = new THREE.Clock();

// Texture loader para carregar imagens .jpg em assets/textures/<animal>/<animal>.jpg
const textureLoader = new THREE.TextureLoader();

// Define configurações específicas para cada objeto
const objectConfigs = {
  dragon: { 
    baseScale: 0.007, 
    min: 0.007, 
    max: 0.015, 
    step: 0.001,
    basePosition: { x: 0, y: -5, z: 0 }
  }
};

var loadObj = function (
  objName,
  fileName,
  position = { x: 0, y: -5, z: 0 },
  scale,
  rotation = { x: 0, y: 0, z: 0 }
) {
  const fbxPath = `./assets/models/${objName}/${fileName}`;

  const fbxLoader = new FBXLoader();

  fbxLoader.load(
    fbxPath,
    function (object) {
      console.log(`${objName} carregado`);
      try {
        object.scale.set(scale, scale, scale);
        object.position.set(position.x, position.y, position.z);
        object.rotation.set(rotation.x, rotation.y, rotation.z);

        object.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            let texture = textureLoader.load("./assets/models/Dragon/textures/Dragon_ground_color.jpg");
            child.material = new THREE.MeshStandardMaterial({ map: texture });
            try { child.castShadow = true; } catch (e) {}
            try { child.receiveShadow = false; } catch (e) {}
          }
        });
      } catch (e) {
        console.warn('Erro aplicando transformações ao objeto FBX:', e);
      }
      scene.add(object);
      objects[objName.toLowerCase()] = object;

      // Animações
      let animation;

      /* 
       [0] - Animação de caminhar
       [1] - Animação de voar
       [2] - Animação de Idle
       [3] - Animação de correr
      */

      mixer = new THREE.AnimationMixer(object);
      animation = mixer.clipAction(object.animations[2]); // animação de Idle
      animationActions.push(animation);

      activateAnimation = animation;
      loadFinished = true;

      activateAnimation.play();

      // Se for o dragão, faz a câmera seguir esse objeto (posicionando atrás e acima)
      if (objName.toLowerCase() === 'dragon') {
        cameraFollowTarget = object;
        try {
          const dir = new THREE.Vector3();
          object.getWorldDirection(dir); // direção onde o objeto está apontando
          const desiredPos = object.position.clone().addScaledVector(dir, -followDistance);
          desiredPos.y = object.position.y + followHeight;
          camera.position.copy(desiredPos);
          camera.lookAt(object.position);
        } catch (e) {
          console.warn('Erro ao posicionar a câmera atrás do Dragon:', e);
        }
      }

    },
    function (progress) {
      if (progress && progress.loaded && progress.total)
        console.log(
          objName + " " + (progress.loaded / progress.total) * 100 + "% loaded"
        );
    },
    function (error) {
      console.error(`Erro ao carregar o ${objName}:`, error);
      console.log(`Verifique se o arquivo existe em: ${fbxPath}`);
    }
  );
};

var createGUI = function () {
  const gui = new GUI();
  gui.width = 300;

  // Configurações iniciais da GUI para iluminação
  parametrosGUI = {
    iluminacao: {
      directional: { enabled: true, color: '#ffffff', intensity: 0.6, helper: false },
      point: { enabled: false, color: '#ffffff', intensity: 2.0, helper: false, x: -10, y: 15, z: 10 }
    }
  };

  const lightsFolder = gui.addFolder('Iluminação');
  lightsFolder.open();

  // Directional
  const fDir = lightsFolder.addFolder('Directional');
  fDir.add(parametrosGUI.iluminacao.directional, 'enabled')
    .name('Ativar')
    .onChange((v) => { if (dirLight) dirLight.visible = v; });
  fDir.addColor(parametrosGUI.iluminacao.directional, 'color')
    .name('Cor')
    .onChange((c) => { if (dirLight) dirLight.color.set(c); });
  fDir.add(parametrosGUI.iluminacao.directional, 'intensity', 0, 5, 0.1)
    .name('Intensidade')
    .onChange((v) => { if (dirLight) dirLight.intensity = v; });
  fDir.add(parametrosGUI.iluminacao.directional, 'helper')
    .name('Mostrar helper')
    .onChange((v) => { if (dirHelper) dirHelper.visible = v; });

  // Point
  const fPoint = lightsFolder.addFolder('Point');
  fPoint.add(parametrosGUI.iluminacao.point, 'enabled')
    .name('Ativar')
    .onChange((v) => { if (pointLight) pointLight.visible = v; });
  fPoint.addColor(parametrosGUI.iluminacao.point, 'color')
    .name('Cor')
    .onChange((c) => { if (pointLight) pointLight.color.set(c); });
  fPoint.add(parametrosGUI.iluminacao.point, 'intensity', 0, 50, 0.1)
    .name('Intensidade')
    .onChange((v) => { if (pointLight) pointLight.intensity = v; });
  fPoint.add(parametrosGUI.iluminacao.point, 'helper')
    .name('Mostrar helper')
    .onChange((v) => { if (pointHelper) pointHelper.visible = v; });

  // Controles de posição
  fPoint.add(parametrosGUI.iluminacao.point, 'x', -200, 200, 1)
    .name('Pos X')
    .onChange((v) => { if (pointLight) { pointLight.position.x = v; try { if (pointHelper) pointHelper.update(); } catch (e) {} } });
  fPoint.add(parametrosGUI.iluminacao.point, 'y', -200, 200, 1)
    .name('Pos Y')
    .onChange((v) => { if (pointLight) { pointLight.position.y = v; try { if (pointHelper) pointHelper.update(); } catch (e) {} } });
  fPoint.add(parametrosGUI.iluminacao.point, 'z', -200, 200, 1)
    .name('Pos Z')
    .onChange((v) => { if (pointLight) { pointLight.position.z = v; try { if (pointHelper) pointHelper.update(); } catch (e) {} } });
};

var loadAllObjects = function () {
  // Carrega todos os objetos usando as configurações definidas em objectConfigs
  loadObj("Dragon", "Dragon.fbx", 
    objectConfigs.dragon.basePosition, 
    objectConfigs.dragon.baseScale, 
    objectConfigs.dragon.baseRotation);
}

export function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  // Cria o mundo
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // Luzes básicas para que materiais como MeshStandardMaterial fiquem visíveis
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  
  // DirectionalLight (padrão ligado)
  dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 10);
  try { dirLight.castShadow = true; } catch (e) {}
  // visibilidade inicial - se a GUI já definiu valores, respeitamos, senão true
  if (parametrosGUI && parametrosGUI.iluminacao) {
    dirLight.visible = !!parametrosGUI.iluminacao.directional.enabled; // conversão para boolean
    dirLight.color.set(parametrosGUI.iluminacao.directional.color); // ajusta cor inicial
  } else {
    dirLight.visible = true;
  }
  scene.add(dirLight);

  try {
    dirHelper = new THREE.DirectionalLightHelper(dirLight, 5, 0x00ffcc);
    scene.add(dirHelper);
    dirHelper.visible = false;
  } catch (e) {
    console.warn('Não foi possível adicionar DirectionalLightHelper:', e);
  }

  // PointLight
  pointLight = new THREE.PointLight(0xffffff, 2, 0, 2);
  pointLight.position.set(-10, 15, 10);
  try { pointLight.castShadow = true; } catch (e) {}
  if (parametrosGUI && parametrosGUI.iluminacao) {
    pointLight.visible = !!parametrosGUI.iluminacao.point.enabled;
    pointLight.color.set(parametrosGUI.iluminacao.point.color);
  } else {
    pointLight.visible = false;
  }
  scene.add(pointLight);
  try {
    pointHelper = new THREE.PointLightHelper(pointLight, 2, 0xff00ff);
    scene.add(pointHelper);
    pointHelper.visible = false;
  } catch (e) {
    console.warn('Não foi possível adicionar PointLightHelper:', e);
  }

  const grassPath = './assets/grass.jpg';
  const grassTexture = textureLoader.load(
    grassPath,
    function (tex) {
      try { tex.encoding = THREE.sRGBEncoding; } catch (e) {}
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(500, 500);
    },
    undefined,
    function (err) {
      console.warn('Não foi possível carregar a textura do chão em', grassPath);
    }
  );

  const groundMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    side: THREE.DoubleSide,
    roughness: 1.0,
    metalness: 0.0
  });
  const groundGeo = new THREE.PlaneGeometry(20000, 20000);
  const ground = new THREE.Mesh(groundGeo, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -6;
  try { ground.receiveShadow = true; } catch (e) {}
  scene.add(ground);

  renderer = new THREE.WebGLRenderer();
  // Habilita sombras no renderer
  try { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; } catch (e) {}
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Ajusta encoding para cores corretas ao usar texturas sRGB (JPEG/PNG)
  try { renderer.outputEncoding = THREE.sRGBEncoding; } catch (e) {}

  createGUI();

  loadAllObjects();

  camera.position.set(0, 0, 50);
  camera.lookAt(0, 0, 0);

  document.body.appendChild(renderer.domElement);

  // Inicia o loop de animação
  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", onWindowResize);
}

function animate() {
  
  let delta = clock.getDelta();
  if (loadFinished) {
    mixer.update(delta);
    activateAnimation.play();
  }

  // Atualiza posição da câmera se houver um alvo para seguir (ex: Dragon)
  if (cameraFollowTarget) {
    try {
      const dir = new THREE.Vector3();
      cameraFollowTarget.getWorldDirection(dir);
      const desiredPos = cameraFollowTarget.position.clone().addScaledVector(dir, -followDistance);
      desiredPos.y = cameraFollowTarget.position.y + followHeight;
      // suaviza o movimento da câmera
      camera.position.lerp(desiredPos, 0.12);
      camera.lookAt(cameraFollowTarget.position);
    } catch (e) {
      console.warn('Erro ao atualizar a posição da câmera seguindo o alvo:', e);
    }
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
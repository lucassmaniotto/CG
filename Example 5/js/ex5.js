import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

let parametrosGUI;
let camera, scene, renderer;
let objects = [];
let objectScaleController;
// Texture loader para carregar imagens .jpg em assets/textures/<animal>/<animal>.jpg
const textureLoader = new THREE.TextureLoader();

// Define configurações específicas para cada objeto
const objectConfigs = {
  wolf: { 
    baseScale: 20, 
    min: 5, 
    max: 50, 
    step: 1,
    basePosition: { x: 0, y: -5, z: 0 }
  },
  cat: { 
    baseScale: 0.30, 
    min: 0.005, 
    max: 0.1, 
    step: 0.005,
    basePosition: { x: -200, y: -5, z: 0 },
    baseRotation: { x: -Math.PI/2, y: 0, z: 0 }
  },
  horse: { 
    baseScale: 0.015, 
    min: 0.005, 
    max: 0.025, 
    step: 0.001,
    basePosition: { x: 1700, y: -5, z: 0 },
    baseRotation: { x: -Math.PI/2, y: 0, z: 0 }
  },
  monkey: { 
    baseScale: 0.2, 
    min: 0.02, 
    max: 0.3, 
    step: 0.01,
    basePosition: { x: -4500, y: -5, z: 0 },
    baseRotation: { x: -Math.PI/2, y: 0, z: 0 }
  },
  pig: { 
    baseScale: 0.5, 
    min: 2, 
    max: 6.5, 
    step: 0.5,
    basePosition: { x: 2500, y: -5, z: 0 },
  },
  spider: { 
    baseScale: 0.05, 
    min: 0.01, 
    max: 0.2, 
    step: 0.005,
    basePosition: { x: -7500, y: -5, z: -5 }
  }
};

// Função para atualizar os parâmetros do controle de escala
var updateScaleController = function(objectKey) {
  if (objectConfigs[objectKey] && objectScaleController) {
    const config = objectConfigs[objectKey];
    objectScaleController.min(config.min);
    objectScaleController.max(config.max);
    objectScaleController.step(config.step);
  }
};

// Define quais objetos foram rotacionados inicialmente no eixo X
const rotatedObjects = ['horse', 'monkey', 'pig'];

var createGUI = function () {
  const gui = new GUI();
  gui.width = 300;

  parametrosGUI = {
    objectScale: 20,
    objectRotY: 0,
    positionY: 0,
    cameraTarget: "Origem",
  };

  // Camera controls
  let cameraControls = gui.addFolder("Camera");
  let cameraOptions = ["Origem", "Wolf", "Cat", "Horse", "Monkey", "Pig", "Spider"];
  cameraControls
    .add(parametrosGUI, "cameraTarget")
    .options(cameraOptions)
    .name("Look At")
    .onChange(function (value) {
      if (value === "Origem") {
        camera.position.set(0, 0, 50);
        camera.lookAt(0, 0, 0);
      } else {
        let objKey = value.toLowerCase();
        if (objects[objKey]) {
          camera.position.set(
            objects[objKey].position.x + 30,
            objects[objKey].position.y + 15,
            objects[objKey].position.z + 30
          );
          camera.lookAt(objects[objKey].position);
          
          // Atualiza os parâmetros do controle de escala
          updateScaleController(objKey);
          
          parametrosGUI.objectScale = objects[objKey].scale.x;
          // Para objetos rotacionados, mostra a rotação Z ao invés de Y
          if (rotatedObjects.includes(objKey)) {
            parametrosGUI.objectRotY = objects[objKey].rotation.z;
          } else {
            parametrosGUI.objectRotY = objects[objKey].rotation.y;
          }
          objectScaleController.updateDisplay();
          objectRotY.updateDisplay();
        }
      }
    });

  // Controles individuais
  let objectControls = gui.addFolder("Object Controls");

  objectScaleController = objectControls
    .add(parametrosGUI, "objectScale")
    .min(5)
    .max(40)
    .step(1)
    .name("Object Scale");
  objectScaleController.onChange(function (value) {
    let targetKey = parametrosGUI.cameraTarget.toLowerCase();
    let selectedObj = objects[targetKey];
    if (selectedObj) {
      selectedObj.scale.set(value, value, value);
    }
  });

  let objectRotY = objectControls
    .add(parametrosGUI, "objectRotY")
    .min(-Math.PI)
    .max(Math.PI)
    .step(0.1)
    .name("Rotation Y");
  objectRotY.onChange(function (value) {
    let targetKey = parametrosGUI.cameraTarget.toLowerCase();
    let selectedObj = objects[targetKey];
    if (selectedObj) {
      // Para objetos iniciam rotacionados no eixo X, ajustamos a rotação Z ao invés de Y
      if (rotatedObjects.includes(targetKey)) {
        selectedObj.rotation.z = value;
      } else {
        selectedObj.rotation.y = value;
      }
    }
  });

  let positionY = objectControls
    .add(parametrosGUI, "positionY")
    .min(-30)
    .max(10)
    .step(1)
    .name("Position Y");
  positionY.onChange(function (value) {
    let targetKey = parametrosGUI.cameraTarget.toLowerCase();
    let selectedObj = objects[targetKey];
    if (selectedObj) {
      selectedObj.position.y = value;
    }
  });

  
};

var loadObj = function (objName, fileName, position = { x: 0, y: -5, z: 0 }, scale = 20, rotation = { x: 0, y: 0, z: 0 }) {
  let objLoader = new OBJLoader();

  objLoader.load(
    `./assets/${fileName}`,
    function (object) {
      console.log(`${objName} carregado com sucesso!`);
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          // Cria um material padrão e tenta carregar uma textura JPG correspondente ao objeto
          const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide
          });
          child.material = baseMaterial;

          // Tentativas de caminho: lowercase (padrão) e o nome original
          const nameLower = objName.toLowerCase();
          const candidatePaths = [
            `./assets/textures/${nameLower}/${nameLower}.jpg`,
            `./assets/textures/${objName}/${objName}.jpg`
          ];

          // Função recursiva para tentar os caminhos em sequência
          const tryLoad = (index) => {
            if (index >= candidatePaths.length) {
              console.warn(`Nenhuma textura encontrada para ${objName}. Usando material padrão.`);
              return;
            }
            const path = candidatePaths[index];
            textureLoader.load(
              path,
              function (texture) {
                // Ajustes de cor para JPEGs
                if (texture) {
                  try { texture.encoding = THREE.sRGBEncoding; } catch (e) {}
                }
                baseMaterial.map = texture;
                baseMaterial.needsUpdate = true;
                console.log(`Textura aplicada: ${path} -> ${objName}`);
              },
              undefined,
              function (err) {
                // Não encontrou, tenta próximo caminho
                console.warn(`Não encontrou textura em ${path}, tentando próximo...`);
                tryLoad(index + 1);
              }
            );
          };
          tryLoad(0);
        }
      });
      object.scale.set(scale, scale, scale);
      object.position.set(position.x, position.y, position.z);
      object.rotation.set(rotation.x, rotation.y, rotation.z);
      scene.add(object);
      objects[objName.toLowerCase()] = object;
    },
    function (progress) {
      console.log(objName + " " + (progress.loaded / progress.total) * 100 + "% loaded");
    },
    function (error) {
      console.error(`Erro ao carregar o ${objName}:`, error);
      console.log(`Verifique se o arquivo existe em: ./assets/${fileName}`);
    }
  )
}

var loadAllObjects = function () {
  // Carrega todos os objetos usando as configurações definidas em objectConfigs
  loadObj("Wolf", "Wolf_obj.obj", 
    objectConfigs.wolf.basePosition, 
    objectConfigs.wolf.baseScale, 
    objectConfigs.wolf.baseRotation);
  loadObj("Cat", "Cat_obj.obj", 
    objectConfigs.cat.basePosition, 
    objectConfigs.cat.baseScale, 
    objectConfigs.cat.baseRotation);
  loadObj("Horse", "Horse_obj.obj", 
    objectConfigs.horse.basePosition, 
    objectConfigs.horse.baseScale, 
    objectConfigs.horse.baseRotation);
  loadObj("Monkey", "Monkey_obj.obj", 
    objectConfigs.monkey.basePosition, 
    objectConfigs.monkey.baseScale, 
    objectConfigs.monkey.baseRotation);
  loadObj("Pig", "Pig_obj.obj", 
    objectConfigs.pig.basePosition, 
    objectConfigs.pig.baseScale, 
    objectConfigs.pig.baseRotation);
  loadObj("Spider", "Spider_obj.obj", 
    objectConfigs.spider.basePosition, 
    objectConfigs.spider.baseScale, 
    objectConfigs.spider.baseRotation);
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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const grassPath = './assets/textures/grass.jpg';
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
  animate();

  window.addEventListener("resize", onWindowResize);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
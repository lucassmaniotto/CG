import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

let parametrosGUI;
let camera, scene, renderer;
let objects = [];
let objectScaleController;

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
    baseScale: 0.020, 
    min: 0.005, 
    max: 0.1, 
    step: 0.005,
    basePosition: { x: -20*1000, y: -5, z: 0 }
  },
  horse: { 
    baseScale: 0.015, 
    min: 0.005, 
    max: 0.025, 
    step: 0.001,
    basePosition: { x: 17*1000, y: -5, z: 0 },
    baseRotation: { x: -Math.PI/2, y: 0, z: 0 }
  },
  monkey: { 
    baseScale: 0.1, 
    min: 0.02, 
    max: 0.3, 
    step: 0.01,
    basePosition: { x: -45*1000, y: -5, z: 0 },
    baseRotation: { x: -Math.PI/2, y: 0, z: 0 }
  },
  pig: { 
    baseScale: 2, 
    min: 2, 
    max: 6.5, 
    step: 0.5,
    basePosition: { x: 25*1000, y: -5, z: 0 },
    baseRotation: { x: -Math.PI/2, y: 0, z: 0 }
  },
  spider: { 
    baseScale: 0.05, 
    min: 0.01, 
    max: 0.2, 
    step: 0.005,
    basePosition: { x: -75*1000, y: -7, z: -5 }
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
          child.material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
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

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

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
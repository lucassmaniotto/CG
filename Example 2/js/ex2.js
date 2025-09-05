import * as THREE from "three";

let camera, scene, renderer;

let objects = [];

let speedX = 0.1;
let speedY = 0.1;

const borderLimitX = 12;
const borderLimitY = 6;

const createCube = () => {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  let cube = new THREE.Mesh(geometry, material);
  objects["cube1"] = cube;
  scene.add(cube);
};

const createTetrahedron = () => {
  const geometry = new THREE.TetrahedronGeometry(1.5);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  let tetrahedron = new THREE.Mesh(geometry, material);
  objects["tetrahedron1"] = tetrahedron;
  scene.add(tetrahedron);
};

export function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  //cria o mundo
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  createCube();
  createTetrahedron();

  camera.position.z = 10;
  renderer.setAnimationLoop(animate);

  document.body.appendChild(renderer.domElement);

  renderer.render(scene, camera);

  window.addEventListener("resize", onWindowResize);
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
  objects["cube1"].position.x += speedX;
  objects["tetrahedron1"].position.x -= speedX;
  objects["cube1"].position.y += speedY;
  objects["tetrahedron1"].position.y -= speedY;

  objects["cube1"].rotation.x += 0.01;
  objects["cube1"].rotation.y += 0.01;
  objects["tetrahedron1"].rotation.y += 0.01;
  objects["tetrahedron1"].rotation.x += 0.01;

  if (
    objects["cube1"].position.y > borderLimitY ||
    objects["tetrahedron1"].position.y < -borderLimitY ||
    objects["cube1"].position.y < -borderLimitY ||
    objects["tetrahedron1"].position.y > borderLimitY
  ) {
    speedY = -speedY;
  }

  if (
    objects["cube1"].position.x > borderLimitX ||
    objects["tetrahedron1"].position.x < -borderLimitX ||
    objects["cube1"].position.x < -borderLimitX ||
    objects["tetrahedron1"].position.x > borderLimitX
  ) {
    speedX = -speedX;
  }

  renderer.render(scene, camera);
};

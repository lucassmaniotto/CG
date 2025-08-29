import * as THREE from "three";

let camera, scene, renderer;

let cube, tetrahedron, dodecahedron, cylinder;

const createCube = () => {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cube.position.y = 4.25;
};

const createTetrahedron = () => {
  const geometry = new THREE.TetrahedronGeometry(1.5); // radius
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  tetrahedron = new THREE.Mesh(geometry, material);
  scene.add(tetrahedron);
  tetrahedron.position.x = 4;
};


const createDodecahedron = () => {
  const geometry = new THREE.DodecahedronGeometry(1.5);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  dodecahedron = new THREE.Mesh(geometry, material);
  scene.add(dodecahedron);
  dodecahedron.position.x = 0;
};

const createCylinder = () => {
  const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
  cylinder = new THREE.Mesh(geometry, material);
  scene.add(cylinder);
  cylinder.position.x = -4;
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
  createDodecahedron();
  createCylinder();

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
  if (cube) {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
  if (tetrahedron) {
    tetrahedron.rotation.y += 0.01;
    tetrahedron.rotation.x += 0.01;
  }
  if (dodecahedron) {
    dodecahedron.rotation.y += 0.01;
    dodecahedron.rotation.x += 0.01;
  }
  if (cylinder) {
    cylinder.rotation.y += 0.01;
    cylinder.rotation.x += 0.01;
  }
  renderer.render(scene, camera);
};

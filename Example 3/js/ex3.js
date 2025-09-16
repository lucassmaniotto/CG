import * as THREE from 'three';

let camera, scene, renderer;

let  objects = [];

let velCubo = 0.001;

var criaSer = function(){
    // Materiais e geometrias
    const geometry = new THREE.BoxGeometry(2, 10, 2);
    const materials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }), // right
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // left
        new THREE.MeshBasicMaterial({ color: 0x0000ff }), // top
        new THREE.MeshBasicMaterial({ color: 0xffff00 }), // bottom
        new THREE.MeshBasicMaterial({ color: 0x00ffff }), // front
        new THREE.MeshBasicMaterial({ color: 0xff00ff })  // back
    ];
    const material = materials;

    // Tronco (fixo) centralizado
    let tronco = new THREE.Mesh(
        new THREE.BoxGeometry(4, 12, 3),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    tronco.position.set(0, 7, 0);
    scene.add(tronco);
    objects["tronco"] = tronco;


    // Pescoço (cilindro) entre tronco e cabeça
    let pescoco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 2, 32),
        new THREE.MeshBasicMaterial({ color: 0xffeecc })
    );
    pescoco.position.set(0, 6.2, 0);
    tronco.add(pescoco);
    objects["pescoco"] = pescoco;

    // Cabeça (fixa) alinhada ao pescoço
    let cabeca = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffeecc })
    );
    cabeca.position.set(0, 1.8, 0);
    pescoco.add(cabeca);
    objects["cabeca"] = cabeca;

    // Braço esquerdo
    let bracoEsq = new THREE.Mesh(geometry, material);
    let ombroEsq = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    objects["ombroEsq"] = ombroEsq;
    ombroEsq.position.set(-3, 5, 0);
    tronco.add(ombroEsq);
    let pivoOmbroEsq = new THREE.Group();
    ombroEsq.add(pivoOmbroEsq);
    pivoOmbroEsq.add(bracoEsq);
    objects["pivoOmbroEsq"] = pivoOmbroEsq;
    objects["bracoEsq"] = bracoEsq;
    bracoEsq.position.y -= 5;
    let cotoveloEsq = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    objects["cotoveloEsq"] = cotoveloEsq;
    cotoveloEsq.position.y -= 4.5;
    bracoEsq.add(cotoveloEsq);
    let pivoCotoveloEsq = new THREE.Group();
    cotoveloEsq.add(pivoCotoveloEsq);
    let antebracoEsq = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), material);
    pivoCotoveloEsq.add(antebracoEsq);
    antebracoEsq.position.y -= 4;
    objects["pivoCotoveloEsq"] = pivoCotoveloEsq;
    objects["antebracoEsq"] = antebracoEsq;

    // Braço direito
    let bracoDir = new THREE.Mesh(geometry, material);
    let ombroDir = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    objects["ombroDir"] = ombroDir;
    ombroDir.position.set(3, 5, 0);
    tronco.add(ombroDir);
    let pivoOmbroDir = new THREE.Group();
    ombroDir.add(pivoOmbroDir);
    pivoOmbroDir.add(bracoDir);
    objects["pivoOmbroDir"] = pivoOmbroDir;
    objects["bracoDir"] = bracoDir;
    bracoDir.position.y -= 5;
    let cotoveloDir = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    objects["cotoveloDir"] = cotoveloDir;
    cotoveloDir.position.y -= 4.5;
    bracoDir.add(cotoveloDir);
    let pivoCotoveloDir = new THREE.Group();
    cotoveloDir.add(pivoCotoveloDir);
    let antebracoDir = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), material);
    pivoCotoveloDir.add(antebracoDir);
    antebracoDir.position.y -= 5;
    objects["pivoCotoveloDir"] = pivoCotoveloDir;
    objects["antebracoDir"] = antebracoDir;

    // Perna esquerda
    let sphereBaciaEsq = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    objects["baciaEsq"] = sphereBaciaEsq;
    sphereBaciaEsq.position.set(-1, -7, 0);
    tronco.add(sphereBaciaEsq);
    let pivoBaciaEsq = new THREE.Group();
    sphereBaciaEsq.add(pivoBaciaEsq);
    let coxaEsq = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), material);
    pivoBaciaEsq.add(coxaEsq);
    objects["pivoBaciaEsq"] = pivoBaciaEsq;
    objects["coxaEsq"] = coxaEsq;
    coxaEsq.position.y -= 5;
    let sphereJoelhoEsq = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    objects["joelhoEsq"] = sphereJoelhoEsq;
    sphereJoelhoEsq.position.y = -5;
    coxaEsq.add(sphereJoelhoEsq);
    let pivoJoelhoEsq = new THREE.Group();
    sphereJoelhoEsq.add(pivoJoelhoEsq);
    objects["pivoJoelhoEsq"] = pivoJoelhoEsq;
    let canelaEsq = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), material);
    pivoJoelhoEsq.add(canelaEsq);
    objects["canelaEsq"] = canelaEsq;

    // Perna direita
    let sphereBaciaDir = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    objects["baciaDir"] = sphereBaciaDir;
    sphereBaciaDir.position.set(1, -7, 0);
    tronco.add(sphereBaciaDir);
    let pivoBaciaDir = new THREE.Group();
    sphereBaciaDir.add(pivoBaciaDir);
    let coxaDir = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), material);
    pivoBaciaDir.add(coxaDir);
    objects["pivoBaciaDir"] = pivoBaciaDir;
    objects["coxaDir"] = coxaDir;
    coxaDir.position.y -= 5;
    let sphereJoelhoDir = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    objects["joelhoDir"] = sphereJoelhoDir;
    sphereJoelhoDir.position.y = -5;
    coxaDir.add(sphereJoelhoDir);
    let pivoJoelhoDir = new THREE.Group();
    sphereJoelhoDir.add(pivoJoelhoDir);
    objects["pivoJoelhoDir"] = pivoJoelhoDir;
    let canelaDir = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), material);
    pivoJoelhoDir.add(canelaDir);
    objects["canelaDir"] = canelaDir;
    
}

export function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
    
    //cria o mundo
    scene = new THREE.Scene();
    
    renderer = new THREE.WebGLRenderer( );
    renderer.setSize( window.innerWidth, window.innerHeight );

    criaSer();

    camera.position.z = 40;

    renderer.setAnimationLoop( nossaAnimacao );
    
    document.body.appendChild( renderer.domElement );

    renderer.render( scene, camera );

    document.addEventListener('keydown', onKeyDown);

    window.addEventListener( 'resize', onWindowResize );

}

var velOmbro = 0.01;

var onKeyDown = function (e){
    console.log(e.keyCode);

    if (e.keyCode == 187){ // +
        objects["ombroEsq"].scale.x+= 0.01;
        objects["ombroEsq"].scale.y+= 0.01;
        objects["ombroEsq"].scale.z+= 0.01;
    }

    if (e.keyCode == 189){ //-
        objects["bracoEsq"].scale.x-= 0.01;
        objects["bracoEsq"].scale.y-= 0.01;
        objects["bracoEsq"].scale.z-= 0.01;
    }

    if (e.keyCode == 82){ //R
         objects["pivoOmbroEsq"].rotation.x-= velOmbro;
         console.log(objects["pivoOmbroEsq"].rotation.x);
         if (objects["pivoOmbroEsq"].rotation.x < -1.62 || objects["pivoOmbroEsq"].rotation.x > 0.9)
            velOmbro*=-1;

    }
    if (e.keyCode == 32) // space
            velCubo = velCubo == 0 ? 0.001 : 0;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

var nossaAnimacao = function () {
    // Posição das canelas
    if (objects["canelaEsq"] && objects["pivoBaciaEsq"]) {
        // -5 é a posição base, 2 é a amplitude
        objects["canelaEsq"].position.y = -5 - objects["pivoBaciaEsq"].rotation.x * 2;
    }
    if (objects["canelaDir"] && objects["pivoBaciaDir"]) {
        objects["canelaDir"].position.y = -5 - objects["pivoBaciaDir"].rotation.x * 2;
    }
    // Posição das canelas: oposta à rotação dos antebraços
    if (objects["canelaEsq"] && objects["antebracoEsq"]) {
        // O valor -5 é a posição base, 2 é a amplitude
        objects["canelaEsq"].position.y = -objects["antebracoEsq"].rotation.x * 2 - 5;
    }
    if (objects["canelaDir"] && objects["antebracoDir"]) {
        objects["canelaDir"].position.y = -objects["antebracoDir"].rotation.x * 2 - 5;
    }
    // Parâmetro de oscilação
    const t = performance.now() * 0.002;
    const amplitudeCoxa = 0.7;
    const amplitudeBraco = 0.7;

    // Coxas
    if (objects["pivoBaciaEsq"]) {
        objects["pivoBaciaEsq"].rotation.x = Math.sin(t) * amplitudeCoxa;
    }
    if (objects["pivoBaciaDir"]) {
        objects["pivoBaciaDir"].rotation.x = -Math.sin(t) * amplitudeCoxa;
    }


    // Braços
    // Ombro esquerdo
    let angOmbroEsq = -Math.sin(t) * amplitudeBraco;
    if (objects["pivoOmbroEsq"]) {
        objects["pivoOmbroEsq"].rotation.x = angOmbroEsq;
    }
    // Ombro direito
    let angOmbroDir = Math.sin(t) * amplitudeBraco;
    if (objects["pivoOmbroDir"]) {
        objects["pivoOmbroDir"].rotation.x = angOmbroDir;
    }

    // Cotovelo esquerdo
    if (objects["pivoCotoveloEsq"]) {
        // Valor base de flexão (nunca totalmente reto)
        let base = 0.4;
        // Flexiona mais quando o braço está para trás
        let flex = base + 0.7 * Math.max(0, -angOmbroEsq/amplitudeBraco);
        // Limita o movimento para não ultrapassar o natural
        objects["pivoCotoveloEsq"].rotation.x = flex;
    }
    // Cotovelo direito
    if (objects["pivoCotoveloDir"]) {
        let base = 0.4;
        let flex = base + 0.7 * Math.max(0, angOmbroDir/amplitudeBraco);
        objects["pivoCotoveloDir"].rotation.x = flex;
    }

    // Coxas (movimento alternado)
    if (objects["pivoBaciaEsq"]) {
        objects["pivoBaciaEsq"].rotation.x = Math.sin(t) * amplitudeCoxa;
    }
    if (objects["pivoBaciaDir"]) {
        objects["pivoBaciaDir"].rotation.x = -Math.sin(t) * amplitudeCoxa;
    }

    // Joelhos
    if (objects["pivoJoelhoEsq"] && objects["pivoBaciaEsq"]) {
        let base = -0.4;
        let angCoxaEsq = objects["pivoBaciaEsq"].rotation.x;
        let flexEsq = base + -0.5 * Math.max(0, angCoxaEsq/amplitudeCoxa);
        objects["pivoJoelhoEsq"].rotation.x = flexEsq;
    }
    if (objects["pivoJoelhoDir"] && objects["pivoBaciaDir"]) {
        let base = -0.4;
        let angCoxaDir = objects["pivoBaciaDir"].rotation.x;
        let flexDir = base + -0.5 * Math.max(0, angCoxaDir/amplitudeCoxa);
        objects["pivoJoelhoDir"].rotation.x = flexDir;
    }

    // Rotaciona o corpo inteiro 360 graus a cada segundo
    if (objects["tronco"])
        objects["tronco"].rotation.y += 0.025;

    renderer.render(scene, camera);
}

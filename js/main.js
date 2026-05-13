import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { MindARThree } from 'mindar-image-three';

// ══════════════════════════════════════════════
//  CONFIGURACIÓN DE TARGETS
//  Agrega tantos objetos como targets tengas en tu .mind
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  CONFIGURACIÓN DE TARGETS
// ══════════════════════════════════════════════
const CONFIG = [
  {
    id: 'Casa del almirante',
    fecha: '2004',
    ubicacion: 'Carmen De Bolivar',
    dato: 'Población y fuerza publica, apoyo significativo al pueblo',
    modelo: 'CasaDeAlmirante.glb',
  },
  {
    id: 'Mujeres de Montes De María',
    fecha: '2000',
    ubicacion: 'Mampujan y San Jacinto',
    dato: 'Los tejidos fueron un elementos clave como herramienta para la paz',
    modelo: 'Telar.glb',
  },
  {
    id: 'Cerro de la cansona',
    fecha: '1994', 
    ubicacion: 'Carmen de Bolivar',
    dato: 'Una emboscada en la zona cercana al cerro, marcada por la violencia que azoto la región',
    modelo: 'Caidos.glb',
  },
  {
    id: 'Apoyo Armada',
    fecha: '1997-2005',
    ubicacion: 'Carmen de Bolivar',
    dato: 'Representa el agradecimiento, respeto y admiración a las fuerzas por su apoyo',
    modelo: 'Caidos.glb',
  },

];

// ══════════════════════════════════════════════
//  REFERENCIAS DOM
// ══════════════════════════════════════════════
const splashEl   = document.getElementById('splash');
const hudEl      = document.getElementById('hud');
const startBtn   = document.getElementById('startButton');
const stopBtn    = document.getElementById('stopButton');
const hudStopBtn = document.getElementById('hudStopButton');

const hudCard      = document.getElementById('target-card');
const hudHint      = document.getElementById('hudHint');
const hudId        = document.getElementById('hud-id');
const hudFecha     = document.getElementById('hud-fecha');
const hudUbicacion = document.getElementById('hud-ubicacion');
const hudDato      = document.getElementById('hud-dato');

// ══════════════════════════════════════════════
//  HUD — actualizar info de un target
// ══════════════════════════════════════════════
function showTargetInfo(cfg) {
  hudId.textContent        = cfg.id;
  hudFecha.textContent     = cfg.fecha;
  hudUbicacion.textContent = cfg.ubicacion;
  hudDato.textContent      = cfg.dato;

  hudCard.classList.add('visible');
  hudHint.classList.add('hidden');
}

function hideTargetInfo() {
  hudCard.classList.remove('visible');
  hudHint.classList.remove('hidden');
}
// ══════════════════════════════════════════════
//  SETUP MINDAR
// ══════════════════════════════════════════════
const mindarThree = new MindARThree({
  container: document.querySelector('#container'),
  imageTargetSrc: './target/targets_Armada.mind',
  maxTrack: CONFIG.length,
});

const { renderer, scene, camera } = mindarThree;

const cubes = [];
let activeTargets = 0;

CONFIG.forEach((cfg, index) => {
  const anchor = mindarThree.addAnchor(index);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: cfg.color })
  );

   // Modelo GLB
      const loader = new GLTFLoader();
      let mixer;
      var linkModel = './assets/3d/Armada/' + cfg.modelo;
      loader.load(linkModel , (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.2, 0.2, 0.2);
        model.position.set(0, 0, 0);
        anchor.group.add(model);

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
      });

  cube.visible = false;
  //anchor.group.add(cube);
  cubes.push(cube);

  anchor.onTargetFound = () => {
    cube.visible = true;
    activeTargets++;
    showTargetInfo(cfg);
    console.log(`Target ${index} detectado →`, cfg.tag);
  };

  anchor.onTargetLost = () => {
    cube.visible = false;
    activeTargets--;
    if (activeTargets <= 0) {
      activeTargets = 0;
      hideTargetInfo();
    }
    console.log(`Target ${index} perdido`);
  };
});

// Iluminación
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(light);

// ══════════════════════════════════════════════
//  START / STOP
// ══════════════════════════════════════════════
const startAR = async () => {
  // Ocultar splash, mostrar HUD
  splashEl.classList.add('hidden');
  hudEl.classList.add('active');

  await mindarThree.start();

  renderer.setAnimationLoop(() => {
    cubes.forEach((cube) => {
      if (cube.visible) cube.rotation.y += 0.02;
    });
    renderer.render(scene, camera);
  });
};

const stopAR = () => {
  mindarThree.stop();
  renderer.setAnimationLoop(null);

  hudEl.classList.remove('active');
  hideTargetInfo();
  splashEl.classList.remove('hidden');
  activeTargets = 0;
};

startBtn.addEventListener('click', startAR);
stopBtn.addEventListener('click', stopAR);
hudStopBtn.addEventListener('click', stopAR);
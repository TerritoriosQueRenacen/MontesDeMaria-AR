import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'mindar-image-three';


// ══════════════════════════════════════════════
const CONFIG = [
  {
    id: 'Casa del almirante',
    fecha: '2004',
    ubicacion: 'Carmen De Bolivar',
    dato: 'Población y fuerza publica',
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
    fecha: 'Contiene mirador La Ceiba',
    ubicacion: 'Carmen de Bolivar',
    dato: 'A casi 600 metros sobre el mar',
    modelo: 'Mapa.glb',
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
const modelosCargados = []; // Aquí guardamos las referencias de los GLTF para poder rotarlos
let activeTargets = 0;

CONFIG.forEach((cfg, index) => {
  const anchor = mindarThree.addAnchor(index);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );

  // Carga del Modelo GLB
  const loader = new GLTFLoader();
  let mixer;
  
  if (cfg.modelo) {
    var linkModel = './assets/3d/Armada/' + cfg.modelo;
    loader.load(linkModel, (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.2, 0.2, 0.2);
      model.position.set(0, 0, 0);
      anchor.group.add(model);

      modelosCargados.push(model); // Guardamos la referencia para el touch

      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
      }
    });
  }

  cube.visible = false;
  //anchor.group.add(cube);
  cubes.push(cube);

  anchor.onTargetFound = () => {
    cube.visible = true;
    activeTargets++;
    showTargetInfo(cfg);
    console.log(`Target ${index} detectado →`, cfg.id);
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
  splashEl.classList.add('hidden');
  hudEl.classList.add('active');

  await mindarThree.start();

  renderer.setAnimationLoop(() => {
    // Si usas el mixer de animaciones, debes actualizarlo aquí.
    // La rotación automática la hemos quitado para que no pelee con el control manual.
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

// ══════════════════════════════════════════════
//  CONTROLES TÁCTILES / MOUSE PARA ROTACIÓN
// ══════════════════════════════════════════════
let isDragging = false;
let previousPosition = { x: 0, y: 0 };
const interaccionArea = document.getElementById('container'); 

const onPointerDown = (e) => {
  isDragging = true;
  previousPosition.x = e.touches ? e.touches[0].clientX : e.clientX;
  previousPosition.y = e.touches ? e.touches[0].clientY : e.clientY;
};

const onPointerMove = (e) => {
  if (!isDragging) return;

  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;

  const deltaX = currentX - previousPosition.x;
  const deltaY = currentY - previousPosition.y;

  const rotationSpeed = 0.01; 

  modelosCargados.forEach((modelo) => {
    // Rotamos solo si el ancla del modelo está visible
    if (modelo.parent && modelo.parent.visible) {
      modelo.rotation.y += deltaX * rotationSpeed; 
      modelo.rotation.x += deltaY * rotationSpeed; 
    }
  });

  previousPosition = { x: currentX, y: currentY };
};

const onPointerUp = () => {
  isDragging = false;
};

// Listeners Touch
interaccionArea.addEventListener('touchstart', onPointerDown, { passive: true });
interaccionArea.addEventListener('touchmove', onPointerMove, { passive: true });
interaccionArea.addEventListener('touchend', onPointerUp);
interaccionArea.addEventListener('touchcancel', onPointerUp);

// Listeners Mouse
interaccionArea.addEventListener('mousedown', onPointerDown);
interaccionArea.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
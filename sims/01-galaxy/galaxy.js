// 3D Particle Galaxy Generator Simulation (Complete, Volumetric, Stable & Highly Interactive)

let scene, camera, renderer, postfx, ui;
let galaxyGeometry, galaxyPoints;

// Support up to 8 distinct stellar species, each with unique physical parameters
let speciesList = [
  { name: 'Alpha Dwarf',   active: false, count: 10000, color: '#ffffff', size: 0.45, speed: 0.004, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.4, glow: 0.8,  trail: 0.2,  tightness: 1.0, blobs: 12, blobSpread: 0.7 },
  { name: 'Beta Giant',    active: true,  count: 10000, color: '#ffcc00', size: 0.55, speed: 0.003, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.15,glow: 1.8,  trail: 0.8,  tightness: 1.4, blobs: 14, blobSpread: 0.6 },
  { name: 'Gamma Pulsar',  active: false, count: 10000, color: '#00ccff', size: 0.50, speed: 0.005, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.7, glow: 1.2,  trail: 0.4,  tightness: 0.8, blobs: 10, blobSpread: 0.5 },
  { name: 'Delta Nebula',  active: false, count: 10000, color: '#ff6600', size: 0.60, speed: 0.002, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.3, glow: 0.9,  trail: 0.5,  tightness: 1.2, blobs: 15, blobSpread: 0.8 },
  { name: 'Epsilon Void',  active: true,  count: 10000, color: '#33cc33', size: 0.45, speed: 0.004, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.5, glow: 0.6,  trail: 0.3,  tightness: 1.1, blobs: 13, blobSpread: 0.65 },
  { name: 'Zeta Flare',    active: false, count: 10000, color: '#cc33ff', size: 0.50, speed: 0.003, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.2, glow: 1.4,  trail: 0.6,  tightness: 1.3, blobs: 11, blobSpread: 0.9 },
  { name: 'Eta Magnetar',  active: true,  count: 10000, color: '#0055ff', size: 0.65, speed: 0.006, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.8, glow: 2.0,  trail: 0.2,  tightness: 0.7, blobs: 16, blobSpread: 0.5 },
  { name: 'Theta Quasar',  active: true,  count: 10000, color: '#ff3333', size: 0.70, speed: 0.002, separation: 0.0,  alignment: 0.0, cohesion: 0.0, agility: 0.1, glow: 2.5,  trail: 0.9,  tightness: 1.5, blobs: 12, blobSpread: 1.0 }
];

// 8x8 Pairwise Attraction/Repulsion Matrix coefficients (initially neutral)
let attractionMatrix = [
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
  [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

let config = {
  particleCount: 75000,
  armCount: 0.0,
  tightness: 1.2,
  rotationSpeed: 0.25,
  mouseAttractStrength: 1.2,
  interactionRadius: 4.0,
  turbulence: 0.0,
  cameraMode: 'Interactive Orbit'
};

let targets = {
  armCount: 0.0,
  tightness: 1.2,
  rotationSpeed: 0.25,
  coreBrightness: 2.0,
  particleSize: 0.05,
  interactionRadius: 4.0,
  turbulence: 0.0
};

let radii, birthRadii, thetas, speeds, heights, positions, colorSeeds, noiseSeeds, speciesIds, alignFactors, separateFactors, cohereFactors;
let spSizes, spSpeeds, spTightnesses, spGlows, spTrails;
// Per-particle blob ID, species ID of that blob, and local 3D Cartesian offset from blob center
let blobIds, blobSpeciesIds, localDeltaX, localDeltaY, localDeltaZ;
// Per-species blob centers: blobCenters[spIdx] = array of {x, y, z, vx, vy, vz, nominalR}
let blobCenters = [];
let zeroForcesMode = true;

function randomOnSphere(radius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

function initBlobCenters() {
  blobCenters = [];
  for (let s = 0; s < 8; s++) {
    const sp = speciesList[s];
    const baseR = 1.5 + s * 1.4;
    const blobs = [];
    const n = sp.blobs || 3;
    for (let b = 0; b < n; b++) {
      const r = baseR + (Math.random() - 0.5) * 0.8;
      const pos = randomOnSphere(r);
      
      // Find a random orthogonal vector for velocity
      const temp = { x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 };
      const ax = pos.y * temp.z - pos.z * temp.y;
      const ay = pos.z * temp.x - pos.x * temp.z;
      const az = pos.x * temp.y - pos.y * temp.x;
      const lenA = Math.sqrt(ax*ax + ay*ay + az*az) || 1.0;
      
      const vxDir = (ay * pos.z - az * pos.y) / lenA;
      const vyDir = (az * pos.x - ax * pos.z) / lenA;
      const vzDir = (ax * pos.y - ay * pos.x) / lenA;
      const lenV = Math.sqrt(vxDir*vxDir + vyDir*vyDir + vzDir*vzDir) || 1.0;
      
      const speed = sp.speed * 45.0 / (Math.sqrt(r) + 0.2);
      
      blobs.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: (vxDir / lenV) * speed,
        vy: (vyDir / lenV) * speed,
        vz: (vzDir / lenV) * speed,
        nominalR: r
      });
    }
    blobCenters.push(blobs);
  }
}

function randomizeBlobCenters() {
  for (let s = 0; s < 8; s++) {
    const sp = speciesList[s];
    sp.blobs = 2 + Math.floor(Math.random() * 4);
    sp.blobSpread = 0.3 + Math.random() * 1.0;
    const baseR = 1.5 + Math.random() * 9.0;
    blobCenters[s] = [];
    for (let b = 0; b < sp.blobs; b++) {
      const r = baseR + (Math.random() - 0.5) * 1.5;
      const pos = randomOnSphere(r);
      
      // Find a random orthogonal vector for velocity
      const temp = { x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 };
      const ax = pos.y * temp.z - pos.z * temp.y;
      const ay = pos.z * temp.x - pos.x * temp.z;
      const az = pos.x * temp.y - pos.y * temp.x;
      const lenA = Math.sqrt(ax*ax + ay*ay + az*az) || 1.0;
      
      const vxDir = (ay * pos.z - az * pos.y) / lenA;
      const vyDir = (az * pos.x - ax * pos.z) / lenA;
      const vzDir = (ax * pos.y - ay * pos.x) / lenA;
      const lenV = Math.sqrt(vxDir*vxDir + vyDir*vyDir + vzDir*vzDir) || 1.0;
      
      const speed = sp.speed * 45.0 / (Math.sqrt(r) + 0.2);
      
      blobCenters[s].push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: (vxDir / lenV) * speed,
        vy: (vyDir / lenV) * speed,
        vz: (vzDir / lenV) * speed,
        nominalR: r
      });
    }
  }
}

function randomizeAttractionMatrix() {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (i === j) {
        attractionMatrix[i][j] = Math.round((Math.random() * 1.4 - 0.2) * 10) / 10;
      } else {
        attractionMatrix[i][j] = Math.round((Math.random() * 2.0 - 1.0) * 10) / 10;
      }
    }
  }
}

function randomizeSwarmParameters() {
  speciesList.forEach((sp) => {
    sp.speed = Math.round((Math.random() * 0.008 + 0.001) * 1000) / 1000;
    sp.size  = Math.round((Math.random() * 0.8 + 0.45) * 100) / 100;
    sp.glow  = Math.round((Math.random() * 1.6 + 0.3) * 10) / 10;
    sp.separation = Math.round((Math.random() * 1.5 + 0.2) * 100) / 100;
    sp.cohesion   = Math.round((Math.random() * 1.5 + 0.3) * 100) / 100;
  });
}

// Minimalist Shaders
const vertexShader = `
  uniform float uTime;
  uniform float uRotationSpeed;
  uniform float uTightness;
  uniform float uArmCount;
  uniform float uSize;
  uniform float uTurbulence;
  
  attribute float radius;
  attribute float theta;
  attribute float speed;
  attribute float height;
  attribute float noiseSeed;
  attribute float speciesId;
  attribute vec3 colorSeed;
  
  attribute float aSpeciesSize;
  attribute float aSpeciesSpeed;
  attribute float aSpeciesTightness;
  attribute float aSpeciesGlow;
  attribute float aSpeciesTrail;
  
  varying vec3 vColor;
  varying float vGlow;
  
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  
  void main() {
    float spSize = aSpeciesSize;
    vGlow = aSpeciesGlow;
    
    vec3 localPos = position;
    vec4 mvPosition = modelViewMatrix * vec4(localPos, 1.0);
    
    if (spSize <= 0.0) {
      // Hardware clip: project completely out of bounds to bypass rasterization entirely
      gl_Position = vec4(9999.0, 9999.0, 9999.0, 1.0);
      gl_PointSize = 0.0;
    } else {
      gl_Position = projectionMatrix * mvPosition;
      // Delicate, soft circular clouds of beautiful sizes (clamped perfectly between 2.0 and 64.0)
      gl_PointSize = clamp(spSize * 1.4 * (350.0 / max(-mvPosition.z, 0.001)), 2.0, 64.0);
    }
    
    vColor = colorSeed;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vGlow;
  
  void main() {
    // Completely discard inactive/padding fragments instantly to guarantee zero glow
    if (vGlow <= 0.0) discard;
    
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.49) discard;
    
    float mask = smoothstep(0.5, 0.0, dist);
    // Delicate, translucent glow (pow 2.0 and highly scaled vGlow offset) to prevent over-saturation
    float alpha = pow(mask, 2.0) * (vGlow * 0.12 + 0.03);
    
    gl_FragColor = vec4(vColor, clamp(alpha, 0.0, 1.0));
  }
`;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let intersectionPoint = new THREE.Vector3();
let isPointerActive = false;

// Orbit controls parameters
let camTheta = 0.0;
let camPhi = 0.4;
let camRadius = 20.0;

let isDraggingCamera = false;
let previousPointerPos = { x: 0, y: 0 };

function randomizeAttractionMatrix() {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (i === j) {
        // Diagonal: self attraction/repulsion
        attractionMatrix[i][j] = Math.round((Math.random() * 1.6 - 0.8) * 10) / 10;
      } else {
        // Off-diagonal: inter-species
        attractionMatrix[i][j] = Math.round((Math.random() * 2.4 - 1.2) * 10) / 10;
      }
    }
  }
}

function randomizeSwarmParameters() {
  speciesList.forEach((sp) => {
    sp.separation = Math.round((Math.random() * 2.5 + 0.1) * 100) / 100; 
    sp.alignment = Math.round((Math.random() * 1.8 + 0.1) * 100) / 100;  
    sp.cohesion = Math.round((Math.random() * 1.8 + 0.1) * 100) / 100;   
    sp.speed = Math.round((Math.random() * 0.014 + 0.001) * 1000) / 1000;     
    sp.size = Math.round((Math.random() * 0.8 + 0.45) * 100) / 100;   
    sp.glow = Math.round((Math.random() * 2.8 + 0.4) * 10) / 10;        
  });
}

function init() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0c0e');
  scene.fog = new THREE.FogExp2('#0b0c0e', 0.015);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  updateCameraCoords();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  postfx = new PostFX(renderer, scene, camera);
  if (postfx.bloomPass) {
    postfx.bloomPass.strength = 0.45; 
    postfx.bloomPass.radius = 0.3;
    postfx.bloomPass.threshold = 0.25;
  }

  buildGalaxy();
  setupUI();

  window.addEventListener('resize', onWindowResize);
  
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) onPointerDown(e.touches[0]);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) onPointerMove(e.touches[0]);
  }, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  window.addEventListener('wheel', onWindowWheel, { passive: true });

  animate();
}

function updateCameraCoords() {
  camPhi = Math.max(-Math.PI / 3.0, Math.min(Math.PI / 2.0 - 0.05, camPhi));
  camRadius = Math.max(5.0, Math.min(60.0, camRadius));

  camera.position.x = camRadius * Math.sin(camTheta) * Math.cos(camPhi);
  camera.position.y = camRadius * Math.sin(camPhi);
  camera.position.z = camRadius * Math.cos(camTheta) * Math.cos(camPhi);
  camera.lookAt(0, 0, 0);
}

function buildGalaxy() {
  if (galaxyPoints) scene.remove(galaxyPoints);

  galaxyGeometry = new THREE.BufferGeometry();
  
  positions = new Float32Array(config.particleCount * 3);
  radii = new Float32Array(config.particleCount);
  birthRadii = new Float32Array(config.particleCount);
  thetas = new Float32Array(config.particleCount);
  speeds = new Float32Array(config.particleCount);
  heights = new Float32Array(config.particleCount);
  noiseSeeds = new Float32Array(config.particleCount);
  speciesIds = new Float32Array(config.particleCount);
  colorSeeds = new Float32Array(config.particleCount * 3);

  alignFactors = new Float32Array(config.particleCount);
  separateFactors = new Float32Array(config.particleCount);
  cohereFactors = new Float32Array(config.particleCount);

  spSizes = new Float32Array(config.particleCount);
  spSpeeds = new Float32Array(config.particleCount);
  spTightnesses = new Float32Array(config.particleCount);
  spGlows = new Float32Array(config.particleCount);
  spTrails = new Float32Array(config.particleCount);

  // Blob-center per-particle tracking arrays
  blobIds = new Int32Array(config.particleCount);
  blobSpeciesIds = new Int32Array(config.particleCount);
  localDeltaX = new Float32Array(config.particleCount);
  localDeltaY = new Float32Array(config.particleCount);
  localDeltaZ = new Float32Array(config.particleCount);

  // Initialise blob centers before generating particle data
  initBlobCenters();
  generateParticleData();

  galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  galaxyGeometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1));
  galaxyGeometry.setAttribute('theta', new THREE.BufferAttribute(thetas, 1));
  galaxyGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
  galaxyGeometry.setAttribute('height', new THREE.BufferAttribute(heights, 1));
  galaxyGeometry.setAttribute('noiseSeed', new THREE.BufferAttribute(noiseSeeds, 1));
  galaxyGeometry.setAttribute('speciesId', new THREE.BufferAttribute(speciesIds, 1));
  galaxyGeometry.setAttribute('colorSeed', new THREE.BufferAttribute(colorSeeds, 3));

  galaxyGeometry.setAttribute('aSpeciesSize', new THREE.BufferAttribute(spSizes, 1));
  galaxyGeometry.setAttribute('aSpeciesSpeed', new THREE.BufferAttribute(spSpeeds, 1));
  galaxyGeometry.setAttribute('aSpeciesTightness', new THREE.BufferAttribute(spTightnesses, 1));
  galaxyGeometry.setAttribute('aSpeciesGlow', new THREE.BufferAttribute(spGlows, 1));
  galaxyGeometry.setAttribute('aSpeciesTrail', new THREE.BufferAttribute(spTrails, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0.0 },
      uRotationSpeed: { value: targets.rotationSpeed },
      uTightness: { value: targets.tightness },
      uArmCount: { value: targets.armCount },
      uSize: { value: targets.particleSize || 0.05 },
      uTurbulence: { value: targets.turbulence }
    }
  });

  galaxyPoints = new THREE.Points(galaxyGeometry, material);
  galaxyPoints.frustumCulled = false;
  scene.add(galaxyPoints);

  updateSpeciesUniforms();
}

function generateParticleData() {
  const activeSpecies = speciesList.filter(s => s.active);
  if (activeSpecies.length === 0) return;

  let particleIndex = 0;

  activeSpecies.forEach((sp) => {
    const spIndex = speciesList.indexOf(sp);
    const spCount = Math.floor(config.particleCount * (sp.count / 80000));
    const spColor = new THREE.Color(sp.color);

    const myBlobs = blobCenters[spIndex] || [];
    if (myBlobs.length === 0) return;

    for (let j = 0; j < spCount && particleIndex < config.particleCount; j++) {
      // Assign particle strictly to its own species' blobs (no color mixing!)
      const blobIdx = Math.floor(Math.random() * myBlobs.length);
      const blob = myBlobs[blobIdx];
      const spread = sp.blobSpread || 0.7;

      // 3D Gaussian offset using Box-Muller transform
      const u1 = Math.random(), u2 = Math.random(), u3 = Math.random(), u4 = Math.random();
      const mag1 = spread * Math.sqrt(-2.0 * Math.log(u1 + 1e-9));
      const mag2 = spread * Math.sqrt(-2.0 * Math.log(u3 + 1e-9));
      
      const dx = mag1 * Math.cos(u2 * Math.PI * 2.0) * 0.45;
      const dy = mag1 * Math.sin(u2 * Math.PI * 2.0) * 0.45;
      const dz = mag2 * Math.cos(u4 * Math.PI * 2.0) * 0.45;

      const thetaVal = Math.random() * Math.PI * 2;
      const phiVal = Math.acos(Math.random() * 2 - 1);
      const rVal = Math.pow(Math.random(), 0.333) * 13.0;

      positions[particleIndex * 3]     = rVal * Math.sin(phiVal) * Math.cos(thetaVal);
      positions[particleIndex * 3 + 1] = rVal * Math.cos(phiVal);
      positions[particleIndex * 3 + 2] = rVal * Math.sin(phiVal) * Math.sin(thetaVal);

      radii[particleIndex] = 5.0;
      birthRadii[particleIndex] = 5.0;
      thetas[particleIndex] = 0.0;
      speeds[particleIndex] = 0.0;
      heights[particleIndex] = 0.0;
      noiseSeeds[particleIndex] = Math.random() * 1000.0;
      speciesIds[particleIndex] = spIndex;
      
      blobIds[particleIndex] = blobIdx;
      blobSpeciesIds[particleIndex] = spIndex;
      
      localDeltaX[particleIndex] = dx;
      localDeltaY[particleIndex] = dy;
      localDeltaZ[particleIndex] = dz;

      colorSeeds[particleIndex * 3]     = spColor.r;
      colorSeeds[particleIndex * 3 + 1] = spColor.g;
      colorSeeds[particleIndex * 3 + 2] = spColor.b;

      separateFactors[particleIndex] = sp.separation;
      alignFactors[particleIndex]    = sp.alignment;
      cohereFactors[particleIndex]   = sp.cohesion;

      spSizes[particleIndex]       = sp.size;
      spSpeeds[particleIndex]      = sp.speed;
      spTightnesses[particleIndex] = sp.tightness;
      spGlows[particleIndex]       = sp.glow;
      spTrails[particleIndex]      = sp.trail;

      particleIndex++;
    }
  });

  // Padding — hidden particles
  while (particleIndex < config.particleCount) {
    positions[particleIndex * 3]     = 9999.0;
    positions[particleIndex * 3 + 1] = 9999.0;
    positions[particleIndex * 3 + 2] = 9999.0;
    radii[particleIndex] = 5.0;
    birthRadii[particleIndex] = 5.0;
    thetas[particleIndex] = 0.0;
    speeds[particleIndex] = 0.0;
    heights[particleIndex] = 0.0;
    noiseSeeds[particleIndex] = Math.random() * 1000.0;
    speciesIds[particleIndex] = 8;
    blobIds[particleIndex] = 0;
    blobSpeciesIds[particleIndex] = 0;
    localDeltaX[particleIndex] = 0.0;
    localDeltaY[particleIndex] = 0.0;
    localDeltaZ[particleIndex] = 0.0;
    colorSeeds[particleIndex * 3] = colorSeeds[particleIndex * 3 + 1] = colorSeeds[particleIndex * 3 + 2] = 0.0;
    separateFactors[particleIndex] = alignFactors[particleIndex] = cohereFactors[particleIndex] = 0.0;
    spSizes[particleIndex] = spSpeeds[particleIndex] = spTightnesses[particleIndex] = spGlows[particleIndex] = spTrails[particleIndex] = 0.0;
    particleIndex++;
  }
}

function updateSpeciesUniforms() {
  if (!galaxyGeometry) return;
  
  for (let i = 0; i < config.particleCount; i++) {
    const spIdx = speciesIds[i];
    const sp = speciesList[spIdx];
    if (!sp) {
      // Ensure unrecognized/fallback species index remains hidden
      spSizes[i] = 0.0;
      spGlows[i] = 0.0;
      continue;
    }
    
    spSizes[i] = sp.active ? sp.size : 0.0;
    spSpeeds[i] = sp.speed;
    spTightnesses[i] = sp.tightness;
    spGlows[i] = sp.active ? sp.glow : 0.0;
    spTrails[i] = sp.trail;
  }
  
  const sizeAttr = galaxyGeometry.getAttribute('aSpeciesSize');
  const speedAttr = galaxyGeometry.getAttribute('aSpeciesSpeed');
  const tightnessAttr = galaxyGeometry.getAttribute('aSpeciesTightness');
  const glowAttr = galaxyGeometry.getAttribute('aSpeciesGlow');
  const trailAttr = galaxyGeometry.getAttribute('aSpeciesTrail');

  if (sizeAttr) sizeAttr.needsUpdate = true;
  if (speedAttr) speedAttr.needsUpdate = true;
  if (tightnessAttr) tightnessAttr.needsUpdate = true;
  if (glowAttr) glowAttr.needsUpdate = true;
  if (trailAttr) trailAttr.needsUpdate = true;
}

function setupUI() {
  ui = new UIPanel('Galaxy Sandbox');

  ui.addSelect('cameraMode', 'Camera Control', ['Interactive Orbit', 'Cinematic'], config.cameraMode, (v) => {
    config.cameraMode = v;
  });

  ui.addSlider('particleCount', 'Total Population', 5000, 100000, config.particleCount, 5000, (v) => {
    config.particleCount = v;
    buildGalaxy();
  });



  // 1. Swarm Attribute Editor
  ui.addMatrixEditor(speciesList, (isToggle) => {
    const hasActiveSwarmForce = speciesList.some(sp => sp.active && (sp.separation > 0.0 || sp.alignment > 0.0 || sp.cohesion > 0.0));
    if (hasActiveSwarmForce) {
      zeroForcesMode = false;
    }

    if (isToggle) {
      buildGalaxy();
    } else {
      updateSpeciesUniforms();
    }
  });

  // 2. Pairwise Interaction Editor
  ui.addPairAttractionMatrix(speciesList, attractionMatrix, () => {
    const hasActivePairForce = attractionMatrix.some(row => row.some(val => Math.abs(val) > 0.04));
    if (hasActivePairForce) {
      zeroForcesMode = false;
    }
  });

  ui.addButton('Disrupt System (Randomize)', () => {
    zeroForcesMode = false;
    randomizeSwarmParameters(); // Randomize separation, alignment, cohesion, etc.
    generateParticleData();
    randomizeAttractionMatrix();
    ui.refreshSwarmMatrix(speciesList); // Update the matrix UI to show the randomized values!
    ui.refreshPairMatrix();
    galaxyGeometry.getAttribute('radius').needsUpdate = true;
    galaxyGeometry.getAttribute('theta').needsUpdate = true;
    galaxyGeometry.getAttribute('height').needsUpdate = true;
    galaxyGeometry.getAttribute('noiseSeed').needsUpdate = true;
    galaxyGeometry.getAttribute('colorSeed').needsUpdate = true;
  });

  ui.addButton('Reset to Zero Forces', () => {
    zeroForcesMode = true;
    // Set all attraction matrix coefficients to 0.0
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        attractionMatrix[i][j] = 0.0;
      }
    }
    // Set all species parameters to 0.0
    speciesList.forEach((sp) => {
      sp.separation = 0.0;
      sp.alignment = 0.0;
      sp.cohesion = 0.0;
    });
    // Refresh both matrix UIs dynamically!
    ui.refreshSwarmMatrix(speciesList);
    ui.refreshPairMatrix();
  });

  // Create beautiful glassmorphism floating button in the bottom left
  const randomBtn = document.createElement('button');
  randomBtn.id = 'bottom-left-random-btn';
  randomBtn.textContent = '🎲';
  
  // Style the button elegantly as a large circular dice button
  Object.assign(randomBtn.style, {
    position: 'fixed',
    bottom: '30px',
    left: '30px',
    background: 'rgba(15, 17, 20, 0.85)',
    backdropFilter: 'blur(12px)',
    webkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    cursor: 'pointer',
    zIndex: '10000',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
  });

  // Add subtle hover states (premium scale, bounce, and rotational skew)
  randomBtn.addEventListener('mouseenter', () => {
    randomBtn.style.background = 'rgba(255, 255, 255, 0.08)';
    randomBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    randomBtn.style.transform = 'translateY(-4px) scale(1.1) rotate(15deg)';
    randomBtn.style.boxShadow = '0 12px 35px rgba(255, 255, 255, 0.15)';
  });
  randomBtn.addEventListener('mouseleave', () => {
    randomBtn.style.background = 'rgba(15, 17, 20, 0.85)';
    randomBtn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    randomBtn.style.transform = 'translateY(0) scale(1.0) rotate(0deg)';
    randomBtn.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
  });

  // Action: Randomize both matrices and fully rebuild particle properties!
  randomBtn.addEventListener('click', () => {
    zeroForcesMode = false;
    randomizeSwarmParameters();
    randomizeAttractionMatrix();
    randomizeBlobCenters();   // Randomize blob count, radii, and spread for each species
    
    // Completely rebuild the galaxy using new active/inactive distributions
    buildGalaxy();
    
    // Refresh both matrix UIs dynamically!
    ui.refreshSwarmMatrix(speciesList);
    ui.refreshPairMatrix();
  });

  document.body.appendChild(randomBtn);
}

function onPointerDown(event) {
  // Safe DOM-based boundary protection: ignore clicks inside the UI panel or UI components
  if (event.target.closest && event.target.closest('.sim-ui-panel')) return;
  if (event.clientX < 150 && event.clientY < 80) return;

  previousPointerPos.x = event.clientX;
  previousPointerPos.y = event.clientY;

  isPointerActive = true;
  if (config.cameraMode === 'Interactive Orbit') {
    isDraggingCamera = true;
  }
}

function onPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, intersectionPoint);

  if (isDraggingCamera && config.cameraMode === 'Interactive Orbit') {
    const deltaX = event.clientX - previousPointerPos.x;
    const deltaY = event.clientY - previousPointerPos.y;

    camTheta -= deltaX * 0.007;
    camPhi += deltaY * 0.007;

    previousPointerPos.x = event.clientX;
    previousPointerPos.y = event.clientY;

    updateCameraCoords();
  }
}

function onPointerUp() {
  isPointerActive = false;
  isDraggingCamera = false;
}

function onWindowWheel(event) {
  if (config.cameraMode === 'Interactive Orbit') {
    camRadius += event.deltaY * 0.025;
    updateCameraCoords();
  }
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function updatePhysics(dt) {
  if (!galaxyPoints || !galaxyPoints.material) return;
  if (!positions || !blobCenters) return;

  const easeAmt = 0.02;
  config.tightness       = lerp(config.tightness,       targets.tightness,       easeAmt);
  config.rotationSpeed   = lerp(config.rotationSpeed,   targets.rotationSpeed,   easeAmt);
  config.interactionRadius = lerp(config.interactionRadius, targets.interactionRadius, easeAmt);

  galaxyPoints.material.uniforms.uTightness.value     = config.tightness;
  galaxyPoints.material.uniforms.uRotationSpeed.value = config.rotationSpeed;

  const attRadius = config.interactionRadius;
  const mouseForce = config.mouseAttractStrength * 0.8 * (attRadius * 0.2 + 1.0);
  const time = galaxyPoints.material.uniforms.uTime.value;

  // Collect all active blobs in a flat array for easy, hyper-efficient flocking calculations
  const allBlobs = [];
  for (let s = 0; s < 8; s++) {
    const sp = speciesList[s];
    if (!sp || !sp.active) continue;
    const blobs = blobCenters[s];
    if (!blobs) continue;
    for (let bi = 0; bi < blobs.length; bi++) {
      allBlobs.push({
        b: blobs[bi],
        species: s,
        spConfig: sp
      });
    }
  }

  // Update velocities of blob centers using flocking forces (separation, alignment, cohesion)
  // plus inter-species interaction matrix!
  for (let i = 0; i < allBlobs.length; i++) {
    const b1 = allBlobs[i].b;
    const s1 = allBlobs[i].species;
    const sp1 = allBlobs[i].spConfig;

    // Flocking force vectors
    let sepX = 0, sepY = 0, sepZ = 0;
    let alignX = 0, alignY = 0, alignZ = 0;
    let cohX = 0, cohY = 0, cohZ = 0;
    let sameCount = 0;

    // Inter-species force vectors
    let interX = 0, interY = 0, interZ = 0;
    let interCount = 0;

    const perceptionRadius = 4.0;

    for (let j = 0; j < allBlobs.length; j++) {
      if (i === j) continue;
      const b2 = allBlobs[j].b;
      const s2 = allBlobs[j].species;

      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dz = b2.z - b1.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.1;

      if (s1 === s2) {
        // Same species: standard boid flocking
        if (dist < perceptionRadius) {
          // Separation
          if (dist < perceptionRadius * 0.5) {
            sepX -= dx / (dist * dist);
            sepY -= dy / (dist * dist);
            sepZ -= dz / (dist * dist);
          }
          // Alignment
          alignX += b2.vx;
          alignY += b2.vy;
          alignZ += b2.vz;
          // Cohesion
          cohX += b2.x;
          cohY += b2.y;
          cohZ += b2.z;
          
          sameCount++;
        }
      } else {
        // Different species: interaction matrix
        if (dist < perceptionRadius * 2.0) {
          const weight = attractionMatrix[s1][s2];
          if (Math.abs(weight) > 0.04) {
            const forceMag = weight / (dist * 0.1 + 1.0);
            interX += (dx / dist) * forceMag;
            interY += (dy / dist) * forceMag;
            interZ += (dz / dist) * forceMag;
            interCount++;
          }
        }
      }
    }

    // Apply Same-Species flocking weights
    if (sameCount > 0) {
      sepX = (sepX / sameCount) * sp1.separation * 0.015;
      sepY = (sepY / sameCount) * sp1.separation * 0.015;
      sepZ = (sepZ / sameCount) * sp1.separation * 0.015;

      alignX = (alignX / sameCount - b1.vx) * sp1.alignment * 0.012;
      alignY = (alignY / sameCount - b1.vy) * sp1.alignment * 0.012;
      alignZ = (alignZ / sameCount - b1.vz) * sp1.alignment * 0.012;

      cohX = (cohX / sameCount - b1.x) * sp1.cohesion * 0.012;
      cohY = (cohY / sameCount - b1.y) * sp1.cohesion * 0.012;
      cohZ = (cohZ / sameCount - b1.z) * sp1.cohesion * 0.012;

      b1.vx += sepX + alignX + cohX;
      b1.vy += sepY + alignY + cohY;
      b1.vz += sepZ + alignZ + cohZ;
    }

    // Apply Inter-Species matrix forces with high steering sensitivity
    if (interCount > 0) {
      b1.vx += (interX / interCount) * 0.12;
      b1.vy += (interY / interCount) * 0.12;
      b1.vz += (interZ / interCount) * 0.12;
    }

    // Self diagonal attraction/repulsion (steers blobs of same species towards/away from each other)
    const selfCoeff = attractionMatrix[s1][s1];
    if (Math.abs(selfCoeff) > 0.04) {
      let selfX = 0, selfY = 0, selfZ = 0, selfCount = 0;
      const blobs = blobCenters[s1] || [];
      blobs.forEach((otherB) => {
        if (otherB === b1) return;
        const dx = otherB.x - b1.x;
        const dy = otherB.y - b1.y;
        const dz = otherB.z - b1.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.1;
        if (dist < 8.0) {
          const force = selfCoeff / (dist * 0.1 + 1.0);
          selfX += (dx / dist) * force;
          selfY += (dy / dist) * force;
          selfZ += (dz / dist) * force;
          selfCount++;
        }
      });
      if (selfCount > 0) {
        b1.vx += (selfX / selfCount) * 0.08;
        b1.vy += (selfY / selfCount) * 0.08;
        b1.vz += (selfZ / selfCount) * 0.08;
      }
    }

    // Damp and organically limit maximum speed to UI slider speed value
    b1.vx *= 0.96;
    b1.vy *= 0.96;
    b1.vz *= 0.96;

    const maxSpeed = sp1.speed * 50.0 + 0.05;
    const currentSpeed = Math.sqrt(b1.vx*b1.vx + b1.vy*b1.vy + b1.vz*b1.vz) || 0.0001;
    if (currentSpeed > maxSpeed) {
      b1.vx = (b1.vx / currentSpeed) * maxSpeed;
      b1.vy = (b1.vy / currentSpeed) * maxSpeed;
      b1.vz = (b1.vz / currentSpeed) * maxSpeed;
    }

    b1.x += b1.vx;
    b1.y += b1.vy;
    b1.z += b1.vz;

    // Bounds clamping
    const newD = Math.sqrt(b1.x*b1.x + b1.y*b1.y + b1.z*b1.z) || 1.0;
    if (newD < 0.8) {
      b1.x = (b1.x / newD) * 0.8; b1.y = (b1.y / newD) * 0.8; b1.z = (b1.z / newD) * 0.8;
    } else if (newD > 13.5) {
      b1.x = (b1.x / newD) * 13.5; b1.y = (b1.y / newD) * 13.5; b1.z = (b1.z / newD) * 13.5;
    }
  }

  // ── PHASE 2: Advance particles as elastic clouds around their blob center ─

  for (let i = 0; i < config.particleCount; i++) {
    const spIdx = speciesIds[i];
    const sp = speciesList[spIdx];
    if (!sp || !sp.active) continue;

    // Current position
    let px = positions[i * 3];
    let py = positions[i * 3 + 1];
    let pz = positions[i * 3 + 2];

    if (zeroForcesMode) {
      // Free isotropic drift based on noiseSeed
      const seed = noiseSeeds[i];
      const vx = Math.sin(seed) * 0.012;
      const vy = Math.cos(seed * 1.7) * 0.012;
      const vz = Math.sin(seed * 2.3) * 0.012;

      px += vx;
      py += vy;
      pz += vz;

      // Keep them perfectly bounded inside a sphere of radius 13.5
      const d = Math.sqrt(px*px + py*py + pz*pz) || 1.0;
      if (d > 13.5) {
        // Warp to opposite side of the sphere to maintain uniform density
        px = -(px / d) * 13.4;
        py = -(py / d) * 13.4;
        pz = -(pz / d) * 13.4;
      }
    } else {
      const bSpIdx = blobSpeciesIds[i];
      const blobs  = blobCenters[bSpIdx];
      if (!blobs || blobs.length === 0) continue;

      const bId   = blobIds[i];
      const blob  = blobs[Math.min(bId, blobs.length - 1)];
      const bSp   = speciesList[bSpIdx];
      const spread = (bSp ? bSp.blobSpread : 0.7);

      // NaN guard
      if (isNaN(px) || isNaN(py) || isNaN(pz)) {
        px = blob.x + localDeltaX[i];
        py = blob.y + localDeltaY[i];
        pz = blob.z + localDeltaZ[i];
      }

      // Target position is blob center + local Cartesian offset
      const tx = blob.x + localDeltaX[i];
      const ty = blob.y + localDeltaY[i];
      const tz = blob.z + localDeltaZ[i];

      const dx = tx - px;
      const dy = ty - py;
      const dz = tz - pz;

      const springStrength = 0.055 / (spread + 0.1);
      px += dx * springStrength;
      py += dy * springStrength;
      pz += dz * springStrength;

      // Slow organic breathing / boundary deformation noise
      const breatheX = Math.sin(noiseSeeds[i] * 0.01 + time * 0.35 + bId) * 0.008 * spread;
      const breatheY = Math.cos(noiseSeeds[i] * 0.01 + time * 0.28 + bId) * 0.008 * spread;
      const breatheZ = Math.sin(noiseSeeds[i] * 0.015 + time * 0.42 + bId) * 0.008 * spread;
      px += breatheX;
      py += breatheY;
      pz += breatheZ;

      // Mouse interaction in 3D
      if (isPointerActive) {
        const mx = intersectionPoint.x - px;
        const my = intersectionPoint.y - py;
        const mz = intersectionPoint.z - pz;
        const dist = Math.sqrt(mx * mx + my * my + mz * mz);
        if (dist < attRadius && dist > 0.1) {
          const influence = (1.0 - dist / attRadius) * 0.06;
          px += (mx / dist) * mouseForce * influence;
          py += (my / dist) * mouseForce * influence;
          pz += (mz / dist) * mouseForce * influence;
        }
      }
    }

    positions[i * 3]     = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
  }

  galaxyGeometry.getAttribute('position').needsUpdate = true;
}




function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postfx.resize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (galaxyPoints && galaxyPoints.material && galaxyPoints.material.uniforms) {
    galaxyPoints.material.uniforms.uTime.value += delta;
  }

  if (config.cameraMode === 'Cinematic') {
    const time = clock.getElapsedTime() * 0.025;
    camTheta = time;
    camPhi = 0.5 + Math.sin(time * 0.6) * 0.18;
    camRadius = 22.0 + Math.cos(time * 0.3) * 4.0;
    updateCameraCoords();
  }

  updateCameraCoords();
  updatePhysics(delta);

  if (!postfx.render()) {
    renderer.render(scene, camera);
  }
}

window.onload = init;

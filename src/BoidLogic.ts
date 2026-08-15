import * as THREE from 'three';

export enum SpeciesType {
    Red = 0,
    Green = 1,
    Blue = 2,
    Yellow = 3
}

export const SPECIES_COLORS = [
    '#ff4444', // Red
    '#44ff44', // Green
    '#4444ff', // Blue
    '#ffff44'  // Yellow
];

export interface SpeciesAttributes {
    separationWeight: number;
    alignmentWeight: number;
    cohesionWeight: number;
    maxSpeed: number;
    maxForce: number;
    perceptionRadius: number;
}

export enum DefeatScenario {
    Respawn = 0,
    Remove = 1,
    Convert = 2
}

export enum FormationMode {
    Serpent = 0,
    Spiral = 1,
    DoubleHelix = 2,
    TorusKnot = 3,
    JellyfishPulse = 4,
    QuantumAtom = 5,
    PhoenixWings = 6,
    BlackHoleJet = 7,
    HourglassVortex = 8,
    LissajousKnot = 9,
    Tesseract4D = 10,
    TornadoFunnel = 11,
    NautilusShell = 12,
    BioMushroom = 13,
    BeehiveSwarm = 14,
    DodecahedronShield = 15,
    SaturnRings = 16,
    PulsingHeart = 17,
    TsunamiWave = 18,
    SupernovaBurst = 19,
    CrystalPrism = 20,
    VirusCapsid = 21,
    PlasmaArc = 22,
    CoralReef = 23,
    VolcanicColumn = 24,
    AlienMothership = 25,
    TripleHelix = 26,
    FerrisWheel = 27,
    SpiderWeb = 28,
    NebulaCloud = 29,
    Procedural = 30,
    // --- 14 New Non-Circular / Planar / Dynamic Formations ---
    WireCube = 31,
    TreeBranch = 32,
    LightningBolt = 33,
    RiverDelta = 34,
    KelvinHelmholtz = 35,
    DNALadder = 36,
    StarPolygon = 37,
    CollapsingSphere = 38,
    BigBangExpansion = 39,
    GeologicStrata = 40,
    TrefoilKnot = 41,
    MurmurationFlow = 42,
    OuroborosSerpent = 43,
    DancingRibbon = 44,
    // --- High-Order Sophisticated & Complex Mathematical Topologies ---
    CalabiYauManifold = 45,
    HopfFibration = 46,
    LorenzAttractor = 47,
    GyroidMinimalSurface = 48,
    KleinBottle4D = 49,
    CliffordTorus = 50
}

export interface ProceduralGenome {
    family?: 'harmonic' | 'superformula' | 'branching';
    k1: number; k2: number; k3: number; k4: number; k5: number; k6: number; k7: number; k8: number;
    r1: number; r2: number; r3: number;
    a1: number; a2: number; a3: number;
    phi1: number; phi2: number; phi3: number;
    // Superformula params:
    m?: number; n1?: number; n2?: number; n3?: number; a?: number; b?: number;
}

export interface MaterialSettings {
    roughness: number;
    metalness: number;
    wireframe: boolean;
    flatShading: boolean;
    emissiveIntensity: number;
}

export interface LightingProfile {
    id: number;
    label: string;
    ambientIntensity: number;
    keyIntensity: number;
    keyColor: string;
    fillIntensity: number;
    fillColor: string;
    rimIntensity: number;
    rimColor: string;
    fogDensity: number;
}

export const LIGHTING_PROFILES: LightingProfile[] = [
    {
        id: 0,
        label: 'Studio White',
        ambientIntensity: 0.55,
        keyIntensity: 2.4,
        keyColor: '#ffffff',
        fillIntensity: 0.65,
        fillColor: '#ffffff',
        rimIntensity: 1.6,
        rimColor: '#e0e8ff',
        fogDensity: 0.003
    },
    {
        id: 1,
        label: 'Golden Hour',
        ambientIntensity: 0.45,
        keyIntensity: 2.8,
        keyColor: '#ffd580',
        fillIntensity: 0.60,
        fillColor: '#ffe5b4',
        rimIntensity: 1.8,
        rimColor: '#4060a0',
        fogDensity: 0.0035
    },
    {
        id: 2,
        label: 'Arctic Cold',
        ambientIntensity: 0.40,
        keyIntensity: 2.6,
        keyColor: '#c0d8ff',
        fillIntensity: 0.70,
        fillColor: '#d8f0ff',
        rimIntensity: 1.9,
        rimColor: '#ff8040',
        fogDensity: 0.004
    },
    {
        id: 3,
        label: 'Deep Sea',
        ambientIntensity: 0.30,
        keyIntensity: 2.2,
        keyColor: '#102040',
        fillIntensity: 0.50,
        fillColor: '#004060',
        rimIntensity: 2.4,
        rimColor: '#00ffcc',
        fogDensity: 0.006
    },
    {
        id: 4,
        label: 'Volcanic',
        ambientIntensity: 0.35,
        keyIntensity: 3.0,
        keyColor: '#ff6020',
        fillIntensity: 0.50,
        fillColor: '#801000',
        rimIntensity: 2.2,
        rimColor: '#200820',
        fogDensity: 0.005
    },
    {
        id: 5,
        label: 'Nebula Purple',
        ambientIntensity: 0.35,
        keyIntensity: 2.5,
        keyColor: '#9040ff',
        fillIntensity: 0.60,
        fillColor: '#401080',
        rimIntensity: 2.0,
        rimColor: '#40ff90',
        fogDensity: 0.004
    },
    {
        id: 6,
        label: 'Moonlight',
        ambientIntensity: 0.25,
        keyIntensity: 2.0,
        keyColor: '#d0e0ff',
        fillIntensity: 0.40,
        fillColor: '#102030',
        rimIntensity: 2.2,
        rimColor: '#204020',
        fogDensity: 0.004
    },
    {
        id: 7,
        label: 'Sunrise',
        ambientIntensity: 0.45,
        keyIntensity: 2.7,
        keyColor: '#ffb080',
        fillIntensity: 0.60,
        fillColor: '#ffd0b0',
        rimIntensity: 1.8,
        rimColor: '#6080c0',
        fogDensity: 0.0035
    },
    {
        id: 8,
        label: 'Neon Cyber',
        ambientIntensity: 0.35,
        keyIntensity: 2.8,
        keyColor: '#00ffcc',
        fillIntensity: 0.50,
        fillColor: '#200040',
        rimIntensity: 2.6,
        rimColor: '#ff0080',
        fogDensity: 0.0045
    },
    {
        id: 9,
        label: 'Overcast',
        ambientIntensity: 0.65,
        keyIntensity: 1.8,
        keyColor: '#c8c8d8',
        fillIntensity: 0.80,
        fillColor: '#d8c8c8',
        rimIntensity: 1.2,
        rimColor: '#b0b0c0',
        fogDensity: 0.005
    },
    {
        id: 10,
        label: 'Bioluminescent',
        ambientIntensity: 0.25,
        keyIntensity: 2.4,
        keyColor: '#40ff80',
        fillIntensity: 0.45,
        fillColor: '#003020',
        rimIntensity: 2.5,
        rimColor: '#00e0ff',
        fogDensity: 0.006
    },
    {
        id: 11,
        label: 'Eclipse',
        ambientIntensity: 0.20,
        keyIntensity: 1.5,
        keyColor: '#101018',
        fillIntensity: 0.30,
        fillColor: '#050510',
        rimIntensity: 3.2,
        rimColor: '#e0a020',
        fogDensity: 0.007
    }
];

export const COLOR_PALETTES = [
    ['#2e5a44', '#768a75', '#b38b4d', '#3e2a22'], // 1. Organic Forest & Moss
    ['#1b4965', '#5fa8d3', '#c86d51', '#bee9e8'], // 2. Deep Ocean Ecosystem
    ['#2b5c5e', '#1c3b2b', '#c48044', '#d8c8b8'], // 3. Nordic Fjord & Autumn Birch
    ['#2d3142', '#bf573f', '#e09f67', '#7d8597'], // 4. Volcanic Basalt & Warm Terracotta
    ['#a0522d', '#8a9a86', '#d4a373', '#e9d8a6'], // 5. Desert Canyon & Clay Sage
    ['#5c5470', '#3a5a40', '#7189bf', '#b5c99a'], // 6. Alpine Meadow & Wild Violet
    ['#134074', '#2d6a4f', '#d4a373', '#8d99ae'], // 7. Bioluminescent Deep Reef
    ['#4a5759', '#dedbd2', '#cc8b65', '#253d44'], // 8. Sandstone & Coastal Mineral
    ['#4a154b', '#6b2d5c', '#e0a96d', '#9c3d54'], // 9. Cosmic Amethyst & Rose Gold
    ['#0b2545', '#134074', '#8da9c4', '#ee6c4d'], // 10. Deep Cobalt & Coral Sunset
    ['#2a9d8f', '#e76f51', '#f4a261', '#264653'], // 11. Terracotta & Emerald Lagoon
    ['#483c46', '#3c6e71', '#d9bbf9', '#70ae6e'], // 12. Twilight Lavender & Sage
    ['#1e3888', '#47a8bd', '#f5e663', '#ffad60'], // 13. Solar Flare & Electric Sapphire
    ['#355070', '#6d597a', '#b5e2fa', '#e56b6f'], // 14. Icelandic Glacial Fiord
    ['#05668d', '#028090', '#00a896', '#f0f3bd'], // 15. Bioluminescent Mint Reef
    ['#3d314a', '#684756', '#96705b', '#ab876d'], // 16. Earthy Obsidian & Smoked Amber
    ['#143642', '#0f8b8d', '#ec9a29', '#a8201a'], // 17. Volcanic Copper & Patina
    ['#582f0e', '#7f4f24', '#936639', '#c2956e'], // 18. Ancient Teak & Sandstone
    ['#283618', '#606c38', '#fefae0', '#dda15e'], // 19. Olive Grove & Golden Barley
    ['#220901', '#621708', '#941b0c', '#bc3908'], // 20. Magma Obsidian & Crimson Amber
    ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c'], // 21. Nordic Winter & Ruby Spark
    ['#003049', '#d62828', '#f77f00', '#fcbf49'], // 22. Celestial Sunspot & Midnight
    ['#10002b', '#240046', '#5a189a', '#e0aaff'], // 23. Imperial Violet & Pearl Nebula
    ['#004b23', '#007200', '#38b000', '#ccff33']  // 24. Hyper-Emerald & Lime Moss
];

export const MATERIAL_PRESETS = [
    {
        id: 0,
        label: 'Polished Titanium Specular',
        icon: '✨',
        desc: 'Refined metallic specular mirror with strong glowing highlights',
        settings: { roughness: 0.03, metalness: 0.94, wireframe: false, flatShading: true, emissiveIntensity: 0.75 }
    },
    {
        id: 1,
        label: 'Faceted Diamond Crystal',
        icon: '💎',
        desc: 'Faceted gemstone catching vivid key and rim studio lights',
        settings: { roughness: 0.02, metalness: 0.92, wireframe: false, flatShading: true, emissiveIntensity: 0.70 }
    },
    {
        id: 2,
        label: 'Satin Cyber Metal',
        icon: '⚡',
        desc: 'Smooth satin chrome finish with strong glowing edge definition',
        settings: { roughness: 0.06, metalness: 0.90, wireframe: false, flatShading: true, emissiveIntensity: 0.72 }
    },
    {
        id: 3,
        label: 'Champagne Gold Mirror',
        icon: '🏆',
        desc: 'Polished golden mirror specularity with vivid studio highlights',
        settings: { roughness: 0.02, metalness: 0.96, wireframe: false, flatShading: true, emissiveIntensity: 0.65 }
    },
    {
        id: 4,
        label: 'Frost Crystal Shard',
        icon: '❄️',
        desc: 'Ice-cold platinum mirror with vivid luminous reflections',
        settings: { roughness: 0.04, metalness: 0.88, wireframe: false, flatShading: true, emissiveIntensity: 0.70 }
    },
    {
        id: 5,
        label: 'Glowing Cyber Crystal',
        icon: '💎',
        desc: 'High-tech cyber gemstone with vivid glowing specular reflections',
        settings: { roughness: 0.03, metalness: 0.94, wireframe: false, flatShading: true, emissiveIntensity: 0.85 }
    },
    {
        id: 6,
        label: 'Liquid Ruby Chrome',
        icon: '🔴',
        desc: 'Deep crimson metallic reflection with rich satin highlights',
        settings: { roughness: 0.12, metalness: 0.84, wireframe: false, flatShading: true, emissiveIntensity: 0.15 }
    },
    {
        id: 7,
        label: 'Emerald Satin Resin',
        icon: '🟢',
        desc: 'Refined emerald green metallic satin finish',
        settings: { roughness: 0.18, metalness: 0.78, wireframe: false, flatShading: true, emissiveIntensity: 0.15 }
    }
];

// Global Matrices provided by App
export interface SimulationState {
    attributes: SpeciesAttributes[];
    interactions: number[][]; // [i][j] = Weight of species i being attracted/repelled by species j
    bounds: number;
    speedMultiplier: number;
    sizeMultiplier: number;
    defeatScenario: DefeatScenario;
    formationMode: FormationMode;
    formationSeed: number;
    speciesColors: string[];
    paletteIndex?: number;
    materialSettings: MaterialSettings;
    transitionStartTime?: number;
    transitionDuration?: number;
    currentTime?: number;
    boidShape?: number;
    materialPreset?: number;
    autoMode?: boolean;
    autoShape?: boolean;
    autoMaterial?: boolean;
    proceduralGenome?: ProceduralGenome;
    isCameraLocked?: boolean;
    lightIntensityMultiplier?: number;
    lightingProfileIndex?: number;
    lightingProfile?: LightingProfile;
    cameraCategory?: string;
    cameraMood?: string;
    isInspecting?: boolean;
    prevFormationMode?: FormationMode;
    prevFormationSeed?: number;
    targetPopulation?: number;
    microSurpriseType?: string;
    microSurpriseEndTime?: number;
    clockEngine?: any;
    isFormationLocked?: boolean;
    isPaletteLocked?: boolean;
    paletteTransitionDuration?: number;
}

export function computeFormationPoint(
    formation: FormationMode,
    seed: number,
    u: number,
    time: number,
    species: number,
    indexInSpecies: number,
    sepWeight: number,
    speedMult: number,
    state: SimulationState
): [number, number, number] {
    let tx = 0, ty = 0, tz = 0;
    const freqMult = 1.0;
    const phaseShift = 0.0;

    if (formation === FormationMode.Serpent) {
        const s = (u - 0.5) * 6.5;
        const wave = s * 0.8 - time * 0.7 * speedMult + (species * Math.PI / 2);

        tx = s * 1.2 + Math.cos(wave) * 1.2;
        ty = Math.sin(wave * 1.4) * 1.8 + Math.cos(s * 0.4) * 0.8 + (species - 1.5) * 1.2;
        tz = Math.sin(wave) * 1.5;
    } else if (formation === FormationMode.Spiral) {
        const turns = 6.0;
        const theta = u * turns * Math.PI + time * 0.45 * speedMult + (species * Math.PI / 2);
        const radius = 0.8 + u * 5.5;
        const height = (u - 0.5) * 5.5 + Math.sin(theta * 2.0) * 0.8;

        tx = radius * Math.cos(theta);
        ty = height + (species - 1.5) * 1.0;
        tz = radius * Math.sin(theta);
    } else if (formation === FormationMode.DoubleHelix) {
        const strand = indexInSpecies % 2;
        const theta = u * (8.0 * freqMult) * Math.PI + time * 0.6 * speedMult + (strand * Math.PI) + (species * Math.PI / 4) + phaseShift;
        const h = (u - 0.5) * 12.0;
        const r = 3.2;

        tx = r * Math.cos(theta);
        ty = h;
        tz = r * Math.sin(theta);
    } else if (formation === FormationMode.TorusKnot) {
        const p = 2 + (Math.floor(seed) % 4);
        const q = 3 + (Math.floor(seed * 3) % 4);
        const t = u * 2.0 * Math.PI + time * 0.25 * speedMult + phaseShift;
        const r = Math.cos(q * t + (species * Math.PI / 2)) * 2.0 + 4.2;

        tx = r * Math.cos(p * t);
        ty = Math.sin(q * t + (species * Math.PI / 2)) * 2.8;
        tz = r * Math.sin(p * t);
    } else if (formation === FormationMode.JellyfishPulse) {
        const pulse = Math.sin(time * 1.1 * speedMult + phaseShift) * 0.3 + 1.0;
        if (u < 0.35) {
            const phi = (u / 0.35) * Math.PI * 0.5;
            const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + (time * 0.15);
            const bellR = Math.sin(phi) * 4.5 * pulse;

            tx = bellR * Math.cos(theta);
            ty = Math.cos(phi) * 3.0 + (species - 1.5) * 1.2;
            tz = bellR * Math.sin(theta);
        } else {
            const tentacleIdx = indexInSpecies % 8;
            const tentacleAngle = (tentacleIdx / 8.0) * Math.PI * 2.0 + (species * Math.PI / 2);
            const lengthParam = ((u - 0.35) / 0.65) * 9.0;
            const wave = lengthParam * 0.6 - time * 1.5 * speedMult;

            tx = Math.cos(tentacleAngle) * 2.2 + Math.sin(wave) * 0.8;
            ty = -lengthParam + (species - 1.5) * 1.2;
            tz = Math.sin(tentacleAngle) * 2.2 + Math.cos(wave) * 0.8;
        }
    } else if (formation === FormationMode.QuantumAtom) {
        const inclinationAngle = (species * (Math.PI / 4)) + phaseShift;
        const t = u * Math.PI * 2.0 + time * 0.7 * speedMult;
        const orbitR = 4.2 + Math.sin(t * 3.0) * 0.8;

        const rx = orbitR * Math.cos(t);
        const ry = Math.sin(t * 2.0) * 1.2;
        const rz = orbitR * Math.sin(t);

        const cosI = Math.cos(inclinationAngle);
        const sinI = Math.sin(inclinationAngle);
        tx = rx * cosI - ry * sinI;
        ty = rx * sinI + ry * cosI;
        tz = rz;
    } else if (formation === FormationMode.PhoenixWings) {
        const s = (u - 0.5) * 12.0;
        const flapPhase = time * 2.5 * speedMult - Math.abs(s) * 0.15 + (species * 0.3) + phaseShift;
        const wingElev = Math.pow(Math.abs(s) * 0.15, 1.2) * Math.sin(flapPhase) * 1.8;

        tx = s * 1.2;
        ty = wingElev + Math.cos(s * 0.3) * 1.0 + (species - 1.5) * 1.5;
        tz = -Math.abs(s) * 0.5 + Math.sin(flapPhase + 0.5) * 1.2;
    } else if (formation === FormationMode.BlackHoleJet) {
        const diskTheta = u * Math.PI * 8.0 + time * 1.5 * speedMult + (species * Math.PI / 2) + phaseShift;
        const diskR = 1.2 + u * 6.5;

        tx = diskR * Math.cos(diskTheta);
        ty = (Math.sin(diskTheta * 4.0 + time) * 0.3) + (species - 1.5) * 0.5;
        tz = diskR * Math.sin(diskTheta);
    } else if (formation === FormationMode.HourglassVortex) {
        const h = (u - 0.5) * 10.0;
        const waistR = Math.sqrt(2.0 + Math.pow(h * 0.25, 2));
        const theta = u * 8.0 * Math.PI + time * 0.6 * speedMult + (species * Math.PI / 2) + phaseShift;

        tx = waistR * Math.cos(theta);
        ty = h;
        tz = waistR * Math.sin(theta);
    } else if (formation === FormationMode.LissajousKnot) {
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult + phaseShift;
        const p = 3 + (Math.floor(seed) % 3);
        const q = 4 + (Math.floor(seed * 2) % 3);
        const r = 5 + (Math.floor(seed * 3) % 3);

        tx = 4.2 * Math.sin(p * t + (species * 0.5));
        ty = 3.2 * Math.sin(q * t + t * 0.2);
        tz = 4.2 * Math.sin(r * t + (species * 0.5));
    } else if (formation === FormationMode.Tesseract4D) {
        const t = time * 0.6 * speedMult + phaseShift;
        const angle4D = u * Math.PI * 4.0;
        const w4 = Math.sin(angle4D + t) * 2.5;
        const scale4D = 1.0 / (1.5 + w4 * 0.08);

        const x4 = Math.sin(angle4D * 2.0 + (species * Math.PI / 2)) * 4.5;
        const y4 = Math.cos(angle4D * 3.0) * 4.5;
        const z4 = Math.sin(angle4D * 1.5) * 4.5;

        tx = x4 * scale4D;
        ty = y4 * scale4D;
        tz = z4 * scale4D;
    } else if (formation === FormationMode.TornadoFunnel) {
        const h = (u - 0.5) * 9.0;
        const funnelR = (u * 4.5 + 0.5);
        const theta = u * 14.0 * Math.PI + time * 1.5 * speedMult + (species * Math.PI / 2);

        tx = funnelR * Math.cos(theta);
        ty = h;
        tz = funnelR * Math.sin(theta);
    } else if (formation === FormationMode.NautilusShell) {
        const theta = u * 4.0 * Math.PI + time * 0.4 * speedMult;
        const r = 1.0 + u * 4.2;

        tx = r * Math.cos(theta);
        ty = (u - 0.5) * 5.0 + Math.sin(theta) * 0.8;
        tz = r * Math.sin(theta);
    } else if (formation === FormationMode.BioMushroom) {
        if (u < 0.6) {
            const capU = u / 0.6;
            const phi = capU * Math.PI * 0.45;
            const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + (time * 0.1);
            const capR = Math.sin(phi) * 4.8;

            tx = capR * Math.cos(theta);
            ty = Math.cos(phi) * 2.0 + 1.5;
            tz = capR * Math.sin(theta);
        } else {
            const stemU = (u - 0.6) / 0.4;
            const stemR = 1.0 + Math.sin(stemU * 10.0 + time) * 0.2;
            const theta = (species * Math.PI / 2) + stemU * Math.PI * 2.0;

            tx = stemR * Math.cos(theta);
            ty = -stemU * 5.0 + 1.5;
            tz = stemR * Math.sin(theta);
        }
    } else if (formation === FormationMode.BeehiveSwarm) {
        const ring = Math.floor(u * 6.0) + 1;
        const hexAngle = ((indexInSpecies % 6) / 6.0) * Math.PI * 2.0 + (time * 0.2 * speedMult);
        const hexR = ring * 0.8;

        tx = hexR * Math.cos(hexAngle);
        ty = (species - 1.5) * 1.5 + Math.sin(ring + time) * 0.4;
        tz = hexR * Math.sin(hexAngle);
    } else if (formation === FormationMode.DodecahedronShield) {
        const phi = u * Math.PI;
        const theta = (indexInSpecies * 2.4) + time * 0.4 * speedMult;
        const polyR = 4.2 + Math.sin(phi * 5.0) * 0.6;

        tx = polyR * Math.sin(phi) * Math.cos(theta);
        ty = polyR * Math.cos(phi);
        tz = polyR * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.SaturnRings) {
        const ringR = 2.2 + u * 3.8;
        const ringTheta = u * Math.PI * 8.0 + time * 0.7 * speedMult + (species * Math.PI / 2);
        const rx = ringR * Math.cos(ringTheta);
        const ry = Math.sin(ringTheta * 3.0) * 0.2;
        const rz = ringR * Math.sin(ringTheta);

        const tilt = 30.0 * (Math.PI / 180.0);
        tx = rx;
        ty = ry * Math.cos(tilt) - rz * Math.sin(tilt);
        tz = ry * Math.sin(tilt) + rz * Math.cos(tilt);
    } else if (formation === FormationMode.PulsingHeart) {
        const t = u * Math.PI * 2.0;
        const pulse = 1.0 + Math.sin(time * 1.5 * speedMult) * 0.08;
        const hx = 16.0 * Math.pow(Math.sin(t), 3);
        const hy = 13.0 * Math.cos(t) - 5.0 * Math.cos(2 * t) - 2.0 * Math.cos(3 * t) - Math.cos(4 * t);
        const hz = Math.sin(t * 4.0 + (species * Math.PI / 2)) * 1.5;

        tx = (hx * 0.28) * pulse;
        ty = (hy * 0.28) * pulse;
        tz = hz * pulse;
    } else if (formation === FormationMode.TsunamiWave) {
        const xVal = (u - 0.5) * 10.0;
        const curlPhase = xVal * 0.2 - time * 1.0 * speedMult;
        const waveY = Math.sin(curlPhase) * 2.5 + Math.pow(Math.max(0, Math.cos(curlPhase)), 2.5) * 3.2;

        tx = xVal;
        ty = waveY + (species - 1.5) * 0.8;
        tz = Math.cos(curlPhase) * 2.0;
    } else if (formation === FormationMode.SupernovaBurst) {
        const burstR = (Math.sin(time * 0.9 * speedMult + u * 3.0) * 0.3 + 0.7) * 4.8;
        const phi = u * Math.PI;
        const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + (species * Math.PI / 2);

        tx = burstR * Math.sin(phi) * Math.cos(theta);
        ty = burstR * Math.cos(phi);
        tz = burstR * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.CrystalPrism) {
        const side = indexInSpecies % 6;
        const prismAngle = (side / 6.0) * Math.PI * 2.0 + (time * 0.15 * speedMult);
        const h = (u - 0.5) * 9.0;
        const prismR = 3.5;

        tx = prismR * Math.cos(prismAngle);
        ty = h;
        tz = prismR * Math.sin(prismAngle);
    } else if (formation === FormationMode.VirusCapsid) {
        const phi = u * Math.PI;
        const theta = (indexInSpecies * 2.4) + (time * 0.2);
        const capsidR = 4.2;

        tx = capsidR * Math.sin(phi) * Math.cos(theta);
        ty = capsidR * Math.cos(phi);
        tz = capsidR * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.PlasmaArc) {
        const arcY = (u - 0.5) * 9.0;
        const boltJitter = Math.sin(arcY * 0.8 + time * 3.0) * 1.0;

        tx = Math.cos(arcY * 0.4 + time * 1.0) * 1.8 + boltJitter;
        ty = arcY;
        tz = Math.sin(arcY * 0.4 + time * 1.0) * 1.8 + boltJitter;
    } else if (formation === FormationMode.CoralReef) {
        const branch = indexInSpecies % 5;
        const branchAngle = (branch / 5.0) * Math.PI * 2.0 + (species * Math.PI / 2);
        const h = u * 8.0;
        const r = (Math.sin(h * 0.5) * 1.5 + 1.0);

        tx = Math.cos(branchAngle) * r + Math.sin(h * 0.8 + time) * 0.6;
        ty = h - 4.0;
        tz = Math.sin(branchAngle) * r + Math.cos(h * 0.8 + time) * 0.6;
    } else if (formation === FormationMode.VolcanicColumn) {
        const yVal = u * 9.0 - 4.5;
        const plumeR = (yVal > 0 ? (yVal * 0.3 + 1.0) : 1.0);
        const theta = u * Math.PI * 8.0 + time * 1.2 * speedMult;

        tx = plumeR * Math.cos(theta);
        ty = yVal;
        tz = plumeR * Math.sin(theta);
    } else if (formation === FormationMode.AlienMothership) {
        const discR = 1.5 + u * 3.8;
        const theta = u * Math.PI * 6.0 + time * 0.5 * speedMult + (species * Math.PI / 2);

        tx = discR * Math.cos(theta);
        ty = Math.sin(discR * 0.8 + time * 1.0) * 0.4;
        tz = discR * Math.sin(theta);
    } else if (formation === FormationMode.TripleHelix) {
        const strand = indexInSpecies % 3;
        const strandOffset = (strand * Math.PI * 2.0 / 3.0);
        const theta = u * (8.0 * freqMult) * Math.PI + time * 0.7 * speedMult + strandOffset;
        const h = (u - 0.5) * 10.0;
        const r = 3.2;

        tx = r * Math.cos(theta);
        ty = h;
        tz = r * Math.sin(theta);
    } else if (formation === FormationMode.FerrisWheel) {
        const wheelAngle = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const wheelR = 4.2;

        const wx = wheelR * Math.cos(wheelAngle);
        const wy = wheelR * Math.sin(wheelAngle);
        const wz = (species - 1.5) * 1.2;

        tx = wx;
        ty = wy;
        tz = wz;
    } else if (formation === FormationMode.SpiderWeb) {
        const ring = Math.floor(u * 5.0) + 1;
        const spoke = (indexInSpecies % 8);
        const spokeAngle = (spoke / 8.0) * Math.PI * 2.0 + (time * 0.1);
        const webR = ring * 0.8;

        tx = webR * Math.cos(spokeAngle);
        ty = (species - 1.5) * 0.8 + Math.sin(spokeAngle * 3.0 + time) * 0.4;
        tz = webR * Math.sin(spokeAngle);
    } else if (formation === FormationMode.WireCube) {
        // --- 31. WireCube: 12 crisp 3D edges of a Platonic Cube ---
        const edgeIdx = Math.floor(u * 12) % 12;
        const edgeT = (u * 12) % 1.0;
        const s = 3.2;
        const p0 = (edgeT - 0.5) * s * 2;
        // 12 edges connecting 8 vertices: (-s,-s,-s) to (s,s,s)
        switch (edgeIdx) {
            case 0:  tx = p0; ty = -s; tz = -s; break;
            case 1:  tx = p0; ty = s; tz = -s; break;
            case 2:  tx = p0; ty = -s; tz = s; break;
            case 3:  tx = p0; ty = s; tz = s; break;
            case 4:  tx = -s; ty = p0; tz = -s; break;
            case 5:  tx = s; ty = p0; tz = -s; break;
            case 6:  tx = -s; ty = p0; tz = s; break;
            case 7:  tx = s; ty = p0; tz = s; break;
            case 8:  tx = -s; ty = -s; tz = p0; break;
            case 9:  tx = s; ty = -s; tz = p0; break;
            case 10: tx = -s; ty = s; tz = p0; break;
            default: tx = s; ty = s; tz = p0; break;
        }
        // Gentle 3D rotation of the cube frame
        const rot = time * 0.25 * speedMult;
        const cosR = Math.cos(rot), sinR = Math.sin(rot);
        const rx = tx * cosR - tz * sinR;
        const rz = tx * sinR + tz * cosR;
        tx = rx; tz = rz;
    } else if (formation === FormationMode.TreeBranch) {
        // --- 32. TreeBranch: Recursive 3D L-System Branching Tree ---
        if (u < 0.25) {
            // Main central trunk
            const trunkT = u / 0.25;
            tx = Math.sin(trunkT * 2.0 + time * 0.4) * 0.2;
            ty = (trunkT - 0.5) * 4.0 - 2.0;
            tz = Math.cos(trunkT * 2.0 + time * 0.4) * 0.2;
        } else if (u < 0.65) {
            // 4 Secondary major boughs
            const boughIdx = indexInSpecies % 4;
            const boughAngle = (boughIdx / 4.0) * Math.PI * 2.0 + (species * 0.3);
            const boughT = (u - 0.25) / 0.40;
            const boughR = boughT * 3.5;
            const sway = Math.sin(time * 0.6 * speedMult + boughIdx) * 0.3;
            tx = Math.cos(boughAngle + sway) * boughR;
            ty = -1.0 + boughT * 3.2;
            tz = Math.sin(boughAngle + sway) * boughR;
        } else {
            // Tertiary canopy foliage twigs
            const twigIdx = indexInSpecies % 12;
            const twigAngle = (twigIdx / 12.0) * Math.PI * 2.0 + (time * 0.1);
            const canopyR = 2.0 + ((u - 0.65) / 0.35) * 2.8;
            const phi = ((u - 0.65) / 0.35) * Math.PI * 0.4;
            tx = canopyR * Math.sin(phi) * Math.cos(twigAngle);
            ty = 2.0 + Math.cos(phi) * 2.5 + Math.sin(time * 0.8 + twigIdx) * 0.2;
            tz = canopyR * Math.sin(phi) * Math.sin(twigAngle);
        }
    } else if (formation === FormationMode.LightningBolt) {
        // --- 33. LightningBolt: Stochastic Fractal Lightning Strike ---
        const yNorm = (u - 0.5) * 10.0;
        const seedMod = seed * 0.1;
        const mainJitter = Math.sin(yNorm * 1.5 + seedMod) * 1.8 + Math.sin(yNorm * 4.2 + time * 2.0) * 0.6;
        const zJitter = Math.cos(yNorm * 2.1 + seedMod * 1.3) * 1.4 + Math.sin(yNorm * 5.0) * 0.5;
        
        // 25% Branching tributary bolts
        if (indexInSpecies % 4 === 0) {
            const branchDist = (indexInSpecies % 7) * 0.4;
            tx = mainJitter + Math.cos(species * Math.PI / 2) * branchDist;
            ty = yNorm + Math.sin(species * Math.PI / 2) * branchDist * 0.5;
            tz = zJitter + Math.sin(species * Math.PI / 2) * branchDist;
        } else {
            tx = mainJitter;
            ty = yNorm;
            tz = zJitter;
        }
    } else if (formation === FormationMode.RiverDelta) {
        // --- 34. RiverDelta: Planar Branching Tributaries ---
        const xProgress = (u - 0.5) * 9.0;
        const spreadFactor = Math.max(0.2, (xProgress + 4.5) / 9.0);
        const channel = (indexInSpecies % 7) - 3;
        const meander = Math.sin(xProgress * 0.8 + channel + time * 0.5 * speedMult) * 0.8;
        
        tx = xProgress;
        ty = (species - 1.5) * 0.4 + Math.sin(xProgress * 1.2 + time) * 0.15;
        tz = channel * spreadFactor * 1.5 + meander * spreadFactor;
    } else if (formation === FormationMode.KelvinHelmholtz) {
        // --- 35. KelvinHelmholtz: Fluid Shear Layer Rolling Vortices ---
        const xPos = (u - 0.5) * 10.0;
        const waveK = 1.2;
        const wavePhase = xPos * waveK - time * 1.2 * speedMult;
        const shearLayer = Math.sign(species - 1.5);
        const vortexRoll = Math.sin(wavePhase) * Math.exp(-Math.abs(Math.sin(wavePhase * 0.5)) * 0.5);
        
        tx = xPos;
        ty = vortexRoll * 2.8 + shearLayer * (0.8 + Math.cos(wavePhase) * 0.4);
        tz = Math.cos(wavePhase * 1.5) * 1.2 + (species - 1.5) * 0.6;
    } else if (formation === FormationMode.DNALadder) {
        // --- 36. DNALadder: Linear Grid Ladder with Horizontal Rungs ---
        const isRail = (indexInSpecies % 3) !== 0;
        const h = (u - 0.5) * 10.0;
        const rot = time * 0.3 * speedMult;
        const railSign = (indexInSpecies % 2 === 0) ? 1 : -1;
        const railDist = 2.0;

        let lx = 0, ly = h, lz = 0;
        if (isRail) {
            lx = railSign * railDist;
            lz = (species - 1.5) * 0.3;
        } else {
            // Horizontal cross rungs
            const rungT = ((indexInSpecies * 13) % 100) / 100.0;
            lx = (rungT - 0.5) * railDist * 2.0;
            lz = 0;
        }
        tx = lx * Math.cos(rot) - lz * Math.sin(rot);
        ty = ly;
        tz = lx * Math.sin(rot) + lz * Math.cos(rot);
    } else if (formation === FormationMode.StarPolygon) {
        // --- 37. StarPolygon: 3D 5-Point Star Extrusion ---
        const points = 5;
        const angle = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const modA = Math.cos(points * angle);
        const starR = 2.0 + 2.2 * Math.abs(modA);
        const starH = (species - 1.5) * 2.0 + Math.sin(angle * 3.0 + time) * 0.5;

        tx = starR * Math.cos(angle);
        ty = starH;
        tz = starR * Math.sin(angle);
    } else if (formation === FormationMode.CollapsingSphere) {
        // --- 38. CollapsingSphere: Breathing Singularity Implosion ---
        const phi = Math.acos(2 * u - 1);
        const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + time * 0.2;
        const collapseCycle = (Math.sin(time * 0.8 * speedMult) + 1.0) * 0.5;
        const breatheR = 0.6 + Math.pow(collapseCycle, 2.0) * 4.8;

        tx = breatheR * Math.sin(phi) * Math.cos(theta);
        ty = breatheR * Math.cos(phi);
        tz = breatheR * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.BigBangExpansion) {
        // --- 39. BigBangExpansion: Radial Cosmic Shockwave Shells ---
        const bangPhase = (time * 0.6 * speedMult + seed * 0.01) % 4.0;
        const radialDist = Math.pow(bangPhase / 4.0, 0.75) * 6.5 + 0.5;
        const phi = Math.acos(2 * u - 1);
        const theta = (indexInSpecies * 2.39996) + (species * Math.PI / 2);

        tx = radialDist * Math.sin(phi) * Math.cos(theta);
        ty = radialDist * Math.cos(phi);
        tz = radialDist * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.GeologicStrata) {
        // --- 40. GeologicStrata: 5 Layered Horizontal Planar Sheets ---
        const layer = Math.floor(u * 5);
        const layerU = (u * 5) % 1.0;
        const planeX = (layerU - 0.5) * 8.0;
        const planeZ = ((indexInSpecies % 20) / 20.0 - 0.5) * 8.0;
        const topoRipple = Math.sin(planeX * 0.8 + time * 0.4) * Math.cos(planeZ * 0.8) * 0.5;
        const layerY = (layer - 2) * 1.8 + topoRipple;

        tx = planeX;
        ty = layerY;
        tz = planeZ;
    } else if (formation === FormationMode.TrefoilKnot) {
        // --- 41. TrefoilKnot: Mathematical Canonical (2,3) Knot ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult + (species * 0.2);
        const kScale = 1.35;
        tx = (Math.sin(t) + 2 * Math.sin(2 * t)) * kScale;
        ty = (Math.cos(t) - 2 * Math.cos(2 * t)) * kScale;
        tz = (-Math.sin(3 * t) * 1.8) * kScale;
    } else if (formation === FormationMode.MurmurationFlow) {
        // --- 42. MurmurationFlow: Dynamic Emergent Swarm Cloud ---
        const swarmPhase = time * 0.5 * speedMult;
        const sx = Math.sin(u * 6.0 + swarmPhase) * 3.5 + Math.cos(time * 0.3 + species) * 1.5;
        const sy = Math.cos(u * 4.0 - swarmPhase * 0.8) * 2.8 + Math.sin(u * 8.0) * 0.8;
        const sz = Math.sin(u * 5.0 + swarmPhase * 1.2) * 3.5 + Math.cos(time * 0.4 + species) * 1.2;

        tx = sx; ty = sy; tz = sz;
    } else if (formation === FormationMode.OuroborosSerpent) {
        // --- 43. OuroborosSerpent: Planar Tail-Swallowing Ring ---
        const ringAngle = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const bodyThickness = (1.0 - Math.pow(u, 1.5)) * 1.2 + 0.3;
        const spineWave = Math.sin(u * 12.0 - time * 2.0) * 0.4;
        const baseR = 4.0 + (species - 1.5) * 0.4;

        tx = (baseR + spineWave) * Math.cos(ringAngle);
        ty = Math.sin(u * 8.0 + time) * (bodyThickness * 0.6);
        tz = (baseR + spineWave) * Math.sin(ringAngle);
    } else if (formation === FormationMode.DancingRibbon) {
        // --- 44. DancingRibbon: Twisting 3D Kinetic Ribbon ---
        const ribT = (u - 0.5) * 10.0;
        const ribWave = ribT * 0.7 - time * 0.8 * speedMult;
        const ribbonWidth = (indexInSpecies % 2 === 0 ? 1 : -1) * 0.8;
        const twistAngle = ribT * 0.9 + time * 0.5;

        const rx = Math.sin(ribWave) * 3.0;
        const ry = ribT * 0.8 + Math.cos(ribWave) * 1.2;
        const rz = Math.cos(ribWave) * 2.8;

        tx = rx + Math.cos(twistAngle) * ribbonWidth;
        ty = ry;
        tz = rz + Math.sin(twistAngle) * ribbonWidth;
    } else if (formation === FormationMode.CalabiYauManifold) {
        // --- 45. CalabiYauManifold: 6D String Theory Compactification Projection ---
        const n = 5; // Quintic 3-fold
        const alpha = u * Math.PI * 2.0;
        const beta = ((indexInSpecies % 100) / 100.0) * Math.PI * 2.0;
        const phaseT = time * 0.3 * speedMult + (species * Math.PI / 2);

        const z1_r = Math.cos(alpha);
        const z1_i = Math.sin(alpha);
        const z2_r = Math.pow(Math.abs(Math.cos(n * alpha)), 1 / n) * Math.cos(beta + phaseT);
        const z2_i = Math.pow(Math.abs(Math.sin(n * alpha)), 1 / n) * Math.sin(beta + phaseT);

        const cx = (z1_r * Math.cos(phaseT) - z1_i * Math.sin(phaseT)) * 4.5;
        const cy = (z2_r * 3.5) + (species - 1.5) * 0.8;
        const cz = (z1_r * Math.sin(phaseT) + z2_i * Math.cos(phaseT)) * 4.5;

        tx = cx; ty = cy; tz = cz;
    } else if (formation === FormationMode.HopfFibration) {
        // --- 46. HopfFibration: 4D 3-Sphere Villarceau Nested Fiber Bundle ---
        const th = u * Math.PI * 2.0;
        const ph = ((species + 0.5) / 4.0) * Math.PI;
        const psi = ((indexInSpecies % 80) / 80.0) * Math.PI * 2.0 + time * 0.5 * speedMult;

        const x4 = Math.cos((th + psi) * 0.5) * Math.sin(ph * 0.5);
        const y4 = Math.sin((th + psi) * 0.5) * Math.sin(ph * 0.5);
        const z4 = Math.cos((th - psi) * 0.5) * Math.cos(ph * 0.5);
        const w4 = Math.sin((th - psi) * 0.5) * Math.cos(ph * 0.5);

        // Conformal stereographic 4D->3D projection
        const denom = Math.max(0.2, 1.4 - w4);
        tx = (x4 / denom) * 4.0;
        ty = (y4 / denom) * 4.0;
        tz = (z4 / denom) * 4.0;
    } else if (formation === FormationMode.LorenzAttractor) {
        // --- 47. LorenzAttractor: Continuous Dual-Scroll Chaotic Attractor ---
        const lobe = (indexInSpecies % 2 === 0) ? 1 : -1;
        const tLor = (u * 16.0) + (species * 0.5) + (time * 0.4 * speedMult);
        const rLor = Math.sqrt(Math.abs(tLor)) * 1.4 + 1.2;
        const thetaLor = tLor * 2.2;

        const lx = lobe * (rLor * Math.cos(thetaLor) + lobe * 3.2);
        const ly = (Math.sin(tLor * 1.5) * 4.0) + (rLor * 0.6) - 2.0;
        const lz = lobe * (rLor * Math.sin(thetaLor));

        tx = lx * 0.85;
        ty = ly * 0.85;
        tz = lz * 0.85;
    } else if (formation === FormationMode.GyroidMinimalSurface) {
        // --- 48. GyroidMinimalSurface: Triply Periodic Infinite Nodal Sheet ---
        const gx_u = (u - 0.5) * Math.PI * 3.0;
        const gy_v = (((indexInSpecies % 60) / 60.0) - 0.5) * Math.PI * 3.0;
        const gTime = time * 0.3 * speedMult + (species * 0.6);

        // Parametric approximation on the gyroid zero-potential manifold
        const gx = gx_u + Math.sin(gy_v + gTime) * 0.4;
        const gy = gy_v + Math.cos(gx_u + gTime) * 0.4;
        const gz = Math.atan2(Math.sin(gx) * Math.cos(gy), Math.cos(gx) * Math.sin(gy) + 0.01) * 1.8;

        tx = gx * 1.3;
        ty = gy * 1.3;
        tz = gz * 1.4;
    } else if (formation === FormationMode.KleinBottle4D) {
        // --- 49. KleinBottle4D: Figure-8 Non-Orientable Immersion ---
        const ku = u * Math.PI * 2.0;
        const kv = (((indexInSpecies % 70) / 70.0) * Math.PI * 2.0) + (time * 0.4 * speedMult);
        const rk = 3.6;

        const kx = (rk + Math.cos(ku * 0.5) * Math.sin(kv) - Math.sin(ku * 0.5) * Math.sin(2.0 * kv)) * Math.cos(ku);
        const ky = (rk + Math.cos(ku * 0.5) * Math.sin(kv) - Math.sin(ku * 0.5) * Math.sin(2.0 * kv)) * Math.sin(ku);
        const kz = (Math.sin(ku * 0.5) * Math.sin(kv) + Math.cos(ku * 0.5) * Math.sin(2.0 * kv)) * 2.2;

        tx = kx * 0.75;
        ty = ky * 0.75;
        tz = kz * 0.75;
    } else if (formation === FormationMode.CliffordTorus) {
        // --- 50. CliffordTorus: Flat 4D Torus with Hyper-Rotation Projection ---
        const thC = u * Math.PI * 2.0;
        const phiC = (((indexInSpecies % 80) / 80.0) * Math.PI * 2.0);
        const tRot = time * 0.35 * speedMult;

        const x1 = Math.cos(thC + tRot);
        const y1 = Math.sin(thC + tRot);
        const x2 = Math.cos(phiC + (species * Math.PI / 2));
        const y2 = Math.sin(phiC + (species * Math.PI / 2));

        // 4D isoclinic rotation
        const wC = (x1 * Math.cos(tRot) - y2 * Math.sin(tRot));
        const denomC = Math.max(0.3, 1.6 - wC * 0.5);

        tx = ((y1) / denomC) * 3.8;
        ty = ((x2) / denomC) * 3.8;
        tz = ((x1 * Math.sin(tRot) + y2 * Math.cos(tRot)) / denomC) * 3.8;
    } else if (formation === FormationMode.Procedural && state && state.proceduralGenome) {
        const g = state.proceduralGenome;
        const th = u * Math.PI * 2.0;
        const wTime = time * 0.2 * speedMult;

        if (g.family === 'superformula') {
            const m = g.m || 6;
            const n1 = g.n1 || 1.0, n2 = g.n2 || 1.0, n3 = g.n3 || 1.0;
            const a = g.a || 1.0, b = g.b || 1.0;
            const t1 = Math.pow(Math.abs(Math.cos(m * th / 4) / a), n2);
            const t2 = Math.pow(Math.abs(Math.sin(m * th / 4) / b), n3);
            const sfR = Math.pow(t1 + t2, -1 / n1) * 0.4;
            const h = (species - 1.5) * 1.8 + Math.sin(th * 3.0 + wTime) * 0.8;

            tx = sfR * Math.cos(th + wTime) * 3.5;
            ty = h;
            tz = sfR * Math.sin(th + wTime) * 3.5;
        } else if (g.family === 'branching') {
            const segment = Math.floor(u * (g.k1 || 4));
            const segT = (u * (g.k1 || 4)) % 1.0;
            const angle = (segment / (g.k1 || 4)) * Math.PI * 2.0 + wTime;
            const r = segT * (g.r1 || 8.0) * 0.35;

            tx = r * Math.cos(angle + Math.sin(segT * 3.0) * 0.4);
            ty = (segT - 0.5) * 6.0 + Math.sin(angle * 2.0) * 0.5;
            tz = r * Math.sin(angle + Math.cos(segT * 3.0) * 0.4);
        } else {
            // Fourier Harmonic family
            tx = (g.r1 * Math.cos(g.k1 * th + g.phi1) * Math.sin(g.k2 * th + wTime) + g.a1 * Math.cos(g.k3 * th)) * 0.4;
            ty = (g.r2 * Math.sin(g.k4 * th + g.phi2) * Math.cos(wTime) + g.a2 * Math.sin(g.k5 * th)) * 0.4;
            tz = (g.r3 * Math.sin(g.k6 * th + g.phi3) * Math.cos(g.k7 * th + wTime) + g.a3 * Math.cos(g.k8 * th)) * 0.4;
        }
    } else {
        const cloudRadius = 1.5 + u * 3.5;
        const theta = u * Math.PI * 8.0 + time * 0.25 * speedMult;
        const phi = (indexInSpecies * 137.5) * (Math.PI / 180.0);

        tx = cloudRadius * Math.sin(phi) * Math.cos(theta);
        ty = cloudRadius * Math.cos(phi) + Math.sin(theta * 2.0) * 2.0;
        tz = cloudRadius * Math.sin(phi) * Math.sin(theta);
    }

    return [tx, ty, tz];
}

export class BlobCenter {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    species: number;
    nominalR: number;

    constructor(x: number, y: number, z: number, species: number, nominalR: number) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3();
        this.species = species;
        this.nominalR = nominalR;
    }

    update(activeBlobs: BlobCenter[], interactions: number[][], speed: number, time: number) {
        const d = this.position.length() || 1.0;
        
        // 1. Keplerian central gravity
        const gravityStrength = 0.25 * speed / (d * d + 0.1);
        this.velocity.addScaledVector(this.position, -gravityStrength / d);

        // 2. Core repulsion
        const coreRadius = 4.0;
        if (d < coreRadius) {
            this.velocity.addScaledVector(this.position, 0.008 * (coreRadius - d) / d);
        }

        // 3. Tangential orbital force
        const orbitalStrength = 0.005;
        const orbitalForce = new THREE.Vector3(-this.position.z, 0.0, this.position.x).normalize().multiplyScalar(orbitalStrength);
        this.velocity.add(orbitalForce);

        // 3.5. Repulsion between blob centers of the same species to prevent tight stacking
        for (const other of activeBlobs) {
            if (other === this || other.species !== this.species) continue;
            const diff = new THREE.Vector3().subVectors(this.position, other.position);
            const distSq = diff.lengthSq();
            if (distSq < 25.0 && distSq > 0.001) {
                const dist = Math.sqrt(distSq);
                this.velocity.addScaledVector(diff, (5.0 - dist) * 0.008 / dist);
            }
        }

        // 4. Pairwise interactions with other blob centers
        const spAvg = Array.from({ length: 4 }, () => new THREE.Vector3());
        const spCount = new Array(4).fill(0);
        for (const other of activeBlobs) {
            spAvg[other.species].add(other.position);
            spCount[other.species]++;
        }
        for (let i = 0; i < 4; i++) {
            if (spCount[i] > 0) spAvg[i].divideScalar(spCount[i]);
        }

        for (let j = 0; j < 4; j++) {
            if (spCount[j] === 0) continue;
            const coeff = interactions[this.species][j];
            if (Math.abs(coeff) < 0.01) continue;

            const diff = new THREE.Vector3().subVectors(spAvg[j], this.position);
            const distSq = diff.lengthSq();
            if (distSq < 1e-4) continue;

            const dist = Math.sqrt(distSq);
            const dir = diff.divideScalar(dist);
            const mag = (coeff / 10.0) * 0.03 * speed;
            this.velocity.addScaledVector(dir, mag);
        }

        this.position.add(this.velocity);
        this.velocity.multiplyScalar(0.94);
    }
}

export class BoidSwarmData {
    count: number;
    posX: Float32Array;
    posY: Float32Array;
    posZ: Float32Array;
    velX: Float32Array;
    velY: Float32Array;
    velZ: Float32Array;
    species: Uint8Array;
    size: Float32Array;
    noiseSeed: Float32Array;
    indexInSpecies: Uint32Array;
    totalInSpecies: Uint32Array;
    isStray: Uint8Array;
    strayOrbitRadius: Float32Array;
    strayOrbitSpeed: Float32Array;
    isLeader: Uint8Array;
    u: Float32Array;

    constructor(maxCapacity: number = 100000) {
        this.count = 0;
        this.posX = new Float32Array(maxCapacity);
        this.posY = new Float32Array(maxCapacity);
        this.posZ = new Float32Array(maxCapacity);
        this.velX = new Float32Array(maxCapacity);
        this.velY = new Float32Array(maxCapacity);
        this.velZ = new Float32Array(maxCapacity);
        this.species = new Uint8Array(maxCapacity);
        this.size = new Float32Array(maxCapacity);
        this.noiseSeed = new Float32Array(maxCapacity);
        this.indexInSpecies = new Uint32Array(maxCapacity);
        this.totalInSpecies = new Uint32Array(maxCapacity);
        this.isStray = new Uint8Array(maxCapacity);
        this.strayOrbitRadius = new Float32Array(maxCapacity);
        this.strayOrbitSpeed = new Float32Array(maxCapacity);
        this.isLeader = new Uint8Array(maxCapacity);
        this.u = new Float32Array(maxCapacity);
    }

    setPopulation(targetCount: number, state: SimulationState) {
        const prevCount = this.count;
        this.count = targetCount;

        const speciesBaseSizes = [0.25, 0.18, 0.12, 0.08];
        const speciesCounts = [0, 0, 0, 0];

        // If growing population, initialize new particles
        if (targetCount > prevCount) {
            for (let i = prevCount; i < targetCount; i++) {
                const sp = Math.floor(Math.random() * 4) as SpeciesType;
                this.species[i] = sp;

                const baseSize = speciesBaseSizes[sp];
                const sizeVariance = 0.5 + Math.pow(Math.random(), 2.0) * 0.4;
                const isAlphaLeader = (i % 16 === 0);
                const isTitanLeader = (i % 60 === 0);
                const leaderMult = isTitanLeader ? 1.15 : (isAlphaLeader ? 1.08 : 1.0);
                this.size[i] = baseSize * sizeVariance * leaderMult;

                this.noiseSeed[i] = Math.random() * 1000.0;
                this.isStray[i] = 0;
                this.strayOrbitRadius[i] = 6.0 + Math.random() * 6.0;
                this.strayOrbitSpeed[i] = (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);

                this.velX[i] = 0;
                this.velY[i] = 0;
                this.velZ[i] = 1;
            }
        }

        // Re-index species indices and totals
        for (let i = 0; i < targetCount; i++) {
            const sp = this.species[i];
            this.indexInSpecies[i] = speciesCounts[sp]++;
            this.isLeader[i] = (this.indexInSpecies[i] % 25 === 0) ? 1 : 0;
        }

        const mode = state && state.formationMode !== undefined ? state.formationMode : 0;
        const seed = state && state.formationSeed !== undefined ? state.formationSeed : 42;

        for (let i = 0; i < targetCount; i++) {
            const sp = this.species[i];
            const tot = speciesCounts[sp] > 0 ? speciesCounts[sp] : 100;
            this.totalInSpecies[i] = tot;
            this.u[i] = Math.sin((this.indexInSpecies[i] / tot) * Math.PI * 0.5);

            // If newly initialized, snap to formation point
            if (i >= prevCount) {
                const [tx, ty, tz] = computeFormationPoint(mode, seed, this.u[i], 0, sp, this.indexInSpecies[i], 3.5, state.speedMultiplier || 0.28, state);
                this.posX[i] = tx;
                this.posY[i] = ty;
                this.posZ[i] = tz;
            }
        }
    }
}

export class Boid {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    species: SpeciesType;
    size: number;
    assignedBlob: BlobCenter;
    localOffset: THREE.Vector3;
    noiseSeed: number;
    indexInSpecies: number;
    totalInSpecies: number;
    snapPosition: THREE.Vector3; // Physical position captured at transition start — morph anchor
    isStray: boolean;
    strayOrbitRadius: number;
    strayOrbitSpeed: number;
    isLeader: boolean;

    constructor(x: number, y: number, z: number, species: SpeciesType, size: number, assignedBlob: BlobCenter, localOffset: THREE.Vector3, indexInSpecies: number = 0, totalInSpecies: number = 100) {
        this.position = new THREE.Vector3().copy(localOffset);
        this.velocity = new THREE.Vector3(0, 0, 1);
        this.species = species;
        this.size = size;
        this.assignedBlob = assignedBlob;
        this.localOffset = localOffset;
        this.noiseSeed = Math.random() * 1000.0;
        this.indexInSpecies = indexInSpecies;
        this.totalInSpecies = totalInSpecies;
        this.snapPosition = new THREE.Vector3().copy(localOffset);
        this.isStray = (Math.random() < 0.05); // 5% organic halo stray boids
        this.strayOrbitRadius = 6.0 + Math.random() * 6.0;
        this.strayOrbitSpeed = (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);
        this.isLeader = (indexInSpecies % 25 === 0);
    }

    update(state: SimulationState, time: number) {
        if (!this.velocity) {
            this.velocity = new THREE.Vector3(0, 0, 1);
        }
        const prevX = this.position.x;
        const prevY = this.position.y;
        const prevZ = this.position.z;

        const sepWeight = (state && state.attributes && state.attributes[this.species])
            ? state.attributes[this.species].separationWeight
            : 3.5;
        let speedMult = state ? state.speedMultiplier : 1.0;
        if (state && state.microSurpriseType === 'speedSurge' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            speedMult *= 2.2;
        }

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.Serpent;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const total = this.totalInSpecies > 0 ? this.totalInSpecies : 100;
        const rawU = this.indexInSpecies / total;

        // Density gradient remapping: concentrate particles near center or smooth distribution
        const u = Math.sin(rawU * Math.PI * 0.5);

        // Smooth Ease-In and Ease-Out Quintic S-Curve morphing over 9.0 seconds
        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 9.0;
        const elapsed = Math.max(0.0, time - startTime);
        const p = Math.min(1.0, elapsed / duration);

        // Quintic Smoothstep S-Curve Ease-In & Ease-Out: 6p^5 - 15p^4 + 10p^3
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        // Compute current target point
        let [txCurr, tyCurr, tzCurr] = computeFormationPoint(formation, seed, u, time, this.species, this.indexInSpecies, sepWeight, speedMult, state);

        // If this boid is a stray, orbit freely in a halo
        if (this.isStray && p > 0.8) {
            const strayAngle = time * this.strayOrbitSpeed + this.noiseSeed;
            txCurr = this.strayOrbitRadius * Math.cos(strayAngle);
            tyCurr = Math.sin(strayAngle * 2.0) * 2.5 + (this.species - 1.5) * 1.5;
            tzCurr = this.strayOrbitRadius * Math.sin(strayAngle);
        }

        let tx = txCurr, ty = tyCurr, tz = tzCurr;

        // 100% C2-continuous Quintic S-Curve target morphing across the 9.0s transition
        if (state && state.prevFormationMode !== undefined && p <= 1.0) {
            const prevSeed = state.prevFormationSeed !== undefined ? state.prevFormationSeed : seed;
            const [txPrev, tyPrev, tzPrev] = computeFormationPoint(
                state.prevFormationMode,
                prevSeed,
                u,
                time,
                this.species,
                this.indexInSpecies,
                sepWeight,
                speedMult,
                state
            );

            tx = txPrev + (txCurr - txPrev) * sCurve;
            ty = tyPrev + (tyCurr - tyPrev) * sCurve;
            tz = tzPrev + (tzCurr - tzPrev) * sCurve;
        }

        // Clamp the spring target to R=14
        const targetDist = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (targetDist > 14 && targetDist > 1e-6) {
            const invT = 14 / targetDist;
            tx *= invT;
            ty *= invT;
            tz *= invT;
        }

        // Ultra-gentle liquid spring attraction lerp (0.03 -> 0.06 steady state)
        const activeLerpRate = (state && state.prevFormationMode !== undefined && p < 1.0)
            ? 0.03 + 0.03 * sCurve
            : 0.06;

        let dx = (tx - this.position.x) * activeLerpRate;
        let dy = (ty - this.position.y) * activeLerpRate;
        let dz = (tz - this.position.z) * activeLerpRate;

        // Leader behavior: leader boids overshoot target slightly (12%)
        if (this.isLeader) {
            dx *= 1.12;
            dy *= 1.12;
            dz *= 1.12;
        }

        // Subtle organic 3D drift (0.015)
        const driftX = Math.sin(time * 1.5 + this.noiseSeed) * 0.015 * speedMult;
        const driftY = Math.cos(time * 1.2 + this.noiseSeed * 1.3) * 0.015 * speedMult;
        const driftZ = Math.sin(time * 1.8 + this.noiseSeed * 0.7) * 0.015 * speedMult;

        // Silky smooth speed cap (0.04 at start -> 0.06 steady state)
        const activeMaxDisp = (state && state.prevFormationMode !== undefined && p < 1.0)
            ? (0.04 + 0.02 * sCurve) * speedMult
            : 0.06 * speedMult;

        // Desired velocity for this frame
        const targetVelX = dx + driftX;
        const targetVelY = dy + driftY;
        const targetVelZ = dz + driftZ;

        if (!this.velocity) {
            this.velocity = new THREE.Vector3(targetVelX, targetVelY, targetVelZ);
        }

        // 1. Calculate Acceleration Vector
        let ax = targetVelX - this.velocity.x;
        let ay = targetVelY - this.velocity.y;
        let az = targetVelZ - this.velocity.z;

        // 2. Restrict max acceleration per frame (0.0025 * speedMult)
        const maxAccel = 0.0025 * speedMult;
        const accelMag = Math.sqrt(ax * ax + ay * ay + az * az);
        if (accelMag > maxAccel && accelMag > 1e-6) {
            const scale = maxAccel / accelMag;
            ax *= scale;
            ay *= scale;
            az *= scale;
        }

        // 3. Update velocity smoothly
        this.velocity.x += ax;
        this.velocity.y += ay;
        this.velocity.z += az;

        // 4. Strict speed cap
        const currentSpeed = this.velocity.length();
        if (currentSpeed > activeMaxDisp && currentSpeed > 1e-6) {
            this.velocity.multiplyScalar(activeMaxDisp / currentSpeed);
        }

        // 5. Position update
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        // Spherical boundary clamp (R_max = 14.0)
        const maxRadius = 14.0;
        const distFromCenter = Math.sqrt(
            this.position.x * this.position.x +
            this.position.y * this.position.y +
            this.position.z * this.position.z
        );
        if (distFromCenter > maxRadius && distFromCenter > 1e-6) {
            const inv = maxRadius / distFromCenter;
            this.position.x *= inv;
            this.position.y *= inv;
            this.position.z *= inv;
        }

        // Scalar velocity lerp
        const vx = this.position.x - prevX;
        const vy = this.position.y - prevY;
        const vz = this.position.z - prevZ;
        if (vx * vx + vy * vy + vz * vz > 1e-8) {
            this.velocity.x += (vx - this.velocity.x) * 0.25;
            this.velocity.y += (vy - this.velocity.y) * 0.25;
            this.velocity.z += (vz - this.velocity.z) * 0.25;
        }
    }
}

export interface FormationPhysicsProfile {
    lerpRate: number;      // How quickly boids snap to target curve
    noiseDrift: number;    // Subtle alive turbulence
    strayRatio: number;    // Percentage of loose aura particles (0.0 to 0.02)
    maxSpeedCap: number;   // Max displacement per tick
}

export function getFormationPhysicsProfile(formation: FormationMode): FormationPhysicsProfile {
    switch (formation) {
        // 1. ULTRA-TIGHT GEOMETRIC & CRYSTALLINE (0% Strays, Razor-Sharp Structure)
        case FormationMode.WireCube:
        case FormationMode.Tesseract4D:
        case FormationMode.DodecahedronShield:
        case FormationMode.StarPolygon:
        case FormationMode.DNALadder:
        case FormationMode.SaturnRings:
        case FormationMode.PulsingHeart:
        case FormationMode.DoubleHelix:
        case FormationMode.TripleHelix:
        case FormationMode.TrefoilKnot:
        case FormationMode.TorusKnot:
        case FormationMode.LissajousKnot:
        case FormationMode.KleinBottle4D:
        case FormationMode.CalabiYauManifold:
        case FormationMode.CliffordTorus:
        case FormationMode.GyroidMinimalSurface:
        case FormationMode.FerrisWheel:
        case FormationMode.HopfFibration:
        case FormationMode.AlienMothership:
            return { lerpRate: 0.12, noiseDrift: 0.003, strayRatio: 0.0, maxSpeedCap: 0.08 };

        // 2. ORGANIC BALANCED (Crisp silhouette with graceful aerodynamic breathing)
        case FormationMode.PhoenixWings:
        case FormationMode.JellyfishPulse:
        case FormationMode.BioMushroom:
        case FormationMode.CoralReef:
        case FormationMode.OuroborosSerpent:
        case FormationMode.DancingRibbon:
        case FormationMode.NautilusShell:
        case FormationMode.SpiderWeb:
        case FormationMode.HourglassVortex:
        case FormationMode.Spiral:
        case FormationMode.GeologicStrata:
        case FormationMode.TreeBranch:
        case FormationMode.Procedural:
            return { lerpRate: 0.08, noiseDrift: 0.008, strayRatio: 0.006, maxSpeedCap: 0.065 };

        // 3. FLUID / DYNAMIC LOOSE (Expansive cosmic & turbulent flow)
        case FormationMode.MurmurationFlow:
        case FormationMode.LightningBolt:
        case FormationMode.SupernovaBurst:
        case FormationMode.BigBangExpansion:
        case FormationMode.CollapsingSphere:
        case FormationMode.TornadoFunnel:
        case FormationMode.TsunamiWave:
        case FormationMode.KelvinHelmholtz:
        case FormationMode.BlackHoleJet:
        case FormationMode.RiverDelta:
        case FormationMode.LorenzAttractor:
        default:
            return { lerpRate: 0.06, noiseDrift: 0.015, strayRatio: 0.018, maxSpeedCap: 0.06 };
    }
}


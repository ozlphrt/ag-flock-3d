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
    Procedural = 30
}

export interface ProceduralGenome {
    k1: number; k2: number; k3: number; k4: number; k5: number; k6: number; k7: number; k8: number;
    r1: number; r2: number; r3: number;
    a1: number; a2: number; a3: number;
    phi1: number; phi2: number; phi3: number;
}

export interface MaterialSettings {
    roughness: number;
    metalness: number;
    wireframe: boolean;
    flatShading: boolean;
    emissiveIntensity: number;
}

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
        label: 'Soft Bioluminescent Glow',
        icon: '🌌',
        desc: 'Bioluminescent ambient glow shining through specular facets',
        settings: { roughness: 0.08, metalness: 0.85, wireframe: false, flatShading: true, emissiveIntensity: 0.95 }
    },
    {
        id: 4,
        label: 'Champagne Gold Mirror',
        icon: '🏆',
        desc: 'Polished golden mirror specularity with vivid studio highlights',
        settings: { roughness: 0.02, metalness: 0.96, wireframe: false, flatShading: true, emissiveIntensity: 0.65 }
    },
    {
        id: 5,
        label: 'Frost Crystal Shard',
        icon: '❄️',
        desc: 'Ice-cold platinum mirror with vivid luminous reflections',
        settings: { roughness: 0.04, metalness: 0.88, wireframe: false, flatShading: true, emissiveIntensity: 0.70 }
    },
    {
        id: 6,
        label: 'Glowing Cyber Crystal',
        icon: '💎',
        desc: 'High-tech cyber gemstone with vivid glowing specular reflections',
        settings: { roughness: 0.03, metalness: 0.94, wireframe: false, flatShading: true, emissiveIntensity: 0.85 }
    },
    {
        id: 7,
        label: 'Translucent Candy Glass',
        icon: '🍬',
        desc: 'Tasteful glossy candy glass catching sparkling studio reflections',
        settings: { roughness: 0.16, metalness: 0.72, wireframe: false, flatShading: true, emissiveIntensity: 0.15 }
    },
    {
        id: 8,
        label: 'Liquid Ruby Chrome',
        icon: '🔴',
        desc: 'Deep crimson metallic reflection with rich satin highlights',
        settings: { roughness: 0.12, metalness: 0.84, wireframe: false, flatShading: true, emissiveIntensity: 0.15 }
    },
    {
        id: 9,
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
    materialSettings: MaterialSettings;
    transitionStartTime?: number;
    transitionDuration?: number;
    currentTime?: number;
    boidShape?: number;
    materialPreset?: number;
    autoShape?: boolean;
    autoMaterial?: boolean;
    proceduralGenome?: ProceduralGenome;
    isCameraLocked?: boolean;
    lightIntensityMultiplier?: number;
    isInspecting?: boolean;
    prevFormationMode?: FormationMode;
    prevFormationSeed?: number;
    targetPopulation?: number;
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
    const ampMult = 0.32; // Ultra-compact scale for razor-sharp, 100% contained 3D architectural sculptures
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
    } else if (formation === FormationMode.Procedural && state && state.proceduralGenome) {
        const g = state.proceduralGenome;
        const th = u * Math.PI * 2.0;
        const wTime = time * 0.2 * speedMult;

        tx = (g.r1 * Math.cos(g.k1 * th + g.phi1) * Math.sin(g.k2 * th + wTime) + g.a1 * Math.cos(g.k3 * th)) * 0.4;
        ty = (g.r2 * Math.sin(g.k4 * th + g.phi2) * Math.cos(wTime) + g.a2 * Math.sin(g.k5 * th)) * 0.4;
        tz = (g.r3 * Math.sin(g.k6 * th + g.phi3) * Math.cos(g.k7 * th + wTime) + g.a3 * Math.cos(g.k8 * th)) * 0.4;
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

        // 4. Pairwise interactions with other blob centers!
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
        const speedMult = state ? state.speedMultiplier : 1.0;
        const formation = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.Serpent;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const total = this.totalInSpecies > 0 ? this.totalInSpecies : 100;
        const u = this.indexInSpecies / total;

        // Smooth Ease-In and Ease-Out Quintic S-Curve morphing over 9.0 seconds (silky, liquid formation morphing)
        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 9.0;
        const elapsed = Math.max(0.0, time - startTime);
        const p = Math.min(1.0, elapsed / duration);

        // Quintic Smoothstep S-Curve Ease-In & Ease-Out: 6p^5 - 15p^4 + 10p^3
        // Guarantees zero derivative at p=0 and p=1 with 100% continuous non-zero flight velocity!
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        // Compute current target point
        const [txCurr, tyCurr, tzCurr] = computeFormationPoint(formation, seed, u, time, this.species, this.indexInSpecies, sepWeight, speedMult, state);

        let tx = txCurr, ty = tyCurr, tz = tzCurr;

        // 100% C2-continuous Quintic S-Curve target morphing across the 9.0s transition.
        // At p=0, target equals old formation target continuously (zero start jump).
        // At p=1, target equals new formation target continuously (zero end jump at the 21s mark!).
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

        // Clamp the spring target to R=14 — the spring must NEVER pull toward a point outside the universe.
        // This is the root cause of streams: formation presets can exceed R=14, causing the spring to
        // fight the boundary clamp every frame and create visible streams of boids at the surface.
        const targetDist = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (targetDist > 14 && targetDist > 1e-6) {
            const invT = 14 / targetDist;
            tx *= invT;
            ty *= invT;
            tz *= invT;
        }

        // Ultra-gentle liquid spring attraction lerp (0.03 at transition start -> 0.06 steady state)
        // Lerp rate smoothly rises from 0.03 to 0.06 over 9.0 seconds, landing perfectly at 0.06 at p=1.0 (zero jump!)
        const activeLerpRate = (state && state.prevFormationMode !== undefined && p < 1.0)
            ? 0.03 + 0.03 * sCurve
            : 0.06;

        let dx = (tx - this.position.x) * activeLerpRate;
        let dy = (ty - this.position.y) * activeLerpRate;
        let dz = (tz - this.position.z) * activeLerpRate;

        // Subtle organic 3D drift (0.015) - continuous flight without distorting crisp 3D geometry
        const driftX = Math.sin(time * 1.5 + this.noiseSeed) * 0.015 * speedMult;
        const driftY = Math.cos(time * 1.2 + this.noiseSeed * 1.3) * 0.015 * speedMult;
        const driftZ = Math.sin(time * 1.8 + this.noiseSeed * 0.7) * 0.015 * speedMult;

        // Silky smooth speed cap (0.04 at start -> 0.06 steady state) - 100% continuous landing at p=1.0
        const activeMaxDisp = (state && state.prevFormationMode !== undefined && p < 1.0)
            ? (0.04 + 0.02 * sCurve) * speedMult
            : 0.06 * speedMult;

        // Target velocity desired for this frame
        const targetVelX = dx + driftX;
        const targetVelY = dy + driftY;
        const targetVelZ = dz + driftZ;

        if (!this.velocity) {
            this.velocity = new THREE.Vector3(targetVelX, targetVelY, targetVelZ);
        }

        // 1. Calculate Acceleration Vector required to reach target velocity
        let ax = targetVelX - this.velocity.x;
        let ay = targetVelY - this.velocity.y;
        let az = targetVelZ - this.velocity.z;

        // 2. STRICTLY RESTRICT MASSIVE SPEED / ACCELERATION CHANGES
        // Capping max acceleration per frame to 0.0025 * speedMult guarantees zero velocity spikes or sudden yanks!
        const maxAccel = 0.0025 * speedMult;
        const accelMag = Math.sqrt(ax * ax + ay * ay + az * az);
        if (accelMag > maxAccel && accelMag > 1e-6) {
            const scale = maxAccel / accelMag;
            ax *= scale;
            ay *= scale;
            az *= scale;
        }

        // 3. Update boid velocity smoothly with physical momentum
        this.velocity.x += ax;
        this.velocity.y += ay;
        this.velocity.z += az;

        // 4. Strict absolute speed cap (activeMaxDisp)
        const currentSpeed = this.velocity.length();
        if (currentSpeed > activeMaxDisp && currentSpeed > 1e-6) {
            this.velocity.multiplyScalar(activeMaxDisp / currentSpeed);
        }

        // 5. Smooth position update from velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        // Hard Spherical Boundary Clamp (R_max = 14.0) — boids are instantly projected back to
        // the sphere surface if they escape. No soft pull, no gradual drift outside.
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

        // Scalar velocity lerp with ZERO heap allocations - seamless momentum flow!
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

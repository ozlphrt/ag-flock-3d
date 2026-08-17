import * as THREE from 'three';

// 4096-Entry High-Speed Cyclic Trigonometric Lookup Table for 60 FPS Swarm Vectorization
const MATH_TABLE_SIZE = 4096;
const MATH_RAD_TO_INDEX = MATH_TABLE_SIZE / (Math.PI * 2);
export const MATH_SINE_LUT = new Float32Array(MATH_TABLE_SIZE);
for (let i = 0; i < MATH_TABLE_SIZE; i++) {
    MATH_SINE_LUT[i] = Math.sin((i / MATH_TABLE_SIZE) * Math.PI * 2);
}

export function fastSin(rad: number): number {
    let idx = ((rad * MATH_RAD_TO_INDEX) % MATH_TABLE_SIZE + MATH_TABLE_SIZE) % MATH_TABLE_SIZE | 0;
    return MATH_SINE_LUT[idx];
}

export function fastCos(rad: number): number {
    let idx = (((rad * MATH_RAD_TO_INDEX + (MATH_TABLE_SIZE / 4)) % MATH_TABLE_SIZE + MATH_TABLE_SIZE) % MATH_TABLE_SIZE) | 0;
    return MATH_SINE_LUT[idx];
}

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
    SpiralTower = 0,
    ConicalHelix = 1,
    DoubleHelix = 2,
    TripleHelix = 3,
    DNALadder = 4,
    TrefoilKnot = 5,
    TorusKnot = 6,
    FigureEightKnot = 7,
    CinqfoilKnot = 8,
    SeptafoilKnot = 9,
    LotusBlossom = 10,
    SolarFlareArch = 11,
    LorenzAttractor = 12,
    GyroidMinimalSurface = 13,
    KleinBottle4D = 14,
    CliffordTorus = 15,
    HopfFibration = 16,
    CalabiYauManifold = 17,
    OuroborosSerpent = 18,
    DancingRibbon = 19,
    OlympicChain = 20,
    Procedural = 21
}

export const TOTAL_FORMATION_COUNT = 22;

export const FORMATION_PRESETS = [
    {
        id: FormationMode.SpiralTower,
        label: 'Spiral Tower',
        icon: '🌪️',
        desc: 'Ascending conical spiral with central vertical axial spine'
    },
    {
        id: FormationMode.ConicalHelix,
        label: 'Conical Helix',
        icon: '🌀',
        desc: 'Single clean wide ascending conical helical ribbon'
    },
    {
        id: FormationMode.DoubleHelix,
        label: 'Double Helix',
        icon: '🧬',
        desc: 'Canonical dual parallel helical strands'
    },
    {
        id: FormationMode.TripleHelix,
        label: 'Triple Helix',
        icon: '🧬',
        desc: 'Three parallel ascending helical streams'
    },
    {
        id: FormationMode.DNALadder,
        label: 'DNA Ladder',
        icon: '🧬',
        desc: 'Helical sugar-phosphate rails with periodic base-pair rungs'
    },
    {
        id: FormationMode.TrefoilKnot,
        label: 'Trefoil Knot',
        icon: '🎗️',
        desc: 'Continuous canonical (2,3) cloverleaf single streamline'
    },
    {
        id: FormationMode.TorusKnot,
        label: 'Torus Knot',
        icon: '🍩',
        desc: 'Continuous seamless (3,5) toroidal loop flow'
    },
    {
        id: FormationMode.FigureEightKnot,
        label: 'Figure-Eight Knot',
        icon: '♾️',
        desc: 'Canonical 4_1 single continuous prime knot'
    },
    {
        id: FormationMode.CinqfoilKnot,
        label: 'Cinqfoil Knot',
        icon: '⭐',
        desc: '5-Lobed continuous Torus (5,2) knot ribbon'
    },
    {
        id: FormationMode.SeptafoilKnot,
        label: 'Septafoil Knot',
        icon: '🌟',
        desc: '7-Point continuous stellar Torus (7,3) knot ribbon'
    },
    {
        id: FormationMode.LotusBlossom,
        label: 'Lotus Blossom',
        icon: '🪷',
        desc: '5-Petal blooming graceful floral arcs radiating upward'
    },
    {
        id: FormationMode.SolarFlareArch,
        label: 'Solar Flare Arch',
        icon: '☀️',
        desc: 'Smooth magnetic coronal loop arch'
    },
    {
        id: FormationMode.LorenzAttractor,
        label: 'Lorenz Butterfly',
        icon: '🦋',
        desc: 'Continuous dual-scroll chaotic butterfly wings'
    },
    {
        id: FormationMode.GyroidMinimalSurface,
        label: 'Gyroid Flow',
        icon: '🌊',
        desc: 'Triply periodic minimal surface continuous streamline'
    },
    {
        id: FormationMode.KleinBottle4D,
        label: 'Klein Bottle',
        icon: '♾️',
        desc: 'Continuous 4D topological self-contained immersion'
    },
    {
        id: FormationMode.CliffordTorus,
        label: 'Clifford Torus',
        icon: '💫',
        desc: 'Flat 4D hyper-torus stereographic projection'
    },
    {
        id: FormationMode.HopfFibration,
        label: 'Hopf Fiber Bundle',
        icon: '🫧',
        desc: 'Concentric Villarceau circular fiber streams'
    },
    {
        id: FormationMode.CalabiYauManifold,
        label: 'Calabi-Yau Bloom',
        icon: '🌌',
        desc: '6D String theory compactification projection'
    },
    {
        id: FormationMode.OuroborosSerpent,
        label: 'Ouroboros Dragon',
        icon: '🐉',
        desc: 'Coiling aerodynamic dragon loop'
    },
    {
        id: FormationMode.DancingRibbon,
        label: 'Dancing Ribbon',
        icon: '🎀',
        desc: 'Twisting closed 3D harmonic gymnast loop'
    },
    {
        id: FormationMode.OlympicChain,
        label: 'Olympic Chain',
        icon: '🔗',
        desc: '4 Interlocked clean circular rings'
    },
    {
        id: FormationMode.Procedural,
        label: 'Infinite Procedural',
        icon: '✨',
        desc: 'Harmonic Fourier superformula manifold generator'
    }
];

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
        label: 'Studio High-Contrast',
        ambientIntensity: 0.12,
        keyIntensity: 3.8,
        keyColor: '#ffffff',
        fillIntensity: 0.30,
        fillColor: '#1a2238',
        rimIntensity: 3.4,
        rimColor: '#e0f0ff',
        fogDensity: 0.003
    },
    {
        id: 1,
        label: 'Golden Hour',
        ambientIntensity: 0.14,
        keyIntensity: 3.9,
        keyColor: '#ffe090',
        fillIntensity: 0.35,
        fillColor: '#1e1430',
        rimIntensity: 3.2,
        rimColor: '#5090ff',
        fogDensity: 0.0035
    },
    {
        id: 2,
        label: 'Arctic Cold',
        ambientIntensity: 0.12,
        keyIntensity: 3.6,
        keyColor: '#d0e5ff',
        fillIntensity: 0.30,
        fillColor: '#0a1525',
        rimIntensity: 3.6,
        rimColor: '#ff9040',
        fogDensity: 0.004
    },
    {
        id: 3,
        label: 'Deep Sea Abyss',
        ambientIntensity: 0.10,
        keyIntensity: 3.4,
        keyColor: '#00e5ff',
        fillIntensity: 0.25,
        fillColor: '#020b18',
        rimIntensity: 3.8,
        rimColor: '#00ffaa',
        fogDensity: 0.006
    },
    {
        id: 4,
        label: 'Volcanic Magma',
        ambientIntensity: 0.12,
        keyIntensity: 4.2,
        keyColor: '#ff6820',
        fillIntensity: 0.28,
        fillColor: '#180408',
        rimIntensity: 3.5,
        rimColor: '#ffa040',
        fogDensity: 0.005
    },
    {
        id: 5,
        label: 'Nebula Violet',
        ambientIntensity: 0.12,
        keyIntensity: 3.8,
        keyColor: '#b060ff',
        fillIntensity: 0.30,
        fillColor: '#100520',
        rimIntensity: 3.6,
        rimColor: '#30ffb0',
        fogDensity: 0.004
    },
    {
        id: 6,
        label: 'Cinematic Noir',
        ambientIntensity: 0.08,
        keyIntensity: 3.6,
        keyColor: '#e8e8f8',
        fillIntensity: 0.20,
        fillColor: '#080812',
        rimIntensity: 3.5,
        rimColor: '#a0c0e0',
        fogDensity: 0.005
    },
    {
        id: 7,
        label: 'Solar Eclipse',
        ambientIntensity: 0.07,
        keyIntensity: 3.2,
        keyColor: '#ffffff',
        fillIntensity: 0.18,
        fillColor: '#04040a',
        rimIntensity: 4.5,
        rimColor: '#ffa820',
        fogDensity: 0.007
    }
];

export const COLOR_PALETTES = [
    ['#183024', '#3d6346', '#b8893d', '#f2cb7c'], // 1. Organic Forest & Moss
    ['#0c2133', '#2b6e94', '#d9643d', '#bce8e6'], // 2. Deep Ocean Ecosystem
    ['#162e24', '#265354', '#cb7a32', '#f5e4d0'], // 3. Nordic Fjord & Autumn Birch
    ['#1b1e2a', '#a3422a', '#e8894d', '#e0e5ef'], // 4. Volcanic Basalt & Warm Terracotta
    ['#4a2414', '#7a8c76', '#d69e60', '#faecc2'], // 5. Desert Canyon & Clay Sage
    ['#2c2438', '#345e3c', '#6884bf', '#cae0ad'], // 6. Alpine Meadow & Wild Violet
    ['#0c2647', '#225940', '#cf9963', '#a3b4cf'], // 7. Bioluminescent Deep Reef
    ['#293233', '#856149', '#de986e', '#f0ede6'], // 8. Sandstone & Coastal Mineral
    ['#29082a', '#612252', '#d67a96', '#f5be82'], // 9. Cosmic Amethyst & Rose Gold
    ['#071930', '#184775', '#7ca1c4', '#f06d48'], // 10. Deep Cobalt & Coral Sunset
    ['#18333b', '#258f82', '#e86a48', '#f5b573'], // 11. Terracotta & Emerald Lagoon
    ['#261f25', '#355f61', '#9868c7', '#8ed48c'], // 12. Twilight Lavender & Sage
    ['#1e2f42', '#584463', '#8ecff0', '#f06e73'], // 13. Icelandic Glacial Fjord
    ['#211929', '#4d323e', '#8a5f49', '#d1aa8c'], // 14. Earthy Obsidian & Smoked Amber
    ['#0c232b', '#0a6b6d', '#cf7b19', '#d6342b'], // 15. Volcanic Copper & Patina
    ['#2d1706', '#5e3818', '#996333', '#dbae85'], // 16. Ancient Teak & Sandstone
    ['#18210e', '#49542a', '#c7924e', '#fff6cc'], // 17. Olive Grove & Golden Barley
    ['#140402', '#7a1908', '#d64512', '#ffa33a']  // 18. Magma Obsidian & Crimson Amber
];

export const MATERIAL_PRESETS = [
    {
        id: 0,
        label: 'Vibrant Satin Porcelain',
        icon: '🍶',
        desc: 'Deep vibrant color saturation with a smooth delicate satin surface sheen',
        settings: { roughness: 0.28, metalness: 0.04, wireframe: false, flatShading: false, emissiveIntensity: 0.05 }
    },
    {
        id: 1,
        label: 'Candy Gloss Enamel',
        icon: '🍬',
        desc: 'Ultra-glossy automotive candy coat with vivid saturated base colors and crisp white highlights',
        settings: { roughness: 0.12, metalness: 0.06, wireframe: false, flatShading: false, emissiveIntensity: 0.08 }
    },
    {
        id: 2,
        label: 'Matte Velvet Clay',
        icon: '🎨',
        desc: 'Non-metallic pure matte finish that showcases 100% true, rich palette colors',
        settings: { roughness: 0.68, metalness: 0.0, wireframe: false, flatShading: false, emissiveIntensity: 0.02 }
    },
    {
        id: 3,
        label: 'Faceted Jewel Gem',
        icon: '💎',
        desc: 'Geometric crystalline facets with crisp highlights that let gemstone colors pop',
        settings: { roughness: 0.20, metalness: 0.10, wireframe: false, flatShading: true, emissiveIntensity: 0.10 }
    },
    {
        id: 4,
        label: 'Silicone Soft-Touch',
        icon: '🧽',
        desc: 'Smooth tactile matte finish with zero glare, displaying pure unmuted pigments',
        settings: { roughness: 0.78, metalness: 0.0, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 5,
        label: 'Pearlescent Luster',
        icon: '🦪',
        desc: 'Soft iridescent pearl luster with rich chromatic depth and gentle luminous rim glints',
        settings: { roughness: 0.24, metalness: 0.14, wireframe: false, flatShading: false, emissiveIntensity: 0.12 }
    },
    {
        id: 6,
        label: 'Frosted Glass Crystal',
        icon: '🧊',
        desc: 'Modern frosted geometric glass with brilliant saturated diffuse color tone',
        settings: { roughness: 0.35, metalness: 0.08, wireframe: false, flatShading: true, emissiveIntensity: 0.08 }
    },
    {
        id: 7,
        label: 'Polished Amber Resin',
        icon: '🍯',
        desc: 'Smooth deep resin with clear specular definition and luminous warm highlights',
        settings: { roughness: 0.16, metalness: 0.05, wireframe: false, flatShading: false, emissiveIntensity: 0.06 }
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
    isMaterialLocked?: boolean;
    isLightingLocked?: boolean;
    isShapeLocked?: boolean;
    paletteTransitionDuration?: number;
    cameraPresetIndex?: number;
    morphProgress?: number;
    isReady?: boolean;
    onInitialLoadComplete?: () => void;
    formationRadius?: number;
    speciesShapes?: [number, number, number, number];
    customFormationName?: string;
    customPaletteName?: string;
    customMaterialName?: string;
    customLightingName?: string;
    customShapeName?: string;
    bloomSettings?: { luminanceThreshold: number; radius: number; intensity: number; levels: number; };
    bloomPreset?: number;
    isBloomLocked?: boolean;
}

// Helper to convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
    h = (h % 360 + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// 1. Procedural Harmonic Superformula Manifold Generator
export function generateProceduralTopologySurprise(): { genome: ProceduralGenome; name: string } {
    const families: ('harmonic' | 'superformula' | 'branching')[] = ['harmonic', 'superformula', 'branching'];
    const family = families[Math.floor(Math.random() * families.length)];
    const seed = Math.floor(Math.random() * 9000 + 1000);

    const genome: ProceduralGenome = {
        family,
        k1: Math.floor(Math.random() * 6) + 1,
        k2: Math.floor(Math.random() * 6) + 1,
        k3: Math.floor(Math.random() * 6) + 1,
        k4: Math.floor(Math.random() * 6) + 1,
        k5: Math.floor(Math.random() * 6) + 1,
        k6: Math.floor(Math.random() * 6) + 1,
        k7: Math.floor(Math.random() * 6) + 1,
        k8: Math.floor(Math.random() * 6) + 1,
        r1: 3.0 + Math.random() * 4.0,
        r2: 2.0 + Math.random() * 3.0,
        r3: 3.0 + Math.random() * 4.0,
        a1: 1.0 + Math.random() * 2.0,
        a2: 1.0 + Math.random() * 2.0,
        a3: 1.0 + Math.random() * 2.0,
        phi1: Math.random() * Math.PI * 2,
        phi2: Math.random() * Math.PI * 2,
        phi3: Math.random() * Math.PI * 2,
        m: [3, 4, 5, 6, 7, 8, 12][Math.floor(Math.random() * 7)],
        n1: 0.3 + Math.random() * 1.5,
        n2: 0.3 + Math.random() * 1.5,
        n3: 0.3 + Math.random() * 1.5,
        a: 1.0,
        b: 1.0
    };

    const prefixes = ['Quantum', 'Hyper-Torus', 'Fourier', 'Cosmic', 'Superformula', 'Calabi-Yau', 'Harmonic', 'Nonlinear'];
    const suffixes = ['Lattice', 'Nexus', 'Manifold', 'Vortex', 'Knot', 'Bloom', 'Matrix', 'Filament'];
    const pName = `✨ ${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]} #${seed}`;

    return { genome, name: pName };
}

// 2. Infinite Procedural Harmonic Palette Generator
export function generateProceduralPaletteSurprise(): { colors: [string, string, string, string]; name: string } {
    const modes = ['golden', 'analogous', 'triadic', 'cyber'];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const baseHue = Math.floor(Math.random() * 360);
    const seed = Math.floor(Math.random() * 900 + 100);

    let colors: [string, string, string, string];
    let name = '';

    if (mode === 'golden') {
        // Golden Ratio Angle (137.5 deg)
        colors = [
            hslToHex(baseHue, 92, 60),
            hslToHex(baseHue + 137.5, 86, 58),
            hslToHex(baseHue + 275.0, 94, 62),
            hslToHex(baseHue + 52.5, 90, 65)
        ];
        name = `✨ Golden Ratio Harmony #${seed}`;
    } else if (mode === 'analogous') {
        colors = [
            hslToHex(baseHue, 95, 62),
            hslToHex(baseHue + 32, 90, 58),
            hslToHex(baseHue + 64, 88, 64),
            hslToHex(baseHue + 180, 95, 70) // Complementary accent punch
        ];
        name = `✨ Analogous Aurora #${seed}`;
    } else if (mode === 'triadic') {
        colors = [
            hslToHex(baseHue, 90, 58),
            hslToHex(baseHue + 120, 95, 62),
            hslToHex(baseHue + 240, 90, 60),
            hslToHex(baseHue + 60, 95, 68)
        ];
        name = `✨ Triadic Prism #${seed}`;
    } else {
        // Cyber Iridescence
        colors = [
            hslToHex(baseHue, 100, 60),
            hslToHex(baseHue + 180, 100, 65),
            hslToHex(baseHue + 90, 90, 55),
            hslToHex(baseHue + 270, 95, 72)
        ];
        name = `✨ Cyber Iridescence #${seed}`;
    }

    return { colors, name };
}

// 3. Infinite Procedural Physical PBR Material Generator
export function generateProceduralMaterialSurprise(): { settings: MaterialSettings; name: string } {
    const isFaceting = Math.random() > 0.45;
    const roughness = Number((Math.random() * 0.90 + 0.02).toFixed(2));
    const metalness = Number((Math.random() * 0.95 + 0.02).toFixed(2));
    const emissiveIntensity = Number((Math.random() * 0.85 + 0.05).toFixed(2));

    const settings: MaterialSettings = {
        roughness,
        metalness,
        wireframe: false,
        flatShading: isFaceting,
        emissiveIntensity
    };

    const adjectives = ['Liquid', 'Luminescent', 'Anisotropic', 'Iridescent', 'Velvet', 'Galvanized', 'Frosted', 'Hyper-Gloss'];
    const nouns = ['Chrome', 'Titanium', 'Obsidian', 'Opal', 'Ceramic', 'Polymer', 'Resin', 'Crystal'];
    const name = `✨ ${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;

    return { settings, name };
}

// 4. Infinite Procedural Studio Lighting Generator
export function generateProceduralLightingSurprise(): LightingProfile {
    const keyHue = Math.floor(Math.random() * 360);
    const rimHue = (keyHue + 150 + Math.random() * 60) % 360;
    const fillHue = (keyHue + 180) % 360;

    const names = ['Neon Cyber-Dawn', 'Solar Eclipse Studio', 'Bioluminescent Trench', 'Prismatic Twilight', 'Quantum Horizon'];
    const label = `✨ ` + names[Math.floor(Math.random() * names.length)] + ` #${Math.floor(Math.random() * 900 + 100)}`;

    return {
        id: -1,
        label,
        ambientIntensity: Number((0.45 + Math.random() * 0.35).toFixed(2)),
        keyIntensity: Number((2.2 + Math.random() * 1.8).toFixed(2)),
        keyColor: hslToHex(keyHue, 80, 75),
        fillIntensity: Number((0.5 + Math.random() * 0.5).toFixed(2)),
        fillColor: hslToHex(fillHue, 60, 65),
        rimIntensity: Number((1.8 + Math.random() * 1.8).toFixed(2)),
        rimColor: hslToHex(rimHue, 90, 80),
        fogDensity: Number((0.002 + Math.random() * 0.004).toFixed(4))
    };
}

// 5. Infinite Procedural 4-Species Shape Hybridization (Ico-Sphere dominant)
export function generateProceduralShapeSurprise(): { shapes: [number, number, number, number]; name: string } {
    const pool = [0, 0, 0, 1, 2, 3];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const shapes: [number, number, number, number] = [shuffled[0], shuffled[1], shuffled[2], shuffled[3]];
    const names = ['Ico-Sphere', 'Gemstone', 'Stealth Jet', 'Delta Wing'];
    const name = `✨ Hybrid [${names[shapes[0]] || 'Ico-Sphere'}, ${names[shapes[1]] || 'Ico-Sphere'}, ${names[shapes[2]] || 'Gemstone'}, ${names[shapes[3]] || 'Stealth Jet'}]`;
    return { shapes, name };
}


const DEFAULT_OUT_PT: [number, number, number] = [0, 0, 0];

export function computeFormationPoint(
    formation: FormationMode,
    seed: number,
    u: number,
    time: number,
    species: number,
    indexInSpecies: number,
    sepWeight: number,
    speedMult: number,
    state: SimulationState,
    out?: Float32Array | number[]
): [number, number, number] | Float32Array | number[] {
    let tx = 0, ty = 0, tz = 0;

    if (formation === FormationMode.SpiralTower) {
        // --- 0. Spiral Tower: Ascending Conical Spiral with Central Vertical Axial Spine ---
        if (u < 0.15) {
            // Central vertical spine axis
            tx = 0;
            ty = (u / 0.15 - 0.5) * 12.0;
            tz = 0;
        } else {
            const segU = (u - 0.15) / 0.85;
            const theta = segU * 8.0 * Math.PI + time * 0.5 * speedMult + (species * Math.PI * 0.5);
            const r = 1.6 + 2.8 * segU; // Conical widening from bottom to top
            tx = r * fastCos(theta);
            ty = (segU - 0.5) * 12.0;
            tz = r * fastSin(theta);
        }
    } else if (formation === FormationMode.ConicalHelix) {
        // --- 1. Conical Helix: Single Clean Wide Ascending Conical Helical Ribbon ---
        const h = (u - 0.5) * 11.5;
        const theta = u * 9.0 * Math.PI + time * 0.45 * speedMult;
        const r = 1.8 + 2.4 * u;
        tx = r * fastCos(theta);
        ty = h;
        tz = r * fastSin(theta);
    } else if (formation === FormationMode.DoubleHelix) {
        // --- 2. Double Helix: Canonical Dual Parallel Helical Strands ---
        const h = (u - 0.5) * 11.5;
        const theta = u * 6.0 * Math.PI + time * 0.5 * speedMult + ((species % 2) * Math.PI);
        const r = 3.6;
        tx = r * fastCos(theta);
        ty = h;
        tz = r * fastSin(theta);
    } else if (formation === FormationMode.TripleHelix) {
        // --- 3. Triple Helix: Three Parallel Ascending Helical Streams ---
        const h = (u - 0.5) * 11.5;
        const theta = u * 6.0 * Math.PI + time * 0.5 * speedMult + ((species % 3) * (Math.PI * 2.0 / 3.0));
        const r = 3.6;
        tx = r * fastCos(theta);
        ty = h;
        tz = r * fastSin(theta);
    } else if (formation === FormationMode.DNALadder) {
        // --- 4. DNA Ladder: Double Helix Rails with Base-Pair Horizontal Rungs ---
        const h = (u - 0.5) * 11.5;
        const isRung = (indexInSpecies % 8 === 0);
        if (isRung) {
            const theta = u * 6.0 * Math.PI + time * 0.5 * speedMult;
            const rungProg = (indexInSpecies % 32) / 32.0 - 0.5;
            tx = rungProg * 7.2 * fastCos(theta);
            ty = h;
            tz = rungProg * 7.2 * fastSin(theta);
        } else {
            const theta = u * 6.0 * Math.PI + time * 0.5 * speedMult + ((species % 2) * Math.PI);
            tx = 3.6 * fastCos(theta);
            ty = h;
            tz = 3.6 * fastSin(theta);
        }
    } else if (formation === FormationMode.TrefoilKnot) {
        // --- 5. Trefoil Knot: Continuous Canonical (2,3) Cloverleaf Single Streamline ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        tx = (fastSin(t) + 2.0 * fastSin(2.0 * t)) * 1.6;
        ty = (fastCos(t) - 2.0 * fastCos(2.0 * t)) * 1.6;
        tz = -fastSin(3.0 * t) * 2.2;
    } else if (formation === FormationMode.TorusKnot) {
        // --- 6. Torus Knot: Continuous Seamless (3,5) Toroidal Loop ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const r = fastCos(5.0 * t) * 1.6 + 4.0;
        tx = r * fastCos(3.0 * t);
        ty = fastSin(5.0 * t) * 2.2;
        tz = r * fastSin(3.0 * t);
    } else if (formation === FormationMode.FigureEightKnot) {
        // --- 7. Figure-Eight Knot: Canonical 4_1 Figure-Eight Continuous Knot ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const r = 2.8 + 1.3 * fastCos(2.0 * t);
        tx = r * fastCos(3.0 * t) * 1.3;
        ty = r * fastSin(3.0 * t) * 1.3;
        tz = 2.4 * fastSin(4.0 * t);
    } else if (formation === FormationMode.CinqfoilKnot) {
        // --- 8. Cinqfoil Knot: 5-Lobed Continuous Torus (5,2) Knot Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.32 * speedMult;
        const r = 3.6 + 1.5 * fastCos(5.0 * t);
        tx = r * fastCos(2.0 * t);
        ty = fastSin(5.0 * t) * 2.2;
        tz = r * fastSin(2.0 * t);
    } else if (formation === FormationMode.SeptafoilKnot) {
        // --- 9. Septafoil Knot: 7-Point Continuous Stellar Torus (7,3) Knot Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.28 * speedMult;
        const r = 3.8 + 1.6 * fastCos(7.0 * t);
        tx = r * fastCos(3.0 * t);
        ty = fastSin(7.0 * t) * 2.2;
        tz = r * fastSin(3.0 * t);
    } else if (formation === FormationMode.LotusBlossom) {
        // --- 10. Lotus Blossom: 5-Petal Blooming Graceful Floral Arcs Radiating Upward ---
        const petal = (species + Math.floor(u * 5)) % 5;
        const theta = petal * (Math.PI * 2.0 / 5.0) + time * 0.2 * speedMult;
        const s = (u * 5.0) % 1.0;
        const y = (s - 0.5) * 8.5 + s * s * 2.5;
        const r = s * 5.5 + fastSin(s * Math.PI) * 1.0;
        tx = r * fastCos(theta);
        ty = y;
        tz = r * fastSin(theta);
    } else if (formation === FormationMode.SolarFlareArch) {
        // --- 11. Solar Flare Arch: Smooth Magnetic Coronal Loop Arch ---
        const s = (u - 0.5) * Math.PI;
        tx = 5.2 * fastSin(s);
        ty = 4.6 * fastCos(s) - 1.2;
        tz = fastSin(s * 2.0) * 1.6;
    } else if (formation === FormationMode.LorenzAttractor) {
        // --- 12. Lorenz Butterfly: Continuous Dual-Scroll Chaotic Butterfly Wings ---
        const t = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const s = fastSin(t);
        tx = s * 4.4;
        ty = fastCos(t) * 3.8;
        tz = (s > 0 ? 1 : -1) * (4.2 - Math.abs(s) * 2.6);
    } else if (formation === FormationMode.GyroidMinimalSurface) {
        // --- 13. Gyroid Flow: Smooth Triply Periodic Minimal Surface Streamline ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        tx = (fastSin(t) * fastCos(t * 1.5) + fastCos(t * 0.5)) * 2.8;
        ty = (fastSin(t * 1.5) * fastCos(t * 0.5) + fastCos(t)) * 2.8;
        tz = (fastSin(t * 0.5) * fastCos(t) + fastCos(t * 1.5)) * 2.8;
    } else if (formation === FormationMode.KleinBottle4D) {
        // --- 14. Klein Bottle: Smooth 4D Immersion Loop ---
        const ku = u * Math.PI * 2.0 + time * 0.25 * speedMult;
        const kv = (((indexInSpecies % 60) / 60.0) * Math.PI * 2.0);
        const rk = 4.0 * (1.0 - fastCos(ku) * 0.5);
        const kx = (rk + fastCos(ku * 0.5) * fastSin(kv) - fastSin(ku * 0.5) * fastSin(2.0 * kv)) * fastCos(ku);
        const ky = (rk + fastCos(ku * 0.5) * fastSin(kv) - fastSin(ku * 0.5) * fastSin(2.0 * kv)) * fastSin(ku);
        const kz = (fastSin(ku * 0.5) * fastSin(kv) + fastCos(ku * 0.5) * fastSin(2.0 * kv)) * 2.2;
        tx = kx * 0.75;
        ty = ky * 0.75;
        tz = kz * 0.75;
    } else if (formation === FormationMode.CliffordTorus) {
        // --- 15. Clifford Torus: Flat 4D Hyper-Torus Stereographic Projection ---
        const thC = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const phiC = (species * (Math.PI / 2.0));
        tx = 4.2 * fastCos(thC);
        ty = 4.2 * fastSin(thC);
        tz = 2.4 * fastSin(phiC);
    } else if (formation === FormationMode.HopfFibration) {
        // --- 16. Hopf Fiber Bundle: Concentric Villarceau Circular Fiber Streams ---
        const theta = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const phi = species * (Math.PI * 0.5);
        const rHopf = 3.5 + 1.2 * fastCos(phi);
        tx = rHopf * fastCos(theta);
        ty = 1.8 * fastSin(phi);
        tz = rHopf * fastSin(theta);
    } else if (formation === FormationMode.CalabiYauManifold) {
        // --- 17. Calabi-Yau Bloom: 6D String Theory Compactification Projection ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        tx = (fastCos(t) + 0.5 * fastCos(3.0 * t)) * 3.2;
        ty = (fastSin(t) - 0.5 * fastSin(3.0 * t)) * 3.2;
        tz = fastSin(2.0 * t + species * Math.PI * 0.5) * 2.5;
    } else if (formation === FormationMode.OuroborosSerpent) {
        // --- 18. Ouroboros Dragon: Coiling Aerodynamic Dragon Loop ---
        const ringAngle = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const spineWave = fastSin(u * 10.0 - time * 2.0) * 0.45;
        const baseR = 4.2 + (species - 1.5) * 0.35;
        tx = (baseR + spineWave) * fastCos(ringAngle);
        ty = fastSin(u * 7.0 + time) * 0.7;
        tz = (baseR + spineWave) * fastSin(ringAngle);
    } else if (formation === FormationMode.DancingRibbon) {
        // --- 19. Dancing Ribbon: Twisting Closed 3D Harmonic Gymnast Loop ---
        const ribT = (u - 0.5) * 11.0;
        const ribWave = ribT * 0.7 - time * 0.8 * speedMult;
        const ribbonWidth = (indexInSpecies % 2 === 0 ? 1 : -1) * 0.85;
        const twistAngle = ribT * 0.9 + time * 0.5;
        const rx = fastSin(ribWave) * 3.2;
        const ry = ribT * 0.85 + fastCos(ribWave) * 1.2;
        const rz = fastCos(ribWave) * 3.0;
        tx = rx + fastCos(twistAngle) * ribbonWidth;
        ty = ry;
        tz = rz + fastSin(twistAngle) * ribbonWidth;
    } else if (formation === FormationMode.OlympicChain) {
        // --- 20. Olympic Chain: 4 Interlocked Clean Circular Rings ---
        const ringK = species;
        const ringTheta = ringK * (Math.PI * 0.5) + time * 0.25 * speedMult;
        const cx = 3.4 * fastCos(ringTheta);
        const cz = 3.4 * fastSin(ringTheta);
        const cy = ((ringK % 2 === 0) ? 0.6 : -0.6);
        const tau = u * Math.PI * 2.0 + time * 0.6;
        const cosTau = fastCos(tau), sinTau = fastSin(tau);
        const cosTh = fastCos(ringTheta), sinTh = fastSin(ringTheta);
        tx = cx + (2.0 * cosTau * (-sinTh) + 0.5 * sinTau * cosTh);
        ty = cy + 2.0 * sinTau;
        tz = cz + (2.0 * cosTau * cosTh + 0.5 * sinTau * sinTh);
    } else if (formation === FormationMode.Procedural && state && state.proceduralGenome) {
        const g = state.proceduralGenome;
        const th = u * Math.PI * 2.0;
        const wTime = time * 0.2 * speedMult;

        if (g.family === 'superformula') {
            const m = g.m || 6;
            const n1 = g.n1 || 1.0, n2 = g.n2 || 1.0, n3 = g.n3 || 1.0;
            const a = g.a || 1.0, b = g.b || 1.0;
            const t1 = Math.pow(Math.abs(fastCos(m * th / 4) / a), n2);
            const t2 = Math.pow(Math.abs(fastSin(m * th / 4) / b), n3);
            const sfR = Math.pow(t1 + t2, -1 / n1) * 0.4;
            const h = (species - 1.5) * 1.8 + fastSin(th * 3.0 + wTime) * 0.8;

            tx = sfR * fastCos(th + wTime) * 3.5;
            ty = h;
            tz = sfR * fastSin(th + wTime) * 3.5;
        } else if (g.family === 'branching') {
            const segment = Math.floor(u * (g.k1 || 4));
            const segT = (u * (g.k1 || 4)) % 1.0;
            const angle = (segment / (g.k1 || 4)) * Math.PI * 2.0 + wTime;
            const r = segT * (g.r1 || 8.0) * 0.35;

            tx = r * fastCos(angle + fastSin(segT * 3.0) * 0.4);
            ty = (segT - 0.5) * 6.0 + fastSin(angle * 2.0) * 0.5;
            tz = r * fastSin(angle + fastCos(segT * 3.0) * 0.4);
        } else {
            // Fourier Harmonic family
            tx = (g.r1 * fastCos(g.k1 * th + g.phi1) * fastSin(g.k2 * th + wTime) + g.a1 * fastCos(g.k3 * th)) * 0.4;
            ty = (g.r2 * fastSin(g.k4 * th + g.phi2) * fastCos(wTime) + g.a2 * fastSin(g.k5 * th)) * 0.4;
            tz = (g.r3 * fastSin(g.k6 * th + g.phi3) * fastCos(g.k7 * th + wTime) + g.a3 * fastCos(g.k8 * th)) * 0.4;
        }
    } else {
        // Default Harmonic Torus stream
        const p = 2, q = 3;
        const t = u * 2.0 * Math.PI + time * 0.25 * speedMult + (species * 0.15);
        const r = fastCos(q * t) * 1.8 + 4.2;
        tx = r * fastCos(p * t);
        ty = fastSin(q * t) * 2.4 + (species - 1.5) * 0.5;
        tz = r * fastSin(p * t);
    }

    if (out) {
        out[0] = tx; out[1] = ty; out[2] = tz;
        return out;
    }
    return [tx, ty, tz];
}

export interface FormationPhysicsProfile {
    lerpRate: number;
    noiseDrift: number;
    strayRatio: number;
    maxSpeedCap: number;
    volThickness: number;
}

export function getFormationPhysicsProfile(formation: FormationMode): FormationPhysicsProfile {
    switch (formation) {
        // 1. TIGHT MATHEMATICAL CURVES & HELICES
        case FormationMode.SpiralTower:
        case FormationMode.ConicalHelix:
        case FormationMode.DoubleHelix:
        case FormationMode.TripleHelix:
        case FormationMode.DNALadder:
        case FormationMode.TrefoilKnot:
        case FormationMode.TorusKnot:
        case FormationMode.FigureEightKnot:
        case FormationMode.CinqfoilKnot:
        case FormationMode.SeptafoilKnot:
        case FormationMode.LotusBlossom:
        case FormationMode.SolarFlareArch:
        case FormationMode.GyroidMinimalSurface:
        case FormationMode.KleinBottle4D:
        case FormationMode.CliffordTorus:
        case FormationMode.HopfFibration:
        case FormationMode.CalabiYauManifold:
        case FormationMode.OlympicChain:
            return { lerpRate: 0.14, noiseDrift: 0.0002, strayRatio: 0.0, maxSpeedCap: 0.095, volThickness: 0.06 };

        // 2. ORGANIC KINETIC LOOPS
        case FormationMode.OuroborosSerpent:
        case FormationMode.DancingRibbon:
        case FormationMode.Procedural:
            return { lerpRate: 0.10, noiseDrift: 0.001, strayRatio: 0.0, maxSpeedCap: 0.075, volThickness: 0.10 };

        // 3. CHAOTIC ATTRACTOR
        case FormationMode.LorenzAttractor:
        default:
            return { lerpRate: 0.10, noiseDrift: 0.0005, strayRatio: 0.0, maxSpeedCap: 0.085, volThickness: 0.08 };
    }
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
                const sp = (i % 4) as SpeciesType;
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
            this.u[i] = this.indexInSpecies[i] / tot;

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

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.SpiralTower;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const total = this.totalInSpecies > 0 ? this.totalInSpecies : 100;
        const rawU = this.indexInSpecies / total;

        // Density gradient remapping: concentrate particles near center or smooth distribution
        const u = fastSin(rawU * Math.PI * 0.5);

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
            txCurr = this.strayOrbitRadius * fastCos(strayAngle);
            tyCurr = fastSin(strayAngle * 2.0) * 2.5 + (this.species - 1.5) * 1.5;
            tzCurr = this.strayOrbitRadius * fastSin(strayAngle);
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

            tx = prevX + (txCurr - txPrev) * sCurve;
            ty = prevY + (tyCurr - tyPrev) * sCurve;
            tz = prevZ + (tzCurr - tzPrev) * sCurve;
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
        const driftX = fastSin(time * 1.5 + this.noiseSeed) * 0.015 * speedMult;
        const driftY = fastCos(time * 1.2 + this.noiseSeed * 1.3) * 0.015 * speedMult;
        const driftZ = fastSin(time * 1.8 + this.noiseSeed * 0.7) * 0.015 * speedMult;

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


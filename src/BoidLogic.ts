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
    CliffordTorus = 50,
    // --- Intertwined Multi-Helix & Braided Formations ---
    QuadHelixBraid = 51,
    ConcentricDualHelixSheath = 52,
    CaduceusVortex = 53,
    ToroidalHelixBraid = 54,
    TrefoilBraidedRibbon = 55,
    HexaHelixVortexTower = 56,
    MobiusHelixBraid = 57,
    LissajousIntertwinedKnot = 58,
    // --- Advanced Intertwined Loops, Knots & Links ---
    BorromeanRings = 59,
    FigureEightKnot = 60,
    CinqfoilKnot = 61,
    SeptafoilKnot = 62,
    OlympicChainLink = 63,
    TriquetraCelticBraid = 64,
    SolarFlareProminence = 65,
    WhiteheadLink = 66,
    QuatrefoilKnotBraid = 67,
    GrannyKnotBraid = 68
}

export const TOTAL_FORMATION_COUNT = 69;


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
        label: 'Moonlight Cyber',
        ambientIntensity: 0.09,
        keyIntensity: 3.5,
        keyColor: '#e0f0ff',
        fillIntensity: 0.22,
        fillColor: '#08101e',
        rimIntensity: 3.8,
        rimColor: '#00e0ff',
        fogDensity: 0.004
    },
    {
        id: 7,
        label: 'Sunrise Horizon',
        ambientIntensity: 0.14,
        keyIntensity: 3.8,
        keyColor: '#ffb888',
        fillIntensity: 0.32,
        fillColor: '#181228',
        rimIntensity: 3.4,
        rimColor: '#70a0ff',
        fogDensity: 0.0035
    },
    {
        id: 8,
        label: 'Neon Synthwave',
        ambientIntensity: 0.11,
        keyIntensity: 4.0,
        keyColor: '#00ffdd',
        fillIntensity: 0.28,
        fillColor: '#180028',
        rimIntensity: 4.0,
        rimColor: '#ff0088',
        fogDensity: 0.0045
    },
    {
        id: 9,
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
        id: 10,
        label: 'Bioluminescent',
        ambientIntensity: 0.09,
        keyIntensity: 3.8,
        keyColor: '#50ff90',
        fillIntensity: 0.24,
        fillColor: '#001810',
        rimIntensity: 3.8,
        rimColor: '#00f0ff',
        fogDensity: 0.006
    },
    {
        id: 11,
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
    ['#132559', '#3b8da0', '#f78d3b', '#ffea6c'], // 13. Solar Flare & Electric Sapphire
    ['#1e2f42', '#584463', '#8ecff0', '#f06e73'], // 14. Icelandic Glacial Fiord
    ['#033b52', '#007585', '#00bfa8', '#f2f7b8'], // 15. Bioluminescent Mint Reef
    ['#211929', '#4d323e', '#8a5f49', '#d1aa8c'], // 16. Earthy Obsidian & Smoked Amber
    ['#0c232b', '#0a6b6d', '#cf7b19', '#d6342b'], // 17. Volcanic Copper & Patina
    ['#2d1706', '#5e3818', '#996333', '#dbae85'], // 18. Ancient Teak & Sandstone
    ['#18210e', '#49542a', '#c7924e', '#fff6cc'], // 19. Olive Grove & Golden Barley
    ['#140402', '#7a1908', '#d64512', '#ffa33a'], // 20. Magma Obsidian & Crimson Amber (High-Contrast Strands)
    ['#191b29', '#63748e', '#d0d8e0', '#f01a34'], // 21. Nordic Winter & Ruby Spark
    ['#001e30', '#a81616', '#eb6800', '#ffd04d'], // 22. Celestial Sunspot & Midnight
    ['#0a001c', '#2b0054', '#7a22cc', '#ebb8ff'], // 23. Imperial Violet & Pearl Nebula
    ['#002b13', '#006100', '#30b800', '#d8ff40']  // 24. Hyper-Emerald & Lime Moss
];

export const MATERIAL_PRESETS = [
    {
        id: 0,
        label: 'Titanium Mirror',
        icon: '✨',
        desc: 'Refined metallic specular mirror with sharp geometric facets and gleaming highlights',
        settings: { roughness: 0.05, metalness: 0.92, wireframe: false, flatShading: true, emissiveIntensity: 0.25 }
    },
    {
        id: 1,
        label: 'Faceted Ceramic',
        icon: '🏺',
        desc: 'High-contrast glazed ceramic with sharp facet reflections and crisp specular sheen',
        settings: { roughness: 0.12, metalness: 0.35, wireframe: false, flatShading: true, emissiveIntensity: 0.08 }
    },
    {
        id: 2,
        label: 'Glossy Injection Polymer',
        icon: '🧩',
        desc: 'Vibrant glossy polymer with crisp directional glints and deep facet shadows',
        settings: { roughness: 0.14, metalness: 0.22, wireframe: false, flatShading: true, emissiveIntensity: 0.10 }
    },
    {
        id: 3,
        label: 'Champagne Gold',
        icon: '🏆',
        desc: 'Polished golden mirror specularity with vivid multi-angled studio highlights',
        settings: { roughness: 0.04, metalness: 0.95, wireframe: false, flatShading: true, emissiveIntensity: 0.30 }
    },
    {
        id: 4,
        label: 'Glass Crystal Glaze',
        icon: '🔮',
        desc: 'Brilliant glassy faceted sheen with rich tonal refraction highlights',
        settings: { roughness: 0.08, metalness: 0.40, wireframe: false, flatShading: true, emissiveIntensity: 0.15 }
    },
    {
        id: 5,
        label: 'Satin Anodized Alloy',
        icon: '⚡',
        desc: 'Smooth satin brushed alloy with strong directional highlights along edges',
        settings: { roughness: 0.22, metalness: 0.78, wireframe: false, flatShading: true, emissiveIntensity: 0.12 }
    },
    {
        id: 6,
        label: 'Faceted Gemstone',
        icon: '💎',
        desc: 'High-index faceted gemstone with razor-sharp specular glints',
        settings: { roughness: 0.03, metalness: 0.88, wireframe: false, flatShading: true, emissiveIntensity: 0.35 }
    },
    {
        id: 7,
        label: 'Cyber Obsidian Blade',
        icon: '🖤',
        desc: 'Deep dark obsidian with razor-sharp directional rim reflections',
        settings: { roughness: 0.15, metalness: 0.65, wireframe: false, flatShading: true, emissiveIntensity: 0.06 }
    },
    {
        id: 8,
        label: 'Satin Cyber Chrome',
        icon: '🛡️',
        desc: 'Satin cyber chrome finish with powerful rim definition',
        settings: { roughness: 0.08, metalness: 0.85, wireframe: false, flatShading: true, emissiveIntensity: 0.28 }
    },
    {
        id: 9,
        label: 'Carbon Composite',
        icon: '🏎️',
        desc: 'Stealth dark composite with crisp directional facet sheen',
        settings: { roughness: 0.20, metalness: 0.50, wireframe: false, flatShading: true, emissiveIntensity: 0.08 }
    },
    {
        id: 10,
        label: 'Frost Crystal Shard',
        icon: '❄️',
        desc: 'Ice-cold platinum mirror with brilliant luminous rim glints',
        settings: { roughness: 0.04, metalness: 0.90, wireframe: false, flatShading: true, emissiveIntensity: 0.32 }
    },
    {
        id: 11,
        label: 'Neon Quantum Crystal',
        icon: '💫',
        desc: 'Quantum crystal with high specular gloss and edge reflections',
        settings: { roughness: 0.05, metalness: 0.85, wireframe: false, flatShading: true, emissiveIntensity: 0.40 }
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

// 5. Infinite Procedural 4-Species Shape Hybridization
export function generateProceduralShapeSurprise(): { shapes: [number, number, number, number]; name: string } {
    const pool = [0, 1, 2, 3, 4, 5];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const shapes: [number, number, number, number] = [shuffled[0], shuffled[1], shuffled[2], shuffled[3]];
    const names = ['Arrowhead', 'Gem', 'Pyramid', 'Shield', 'Delta Wing', 'Shard'];
    const name = `✨ Hybrid [${names[shapes[0]]}, ${names[shapes[1]]}, ${names[shapes[2]]}, ${names[shapes[3]]}]`;
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
    const freqMult = 1.0;
    
    if (formation === FormationMode.Serpent) {
        // --- 0. Serpent Stream: Sleek Aerodynamic 3D Serpentine Ribbon ---
        const s = (u - 0.5) * 8.0;
        const wave = s * 0.75 - time * 0.8 * speedMult + (species * Math.PI / 4);
        const waveY = Math.sin(wave * 1.2) * 2.0 + Math.cos(s * 0.5) * 0.8;
        const waveZ = Math.sin(wave) * 2.2;
        tx = s * 1.4 + Math.cos(wave) * 0.8;
        ty = waveY + (species - 1.5) * 0.8;
        tz = waveZ;
    } else if (formation === FormationMode.Spiral) {
        // --- 1. Galactic Spiral: Multi-Arm Logarithmic Celestial Galaxy ---
        const arm = indexInSpecies % 3;
        const armOffset = arm * (Math.PI * 2.0 / 3.0);
        const theta = u * 4.0 * Math.PI + time * 0.45 * speedMult + armOffset;
        const radius = 1.0 + Math.pow(u, 0.8) * 6.0;
        const height = (u - 0.5) * 3.5 + Math.sin(theta * 2.0) * 0.6;
        tx = radius * Math.cos(theta);
        ty = height + (species - 1.5) * 0.6;
        tz = radius * Math.sin(theta);
    } else if (formation === FormationMode.DoubleHelix) {
        // --- 2. Double Helix: Intertwined Bio-Macromolecule Stream with Base-Pair Rungs ---
        const h = (u - 0.5) * 11.5;
        const theta = u * 8.0 * Math.PI + time * 0.6 * speedMult;
        const isRung = (indexInSpecies % 5 === 0);
        if (isRung) {
            // Horizontal bridging rung connecting the dual strands
            const rungT = ((indexInSpecies % 20) / 20.0 - 0.5) * 2.0; // [-1, 1]
            tx = (3.4 * rungT) * Math.cos(theta);
            ty = h;
            tz = (3.4 * rungT) * Math.sin(theta);
        } else {
            // Outer intertwined spiral sugar-phosphate backbones
            const strand = (species % 2 === 0) ? 0 : 1;
            const strandAngle = theta + (strand * Math.PI) + (species * 0.1);
            const r = 3.6 + Math.sin(h * 0.4 + time * 0.5) * 0.4;
            tx = r * Math.cos(strandAngle);
            ty = h;
            tz = r * Math.sin(strandAngle);
        }
    } else if (formation === FormationMode.TorusKnot) {
        // --- 3. Torus Knot Stream: Continuous Seamless Bio-Ring Flow ---
        const p = 2, q = 3;
        const t = u * 2.0 * Math.PI + time * 0.25 * speedMult + (species * 0.15);
        const r = Math.cos(q * t) * 1.8 + 4.2;
        tx = r * Math.cos(p * t);
        ty = Math.sin(q * t) * 2.4 + (species - 1.5) * 0.5;
        tz = r * Math.sin(p * t);
    } else if (formation === FormationMode.JellyfishPulse) {
        // --- 4. Jellyfish Veil: Deep-Sea Translucent Bell & Trailing Aquatic Tentacles ---
        const pulse = Math.sin(time * 1.2 * speedMult) * 0.25 + 1.0;
        if (u < 0.38) {
            const phi = (u / 0.38) * Math.PI * 0.48;
            const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + (time * 0.15);
            const bellR = Math.sin(phi) * 4.8 * pulse;
            tx = bellR * Math.cos(theta);
            ty = Math.cos(phi) * 2.8 + 1.5;
            tz = bellR * Math.sin(theta);
        } else {
            const tentacleIdx = indexInSpecies % 10;
            const tentacleAngle = (tentacleIdx / 10.0) * Math.PI * 2.0 + (species * 0.2);
            const lengthParam = ((u - 0.38) / 0.62) * 9.5;
            const wave = lengthParam * 0.7 - time * 1.6 * speedMult;
            const taper = 1.0 - (lengthParam / 11.0) * 0.4;
            tx = (Math.cos(tentacleAngle) * 2.6 + Math.sin(wave) * 0.9) * taper;
            ty = -lengthParam + 1.5;
            tz = (Math.sin(tentacleAngle) * 2.6 + Math.cos(wave) * 0.9) * taper;
        }
    } else if (formation === FormationMode.QuantumAtom) {
        // --- 5. Orbital Resonance: Smooth Harmonically Inclined Resonant Rings ---
        const orbitIdx = indexInSpecies % 3;
        const inc = (orbitIdx * Math.PI / 3.0) + (species * 0.1);
        const t = u * Math.PI * 2.0 + time * 0.6 * speedMult;
        const orbitR = 4.4 + Math.sin(t * 2.0) * 0.6;
        const rx = orbitR * Math.cos(t);
        const ry = Math.sin(t * 2.0) * 1.0;
        const rz = orbitR * Math.sin(t);
        tx = rx * Math.cos(inc) - ry * Math.sin(inc);
        ty = rx * Math.sin(inc) + ry * Math.cos(inc);
        tz = rz;
    } else if (formation === FormationMode.PhoenixWings) {
        // --- 6. Phoenix Wings: Soaring Undulating Biomorphic Wings ---
        const span = (u - 0.5) * 12.0;
        const flapPhase = time * 2.2 * speedMult - Math.abs(span) * 0.25 + (species * 0.2);
        const wingElev = Math.pow(Math.abs(span) * 0.16, 1.3) * Math.sin(flapPhase) * 2.2;
        tx = span * 1.25;
        ty = wingElev + Math.cos(span * 0.25) * 1.2 + (species - 1.5) * 0.6;
        tz = -Math.abs(span) * 0.45 + Math.sin(flapPhase + 0.4) * 1.2;
    } else if (formation === FormationMode.BlackHoleJet) {
        // --- 7. Celestial Vortex: Accretion Disk with Relativistic Polar Streams ---
        if (u < 0.65) {
            const diskU = u / 0.65;
            const diskTheta = diskU * Math.PI * 6.0 + time * 1.4 * speedMult + (species * 0.3);
            const diskR = 1.2 + Math.pow(diskU, 0.7) * 5.8;
            tx = diskR * Math.cos(diskTheta);
            ty = Math.sin(diskTheta * 2.0) * 0.3 + (species - 1.5) * 0.3;
            tz = diskR * Math.sin(diskTheta);
        } else {
            const jetU = (u - 0.65) / 0.35;
            const jetSign = (indexInSpecies % 2 === 0) ? 1 : -1;
            const jetH = jetU * 8.5 * jetSign;
            const jetTheta = jetU * Math.PI * 4.0 + time * 2.5 * speedMult;
            const jetR = 0.5 + jetU * 1.2;
            tx = jetR * Math.cos(jetTheta);
            ty = jetH;
            tz = jetR * Math.sin(jetTheta);
        }
    } else if (formation === FormationMode.HourglassVortex) {
        // --- 8. Hyperboloid Vortex: Spinning 3D Hourglass Tornado Stream ---
        const h = (u - 0.5) * 10.0;
        const waistR = Math.sqrt(1.8 + Math.pow(h * 0.3, 2));
        const theta = u * 8.0 * Math.PI + time * 0.7 * speedMult + (species * Math.PI / 4);
        tx = waistR * Math.cos(theta);
        ty = h;
        tz = waistR * Math.sin(theta);
    } else if (formation === FormationMode.LissajousKnot) {
        // --- 9. Lissajous Ribbon: Smooth Harmonic 3D Kinetic Ribbon Loop ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        tx = 4.2 * Math.sin(3 * t + (species * 0.3));
        ty = 3.2 * Math.sin(4 * t + 0.5);
        tz = 4.2 * Math.sin(5 * t + (species * 0.3));
    } else if (formation === FormationMode.Tesseract4D) {
        // --- 10. Bioluminescent Manta: Expansive Undulating Wings with Trailing Filaments ---
        const wingU = (u - 0.5) * 12.0;
        const waveZ = ((indexInSpecies % 50) / 50.0 - 0.3) * 9.0;
        const flap = Math.sin(time * 1.8 * speedMult - Math.abs(wingU) * 0.35) * Math.pow(Math.abs(wingU) * 0.18, 1.4) * 2.4;
        const bodyArch = Math.cos(wingU * 0.22) * 1.4 - (waveZ * 0.15);
        tx = wingU * 1.2;
        ty = flap + bodyArch + (species - 1.5) * 0.5;
        tz = waveZ * 1.2 - Math.abs(wingU) * 0.45;
    } else if (formation === FormationMode.TornadoFunnel) {
        // --- 11. Vortex Funnel: Aerodynamic Spinning Whirlwind Stream ---
        const h = (u - 0.5) * 9.5;
        const funnelR = Math.pow(u, 1.3) * 4.8 + 0.6;
        const theta = u * 12.0 * Math.PI + time * 1.6 * speedMult + (species * 0.4);
        tx = funnelR * Math.cos(theta);
        ty = h;
        tz = funnelR * Math.sin(theta);
    } else if (formation === FormationMode.NautilusShell) {
        // --- 12. Nautilus Spiral: Golden Ratio Logarithmic Shell Spiral ---
        const theta = u * 4.5 * Math.PI + time * 0.4 * speedMult;
        const r = 0.8 * Math.exp(0.22 * (u * 4.5 * Math.PI));
        tx = r * Math.cos(theta) * 0.35;
        ty = (u - 0.5) * 6.0 + Math.sin(theta) * 0.8;
        tz = r * Math.sin(theta) * 0.35;
    } else if (formation === FormationMode.BioMushroom) {
        // --- 13. Bio Mushroom: Fungal Umbrella Canopy with Falling Spore Streams ---
        if (u < 0.6) {
            const capU = u / 0.6;
            const phi = capU * Math.PI * 0.48;
            const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + (time * 0.12);
            const capR = Math.sin(phi) * 4.8;
            tx = capR * Math.cos(theta);
            ty = Math.cos(phi) * 2.2 + 1.8;
            tz = capR * Math.sin(theta);
        } else {
            const stemU = (u - 0.6) / 0.4;
            const stemR = 1.0 + Math.sin(stemU * 8.0 + time) * 0.15;
            const theta = (species * Math.PI / 2) + stemU * Math.PI * 2.0;
            tx = stemR * Math.cos(theta);
            ty = -stemU * 5.2 + 1.8;
            tz = stemR * Math.sin(theta);
        }
    } else if (formation === FormationMode.BeehiveSwarm) {
        // --- 14. Kelp Forest: Deep-Sea Swaying Kelp Forest Streamlines ---
        const stalk = indexInSpecies % 12;
        const stalkAngle = (stalk / 12.0) * Math.PI * 2.0;
        const stalkRadius = 2.0 + (stalk % 3) * 1.5;
        const h = (u - 0.5) * 10.0;
        const swayPhase = h * 0.5 - time * 0.9 * speedMult + stalk;
        const swayX = Math.sin(swayPhase) * (u * 2.4);
        const swayZ = Math.cos(swayPhase * 0.8) * (u * 2.4);
        tx = stalkRadius * Math.cos(stalkAngle) + swayX;
        ty = h;
        tz = stalkRadius * Math.sin(stalkAngle) + swayZ;
    } else if (formation === FormationMode.DodecahedronShield) {
        // --- 15. Oceanic Whirlpool: Inward Logarithmic Vortex Sink with Rolling Waves ---
        const vortexTheta = u * 8.0 * Math.PI + time * 1.2 * speedMult + (species * Math.PI / 4);
        const vortexR = 1.0 + Math.pow(u, 1.1) * 6.0;
        const vortexDepth = -Math.pow(1.0 - u, 2.0) * 4.8 + 1.0;
        const rimRoll = Math.sin(vortexTheta * 2.5 - time * 1.8) * (u * 0.8);
        tx = vortexR * Math.cos(vortexTheta);
        ty = vortexDepth + rimRoll;
        tz = vortexR * Math.sin(vortexTheta);
    } else if (formation === FormationMode.SaturnRings) {
        // --- 16. Saturn Rings: Planetary Sphere Core & Tilted Shimmering Rings ---
        if (u < 0.3) {
            const phi = Math.acos(2 * (u / 0.3) - 1);
            const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + time * 0.2;
            const coreR = 2.4;
            tx = coreR * Math.sin(phi) * Math.cos(theta);
            ty = coreR * Math.cos(phi);
            tz = coreR * Math.sin(phi) * Math.sin(theta);
        } else {
            const ringU = (u - 0.3) / 0.7;
            const ringR = 3.6 + ringU * 4.5;
            const ringTheta = ringU * Math.PI * 8.0 + time * 0.7 * speedMult + (species * 0.2);
            const rx = ringR * Math.cos(ringTheta);
            const ry = Math.sin(ringTheta * 2.0) * 0.15;
            const rz = ringR * Math.sin(ringTheta);
            const tilt = 32.0 * (Math.PI / 180.0);
            tx = rx;
            ty = ry * Math.cos(tilt) - rz * Math.sin(tilt);
            tz = ry * Math.sin(tilt) + rz * Math.cos(tilt);
        }
    } else if (formation === FormationMode.PulsingHeart) {
        // --- 17. Pulsing Heart: 3D Biomorphic Cardioid Heart Chamber ---
        const t = u * Math.PI * 2.0;
        const pulse = 1.0 + Math.sin(time * 1.6 * speedMult) * 0.10;
        const hx = 16.0 * Math.pow(Math.sin(t), 3);
        const hy = 13.0 * Math.cos(t) - 5.0 * Math.cos(2 * t) - 2.0 * Math.cos(3 * t) - Math.cos(4 * t);
        const hz = Math.sin(t * 3.0 + (species * Math.PI / 4)) * 1.5;
        tx = (hx * 0.28) * pulse;
        ty = (hy * 0.28) * pulse;
        tz = hz * pulse;
    } else if (formation === FormationMode.TsunamiWave) {
        // --- 18. Tsunami Wave: Surging 3D Breaking Ocean Curl ---
        const xVal = (u - 0.5) * 11.0;
        const curlPhase = xVal * 0.22 - time * 1.1 * speedMult;
        const waveY = Math.sin(curlPhase) * 2.6 + Math.pow(Math.max(0, Math.cos(curlPhase)), 2.2) * 3.4;
        tx = xVal;
        ty = waveY + (species - 1.5) * 0.6;
        tz = Math.cos(curlPhase) * 2.2;
    } else if (formation === FormationMode.SupernovaBurst) {
        // --- 19. Supernova Nebula: Cosmic Breathing Star Shockwave with Radial Streams ---
        const burstR = (Math.sin(time * 0.9 * speedMult + u * 3.0) * 0.25 + 0.75) * 5.0;
        const phi = Math.acos(2 * u - 1);
        const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + (species * 0.3);
        tx = burstR * Math.sin(phi) * Math.cos(theta);
        ty = burstR * Math.cos(phi);
        tz = burstR * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.CrystalPrism) {
        // --- 20. Mobius Ribbon: Sweeping Aerodynamic 3D Mobius Sash ---
        const mobT = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const mobW = ((indexInSpecies % 40) / 40.0 - 0.5) * 2.2;
        const mobR = 4.5 + mobW * Math.cos(mobT * 0.5);
        tx = mobR * Math.cos(mobT);
        ty = mobW * Math.sin(mobT * 0.5) * 2.2 + (species - 1.5) * 0.4;
        tz = mobR * Math.sin(mobT);
    } else if (formation === FormationMode.VirusCapsid) {
        // --- 21. Lotus Bloom: Sacred Multi-Layered Blooming Lotus Petals ---
        const petals = 8;
        const layer = Math.floor(u * 4);
        const layerU = (u * 4) % 1.0;
        const petalAngle = ((indexInSpecies * 137.5) * (Math.PI / 180.0)) + time * 0.15 * speedMult;
        const rBase = (layer + 1) * 1.3;
        const petalMod = Math.pow(Math.abs(Math.cos(petals * petalAngle * 0.5)), 0.7);
        const bloomBreath = 1.0 + Math.sin(time * 0.8 * speedMult - layer * 0.4) * 0.14;
        const lotusR = (rBase + petalMod * 1.8) * layerU * bloomBreath;
        const lotusH = Math.sin(layerU * Math.PI * 0.5) * (3.5 - layer * 0.7) - 1.4;
        tx = lotusR * Math.cos(petalAngle);
        ty = lotusH + (species - 1.5) * 0.35;
        tz = lotusR * Math.sin(petalAngle);
    } else if (formation === FormationMode.PlasmaArc) {
        // --- 22. Aurora Stream: Curving Aerodynamic Plasma Filament Ribbon ---
        const arcY = (u - 0.5) * 10.0;
        const wave = arcY * 0.5 - time * 1.2 * speedMult;
        tx = Math.sin(wave) * 3.2 + Math.cos(arcY * 0.3) * 0.8;
        ty = arcY;
        tz = Math.cos(wave) * 3.2 + (species - 1.5) * 0.6;
    } else if (formation === FormationMode.CoralReef) {
        // --- 23. Coral Fan: Graceful Fractal Marine Coral Fan ---
        const branch = indexInSpecies % 6;
        const branchAngle = (branch / 6.0) * Math.PI * 2.0 + (species * 0.2);
        const h = u * 8.5;
        const r = (Math.sin(h * 0.45) * 1.6 + 1.0);
        tx = Math.cos(branchAngle) * r + Math.sin(h * 0.7 + time * 0.6) * 0.6;
        ty = h - 4.2;
        tz = Math.sin(branchAngle) * r + Math.cos(h * 0.7 + time * 0.6) * 0.6;
    } else if (formation === FormationMode.VolcanicColumn) {
        // --- 24. Thermal Plume: Ascending Turbulent Thermal Vortex Plume ---
        const yVal = u * 9.5 - 4.5;
        const plumeR = (yVal > -2.0 ? ((yVal + 2.0) * 0.35 + 1.2) : 1.2);
        const theta = u * Math.PI * 8.0 + time * 1.3 * speedMult;
        tx = plumeR * Math.cos(theta);
        ty = yVal;
        tz = plumeR * Math.sin(theta);
    } else if (formation === FormationMode.AlienMothership) {
        // --- 25. Cosmic Disk: Undulating Galactic Disc with Central Energy Core ---
        const discR = 1.4 + u * 4.4;
        const theta = u * Math.PI * 6.0 + time * 0.5 * speedMult + (species * 0.3);
        tx = discR * Math.cos(theta);
        ty = Math.sin(discR * 0.9 - time * 1.2) * 0.6;
        tz = discR * Math.sin(theta);
    } else if (formation === FormationMode.TripleHelix) {
        // --- 26. Triple Helix: Tri-Strand Intertwined Braided Stream ---
        const strand = indexInSpecies % 3;
        const strandOffset = (strand * Math.PI * 2.0 / 3.0);
        const theta = u * 8.0 * Math.PI + time * 0.7 * speedMult + strandOffset;
        const h = (u - 0.5) * 10.5;
        const r = 3.3 + Math.sin(h * 0.3 + time * 0.5) * 0.4;
        tx = r * Math.cos(theta);
        ty = h;
        tz = r * Math.sin(theta);
    } else if (formation === FormationMode.FerrisWheel) {
        // --- 27. Galaxy Vortex: 4-Arm Logarithmic Spiral Galaxy with Density Waves ---
        const arm = indexInSpecies % 4;
        const armOffset = arm * (Math.PI * 0.5);
        const spiralTheta = u * 4.5 * Math.PI + time * 0.4 * speedMult + armOffset;
        const spiralR = 1.0 + Math.pow(u, 0.75) * 6.2;
        const densityWave = Math.sin(spiralTheta * 2.0 - time * 0.8) * 0.3;
        const coreH = Math.exp(-spiralR * 0.5) * 2.4 * (species - 1.5) * 0.6;
        tx = (spiralR + densityWave) * Math.cos(spiralTheta);
        ty = coreH + Math.sin(spiralTheta * 3.0 + time) * 0.35;
        tz = (spiralR + densityWave) * Math.sin(spiralTheta);
    } else if (formation === FormationMode.SpiderWeb) {
        // --- 28. Intertwined Infinity Loops: Dual Interlocking 3D Continuous Ribbon Orbits ---
        const loopChoice = species % 2; // Split species into 2 intertwined intersecting loops
        const loopPhase = u * Math.PI * 2.0 + (time * 0.45 * speedMult);
        const crossRadius = 0.35 + (species === 1 || species === 3 ? 0.15 : 0.0);
        const tubeOffset = ((indexInSpecies % 12) / 12.0) * Math.PI * 2.0;

        if (loopChoice === 0) {
            // Loop A: Flowing Primary Figure-8 Trefoil Ribbon
            const cx = Math.sin(loopPhase) * 3.4 + Math.sin(loopPhase * 2.0) * 1.6;
            const cy = Math.cos(loopPhase * 3.0) * 1.5;
            const cz = Math.cos(loopPhase) * 3.0 - Math.cos(loopPhase * 2.0) * 1.4;
            tx = cx + Math.cos(tubeOffset) * crossRadius;
            ty = cy + Math.sin(tubeOffset) * crossRadius;
            tz = cz + Math.sin(tubeOffset * 2.0) * crossRadius * 0.5;
        } else {
            // Loop B: Interlocking Orthogonal Ribbon threading through Loop A's center
            const cx = Math.cos(loopPhase) * 3.0 - Math.cos(loopPhase * 2.0) * 1.4;
            const cy = Math.sin(loopPhase * 3.0) * 1.5;
            const cz = Math.sin(loopPhase) * 3.4 + Math.sin(loopPhase * 2.0) * 1.6;
            tx = cx + Math.cos(tubeOffset) * crossRadius;
            ty = cy + Math.sin(tubeOffset) * crossRadius;
            tz = cz + Math.sin(tubeOffset * 2.0) * crossRadius * 0.5;
        }
    } else if (formation === FormationMode.NebulaCloud) {
        // --- 29. Cosmic Nebula: Organic Interstellar Gas Cloud ---
        const cloudRadius = 1.6 + u * 4.0;
        const theta = u * Math.PI * 8.0 + time * 0.3 * speedMult;
        const phi = (indexInSpecies * 137.5) * (Math.PI / 180.0);
        tx = cloudRadius * Math.sin(phi) * Math.cos(theta);
        ty = cloudRadius * Math.cos(phi) + Math.sin(theta * 1.8) * 1.5;
        tz = cloudRadius * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.WireCube) {
        // --- 31. Aurora Borealis Curtain: Billowing 3D Shimmering Light Curtains ---
        const s = (u - 0.5) * 12.0;
        const ribbonLayer = (species - 1.5) * 1.2;
        const wave1 = s * 0.45 - time * 0.6 * speedMult + ribbonLayer * 0.4;
        const wave2 = s * 0.90 + time * 0.4 * speedMult;
        const curtainH = ((indexInSpecies % 80) / 80.0) * 8.0 - 4.0;
        const curtainSway = Math.sin(wave1) * 3.4 + Math.sin(wave2) * 1.1;
        tx = s * 1.15 + Math.cos(wave1 * 0.8) * 0.8;
        ty = curtainH + Math.sin(s * 0.3 + time * 0.5) * 0.8;
        tz = curtainSway + ribbonLayer;
    } else if (formation === FormationMode.TreeBranch) {
        // --- 32. Tree of Life: Recursive 3D Branching Canopy ---
        if (u < 0.25) {
            const trunkT = u / 0.25;
            tx = Math.sin(trunkT * 2.0 + time * 0.4) * 0.25;
            ty = (trunkT - 0.5) * 4.0 - 2.0;
            tz = Math.cos(trunkT * 2.0 + time * 0.4) * 0.25;
        } else if (u < 0.65) {
            const boughIdx = indexInSpecies % 4;
            const boughAngle = (boughIdx / 4.0) * Math.PI * 2.0 + (species * 0.3);
            const boughT = (u - 0.25) / 0.40;
            const boughR = boughT * 3.5;
            const sway = Math.sin(time * 0.6 * speedMult + boughIdx) * 0.3;
            tx = Math.cos(boughAngle + sway) * boughR;
            ty = -1.0 + boughT * 3.2;
            tz = Math.sin(boughAngle + sway) * boughR;
        } else {
            const twigIdx = indexInSpecies % 12;
            const twigAngle = (twigIdx / 12.0) * Math.PI * 2.0 + (time * 0.1);
            const canopyR = 2.0 + ((u - 0.65) / 0.35) * 2.8;
            const phi = ((u - 0.65) / 0.35) * Math.PI * 0.4;
            tx = canopyR * Math.sin(phi) * Math.cos(twigAngle);
            ty = 2.0 + Math.cos(phi) * 2.5 + Math.sin(time * 0.8 + twigIdx) * 0.2;
            tz = canopyR * Math.sin(phi) * Math.sin(twigAngle);
        }
    } else if (formation === FormationMode.LightningBolt) {
        // --- 33. Fluid Streamline: High-Energy Aerodynamic Streamline Cascade ---
        const yNorm = (u - 0.5) * 10.0;
        const streamWave = Math.sin(yNorm * 0.6 - time * 1.5 * speedMult) * 2.8;
        const streamZ = Math.cos(yNorm * 0.5 + time * 1.2) * 2.4;
        tx = streamWave + (species - 1.5) * 0.8;
        ty = yNorm;
        tz = streamZ + (species - 1.5) * 0.8;
    } else if (formation === FormationMode.RiverDelta) {
        // --- 34. River Delta: Planar Branching Meandering Channels ---
        const xProgress = (u - 0.5) * 9.5;
        const spreadFactor = Math.max(0.25, (xProgress + 4.75) / 9.5);
        const channel = (indexInSpecies % 7) - 3;
        const meander = Math.sin(xProgress * 0.8 + channel + time * 0.5 * speedMult) * 0.8;
        tx = xProgress;
        ty = (species - 1.5) * 0.4 + Math.sin(xProgress * 1.2 + time) * 0.2;
        tz = channel * spreadFactor * 1.5 + meander * spreadFactor;
    } else if (formation === FormationMode.KelvinHelmholtz) {
        // --- 35. Kelvin-Helmholtz Billows: Fluid Shear Layer Rolling Vortices ---
        const xPos = (u - 0.5) * 10.5;
        const waveK = 1.1;
        const wavePhase = xPos * waveK - time * 1.2 * speedMult;
        const shearLayer = Math.sign(species - 1.5);
        const vortexRoll = Math.sin(wavePhase) * Math.exp(-Math.abs(Math.sin(wavePhase * 0.5)) * 0.45);
        tx = xPos;
        ty = vortexRoll * 2.8 + shearLayer * (0.8 + Math.cos(wavePhase) * 0.4);
        tz = Math.cos(wavePhase * 1.4) * 1.4 + (species - 1.5) * 0.5;
    } else if (formation === FormationMode.DNALadder) {
        // --- 36. Triple Braid Helix: 3-Strand Interlocking Chiral Braid Stream ---
        const strand = species % 3;
        const strandAngle = (strand * Math.PI * 2.0 / 3.0);
        const s = (u - 0.5) * 11.5;
        const braidPhase = s * 0.85 - time * 0.7 * speedMult + strandAngle;
        const braidR = 3.2 + Math.sin(s * 0.5 + time * 0.8) * 0.6;
        const crossKnot = Math.sin(braidPhase * 2.0) * 0.7;
        tx = (braidR + crossKnot) * Math.cos(braidPhase);
        ty = s * 1.1;
        tz = (braidR + crossKnot) * Math.sin(braidPhase);
    } else if (formation === FormationMode.StarPolygon) {
        // --- 37. Manta Ray Glide: Majestic Oceanic Ray Wings with Undulating Wave Flap ---
        const spanX = (u - 0.5) * 12.0;
        const chordZ = (((indexInSpecies % 60) / 60.0) - 0.4) * 8.0;
        const wingFlap = Math.sin(time * 1.8 * speedMult - Math.abs(spanX) * 0.35) * Math.pow(Math.abs(spanX) * 0.18, 1.4) * 2.2;
        const bodyCamber = Math.cos(spanX * 0.25) * 1.2 - Math.pow(chordZ * 0.15, 2.0);
        tx = spanX * 1.2;
        ty = wingFlap + bodyCamber + (species - 1.5) * 0.5;
        tz = chordZ * 1.3 - Math.abs(spanX) * 0.4;
    } else if (formation === FormationMode.CollapsingSphere) {
        // --- 38. Singularity Breath: Cosmic Breathing Sphere with Fluid Expansion ---
        const phi = Math.acos(2 * u - 1);
        const theta = (indexInSpecies * 137.5) * (Math.PI / 180.0) + time * 0.2;
        const collapseCycle = (Math.sin(time * 0.8 * speedMult) + 1.0) * 0.5;
        const breatheR = 1.0 + Math.pow(collapseCycle, 1.8) * 4.6;
        tx = breatheR * Math.sin(phi) * Math.cos(theta);
        ty = breatheR * Math.cos(phi);
        tz = breatheR * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.BigBangExpansion) {
        // --- 39. Cosmic Expansion: Radial Expanding Shockwave Shells ---
        const bangPhase = (time * 0.6 * speedMult + seed * 0.01) % 4.0;
        const radialDist = Math.pow(bangPhase / 4.0, 0.75) * 6.5 + 0.6;
        const phi = Math.acos(2 * u - 1);
        const theta = (indexInSpecies * 2.39996) + (species * Math.PI / 4);
        tx = radialDist * Math.sin(phi) * Math.cos(theta);
        ty = radialDist * Math.cos(phi);
        tz = radialDist * Math.sin(phi) * Math.sin(theta);
    } else if (formation === FormationMode.GeologicStrata) {
        // --- 40. Laminar Wave Sheets: Undulating Horizontal Fluid Current Sheets ---
        const layer = Math.floor(u * 4);
        const layerU = (u * 4) % 1.0;
        const planeX = (layerU - 0.5) * 9.0;
        const planeZ = (((indexInSpecies % 25) / 25.0) - 0.5) * 9.0;
        const topoRipple = Math.sin(planeX * 0.7 + time * 0.5) * Math.cos(planeZ * 0.7) * 0.7;
        const layerY = (layer - 1.5) * 2.0 + topoRipple;
        tx = planeX;
        ty = layerY;
        tz = planeZ;
    } else if (formation === FormationMode.TrefoilKnot) {
        // --- 41. Trefoil Harmonics: Continuous Canonical (2,3) Cloverleaf Streamline ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult + (species * 0.15);
        const kScale = 1.35;
        tx = (Math.sin(t) + 2 * Math.sin(2 * t)) * kScale;
        ty = (Math.cos(t) - 2 * Math.cos(2 * t)) * kScale;
        tz = (-Math.sin(3 * t) * 1.8) * kScale;
    } else if (formation === FormationMode.MurmurationFlow) {
        // --- 42. Starling Murmuration: Emergent Rolling Starling Swarm Cloud ---
        const swarmPhase = time * 0.5 * speedMult;
        const sx = Math.sin(u * 6.0 + swarmPhase) * 3.8 + Math.cos(time * 0.3 + species) * 1.4;
        const sy = Math.cos(u * 4.0 - swarmPhase * 0.8) * 2.8 + Math.sin(u * 8.0) * 0.7;
        const sz = Math.sin(u * 5.0 + swarmPhase * 1.2) * 3.8 + Math.cos(time * 0.4 + species) * 1.2;
        tx = sx; ty = sy; tz = sz;
    } else if (formation === FormationMode.OuroborosSerpent) {
        // --- 43. Ouroboros Dragon: Coiling Aerodynamic Dragon Swallowing its Tail ---
        const ringAngle = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const bodyThickness = (1.0 - Math.pow(u, 1.5)) * 1.2 + 0.3;
        const spineWave = Math.sin(u * 10.0 - time * 2.0) * 0.45;
        const baseR = 4.2 + (species - 1.5) * 0.35;
        tx = (baseR + spineWave) * Math.cos(ringAngle);
        ty = Math.sin(u * 7.0 + time) * (bodyThickness * 0.7);
        tz = (baseR + spineWave) * Math.sin(ringAngle);
    } else if (formation === FormationMode.DancingRibbon) {
        // --- 44. Dancing Ribbon: Twisting Kinetic Gymnast Sash ---
        const ribT = (u - 0.5) * 11.0;
        const ribWave = ribT * 0.7 - time * 0.8 * speedMult;
        const ribbonWidth = (indexInSpecies % 2 === 0 ? 1 : -1) * 0.85;
        const twistAngle = ribT * 0.9 + time * 0.5;
        const rx = Math.sin(ribWave) * 3.2;
        const ry = ribT * 0.85 + Math.cos(ribWave) * 1.2;
        const rz = Math.cos(ribWave) * 3.0;
        tx = rx + Math.cos(twistAngle) * ribbonWidth;
        ty = ry;
        tz = rz + Math.sin(twistAngle) * ribbonWidth;
    } else if (formation === FormationMode.CalabiYauManifold) {
        // --- 45. Calabi-Yau Bloom: 6D String Theory Compactification Projection ---
        const n = 5;
        const alpha = u * Math.PI * 2.0;
        const beta = (((indexInSpecies % 100) / 100.0) * Math.PI * 2.0);
        const phaseT = time * 0.3 * speedMult + (species * Math.PI / 4);
        const z1_r = Math.cos(alpha);
        const z1_i = Math.sin(alpha);
        const z2_r = Math.pow(Math.abs(Math.cos(n * alpha)), 1 / n) * Math.cos(beta + phaseT);
        const z2_i = Math.pow(Math.abs(Math.sin(n * alpha)), 1 / n) * Math.sin(beta + phaseT);
        const cx = (z1_r * Math.cos(phaseT) - z1_i * Math.sin(phaseT)) * 4.5;
        const cy = (z2_r * 3.5) + (species - 1.5) * 0.7;
        const cz = (z1_r * Math.sin(phaseT) + z2_i * Math.cos(phaseT)) * 4.5;
        tx = cx; ty = cy; tz = cz;
    } else if (formation === FormationMode.HopfFibration) {
        // --- 46. Hopf Fiber Bundle: Nested Villarceau Circular Fiber Streams ---
        const th = u * Math.PI * 2.0;
        const ph = ((species + 0.5) / 4.0) * Math.PI;
        const psi = (((indexInSpecies % 80) / 80.0) * Math.PI * 2.0) + time * 0.5 * speedMult;
        const x4 = Math.cos((th + psi) * 0.5) * Math.sin(ph * 0.5);
        const y4 = Math.sin((th + psi) * 0.5) * Math.sin(ph * 0.5);
        const z4 = Math.cos((th - psi) * 0.5) * Math.cos(ph * 0.5);
        const w4 = Math.sin((th - psi) * 0.5) * Math.cos(ph * 0.5);
        const denom = Math.max(0.2, 1.4 - w4);
        tx = (x4 / denom) * 4.0;
        ty = (y4 / denom) * 4.0;
        tz = (z4 / denom) * 4.0;
    } else if (formation === FormationMode.LorenzAttractor) {
        // --- 47. Lorenz Butterfly: Continuous Dual-Scroll Chaotic Wings ---
        const lobe = (indexInSpecies % 2 === 0) ? 1 : -1;
        const tLor = (u * 16.0) + (species * 0.4) + (time * 0.4 * speedMult);
        const rLor = Math.sqrt(Math.abs(tLor)) * 1.4 + 1.2;
        const thetaLor = tLor * 2.2;
        const lx = (lobe * 3.2) + rLor * Math.cos(thetaLor) * 0.65;
        const ly = (u - 0.5) * 8.5;
        const lz = (lobe * 2.0) + rLor * Math.sin(thetaLor) * 0.65;
        tx = lx; ty = ly; tz = lz;
    } else if (formation === FormationMode.GyroidMinimalSurface) {
        // --- 48. Gyroid Flow: Triply Periodic Minimal Surface Streamline ---
        const tG = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const spG = species * Math.PI * 0.5;
        const gx = (Math.sin(tG) * Math.cos(tG * 1.5 + spG) + Math.cos(tG * 0.5)) * 3.2;
        const gy = (Math.sin(tG * 1.5 + spG) * Math.cos(tG * 0.5) + Math.cos(tG)) * 3.2;
        const gz = (Math.sin(tG * 0.5) * Math.cos(tG) + Math.cos(tG * 1.5 + spG)) * 3.2;
        tx = gx * 1.15;
        ty = gy * 1.15;
        tz = gz * 1.25;
    } else if (formation === FormationMode.KleinBottle4D) {
        // --- 49. Klein Bottle Loop: Continuous Self-Intersecting Topological Immersion ---
        const ku = u * Math.PI * 2.0;
        const kv = ((((indexInSpecies % 70) / 70.0) * Math.PI * 2.0)) + (time * 0.4 * speedMult);
        const rk = 3.6;
        const kx = (rk + Math.cos(ku * 0.5) * Math.sin(kv) - Math.sin(ku * 0.5) * Math.sin(2.0 * kv)) * Math.cos(ku);
        const ky = (rk + Math.cos(ku * 0.5) * Math.sin(kv) - Math.sin(ku * 0.5) * Math.sin(2.0 * kv)) * Math.sin(ku);
        const kz = (Math.sin(ku * 0.5) * Math.sin(kv) + Math.cos(ku * 0.5) * Math.sin(2.0 * kv)) * 2.2;
        tx = kx * 0.75;
        ty = ky * 0.75;
        tz = kz * 0.75;
    } else if (formation === FormationMode.CliffordTorus) {
        // --- 50. Clifford Torus: Flat 4D Torus with Hyper-Rotation Projection ---
        const thC = u * Math.PI * 2.0;
        const phiC = (((indexInSpecies % 80) / 80.0) * Math.PI * 2.0);
        const tRot = time * 0.35 * speedMult;
        const x1 = Math.cos(thC + tRot);
        const y1 = Math.sin(thC + tRot);
        const x2 = Math.cos(phiC + (species * Math.PI / 4));
        const y2 = Math.sin(phiC + (species * Math.PI / 4));
        const wC = (x1 * Math.cos(tRot) - y2 * Math.sin(tRot));
        const denomC = Math.max(0.3, 1.6 - wC * 0.5);
        tx = ((y1) / denomC) * 3.8;
        ty = ((x2) / denomC) * 3.8;
        tz = ((x1 * Math.sin(tRot) + y2 * Math.cos(tRot)) / denomC) * 3.8;
    } else if (formation === FormationMode.QuadHelixBraid) {
        // --- 51. Quad Helix Braid: 4 Intertwined Species Helical Strands with Harmonic Cross-Ladders ---
        const strandOffset = species * (Math.PI * 0.5);
        const theta = u * 10.0 * Math.PI + time * 0.65 * speedMult + strandOffset;
        const h = (u - 0.5) * 11.5;
        const helixR = 3.6 + Math.sin(h * 0.4 + time * 0.6) * 0.5;
        const isRung = (indexInSpecies % 8 === 0);
        const rungFactor = isRung ? ((indexInSpecies % 32) / 32.0 - 0.5) : 0.0;
        tx = (helixR + rungFactor * 1.8) * Math.cos(theta);
        ty = h;
        tz = (helixR + rungFactor * 1.8) * Math.sin(theta);
    } else if (formation === FormationMode.ConcentricDualHelixSheath) {
        // --- 52. Concentric Dual Helix Sheath: Inner Double-Helix with Outer Counter-Rotating Cage & Radial Rungs ---
        const h = (u - 0.5) * 11.5;
        const isInner = (species < 2);
        if (isInner) {
            // Inner double helix core
            const thetaIn = u * 10.0 * Math.PI + time * 0.8 * speedMult + (species * Math.PI);
            const rIn = 2.2 + Math.sin(h * 0.5 + time) * 0.3;
            tx = rIn * Math.cos(thetaIn);
            ty = h;
            tz = rIn * Math.sin(thetaIn);
        } else {
            // Outer counter-rotating quad sheath
            const thetaOut = -u * 7.0 * Math.PI - time * 0.5 * speedMult + ((species - 2) * Math.PI * 0.5);
            const rOut = 4.4 + Math.cos(h * 0.4 - time * 0.4) * 0.4;
            const isSpoke = (indexInSpecies % 10 === 0);
            const spokeFactor = isSpoke ? ((indexInSpecies % 30) / 30.0) : 1.0;
            const finalR = 2.2 + spokeFactor * (rOut - 2.2);
            tx = finalR * Math.cos(thetaOut);
            ty = h;
            tz = finalR * Math.sin(thetaOut);
        }
    } else if (formation === FormationMode.CaduceusVortex) {
        // --- 53. Caduceus Vortex: Dual Intertwined Helical Serpents with Ascending Central Spine ---
        if (u < 0.22) {
            const spineT = (u / 0.22 - 0.5) * 11.0;
            tx = Math.sin(spineT * 2.0 + time) * 0.35;
            ty = spineT;
            tz = Math.cos(spineT * 2.0 + time) * 0.35;
        } else {
            const helixU = (u - 0.22) / 0.78;
            const strand = (indexInSpecies % 2 === 0) ? 0 : 1;
            const theta = helixU * 8.0 * Math.PI + time * 0.8 * speedMult + (strand * Math.PI) + (species * 0.2);
            const h = (helixU - 0.5) * 11.0;
            const loopScale = Math.sin(helixU * Math.PI * 3.0) * 1.8 + 2.6;
            tx = loopScale * Math.cos(theta);
            ty = h;
            tz = loopScale * Math.sin(theta);
        }
    } else if (formation === FormationMode.ToroidalHelixBraid) {
        // --- 54. Toroidal Helix Braid: Closed Continuous 4-Strand Braided Torus Ring ---
        const R_maj = 4.8;
        const r_min = 1.8;
        const tRing = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const strandOffset = species * (Math.PI * 0.5);
        const tTwist = u * 8.0 * Math.PI + strandOffset + time * 0.7 * speedMult;
        const rLocal = r_min + Math.sin(tTwist * 2.0) * 0.3;
        tx = (R_maj + rLocal * Math.cos(tTwist)) * Math.cos(tRing);
        ty = rLocal * Math.sin(tTwist) * 1.4;
        tz = (R_maj + rLocal * Math.cos(tTwist)) * Math.sin(tRing);
    } else if (formation === FormationMode.TrefoilBraidedRibbon) {
        // --- 55. Trefoil Braided Ribbon: 4-Strand Braided Cable Woven Around 3D Trefoil Knot ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const cx = (Math.sin(t) + 2.0 * Math.sin(2.0 * t)) * 1.5;
        const cy = (Math.cos(t) - 2.0 * Math.cos(2.0 * t)) * 1.5;
        const cz = (-Math.sin(3.0 * t)) * 2.0;
        const strandPhase = species * (Math.PI * 0.5);
        const braidTwist = t * 6.0 + strandPhase + time * 0.6;
        const rBraid = 0.65;
        tx = cx + rBraid * Math.cos(braidTwist) * Math.cos(t);
        ty = cy + rBraid * Math.cos(braidTwist) * Math.sin(t);
        tz = cz + rBraid * Math.sin(braidTwist) * 1.4;
    } else if (formation === FormationMode.HexaHelixVortexTower) {
        // --- 56. Hexa Helix Vortex Tower: 6 Intertwined Ascending Helical Pillars with Cross-Tiers ---
        const strandID = (species * 2 + (indexInSpecies % 2)) % 6;
        const phiStrand = strandID * (Math.PI / 3.0);
        const h = (u - 0.5) * 12.0;
        const rTower = 3.2 + Math.sin(h * 0.3 + time * 0.4) * 0.8;
        const theta = u * 10.0 * Math.PI + phiStrand + time * 0.55 * speedMult;
        const isCrossTier = (indexInSpecies % 12 === 0);
        const tierFactor = isCrossTier ? ((indexInSpecies % 24) / 24.0 - 0.5) * 1.2 : 0.0;
        tx = (rTower + tierFactor) * Math.cos(theta);
        ty = h;
        tz = (rTower + tierFactor) * Math.sin(theta);
    } else if (formation === FormationMode.MobiusHelixBraid) {
        // --- 57. Mobius Helix Braid: Continuous 3D Mobius Ribbon with 3 Braided Helical Sub-Currents ---
        const tMob = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const strand = indexInSpecies % 3;
        const strandPhase = strand * (Math.PI * 2.0 / 3.0) + (species * 0.25);
        const braidTwist = Math.sin(tMob * 3.0 + strandPhase) * 1.2;
        const rMob = 4.5 + Math.cos(tMob * 0.5) * (1.6 + braidTwist);
        tx = rMob * Math.cos(tMob);
        ty = Math.sin(tMob * 0.5) * (2.2 + braidTwist) + (species - 1.5) * 0.4;
        tz = rMob * Math.sin(tMob);
    } else if (formation === FormationMode.LissajousIntertwinedKnot) {
        // --- 58. Lissajous Intertwined Knot: 4 Harmonic Ribbon Streams in 3D 8-Knot ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const delta = species * (Math.PI * 0.5);
        tx = 4.3 * Math.sin(2.0 * t + delta);
        ty = 3.5 * Math.cos(3.0 * t + delta * 0.5) + Math.sin(t * 5.0) * 0.3;
        tz = 2.8 * Math.sin(4.0 * t + time * 0.2 + delta);
    } else if (formation === FormationMode.BorromeanRings) {
        // --- 59. Borromean Rings: Three Mutually Intertwined Orthogonal Elliptical Loops ---
        const ringIdx = (species + Math.floor(u * 3)) % 3;
        const t = ((u * 3) % 1.0) * Math.PI * 2.0 + time * 0.45 * speedMult;
        const spOffset = (species - 1.5) * 0.18;
        if (ringIdx === 0) {
            // Ring 0: XY-dominant, weaves in Z
            tx = (4.4 + spOffset) * Math.cos(t);
            ty = (2.5 + spOffset) * Math.sin(t);
            tz = 1.4 * Math.sin(2.0 * t) + 0.9;
        } else if (ringIdx === 1) {
            // Ring 1: YZ-dominant, weaves in X
            ty = (4.4 + spOffset) * Math.cos(t);
            tz = (2.5 + spOffset) * Math.sin(t);
            tx = 1.4 * Math.sin(2.0 * t) + 0.9;
        } else {
            // Ring 2: ZX-dominant, weaves in Y
            tz = (4.4 + spOffset) * Math.cos(t);
            tx = (2.5 + spOffset) * Math.sin(t);
            ty = 1.4 * Math.sin(2.0 * t) + 0.9;
        }
    } else if (formation === FormationMode.FigureEightKnot) {
        // --- 60. Figure-Eight Knot Braid: Canonical 4_1 Alternating Prime Knot with Multi-Strand Braid ---
        const t = u * Math.PI * 2.0 + time * 0.38 * speedMult;
        const rBase = 2.8 + 1.3 * Math.cos(2.0 * t);
        const cx = rBase * Math.cos(3.0 * t);
        const cy = rBase * Math.sin(3.0 * t);
        const cz = 2.4 * Math.sin(4.0 * t);
        const twistAngle = t * 6.0 + species * (Math.PI * 0.5);
        tx = cx + 0.5 * Math.cos(twistAngle) * Math.cos(3.0 * t);
        ty = cy + 0.5 * Math.cos(twistAngle) * Math.sin(3.0 * t);
        tz = cz + 0.55 * Math.sin(twistAngle);
    } else if (formation === FormationMode.CinqfoilKnot) {
        // --- 61. Cinqfoil Knot: (5,2) Torus Knot / Solomon's Seal 5-Lobe Intertwined Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.32 * speedMult;
        const r = 3.6 + 1.5 * Math.cos(5.0 * t);
        const cx = r * Math.cos(2.0 * t);
        const cy = r * Math.sin(2.0 * t);
        const cz = -2.5 * Math.sin(5.0 * t);
        const spAngle = species * (Math.PI * 0.5) + t * 5.0;
        tx = cx + 0.45 * Math.cos(spAngle) * Math.cos(2.0 * t);
        ty = cy + 0.45 * Math.cos(spAngle) * Math.sin(2.0 * t);
        tz = cz + 0.45 * Math.sin(spAngle);
    } else if (formation === FormationMode.SeptafoilKnot) {
        // --- 62. Septafoil Knot: (7,3) Torus Knot - 7-Point Intertwined Stellar Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.28 * speedMult;
        const r = 3.8 + 1.6 * Math.cos(7.0 * t);
        const cx = r * Math.cos(3.0 * t);
        const cy = r * Math.sin(3.0 * t);
        const cz = -2.6 * Math.sin(7.0 * t);
        const phi = t * 7.0 + species * (Math.PI * 0.5);
        tx = cx + 0.45 * Math.cos(phi) * Math.cos(3.0 * t);
        ty = cy + 0.45 * Math.cos(phi) * Math.sin(3.0 * t);
        tz = cz + 0.5 * Math.sin(phi);
    } else if (formation === FormationMode.OlympicChainLink) {
        // --- 63. Olympic Chain Link: 4 Interlocked Elliptical Rings in Toroidal Space ---
        const ringK = (species + Math.floor(u * 4)) % 4;
        const ringTheta = ringK * (Math.PI * 0.5) + time * 0.25 * speedMult;
        const cx = 3.4 * Math.cos(ringTheta);
        const cz = 3.4 * Math.sin(ringTheta);
        const cy = ((ringK % 2 === 0) ? 0.6 : -0.6) * Math.sin(time * 0.4 + ringK);
        const tau = ((u * 4) % 1.0) * Math.PI * 2.0 + time * 0.6;
        const cosTau = Math.cos(tau), sinTau = Math.sin(tau);
        const cosTh = Math.cos(ringTheta), sinTh = Math.sin(ringTheta);
        const lx = 2.0 * cosTau * (-sinTh) + 0.5 * sinTau * cosTh;
        const ly = 2.0 * sinTau;
        const lz = 2.0 * cosTau * cosTh + 0.5 * sinTau * sinTh;
        tx = cx + lx;
        ty = cy + ly;
        tz = cz + lz;
    } else if (formation === FormationMode.TriquetraCelticBraid) {
        // --- 64. Triquetra Celtic Braid: 3D Celtic Trinity Knot with Over-Under Crossings ---
        const t = u * Math.PI * 2.0 + time * 0.38 * speedMult;
        const r = 3.3 * (1.0 + 0.48 * Math.cos(3.0 * t));
        const cx = r * Math.cos(t);
        const cy = r * Math.sin(t);
        const cz = 2.3 * Math.sin(3.0 * t);
        const dr = (species - 1.5) * 0.32;
        tx = (r + dr) * Math.cos(t) - dr * Math.sin(3.0 * t) * Math.sin(t) * 0.5;
        ty = (r + dr) * Math.sin(t) + dr * Math.sin(3.0 * t) * Math.cos(t) * 0.5;
        tz = cz + dr * Math.cos(3.0 * t);
    } else if (formation === FormationMode.SolarFlareProminence) {
        // --- 65. Solar Flare Prominence: Intertwined Magnetic Flux Ropes with Reconnection Cusp ---
        const s = (u - 0.5) * Math.PI;
        const cx = 5.2 * Math.sin(s);
        const cy = 4.6 * Math.cos(s) - 1.2;
        const cz = Math.sin(s * 2.0) * 1.6;
        const thetaMag = s * 7.0 + time * 0.75 * speedMult + species * (Math.PI * 0.5);
        const rRope = 0.85 + 0.35 * Math.cos(s * 2.0);
        tx = cx + rRope * Math.cos(thetaMag) * Math.cos(s);
        ty = cy - rRope * Math.cos(thetaMag) * Math.sin(s);
        tz = cz + rRope * Math.sin(thetaMag) * 1.3;
    } else if (formation === FormationMode.WhiteheadLink) {
        // --- 66. Whitehead Link: Circular Ring Intertwined with 3D Figure-8 Loop ---
        const isRing = (species < 2);
        const t = u * Math.PI * 2.0 + time * 0.42 * speedMult;
        if (isRing) {
            // Ring component (horizontal planar saddle)
            const rRing = 4.0 + (species === 1 ? 0.35 : -0.35);
            tx = rRing * Math.cos(t);
            ty = rRing * Math.sin(t);
            tz = 0.7 * Math.sin(2.0 * t);
        } else {
            // Figure-8 component threading through the ring
            const spOff = (species === 3 ? 0.3 : -0.3);
            tx = 2.4 * Math.sin(2.0 * t) + spOff;
            ty = 0.9 * Math.sin(4.0 * t);
            tz = 3.6 * Math.cos(t);
        }
    } else if (formation === FormationMode.QuatrefoilKnotBraid) {
        // --- 67. Quatrefoil Knot Braid: (4,3) Torus Knot / 4-Leaf Intertwined Clover Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.34 * speedMult;
        const r = 3.6 + 1.5 * Math.cos(4.0 * t);
        const cx = r * Math.cos(3.0 * t);
        const cy = r * Math.sin(3.0 * t);
        const cz = 2.3 * Math.sin(4.0 * t);
        const phi = t * 4.0 + species * (Math.PI * 0.5);
        tx = cx + 0.42 * Math.cos(phi) * Math.cos(3.0 * t);
        ty = cy + 0.42 * Math.cos(phi) * Math.sin(3.0 * t);
        tz = cz + 0.45 * Math.sin(phi);
    } else if (formation === FormationMode.GrannyKnotBraid) {
        // --- 68. Granny Knot Braid: Dual Linked Trefoil Knots in Tandem with Bridge Threads ---
        const isUpper = (u < 0.5);
        const segU = isUpper ? u * 2.0 : (u - 0.5) * 2.0;
        const t = segU * Math.PI * 2.0 + time * 0.4 * speedMult;
        const yOffset = isUpper ? 2.2 : -2.2;
        const cx = (Math.sin(t) + 1.6 * Math.sin(2.0 * t)) * 1.25;
        const cy = (Math.cos(t) - 1.6 * Math.cos(2.0 * t)) * 1.25 + yOffset;
        const cz = (-Math.sin(3.0 * t)) * 1.8;
        const phi = t * 3.0 + species * (Math.PI * 0.5);
        const isBridge = (indexInSpecies % 8 === 0 && Math.abs(u - 0.5) < 0.15);
        const bridgeShift = isBridge ? ((species - 1.5) * 0.8) : 0.0;
        tx = cx + 0.38 * Math.cos(phi);
        ty = cy + 0.38 * Math.sin(phi) + bridgeShift;
        tz = cz + 0.42 * Math.sin(phi);

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

    const targetOut = out || DEFAULT_OUT_PT;
    targetOut[0] = tx;
    targetOut[1] = ty;
    targetOut[2] = tz;
    return targetOut;
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
    volThickness: number;  // Volumetric sheaf thickness (0.18 for sharp strands, 0.55 for cloud)
}

export function getFormationPhysicsProfile(formation: FormationMode): FormationPhysicsProfile {
    switch (formation) {
        // 1. ULTRA-TIGHT INTERTWINED HELICES, BRAIDS & GEOMETRIC (0% Strays, Razor-Sharp Woven Strands)
        case FormationMode.QuadHelixBraid:
        case FormationMode.ConcentricDualHelixSheath:
        case FormationMode.CaduceusVortex:
        case FormationMode.ToroidalHelixBraid:
        case FormationMode.TrefoilBraidedRibbon:
        case FormationMode.HexaHelixVortexTower:
        case FormationMode.MobiusHelixBraid:
        case FormationMode.LissajousIntertwinedKnot:
        case FormationMode.DoubleHelix:
        case FormationMode.TripleHelix:
        case FormationMode.DNALadder:
        case FormationMode.TrefoilKnot:
        case FormationMode.TorusKnot:
        case FormationMode.LissajousKnot:
        case FormationMode.KleinBottle4D:
        case FormationMode.CalabiYauManifold:
        case FormationMode.CliffordTorus:
        case FormationMode.GyroidMinimalSurface:
        case FormationMode.WireCube:
        case FormationMode.Tesseract4D:
        case FormationMode.DodecahedronShield:
        case FormationMode.StarPolygon:
        case FormationMode.SaturnRings:
        case FormationMode.PulsingHeart:
        case FormationMode.FerrisWheel:
        case FormationMode.HopfFibration:
        case FormationMode.AlienMothership:
        case FormationMode.BorromeanRings:
        case FormationMode.FigureEightKnot:
        case FormationMode.CinqfoilKnot:
        case FormationMode.SeptafoilKnot:
        case FormationMode.OlympicChainLink:
        case FormationMode.TriquetraCelticBraid:
        case FormationMode.SolarFlareProminence:
        case FormationMode.WhiteheadLink:
        case FormationMode.QuatrefoilKnotBraid:
        case FormationMode.GrannyKnotBraid:
            return { lerpRate: 0.12, noiseDrift: 0.002, strayRatio: 0.0, maxSpeedCap: 0.085, volThickness: 0.20 };

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
            return { lerpRate: 0.08, noiseDrift: 0.008, strayRatio: 0.006, maxSpeedCap: 0.065, volThickness: 0.40 };

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
            return { lerpRate: 0.06, noiseDrift: 0.015, strayRatio: 0.018, maxSpeedCap: 0.06, volThickness: 0.65 };
    }
}

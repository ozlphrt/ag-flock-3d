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
    QuadHelixBraid = 0,
    ConcentricDualHelixSheath = 1,
    ToroidalHelixBraid = 2,
    TrefoilBraidedRibbon = 3,
    MobiusHelixBraid = 4,
    LissajousIntertwinedKnot = 5,
    CaduceusVortex = 6,
    BorromeanRings = 7,
    FigureEightKnotBraid = 8,
    CinqfoilKnotBraid = 9,
    SeptafoilKnotBraid = 10,
    FractalSupercoil = 11,
    SuperhelicalTorusKnot = 12,
    DNAChromatinSolenoid = 13,
    TriquetraCelticBraid = 14,
    WhiteheadLinkBraid = 15,
    QuatrefoilKnotBraid = 16,
    GrannyKnotBraid = 17,
    DoubleHelixBraid = 18,
    TripleHelixBraid = 19,
    DNALadderBraid = 20,
    GyroidBraidLabyrinth = 21,
    LorenzChaoticBraid = 22,
    KleinBottleBraid = 23,
    CliffordTorusBraid = 24,
    OuroborosDragonBraid = 25,
    DancingRibbonBraid = 26,
    SolarFlareProminence = 27,
    OlympicChainLink = 28,
    SaturnianRings = 29,
    SphericalSurfaceVortex = 30,
    VillarceauTorus = 31,
    GalacticSpiral = 32,
    DysonSphereLattice = 33,
    BlackHoleAccretion = 34,
    Procedural = 35
}

export const TOTAL_FORMATION_COUNT = 36;

export const FORMATION_PRESETS = [
    {
        id: FormationMode.QuadHelixBraid,
        label: 'Quad Helix Braid',
        icon: '🧬',
        desc: '4 Intertwined species cords braiding around ascending helical spine with cross rungs'
    },
    {
        id: FormationMode.ConcentricDualHelixSheath,
        label: 'Concentric Dual Helix Sheath',
        icon: '🧬',
        desc: 'Multi-layer: inner double-helix nested inside outer counter-rotating 4-strand cage'
    },
    {
        id: FormationMode.ToroidalHelixBraid,
        label: 'Toroidal Helix Braid',
        icon: '🍩',
        desc: 'Closed continuous 4-strand intertwined braided cable looping through Torus'
    },
    {
        id: FormationMode.TrefoilBraidedRibbon,
        label: 'Trefoil Braided Ribbon',
        icon: '🎗️',
        desc: '4-Strand braided multi-layer rope woven along 3D Trefoil knot (2,3)'
    },
    {
        id: FormationMode.MobiusHelixBraid,
        label: 'Mobius Helix Braid',
        icon: '🎗️',
        desc: 'Continuous 3D Mobius strip with 4 intertwined braided sub-currents'
    },
    {
        id: FormationMode.LissajousIntertwinedKnot,
        label: 'Lissajous Intertwined Knot',
        icon: '🔮',
        desc: '4 Weaving harmonic cords looping in 3D 8-knot configuration'
    },
    {
        id: FormationMode.CaduceusVortex,
        label: 'Caduceus Vortex',
        icon: '⚕️',
        desc: 'Dual intertwined serpents coiling around central vertical spine with cross arcs'
    },
    {
        id: FormationMode.BorromeanRings,
        label: 'Borromean Rings',
        icon: '⭕',
        desc: 'Three mutually intertwined orthogonal elliptical loops with braided cords'
    },
    {
        id: FormationMode.FigureEightKnotBraid,
        label: 'Figure-Eight Knot Braid',
        icon: '♾️',
        desc: 'Canonical Listing 4_1 alternating prime knot with 4-strand braided cable'
    },
    {
        id: FormationMode.CinqfoilKnotBraid,
        label: 'Cinqfoil Knot Braid',
        icon: '⭐',
        desc: '5-Lobed intertwined Torus (5,2) Solomon seal braided ribbon'
    },
    {
        id: FormationMode.SeptafoilKnotBraid,
        label: 'Septafoil Stellar Braid',
        icon: '🌟',
        desc: '7-Point stellar Torus (7,3) intertwined braided ribbon'
    },
    {
        id: FormationMode.FractalSupercoil,
        label: 'Fractal Supercoil',
        icon: '🧬',
        desc: '3-Tier hierarchical coiled-coil: macro-spine with 4 braided meso-cords & micro-helices'
    },
    {
        id: FormationMode.SuperhelicalTorusKnot,
        label: 'Superhelical Torus Knot',
        icon: '🍩',
        desc: 'Multi-layer (3,5) Torus Knot whose strand is a 4-tube spiraling superhelix'
    },
    {
        id: FormationMode.DNAChromatinSolenoid,
        label: 'Chromatin Solenoid',
        icon: '🧬',
        desc: '3-Level biological supercoiling: solenoid fiber with orbiting nucleosomes & DNA wraps'
    },
    {
        id: FormationMode.TriquetraCelticBraid,
        label: 'Triquetra Celtic Braid',
        icon: '☘️',
        desc: '3D Celtic trinity knot with alternating over-under intertwined crossings'
    },
    {
        id: FormationMode.WhiteheadLinkBraid,
        label: 'Whitehead Link Braid',
        icon: '🪢',
        desc: 'Circular ring intertwined with 3D figure-8 loop in multi-strand braid'
    },
    {
        id: FormationMode.QuatrefoilKnotBraid,
        label: 'Quatrefoil Knot Braid',
        icon: '🍀',
        desc: '4-Leaf intertwined Torus (4,3) clover ribbon with 4 braided cords'
    },
    {
        id: FormationMode.GrannyKnotBraid,
        label: 'Granny Knot Braid',
        icon: '🧵',
        desc: 'Dual intertwined composite trefoils linked in tandem with bridge threads'
    },
    {
        id: FormationMode.DoubleHelixBraid,
        label: 'Double Helix Braid',
        icon: '🧬',
        desc: 'Dual intertwined bio-macromolecule strands with cross-ladder rungs'
    },
    {
        id: FormationMode.TripleHelixBraid,
        label: 'Triple Helix Braid',
        icon: '🧬',
        desc: 'Tri-strand intertwined braided collagen rope'
    },
    {
        id: FormationMode.DNALadderBraid,
        label: 'DNA Ladder Braid',
        icon: '🧬',
        desc: 'Dual helical sugar-phosphate rails with periodic cross base-pair rungs'
    },
    {
        id: FormationMode.GyroidBraidLabyrinth,
        label: 'Gyroid Braid Labyrinth',
        icon: '🌊',
        desc: '4 Species cords weaving through periodic minimal surface tunnels'
    },
    {
        id: FormationMode.LorenzChaoticBraid,
        label: 'Lorenz Chaotic Braid',
        icon: '🦋',
        desc: '4 Intertwined strands circulating the dual-scroll chaotic butterfly wings'
    },
    {
        id: FormationMode.KleinBottleBraid,
        label: 'Klein Bottle Braid',
        icon: '♾️',
        desc: '4-Strand intertwined immersion through 4D figure-8 self-intersection'
    },
    {
        id: FormationMode.CliffordTorusBraid,
        label: 'Clifford Torus Braid',
        icon: '💫',
        desc: '4 Intertwined cords in flat 4D hyper-torus stereographic projection'
    },
    {
        id: FormationMode.OuroborosDragonBraid,
        label: 'Ouroboros Dragon Braid',
        icon: '🐉',
        desc: '4-Strand intertwined coiling dragon loop swallowing its tail'
    },
    {
        id: FormationMode.DancingRibbonBraid,
        label: 'Dancing Ribbon Braid',
        icon: '🎀',
        desc: '4-Strand intertwined twisting kinetic gymnast loop'
    },
    {
        id: FormationMode.SolarFlareProminence,
        label: 'Solar Flare Prominence',
        icon: '☀️',
        desc: 'Intertwined magnetic flux ropes arching with counter-helicity twisting'
    },
    {
        id: FormationMode.OlympicChainLink,
        label: 'Olympic Chain Link',
        icon: '🔗',
        desc: '4 Interlocked elliptical rings linked sequentially in 3D toroidal space'
    },
    {
        id: FormationMode.SaturnianRings,
        label: 'Saturnian Planetary Rings',
        icon: '🪐',
        desc: 'Oblate planetary sphere with counter-rotating Keplerian dust rings & Cassini division'
    },
    {
        id: FormationMode.SphericalSurfaceVortex,
        label: 'Spherical Surface Vortices',
        icon: '🌐',
        desc: 'Global spherical mantle with Rossby wave atmospheric currents & polar vortex jets'
    },
    {
        id: FormationMode.VillarceauTorus,
        label: 'Villarceau Torus Mantle',
        icon: '🍩',
        desc: 'Full 2D torus surface flow with Villarceau circles & poloidal-toroidal lattice'
    },
    {
        id: FormationMode.GalacticSpiral,
        label: '4-Arm Galactic Spiral',
        icon: '🌌',
        desc: 'Logarithmic Milky Way galaxy with 4 distinct spiral arms & dense central nucleus'
    },
    {
        id: FormationMode.DysonSphereLattice,
        label: 'Dyson Sphere Cage',
        icon: '🔮',
        desc: 'Pulsating plasma core inside orthogonal great-circle orbital rings & energy mesh'
    },
    {
        id: FormationMode.BlackHoleAccretion,
        label: 'Black Hole & Polar Jets',
        icon: '🕳️',
        desc: 'Event horizon with swirling relativistic accretion disc & twin collimated polar jets'
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
        settings: { roughness: 0.32, metalness: 0.05, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 1,
        label: 'Candy Gloss Enamel',
        icon: '🍬',
        desc: 'Glossy automotive coat with vivid saturated base colors and broad highlights',
        settings: { roughness: 0.22, metalness: 0.08, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 2,
        label: 'Matte Velvet Clay',
        icon: '🎨',
        desc: 'Non-metallic pure matte finish that showcases 100% true, rich palette colors',
        settings: { roughness: 0.65, metalness: 0.0, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 3,
        label: 'Faceted Jewel Gem',
        icon: '💎',
        desc: 'Geometric crystalline facets with broad highlights that let gemstone colors pop',
        settings: { roughness: 0.26, metalness: 0.12, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    },
    {
        id: 4,
        label: 'Silicone Soft-Touch',
        icon: '🧽',
        desc: 'Smooth tactile matte finish with zero glare, displaying pure unmuted pigments',
        settings: { roughness: 0.75, metalness: 0.0, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 5,
        label: 'Pearlescent Luster',
        icon: '🦪',
        desc: 'Soft iridescent pearl luster with rich chromatic depth and luminous rim glints',
        settings: { roughness: 0.28, metalness: 0.15, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 6,
        label: 'Frosted Glass Crystal',
        icon: '🧊',
        desc: 'Modern frosted geometric glass with brilliant saturated diffuse color tone',
        settings: { roughness: 0.38, metalness: 0.10, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    },
    {
        id: 7,
        label: 'Polished Amber Resin',
        icon: '🍯',
        desc: 'Smooth deep resin with clear specular definition and luminous warm highlights',
        settings: { roughness: 0.24, metalness: 0.06, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
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
    holdDuration?: number;
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
    physicalConvergence?: number;
    isTopologyFormed?: boolean;
    formedTimestamp?: number | null;
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


// True Cascaded Orthonormal Reference Frame for 3-Tier and 4-Tier Nested Helices
function applyIntertwinedMultiLayer(
    mx: number, my: number, mz: number,
    tanX: number, tanY: number, tanZ: number,
    u: number,
    time: number,
    species: number,
    indexInSpecies: number,
    speedMult: number,
    rMeso: number,
    omegaMeso: number,
    rMicro: number,
    omegaMicro: number
): [number, number, number] {
    // 1. Order-1: Macro Unit Tangent, Normal & Binormal
    const tLen = Math.sqrt(tanX * tanX + tanY * tanY + tanZ * tanZ) || 1.0;
    const tx = tanX / tLen, ty = tanY / tLen, tz = tanZ / tLen;

    let upX = 0, upY = 1, upZ = 0;
    if (Math.abs(ty) > 0.92) {
        upX = 1; upY = 0; upZ = 0;
    }
    let nx = upY * tz - upZ * ty;
    let ny = upZ * tx - upX * tz;
    let nz = upX * ty - upY * tx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
    nx /= nLen; ny /= nLen; nz /= nLen;

    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    // 2. Order-2 (Meso Helix): Species cord spiraling around macro spine
    const mesoAngle = u * omegaMeso * Math.PI + (species * (Math.PI * 0.5)) + (time * 0.85 * speedMult);
    const cosMeso = fastCos(mesoAngle);
    const sinMeso = fastSin(mesoAngle);

    // Dynamic local radial basis vectors (N2, B2) that rotate with the Meso Helix
    const n2x = nx * cosMeso + bx * sinMeso;
    const n2y = ny * cosMeso + by * sinMeso;
    const n2z = nz * cosMeso + bz * sinMeso;

    const b2x = -nx * sinMeso + bx * cosMeso;
    const b2y = -ny * sinMeso + by * cosMeso;
    const b2z = -nz * sinMeso + bz * cosMeso;

    const isRung = (indexInSpecies % 12 === 0);
    const rungExt = isRung ? ((indexInSpecies % 36) / 36.0 - 0.5) * 1.4 : 0.0;
    const mesoR = rMeso + rungExt;

    // Meso Centerline Position
    const p2x = mx + n2x * mesoR;
    const p2y = my + n2y * mesoR;
    const p2z = mz + n2z * mesoR;

    // 3. Order-3 (Micro Helix): Particles form tight golden-spiral micro-tubes orbiting the Meso strand
    const track = indexInSpecies % 16;
    const trackR = Math.sqrt((track + 0.5) / 16.0) * rMicro;
    const trackTheta = (track * 2.3999632) + (u * omegaMicro * Math.PI) + (time * 1.6 * speedMult);
    const cosMicro = fastCos(trackTheta);
    const sinMicro = fastSin(trackTheta);

    return [
        p2x + (n2x * cosMicro + b2x * sinMicro) * trackR,
        p2y + (n2y * cosMicro + b2y * sinMicro) * trackR,
        p2z + (n2z * cosMicro + b2z * sinMicro) * trackR
    ];
}

// 4-Tier True Hierarchical Recursive Super-Helix:
// Grand Helix -> Secondary Coiled-Coil -> 3-Strand Tertiary Micro-Spirals -> Quaternary Coaxial Boid Streamlines
function applyRecursiveTripleHelix(
    mx: number, my: number, mz: number,
    tanX: number, tanY: number, tanZ: number,
    u: number,
    time: number,
    species: number,
    indexInSpecies: number,
    speedMult: number,
    rMeso: number = 1.35,
    omegaMeso: number = 14.0,
    rMicro: number = 0.44,
    omegaMicro: number = 56.0,
    rNano: number = 0.14,
    omegaNano: number = 160.0
): [number, number, number] {
    // 1. Order-1: Macro Orthonormal Frame (T1, N1, B1)
    const tLen = Math.sqrt(tanX * tanX + tanY * tanY + tanZ * tanZ) || 1.0;
    const tx = tanX / tLen, ty = tanY / tLen, tz = tanZ / tLen;

    let upX = 0, upY = 1, upZ = 0;
    if (Math.abs(ty) > 0.92) {
        upX = 1; upY = 0; upZ = 0;
    }
    let nx = upY * tz - upZ * ty;
    let ny = upZ * tx - upX * tz;
    let nz = upX * ty - upY * tx;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
    nx /= nLen; ny /= nLen; nz /= nLen;

    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    // 2. Order-2 (Meso Helix): 4 Species Cords spiraling around macro spine with 90° phase offsets
    const thetaMeso = u * omegaMeso * Math.PI + (species * (Math.PI * 0.5)) + (time * 0.75 * speedMult);
    const cosMeso = fastCos(thetaMeso);
    const sinMeso = fastSin(thetaMeso);

    const n2x = nx * cosMeso + bx * sinMeso;
    const n2y = ny * cosMeso + by * sinMeso;
    const n2z = nz * cosMeso + bz * sinMeso;

    const b2x = -nx * sinMeso + bx * cosMeso;
    const b2y = -ny * sinMeso + by * cosMeso;
    const b2z = -nz * sinMeso + bz * cosMeso;

    const p2x = mx + n2x * rMeso;
    const p2y = my + n2y * rMeso;
    const p2z = mz + n2z * rMeso;

    // 3. Order-3 (Micro Helix): Inside each species cord, 3 sub-strands twist in high-frequency tertiary coils
    const subStrandId = indexInSpecies % 3;
    const thetaMicro = u * omegaMicro * Math.PI + (subStrandId * (Math.PI * 2.0 / 3.0)) + (time * 0.6 * speedMult);
    const cosMicro = fastCos(thetaMicro);
    const sinMicro = fastSin(thetaMicro);

    const n3x = n2x * cosMicro + b2x * sinMicro;
    const n3y = n2y * cosMicro + b2y * sinMicro;
    const n3z = n2z * cosMicro + b2z * sinMicro;

    const b3x = -n2x * sinMicro + b2x * cosMicro;
    const b3y = -n2y * sinMicro + b2y * cosMicro;
    const b3z = -n2z * sinMicro + b2z * cosMicro;

    const p3x = p2x + n3x * rMicro;
    const p3y = p2y + n3y * rMicro;
    const p3z = p2z + n3z * rMicro;

    // 4. Order-4 (Nano Streamlines): Golden-angle concentric boid swarm particles inside each tertiary strand
    const track = Math.floor(indexInSpecies / 3) % 8;
    const trackR = Math.sqrt((track + 0.5) / 8.0) * rNano;
    const trackTheta = (track * 2.3999632) + (u * omegaNano * Math.PI) + (time * 0.8 * speedMult);
    const cosNano = fastCos(trackTheta);
    const sinNano = fastSin(trackTheta);

    return [
        p3x + (n3x * cosNano + b3x * sinNano) * trackR,
        p3y + (n3y * cosNano + b3y * sinNano) * trackR,
        p3z + (n3z * cosNano + b3z * sinNano) * trackR
    ];
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

    if (formation === FormationMode.QuadHelixBraid) {
        // --- 0. Quad Helix Braid: 4 Intertwined Species Cords with Cross-Ladders ---
        const h = (u - 0.5) * 12.0;
        const theta = u * 8.0 * Math.PI + time * 0.5 * speedMult;
        const R = 3.6;
        const mx = R * fastCos(theta);
        const my = h;
        const mz = R * fastSin(theta);
        const tanX = -R * fastSin(theta);
        const tanY = 1.2;
        const tanZ = R * fastCos(theta);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 1.15, 10.0, 0.28, 20.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.ConcentricDualHelixSheath) {
        // --- 1. Concentric Dual Helix Sheath: Multi-Layer Nested Braids ---
        const h = (u - 0.5) * 12.0;
        const isInner = (species < 2);
        if (isInner) {
            const theta = u * 9.0 * Math.PI + time * 0.7 * speedMult;
            const mx = 2.2 * fastCos(theta);
            const my = h;
            const mz = 2.2 * fastSin(theta);
            const tanX = -2.2 * fastSin(theta), tanY = 1.2, tanZ = 2.2 * fastCos(theta);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.55, 8.0, 0.20, 16.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        } else {
            const theta = -u * 6.0 * Math.PI - time * 0.5 * speedMult;
            const mx = 4.4 * fastCos(theta);
            const my = h;
            const mz = 4.4 * fastSin(theta);
            const tanX = 4.4 * fastSin(theta), tanY = 1.2, tanZ = -4.4 * fastCos(theta);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species - 2, indexInSpecies, speedMult, 0.75, 8.0, 0.22, 16.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        }
    } else if (formation === FormationMode.ToroidalHelixBraid) {
        // --- 2. Toroidal Helix Braid: 4-Strand Braided Torus Cable ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const R0 = 4.8;
        const mx = R0 * fastCos(t);
        const my = 0;
        const mz = R0 * fastSin(t);
        const tanX = -R0 * fastSin(t), tanY = 0, tanZ = R0 * fastCos(t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 1.35, 8.0, 0.28, 22.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.TrefoilBraidedRibbon) {
        // --- 3. Trefoil Braided Ribbon: 4-Strand Multi-Layer Knot (2,3) ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const mx = (fastSin(t) + 2.0 * fastSin(2.0 * t)) * 1.5;
        const my = (fastCos(t) - 2.0 * fastCos(2.0 * t)) * 1.5;
        const mz = (-fastSin(3.0 * t)) * 2.0;
        const tanX = (fastCos(t) + 4.0 * fastCos(2.0 * t)) * 1.5;
        const tanY = (-fastSin(t) + 4.0 * fastSin(2.0 * t)) * 1.5;
        const tanZ = (-3.0 * fastCos(3.0 * t)) * 2.0;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.95, 6.0, 0.26, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.MobiusHelixBraid) {
        // --- 4. Mobius Helix Braid: Continuous 3D Mobius Strip with 4 Braided Cords ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const halfT = t * 0.5;
        const R0 = 4.5;
        const mx = R0 * fastCos(t);
        const my = fastSin(halfT) * 1.8;
        const mz = R0 * fastSin(t);
        const tanX = -R0 * fastSin(t);
        const tanY = fastCos(halfT) * 0.9;
        const tanZ = R0 * fastCos(t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 1.1, 7.0, 0.25, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.LissajousIntertwinedKnot) {
        // --- 5. Lissajous Intertwined Knot: 4 Weaving Harmonic Ribbons in 3D 8-Knot ---
        const t = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const mx = 4.2 * fastSin(2.0 * t);
        const my = 3.5 * fastCos(3.0 * t);
        const mz = 2.8 * fastSin(4.0 * t);
        const tanX = 8.4 * fastCos(2.0 * t);
        const tanY = -10.5 * fastSin(3.0 * t);
        const tanZ = 11.2 * fastCos(4.0 * t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.95, 6.0, 0.26, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.CaduceusVortex) {
        // --- 6. Caduceus Vortex: Dual Intertwined Serpents Coiling around Central Spine ---
        if (u < 0.18) {
            tx = 0; ty = (u / 0.18 - 0.5) * 12.0; tz = 0;
        } else {
            const segU = (u - 0.18) / 0.82;
            const h = (segU - 0.5) * 11.5;
            const strand = (species % 2 === 0 ? 0 : 1);
            const theta = segU * 8.0 * Math.PI + time * 0.7 * speedMult + (strand * Math.PI);
            const loopScale = fastSin(segU * Math.PI * 3.0) * 1.6 + 2.8;
            const mx = loopScale * fastCos(theta);
            const my = h;
            const mz = loopScale * fastSin(theta);
            const tanX = -loopScale * fastSin(theta), tanY = 1.2, tanZ = loopScale * fastCos(theta);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, segU, time, Math.floor(species / 2), indexInSpecies, speedMult, 0.55, 6.0, 0.22, 14.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        }
    } else if (formation === FormationMode.BorromeanRings) {
        // --- 7. Borromean Rings: 3 Mutually Intertwined Orthogonal Loops ---
        const ringIdx = (species + Math.floor(u * 3)) % 3;
        const t = ((u * 3) % 1.0) * Math.PI * 2.0 + time * 0.45 * speedMult;
        let mx = 0, my = 0, mz = 0, tanX = 0, tanY = 0, tanZ = 0;
        if (ringIdx === 0) {
            mx = 4.4 * fastCos(t); my = 2.5 * fastSin(t); mz = 1.4 * fastSin(2.0 * t) + 0.9;
            tanX = -4.4 * fastSin(t); tanY = 2.5 * fastCos(t); tanZ = 2.8 * fastCos(2.0 * t);
        } else if (ringIdx === 1) {
            my = 4.4 * fastCos(t); mz = 2.5 * fastSin(t); mx = 1.4 * fastSin(2.0 * t) + 0.9;
            tanY = -4.4 * fastSin(t); tanZ = 2.5 * fastCos(t); tanX = 2.8 * fastCos(2.0 * t);
        } else {
            mz = 4.4 * fastCos(t); mx = 2.5 * fastSin(t); my = 1.4 * fastSin(2.0 * t) + 0.9;
            tanZ = -4.4 * fastSin(t); tanX = 2.5 * fastCos(t); tanY = 2.8 * fastCos(2.0 * t);
        }
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.65, 6.0, 0.22, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.FigureEightKnotBraid) {
        // --- 8. Figure-Eight Knot Braid: Canonical 4_1 Listing Knot with 4-Strand Braided Cable ---
        const t = u * Math.PI * 2.0 + time * 0.38 * speedMult;
        const rBase = 2.8 + 1.3 * fastCos(2.0 * t);
        const mx = rBase * fastCos(3.0 * t);
        const my = rBase * fastSin(3.0 * t);
        const mz = 2.4 * fastSin(4.0 * t);
        const tanX = -3.0 * rBase * fastSin(3.0 * t);
        const tanY = 3.0 * rBase * fastCos(3.0 * t);
        const tanZ = 9.6 * fastCos(4.0 * t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 6.0, 0.24, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.CinqfoilKnotBraid) {
        // --- 9. Cinqfoil Knot Braid: 5-Lobe Intertwined Torus (5,2) Solomon Seal Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.32 * speedMult;
        const r = 3.6 + 1.5 * fastCos(5.0 * t);
        const mx = r * fastCos(2.0 * t);
        const my = r * fastSin(2.0 * t);
        const mz = -2.5 * fastSin(5.0 * t);
        const tanX = -2.0 * r * fastSin(2.0 * t);
        const tanY = 2.0 * r * fastCos(2.0 * t);
        const tanZ = -12.5 * fastCos(5.0 * t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 5.0, 0.24, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.SeptafoilKnotBraid) {
        // --- 10. Septafoil Stellar Braid: 7-Point Intertwined Torus (7,3) Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.28 * speedMult;
        const r = 3.8 + 1.6 * fastCos(7.0 * t);
        const mx = r * fastCos(3.0 * t);
        const my = r * fastSin(3.0 * t);
        const mz = -2.6 * fastSin(7.0 * t);
        const tanX = -3.0 * r * fastSin(3.0 * t);
        const tanY = 3.0 * r * fastCos(3.0 * t);
        const tanZ = -18.2 * fastCos(7.0 * t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 7.0, 0.24, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.FractalSupercoil) {
        // --- 11. Fractal Supercoil: 4-Tier True Recursive Nested Helix-of-Helices ---
        const h = (u - 0.5) * 12.0;
        const tMacro = u * 4.0 * Math.PI + time * 0.4 * speedMult;
        const rMacro = 3.8;
        const mx = rMacro * fastCos(tMacro);
        const my = h;
        const mz = rMacro * fastSin(tMacro);
        const tanX = -rMacro * fastSin(tMacro);
        const tanY = 1.2;
        const tanZ = rMacro * fastCos(tMacro);
        const pt = applyRecursiveTripleHelix(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 1.35, 14.0, 0.44, 56.0, 0.14, 160.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.SuperhelicalTorusKnot) {
        // --- 12. Superhelical Torus Knot: Multi-Layer (3,5) Torus Knot with Recursive 4-Tier Superhelix Strands ---
        const p = 3, q = 5;
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const r = fastCos(q * t) * 1.6 + 4.0;
        const mx = r * fastCos(p * t);
        const my = fastSin(q * t) * 2.2;
        const mz = r * fastSin(p * t);
        const tanX = -p * r * fastSin(p * t);
        const tanY = q * fastCos(q * t) * 2.2;
        const tanZ = p * r * fastCos(p * t);
        const pt = applyRecursiveTripleHelix(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 1.15, 14.0, 0.38, 48.0, 0.12, 140.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.DNAChromatinSolenoid) {
        // --- 13. Chromatin Solenoid: 3-Tier Biological Supercoiling ---
        const nBeads = 12;
        const beadIdx = Math.floor(u * nBeads);
        const beadU = (u * nBeads) % 1.0;
        const beadCenterAngle = (beadIdx / nBeads) * Math.PI * 6.0 + time * 0.4 * speedMult;
        const rSolenoid = 3.6;
        const bx = rSolenoid * fastCos(beadCenterAngle);
        const by = (beadIdx / nBeads - 0.5) * 11.0;
        const bz = rSolenoid * fastSin(beadCenterAngle);
        const dnaWrapAngle = beadU * Math.PI * 3.3 + (species % 2) * Math.PI + time * 1.2;
        const rBead = 0.85 + (species >= 2 ? 0.35 : 0.0);
        tx = bx + fastCos(dnaWrapAngle) * rBead;
        ty = by + (beadU - 0.5) * 0.9 + fastSin(dnaWrapAngle) * 0.35;
        tz = bz + fastSin(dnaWrapAngle) * rBead;
    } else if (formation === FormationMode.TriquetraCelticBraid) {
        // --- 14. Triquetra Celtic Braid: 3D Celtic Trinity Knot with Over-Under Crossings ---
        const t = u * Math.PI * 2.0 + time * 0.38 * speedMult;
        const r = 3.3 * (1.0 + 0.48 * fastCos(3.0 * t));
        const mx = r * fastCos(t);
        const my = r * fastSin(t);
        const mz = 2.3 * fastSin(3.0 * t);
        const tanX = -r * fastSin(t);
        const tanY = r * fastCos(t);
        const tanZ = 6.9 * fastCos(3.0 * t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 6.0, 0.24, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.WhiteheadLinkBraid) {
        // --- 15. Whitehead Link Braid: Circular Ring Intertwined with 3D Figure-8 Loop ---
        const isRing = (species < 2);
        const t = u * Math.PI * 2.0 + time * 0.42 * speedMult;
        if (isRing) {
            const rRing = 4.0;
            const mx = rRing * fastCos(t);
            const my = rRing * fastSin(t);
            const mz = 0.7 * fastSin(2.0 * t);
            const tanX = -rRing * fastSin(t), tanY = rRing * fastCos(t), tanZ = 1.4 * fastCos(2.0 * t);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.6, 6.0, 0.22, 14.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        } else {
            const mx = 2.4 * fastSin(2.0 * t);
            const my = 0.9 * fastSin(4.0 * t);
            const mz = 3.6 * fastCos(t);
            const tanX = 4.8 * fastCos(2.0 * t), tanY = 3.6 * fastCos(4.0 * t), tanZ = -3.6 * fastSin(t);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species - 2, indexInSpecies, speedMult, 0.6, 6.0, 0.22, 14.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        }
    } else if (formation === FormationMode.QuatrefoilKnotBraid) {
        // --- 16. Quatrefoil Knot Braid: (4,3) Torus Knot / 4-Leaf Intertwined Clover Ribbon ---
        const t = u * Math.PI * 2.0 + time * 0.34 * speedMult;
        const r = 3.6 + 1.5 * fastCos(4.0 * t);
        const mx = r * fastCos(3.0 * t);
        const my = r * fastSin(3.0 * t);
        const mz = 2.3 * fastSin(4.0 * t);
        const tanX = -3.0 * r * fastSin(3.0 * t);
        const tanY = 3.0 * r * fastCos(3.0 * t);
        const tanZ = 9.2 * fastCos(4.0 * t);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 6.0, 0.24, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.GrannyKnotBraid) {
        // --- 17. Granny Knot Braid: Dual Intertwined Composite Trefoils ---
        const isUpper = (u < 0.5);
        const segU = isUpper ? u * 2.0 : (u - 0.5) * 2.0;
        const t = segU * Math.PI * 2.0 + time * 0.4 * speedMult;
        const yOffset = isUpper ? 2.2 : -2.2;
        const mx = (fastSin(t) + 1.6 * fastSin(2.0 * t)) * 1.25;
        const my = (fastCos(t) - 1.6 * fastCos(2.0 * t)) * 1.25 + yOffset;
        const mz = (-fastSin(3.0 * t)) * 1.8;
        const tanX = (fastCos(t) + 3.2 * fastCos(2.0 * t)) * 1.25;
        const tanY = (-fastSin(t) + 3.2 * fastSin(2.0 * t)) * 1.25;
        const tanZ = (-3.0 * fastCos(3.0 * t)) * 1.8;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, segU, time, species, indexInSpecies, speedMult, 0.75, 6.0, 0.22, 14.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.DoubleHelixBraid) {
        // --- 18. Double Helix Braid: Dual Intertwined Strands with Cross-Ladder Rungs ---
        const h = (u - 0.5) * 11.5;
        const theta = u * 8.0 * Math.PI + time * 0.6 * speedMult;
        const isRung = (indexInSpecies % 6 === 0);
        if (isRung) {
            const rungT = ((indexInSpecies % 24) / 24.0 - 0.5) * 2.0;
            tx = (3.4 * rungT) * fastCos(theta);
            ty = h;
            tz = (3.4 * rungT) * fastSin(theta);
        } else {
            const strand = (species % 2 === 0 ? 0 : 1);
            const strandAngle = theta + (strand * Math.PI);
            const r = 3.6 + fastSin(h * 0.4 + time * 0.5) * 0.4;
            const mx = r * fastCos(strandAngle);
            const my = h;
            const mz = r * fastSin(strandAngle);
            const tanX = -r * fastSin(strandAngle), tanY = 1.2, tanZ = r * fastCos(strandAngle);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, Math.floor(species / 2), indexInSpecies, speedMult, 0.55, 6.0, 0.22, 14.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        }
    } else if (formation === FormationMode.TripleHelixBraid) {
        // --- 19. Triple Helix Braid: Tri-Strand Intertwined Braided Stream ---
        const strand = indexInSpecies % 3;
        const strandOffset = (strand * Math.PI * 2.0 / 3.0);
        const theta = u * 8.0 * Math.PI + time * 0.7 * speedMult + strandOffset;
        const h = (u - 0.5) * 11.0;
        const r = 3.4 + fastSin(h * 0.3 + time * 0.5) * 0.4;
        const mx = r * fastCos(theta);
        const my = h;
        const mz = r * fastSin(theta);
        const tanX = -r * fastSin(theta), tanY = 1.2, tanZ = r * fastCos(theta);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.65, 6.0, 0.22, 14.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.DNALadderBraid) {
        // --- 20. DNA Ladder Braid: Dual Helical Sugar-Phosphate Rails with Rungs ---
        const h = (u - 0.5) * 11.5;
        const theta = u * 6.0 * Math.PI + time * 0.5 * speedMult;
        const isRung = (indexInSpecies % 6 === 0);
        if (isRung) {
            const rungT = ((indexInSpecies % 24) / 24.0 - 0.5) * 2.0;
            tx = (3.6 * rungT) * fastCos(theta);
            ty = h;
            tz = (3.6 * rungT) * fastSin(theta);
        } else {
            const strand = (species % 2 === 0 ? 0 : 1);
            const strandAngle = theta + (strand * Math.PI);
            const mx = 3.6 * fastCos(strandAngle);
            const my = h;
            const mz = 3.6 * fastSin(strandAngle);
            const tanX = -3.6 * fastSin(strandAngle), tanY = 1.2, tanZ = 3.6 * fastCos(strandAngle);
            const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, Math.floor(species / 2), indexInSpecies, speedMult, 0.55, 6.0, 0.22, 14.0);
            tx = pt[0]; ty = pt[1]; tz = pt[2];
        }
    } else if (formation === FormationMode.GyroidBraidLabyrinth) {
        // --- 21. Gyroid Braid Labyrinth: 4 Species Cords Weaving through Periodic Surface ---
        const t = u * Math.PI * 2.0 + time * 0.3 * speedMult;
        const mx = (fastSin(t) * fastCos(t * 1.5) + fastCos(t * 0.5)) * 2.8;
        const my = (fastSin(t * 1.5) * fastCos(t * 0.5) + fastCos(t)) * 2.8;
        const mz = (fastSin(t * 0.5) * fastCos(t) + fastCos(t * 1.5)) * 2.8;
        const tanX = fastCos(t) * 2.8, tanY = fastCos(t * 1.5) * 2.8, tanZ = fastCos(t * 0.5) * 2.8;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.95, 6.0, 0.24, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.LorenzChaoticBraid) {
        // --- 22. Lorenz Chaotic Braid: 4 Intertwined Strands in Dual-Scroll Butterfly Wings ---
        const t = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const s = fastSin(t);
        const mx = s * 4.4;
        const my = fastCos(t) * 3.8;
        const mz = (s > 0 ? 1 : -1) * (4.2 - Math.abs(s) * 2.6);
        const tanX = fastCos(t) * 4.4, tanY = -fastSin(t) * 3.8, tanZ = fastCos(t) * 2.6;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 6.0, 0.24, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.KleinBottleBraid) {
        // --- 23. Klein Bottle Braid: 4-Strand Intertwined Immersion ---
        const ku = u * Math.PI * 2.0 + time * 0.25 * speedMult;
        const kv = (((indexInSpecies % 60) / 60.0) * Math.PI * 2.0);
        const rk = 4.0 * (1.0 - fastCos(ku) * 0.5);
        const kx = (rk + fastCos(ku * 0.5) * fastSin(kv) - fastSin(ku * 0.5) * fastSin(2.0 * kv)) * fastCos(ku);
        const ky = (rk + fastCos(ku * 0.5) * fastSin(kv) - fastSin(ku * 0.5) * fastSin(2.0 * kv)) * fastSin(ku);
        const kz = (fastSin(ku * 0.5) * fastSin(kv) + fastCos(ku * 0.5) * fastSin(2.0 * kv)) * 2.2;
        const mx = kx * 0.75, my = ky * 0.75, mz = kz * 0.75;
        const tanX = -ky * 0.75, tanY = kx * 0.75, tanZ = kz * 0.5;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.75, 6.0, 0.22, 14.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.CliffordTorusBraid) {
        // --- 24. Clifford Torus Braid: 4 Intertwined Cords in 4D Hyper-Torus ---
        const thC = u * Math.PI * 2.0 + time * 0.35 * speedMult;
        const mx = 4.2 * fastCos(thC);
        const my = 4.2 * fastSin(thC);
        const mz = 0;
        const tanX = -4.2 * fastSin(thC), tanY = 4.2 * fastCos(thC), tanZ = 0;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 1.25, 8.0, 0.26, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.OuroborosDragonBraid) {
        // --- 25. Ouroboros Dragon Braid: 4-Strand Intertwined Dragon Loop ---
        const ringAngle = u * Math.PI * 2.0 + time * 0.4 * speedMult;
        const spineWave = fastSin(u * 10.0 - time * 2.0) * 0.45;
        const baseR = 4.2;
        const mx = (baseR + spineWave) * fastCos(ringAngle);
        const my = fastSin(u * 7.0 + time) * 0.7;
        const mz = (baseR + spineWave) * fastSin(ringAngle);
        const tanX = -baseR * fastSin(ringAngle), tanY = 0.5, tanZ = baseR * fastCos(ringAngle);
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.95, 8.0, 0.25, 18.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.DancingRibbonBraid) {
        // --- 26. Dancing Ribbon Braid: 4-Strand Intertwined Gymnast Loop ---
        const ribT = (u - 0.5) * 11.0;
        const ribWave = ribT * 0.7 - time * 0.8 * speedMult;
        const mx = fastSin(ribWave) * 3.2;
        const my = ribT * 0.85 + fastCos(ribWave) * 1.2;
        const mz = fastCos(ribWave) * 3.0;
        const tanX = fastCos(ribWave) * 3.2, tanY = 0.85, tanZ = -fastSin(ribWave) * 3.0;
        const pt = applyIntertwinedMultiLayer(mx, my, mz, tanX, tanY, tanZ, u, time, species, indexInSpecies, speedMult, 0.85, 7.0, 0.24, 16.0);
        tx = pt[0]; ty = pt[1]; tz = pt[2];
    } else if (formation === FormationMode.SolarFlareProminence) {
        // --- 27. Solar Flare Prominence: Intertwined Magnetic Flux Ropes ---
        const s = (u - 0.5) * Math.PI;
        const cx = 5.2 * fastSin(s);
        const cy = 4.6 * fastCos(s) - 1.2;
        const cz = fastSin(s * 2.0) * 1.6;
        const thetaMag = s * 7.0 + time * 0.75 * speedMult + species * (Math.PI * 0.5);
        const rRope = 0.85 + 0.35 * fastCos(s * 2.0);
        tx = cx + rRope * fastCos(thetaMag) * fastCos(s);
        ty = cy - rRope * fastCos(thetaMag) * fastSin(s);
        tz = cz + rRope * fastSin(thetaMag) * 1.3;
    } else if (formation === FormationMode.OlympicChainLink) {
        // --- 28. Olympic Chain Link: 4 Interlocked Elliptical Rings ---
        const ringK = (species + Math.floor(u * 4)) % 4;
        const ringTheta = ringK * (Math.PI * 0.5) + time * 0.25 * speedMult;
        const cx = 3.4 * fastCos(ringTheta);
        const cz = 3.4 * fastSin(ringTheta);
        const cy = ((ringK % 2 === 0) ? 0.6 : -0.6) * fastSin(time * 0.4 + ringK);
        const tau = ((u * 4) % 1.0) * Math.PI * 2.0 + time * 0.6;
        const cosTau = fastCos(tau), sinTau = fastSin(tau);
        const cosTh = fastCos(ringTheta), sinTh = fastSin(ringTheta);
        const lx = 2.0 * cosTau * (-sinTh) + 0.5 * sinTau * cosTh;
        const ly = 2.0 * sinTau;
        const lz = 2.0 * cosTau * cosTh + 0.5 * sinTau * sinTh;
        tx = cx + lx;
        ty = cy + ly;
        tz = cz + lz;
    } else if (formation === FormationMode.SaturnianRings) {
        // --- 29. Saturnian Planetary Rings: Oblate Core Sphere + Keplerian Dust Rings & Cassini Division ---
        const tiltAlpha = 0.466; // 26.7 deg axial tilt
        const cosTilt = fastCos(tiltAlpha);
        const sinTilt = fastSin(tiltAlpha);
        let px = 0, py = 0, pz = 0;

        if (species < 2) {
            // Planet Core Sphere (Species 0 & 1): Golden-spiral oblate sphere with banded differential rotation
            const yCore = (u * 2.0 - 1.0) * 2.2;
            const rLat = Math.sqrt(Math.max(0, 1.0 - (yCore / 2.2) * (yCore / 2.2))) * 2.4;
            const bandSpeed = (0.35 - Math.abs(yCore) * 0.08) * (species === 0 ? 1.0 : 0.85);
            const theta = (u * 32.0 * Math.PI) + (time * bandSpeed * speedMult) + (species * Math.PI);
            px = rLat * fastCos(theta);
            py = yCore * 0.88; // Oblate spheroid flattening
            pz = rLat * fastSin(theta);
        } else {
            // Keplerian Dust Cloud Rings (Species 2 & 3): Flat disc with Cassini Division
            const isInnerRing = (species === 2);
            // Inner Ring: R in [3.6, 5.0], Outer Ring: R in [5.6, 8.4] (Cassini gap between 5.0 and 5.6)
            const rRing = isInnerRing ? (3.6 + u * 1.4) : (5.6 + u * 2.8);
            const keplerSpeed = Math.sqrt(3.2 / (rRing * rRing * rRing));
            const ringTheta = (u * 36.0 * Math.PI) + (time * keplerSpeed * speedMult) + (indexInSpecies * 0.04);
            px = rRing * fastCos(ringTheta);
            py = fastSin(ringTheta * 2.0 + rRing) * 0.05; // Ultra-flat ring plane with subtle gravitational ripple
            pz = rRing * fastSin(ringTheta);
        }

        // Apply 26.7 deg Planetary Tilt
        tx = px;
        ty = py * cosTilt - pz * sinTilt;
        tz = py * sinTilt + pz * cosTilt;
    } else if (formation === FormationMode.SphericalSurfaceVortex) {
        // --- 30. Spherical Surface Vortices: Atmospheric & Rossby Wave Currents on 3D Sphere Surface ---
        const phi = (u - 0.5) * Math.PI * 0.94; // Latitude (-85 deg to +85 deg)
        const lambda = (u * 12.0 * Math.PI) + (species * (Math.PI * 0.5)) + (time * (0.2 + fastCos(phi) * 0.5) * speedMult);
        const rSurf = 5.2 + fastSin(3.0 * lambda + time * 0.3) * fastCos(2.0 * phi) * 0.25;
        tx = rSurf * fastCos(phi) * fastCos(lambda);
        ty = rSurf * fastSin(phi) + fastCos(lambda * 2.0 + time * 0.4) * 0.1;
        tz = rSurf * fastCos(phi) * fastSin(lambda);
    } else if (formation === FormationMode.VillarceauTorus) {
        // --- 31. Villarceau Torus Mantle: Full 2D Torus Surface Flow with Poloidal-Toroidal Lattice ---
        const thetaTor = (u * 3.0 * Math.PI) + (time * 0.2 * speedMult);
        const phiPol = (u * 8.0 * Math.PI) + (species * (Math.PI * 0.5)) + (time * 0.45 * speedMult);
        const rMajor = 4.6, rMinor = 2.0;
        const rEff = rMajor + rMinor * fastCos(phiPol);
        tx = rEff * fastCos(thetaTor);
        ty = rMinor * fastSin(phiPol);
        tz = rEff * fastSin(thetaTor);
    } else if (formation === FormationMode.GalacticSpiral) {
        // --- 32. 4-Arm Galactic Spiral: Logarithmic Milky Way Disc with Central Nucleus ---
        const armOffset = species * (Math.PI * 0.5);
        const rDisc = 0.8 + (u * 7.2);
        const winding = armOffset + (2.6 * Math.log(rDisc / 0.8)) + (time * (0.75 / Math.sqrt(rDisc + 0.3)) * speedMult);
        const bulgeThickness = Math.exp(-rDisc / 1.8) * 2.0 + 0.15;
        const zJitter = fastSin(indexInSpecies * 2.3999) * 0.4 * bulgeThickness;
        tx = rDisc * fastCos(winding);
        ty = zJitter;
        tz = rDisc * fastSin(winding);
    } else if (formation === FormationMode.DysonSphereLattice) {
        // --- 33. Dyson Sphere Cage: Central Plasma Star with Orthogonal Great-Circle Rings & Energy Mesh ---
        if (species === 0) {
            // Central Star: Pulsating spherical core at R=1.8
            const yStar = (u * 2.0 - 1.0) * 1.8;
            const rStar = Math.sqrt(Math.max(0, 1.0 - (yStar / 1.8) * (yStar / 1.8))) * 1.8;
            const thStar = (u * 16.0 * Math.PI) + (time * 0.35 * speedMult);
            tx = rStar * fastCos(thStar);
            ty = yStar;
            tz = rStar * fastSin(thStar);
        } else {
            // 3 Orthogonal Orbital Energy Cages at R=5.2 (Equatorial, Polar-X, Polar-Z)
            const rCage = 5.2;
            const thCage = (u * 4.0 * Math.PI) + (time * 0.25 * speedMult) + (indexInSpecies * 0.02);
            if (species === 1) {
                // Equatorial Ring
                tx = rCage * fastCos(thCage);
                ty = fastSin(thCage * 4.0) * 0.15;
                tz = rCage * fastSin(thCage);
            } else if (species === 2) {
                // Polar X-Y Ring
                tx = rCage * fastCos(thCage);
                ty = rCage * fastSin(thCage);
                tz = fastSin(thCage * 4.0) * 0.15;
            } else {
                // Polar Y-Z Ring
                tx = fastSin(thCage * 4.0) * 0.15;
                ty = rCage * fastCos(thCage);
                tz = rCage * fastSin(thCage);
            }
        }
    } else if (formation === FormationMode.BlackHoleAccretion) {
        // --- 34. Black Hole & Relativistic Jets: Event Horizon Void + Swirling Accretion Disc + Polar Beams ---
        if (species < 3) {
            // Accretion Disc (Species 0, 1, 2): Relativistic swirling disc around black hole event horizon
            const rAcc = 1.8 + (u * 4.8);
            const keplerV = Math.sqrt(6.0 / (rAcc * rAcc * rAcc));
            const thAcc = (u * 24.0 * Math.PI) + (time * keplerV * speedMult) + (species * (Math.PI * 2.0 / 3.0));
            const warpY = fastSin(thAcc + time * 0.5) * 0.2 * (1.0 / (rAcc * 0.5)); // Gravitational vertical lensing warp
            tx = rAcc * fastCos(thAcc);
            ty = warpY;
            tz = rAcc * fastSin(thAcc);
        } else {
            // Relativistic Polar Jets (Species 3): Collimated high-velocity magnetic beams along +/- Y axis
            const isUpJet = (indexInSpecies % 2 === 0);
            const jetY = (u * 7.5 + 1.2) * (isUpJet ? 1.0 : -1.0);
            const jetR = (0.3 + (u * 0.6)) * (1.0 + fastSin(jetY * 3.0 + time * 1.5) * 0.2); // Magnetic pinch constriction
            const jetTheta = (jetY * 2.0) + (time * 1.8 * speedMult) + (indexInSpecies * 0.3);
            tx = jetR * fastCos(jetTheta);
            ty = jetY;
            tz = jetR * fastSin(jetTheta);
        }
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
        // 1. TIGHT MATHEMATICAL BRAIDED CORDS & INTERTWINED KNOTS
        case FormationMode.QuadHelixBraid:
        case FormationMode.ConcentricDualHelixSheath:
        case FormationMode.ToroidalHelixBraid:
        case FormationMode.TrefoilBraidedRibbon:
        case FormationMode.MobiusHelixBraid:
        case FormationMode.LissajousIntertwinedKnot:
        case FormationMode.CaduceusVortex:
        case FormationMode.BorromeanRings:
        case FormationMode.FigureEightKnotBraid:
        case FormationMode.CinqfoilKnotBraid:
        case FormationMode.SeptafoilKnotBraid:
        case FormationMode.FractalSupercoil:
        case FormationMode.SuperhelicalTorusKnot:
        case FormationMode.DNAChromatinSolenoid:
        case FormationMode.TriquetraCelticBraid:
        case FormationMode.WhiteheadLinkBraid:
        case FormationMode.QuatrefoilKnotBraid:
        case FormationMode.GrannyKnotBraid:
        case FormationMode.DoubleHelixBraid:
        case FormationMode.TripleHelixBraid:
        case FormationMode.DNALadderBraid:
        case FormationMode.GyroidBraidLabyrinth:
        case FormationMode.KleinBottleBraid:
        case FormationMode.CliffordTorusBraid:
        case FormationMode.SolarFlareProminence:
        case FormationMode.OlympicChainLink:
            return { lerpRate: 0.14, noiseDrift: 0.0002, strayRatio: 0.0, maxSpeedCap: 0.095, volThickness: 0.05 };

        // 2. CELESTIAL, PLANETARY, SPHERICAL & TOROIDAL SURFACE MANIFOLDS
        case FormationMode.SaturnianRings:
        case FormationMode.SphericalSurfaceVortex:
        case FormationMode.VillarceauTorus:
        case FormationMode.GalacticSpiral:
        case FormationMode.DysonSphereLattice:
        case FormationMode.BlackHoleAccretion:
            return { lerpRate: 0.12, noiseDrift: 0.0003, strayRatio: 0.0, maxSpeedCap: 0.090, volThickness: 0.02 };

        // 3. ORGANIC KINETIC LOOPS
        case FormationMode.OuroborosDragonBraid:
        case FormationMode.DancingRibbonBraid:
        case FormationMode.Procedural:
            return { lerpRate: 0.10, noiseDrift: 0.001, strayRatio: 0.0, maxSpeedCap: 0.075, volThickness: 0.08 };

        // 4. CHAOTIC ATTRACTOR
        case FormationMode.LorenzChaoticBraid:
        default:
            return { lerpRate: 0.10, noiseDrift: 0.0005, strayRatio: 0.0, maxSpeedCap: 0.085, volThickness: 0.06 };
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
    sheathOffsetX: Float32Array;
    sheathOffsetY: Float32Array;
    sheathOffsetZ: Float32Array;

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
        this.sheathOffsetX = new Float32Array(maxCapacity);
        this.sheathOffsetY = new Float32Array(maxCapacity);
        this.sheathOffsetZ = new Float32Array(maxCapacity);
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

        const RNORM_LUT = new Float32Array(41);
        for (let k = 0; k <= 40; k++) {
            RNORM_LUT[k] = Math.sqrt(k / 40.0);
        }

        for (let i = 0; i < targetCount; i++) {
            const sp = this.species[i];
            const spIdx = this.indexInSpecies[i];
            const tot = speciesCounts[sp] > 0 ? speciesCounts[sp] : 100;
            this.totalInSpecies[i] = tot;
            this.u[i] = spIdx / tot;

            // Precompute deterministic static sheaf offsets once
            const phi = (spIdx * 2.3999632) + (this.u[i] * 13.7) + (sp * 1.5707963);
            const rNorm = RNORM_LUT[spIdx % 41];
            this.sheathOffsetX[i] = fastCos(phi) * rNorm;
            this.sheathOffsetY[i] = fastSin(phi) * (rNorm * 0.75);
            this.sheathOffsetZ[i] = fastSin(phi * 1.33) * (rNorm * 0.65);

            // If newly initialized, snap to formation point
            if (i >= prevCount) {
                const [tx, ty, tz] = computeFormationPoint(mode, seed, this.u[i], 0, sp, spIdx, 3.5, state.speedMultiplier || 0.14, state);
                this.posX[i] = tx + this.sheathOffsetX[i] * 0.05;
                this.posY[i] = ty + this.sheathOffsetY[i] * 0.05;
                this.posZ[i] = tz + this.sheathOffsetZ[i] * 0.05;
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

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.QuadHelixBraid;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const total = this.totalInSpecies > 0 ? this.totalInSpecies : 100;
        const rawU = this.indexInSpecies / total;

        // Density gradient remapping: concentrate particles near center or smooth distribution
        const u = fastSin(rawU * Math.PI * 0.5);

        // Smooth Ease-In and Ease-Out Quintic S-Curve morphing over 9.0 seconds
        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 7.0;
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


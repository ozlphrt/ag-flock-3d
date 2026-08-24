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
        ambientIntensity: 0.04,
        keyIntensity: 2.2,
        keyColor: '#ffffff',
        fillIntensity: 0.22,
        fillColor: '#475569',
        rimIntensity: 2.4,
        rimColor: '#93c5fd',
        fogDensity: 0.003
    },
    {
        id: 1,
        label: 'Golden Hour Sunset',
        ambientIntensity: 0.04,
        keyIntensity: 2.4,
        keyColor: '#fbbf24',
        fillIntensity: 0.20,
        fillColor: '#4a2840',
        rimIntensity: 2.6,
        rimColor: '#38bdf8',
        fogDensity: 0.0035
    },
    {
        id: 2,
        label: 'Arctic Aurora Frost',
        ambientIntensity: 0.03,
        keyIntensity: 2.0,
        keyColor: '#e0f2fe',
        fillIntensity: 0.18,
        fillColor: '#1e293b',
        rimIntensity: 2.5,
        rimColor: '#f97316',
        fogDensity: 0.0035
    },
    {
        id: 3,
        label: 'Deep Sea Luminescence',
        ambientIntensity: 0.03,
        keyIntensity: 1.9,
        keyColor: '#38bdf8',
        fillIntensity: 0.18,
        fillColor: '#0f172a',
        rimIntensity: 2.6,
        rimColor: '#34d399',
        fogDensity: 0.004
    },
    {
        id: 4,
        label: 'Volcanic Magma Corona',
        ambientIntensity: 0.04,
        keyIntensity: 2.4,
        keyColor: '#f97316',
        fillIntensity: 0.20,
        fillColor: '#3b0764',
        rimIntensity: 2.4,
        rimColor: '#fbbf24',
        fogDensity: 0.0035
    },
    {
        id: 5,
        label: 'Nebula Cyber Violet',
        ambientIntensity: 0.04,
        keyIntensity: 2.2,
        keyColor: '#c084fc',
        fillIntensity: 0.20,
        fillColor: '#1e1b4b',
        rimIntensity: 2.5,
        rimColor: '#2dd4bf',
        fogDensity: 0.0035
    },
    {
        id: 6,
        label: 'Cinematic Obsidian Noir',
        ambientIntensity: 0.03,
        keyIntensity: 2.1,
        keyColor: '#f1f5f9',
        fillIntensity: 0.16,
        fillColor: '#1e293b',
        rimIntensity: 2.6,
        rimColor: '#60a5fa',
        fogDensity: 0.004
    },
    {
        id: 7,
        label: 'Solar Eclipse Backlit',
        ambientIntensity: 0.03,
        keyIntensity: 2.0,
        keyColor: '#ffffff',
        fillIntensity: 0.15,
        fillColor: '#18181b',
        rimIntensity: 2.8,
        rimColor: '#f59e0b',
        fogDensity: 0.0045
    }
];

export const COLOR_PALETTES = [
    ['#081810', '#10b981', '#f59e0b', '#ec4899'], // 1. Emerald & Electric Pink & Solar Amber
    ['#0c2133', '#00e5ff', '#ff5722', '#e0f2fe'], // 2. Deep Ocean Abyss & Neon Coral
    ['#162e24', '#06b6d4', '#f97316', '#fef08a'], // 3. Nordic Glacial & Sunset Flare
    ['#0f172a', '#6366f1', '#f43f5e', '#38bdf8'], // 4. Cyberpunk Cobalt & Rose Magenta
    ['#2a1005', '#14b8a6', '#f59e0b', '#fb7185'], // 5. Desert Oasis & Aquamarine
    ['#1e1035', '#8b5cf6', '#10b981', '#facc15'], // 6. Cosmic Ultraviolet & Neon Lime
    ['#031d38', '#00f2fe', '#ffd200', '#ff007f'], // 7. Bioluminescent Laser Reef
    ['#1c1917', '#0ea5e9', '#f97316', '#a855f7'], // 8. Prismatic Mineral & Electric Violet
    ['#29082a', '#a855f7', '#ec4899', '#38bdf8'], // 9. Neon Synthwave & Cyber Cyan
    ['#05192d', '#00e5ff', '#ff3366', '#ffdd55'], // 10. Deep Midnight & Fluorescent Coral
    ['#0b2924', '#10b981', '#ff6b35', '#f7c59f'], // 11. Emerald Lagoon & Warm Terracotta
    ['#1a102f', '#7c3aed', '#06b6d4', '#f43f5e'], // 12. Twilight Laser Matrix
    ['#0f2b48', '#38bdf8', '#fb7185', '#fef08a'], // 13. Glacial Topaz & Radiant Gold
    ['#1c1024', '#9333ea', '#f59e0b', '#22d3ee'], // 14. Royal Amethyst & Cyan Corona
    ['#06232b', '#14b8a6', '#ef4444', '#fbbf24'], // 15. Volcanic Patina & Crimson Spark
    ['#201205', '#d97706', '#0284c7', '#f43f5e'], // 16. Amber Fire & Electric Sapphire
    ['#0d2310', '#22c55e', '#e11d48', '#38bdf8'], // 17. Hyperflora & Neon Fuchsia
    ['#150505', '#ef4444', '#00e5ff', '#fbbf24']  // 18. Solar Flare & Electric Aqua & Gold
];

export const MATERIAL_PRESETS = [
    {
        id: 0,
        label: 'Vibrant Satin Porcelain',
        icon: '🍶',
        desc: 'Deep vibrant color saturation with smooth satin surface sheen and soft specular highlights',
        settings: { roughness: 0.30, metalness: 0.25, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 1,
        label: 'Candy Gloss Enamel',
        icon: '🍬',
        desc: 'High-gloss automotive clearcoat with rich saturated pigments and smooth highlights',
        settings: { roughness: 0.28, metalness: 0.35, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 2,
        label: 'Polished Titanium Luster',
        icon: '⚔️',
        desc: 'Aerospace grade brushed metallic sheen with broad light response and rich shadows',
        settings: { roughness: 0.32, metalness: 0.75, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 3,
        label: 'Faceted Jewel Gem',
        icon: '💎',
        desc: 'Geometric crystalline facets with broad highlights that let gemstone colors pop',
        settings: { roughness: 0.28, metalness: 0.50, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    },
    {
        id: 4,
        label: 'Iridescent Pearl Luster',
        icon: '🦪',
        desc: 'Deep chromatic pearl sheen with luminous rim glints and multi-angle specular shifts',
        settings: { roughness: 0.30, metalness: 0.40, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 5,
        label: 'Frosted Glass Crystal',
        icon: '🧊',
        desc: 'Modern faceted optical crystal with intense saturated chromatic reflection',
        settings: { roughness: 0.34, metalness: 0.30, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    },
    {
        id: 6,
        label: 'Polished Amber Glass',
        icon: '🍯',
        desc: 'Liquid resin gloss with rich specular definition and clear optical depth',
        settings: { roughness: 0.29, metalness: 0.25, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 7,
        label: 'Sparkling Specular Facets',
        icon: '💎',
        desc: 'Crystalline multifaceted diamond geometry with metallic speckles and light glints',
        settings: { roughness: 0.30, metalness: 0.65, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    },
    {
        id: 8,
        label: 'Glinting Obsidian Foil',
        icon: '✨',
        desc: 'Deep metallic foil with sparkling facet glimmers that catch dynamic rim & key beams',
        settings: { roughness: 0.28, metalness: 0.70, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    },
    {
        id: 9,
        label: 'Liquid Mirror Chrome',
        icon: '🪞',
        desc: 'Ultra-polished liquid mirror metal reflecting environmental key and rim lights',
        settings: { roughness: 0.26, metalness: 0.85, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 10,
        label: 'Brushed Cobalt Steel',
        icon: '🛡️',
        desc: 'Deep anisotropic brushed steel with crisp sunlit reflections and dark shadows',
        settings: { roughness: 0.32, metalness: 0.80, wireframe: false, flatShading: false, emissiveIntensity: 0.0 }
    },
    {
        id: 11,
        label: 'Prismatic Diamond Glint',
        icon: '❇️',
        desc: 'Sharp crystalline facets with glowing specular spikes and deep facet contrast',
        settings: { roughness: 0.28, metalness: 0.60, wireframe: false, flatShading: true, emissiveIntensity: 0.0 }
    }
];

// Helper to generate dynamic species count between 2 and 20
export function generateDynamicSpeciesCount(): number {
    // Weighted distribution: 2 to 20 species
    const r = Math.random();
    if (r < 0.25) return Math.floor(Math.random() * 3) + 2; // 2 - 4 species
    if (r < 0.60) return Math.floor(Math.random() * 5) + 5; // 5 - 9 species
    if (r < 0.85) return Math.floor(Math.random() * 5) + 10; // 10 - 14 species
    return Math.floor(Math.random() * 6) + 15; // 15 - 20 species
}

// Helper to generate harmonious palettes for any count between 2 and 20
export function generateHarmoniousPalette(count: number): string[] {
    if (count === 4 && Math.random() < 0.40) {
        const p = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
        return [...p];
    }
    const mode = Math.random();
    const baseHue = Math.floor(Math.random() * 360);
    const colors: string[] = [];

    if (mode < 0.40) {
        // 1. Golden Angle / Phyllotaxis Spectrum Wheel (Richly distributed vibrant spectrum)
        for (let i = 0; i < count; i++) {
            const h = (baseHue + i * 137.5077) % 360;
            const s = 75 + (i % 3) * 8;
            const l = 48 + (i % 4) * 6;
            colors.push(hslToHex(h, s, l));
        }
    } else if (mode < 0.70) {
        // 2. Analogous Celestial Gradient (e.g. Deep Ocean -> Cyan -> Emerald or Twilight Amethyst -> Rose)
        const spread = 80 + Math.random() * 100; // 80 to 180 deg span
        for (let i = 0; i < count; i++) {
            const h = (baseHue + (i / Math.max(1, count - 1)) * spread) % 360;
            const s = 80 - (i % 3) * 6;
            const l = 46 + (i % 3) * 8;
            colors.push(hslToHex(h, s, l));
        }
    } else {
        // 3. Multi-Chord Complementary Split (Dominant base + high-contrast accents)
        const splitAngle = 180 + (Math.random() - 0.5) * 50;
        for (let i = 0; i < count; i++) {
            const isAccent = (i % 2 === 1);
            const h = isAccent ? ((baseHue + splitAngle + i * 20) % 360) : ((baseHue + i * 18) % 360);
            const s = isAccent ? 88 : 74;
            const l = isAccent ? 56 : 46;
            colors.push(hslToHex(h, s, l));
        }
    }
    return colors;
}

// Helper to generate dynamic asymmetric species population distributions (10% to 90%)
export function generateSpeciesDistribution(count: number = 4): number[] {
    const weights: number[] = [];
    const dominantIdx = Math.floor(Math.random() * count);
    for (let i = 0; i < count; i++) {
        if (i === dominantIdx && Math.random() < 0.65) {
            weights.push(2.5 + Math.random() * 3.0);
        } else {
            weights.push(0.5 + Math.random() * 1.5);
        }
    }
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => w / sum);
}

// Helper to generate distinct per-species materials with rich shadow & specular contrast
export function generateSpeciesMaterials(count: number = 4): MaterialSettings[] {
    const pool = [...MATERIAL_PRESETS];
    const mats: MaterialSettings[] = [];
    for (let i = 0; i < count; i++) {
        const preset = pool[i % pool.length] || pool[0];
        mats.push({ ...preset.settings, emissiveIntensity: 0.0 });
    }
    return mats;
}

// Ecological Size Range Interface per Species
export interface SpeciesSizeRange {
    avgSizes: number[];
    minSizes: number[];
    maxSizes: number[];
}

// Helper to generate distinct per-species average, minimum, and maximum boid sizes randomized by topology
export function generateSpeciesSizeRanges(count: number = 4): SpeciesSizeRange {
    const avgSizes: number[] = [];
    const minSizes: number[] = [];
    const maxSizes: number[] = [];

    // Distinct ecological niches: Micro-swarms, Mid-boids, Apex Giants
    for (let i = 0; i < count; i++) {
        const roll = Math.random();
        let avg: number, min: number, max: number;

        if (roll < 0.35) {
            // Niche 1: Nano / Micro Boid Swarm
            avg = 0.28 + Math.random() * 0.26; // 0.28 - 0.54
            min = Math.max(0.10, avg * (0.40 + Math.random() * 0.25)); // ~0.12 - 0.32
            max = avg * (1.50 + Math.random() * 0.50); // ~0.45 - 1.00
        } else if (roll < 0.75) {
            // Niche 2: Classic / Streamlined Mid-size Boids
            avg = 0.75 + Math.random() * 0.45; // 0.75 - 1.20
            min = Math.max(0.25, avg * (0.45 + Math.random() * 0.20)); // ~0.35 - 0.75
            max = avg * (1.60 + Math.random() * 0.60); // ~1.20 - 2.40
        } else {
            // Niche 3: Majestic Giants / Alpha Leviathans
            avg = 1.35 + Math.random() * 1.10; // 1.35 - 2.45
            min = Math.max(0.55, avg * (0.55 + Math.random() * 0.20)); // ~0.80 - 1.80
            max = Math.min(5.50, avg * (1.80 + Math.random() * 0.80)); // ~2.50 - 5.50
        }

        avgSizes.push(Number(avg.toFixed(2)));
        minSizes.push(Number(min.toFixed(2)));
        maxSizes.push(Number(max.toFixed(2)));
    }

    return { avgSizes, minSizes, maxSizes };
}

// Helper to generate distinct per-species average scale multipliers
export function generateSpeciesSizes(count: number = 4): number[] {
    return generateSpeciesSizeRanges(count).avgSizes;
}

// Helper to generate per-species agility and speed kinematics
export function generateSpeciesKinematics(count: number = 4, sizes?: number[]): { agilities: number[]; speeds: number[] } {
    const effSizes = sizes || generateSpeciesSizes(count);
    const agilities: number[] = [];
    const speeds: number[] = [];
    for (let i = 0; i < count; i++) {
        const sz = effSizes[i] || 1.0;
        const ag = Math.min(2.4, Math.max(0.45, (1.0 / Math.sqrt(sz)) * (0.85 + Math.random() * 0.3)));
        const sp = Math.min(1.4, Math.max(0.70, (1.0 + (1.0 - sz) * 0.22) * (0.90 + Math.random() * 0.2)));
        agilities.push(Number(ag.toFixed(2)));
        speeds.push(Number(sp.toFixed(2)));
    }
    return { agilities, speeds };
}

// Helper to generate distinct per-species pipe randomness / flutter (0.10 to 1.00) refreshed in every topology
export function generateSpeciesRandomness(count: number = 4): number[] {
    const randomness: number[] = [];
    for (let i = 0; i < count; i++) {
        // Differentiated spread: some species laser-tight (0.12 - 0.25), others organic & lively (0.40 - 0.85)
        const rand = 0.12 + Math.random() * 0.73;
        randomness.push(Number(rand.toFixed(2)));
    }
    return randomness;
}

// Helper to generate asynchronous, staggered per-species morph start offsets and durations
export function generateSpeciesMorphTimings(count: number = 4, totalDuration: number = 5.5): { startOffsets: number[]; durations: number[] } {
    const startOffsets: number[] = [];
    const durations: number[] = [];
    // Random permutation of species ranks so which species leads and follows is randomized on every topology
    const order = Array.from({ length: count }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
        const rank = order.indexOf(i);
        const offsetRatio = rank / Math.max(1, count - 1);
        // Staggered start offset across the initial 45% of the total transition duration
        const offset = rank === 0 ? 0.0 : (offsetRatio * (totalDuration * 0.42) + (Math.random() - 0.5) * 0.35);
        const clampedOffset = Math.max(0.0, Math.min(totalDuration * 0.48, offset));

        // Individual flight duration for this species
        const availableTime = totalDuration - clampedOffset;
        const dur = Math.max(2.4, availableTime * (0.65 + Math.random() * 0.30));

        startOffsets.push(Number(clampedOffset.toFixed(2)));
        durations.push(Number(dur.toFixed(2)));
    }
    return { startOffsets, durations };
}

// Global Matrices provided by App
export interface SimulationState {
    speciesCount?: number;
    attributes: SpeciesAttributes[];
    interactions: number[][]; // [i][j] = Weight of species i being attracted/repelled by species j
    bounds: number;
    speedMultiplier: number;
    sizeMultiplier: number;
    noiseTurbulence?: number;
    settleDecay?: number;
    defeatScenario: DefeatScenario;
    formationMode: FormationMode;
    formationSeed: number;
    speciesColors: string[];
    speciesMaterials?: MaterialSettings[];
    speciesDistribution?: number[];
    speciesSizes?: number[];
    speciesMinSizes?: number[];
    speciesMaxSizes?: number[];
    speciesAgilities?: number[];
    speciesSpeeds?: number[];
    speciesRandomness?: number[];
    speciesStartOffsets?: number[];
    speciesMorphDurations?: number[];
    speciesMorphProgress?: number[];
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
    isSpeciesLocked?: boolean;
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
    fps?: number;
    bloomSettings?: { luminanceThreshold: number; radius: number; intensity: number; levels: number; };
    bloomPreset?: number;
    isBloomLocked?: boolean;
    isArenaOpen?: boolean;
    population?: number;
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

// 3. Infinite Procedural Physical PBR Material Generator (Specialized in Sparkling Specular Facets)
export function generateProceduralMaterialSurprise(): { settings: MaterialSettings; name: string } {
    // 75% bias towards sparkling faceted specular crystalline materials
    const isSparklingMode = Math.random() < 0.75;
    
    let isFaceting = true;
    let roughness = 0.30;
    let metalness = 0.40;
    let emissiveIntensity = 0.0;

    if (isSparklingMode) {
        isFaceting = true;
        roughness = Number((0.26 + Math.random() * 0.08).toFixed(2)); // 0.26 - 0.34
        metalness = Number((0.40 + Math.random() * 0.35).toFixed(2)); // 0.40 - 0.75
        emissiveIntensity = 0.0;
    } else {
        isFaceting = Math.random() > 0.45;
        roughness = Number((0.28 + Math.random() * 0.06).toFixed(2)); // 0.28 - 0.34
        metalness = Number((0.15 + Math.random() * 0.55).toFixed(2)); // 0.15 - 0.70
        emissiveIntensity = 0.0;
    }

    const settings: MaterialSettings = {
        roughness,
        metalness,
        wireframe: false,
        flatShading: isFaceting,
        emissiveIntensity: 0.0
    };

    const adjectives = ['Sparkling', 'Crystalline', 'Specular', 'Glinting', 'Prismatic', 'Obsidian', 'Diamond', 'Hyper-Gloss', 'Faceted'];
    const nouns = ['Jewel', 'Titanium', 'Magma Foil', 'Opal', 'Crystal', 'Polymer', 'Resin', 'Sparks'];
    const name = `✨ ${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;

    return { settings, name };
}

// 4. Infinite Procedural Studio Lighting Generator
export function generateProceduralLightingSurprise(): LightingProfile {
    const keyHue = Math.floor(Math.random() * 360);
    const rimHue = (keyHue + 140 + Math.random() * 80) % 360;
    const fillHue = (keyHue + 180) % 360;

    const names = ['Volcanic Horizon', 'Solar Eclipse Corona', 'Bioluminescent Trench', 'Prismatic Aurora', 'Nebula Obsidian'];
    const label = `✨ ` + names[Math.floor(Math.random() * names.length)] + ` #${Math.floor(Math.random() * 900 + 100)}`;

    return {
        id: -1,
        label,
        ambientIntensity: Number((0.03 + Math.random() * 0.02).toFixed(2)), // 0.03 - 0.05
        keyIntensity: Number((2.0 + Math.random() * 0.5).toFixed(2)),       // 2.0 - 2.5
        keyColor: hslToHex(keyHue, 85, 70),
        fillIntensity: Number((0.16 + Math.random() * 0.08).toFixed(2)),     // 0.16 - 0.24
        fillColor: hslToHex(fillHue, 50, 35),
        rimIntensity: Number((2.2 + Math.random() * 0.6).toFixed(2)),       // 2.2 - 2.8
        rimColor: hslToHex(rimHue, 95, 75),
        fogDensity: Number((0.003 + Math.random() * 0.002).toFixed(3))      // 0.003 - 0.005: clean space depth
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

    // 2. Order-2 (Meso Helix): Species cord with exact integer 2pi turns for seamless closed loops
    const mesoTurns = Math.round(omegaMeso * 0.5);
    const mesoAngle = u * mesoTurns * (Math.PI * 2.0) + (species * (Math.PI * 0.5)) + (time * 0.5 * speedMult);
    const cosMeso = fastCos(mesoAngle);
    const sinMeso = fastSin(mesoAngle);

    // Dynamic local radial basis vectors (N2, B2) that rotate with the Meso Helix
    const n2x = nx * cosMeso + bx * sinMeso;
    const n2y = ny * cosMeso + by * sinMeso;
    const n2z = nz * cosMeso + bz * sinMeso;

    const b2x = -nx * sinMeso + bx * cosMeso;
    const b2y = -ny * sinMeso + by * cosMeso;
    const b2z = -nz * sinMeso + bz * cosMeso;

    // Meso Centerline Position
    const p2x = mx + n2x * rMeso;
    const p2y = my + n2y * rMeso;
    const p2z = mz + n2z * rMeso;

    // 3. Order-3 (Micro Helix): Particles form tight coherent micro-tubes orbiting the Meso strand
    const track = indexInSpecies % 8;
    const trackR = ((track + 0.5) / 8.0) * rMicro * 0.6;
    const trackTheta = (track * (Math.PI * 0.25)) + (u * 4.0 * Math.PI * 2.0) + (time * 0.8 * speedMult);
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

    // 2. Order-2 (Meso Helix): 4 Species Cords with exact integer 2pi turns
    const mesoTurns = Math.round(omegaMeso * 0.5);
    const thetaMeso = u * mesoTurns * (Math.PI * 2.0) + (species * (Math.PI * 0.5)) + (time * 1.1 * speedMult);
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

    // 3. Order-3 (Micro Helix): Inside each species cord, 3 sub-strands twist with exact integer 2pi turns
    const subStrandId = indexInSpecies % 3;
    const microTurns = Math.round(omegaMicro * 0.5);
    const thetaMicro = u * microTurns * (Math.PI * 2.0) + (subStrandId * (Math.PI * 2.0 / 3.0)) + (time * 1.8 * speedMult);
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

    // 4. Order-4 (Nano Streamlines): Golden-angle concentric boid swarm particles with exact integer 2pi turns
    const track = Math.floor(indexInSpecies / 3) % 8;
    const trackR = Math.sqrt((track + 0.5) / 8.0) * rNano;
    const nanoTurns = Math.round(omegaNano * 0.5);
    const trackTheta = (track * 2.3999632) + (u * nanoTurns * (Math.PI * 2.0)) + (time * 2.8 * speedMult);
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
        // --- 29. Saturnian Planetary Rings: Species 0 = Planet Core; Species 1, 2, 3 = Dust Cloud & Rings ---
        const tiltAlpha = 0.466; // 26.7 deg axial tilt
        let px = 0, py = 0, pz = 0;

        if (species === 0) {
            // Planet Core Sphere (100% Species 0): Dynamic Multi-Band Differential Jet Streams
            const uLat = ((u * 137.5) % 1.0 + 1.0) % 1.0;
            const phi = Math.asin(Math.min(0.98, Math.max(-0.98, uLat * 2.0 - 1.0)));
            const bandSpeed = (1.2 + 0.8 * fastCos(phi * 3.0)) * speedMult;
            const theta = (u * 40.0 * Math.PI) + (time * bandSpeed * 1.5);
            const rPlanet = 2.4;
            px = rPlanet * fastCos(phi) * fastCos(theta);
            py = rPlanet * fastSin(phi) * 0.88; // Oblate spheroid flattening
            pz = rPlanet * fastCos(phi) * fastSin(theta);
        } else {
            // Keplerian Dust Cloud Rings (Species 1..N-1): Multi-layer disc with Cassini Division
            const ringTier = species - 1;
            const rBase = 3.8 + ringTier * 1.6;
            const rRing = rBase + u * 1.4;
            const keplerSpeed = Math.sqrt(3.2 / (rRing * rRing * rRing));
            const ringTheta = (u * 36.0 * Math.PI) + (time * keplerSpeed * 1.6 * speedMult) + (ringTier * 1.047);
            px = rRing * fastCos(ringTheta);
            py = fastSin(ringTheta * 2.0 + rRing) * 0.06;
            pz = rRing * fastSin(ringTheta);
        }

        // Apply 26.7 deg Planetary Tilt
        tx = px;
        ty = py * fastCos(tiltAlpha) - pz * fastSin(tiltAlpha);
        tz = py * fastSin(tiltAlpha) + pz * fastCos(tiltAlpha);
    } else if (formation === FormationMode.SphericalSurfaceVortex) {
        // --- 30. Spherical Surface Vortices: High-Speed Zonal Jet Streams & Rossby Waves ---
        const uLat = ((u * 137.5) % 1.0 + 1.0) % 1.0;
        const phi0 = Math.asin(Math.min(0.96, Math.max(-0.96, uLat * 2.0 - 1.0)));
        const jetFlow = (fastSin(phi0 * 5.0) * 1.6 + fastCos(phi0 * 2.0) * 0.9) * speedMult;
        const theta = (u * 60.0 * Math.PI) + (time * jetFlow * 1.4) + (species * (Math.PI * 0.5));
        const rossbyWave = 0.18 * fastSin(6.0 * theta - time * 1.8 * speedMult) * fastCos(phi0);
        const phi = Math.min(1.50, Math.max(-1.50, phi0 + rossbyWave));
        const rSurf = 5.2;
        tx = rSurf * fastCos(phi) * fastCos(theta);
        ty = rSurf * fastSin(phi);
        tz = rSurf * fastCos(phi) * fastSin(theta);
    } else if (formation === FormationMode.VillarceauTorus) {
        // --- 31. Villarceau Torus Mantle: Full continuous 2D Torus Surface & Volume Flow ---
        const u1 = ((u * 137.5077) % 1.0 + 1.0) % 1.0;
        const u2 = ((u * 271.3197) % 1.0 + 1.0) % 1.0;
        const thetaTor = u1 * Math.PI * 2.0 + time * 0.30 * speedMult;
        const phiPol = u2 * Math.PI * 2.0 + time * 0.45 * speedMult;
        const rMajor = 4.4, rMinor = 2.0;
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
        // --- 33. Dyson Sphere Cage: High-Velocity Great-Circle Energy Rings & Central Star ---
        const isCore = ((u * 100.0) % 1.0) < 0.22;
        if (isCore) {
            const uCoreLat = ((u * 73.19) % 1.0 + 1.0) % 1.0;
            const phiCore = Math.asin(Math.min(0.96, Math.max(-0.96, uCoreLat * 2.0 - 1.0)));
            const thetaCore = (u * 80.0 * Math.PI) + (time * 1.6 * speedMult);
            const rStar = 2.0;
            tx = rStar * fastCos(phiCore) * fastCos(thetaCore);
            ty = rStar * fastSin(phiCore);
            tz = rStar * fastCos(phiCore) * fastSin(thetaCore);
        } else {
            const ringId = Math.floor((u * 6.0) + species) % 6;
            const incAngle = ringId * (Math.PI / 6.0);
            const nodeAngle = ringId * ((Math.PI * 2.0) / 6.0) + time * 0.15 * speedMult;
            const orbAngle = ((u * 6.0) % 1.0) * Math.PI * 2.0 + time * 2.2 * speedMult;
            const rRing = 5.4;
            const px0 = rRing * fastCos(orbAngle);
            const py0 = 0.0;
            const pz0 = rRing * fastSin(orbAngle);
            // Rotate inclination around X
            const ci = fastCos(incAngle), si = fastSin(incAngle);
            const pxi = px0;
            const pyi = py0 * ci - pz0 * si;
            const pzi = py0 * si + pz0 * ci;
            // Rotate node around Y
            const cn = fastCos(nodeAngle), sn = fastSin(nodeAngle);
            tx = pxi * cn + pzi * sn;
            ty = pyi;
            tz = -pxi * sn + pzi * cn;
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
            const p = Math.max(1, g.k1 || 3);
            const q = Math.max(1, g.k2 || 2);
            const superFreq = Math.max(2, g.k3 || 4);
            const rMaj = 3.6 + (g.r2 || 1.8) * 0.3;
            const rMin = 1.4 + (g.r3 || 0.9) * 0.25;
            const rMod = rMin + 0.35 * fastSin(superFreq * th + (g.phi1 || 0));

            const ct = fastCos(p * th + wTime);
            const st = fastSin(p * th + wTime);
            const cq = fastCos(q * th + (g.phi2 || 0));
            const sq = fastSin(q * th + (g.phi2 || 0));

            tx = (rMaj + rMod * cq) * ct;
            ty = rMod * sq * 1.5 + (g.a2 || 1.5) * fastSin(superFreq * th * 0.5);
            tz = (rMaj + rMod * cq) * st;
        } else if (g.family === 'branching') {
            const R = 3.4;
            const r = Math.max(0.6, g.r2 || 1.8);
            const d = Math.max(0.6, g.r1 || 2.5);
            const k = (R - r) / r;
            tx = (R - r) * fastCos(th + wTime) + d * fastCos(k * th + (g.phi1 || 0));
            ty = ((g.a1 || 2.0) * fastSin((g.k2 || 2) * th + (g.phi2 || 0)) + (g.a2 || 1.2) * fastCos((g.k4 || 3) * th)) * 0.8;
            tz = (R - r) * fastSin(th + wTime) - d * fastSin(k * th + (g.phi1 || 0));
        } else {
            // Fourier Harmonic family
            const maxR = Math.max(0.01, (g.r1 || 3.0) + (g.r2 || 1.8) + (g.r3 || 0.9));
            const scaleFit = 4.2 / maxR;
            tx = (g.r1 * fastCos(g.k1 * th + g.phi1) * fastSin(g.k2 * th + wTime) + g.a1 * fastCos(g.k3 * th)) * scaleFit;
            ty = (g.r2 * fastSin(g.k4 * th + g.phi2) * fastCos(wTime) + g.a2 * fastSin(g.k5 * th)) * scaleFit * 0.8;
            tz = (g.r3 * fastSin(g.k6 * th + g.phi3) * fastCos(g.k7 * th + wTime) + g.a3 * fastCos(g.k8 * th)) * scaleFit;
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

        const speciesSizes = state?.speciesSizes || [1.35, 0.90, 0.58, 0.36];
        const speciesBaseSizes = [
            0.25 * speciesSizes[0],
            0.18 * speciesSizes[1],
            0.12 * speciesSizes[2],
            0.08 * speciesSizes[3]
        ];
        const speciesCounts = [0, 0, 0, 0];
        const dist = state?.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
        const t0 = dist[0];
        const t1 = dist[0] + dist[1];
        const t2 = dist[0] + dist[1] + dist[2];

        // Re-assign species based on target distribution
        for (let i = 0; i < targetCount; i++) {
            const q = i / targetCount;
            let sp: SpeciesType = 0;
            if (q < t0) sp = 0;
            else if (q < t1) sp = 1;
            else if (q < t2) sp = 2;
            else sp = 3;
            this.species[i] = sp;

            if (i >= prevCount) {
                const baseSize = speciesBaseSizes[sp];
                const r = Math.random();
                let bellScale: number;
                if (r < 0.97) {
                    const u1 = Math.max(1e-6, Math.random());
                    const u2 = Math.random();
                    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                    bellScale = 0.50 * Math.exp(z * 0.32);
                    bellScale = Math.min(1.0, Math.max(0.20, bellScale));
                } else if (r < 0.995) {
                    const subU = (r - 0.97) / 0.025;
                    bellScale = 1.1 + Math.pow(subU, 1.4) * 0.8;
                } else if (r < 0.9992) {
                    const subU = (r - 0.995) / 0.0042;
                    bellScale = 2.0 + Math.pow(subU, 1.6) * 1.5;
                } else {
                    const subU = (r - 0.9992) / 0.0008;
                    bellScale = 3.8 + subU * 1.4;
                }
                this.size[i] = baseSize * bellScale;

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

        // Dynamic longitudinal stream flow along 3D curves
        const boidFlowOffset = 0.85 + (this.indexInSpecies % 17) * 0.02;
        const flowSpeed = 0.055 * boidFlowOffset;
        const dynamicU = ((rawU + time * flowSpeed * speedMult) % 1.0 + 1.0) % 1.0;

        // Smooth Ease-In and Ease-Out Quintic S-Curve morphing over 9.0 seconds
        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 7.0;
        const elapsed = Math.max(0.0, time - startTime);
        const p = Math.min(1.0, elapsed / duration);

        // Quintic Smoothstep S-Curve Ease-In & Ease-Out: 6p^5 - 15p^4 + 10p^3
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        // Compute current target point
        let [txCurr, tyCurr, tzCurr] = computeFormationPoint(formation, seed, dynamicU, time, this.species, this.indexInSpecies, sepWeight, speedMult, state);

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
                dynamicU,
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

        // Species and individual size agility & speed scaling
        const spAgility = (this.species === 0 ? 0.70 : (this.species === 1 ? 1.15 : (this.species === 2 ? 1.50 : 1.95)));
        const spSpeed = (this.species === 0 ? 0.85 : (this.species === 1 ? 1.18 : (this.species === 2 ? 1.28 : 1.05)));
        const effectiveSize = Math.max(0.08, this.size || 1.0);
        const sizeAgility = Math.min(2.40, Math.max(0.45, 1.0 / Math.sqrt(effectiveSize)));
        const sizeSpeed = Math.min(1.40, Math.max(0.70, 1.0 + (1.0 - effectiveSize) * 0.22));

        const totalAgility = spAgility * sizeAgility;
        const totalSpeed = spSpeed * sizeSpeed;

        // Ultra-gentle liquid spring attraction lerp scaled by agility
        const activeLerpRate = ((state && state.prevFormationMode !== undefined && p < 1.0)
            ? 0.03 + 0.03 * sCurve
            : 0.06) * totalAgility;

        let dx = (tx - this.position.x) * activeLerpRate;
        let dy = (ty - this.position.y) * activeLerpRate;
        let dz = (tz - this.position.z) * activeLerpRate;

        // Leader behavior: leader boids overshoot target slightly (12%)
        if (this.isLeader) {
            dx *= 1.12;
            dy *= 1.12;
            dz *= 1.12;
        }

        // Subtle organic 3D drift scaled by agility & frequency
        const spFreq = (this.species === 0 ? 0.55 : (this.species === 1 ? 1.0 : (this.species === 2 ? 1.45 : 1.85)));
        const driftX = fastSin(time * 1.5 * spFreq + this.noiseSeed) * 0.015 * speedMult * totalAgility;
        const driftY = fastCos(time * 1.2 * spFreq + this.noiseSeed * 1.3) * 0.015 * speedMult * totalAgility;
        const driftZ = fastSin(time * 1.8 * spFreq + this.noiseSeed * 0.7) * 0.015 * speedMult * totalAgility;

        // Silky smooth speed cap scaled by species and size speed
        const activeMaxDisp = ((state && state.prevFormationMode !== undefined && p < 1.0)
            ? (0.04 + 0.02 * sCurve) * speedMult
            : 0.06 * speedMult) * totalSpeed;

        // Desired velocity for this frame
        const targetVelX = dx + driftX;
        const targetVelY = dy + driftY;
        const targetVelZ = dz + driftZ;

        if (!this.velocity) {
            this.velocity = new THREE.Vector3(targetVelX, targetVelY, targetVelZ);
        }

        // Exponential smoothing towards target velocity
        const blendRate = Math.min(0.40, Math.max(0.06, 0.14 * totalAgility));
        this.velocity.x += (targetVelX - this.velocity.x) * blendRate;
        this.velocity.y += (targetVelY - this.velocity.y) * blendRate;
        this.velocity.z += (targetVelZ - this.velocity.z) * blendRate;

        // Soft-knee speed limiter
        const currentSpeed = this.velocity.length();
        if (currentSpeed > activeMaxDisp && currentSpeed > 1e-6) {
            this.velocity.multiplyScalar((activeMaxDisp + (currentSpeed - activeMaxDisp) * 0.05) / currentSpeed);
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


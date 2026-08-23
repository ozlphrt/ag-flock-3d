import {
    SimulationState,
    FormationMode,
    MATERIAL_PRESETS,
    LIGHTING_PROFILES,
    COLOR_PALETTES,
    MaterialSettings,
    LightingProfile
} from './BoidLogic';
import { BLOOM_PRESETS, BloomSettings } from './BloomControlPanel';

export type DimensionKey = 'lighting' | 'material' | 'topology' | 'helixDynamics' | 'palette' | 'bloom';

export type ValidationStatus = 'exploring' | 'reinforcing' | 'confirmed';

export interface DimensionInsight {
    dimension: DimensionKey;
    label: string;
    affinityScore: number;         // 0 to 100%
    confidence: number;            // 0 to 100%
    consistencyScore: number;      // 0 to 100% agreement across varied angles
    trials: number;                // Number of trials completed
    status: ValidationStatus;      // exploring | reinforcing | confirmed
    preferredStyle: string;
    description: string;
    anglesTested: string[];
    isUserValidated?: boolean;
}

export interface LearnCandidate {
    id: 'A' | 'B';
    title: string;
    description: string;
    targetDimension: DimensionKey;
    styleFamily: string;
    state: Partial<SimulationState>;
}

export interface LearnPair {
    round: number;
    dimension: DimensionKey;
    dimensionLabel: string;
    isReinforcementRound: boolean;
    angleName: string;
    stageLabel: string;
    question: string;
    candidateA: LearnCandidate;
    candidateB: LearnCandidate;
}

export interface TasteProfile {
    totalRounds: number;
    overallConsistency: number;
    dimensions: Record<DimensionKey, {
        score: number;
        trials: number;
        variance: number;
        bestOptionLabel: string;
        bestStyleFamily: string;
        bestData: any;
        consecutiveAgreements: number;
        totalAgreements: number;
        anglesTested: string[];
        isConfirmed: boolean;
    }>;
    insights: DimensionInsight[];
    summaryText: string;
}

// 100% Shared Controlled Baseline across all non-target dimensions
export const BASELINE_LEARN_STATE: Partial<SimulationState> = {
    formationMode: FormationMode.TrefoilBraidedRibbon,
    materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 },
    lightingProfile: {
        id: 4,
        label: 'Volcanic Magma',
        ambientIntensity: 0.28,
        keyIntensity: 4.2,
        keyColor: '#ff6820',
        fillIntensity: 0.75,
        fillColor: '#802535',
        rimIntensity: 2.8,
        rimColor: '#ffa040',
        fogDensity: 0.045
    },
    speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'],
    speedMultiplier: 0.18,
    noiseTurbulence: 0.02,
    bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 },
    bounds: 35,
    sizeMultiplier: 1.8
};

export class PreferenceLearningEngine {
    private rounds: number = 0;
    private profile: TasteProfile;

    constructor() {
        this.profile = {
            totalRounds: 0,
            overallConsistency: 100,
            dimensions: {
                lighting: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Volcanic Magma', bestStyleFamily: 'volcanic_key', bestData: { ...BASELINE_LEARN_STATE.lightingProfile }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                material: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Sparkling Specular Facets', bestStyleFamily: 'specular_metallic', bestData: { ...BASELINE_LEARN_STATE.materialSettings }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                topology: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Trefoil Braided Ribbon', bestStyleFamily: 'braided_knot', bestData: { formationMode: FormationMode.TrefoilBraidedRibbon }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                helixDynamics: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Dynamic Spiral Stream Flow', bestStyleFamily: 'fast_dna_stream', bestData: { speedMultiplier: 0.22, noiseTurbulence: 0.022 }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                palette: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Prismatic Obsidian Flare', bestStyleFamily: 'dark_gold_monochrome', bestData: { speciesColors: [...BASELINE_LEARN_STATE.speciesColors!] }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                bloom: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Radiant Specular Halo', bestStyleFamily: 'radiant_halo', bestData: { ...BASELINE_LEARN_STATE.bloomSettings }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false }
            },
            insights: [],
            summaryText: 'Collecting initial aesthetic observations...'
        };
        this.updateInsights();
    }

    // Generate strict single-parameter isolated A/B pair
    public generateNextPair(baseState: SimulationState): LearnPair {
        this.rounds++;

        const dimKeys: DimensionKey[] = ['topology', 'palette', 'material', 'lighting', 'helixDynamics', 'bloom'];
        dimKeys.sort((a, b) => (this.profile.dimensions[a].trials - this.profile.dimensions[b].trials));
        const targetDim = dimKeys[0];
        const record = this.profile.dimensions[targetDim];
        const trialCount = record.trials;

        let label = '';
        let question = '';
        let stageLabel = '';
        let angleName = '';
        let optA: Partial<SimulationState> = {};
        let optB: Partial<SimulationState> = {};
        let titleA = '', titleB = '';
        let descA = '', descB = '';
        let familyA = '', familyB = '';

        // 1. TOPOLOGY: Everything else (Lighting, Material, Palette, Speed, Bloom) is 100% IDENTICAL
        if (targetDim === 'topology') {
            label = '3D Topology & Knot Geometry';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Knot Architecture';
                angleName = 'Trefoil vs Figure-8';
                question = 'Which 3D geometry structure do you prefer?';
                titleA = 'Trefoil Braided Ribbon (2,3)';
                descA = '3-fold symmetrical braided torus knot';
                familyA = 'trefoil';
                optA = { formationMode: FormationMode.TrefoilBraidedRibbon };

                titleB = 'Figure-Eight 4_1 Listing Knot';
                descB = 'Alternating 4-lobe non-orientable topological braid';
                familyB = 'figure_eight';
                optB = { formationMode: FormationMode.FigureEightKnotBraid };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Bias Check';
                angleName = 'Position-Flipped Topology';
                question = 'Consistency Check: Does your topology preference hold in flipped order?';
                titleA = 'Figure-Eight 4_1 Listing Knot';
                descA = 'Alternating 4-lobe topological braid';
                familyA = 'figure_eight';
                optA = { formationMode: FormationMode.FigureEightKnotBraid };

                titleB = 'Trefoil Braided Ribbon (2,3)';
                descB = '3-fold symmetrical braided torus knot';
                familyB = 'trefoil';
                optB = { formationMode: FormationMode.TrefoilBraidedRibbon };
            } else {
                stageLabel = 'Trial 3: High-Order Symmetry';
                angleName = 'Septafoil vs Fractal Supercoil';
                question = 'Validation: Pitting your top knot against high-symmetry fractal geometries.';
                titleA = 'Septafoil Stellar Braid (7,3)';
                descA = '7-point intertwined stellar torus ribbon';
                familyA = 'septafoil';
                optA = { formationMode: FormationMode.SeptafoilKnotBraid };

                titleB = '4-Tier Fractal Supercoil';
                descB = 'Recursive nested helix-of-helices with coaxial channels';
                familyB = 'fractal_supercoil';
                optB = { formationMode: FormationMode.FractalSupercoil };
            }
        }
        // 2. PALETTE: Everything else (Topology, Material, Lighting, Speed, Bloom) is 100% IDENTICAL
        else if (targetDim === 'palette') {
            label = 'Color Palette Harmony';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Warm Gold vs Cool Neon';
                angleName = 'Chromatic Harmony Baseline';
                question = 'Which color harmony creates the best chromatic balance?';
                titleA = 'Prismatic Obsidian Flare';
                descA = 'Dark charcoal, fiery amber, copper, and titanium white';
                familyA = 'obsidian_gold';
                optA = { speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'] };

                titleB = 'Bioluminescent Aurora';
                descB = 'Deep abyss navy, neon emerald, cyan, and violet purple';
                familyB = 'bioluminescent_neon';
                optB = { speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'] };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Bias Check';
                angleName = 'Position-Flipped Palette';
                question = 'Consistency Check: Does your palette preference hold in flipped layout?';
                titleA = 'Bioluminescent Aurora';
                descA = 'Deep abyss navy, neon emerald, cyan, and violet';
                familyA = 'bioluminescent_neon';
                optA = { speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'] };

                titleB = 'Gilded Obsidian & Champagne Gold';
                descB = 'Obsidian black, champagne gold, platinum silver, and white';
                familyB = 'obsidian_gold';
                optB = { speciesColors: ['#0a0d14', '#d4af37', '#e5e4e2', '#ffffff'] };
            } else {
                stageLabel = 'Trial 3: High-Contrast Monotone';
                angleName = 'Volcanic vs Celestial Sapphire';
                question = 'Validation: Testing saturated volcanic magma vs deep celestial sapphire.';
                titleA = 'Volcanic Magma Embers';
                descA = 'Pitch obsidian, molten lava orange, glowing ember gold, and white';
                familyA = 'volcanic_embers';
                optA = { speciesColors: ['#121316', '#ff4500', '#ffa500', '#ffffff'] };

                titleB = 'Celestial Stellar Sapphire';
                descB = 'Abyss navy, royal sapphire, electric sky blue, and diamond white';
                familyB = 'celestial_blue';
                optB = { speciesColors: ['#050814', '#1d3557', '#457b9d', '#f1faee'] };
            }
        }
        // 3. MATERIAL: Everything else (Topology, Lighting, Palette, Speed, Bloom) is 100% IDENTICAL
        else if (targetDim === 'material') {
            label = 'Surface Material (Optics)';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Metallic Specular vs Matte Velvet';
                angleName = 'Direct Surface Finish';
                question = 'Which surface reflectivity and facet finish do you prefer?';
                titleA = 'Sparkling Specular Facets';
                descA = 'Glossy metallic finish (Metalness 0.55, Roughness 0.22) with sharp highlights';
                familyA = 'specular_metallic';
                optA = { materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };

                titleB = 'Deep Matte Velvet';
                descB = 'Dielectric satin finish (Metalness 0.05, Roughness 0.70) with soft diffuse shading';
                familyB = 'matte_satin';
                optB = { materialSettings: { roughness: 0.70, metalness: 0.05, wireframe: false, flatShading: true, emissiveIntensity: 0.08 } };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Bias Check';
                angleName = 'Position-Flipped Material';
                question = 'Consistency Check: Does your material preference hold in reversed order?';
                titleA = 'Deep Matte Velvet (Soft Satin)';
                descA = 'Low-specular diffuse finish without sharp metallic glints';
                familyA = 'matte_satin';
                optA = { materialSettings: { roughness: 0.68, metalness: 0.08, wireframe: false, flatShading: true, emissiveIntensity: 0.08 } };

                titleB = 'High-Luster Specular Metallic';
                descB = 'Glossy faceted chrome finish with sparkling light catchers';
                familyB = 'specular_metallic';
                optB = { materialSettings: { roughness: 0.20, metalness: 0.60, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };
            } else {
                stageLabel = 'Trial 3: Specular Sweet-Spot';
                angleName = 'Chrome Facets vs Liquid Glass';
                question = 'Validation: Pinpointing sharp polygonal facet edges vs smooth glass sheen.';
                titleA = 'Sharp Specular Polygonal Facets';
                descA = 'Metalness 0.65, Roughness 0.20 with sharp polygonal facet glints';
                familyA = 'specular_metallic';
                optA = { materialSettings: { roughness: 0.20, metalness: 0.65, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };

                titleB = 'Smooth Liquid Glass Mirror';
                descB = 'Metalness 0.35, Roughness 0.10 with smooth continuous curvature';
                familyB = 'liquid_glass';
                optB = { materialSettings: { roughness: 0.10, metalness: 0.35, wireframe: false, flatShading: false, emissiveIntensity: 0.08 } };
            }
        }
        // 4. LIGHTING: Everything else (Topology, Material, Palette, Speed, Bloom) is 100% IDENTICAL
        else if (targetDim === 'lighting') {
            label = 'Studio Lighting & Atmosphere';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Volcanic Warm vs Bioluminescent Cool';
                angleName = 'Atmospheric Temperature';
                question = 'Which atmospheric lighting profile creates the most compelling depth?';
                titleA = 'Volcanic Magma Horizon';
                descA = 'Intense amber key light with crimson fill and high-contrast rim contours';
                familyA = 'volcanic_key';
                optA = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 } };

                titleB = 'Bioluminescent Abyss';
                descB = 'Deep ocean indigo ambient with electric cyan key and violet rim glow';
                familyB = 'bioluminescent_cool';
                optB = { lightingProfile: { id: 2, label: 'Bioluminescent Abyss', ambientIntensity: 0.22, keyIntensity: 3.6, keyColor: '#00e5ff', fillIntensity: 0.60, fillColor: '#7b2cbf', rimIntensity: 3.2, rimColor: '#00ffff', fogDensity: 0.035 } };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Bias Check';
                angleName = 'Position-Flipped Lighting';
                question = 'Consistency Check: Does your lighting preference hold in reversed order?';
                titleA = 'Bioluminescent Abyss';
                descA = 'Deep indigo ambient with cyan key and violet rim glow';
                familyA = 'bioluminescent_cool';
                optA = { lightingProfile: { id: 2, label: 'Bioluminescent Abyss', ambientIntensity: 0.22, keyIntensity: 3.6, keyColor: '#00e5ff', fillIntensity: 0.60, fillColor: '#7b2cbf', rimIntensity: 3.2, rimColor: '#00ffff', fogDensity: 0.035 } };

                titleB = 'Volcanic Magma Horizon';
                descB = 'Intense amber key light with crimson fill and high-contrast rim contours';
                familyB = 'volcanic_key';
                optB = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 } };
            } else {
                stageLabel = 'Trial 3: Chiaroscuro vs High-Key Solar';
                angleName = 'Low-Key Dramatic vs High-Key Studio';
                question = 'Validation: Testing moody low-key chiaroscuro vs bright solar daylight.';
                titleA = 'Volcanic Chiaroscuro (Moody Low-Key)';
                descA = 'Dark shadows with intense amber rim backlight and atmospheric mist';
                familyA = 'volcanic_key';
                optA = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.24, keyIntensity: 4.3, keyColor: '#ff6820', fillIntensity: 0.70, fillColor: '#802535', rimIntensity: 3.0, rimColor: '#ffa040', fogDensity: 0.048 } };

                titleB = 'Prismatic Solar Daylight (High-Key)';
                descB = 'Bright golden daylight with soft fill and minimal shadows';
                familyB = 'solar_high_key';
                optB = { lightingProfile: { id: 5, label: 'Prismatic Solar', ambientIntensity: 0.40, keyIntensity: 4.5, keyColor: '#fff0a0', fillIntensity: 0.85, fillColor: '#ff8040', rimIntensity: 3.0, rimColor: '#ffffff', fogDensity: 0.020 } };
            }
        }
        // 5. HELIX DYNAMICS & FLOW SPEED: Everything else is 100% IDENTICAL
        else if (targetDim === 'helixDynamics') {
            label = 'Pipe Flow Velocity & Helices';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Fast Stream vs Gentle Glide';
                angleName = 'Flow Velocity Baseline';
                question = 'Which internal boid flow and child spiral speed feels more organic?';
                titleA = 'Dynamic Spiral Stream Flow';
                descA = 'Rapid longitudinal stream flow (Speed 0.24) with child micro-helices';
                familyA = 'fast_dna_stream';
                optA = { speedMultiplier: 0.24, noiseTurbulence: 0.028 };

                titleB = 'Tranquil Chiral Drift';
                descB = 'Gentle laminar glide (Speed 0.12) with subtle undulating breathing waves';
                familyB = 'gentle_laminar';
                optB = { speedMultiplier: 0.12, noiseTurbulence: 0.012 };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Bias Check';
                angleName = 'Position-Flipped Flow Test';
                question = 'Consistency Check: Does your flow speed preference hold in flipped layout?';
                titleA = 'Tranquil Chiral Drift';
                descA = 'Gentle laminar glide with subtle breathing waves';
                familyA = 'gentle_laminar';
                optA = { speedMultiplier: 0.12, noiseTurbulence: 0.012 };

                titleB = 'Dynamic Spiral Stream Flow';
                descB = 'Rapid longitudinal stream flow with child micro-helices';
                familyB = 'fast_dna_stream';
                optB = { speedMultiplier: 0.24, noiseTurbulence: 0.028 };
            } else {
                stageLabel = 'Trial 3: Turbulence Sweet-Spot';
                angleName = 'Fluid Eddies vs Hydrodynamic Laminar';
                question = 'Validation: Testing natural fluid turbulence vs crisp hydrodynamic laminar lines.';
                titleA = 'Natural Fluid Turbulence (0.025)';
                descA = 'Speed 0.20 with organic living curl-noise eddies';
                familyA = 'fast_dna_stream';
                optA = { speedMultiplier: 0.20, noiseTurbulence: 0.025 };

                titleB = 'Laser Hydrodynamic Streamlines (0.008)';
                descB = 'Speed 0.20 with zero jitter and laser-straight streamlines';
                familyB = 'hydrodynamic_laminar';
                optB = { speedMultiplier: 0.20, noiseTurbulence: 0.008 };
            }
        }
        // 6. BLOOM: Everything else is 100% IDENTICAL
        else {
            label = 'Optical Bloom & Glow';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Radiant Halo vs Crisp Facets';
                angleName = 'Optical Bloom Baseline';
                question = 'Which optical bloom intensity enhances the specular highlights?';
                titleA = 'Radiant Specular Halo (Intensity 2.4)';
                descA = 'Dreamy optical diffusion with intense facet bloom radiation';
                familyA = 'radiant_halo';
                optA = { bloomSettings: { luminanceThreshold: 0.25, intensity: 2.4, radius: 0.70, levels: 3 } };

                titleB = 'Crisp Architectural Specular (Intensity 1.2)';
                descB = 'Pinpoint specular glints with minimal haze and razor-sharp facets';
                familyB = 'crisp_glints';
                optB = { bloomSettings: { luminanceThreshold: 0.85, intensity: 1.2, radius: 0.35, levels: 2 } };
            } else {
                stageLabel = 'Trial 2: Inverted Bias Check';
                angleName = 'Position-Flipped Bloom';
                question = 'Consistency Check: Does your bloom preference hold in flipped layout?';
                titleA = 'Crisp Architectural Specular';
                descA = 'Minimalist edge glints without light bleeding';
                familyA = 'crisp_glints';
                optA = { bloomSettings: { luminanceThreshold: 0.85, intensity: 1.2, radius: 0.35, levels: 2 } };

                titleB = 'Balanced Cinematic Bloom';
                descB = 'Soft atmospheric glow on specular highlights';
                familyB = 'radiant_halo';
                optB = { bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 } };
            }
        }

        return {
            round: this.rounds,
            dimension: targetDim,
            dimensionLabel: label,
            isReinforcementRound: trialCount >= 1,
            angleName,
            stageLabel,
            question,
            candidateA: {
                id: 'A',
                title: titleA,
                description: descA,
                targetDimension: targetDim,
                styleFamily: familyA,
                state: optA
            },
            candidateB: {
                id: 'B',
                title: titleB,
                description: descB,
                targetDimension: targetDim,
                styleFamily: familyB,
                state: optB
            }
        };
    }

    public recordVote(pair: LearnPair, chosenId: 'A' | 'B'): TasteProfile {
        const chosen = chosenId === 'A' ? pair.candidateA : pair.candidateB;
        const dim = pair.dimension;

        const record = this.profile.dimensions[dim];
        const isFirstTrial = record.trials === 0;
        record.trials += 1;

        if (isFirstTrial) {
            record.bestStyleFamily = chosen.styleFamily;
            record.bestOptionLabel = chosen.title;
            record.bestData = { ...chosen.state };
            record.totalAgreements = 1;
            record.consecutiveAgreements = 1;
        } else {
            const isConsistent = chosen.styleFamily === record.bestStyleFamily;
            if (isConsistent) {
                record.totalAgreements += 1;
                record.consecutiveAgreements += 1;
            } else {
                record.consecutiveAgreements = 0;
                record.bestStyleFamily = chosen.styleFamily;
            }
            record.bestOptionLabel = chosen.title;
            record.bestData = { ...chosen.state };
        }

        record.anglesTested.push(pair.angleName);

        const voteScore = chosenId === 'A' ? 0.85 : 0.15;
        const lr = 1.0 / (record.trials + 1.0);
        record.score = record.score * (1.0 - lr) + voteScore * lr;
        record.variance = Math.max(0.05, record.variance * 0.72);

        if (record.trials >= 3 && (record.totalAgreements / record.trials) >= 0.75) {
            record.isConfirmed = true;
        }

        this.profile.totalRounds++;
        this.updateInsights();
        return this.getProfile();
    }

    private updateInsights(): void {
        const insights: DimensionInsight[] = [];
        const dims = this.profile.dimensions;

        let totalAgreementSum = 0;
        let totalTrialSum = 0;

        const makeInsight = (dim: DimensionKey, label: string, desc: string): DimensionInsight => {
            const d = dims[dim];
            const trials = d.trials;
            const affinity = Math.round(50 + (trials > 0 ? (d.score - 0.5) * 80 : 0));
            const confidence = Math.min(100, Math.round(trials * 28.0));
            const consistencyScore = trials > 0 ? Math.round((d.totalAgreements / trials) * 100) : 100;

            totalAgreementSum += d.totalAgreements;
            totalTrialSum += Math.max(1, trials);

            let status: ValidationStatus = 'exploring';
            if (trials >= 3 && consistencyScore >= 75) status = 'confirmed';
            else if (trials >= 1) status = 'reinforcing';

            return {
                dimension: dim,
                label,
                affinityScore: Math.min(99, Math.max(50, affinity)),
                confidence,
                consistencyScore,
                trials,
                status,
                preferredStyle: d.bestOptionLabel,
                description: desc,
                anglesTested: [...d.anglesTested]
            };
        };

        insights.push(makeInsight('topology', '3D Topologies', 'Continuous multi-layer braided ribbons and intertwined knots.'));
        insights.push(makeInsight('palette', 'Color Harmonies', 'High-contrast dark obsidian with gleaming gold and specular white accents.'));
        insights.push(makeInsight('material', 'Material Optics', 'Sparkling specular metallic facets with low roughness and gleaming speckles.'));
        insights.push(makeInsight('lighting', 'Studio Lighting', 'High-contrast chiaroscuro key lighting with atmospheric rim contours.'));
        insights.push(makeInsight('helixDynamics', 'Pipe Child Helices', 'Dynamic longitudinal stream flow with corkscrewing child micro-helices.'));
        insights.push(makeInsight('bloom', 'Optical Bloom', 'Radiant specular halos with crisp facet highlights.'));

        this.profile.insights = insights;
        this.profile.overallConsistency = totalTrialSum > 0 ? Math.round((totalAgreementSum / totalTrialSum) * 100) : 100;

        const confirmedCount = insights.filter(i => i.status === 'confirmed').length;

        if (this.profile.totalRounds === 0) {
            this.profile.summaryText = 'Multi-angle aesthetic verification active: test variations across isolated parameters and flipped layouts.';
        } else {
            this.profile.summaryText = `Overall Choice Consistency: ${this.profile.overallConsistency}% across ${this.profile.totalRounds} rounds (${confirmedCount} dimensions validated).`;
        }
    }

    public getProfile(): TasteProfile {
        return { ...this.profile };
    }

    public applyToState(targetState: SimulationState): void {
        const dims = this.profile.dimensions;

        if (dims.material.bestData?.materialSettings) {
            targetState.materialSettings = { ...dims.material.bestData.materialSettings };
        }
        if (dims.lighting.bestData?.lightingProfile) {
            targetState.lightingProfile = { ...dims.lighting.bestData.lightingProfile };
        }
        if (dims.topology.bestData?.formationMode !== undefined) {
            targetState.prevFormationMode = targetState.formationMode;
            targetState.formationMode = dims.topology.bestData.formationMode;
            targetState.transitionStartTime = targetState.currentTime || 0;
        }
        if (dims.helixDynamics.bestData?.speedMultiplier !== undefined) {
            targetState.speedMultiplier = dims.helixDynamics.bestData.speedMultiplier;
        }
        if (dims.helixDynamics.bestData?.noiseTurbulence !== undefined) {
            targetState.noiseTurbulence = dims.helixDynamics.bestData.noiseTurbulence;
        }
        if (dims.palette.bestData?.speciesColors) {
            targetState.speciesColors = [...dims.palette.bestData.speciesColors];
        }
        if (dims.bloom.bestData?.bloomSettings) {
            targetState.bloomSettings = { ...dims.bloom.bestData.bloomSettings };
        }
    }
}

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

export type DimensionKey = 'topology' | 'palette' | 'material' | 'lighting' | 'helixDynamics' | 'bloom';

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

const DIMENSION_BLOCK_ORDER: DimensionKey[] = ['topology', 'palette', 'material', 'lighting', 'helixDynamics', 'bloom'];
const TRIALS_PER_DIMENSION_BLOCK = 4; // Stay on the dimension for 4 consecutive rounds

export class PreferenceLearningEngine {
    private rounds: number = 0;
    private profile: TasteProfile;

    constructor() {
        this.profile = {
            totalRounds: 0,
            overallConsistency: 100,
            dimensions: {
                topology: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Trefoil Braided Ribbon (2,3)', bestStyleFamily: 'trefoil', bestData: { formationMode: FormationMode.TrefoilBraidedRibbon }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                palette: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Prismatic Obsidian Flare', bestStyleFamily: 'obsidian_gold', bestData: { speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'] }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                material: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Sparkling Specular Facets', bestStyleFamily: 'specular_metallic', bestData: { materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                lighting: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Volcanic Magma Horizon', bestStyleFamily: 'volcanic_key', bestData: { lightingProfile: { ...BASELINE_LEARN_STATE.lightingProfile } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                helixDynamics: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Dynamic Spiral Stream Flow', bestStyleFamily: 'fast_dna_stream', bestData: { speedMultiplier: 0.24, noiseTurbulence: 0.028 }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                bloom: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Radiant Specular Halo', bestStyleFamily: 'radiant_halo', bestData: { bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false }
            },
            insights: [],
            summaryText: 'Collecting initial aesthetic observations...'
        };
        this.updateInsights();
    }

    // Generate consecutive dimension block pair (stays on topology for 4 rounds, then palette, etc.)
    public generateNextPair(baseState: SimulationState): LearnPair {
        this.rounds++;

        // Find current dimension block (the first one with < TRIALS_PER_DIMENSION_BLOCK)
        let targetDim = DIMENSION_BLOCK_ORDER.find(dim => this.profile.dimensions[dim].trials < TRIALS_PER_DIMENSION_BLOCK);
        if (!targetDim) {
            // Pick lowest trial count if all initial blocks completed
            const sorted = [...DIMENSION_BLOCK_ORDER].sort((a, b) => this.profile.dimensions[a].trials - this.profile.dimensions[b].trials);
            targetDim = sorted[0];
        }

        const record = this.profile.dimensions[targetDim];
        const trialCount = record.trials; // 0, 1, 2, 3

        let label = '';
        let question = '';
        let stageLabel = `Trial ${trialCount + 1}/${TRIALS_PER_DIMENSION_BLOCK}`;
        let angleName = '';
        let optA: Partial<SimulationState> = {};
        let optB: Partial<SimulationState> = {};
        let titleA = '', titleB = '';
        let descA = '', descB = '';
        let familyA = '', familyB = '';

        // 1. TOPOLOGY BLOCK (4 Consecutive Tournament Rounds)
        if (targetDim === 'topology') {
            label = '3D Topology & Knot Geometry';
            question = 'Which 3D shape structure do you prefer?';

            if (trialCount === 0) {
                angleName = 'Trefoil vs Figure-8';
                titleA = 'Trefoil Braided Ribbon (2,3)';
                descA = '3-fold symmetrical braided torus knot';
                familyA = 'trefoil';
                optA = { formationMode: FormationMode.TrefoilBraidedRibbon };

                titleB = 'Figure-Eight 4_1 Listing Knot';
                descB = 'Alternating 4-lobe non-orientable topological braid';
                familyB = 'figure_eight';
                optB = { formationMode: FormationMode.FigureEightKnotBraid };
            } else if (trialCount === 1) {
                angleName = 'Knot vs Septafoil Stellar';
                // Challenger: Test winner of round 1 against Septafoil Stellar Knot
                const currentLeader = record.bestStyleFamily === 'figure_eight' ? 'Figure-Eight 4_1 Listing Knot' : 'Trefoil Braided Ribbon (2,3)';
                const currentLeaderMode = record.bestStyleFamily === 'figure_eight' ? FormationMode.FigureEightKnotBraid : FormationMode.TrefoilBraidedRibbon;

                titleA = currentLeader;
                descA = 'Your current top-ranked topology structure';
                familyA = record.bestStyleFamily;
                optA = { formationMode: currentLeaderMode };

                titleB = 'Septafoil Stellar Braid (7,3)';
                descB = '7-point intertwined stellar torus ribbon';
                familyB = 'septafoil';
                optB = { formationMode: FormationMode.SeptafoilKnotBraid };
            } else if (trialCount === 2) {
                angleName = 'Leader vs Cinqfoil Solomon Knot';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderMode = record.bestData.formationMode;

                titleA = currentLeader;
                descA = 'Your current top-ranked topology structure';
                familyA = record.bestStyleFamily;
                optA = { formationMode: currentLeaderMode };

                titleB = 'Cinqfoil Solomon Knot (5,2)';
                descB = '5-lobed pentagrammatic intertwining torus ribbon';
                familyB = 'cinqfoil';
                optB = { formationMode: FormationMode.CinqfoilKnotBraid };
            } else {
                angleName = 'Championship vs 4-Tier Fractal Supercoil';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderMode = record.bestData.formationMode;

                titleA = currentLeader;
                descA = 'Your current top-ranked topology structure';
                familyA = record.bestStyleFamily;
                optA = { formationMode: currentLeaderMode };

                titleB = '4-Tier Fractal Supercoil';
                descB = 'Recursive nested helix-of-helices with coaxial channels';
                familyB = 'fractal_supercoil';
                optB = { formationMode: FormationMode.FractalSupercoil };
            }
        }
        // 2. COLOR PALETTE BLOCK (4 Consecutive Rounds, rendered ON winning topology)
        else if (targetDim === 'palette') {
            label = 'Color Palette Harmony';
            question = 'Which color palette harmony do you prefer?';

            if (trialCount === 0) {
                angleName = 'Obsidian Gold vs Neon Aurora';
                titleA = 'Prismatic Obsidian Flare';
                descA = 'Dark charcoal, fiery amber, copper, and titanium white';
                familyA = 'obsidian_gold';
                optA = { speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'] };

                titleB = 'Bioluminescent Aurora';
                descB = 'Deep abyss navy, neon emerald, cyan, and violet purple';
                familyB = 'bioluminescent_neon';
                optB = { speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'] };
            } else if (trialCount === 1) {
                angleName = 'Leader vs Gilded Champagne Gold';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderColors = record.bestData.speciesColors;

                titleA = currentLeader;
                descA = 'Your current top-ranked color palette';
                familyA = record.bestStyleFamily;
                optA = { speciesColors: [...currentLeaderColors] };

                titleB = 'Gilded Obsidian & Champagne Gold';
                descB = 'Obsidian black, champagne gold, platinum silver, and white';
                familyB = 'gilded_gold';
                optB = { speciesColors: ['#0a0d14', '#d4af37', '#e5e4e2', '#ffffff'] };
            } else if (trialCount === 2) {
                angleName = 'Leader vs Volcanic Magma Embers';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderColors = record.bestData.speciesColors;

                titleA = currentLeader;
                descA = 'Your current top-ranked color palette';
                familyA = record.bestStyleFamily;
                optA = { speciesColors: [...currentLeaderColors] };

                titleB = 'Volcanic Magma Embers';
                descB = 'Pitch obsidian, molten lava orange, glowing ember gold, and white';
                familyB = 'volcanic_embers';
                optB = { speciesColors: ['#121316', '#ff4500', '#ffa500', '#ffffff'] };
            } else {
                angleName = 'Championship vs Celestial Sapphire';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderColors = record.bestData.speciesColors;

                titleA = currentLeader;
                descA = 'Your current top-ranked color palette';
                familyA = record.bestStyleFamily;
                optA = { speciesColors: [...currentLeaderColors] };

                titleB = 'Celestial Stellar Sapphire';
                descB = 'Abyss navy, royal sapphire, electric sky blue, and diamond white';
                familyB = 'celestial_blue';
                optB = { speciesColors: ['#050814', '#1d3557', '#457b9d', '#f1faee'] };
            }
        }
        // 3. MATERIAL BLOCK (4 Consecutive Rounds)
        else if (targetDim === 'material') {
            label = 'Surface Material (Optics)';
            question = 'Which surface reflectivity and facet finish do you prefer?';

            if (trialCount === 0) {
                angleName = 'Specular Metallic vs Matte Velvet';
                titleA = 'Sparkling Specular Facets';
                descA = 'Glossy metallic finish with sharp polygonal facet glints';
                familyA = 'specular_metallic';
                optA = { materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };

                titleB = 'Deep Matte Velvet';
                descB = 'Dielectric satin finish with soft diffuse shading';
                familyB = 'matte_satin';
                optB = { materialSettings: { roughness: 0.70, metalness: 0.05, wireframe: false, flatShading: true, emissiveIntensity: 0.08 } };
            } else if (trialCount === 1) {
                angleName = 'Leader vs High-Chrome Mirror';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderMat = record.bestData.materialSettings;

                titleA = currentLeader;
                descA = 'Your current top-ranked surface material';
                familyA = record.bestStyleFamily;
                optA = { materialSettings: { ...currentLeaderMat } };

                titleB = 'Ultra-Gloss High-Chrome Mirror';
                descB = 'Metalness 0.85, Roughness 0.10 with gleaming mirror reflections';
                familyB = 'high_chrome';
                optB = { materialSettings: { roughness: 0.10, metalness: 0.85, wireframe: false, flatShading: true, emissiveIntensity: 0.15 } };
            } else if (trialCount === 2) {
                angleName = 'Leader vs Smooth Liquid Glass';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderMat = record.bestData.materialSettings;

                titleA = currentLeader;
                descA = 'Your current top-ranked surface material';
                familyA = record.bestStyleFamily;
                optA = { materialSettings: { ...currentLeaderMat } };

                titleB = 'Smooth Liquid Glass Sheen';
                descB = 'Metalness 0.30, Roughness 0.05 with smooth continuous curvature';
                familyB = 'liquid_glass';
                optB = { materialSettings: { roughness: 0.05, metalness: 0.30, wireframe: false, flatShading: false, emissiveIntensity: 0.08 } };
            } else {
                angleName = 'Leader vs Prismatic Wireframe Cyber';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderMat = record.bestData.materialSettings;

                titleA = currentLeader;
                descA = 'Your current top-ranked surface material';
                familyA = record.bestStyleFamily;
                optA = { materialSettings: { ...currentLeaderMat } };

                titleB = 'Holographic Cyber Wireframe';
                descB = 'Delicate polygon wireframe cage over luminous cores';
                familyB = 'cyber_wireframe';
                optB = { materialSettings: { roughness: 0.20, metalness: 0.50, wireframe: true, flatShading: true, emissiveIntensity: 0.30 } };
            }
        }
        // 4. LIGHTING BLOCK (4 Consecutive Rounds)
        else if (targetDim === 'lighting') {
            label = 'Studio Lighting & Atmosphere';
            question = 'Which atmospheric lighting profile creates the best depth?';

            if (trialCount === 0) {
                angleName = 'Volcanic Warm vs Bioluminescent Cool';
                titleA = 'Volcanic Magma Horizon';
                descA = 'Intense amber key light with crimson fill and high-contrast rim contours';
                familyA = 'volcanic_key';
                optA = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 } };

                titleB = 'Bioluminescent Abyss';
                descB = 'Deep ocean indigo ambient with electric cyan key and violet rim glow';
                familyB = 'bioluminescent_cool';
                optB = { lightingProfile: { id: 2, label: 'Bioluminescent Abyss', ambientIntensity: 0.22, keyIntensity: 3.6, keyColor: '#00e5ff', fillIntensity: 0.60, fillColor: '#7b2cbf', rimIntensity: 3.2, rimColor: '#00ffff', fogDensity: 0.035 } };
            } else if (trialCount === 1) {
                angleName = 'Leader vs Prismatic Solar Daylight';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderLight = record.bestData.lightingProfile;

                titleA = currentLeader;
                descA = 'Your current top-ranked lighting atmosphere';
                familyA = record.bestStyleFamily;
                optA = { lightingProfile: { ...currentLeaderLight } };

                titleB = 'Prismatic Solar Daylight (High-Key)';
                descB = 'Bright golden daylight with soft fill and crystal-clear shadows';
                familyB = 'solar_high_key';
                optB = { lightingProfile: { id: 5, label: 'Prismatic Solar', ambientIntensity: 0.40, keyIntensity: 4.5, keyColor: '#fff0a0', fillIntensity: 0.85, fillColor: '#ff8040', rimIntensity: 3.0, rimColor: '#ffffff', fogDensity: 0.020 } };
            } else {
                angleName = 'Leader vs Dark Nebula Chiaroscuro';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderLight = record.bestData.lightingProfile;

                titleA = currentLeader;
                descA = 'Your current top-ranked lighting atmosphere';
                familyA = record.bestStyleFamily;
                optA = { lightingProfile: { ...currentLeaderLight } };

                titleB = 'Deep Nebula Chiaroscuro';
                descB = 'Ultra-dark ambient with razor-sharp rim backlighting';
                familyB = 'dark_nebula';
                optB = { lightingProfile: { id: 1, label: 'Deep Nebula', ambientIntensity: 0.15, keyIntensity: 4.8, keyColor: '#00ffcc', fillIntensity: 0.40, fillColor: '#3a0ca3', rimIntensity: 3.8, rimColor: '#7209b7', fogDensity: 0.055 } };
            }
        }
        // 5. HELIX DYNAMICS BLOCK (4 Consecutive Rounds)
        else if (targetDim === 'helixDynamics') {
            label = 'Pipe Flow Velocity & Helices';
            question = 'Which internal boid flow speed feels best?';

            if (trialCount === 0) {
                angleName = 'Fast Stream vs Gentle Drift';
                titleA = 'Dynamic Spiral Stream Flow';
                descA = 'Rapid longitudinal stream flow (Speed 0.24) with child micro-helices';
                familyA = 'fast_dna_stream';
                optA = { speedMultiplier: 0.24, noiseTurbulence: 0.028 };

                titleB = 'Tranquil Chiral Drift';
                descB = 'Gentle laminar glide (Speed 0.12) with subtle undulating breathing waves';
                familyB = 'gentle_laminar';
                optB = { speedMultiplier: 0.12, noiseTurbulence: 0.012 };
            } else {
                angleName = 'Leader vs Hydrodynamic Laminar Lines';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderSpeed = record.bestData.speedMultiplier;
                const currentLeaderTurb = record.bestData.noiseTurbulence;

                titleA = currentLeader;
                descA = 'Your current top-ranked flow speed';
                familyA = record.bestStyleFamily;
                optA = { speedMultiplier: currentLeaderSpeed, noiseTurbulence: currentLeaderTurb };

                titleB = 'Laser Hydrodynamic Streamlines';
                descB = 'Smooth hydrodynamic flow with zero jitter and laser-straight streamlines';
                familyB = 'hydrodynamic_laminar';
                optB = { speedMultiplier: 0.20, noiseTurbulence: 0.008 };
            }
        }
        // 6. BLOOM BLOCK
        else {
            label = 'Optical Bloom & Glow';
            question = 'Which optical bloom intensity do you prefer?';

            if (trialCount === 0) {
                angleName = 'Radiant Specular Halo vs Crisp Architectural';
                titleA = 'Radiant Specular Halo (Intensity 2.4)';
                descA = 'Dreamy optical diffusion with intense facet bloom radiation';
                familyA = 'radiant_halo';
                optA = { bloomSettings: { luminanceThreshold: 0.25, intensity: 2.4, radius: 0.70, levels: 3 } };

                titleB = 'Crisp Architectural Specular (Intensity 1.2)';
                descB = 'Pinpoint specular glints with minimal haze and razor-sharp facets';
                familyB = 'crisp_glints';
                optB = { bloomSettings: { luminanceThreshold: 0.85, intensity: 1.2, radius: 0.35, levels: 2 } };
            } else {
                angleName = 'Leader vs Balanced Cinematic Bloom';
                const currentLeader = record.bestOptionLabel;
                const currentLeaderBloom = record.bestData.bloomSettings;

                titleA = currentLeader;
                descA = 'Your current top-ranked optical bloom';
                familyA = record.bestStyleFamily;
                optA = { bloomSettings: { ...currentLeaderBloom } };

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
            const confidence = Math.min(100, Math.round(trials * 25.0));
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
            this.profile.summaryText = 'Multi-angle aesthetic verification active: focused category tournament with persistent parameter baselines.';
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

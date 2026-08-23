import {
    SimulationState,
    FormationMode,
    MaterialSettings,
    LightingProfile
} from './BoidLogic';
import { BloomSettings } from './BloomControlPanel';

export type DimensionKey = 'topology' | 'palette' | 'material' | 'lighting' | 'helixDynamics' | 'bloom';

export type ValidationStatus = 'exploring' | 'reinforcing' | 'confirmed';

export interface DimensionInsight {
    dimension: DimensionKey;
    label: string;
    affinityScore: number;
    confidence: number;
    consistencyScore: number;
    trials: number;
    status: ValidationStatus;
    preferredStyle: string;
    description: string;
    anglesTested: string[];
    isUserValidated?: boolean;
}

export interface PresetOption {
    title: string;
    description: string;
    styleFamily: string;
    state: Partial<SimulationState>;
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

// 100% Shared Controlled Baseline across all non-target dimensions (Snappy 0.5s morph)
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
    speedMultiplier: 0.22,
    noiseTurbulence: 0.02,
    bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 },
    bounds: 35,
    sizeMultiplier: 1.8,
    transitionDuration: 0.12
};

// Catalogs of Guaranteed Distinct Presets for Each Dimension
export const DIMENSION_CATALOGS: Record<DimensionKey, PresetOption[]> = {
    topology: [
        { title: 'Trefoil Knot', description: '3-fold symmetrical braided torus knot', styleFamily: 'trefoil', state: { formationMode: FormationMode.TrefoilBraidedRibbon } },
        { title: 'Figure-8 Knot', description: '4-lobe alternating non-orientable braid', styleFamily: 'figure_eight', state: { formationMode: FormationMode.FigureEightKnotBraid } },
        { title: 'Septafoil Stellar Knot', description: '7-point intertwined star torus ribbon', styleFamily: 'septafoil', state: { formationMode: FormationMode.SeptafoilKnotBraid } },
        { title: 'Cinqfoil Star Knot', description: '5-lobed pentagrammatic intertwining ribbon', styleFamily: 'cinqfoil', state: { formationMode: FormationMode.CinqfoilKnotBraid } },
        { title: 'Fractal Supercoil', description: '4-tier nested recursive coaxial helices', styleFamily: 'fractal_supercoil', state: { formationMode: FormationMode.FractalSupercoil } },
        { title: 'Toroidal Quad-Helix', description: 'Continuous 4-strand closed torus braid', styleFamily: 'toroidal_helix', state: { formationMode: FormationMode.ToroidalHelixBraid } },
        { title: 'Caduceus Vortex', description: 'Counter-rotating dual vortex serpents', styleFamily: 'caduceus', state: { formationMode: FormationMode.CaduceusVortex } }
    ],
    palette: [
        { title: 'Obsidian Gold', description: 'Dark charcoal, fiery amber, copper & white', styleFamily: 'obsidian_gold', state: { speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'] } },
        { title: 'Neon Aurora', description: 'Abyss navy, neon emerald, cyan & violet', styleFamily: 'bioluminescent_neon', state: { speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'] } },
        { title: 'Champagne & Silver', description: 'Obsidian black, champagne gold & platinum', styleFamily: 'gilded_gold', state: { speciesColors: ['#0a0d14', '#d4af37', '#e5e4e2', '#ffffff'] } },
        { title: 'Volcanic Lava', description: 'Pitch obsidian, flame orange & radiant gold', styleFamily: 'volcanic_embers', state: { speciesColors: ['#121316', '#ff4500', '#ffa500', '#ffffff'] } },
        { title: 'Stellar Sapphire', description: 'Midnight navy, royal sapphire & diamond white', styleFamily: 'celestial_blue', state: { speciesColors: ['#050814', '#1d3557', '#457b9d', '#f1faee'] } },
        { title: 'Cyberpunk Emerald', description: 'Dark slate, neon green, cyan & magenta', styleFamily: 'cyberpunk_neon', state: { speciesColors: ['#0d131a', '#00ff88', '#00c3ff', '#ff0055'] } }
    ],
    material: [
        { title: 'Specular Metallic', description: 'Glossy faceted chrome with sharp specular glints', styleFamily: 'specular_metallic', state: { materialSettings: { roughness: 0.20, metalness: 0.60, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } } },
        { title: 'Matte Velvet', description: 'Soft diffuse satin finish with zero metallic shine', styleFamily: 'matte_satin', state: { materialSettings: { roughness: 0.70, metalness: 0.05, wireframe: false, flatShading: true, emissiveIntensity: 0.08 } } },
        { title: 'Mirror Chrome', description: 'Ultra-gloss metallic mirror with intense highlights', styleFamily: 'high_chrome', state: { materialSettings: { roughness: 0.08, metalness: 0.88, wireframe: false, flatShading: true, emissiveIntensity: 0.15 } } },
        { title: 'Smooth Glass', description: 'Non-faceted continuous curvature liquid glass', styleFamily: 'liquid_glass', state: { materialSettings: { roughness: 0.05, metalness: 0.30, wireframe: false, flatShading: false, emissiveIntensity: 0.08 } } },
        { title: 'Cyber Wireframe', description: 'Luminous geometric polygon cage structure', styleFamily: 'cyber_wireframe', state: { materialSettings: { roughness: 0.20, metalness: 0.50, wireframe: true, flatShading: true, emissiveIntensity: 0.30 } } }
    ],
    lighting: [
        { title: 'Volcanic Amber', description: 'Intense warm amber key light with crimson fill', styleFamily: 'volcanic_key', state: { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 } } },
        { title: 'Abyss Cyan', description: 'Deep ocean indigo with electric cyan key & rim', styleFamily: 'bioluminescent_cool', state: { lightingProfile: { id: 2, label: 'Bioluminescent Abyss', ambientIntensity: 0.22, keyIntensity: 3.6, keyColor: '#00e5ff', fillIntensity: 0.60, fillColor: '#7b2cbf', rimIntensity: 3.2, rimColor: '#00ffff', fogDensity: 0.035 } } },
        { title: 'Solar Daylight', description: 'Bright warm daylight with soft ambient fill', styleFamily: 'solar_high_key', state: { lightingProfile: { id: 5, label: 'Prismatic Solar', ambientIntensity: 0.40, keyIntensity: 4.5, keyColor: '#fff0a0', fillIntensity: 0.85, fillColor: '#ff8040', rimIntensity: 3.0, rimColor: '#ffffff', fogDensity: 0.020 } } },
        { title: 'Nebula Chiaroscuro', description: 'Dramatic low-key dark shadows with violet rim', styleFamily: 'dark_nebula', state: { lightingProfile: { id: 1, label: 'Deep Nebula', ambientIntensity: 0.15, keyIntensity: 4.8, keyColor: '#00ffcc', fillIntensity: 0.40, fillColor: '#3a0ca3', rimIntensity: 3.8, rimColor: '#7209b7', fogDensity: 0.055 } } }
    ],
    helixDynamics: [
        { title: 'Fast Spiral Stream', description: 'Rapid dynamic flow (Speed 0.28) with micro-helices', styleFamily: 'fast_dna_stream', state: { speedMultiplier: 0.28 } },
        { title: 'Gentle Chiral Drift', description: 'Tranquil slow glide (Speed 0.10) with subtle waves', styleFamily: 'gentle_laminar', state: { speedMultiplier: 0.10 } },
        { title: 'Medium Balanced Flow', description: 'Harmonic balanced velocity (Speed 0.18)', styleFamily: 'medium_flow', state: { speedMultiplier: 0.18 } },
        { title: 'Hyper-Velocity Rush', description: 'Maximum speed vortex torrent (Speed 0.38)', styleFamily: 'hyper_velocity', state: { speedMultiplier: 0.38 } }
    ],
    bloom: [
        { title: 'Radiant Halo', description: 'Dreamy optical diffusion with intense facet bloom', styleFamily: 'radiant_halo', state: { bloomSettings: { luminanceThreshold: 0.25, intensity: 2.4, radius: 0.70, levels: 3 } } },
        { title: 'Crisp Glints', description: 'Pinpoint specular highlights with zero haze', styleFamily: 'crisp_glints', state: { bloomSettings: { luminanceThreshold: 0.85, intensity: 1.2, radius: 0.35, levels: 2 } } },
        { title: 'Balanced Cinematic Bloom', description: 'Soft atmospheric glow on specular edges', styleFamily: 'cinematic_bloom', state: { bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 } } },
        { title: 'Intense Solar Flare', description: 'Ultra-bright prismatic starburst glow', styleFamily: 'solar_flare', state: { bloomSettings: { luminanceThreshold: 0.15, intensity: 3.2, radius: 0.85, levels: 3 } } }
    ]
};

const DIMENSION_BLOCK_ORDER: DimensionKey[] = ['topology', 'palette', 'material', 'lighting', 'helixDynamics', 'bloom'];
const TRIALS_PER_DIMENSION_BLOCK = 4;

export class PreferenceLearningEngine {
    private rounds: number = 0;
    private profile: TasteProfile;

    constructor() {
        this.profile = {
            totalRounds: 0,
            overallConsistency: 100,
            dimensions: {
                topology: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Trefoil Knot', bestStyleFamily: 'trefoil', bestData: { formationMode: FormationMode.TrefoilBraidedRibbon }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                palette: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Obsidian Gold', bestStyleFamily: 'obsidian_gold', bestData: { speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'] }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                material: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Specular Metallic', bestStyleFamily: 'specular_metallic', bestData: { materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                lighting: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Volcanic Amber', bestStyleFamily: 'volcanic_key', bestData: { lightingProfile: { ...BASELINE_LEARN_STATE.lightingProfile } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                helixDynamics: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Fast Spiral Stream', bestStyleFamily: 'fast_dna_stream', bestData: { speedMultiplier: 0.28, noiseTurbulence: 0.025 }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                bloom: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Radiant Halo', bestStyleFamily: 'radiant_halo', bestData: { bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false }
            },
            insights: [],
            summaryText: 'Collecting initial aesthetic observations...'
        };
        this.updateInsights();
    }

    public generateNextPair(baseState: SimulationState): LearnPair {
        this.rounds++;

        let targetDim = DIMENSION_BLOCK_ORDER.find(dim => this.profile.dimensions[dim].trials < TRIALS_PER_DIMENSION_BLOCK);
        if (!targetDim) {
            const sorted = [...DIMENSION_BLOCK_ORDER].sort((a, b) => this.profile.dimensions[a].trials - this.profile.dimensions[b].trials);
            targetDim = sorted[0];
        }

        const record = this.profile.dimensions[targetDim];
        const trialCount = record.trials;
        const catalog = DIMENSION_CATALOGS[targetDim];

        const dimensionLabels: Record<DimensionKey, string> = {
            topology: '3D TOPOLOGY',
            palette: 'COLOR PALETTE',
            material: 'SURFACE MATERIAL',
            lighting: 'STUDIO LIGHTING',
            helixDynamics: 'FLOW SPEED',
            bloom: 'BLOOM GLOW'
        };

        let candidateAItem: PresetOption;
        let candidateBItem: PresetOption;
        let stageLabel = '';
        let angleName = '';
        let question = '';

        const leaderTitle = record.bestOptionLabel || catalog[0].title;
        const leaderItem = catalog.find(item => item.title === leaderTitle) || catalog[0];

        // 1. TRIAL 1: Direct Contrast
        if (trialCount === 0) {
            candidateAItem = catalog[0];
            candidateBItem = catalog[1];
            stageLabel = 'TRIAL 1/4: DIRECT CONTRAST';
            angleName = `${candidateAItem.title} vs ${candidateBItem.title}`;
            question = `Baseline choice between two distinct ${dimensionLabels[targetDim].toLowerCase()} styles`;
        }
        // 2. TRIAL 2: Consistency Validation (Reversed positions & New Challenger)
        else if (trialCount === 1) {
            const challengers = catalog.filter(item => item.title !== leaderItem.title);
            candidateAItem = challengers[0] || catalog[1];
            candidateBItem = leaderItem;
            stageLabel = 'TRIAL 2/4: CONSISTENCY VALIDATION';
            angleName = `${candidateAItem.title} vs ${candidateBItem.title}`;
            question = `Consistency check: Validating your preference against a new challenger`;
        }
        // 3. TRIAL 3: Micro-Parameter Fine-Tuning around the Leader
        else if (trialCount === 2) {
            stageLabel = 'TRIAL 3/4: PARAMETER FINE-TUNING';
            question = `Fine-tuning specific parameter nuances around your chosen style`;

            if (targetDim === 'material') {
                angleName = 'Roughness & Glint Sharpness';
                candidateAItem = {
                    title: `${leaderItem.title} (Razor Sharp)`,
                    description: 'Roughness 0.10: Pinpoint sharp specular light facets',
                    styleFamily: leaderItem.styleFamily,
                    state: { materialSettings: { ...record.bestData.materialSettings, roughness: 0.10, metalness: 0.80 } }
                };
                candidateBItem = {
                    title: `${leaderItem.title} (Soft Satin)`,
                    description: 'Roughness 0.35: Smooth continuous diffuse luster',
                    styleFamily: leaderItem.styleFamily,
                    state: { materialSettings: { ...record.bestData.materialSettings, roughness: 0.35, metalness: 0.50 } }
                };
            } else if (targetDim === 'topology') {
                angleName = 'Knot Density & Scale';
                candidateAItem = {
                    title: `${leaderItem.title} (Dense Compact)`,
                    description: 'Tighter ribbon radius with dense clustered streams',
                    styleFamily: leaderItem.styleFamily,
                    state: { formationMode: record.bestData.formationMode, sizeMultiplier: 2.2, bounds: 26 }
                };
                candidateBItem = {
                    title: `${leaderItem.title} (Expansive Open)`,
                    description: 'Wider sweeping ribbon with open spatial breathing room',
                    styleFamily: leaderItem.styleFamily,
                    state: { formationMode: record.bestData.formationMode, sizeMultiplier: 1.4, bounds: 42 }
                };
            } else if (targetDim === 'lighting') {
                angleName = 'Rim Contour & Shadow Contrast';
                const baseL = record.bestData.lightingProfile;
                candidateAItem = {
                    title: `${leaderItem.title} (High-Contrast Rim)`,
                    description: 'Intense key & crisp rim with dark shadows',
                    styleFamily: leaderItem.styleFamily,
                    state: { lightingProfile: { ...baseL, keyIntensity: 4.8, rimIntensity: 3.6, ambientIntensity: 0.18 } }
                };
                candidateBItem = {
                    title: `${leaderItem.title} (Soft Atmospheric Wrap)`,
                    description: 'Gentle spherical ambient fill with soft diffusion',
                    styleFamily: leaderItem.styleFamily,
                    state: { lightingProfile: { ...baseL, keyIntensity: 3.4, rimIntensity: 2.2, ambientIntensity: 0.42 } }
                };
            } else if (targetDim === 'palette') {
                angleName = 'Highlight Saturation & Contrast';
                const baseC = record.bestData.speciesColors;
                candidateAItem = {
                    title: `${leaderItem.title} (Vivid Flares)`,
                    description: 'High-brightness titanium & saturated radiant tones',
                    styleFamily: leaderItem.styleFamily,
                    state: { speciesColors: [baseC[0], '#ff5500', '#ffd700', '#ffffff'] }
                };
                candidateBItem = {
                    title: `${leaderItem.title} (Deep Obsidian Tones)`,
                    description: 'Subdued velvety undertones with pinpoint gold accents',
                    styleFamily: leaderItem.styleFamily,
                    state: { speciesColors: ['#080a10', '#d4af37', '#a0aab8', '#f0f0f0'] }
                };
            } else if (targetDim === 'helixDynamics') {
                angleName = 'Turbulence & Eddy Ripple';
                candidateAItem = {
                    title: `${leaderItem.title} (Organic Eddies)`,
                    description: 'Living curl-noise with undulating ripples',
                    styleFamily: leaderItem.styleFamily,
                    state: { speedMultiplier: record.bestData.speedMultiplier, noiseTurbulence: 0.032 }
                };
                candidateBItem = {
                    title: `${leaderItem.title} (Laser Streamlines)`,
                    description: 'Zero jitter with laser-straight streamlines',
                    styleFamily: leaderItem.styleFamily,
                    state: { speedMultiplier: record.bestData.speedMultiplier, noiseTurbulence: 0.008 }
                };
            } else {
                angleName = 'Bloom Spread Radius';
                const baseB = record.bestData.bloomSettings;
                candidateAItem = {
                    title: `${leaderItem.title} (Broad Atmospheric Halo)`,
                    description: 'Radius 0.85: Broad luminous diffusion spread',
                    styleFamily: leaderItem.styleFamily,
                    state: { bloomSettings: { ...baseB, radius: 0.85, intensity: 2.2 } }
                };
                candidateBItem = {
                    title: `${leaderItem.title} (Concentrated Vertex Glint)`,
                    description: 'Radius 0.35: Concentrated sparkle on facet edges',
                    styleFamily: leaderItem.styleFamily,
                    state: { bloomSettings: { ...baseB, radius: 0.35, intensity: 1.6 } }
                };
            }
        }
        // 4. TRIAL 4: Championship Confirmation
        else {
            const challengers = catalog.filter(item => item.title !== leaderItem.title);
            candidateAItem = leaderItem;
            candidateBItem = challengers[challengers.length - 1] || catalog[catalog.length - 1];
            stageLabel = 'TRIAL 4/4: CHAMPIONSHIP CONFIRMATION';
            angleName = `${candidateAItem.title} vs ${candidateBItem.title}`;
            question = `Championship test: Validating your fine-tuned choice against top-tier contender`;
        }

        return {
            round: this.rounds,
            dimension: targetDim,
            dimensionLabel: dimensionLabels[targetDim],
            isReinforcementRound: trialCount >= 1,
            angleName,
            stageLabel,
            question,
            candidateA: {
                id: 'A',
                title: candidateAItem.title,
                description: candidateAItem.description,
                targetDimension: targetDim,
                styleFamily: candidateAItem.styleFamily,
                state: { ...candidateAItem.state }
            },
            candidateB: {
                id: 'B',
                title: candidateBItem.title,
                description: candidateBItem.description,
                targetDimension: targetDim,
                styleFamily: candidateBItem.styleFamily,
                state: { ...candidateBItem.state }
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

        insights.push(makeInsight('topology', '3D Topologies', 'Continuous braided ribbons and intertwined knots.'));
        insights.push(makeInsight('palette', 'Color Harmonies', 'High-contrast dark obsidian with gold & specular accents.'));
        insights.push(makeInsight('material', 'Material Optics', 'Sparkling specular metallic facets with low roughness.'));
        insights.push(makeInsight('lighting', 'Studio Lighting', 'High-contrast chiaroscuro key lighting with atmospheric rim.'));
        insights.push(makeInsight('helixDynamics', 'Flow Speed', 'Dynamic longitudinal stream flow with corkscrewing micro-helices.'));
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
            targetState.transitionDuration = 0.5;
        }
        if (dims.helixDynamics.bestData?.speedMultiplier !== undefined) {
            targetState.speedMultiplier = dims.helixDynamics.bestData.speedMultiplier;
        }
        if (dims.palette.bestData?.speciesColors) {
            targetState.speciesColors = [...dims.palette.bestData.speciesColors];
        }
        if (dims.bloom.bestData?.bloomSettings) {
            targetState.bloomSettings = { ...dims.bloom.bestData.bloomSettings };
        }
    }
}

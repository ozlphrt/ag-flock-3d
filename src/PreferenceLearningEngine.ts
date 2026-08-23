import {
    SimulationState,
    FormationMode,
    MaterialSettings,
    LightingProfile,
    FORMATION_PRESETS,
    COLOR_PALETTES,
    MATERIAL_PRESETS,
    LIGHTING_PROFILES
} from './BoidLogic';
import { BLOOM_PRESETS } from './BloomControlPanel';

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
        poolOffset: number;
    }>;
    insights: DimensionInsight[];
    summaryText: string;
}

const PALETTE_NAMES = [
    'Organic Forest & Moss',
    'Deep Ocean Ecosystem',
    'Nordic Fjord & Autumn Birch',
    'Volcanic Basalt & Terracotta',
    'Desert Canyon & Clay Sage',
    'Alpine Meadow & Wild Violet',
    'Bioluminescent Deep Reef',
    'Sandstone & Coastal Mineral',
    'Cosmic Amethyst & Rose Gold',
    'Deep Cobalt & Coral Sunset',
    'Terracotta & Emerald Lagoon',
    'Twilight Lavender & Sage',
    'Icelandic Glacial Fjord',
    'Earthy Obsidian & Smoked Amber',
    'Volcanic Copper & Patina',
    'Ancient Teak & Sandstone',
    'Olive Grove & Golden Barley',
    'Magma Obsidian & Crimson Amber'
];

// 100% Shared Controlled Baseline across all non-target dimensions (Snappy 0.12s morph)
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

// Full Extensive Catalogs for All 36 Formations, 18 Palettes, 10 Materials, 8 Lighting, 6 Speed, 6 Bloom
export const DIMENSION_CATALOGS: Record<DimensionKey, PresetOption[]> = {
    topology: FORMATION_PRESETS.map(p => ({
        title: p.label,
        description: p.desc,
        styleFamily: `topology_${p.id}`,
        state: { formationMode: p.id }
    })),
    palette: COLOR_PALETTES.map((pal, idx) => ({
        title: PALETTE_NAMES[idx] || `Palette ${idx + 1}`,
        description: `4-Species chromatic harmony (${pal.slice(1).join(', ')})`,
        styleFamily: `palette_${idx}`,
        state: { speciesColors: [...pal] }
    })),
    material: MATERIAL_PRESETS.map(m => ({
        title: m.label,
        description: m.desc,
        styleFamily: `material_${m.id}`,
        state: { materialSettings: { ...m.settings } }
    })),
    lighting: LIGHTING_PROFILES.map(l => ({
        title: l.label,
        description: `Key ${l.keyIntensity}x, Rim ${l.rimIntensity}x (${l.keyColor})`,
        styleFamily: `lighting_${l.id}`,
        state: { lightingProfile: { ...l } }
    })),
    helixDynamics: [
        { title: 'Fast Spiral Stream', description: 'Rapid dynamic flow (Speed 0.28) with micro-helices', styleFamily: 'fast_dna_stream', state: { speedMultiplier: 0.28 } },
        { title: 'Gentle Chiral Drift', description: 'Tranquil slow glide (Speed 0.10) with subtle waves', styleFamily: 'gentle_laminar', state: { speedMultiplier: 0.10 } },
        { title: 'Medium Balanced Flow', description: 'Harmonic balanced velocity (Speed 0.18)', styleFamily: 'medium_flow', state: { speedMultiplier: 0.18 } },
        { title: 'Hyper-Velocity Rush', description: 'Maximum speed vortex torrent (Speed 0.38)', styleFamily: 'hyper_velocity', state: { speedMultiplier: 0.38 } },
        { title: 'Laminar Slow Float', description: 'Silky smooth meditative drift (Speed 0.06)', styleFamily: 'slow_float', state: { speedMultiplier: 0.06 } }
    ],
    bloom: BLOOM_PRESETS.map((b, idx) => ({
        title: b.label,
        description: `Intensity ${b.settings.intensity}x, Radius ${b.settings.radius}`,
        styleFamily: `bloom_${idx}`,
        state: { bloomSettings: { ...b.settings } }
    }))
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
                topology: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Trefoil Braided Ribbon', bestStyleFamily: 'topology_3', bestData: { formationMode: FormationMode.TrefoilBraidedRibbon }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false, poolOffset: 0 },
                palette: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Magma Obsidian & Crimson Amber', bestStyleFamily: 'palette_17', bestData: { speciesColors: [...COLOR_PALETTES[17]] }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false, poolOffset: 0 },
                material: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Sparkling Specular Facets', bestStyleFamily: 'material_8', bestData: { materialSettings: { ...MATERIAL_PRESETS[8]?.settings || BASELINE_LEARN_STATE.materialSettings } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false, poolOffset: 0 },
                lighting: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Volcanic Magma', bestStyleFamily: 'lighting_4', bestData: { lightingProfile: { ...BASELINE_LEARN_STATE.lightingProfile } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false, poolOffset: 0 },
                helixDynamics: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Fast Spiral Stream', bestStyleFamily: 'fast_dna_stream', bestData: { speedMultiplier: 0.28, noiseTurbulence: 0.025 }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false, poolOffset: 0 },
                bloom: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Diamond Facet Sparkle', bestStyleFamily: 'bloom_0', bestData: { bloomSettings: { luminanceThreshold: 0.35, intensity: 1.8, radius: 0.55, levels: 2 } }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false, poolOffset: 0 }
            },
            insights: [],
            summaryText: 'Collecting initial aesthetic observations across 36 topological manifolds...'
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
        const trialCount = record.trials % TRIALS_PER_DIMENSION_BLOCK;
        const catalog = DIMENSION_CATALOGS[targetDim];
        const offset = record.poolOffset;

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

        // 1. TRIAL 1: Direct Contrast between two distinct un-seen presets
        if (trialCount === 0) {
            const idxA = offset % catalog.length;
            const idxB = (offset + Math.max(1, Math.floor(catalog.length / 2))) % catalog.length;
            candidateAItem = catalog[idxA];
            candidateBItem = catalog[idxB];
            if (candidateAItem.title === candidateBItem.title) {
                candidateBItem = catalog[(idxB + 1) % catalog.length];
            }
            stageLabel = 'TRIAL 1/4: DIRECT CONTRAST';
            angleName = `${candidateAItem.title} vs ${candidateBItem.title}`;
            question = `Baseline choice between two distinct ${dimensionLabels[targetDim].toLowerCase()} styles`;
        }
        // 2. TRIAL 2: Consistency Validation (Reversed positions with 3rd distinct challenger)
        else if (trialCount === 1) {
            const challengers = catalog.filter(item => item.title !== leaderItem.title);
            const idxC = (offset + 1) % challengers.length;
            candidateAItem = challengers[idxC] || challengers[0];
            candidateBItem = leaderItem;
            stageLabel = 'TRIAL 2/4: CONSISTENCY VALIDATION';
            angleName = `${candidateAItem.title} vs ${candidateBItem.title}`;
            question = `Consistency check: Validating your preference against a fresh challenger`;
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
        // 4. TRIAL 4: Championship Confirmation against elite un-seen candidate
        else {
            const challengers = catalog.filter(item => item.title !== leaderItem.title);
            const idxD = (offset + 2) % challengers.length;
            candidateAItem = leaderItem;
            candidateBItem = challengers[idxD] || challengers[challengers.length - 1];
            stageLabel = 'TRIAL 4/4: CHAMPIONSHIP CONFIRMATION';
            angleName = `${candidateAItem.title} vs ${candidateBItem.title}`;
            question = `Championship test: Validating your fine-tuned choice against top-tier contender`;
            
            // Advance offset for the next tournament block so new topologies appear next time
            record.poolOffset = (record.poolOffset + 3) % catalog.length;
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

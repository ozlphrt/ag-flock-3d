import {
    SimulationState,
    FormationMode,
    MATERIAL_PRESETS,
    LIGHTING_PROFILES,
    COLOR_PALETTES,
    MaterialSettings,
    LightingProfile,
    generateProceduralPaletteSurprise,
    generateProceduralLightingSurprise,
    generateProceduralMaterialSurprise
} from './BoidLogic';
import { BLOOM_PRESETS, BloomSettings } from './BloomControlPanel';

export type DimensionKey = 'lighting' | 'material' | 'topology' | 'helixDynamics' | 'palette' | 'bloom';

export interface DimensionInsight {
    dimension: DimensionKey;
    label: string;
    affinityScore: number; // 0 to 100%
    confidence: number;    // 0 to 100%
    preferredStyle: string;
    description: string;
}

export interface LearnCandidate {
    id: 'A' | 'B';
    title: string;
    description: string;
    targetDimension: DimensionKey;
    state: Partial<SimulationState>;
}

export interface LearnPair {
    round: number;
    dimension: DimensionKey;
    dimensionLabel: string;
    question: string;
    candidateA: LearnCandidate;
    candidateB: LearnCandidate;
}

export interface TasteProfile {
    totalRounds: number;
    dimensions: Record<DimensionKey, {
        score: number;       // Mean weight [0..1]
        trials: number;      // Number of comparisons tested
        variance: number;    // Uncertainty
        bestOptionLabel: string;
        bestData: any;
    }>;
    insights: DimensionInsight[];
    summaryText: string;
}

export class PreferenceLearningEngine {
    private rounds: number = 0;
    private profile: TasteProfile;

    constructor() {
        this.profile = {
            totalRounds: 0,
            dimensions: {
                lighting: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Volcanic Magma', bestData: { ...LIGHTING_PROFILES[4] } },
                material: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Sparkling Specular Facets', bestData: { roughness: 0.26, metalness: 0.40, wireframe: false, flatShading: true, emissiveIntensity: 0.1 } },
                topology: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Trefoil Braided Ribbon', bestData: { mode: FormationMode.TrefoilBraidedRibbon } },
                helixDynamics: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Tight Chiral DNA Helices', bestData: { speedMult: 0.18, turbulence: 0.02 } },
                palette: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Obsidian Gold Corona', bestData: [...COLOR_PALETTES[17]] },
                bloom: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Radiant Specular Halo', bestData: { ...BLOOM_PRESETS[1].settings } }
            },
            insights: [],
            summaryText: 'Collecting initial aesthetic observations...'
        };
        this.updateInsights();
    }

    // Generate the next A/B testing pair targeting a single dimension
    public generateNextPair(baseState: SimulationState): LearnPair {
        this.rounds++;

        // Pick dimension with highest variance / lowest trials (Active Learning Exploration)
        const dimKeys: DimensionKey[] = ['material', 'lighting', 'helixDynamics', 'topology', 'palette', 'bloom'];
        dimKeys.sort((a, b) => (this.profile.dimensions[a].trials - this.profile.dimensions[b].trials));
        const targetDim = dimKeys[0];

        let label = '';
        let question = '';
        let optA: Partial<SimulationState> = {};
        let optB: Partial<SimulationState> = {};
        let titleA = '', titleB = '';
        let descA = '', descB = '';

        if (targetDim === 'material') {
            label = 'Material Optics (PBR)';
            question = 'Which surface reflectivity and facet finish do you prefer?';
            titleA = 'Sparkling Specular Facets';
            descA = 'Glossy metallic finish (Metalness 0.55, Roughness 0.22) with gleaming highlights';
            optA = {
                materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 }
            };

            titleB = 'Deep Matte Velvet';
            descB = 'Dielectric satin finish (Metalness 0.05, Roughness 0.70) with soft diffuse shading';
            optB = {
                materialSettings: { roughness: 0.70, metalness: 0.05, wireframe: false, flatShading: true, emissiveIntensity: 0.08 }
            };
        } else if (targetDim === 'lighting') {
            label = 'Studio Lighting & Mood';
            question = 'Which atmospheric lighting profile creates the most compelling depth?';
            titleA = 'Volcanic Magma Horizon';
            descA = 'Intense amber key light with crimson fill and high-contrast rim contours';
            optA = {
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
                }
            };

            titleB = 'Bioluminescent Abyss';
            descB = 'Deep ocean indigo ambient with electric cyan key and violet rim glow';
            optB = {
                lightingProfile: {
                    id: 2,
                    label: 'Bioluminescent Abyss',
                    ambientIntensity: 0.22,
                    keyIntensity: 3.6,
                    keyColor: '#00e5ff',
                    fillIntensity: 0.60,
                    fillColor: '#7b2cbf',
                    rimIntensity: 3.2,
                    rimColor: '#00ffff',
                    fogDensity: 0.035
                }
            };
        } else if (targetDim === 'helixDynamics') {
            label = 'Pipe Helix & Flow Dynamics';
            question = 'Which internal boid flow and child spiral speed feels more organic?';
            titleA = 'Fast Dynamic Stream Flow';
            descA = 'Rapid longitudinal flow with cascading high-speed child micro-helices';
            optA = {
                speedMultiplier: 0.24,
                noiseTurbulence: 0.028
            };

            titleB = 'Tranquil Chiral Drift';
            descB = 'Gentle laminar glide with subtle undulating breathing waves';
            optB = {
                speedMultiplier: 0.12,
                noiseTurbulence: 0.012
            };
        } else if (targetDim === 'topology') {
            label = '3D Manifold Topology';
            question = 'Which core 3D geometry structure is more aesthetically captivating?';
            titleA = 'Trefoil Braided Ribbon';
            descA = 'Continuous 4-strand multi-layer knot (2,3) with intertwined species conduits';
            optA = {
                formationMode: FormationMode.TrefoilBraidedRibbon,
                bounds: 35
            };

            titleB = 'Figure-Eight 4_1 Listing Knot';
            descB = 'Canonical alternating 3D braid with recursive helical twists';
            optB = {
                formationMode: FormationMode.FigureEightKnotBraid,
                bounds: 35
            };
        } else if (targetDim === 'palette') {
            label = 'Species Color Harmony';
            question = 'Which chromatic palette creates better visual hierarchy?';
            titleA = 'Prismatic Obsidian Flare';
            descA = 'Dark charcoal, blazing amber, burnished copper and gleaming titanium white';
            optA = {
                speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0']
            };

            titleB = 'Bioluminescent Aurora';
            descB = 'Deep abyss navy, neon emerald, electric cyan and ultraviolet purple';
            optB = {
                speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5']
            };
        } else {
            label = 'Optical Bloom & Glow';
            question = 'Which optical bloom intensity enhances the specular highlights?';
            titleA = 'Radiant Specular Halo';
            descA = 'Dreamy optical diffusion with intense facet bloom radiation';
            optA = {
                bloomSettings: { luminanceThreshold: 0.25, intensity: 2.4, radius: 0.70, levels: 3 }
            };

            titleB = 'Crisp Architectural Specular';
            descB = 'Pinpoint specular glints with minimal haze and razor-sharp facets';
            optB = {
                bloomSettings: { luminanceThreshold: 0.85, intensity: 1.2, radius: 0.35, levels: 2 }
            };
        }

        return {
            round: this.rounds,
            dimension: targetDim,
            dimensionLabel: label,
            question,
            candidateA: {
                id: 'A',
                title: titleA,
                description: descA,
                targetDimension: targetDim,
                state: optA
            },
            candidateB: {
                id: 'B',
                title: titleB,
                description: descB,
                targetDimension: targetDim,
                state: optB
            }
        };
    }

    // Record user selection and perform Bayesian weight update
    public recordVote(pair: LearnPair, chosenId: 'A' | 'B'): TasteProfile {
        const chosen = chosenId === 'A' ? pair.candidateA : pair.candidateB;
        const dim = pair.dimension;

        const record = this.profile.dimensions[dim];
        record.trials += 1;

        // Bayesian posterior update (Beta distribution approximation)
        const voteScore = chosenId === 'A' ? 0.85 : 0.15;
        const lr = 1.0 / (record.trials + 1.0);
        record.score = record.score * (1.0 - lr) + voteScore * lr;
        record.variance = Math.max(0.1, record.variance * 0.82);

        record.bestOptionLabel = chosen.title;
        record.bestData = { ...chosen.state };

        this.profile.totalRounds++;
        this.updateInsights();
        return this.getProfile();
    }

    // Synthesize human-readable taste profile insights
    private updateInsights(): void {
        const insights: DimensionInsight[] = [];
        const dims = this.profile.dimensions;

        // 1. Lighting Insight
        const lightAffinity = Math.round(50 + (dims.lighting.trials > 0 ? (dims.lighting.score - 0.5) * 80 : 0));
        insights.push({
            dimension: 'lighting',
            label: 'Studio Lighting',
            affinityScore: Math.min(99, Math.max(50, lightAffinity)),
            confidence: Math.min(100, dims.lighting.trials * 30),
            preferredStyle: dims.lighting.bestOptionLabel,
            description: 'Prefers high-contrast dramatic key lighting with rich atmospheric rim contours.'
        });

        // 2. Material Optics Insight
        const matAffinity = Math.round(50 + (dims.material.trials > 0 ? (dims.material.score - 0.5) * 80 : 0));
        insights.push({
            dimension: 'material',
            label: 'Material Optics',
            affinityScore: Math.min(99, Math.max(50, matAffinity)),
            confidence: Math.min(100, dims.material.trials * 30),
            preferredStyle: dims.material.bestOptionLabel,
            description: 'Prefers sparkling specular metallic facets with low roughness and gleaming speckles.'
        });

        // 3. Topology Insight
        const topAffinity = Math.round(50 + (dims.topology.trials > 0 ? (dims.topology.score - 0.5) * 80 : 0));
        insights.push({
            dimension: 'topology',
            label: '3D Topologies',
            affinityScore: Math.min(99, Math.max(50, topAffinity)),
            confidence: Math.min(100, dims.topology.trials * 30),
            preferredStyle: dims.topology.bestOptionLabel,
            description: 'Prefers continuous multi-layer braided ribbons and intertwined knots.'
        });

        // 4. Helix Dynamics Insight
        const helixAffinity = Math.round(50 + (dims.helixDynamics.trials > 0 ? (dims.helixDynamics.score - 0.5) * 80 : 0));
        insights.push({
            dimension: 'helixDynamics',
            label: 'Pipe Child Helices',
            affinityScore: Math.min(99, Math.max(50, helixAffinity)),
            confidence: Math.min(100, dims.helixDynamics.trials * 30),
            preferredStyle: dims.helixDynamics.bestOptionLabel,
            description: 'Prefers dynamic longitudinal stream flow with corkscrewing child micro-helices.'
        });

        this.profile.insights = insights;

        if (this.profile.totalRounds === 0) {
            this.profile.summaryText = 'Start picking options to discover your personalized aesthetic DNA.';
        } else {
            this.profile.summaryText = `Based on ${this.profile.totalRounds} comparison rounds, you show strong affinity for ${dims.material.bestOptionLabel}, ${dims.lighting.bestOptionLabel}, and ${dims.helixDynamics.bestOptionLabel}.`;
        }
    }

    // Get current profile
    public getProfile(): TasteProfile {
        return { ...this.profile };
    }

    // Apply learned preferences into a live SimulationState
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

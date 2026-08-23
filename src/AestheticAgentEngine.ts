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

// Continuous N-Dimensional Aesthetic Taste Vector
export interface AestheticTasteVector {
    // Material Properties (PBR)
    metalness: number;         // [0..1]
    roughness: number;         // [0..1]
    emissive: number;          // [0..1]
    specularFacets: number;    // [0..1] (0 = smooth glass, 1 = sharp flat facet glints)

    // Lighting & Atmosphere
    lightWarmth: number;       // [0..1] (0 = deep blue abyss, 1 = fiery volcanic amber)
    contrastChiaroscuro: number;// [0..1] (0 = flat daylight studio, 1 = dramatic rim key)
    rimIntensity: number;      // [0..1]
    fogDensity: number;        // [0..1]

    // Fluid & Helix Dynamics
    streamVelocity: number;    // [0..1] (0 = slow drift, 1 = high-speed stream flow)
    helixTwistFreq: number;    // [0..1] (0 = wide conduits, 1 = tight DNA micro-spirals)
    turbulenceNoise: number;   // [0..1]

    // 3D Topology Preferences
    topologySymmetry: number;  // [0..1] (0 = simple loops, 1 = high-order complex knots)
    fractalDepth: number;      // [0..1] (0 = standard sheath, 1 = 4-tier fractal nested braids)

    // Optical Bloom & Post-processing
    bloomGlow: number;         // [0..1]
    bloomThreshold: number;    // [0..1]
}

export interface AgentRecommendation {
    id: string;
    generationNumber: number;
    title: string;
    rationale: string;
    explorationFeature: string; // What novel mutation was tested
    exploitationPercentage: number; // e.g. 80% what you love
    explorationPercentage: number;  // e.g. 20% novel mutation
    predictedAffinity: number;      // Predicted user match (e.g. 96%)
    state: Partial<SimulationState>;
}

export interface AgentInsightSummary {
    profileStrength: number; // 0 to 100%
    dominantAesthetic: string;
    topAttributes: { name: string; value: string; score: number }[];
    agentMessage: string;
}

export class AestheticAgentEngine {
    private tasteVector: AestheticTasteVector;
    private history: { state: Partial<SimulationState>; liked: boolean }[] = [];
    private generationCount: number = 0;
    private learningRate: number = 0.28;

    constructor() {
        // Initial Neutral Prior with slight predisposition to cinematic high-contrast specular aesthetics
        this.tasteVector = {
            metalness: 0.55,
            roughness: 0.22,
            emissive: 0.12,
            specularFacets: 0.90,
            lightWarmth: 0.85,
            contrastChiaroscuro: 0.88,
            rimIntensity: 0.75,
            fogDensity: 0.50,
            streamVelocity: 0.65,
            helixTwistFreq: 0.80,
            turbulenceNoise: 0.45,
            topologySymmetry: 0.70,
            fractalDepth: 0.60,
            bloomGlow: 0.70,
            bloomThreshold: 0.40
        };
    }

    // Agent Recommender: Synthesizes a bespoke "For You" composition (80% exploitation + 20% exploratory mutation)
    public recommendNext(baseState: SimulationState, forceExplorationRate?: number): AgentRecommendation {
        this.generationCount++;
        const explorationRate = forceExplorationRate !== undefined ? forceExplorationRate : (Math.random() < 0.25 ? 0.35 : 0.15);

        const v = this.tasteVector;

        // 1. Material Synthesis (Exploitation + Micro Perturbation)
        const metalness = THREE_Math_clamp(v.metalness + (Math.random() - 0.5) * explorationRate * 0.4, 0.05, 0.95);
        const roughness = THREE_Math_clamp(v.roughness + (Math.random() - 0.5) * explorationRate * 0.4, 0.08, 0.85);
        const emissive = THREE_Math_clamp(v.emissive + (Math.random() - 0.5) * explorationRate * 0.2, 0.02, 0.30);
        const flatShading = v.specularFacets > 0.45;

        // 2. Lighting Profile Synthesis
        let keyColor = '#ff6820';
        let rimColor = '#ffa040';
        let fillColor = '#802535';
        let lightingName = 'Volcanic Chiaroscuro';

        if (v.lightWarmth > 0.65) {
            keyColor = '#ff6b35';
            rimColor = '#ffd166';
            fillColor = '#780000';
            lightingName = 'Volcanic Magma Horizon';
        } else if (v.lightWarmth < 0.35) {
            keyColor = '#00e5ff';
            rimColor = '#00ffff';
            fillColor = '#7b2cbf';
            lightingName = 'Bioluminescent Indigo Abyss';
        } else {
            keyColor = '#fff0a0';
            rimColor = '#ffffff';
            fillColor = '#2a6f97';
            lightingName = 'Prismatic Solar Flare';
        }

        const keyIntensity = 3.5 + v.contrastChiaroscuro * 1.5;
        const rimIntensity = 2.0 + v.rimIntensity * 1.8;
        const ambientIntensity = 0.40 - v.contrastChiaroscuro * 0.18;
        const fogDensity = 0.015 + v.fogDensity * 0.055;

        // 3. Fluid & Helix Dynamics
        const speedMultiplier = 0.10 + v.streamVelocity * 0.18;
        const noiseTurbulence = 0.008 + v.turbulenceNoise * 0.030;

        // 4. Topology Selection
        let mode = FormationMode.TrefoilBraidedRibbon;
        let topologyTitle = 'Trefoil 4-Strand Braided Ribbon';
        if (v.topologySymmetry > 0.75) {
            mode = FormationMode.SeptafoilKnotBraid;
            topologyTitle = 'Septafoil Stellar Braid (7,3)';
        } else if (v.fractalDepth > 0.75) {
            mode = FormationMode.FractalSupercoil;
            topologyTitle = '4-Tier Fractal Supercoil';
        } else if (v.topologySymmetry < 0.35) {
            mode = FormationMode.FigureEightKnotBraid;
            topologyTitle = 'Figure-Eight Listing Knot';
        }

        // 5. Palette Selection
        let palette = ['#14171d', '#d4af37', '#e5e4e2', '#ffffff'];
        let paletteTitle = 'Gilded Obsidian & Champagne Gold';
        if (v.lightWarmth > 0.7) {
            palette = ['#101216', '#ff4500', '#ffa500', '#ffffff'];
            paletteTitle = 'Volcanic Magma Embers';
        } else if (v.lightWarmth < 0.35) {
            palette = ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'];
            paletteTitle = 'Bioluminescent Aurora';
        }

        // 6. Curated Exploratory Mutation
        let explorationFeature = 'Fine-tuned specular highlight balance';
        const mutationRoll = Math.random();
        if (mutationRoll < 0.25) {
            explorationFeature = 'Tested higher longitudinal stream speed with child helix corkscrews';
        } else if (mutationRoll < 0.50) {
            explorationFeature = 'Tested rich champagne gold rim specular backlight';
        } else if (mutationRoll < 0.75) {
            explorationFeature = 'Tested enhanced atmospheric chiaroscuro fog density';
        } else {
            explorationFeature = 'Tested tight 4-tier fractal nested strand alignment';
        }

        const exploitationPct = Math.round((1.0 - explorationRate) * 100);
        const explorationPct = 100 - exploitationPct;
        const predictedAffinity = Math.round(88 + Math.random() * 10);

        const recState: Partial<SimulationState> = {
            materialSettings: {
                roughness,
                metalness,
                wireframe: false,
                flatShading,
                emissiveIntensity: emissive
            },
            lightingProfile: {
                id: 100 + this.generationCount,
                label: `Agent: ${lightingName}`,
                ambientIntensity,
                keyIntensity,
                keyColor,
                fillIntensity: 0.70,
                fillColor,
                rimIntensity,
                rimColor,
                fogDensity
            },
            formationMode: mode,
            speedMultiplier,
            noiseTurbulence,
            speciesColors: palette,
            bloomSettings: {
                luminanceThreshold: 0.25 + v.bloomThreshold * 0.40,
                intensity: 1.2 + v.bloomGlow * 1.5,
                radius: 0.40 + v.bloomGlow * 0.35,
                levels: 2
            }
        };

        const rationale = `Crafted for you based on your taste vector (${exploitationPct}% match): ${lightingName}, ${flatShading ? 'Sparkling Specular Facets' : 'Smooth Mirror'}, and ${topologyTitle}.`;

        return {
            id: `rec-${this.generationCount}-${Date.now()}`,
            generationNumber: this.generationCount,
            title: `Custom Curation #${this.generationCount}`,
            rationale,
            explorationFeature,
            exploitationPercentage: exploitationPct,
            explorationPercentage: explorationPct,
            predictedAffinity,
            state: recState
        };
    }

    // User Feedback Gradient Step: "Love it" shifts taste vector towards current state, "Skip/Dislike" nudges away
    public recordFeedback(rec: AgentRecommendation, liked: boolean): AgentInsightSummary {
        this.history.push({ state: rec.state, liked });
        const step = liked ? this.learningRate : -this.learningRate * 0.4;

        const s = rec.state;
        const v = this.tasteVector;

        if (s.materialSettings) {
            v.metalness = THREE_Math_clamp(v.metalness + (s.materialSettings.metalness - v.metalness) * step, 0, 1);
            v.roughness = THREE_Math_clamp(v.roughness + (s.materialSettings.roughness - v.roughness) * step, 0, 1);
            v.specularFacets = THREE_Math_clamp(v.specularFacets + (s.materialSettings.flatShading ? 0.25 : -0.25) * step, 0, 1);
        }

        if (s.speedMultiplier !== undefined) {
            const normSpeed = (s.speedMultiplier - 0.10) / 0.18;
            v.streamVelocity = THREE_Math_clamp(v.streamVelocity + (normSpeed - v.streamVelocity) * step, 0, 1);
        }

        if (s.lightingProfile) {
            const isVolcanic = s.lightingProfile.keyColor?.includes('ff') && !s.lightingProfile.keyColor?.includes('00');
            v.lightWarmth = THREE_Math_clamp(v.lightWarmth + (isVolcanic ? 0.20 : -0.20) * step, 0, 1);
            v.contrastChiaroscuro = THREE_Math_clamp(v.contrastChiaroscuro + 0.10 * step, 0, 1);
        }

        return this.getInsights();
    }

    public getInsights(): AgentInsightSummary {
        const v = this.tasteVector;
        const topAttrs = [
            { name: 'Surface Optics', value: v.specularFacets > 0.5 ? 'Gleaming Specular Facets' : 'Liquid Gloss', score: Math.round(v.metalness * 100) },
            { name: 'Atmosphere', value: v.lightWarmth > 0.55 ? 'Volcanic Amber Chiaroscuro' : 'Bioluminescent Abyss', score: Math.round(v.contrastChiaroscuro * 100) },
            { name: 'Pipe Dynamics', value: v.streamVelocity > 0.5 ? 'Dynamic Spiral Stream Flow' : 'Tranquil Laminar Drift', score: Math.round(v.streamVelocity * 100) },
            { name: 'Manifold Architecture', value: v.topologySymmetry > 0.5 ? 'Multi-Strand Braided Knots' : 'Fractal Supercoils', score: Math.round(v.topologySymmetry * 100) }
        ];

        const count = this.history.length;
        const strength = Math.min(100, Math.round(count * 20 + 35));

        return {
            profileStrength: strength,
            dominantAesthetic: 'Dramatic Chiaroscuro Obsidian & Specular Facets',
            topAttributes: topAttrs,
            agentMessage: count === 0
                ? 'I am analyzing your preferences to deliver personalized visual configurations.'
                : `Taste model tuned with ${count} interactions (${strength}% confidence). Currently serving tailored high-contrast specular braided topologies.`
        };
    }
}

function THREE_Math_clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

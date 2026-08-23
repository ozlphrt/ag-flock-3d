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

export type ValidationStatus = 'exploring' | 'reinforcing' | 'confirmed';

export interface AngleVerification {
    angleId: number;
    angleName: string;
    description: string;
    wasConsistent: boolean;
}

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
    styleFamily: string; // e.g. "specular_metallic" vs "matte_velvet"
    state: Partial<SimulationState>;
}

export interface LearnPair {
    round: number;
    dimension: DimensionKey;
    dimensionLabel: string;
    isReinforcementRound: boolean;
    angleName: string;   // e.g. "Angle 2: Inverted Spatial Bias Check"
    stageLabel: string;  // e.g. "Trial 2 of 4: Cross-Topology Verification"
    question: string;
    consistencyHint?: string;
    candidateA: LearnCandidate;
    candidateB: LearnCandidate;
}

export interface TasteProfile {
    totalRounds: number;
    overallConsistency: number; // Overall % agreement across all multi-angle tests
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

export class PreferenceLearningEngine {
    private rounds: number = 0;
    private profile: TasteProfile;

    constructor() {
        this.profile = {
            totalRounds: 0,
            overallConsistency: 100,
            dimensions: {
                lighting: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Volcanic Magma', bestStyleFamily: 'volcanic_key', bestData: { ...LIGHTING_PROFILES[4] }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                material: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Sparkling Specular Facets', bestStyleFamily: 'specular_metallic', bestData: { roughness: 0.26, metalness: 0.40, wireframe: false, flatShading: true, emissiveIntensity: 0.1 }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                topology: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Trefoil Braided Ribbon', bestStyleFamily: 'braided_knot', bestData: { mode: FormationMode.TrefoilBraidedRibbon }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                helixDynamics: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Tight Chiral DNA Helices', bestStyleFamily: 'fast_dna_stream', bestData: { speedMult: 0.18, turbulence: 0.02 }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                palette: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Obsidian Gold Corona', bestStyleFamily: 'dark_gold_monochrome', bestData: [...COLOR_PALETTES[17]], consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false },
                bloom: { score: 0.5, trials: 0, variance: 1.0, bestOptionLabel: 'Radiant Specular Halo', bestStyleFamily: 'radiant_halo', bestData: { ...BLOOM_PRESETS[1].settings }, consecutiveAgreements: 0, totalAgreements: 0, anglesTested: [], isConfirmed: false }
            },
            insights: [],
            summaryText: 'Collecting initial aesthetic observations...'
        };
        this.updateInsights();
    }

    // Generate multi-angle, cross-context reinforcement questions
    public generateNextPair(baseState: SimulationState): LearnPair {
        this.rounds++;

        const dimKeys: DimensionKey[] = ['material', 'lighting', 'helixDynamics', 'topology', 'palette', 'bloom'];
        dimKeys.sort((a, b) => (this.profile.dimensions[a].trials - this.profile.dimensions[b].trials));
        const targetDim = dimKeys[0];
        const record = this.profile.dimensions[targetDim];
        const trialCount = record.trials;

        let label = '';
        let question = '';
        let stageLabel = '';
        let angleName = '';
        let consistencyHint = '';
        let optA: Partial<SimulationState> = {};
        let optB: Partial<SimulationState> = {};
        let titleA = '', titleB = '';
        let descA = '', descB = '';
        let familyA = '', familyB = '';

        if (targetDim === 'material') {
            label = 'Material Optics (PBR)';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Polar Contrast Angle';
                angleName = 'Direct Material Finish Contrast';
                question = 'Which surface reflectivity and facet finish do you prefer?';
                titleA = 'Sparkling Specular Facets';
                descA = 'Glossy metallic finish (Metalness 0.55, Roughness 0.22) with gleaming highlights';
                familyA = 'specular_metallic';
                optA = { materialSettings: { roughness: 0.22, metalness: 0.55, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };

                titleB = 'Deep Matte Velvet';
                descB = 'Dielectric satin finish (Metalness 0.05, Roughness 0.70) with soft diffuse shading';
                familyB = 'matte_satin';
                optB = { materialSettings: { roughness: 0.70, metalness: 0.05, wireframe: false, flatShading: true, emissiveIntensity: 0.08 } };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Spatial Bias Angle';
                angleName = 'Position-Inverted Consistency Test';
                question = 'Consistency Test: Does your preferred surface style remain superior when positions are flipped?';
                consistencyHint = 'Testing if choice remains stable regardless of Left/Right position';
                // Flip positions to eliminate spatial click bias
                titleA = 'Deep Matte Velvet (Soft Satin)';
                descA = 'Low-specular diffuse finish without sharp metallic glints';
                familyA = 'matte_satin';
                optA = { materialSettings: { roughness: 0.68, metalness: 0.08, wireframe: false, flatShading: true, emissiveIntensity: 0.08 } };

                titleB = 'High-Luster Specular Metallic';
                descB = 'Glossy faceted chrome finish with sparkling light catchers';
                familyB = 'specular_metallic';
                optB = { materialSettings: { roughness: 0.20, metalness: 0.60, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };
            } else if (trialCount === 2) {
                stageLabel = 'Trial 3: Cross-Lighting Stress Angle';
                angleName = 'Cross-Lighting Robustness Test';
                question = 'Cross-Lighting Verification: Testing if your material preference holds under dramatic chiaroscuro key lighting.';
                titleA = 'Specular Metallic Facets under Volcanic Key';
                descA = 'High metalness with blazing orange-gold rim reflections';
                familyA = 'specular_metallic';
                optA = {
                    materialSettings: { roughness: 0.22, metalness: 0.58, wireframe: false, flatShading: true, emissiveIntensity: 0.12 },
                    lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 }
                };

                titleB = 'Matte Velvet Shading under Volcanic Key';
                descB = 'High roughness satin with gentle warm body absorption';
                familyB = 'matte_satin';
                optB = {
                    materialSettings: { roughness: 0.75, metalness: 0.05, wireframe: false, flatShading: true, emissiveIntensity: 0.08 },
                    lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 }
                };
            } else {
                stageLabel = 'Trial 4: Fine-Tuning Sweet-Spot Angle';
                angleName = 'Nuanced Specular Inflection Test';
                question = 'Validation Checkpoint: Pinpointing your ideal balance between sharp chrome speckles and silky glass.';
                titleA = 'Sharp Specular Metal Facets (Metalness 0.65)';
                descA = 'Ultra-crisp polygonal facet edges with intense glints';
                familyA = 'specular_metallic';
                optA = { materialSettings: { roughness: 0.20, metalness: 0.65, wireframe: false, flatShading: true, emissiveIntensity: 0.12 } };

                titleB = 'Fluid Iridescent Mirror (Metalness 0.35)';
                descB = 'Smoother glass-like sheen with softer highlight dispersal';
                familyB = 'iridescent_glass';
                optB = { materialSettings: { roughness: 0.12, metalness: 0.35, wireframe: false, flatShading: false, emissiveIntensity: 0.08 } };
            }
        } else if (targetDim === 'lighting') {
            label = 'Studio Lighting & Mood';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Warm vs Cool Temperature Angle';
                angleName = 'Color Temperature Contrast';
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
                stageLabel = 'Trial 2: Inverted Spatial Bias Angle';
                angleName = 'Position-Inverted Lighting Test';
                question = 'Consistency Test: Does your preferred lighting mood hold when presented in reversed order?';
                titleA = 'Bioluminescent Cyan Glow';
                descA = 'Cool electric indigo atmosphere with fluorescent edges';
                familyA = 'bioluminescent_cool';
                optA = { lightingProfile: { id: 2, label: 'Bioluminescent Abyss', ambientIntensity: 0.22, keyIntensity: 3.6, keyColor: '#00e5ff', fillIntensity: 0.60, fillColor: '#7b2cbf', rimIntensity: 3.2, rimColor: '#00ffff', fogDensity: 0.035 } };

                titleB = 'Volcanic Amber Magma';
                descB = 'High-contrast fiery chiaroscuro with dramatic shadows';
                familyB = 'volcanic_key';
                optB = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.28, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.75, fillColor: '#802535', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.045 } };
            } else if (trialCount === 2) {
                stageLabel = 'Trial 3: High-Key Solar Challenger Angle';
                angleName = 'High-Key vs Low-Key Contrast Test';
                question = 'Cross-Mood Verification: Testing dramatic chiaroscuro contrast against brilliant solar daylight.';
                titleA = 'Prismatic Solar Daylight (High Key)';
                descA = 'Bright radiant daylight with soft atmospheric illumination';
                familyA = 'solar_high_key';
                optA = { lightingProfile: { id: 5, label: 'Prismatic Solar', ambientIntensity: 0.40, keyIntensity: 4.5, keyColor: '#fff0a0', fillIntensity: 0.85, fillColor: '#ff8040', rimIntensity: 3.0, rimColor: '#ffffff', fogDensity: 0.025 } };

                titleB = 'Volcanic Chiaroscuro (Dramatic Low Key)';
                descB = 'Moody dark shadows with searing edge highlights';
                familyB = 'volcanic_key';
                optB = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.24, keyIntensity: 4.3, keyColor: '#ff6820', fillIntensity: 0.70, fillColor: '#802535', rimIntensity: 3.0, rimColor: '#ffa040', fogDensity: 0.048 } };
            } else {
                stageLabel = 'Trial 4: Atmospheric Fog Intensity Angle';
                angleName = 'Volumetric Fog Validation';
                question = 'Validation Checkpoint: Confirming atmospheric fog density and rim backlight intensity.';
                titleA = 'Dense Chiaroscuro Atmospheric Fog (Density 0.055)';
                descA = 'Deep moody mist enhancing volumetric depth';
                familyA = 'volcanic_key';
                optA = { lightingProfile: { id: 4, label: 'Volcanic Magma', ambientIntensity: 0.26, keyIntensity: 4.2, keyColor: '#ff6820', fillIntensity: 0.74, fillColor: '#802535', rimIntensity: 2.6, rimColor: '#ffa040', fogDensity: 0.055 } };

                titleB = 'Crisp Architectural Lighting (Low Fog 0.015)';
                descB = 'Razor-sharp contrast and starfield clarity';
                familyB = 'crisp_low_fog';
                optB = { lightingProfile: { id: 1, label: 'Studio Neutral', ambientIntensity: 0.35, keyIntensity: 3.8, keyColor: '#ffffff', fillIntensity: 0.65, fillColor: '#d8e8f8', rimIntensity: 2.8, rimColor: '#ffa040', fogDensity: 0.015 } };
            }
        } else if (targetDim === 'helixDynamics') {
            label = 'Pipe Helix & Flow Dynamics';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Velocity & Corkscrew Contrast';
                angleName = 'Speed & Swirl Baseline';
                question = 'Which internal boid flow and child spiral speed feels more organic?';
                titleA = 'Fast Dynamic Stream Flow with Child Helices';
                descA = 'Rapid longitudinal stream flow with corkscrewing child micro-helices';
                familyA = 'fast_dna_stream';
                optA = { speedMultiplier: 0.24, noiseTurbulence: 0.028 };

                titleB = 'Tranquil Chiral Drift';
                descB = 'Gentle laminar glide with subtle undulating breathing waves';
                familyB = 'gentle_laminar';
                optB = { speedMultiplier: 0.12, noiseTurbulence: 0.012 };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Spatial Bias Angle';
                angleName = 'Position-Inverted Flow Test';
                question = 'Consistency Test: Does your preferred flow velocity hold in reverse order?';
                titleA = 'Gentle Laminar Glide';
                descA = 'Relaxed continuous drift along pipe conduits';
                familyA = 'gentle_laminar';
                optA = { speedMultiplier: 0.12, noiseTurbulence: 0.012 };

                titleB = 'Dynamic Micro-Helix Spiral Flow';
                descB = 'Energetic helical braiding cascading through knot conduits';
                familyB = 'fast_dna_stream';
                optB = { speedMultiplier: 0.24, noiseTurbulence: 0.028 };
            } else {
                stageLabel = 'Trial 3: DNA Multi-Strand Angle';
                angleName = 'Child Helix Hierarchy Test';
                question = 'Validation Checkpoint: Testing high-frequency DNA twists vs smooth parallel conduits.';
                titleA = 'Tightly Braided Cascading DNA Helices';
                descA = 'High-frequency 4-tier micro-helices rotating inside species cords';
                familyA = 'fast_dna_stream';
                optA = { speedMultiplier: 0.22, noiseTurbulence: 0.022 };

                titleB = 'Wide Concentric Sheath Waves';
                descB = 'Broad breathing waves along pipe exterior';
                familyB = 'wide_waves';
                optB = { speedMultiplier: 0.16, noiseTurbulence: 0.015 };
            }
        } else if (targetDim === 'topology') {
            label = '3D Manifold Topology';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Knot Architecture Contrast';
                angleName = 'Topological Geometry Baseline';
                question = 'Which core 3D geometry structure is more aesthetically captivating?';
                titleA = 'Trefoil Braided Ribbon (2,3)';
                descA = 'Continuous 4-strand multi-layer knot with intertwined species conduits';
                familyA = 'braided_knot';
                optA = { formationMode: FormationMode.TrefoilBraidedRibbon, bounds: 35 };

                titleB = 'Figure-Eight 4_1 Listing Knot';
                descB = 'Canonical alternating 3D braid with recursive helical twists';
                familyB = 'listing_knot';
                optB = { formationMode: FormationMode.FigureEightKnotBraid, bounds: 35 };
            } else if (trialCount === 1) {
                stageLabel = 'Trial 2: Inverted Spatial Bias Angle';
                angleName = 'Position-Inverted Topology Test';
                question = 'Consistency Test: Does your preferred knot geometry hold in flipped layout?';
                titleA = 'Figure-Eight 4_1 Listing Knot';
                descA = 'Alternating 3D topological loops';
                familyA = 'listing_knot';
                optA = { formationMode: FormationMode.FigureEightKnotBraid, bounds: 35 };

                titleB = 'Trefoil Braided Ribbon (2,3)';
                descB = 'Symmetric 3-lobe continuous braided ribbon';
                familyB = 'braided_knot';
                optB = { formationMode: FormationMode.TrefoilBraidedRibbon, bounds: 35 };
            } else {
                stageLabel = 'Trial 3: High-Order Multi-Loop Angle';
                angleName = 'Fractal & Toroidal Stress Test';
                question = 'Validation Checkpoint: Pitting your top knot against 4-tier Fractal Supercoils.';
                titleA = 'Septafoil Stellar Braid (7,3)';
                descA = '7-point intertwined torus ribbon with recursive symmetry';
                familyA = 'braided_knot';
                optA = { formationMode: FormationMode.SeptafoilKnotBraid, bounds: 35 };

                titleB = 'Fractal Supercoil';
                descB = '4-tier true recursive nested helix-of-helices';
                familyB = 'fractal_supercoil';
                optB = { formationMode: FormationMode.FractalSupercoil, bounds: 35 };
            }
        } else if (targetDim === 'palette') {
            label = 'Species Color Harmony';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Warm Gold vs Cool Neon Angle';
                angleName = 'Palette Harmony Baseline';
                question = 'Which chromatic palette creates better visual hierarchy?';
                titleA = 'Prismatic Obsidian Flare';
                descA = 'Dark charcoal, blazing amber, burnished copper and gleaming titanium white';
                familyA = 'dark_gold_monochrome';
                optA = { speciesColors: ['#14171d', '#ff6b35', '#f7c59f', '#efefd0'] };

                titleB = 'Bioluminescent Aurora';
                descB = 'Deep abyss navy, neon emerald, electric cyan and ultraviolet purple';
                familyB = 'bioluminescent_neon';
                optB = { speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'] };
            } else {
                stageLabel = 'Trial 2: Inverted Spatial Bias Angle';
                angleName = 'Position-Inverted Palette Test';
                question = 'Consistency Test: Does your preferred color harmony hold when order is reversed?';
                titleA = 'Bioluminescent Aurora Neon';
                descA = 'Electric cyan and violet luminescence';
                familyA = 'bioluminescent_neon';
                optA = { speciesColors: ['#03071e', '#00f5d4', '#00bbf9', '#9b5de5'] };

                titleB = 'Gilded Obsidian & Champagne Gold';
                descB = 'Deep obsidian black, champagne gold, platinum silver and titanium white';
                familyB = 'dark_gold_monochrome';
                optB = { speciesColors: ['#0a0d14', '#d4af37', '#e5e4e2', '#ffffff'] };
            }
        } else {
            label = 'Optical Bloom & Glow';
            if (trialCount === 0) {
                stageLabel = 'Trial 1: Bloom Radiance Angle';
                angleName = 'Optical Diffusion Baseline';
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
                stageLabel = 'Trial 2: Inverted Spatial Bias Angle';
                angleName = 'Position-Inverted Bloom Test';
                question = 'Consistency Test: Testing bloom threshold for gleaming facet specular speckles in flipped layout.';
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
            consistencyHint,
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

    // Record vote and evaluate cross-angle consistency agreement
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
            // Check if choice aligns with previously preferred style family across angles
            const isConsistent = chosen.styleFamily === record.bestStyleFamily;
            if (isConsistent) {
                record.totalAgreements += 1;
                record.consecutiveAgreements += 1;
            } else {
                record.consecutiveAgreements = 0;
                // If user changed preference after 2+ opposing trials, update preference
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

    // Synthesize human-readable taste profile insights with multi-angle consistency percentage
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

        insights.push(makeInsight('lighting', 'Studio Lighting', 'High-contrast chiaroscuro key lighting with atmospheric rim contours.'));
        insights.push(makeInsight('material', 'Material Optics', 'Sparkling specular metallic facets with low roughness and gleaming speckles.'));
        insights.push(makeInsight('topology', '3D Topologies', 'Continuous multi-layer braided ribbons and intertwined knots.'));
        insights.push(makeInsight('helixDynamics', 'Pipe Child Helices', 'Dynamic longitudinal stream flow with corkscrewing child micro-helices.'));
        insights.push(makeInsight('palette', 'Color Harmonies', 'High-contrast dark obsidian with gleaming gold and specular white accents.'));
        insights.push(makeInsight('bloom', 'Optical Bloom', 'Radiant specular halos with crisp facet highlights.'));

        this.profile.insights = insights;
        this.profile.overallConsistency = totalTrialSum > 0 ? Math.round((totalAgreementSum / totalTrialSum) * 100) : 100;

        const confirmedCount = insights.filter(i => i.status === 'confirmed').length;

        if (this.profile.totalRounds === 0) {
            this.profile.summaryText = 'Multi-angle aesthetic verification active: test variations across flipped layouts, lighting contexts, and geometries.';
        } else {
            this.profile.summaryText = `Overall Choice Consistency: ${this.profile.overallConsistency}% across ${this.profile.totalRounds} multi-angle rounds (${confirmedCount} dimensions validated). High consistency for ${dims.material.bestOptionLabel} and ${dims.lighting.bestOptionLabel}.`;
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

import {
    SimulationState,
    FormationMode,
    COLOR_PALETTES,
    MATERIAL_PRESETS,
    LIGHTING_PROFILES,
    generateProceduralTopologySurprise,
    generateProceduralPaletteSurprise,
    generateProceduralMaterialSurprise,
    generateProceduralLightingSurprise,
    generateProceduralShapeSurprise
} from './BoidLogic';
import { getRLPreferences, sampleRLAttribute, sampleHarmonicFormation, generateProceduralGenome, getRandomEmotionalArc, EmotionalArc, saveLastState } from './RLEngine';

export interface ClockEngine {
    update: (time: number) => void;
    setManualOverride: (dimension: 'formation' | 'palette' | 'material' | 'shape' | 'lighting' | 'camera') => void;
    getCountdownProgress: () => { formationProgress: number; colorProgress: number; formationRemaining: number; currentArcName?: string };
    skipDimension: (dimension: 'formation' | 'palette' | 'material' | 'shape' | 'lighting' | 'camera') => string;
}

export function createClockEngine(state: SimulationState): ClockEngine {
    // 5 Asynchronous Timers with Initial Random Staggering so they NEVER fire simultaneously
    let lastFormationTime = 0;
    let formationInterval = 32.0; // 32s ± jitter

    let lastColorTime = -20.0; // Staggered color clock
    let colorInterval = 54.0;  // 54s ± jitter

    let lastMaterialTime = -40.0;
    let materialInterval = 72.0;

    let lastLightingTime = -55.0;
    let lightingInterval = 82.0;

    let lastCameraPresetTime = -15.0;
    let cameraPresetInterval = 42.0;

    let lastCameraMoodTime = -10.0;
    let cameraMoodInterval = 28.0;

    let lastMicroCheckTime = 0;
    const microCheckInterval = 20.0;

    let lastSaveStateTime = 0;

    // Manual Override Timestamps: freeze auto-cycle for 45s on user manual click
    const manualOverrides: Record<string, number> = {
        formation: 0,
        palette: 0,
        material: 0,
        shape: 0,
        lighting: 0,
        camera: 0
    };

    // Recent Histories for Forbidden Repeat Buffers
    const recentFormations: number[] = [state.formationMode];
    const recentPalettes: number[] = [state.paletteIndex ?? 0];
    const recentMaterials: number[] = [state.materialPreset ?? 0];
    const recentLighting: number[] = [state.lightingProfileIndex ?? 0];

    // Emotional Arc State
    let activeArc: EmotionalArc | null = null;
    let arcStepIndex = 0;

    const rndJitter = (base: number, percent = 0.2) => {
        return base * (1.0 + (Math.random() * 2 - 1) * percent);
    };

    const setManualOverride = (dimension: 'formation' | 'palette' | 'material' | 'shape' | 'lighting' | 'camera') => {
        manualOverrides[dimension] = performance.now() / 1000.0;
    };

    const update = (time: number) => {
        state.currentTime = time;

        // 0. Periodic State Persistence (every 15s)
        if (time - lastSaveStateTime > 15.0) {
            lastSaveStateTime = time;
            saveLastState({
                formationMode: state.formationMode,
                formationSeed: state.formationSeed,
                paletteIndex: state.paletteIndex ?? 0,
                materialPreset: state.materialPreset ?? 0,
                lightingProfileIndex: state.lightingProfileIndex ?? 0,
                boidShape: state.boidShape ?? 0,
                savedAt: Date.now()
            });
        }

        // If Auto Mode is OFF or user is holding in inspect mode, freeze all autonomous clocks!
        if (state.autoMode === false || state.isInspecting) {
            return;
        }

        const prefs = getRLPreferences();

        // 1. FORMATION CLOCK (Every 28-40s or Harmonic Suite step)
        const isFormationOverridden = (time - manualOverrides.formation) < 45.0;
        if (!isFormationOverridden && !state.isFormationLocked && (time - lastFormationTime) >= formationInterval) {
            lastFormationTime = time;
            formationInterval = rndJitter(activeArc ? 20.0 : 32.0, 0.2);

            let nextMode: FormationMode;

            // 20% Chance to trigger a new Emotional Arc if not currently in one
            if (!activeArc && Math.random() < 0.22) {
                activeArc = getRandomEmotionalArc();
                arcStepIndex = 0;
            }

            if (activeArc) {
                nextMode = activeArc.modes[arcStepIndex];
                arcStepIndex++;
                if (arcStepIndex >= activeArc.modes.length) {
                    activeArc = null; // Arc complete!
                }
            } else {
                // Curated Organic Harmonic Suite Selection with forbidden repeat buffer
                nextMode = sampleHarmonicFormation(
                    state.formationMode,
                    prefs,
                    recentFormations
                ) as FormationMode;
            }

            if (nextMode === state.formationMode) {
                nextMode = ((state.formationMode + 1) % 51) as FormationMode;
            }

            recentFormations.push(nextMode);
            if (recentFormations.length > 5) recentFormations.shift();

            // Smooth C2 Quintic S-Curve Morph Setup
            state.prevFormationMode = state.formationMode;
            state.prevFormationSeed = state.formationSeed;
            state.formationMode = nextMode;
            state.formationSeed = Math.random() * 10000;
            state.transitionStartTime = time;
            state.transitionDuration = 9.0;

            if (nextMode === FormationMode.Procedural || !state.proceduralGenome) {
                state.proceduralGenome = generateProceduralGenome();
            }

            // Auto Shape Mutation (only if autoShape enabled AND shape is NOT locked)
            if (state.autoShape !== false && !state.isShapeLocked) {
                state.boidShape = sampleRLAttribute(
                    6,
                    prefs.shapeLikes,
                    prefs.shapeDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes
                );
            }
        }

        // 2. PALETTE CLOCK (Every 45-65s)
        const isColorOverridden = (time - manualOverrides.palette) < 45.0;
        if (!isColorOverridden && !state.isPaletteLocked && (time - lastColorTime) >= colorInterval) {
            lastColorTime = time;
            colorInterval = rndJitter(54.0, 0.25);

            const nextPaletteIdx = sampleRLAttribute(
                COLOR_PALETTES.length,
                prefs.paletteLikes,
                prefs.paletteDislikes,
                prefs.totalLikes,
                prefs.totalDislikes,
                recentPalettes
            );

            recentPalettes.push(nextPaletteIdx);
            if (recentPalettes.length > 4) recentPalettes.shift();

            state.paletteIndex = nextPaletteIdx;
            state.speciesColors = [...COLOR_PALETTES[nextPaletteIdx]];
        }

        // 3. INDEPENDENT MATERIAL CLOCK (Every 60-90s)
        const isMaterialOverridden = (time - manualOverrides.material) < 45.0;
        if (!isMaterialOverridden && !state.isMaterialLocked && (time - lastMaterialTime) >= materialInterval && state.autoMaterial !== false) {
            lastMaterialTime = time;
            materialInterval = rndJitter(72.0, 0.2);

            const nextMatIdx = sampleRLAttribute(
                MATERIAL_PRESETS.length,
                prefs.materialLikes,
                prefs.materialDislikes,
                prefs.totalLikes,
                prefs.totalDislikes,
                recentMaterials
            );

            recentMaterials.push(nextMatIdx);
            if (recentMaterials.length > 3) recentMaterials.shift();

            state.materialPreset = nextMatIdx;
            state.materialSettings = { ...(MATERIAL_PRESETS[nextMatIdx]?.settings || MATERIAL_PRESETS[0].settings) };
        }

        // 4. INDEPENDENT LIGHTING CLOCK (Every 70-110s)
        const isLightingOverridden = (time - manualOverrides.lighting) < 45.0;
        if (!isLightingOverridden && !state.isLightingLocked && (time - lastLightingTime) >= lightingInterval) {
            lastLightingTime = time;
            lightingInterval = rndJitter(82.0, 0.25);

            const nextLightIdx = sampleRLAttribute(
                LIGHTING_PROFILES.length,
                prefs.lightingLikes,
                prefs.lightingDislikes,
                prefs.totalLikes,
                prefs.totalDislikes,
                recentLighting
            );

            recentLighting.push(nextLightIdx);
            if (recentLighting.length > 3) recentLighting.shift();

            state.lightingProfileIndex = nextLightIdx;
            state.lightingProfile = LIGHTING_PROFILES[nextLightIdx] || LIGHTING_PROFILES[0];
        }

        // 5. INDEPENDENT CAMERA PRESET CLOCK (Every 38-52s in Auto Mode)
        const isCameraOverridden = (time - (manualOverrides.camera || 0)) < 45.0;
        if (!isCameraOverridden && !state.isCameraLocked && (time - lastCameraPresetTime) >= cameraPresetInterval) {
            lastCameraPresetTime = time;
            cameraPresetInterval = rndJitter(42.0, 0.2);

            const curIdx = state.cameraPresetIndex ?? 0;
            const nextCamIdx = (curIdx + 1) % 6;
            state.cameraPresetIndex = nextCamIdx;
        }

        // 6. CAMERA MOOD CLOCK (Every 22-35s)
        if ((time - lastCameraMoodTime) >= cameraMoodInterval) {
            lastCameraMoodTime = time;
            cameraMoodInterval = rndJitter(28.0, 0.2);

            const moods = ['orbit_wide', 'intimate_close', 'cinematic_sweep', 'dramatic_pitch', 'overhead_iso', 'hero_low_lookup'];
            state.cameraMood = moods[Math.floor(Math.random() * moods.length)];
        }

        // 6. MICRO-SURPRISE TRANSIENT EVENTS (~15% chance check)
        if ((time - lastMicroCheckTime) >= microCheckInterval) {
            lastMicroCheckTime = time;
            if (Math.random() < 0.22 && (!state.microSurpriseEndTime || time > state.microSurpriseEndTime)) {
                const surprises = ['speedSurge', 'lightingFlash', 'materialPulse'];
                const picked = surprises[Math.floor(Math.random() * surprises.length)];
                state.microSurpriseType = picked;
                state.microSurpriseEndTime = time + (picked === 'lightingFlash' ? 0.6 : (picked === 'speedSurge' ? 2.5 : 3.5));
            }
        }
    };

    const getCountdownProgress = () => {
        const now = (state.currentTime !== undefined) ? state.currentTime : (performance.now() / 1000.0);
        const formElapsed = Math.max(0, now - lastFormationTime);
        const colElapsed = Math.max(0, now - lastColorTime);
        const formRem = Math.max(0, Math.ceil(formationInterval - formElapsed));

        return {
            formationProgress: Math.min(1.0, formElapsed / Math.max(1, formationInterval)),
            colorProgress: Math.min(1.0, colElapsed / Math.max(1, colorInterval)),
            formationRemaining: formRem,
            currentArcName: activeArc ? activeArc.name : undefined
        };
    };

    const skipDimension = (dim: 'formation' | 'palette' | 'material' | 'shape' | 'lighting' | 'camera'): string => {
        const prefs = getRLPreferences();
        const time = (state.currentTime !== undefined) ? state.currentTime : 0.0;
        const isSurprise = Math.random() > 0.45; // 55% chance of totally novel procedural synthesis

        if (dim === 'formation') {
            if (state.isFormationLocked) return 'Topology is Locked';
            lastFormationTime = time;
            formationInterval = rndJitter(32.0, 0.2);

            state.prevFormationMode = state.formationMode;
            state.prevFormationSeed = state.formationSeed;
            state.transitionStartTime = time;
            state.transitionDuration = 5.0; // Snappy 5s morph right away

            if (isSurprise) {
                const surprise = generateProceduralTopologySurprise();
                state.formationMode = FormationMode.Procedural;
                state.proceduralGenome = surprise.genome;
                state.customFormationName = surprise.name;
                state.formationSeed = Math.random() * 10000;
                return `Topology: ${surprise.name}`;
            } else {
                state.customFormationName = undefined;
                let nextMode = sampleHarmonicFormation(
                    state.formationMode,
                    prefs,
                    recentFormations
                ) as FormationMode;

                if (nextMode === state.formationMode) {
                    nextMode = ((state.formationMode + 1) % 59) as FormationMode;
                }

                recentFormations.push(nextMode);
                if (recentFormations.length > 5) recentFormations.shift();

                state.formationMode = nextMode;
                state.formationSeed = Math.random() * 10000;
                if (nextMode === FormationMode.Procedural || !state.proceduralGenome) {
                    state.proceduralGenome = generateProceduralGenome();
                }
                return `Topology: ${FormationMode[nextMode] || 'Formation #' + nextMode}`;
            }
        } else if (dim === 'palette') {
            if (state.isPaletteLocked) return 'Palette is Locked';
            lastColorTime = time;
            colorInterval = rndJitter(54.0, 0.25);
            state.paletteTransitionDuration = 1.8;

            if (isSurprise) {
                const surprise = generateProceduralPaletteSurprise();
                state.paletteIndex = -1;
                state.speciesColors = surprise.colors;
                state.customPaletteName = surprise.name;
                return `Palette: ${surprise.name}`;
            } else {
                state.customPaletteName = undefined;
                const nextPaletteIdx = sampleRLAttribute(
                    COLOR_PALETTES.length,
                    prefs.paletteLikes,
                    prefs.paletteDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes,
                    recentPalettes
                );

                recentPalettes.push(nextPaletteIdx);
                if (recentPalettes.length > 4) recentPalettes.shift();

                state.paletteIndex = nextPaletteIdx;
                state.speciesColors = [...COLOR_PALETTES[nextPaletteIdx]];
                return `Palette: #${nextPaletteIdx + 1} Harmonic Palette`;
            }
        } else if (dim === 'material') {
            if (state.isMaterialLocked) return 'Material is Locked';
            lastMaterialTime = time;
            materialInterval = rndJitter(72.0, 0.2);

            if (isSurprise) {
                const surprise = generateProceduralMaterialSurprise();
                state.materialPreset = -1;
                state.materialSettings = surprise.settings;
                state.customMaterialName = surprise.name;
                return `Material: ${surprise.name}`;
            } else {
                state.customMaterialName = undefined;
                const nextMatIdx = sampleRLAttribute(
                    MATERIAL_PRESETS.length,
                    prefs.materialLikes,
                    prefs.materialDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes,
                    recentMaterials
                );

                recentMaterials.push(nextMatIdx);
                if (recentMaterials.length > 3) recentMaterials.shift();

                state.materialPreset = nextMatIdx;
                state.materialSettings = { ...(MATERIAL_PRESETS[nextMatIdx]?.settings || MATERIAL_PRESETS[0].settings) };
                return `Material: ${MATERIAL_PRESETS[nextMatIdx]?.label || 'Titanium Mirror'}`;
            }
        } else if (dim === 'lighting') {
            if (state.isLightingLocked) return 'Lighting is Locked';
            lastLightingTime = time;
            lightingInterval = rndJitter(82.0, 0.25);

            if (isSurprise) {
                const surprise = generateProceduralLightingSurprise();
                state.lightingProfileIndex = -1;
                state.lightingProfile = surprise;
                state.customLightingName = surprise.label;
                return `Lighting: ${surprise.label}`;
            } else {
                state.customLightingName = undefined;
                const nextLightIdx = sampleRLAttribute(
                    LIGHTING_PROFILES.length,
                    prefs.lightingLikes,
                    prefs.lightingDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes,
                    recentLighting
                );

                recentLighting.push(nextLightIdx);
                if (recentLighting.length > 3) recentLighting.shift();

                state.lightingProfileIndex = nextLightIdx;
                state.lightingProfile = LIGHTING_PROFILES[nextLightIdx] || LIGHTING_PROFILES[0];
                return `Lighting: ${LIGHTING_PROFILES[nextLightIdx]?.label || 'Studio White'}`;
            }
        } else if (dim === 'shape') {
            if (state.isShapeLocked) return 'Shape is Locked';
            if (isSurprise) {
                const surprise = generateProceduralShapeSurprise();
                state.boidShape = -1;
                state.speciesShapes = surprise.shapes;
                state.customShapeName = surprise.name;
                return `Shape: ${surprise.name}`;
            } else {
                state.customShapeName = undefined;
                state.speciesShapes = undefined;
                const shapeChoices = [0, 1, 2, 3, 4, 5, 99];
                const nextShape = shapeChoices[Math.floor(Math.random() * shapeChoices.length)];
                state.boidShape = nextShape;
                const shapeLabels: Record<number, string> = {
                    0: 'Stealth Arrowhead Jet',
                    1: 'Faceted Gemstone',
                    2: 'Angular Prism Pyramid',
                    3: 'Hex Shield Interceptor',
                    4: 'Swept Delta Wing',
                    5: 'Tetrahedral Shard',
                    99: 'Multi-Species Diverse'
                };
                return `Shape: ${shapeLabels[nextShape] || 'Arrowhead Jet'}`;
            }
        } else if (dim === 'camera') {
            if (state.isCameraLocked) return 'Camera is Locked';
            lastCameraPresetTime = time;
            cameraPresetInterval = rndJitter(42.0, 0.2);
            const cameraNames = ['🪐 Orbit', '🗿 Low Angle', '⚡ Action', '🚀 Fly-Through', '🌀 Corkscrew'];
            const curIdx = state.cameraPresetIndex ?? 0;
            const nextIdx = (curIdx + 1) % 5;
            state.cameraPresetIndex = nextIdx;
            return `Camera: ${cameraNames[nextIdx] || 'Orbit'}`;
        }
        return 'Trait updated';
    };

    return {
        update,
        setManualOverride,
        getCountdownProgress,
        skipDimension
    };
}

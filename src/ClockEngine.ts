import {
    SimulationState,
    FormationMode,
    TOTAL_FORMATION_COUNT,
    FORMATION_PRESETS,
    COLOR_PALETTES,
    MATERIAL_PRESETS,
    LIGHTING_PROFILES,
    generateProceduralTopologySurprise,
    generateProceduralPaletteSurprise,
    generateProceduralMaterialSurprise,
    generateProceduralLightingSurprise,
    generateProceduralShapeSurprise,
    generateSpeciesMaterials,
    generateSpeciesDistribution,
    generateSpeciesSizes,
    generateDynamicSpeciesCount,
    generateHarmoniousPalette,
    getTopologyAlignedPalette,
    generateSpeciesKinematics,
    generateSpeciesRandomness,
    generateSpeciesSizeRanges,
    generateSpeciesMorphTimings
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

    let lastSpeciesDistTime = -30.0;
    let speciesDistInterval = 44.0;

    let lastCameraPresetTime = -8.0;
    let cameraPresetInterval = 16.0;

    let lastCameraMoodTime = -10.0;
    let cameraMoodInterval = 28.0;

    let lastMicroCheckTime = 0;
    const microCheckInterval = 20.0;

    let lastSaveStateTime = 0;

    // Manual Override Timestamps: track manual clicks in simulation time
    const manualOverrides: Record<string, number> = {
        formation: -9999.0,
        palette: -9999.0,
        material: -9999.0,
        shape: -9999.0,
        lighting: -9999.0,
        camera: -9999.0
    };

    // Initialize formation lifecycle parameters if not set
    const isStartChaos = (state.formationMode === FormationMode.None || (state.formationMode as number) < 0);
    let isInitialStartupMorph = isStartChaos;
    if (state.transitionDuration === undefined) state.transitionDuration = isStartChaos ? 0.0 : 24.0;
    if (state.holdDuration === undefined) state.holdDuration = isStartChaos ? 0.8 : 18.0;
    if (state.transitionStartTime === undefined) state.transitionStartTime = 0.0;

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
        const curTime = (state.currentTime !== undefined) ? state.currentTime : 0.0;
        manualOverrides[dimension] = curTime;
        if (dimension === 'formation') {
            lastFormationTime = curTime;
            state.isTopologyFormed = false;
            state.formedTimestamp = null;
            state.physicalConvergence = 0.0;
            state.morphProgress = 0.0;
            state.transitionStartTime = curTime;
            state.transitionDuration = 24.0;
            state.holdDuration = 18.0;
            const spCount = state.speciesCount || state.speciesColors?.length || 4;
            const morphTimings = generateSpeciesMorphTimings(spCount, 24.0);
            state.speciesStartOffsets = morphTimings.startOffsets;
            state.speciesMorphDurations = morphTimings.durations;
        } else if (dimension === 'palette') {
            lastColorTime = curTime;
            colorInterval = rndJitter(54.0, 0.25);
        } else if (dimension === 'material') {
            lastMaterialTime = curTime;
            materialInterval = rndJitter(72.0, 0.2);
        } else if (dimension === 'lighting') {
            lastLightingTime = curTime;
            lightingInterval = rndJitter(82.0, 0.25);
        } else if (dimension === 'camera') {
            lastCameraPresetTime = curTime;
            cameraPresetInterval = rndJitter(26.0, 0.2);
        }
    };

    // Non-Repeating Full-Deck Topology Playlist (Pure Bag Randomization across all 36 topologies)
    let randomizedTopologyPlaylist: number[] = [];

    const getNextRandomizedTopology = (prefs: any, currentMode: number): number => {
        if (randomizedTopologyPlaylist.length === 0) {
            const pool: number[] = [];
            const likes = prefs.formationLikes || {};
            const dislikes = prefs.formationDislikes || {};

            // Place every unique topology (0 to TOTAL_FORMATION_COUNT - 1) exactly ONCE into the deck
            for (let i = 0; i < TOTAL_FORMATION_COUNT; i++) {
                const likeCount = likes[i] || 0;
                const dislikeCount = dislikes[i] || 0;
                if (dislikeCount > likeCount && dislikeCount >= 2) continue; // Skip disliked formations

                pool.push(i);
            }

            // Fisher-Yates full deck shuffle
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            // Anti-repetition deck boundary resolution:
            // Ensure the start of the new deck doesn't contain the most recently played topologies
            for (let i = 0; i < Math.min(8, pool.length); i++) {
                if (recentFormations.includes(pool[i])) {
                    for (let j = pool.length - 1; j >= 8; j--) {
                        if (!recentFormations.includes(pool[j])) {
                            [pool[i], pool[j]] = [pool[j], pool[i]];
                            break;
                        }
                    }
                }
            }

            randomizedTopologyPlaylist = pool;
        }

        let next = randomizedTopologyPlaylist.shift() ?? Math.floor(Math.random() * TOTAL_FORMATION_COUNT);
        if (next === currentMode && randomizedTopologyPlaylist.length > 0) {
            const alt = randomizedTopologyPlaylist.shift()!;
            randomizedTopologyPlaylist.push(next);
            next = alt;
        }
        return next;
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
            const formTotal = (state.transitionDuration ?? 7.0) + (state.holdDuration ?? 7.0);
            lastFormationTime = time - (formTotal * (1.0 - (getCountdownProgress().formationProgress || 0)));
            return;
        }

        const prefs = getRLPreferences();

        // 1. TRUE TOPOLOGY PHYSICAL COMPLETION LIFECYCLE:
        // Wait until the swarm physically converges into the target geometry
        const conv = state.physicalConvergence ?? 0;
        const isConverged = conv >= 0.82;

        if (isConverged && !state.isTopologyFormed) {
            state.isTopologyFormed = true;
            state.formedTimestamp = time;
        }

        const transDur = state.transitionDuration ?? 5.5;
        const holdDur = state.holdDuration ?? 2.5;
        const totalCycle = transDur + holdDur;
        const transStart = state.transitionStartTime ?? lastFormationTime;
        const isCycleComplete = (time - transStart) >= totalCycle;

        if (!state.isFormationLocked && isCycleComplete) {
            lastFormationTime = time;
            state.isTopologyFormed = false;
            state.formedTimestamp = null;
            state.physicalConvergence = 0.0;
            state.morphProgress = 0.0;
            state.transitionStartTime = time;
            
            // Initial startup morph forms quickly within 3.8s so first topology is ready <=5s
            const isFirstEmergence = isInitialStartupMorph;
            const transDuration = isFirstEmergence ? 3.8 : 24.0;
            state.transitionDuration = transDuration;
            state.holdDuration = 18.0;
            isInitialStartupMorph = false;

            const spCount = state.speciesCount || state.speciesColors?.length || 4;
            let nextMode: FormationMode = FormationMode.Procedural;

            // Check if Pure Procedural Mode is active
            if (state.isPureProceduralMode) {
                const surprise = generateProceduralTopologySurprise();
                state.prevFormationMode = state.formationMode;
                state.prevFormationSeed = state.formationSeed;
                state.formationMode = FormationMode.Procedural;
                state.proceduralGenome = surprise.genome;
                state.customFormationName = surprise.name;
                state.formationSeed = Math.random() * 10000;
                state.transitionStartTime = time;
                state.transitionDuration = transDuration;

                if (!state.isPaletteLocked) {
                    state.speciesColors = getTopologyAlignedPalette(FormationMode.Procedural, spCount);
                }
            } else {
                // Pure non-repeating full-deck topology selection
                nextMode = getNextRandomizedTopology(prefs, state.formationMode) as FormationMode;

                if (nextMode === state.formationMode) {
                    nextMode = ((state.formationMode + 1 + Math.floor(Math.random() * (TOTAL_FORMATION_COUNT - 1))) % TOTAL_FORMATION_COUNT) as FormationMode;
                }

                recentFormations.push(nextMode);
                if (recentFormations.length > 18) recentFormations.shift();

                // Setup new topology morph
                state.prevFormationMode = state.formationMode;
                state.prevFormationSeed = state.formationSeed;
                state.formationMode = nextMode;
                state.formationSeed = Math.random() * 10000;
                state.customFormationName = undefined;
                state.transitionStartTime = time;
                state.transitionDuration = transDuration;

                if (!state.isPaletteLocked) {
                    state.speciesColors = getTopologyAlignedPalette(nextMode, spCount);
                }
            }
            state.speciesRandomness = generateSpeciesRandomness(spCount);
            const sizeRanges = generateSpeciesSizeRanges(spCount);
            state.speciesSizes = sizeRanges.avgSizes;
            state.speciesMinSizes = sizeRanges.minSizes;
            state.speciesMaxSizes = sizeRanges.maxSizes;
            const kin = generateSpeciesKinematics(spCount, sizeRanges.avgSizes);
            state.speciesAgilities = kin.agilities;
            state.speciesSpeeds = kin.speeds;

            const morphTimings = generateSpeciesMorphTimings(spCount, transDuration);
            state.speciesStartOffsets = morphTimings.startOffsets;
            state.speciesMorphDurations = morphTimings.durations;

            if (state.formationMode === FormationMode.Procedural || !state.proceduralGenome) {
                if (!state.proceduralGenome) state.proceduralGenome = generateProceduralGenome();
            }

            // Auto Shape Mutation (only if user explicitly enabled autoShape AND shape is NOT locked)
            if (state.autoShape === true && !state.isShapeLocked) {
                state.boidShape = sampleRLAttribute(
                    4,
                    prefs.shapeLikes,
                    prefs.shapeDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes
                );
            }
        }

        // 2. PALETTE CLOCK (Every 45-65s)
        if (!state.isPaletteLocked && (time - lastColorTime) >= colorInterval) {
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
            // 45% chance to morph species count between 2 and 20 for dynamic variety
            if (Math.random() < 0.45) {
                const spCount = generateDynamicSpeciesCount();
                state.speciesCount = spCount;
                state.speciesColors = generateHarmoniousPalette(spCount);
                state.speciesDistribution = generateSpeciesDistribution(spCount);
                state.speciesSizes = generateSpeciesSizes(spCount);
                const kin = generateSpeciesKinematics(spCount, state.speciesSizes);
                state.speciesAgilities = kin.agilities;
                state.speciesSpeeds = kin.speeds;
                state.speciesMaterials = generateSpeciesMaterials(spCount);
            } else {
                const spCount = state.speciesCount || 4;
                if (spCount === 4) {
                    state.speciesColors = [...COLOR_PALETTES[nextPaletteIdx]];
                } else {
                    state.speciesColors = generateHarmoniousPalette(spCount);
                }
            }
        }

        // 3. INDEPENDENT MATERIAL CLOCK (Every 60-90s)
        if (!state.isMaterialLocked && (time - lastMaterialTime) >= materialInterval && state.autoMaterial !== false) {
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
            state.speciesMaterials = generateSpeciesMaterials(nextMatIdx);
        }

        // 4. INDEPENDENT LIGHTING CLOCK (Every 70-110s)
        if (!state.isLightingLocked && (time - lastLightingTime) >= lightingInterval) {
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

        // 5. INDEPENDENT SPECIES POPULATION DISTRIBUTION CLOCK (Every 38-52s)
        if (!state.isSpeciesLocked && (time - lastSpeciesDistTime) >= speciesDistInterval) {
            lastSpeciesDistTime = time;
            speciesDistInterval = rndJitter(44.0, 0.2);
            state.speciesDistribution = generateSpeciesDistribution();
            state.speciesSizes = generateSpeciesSizes();
        }

        // 5. INDEPENDENT CAMERA PRESET CLOCK (Cycles Every 54s in Auto Mode)
        if (!state.isCameraLocked && (time - lastCameraPresetTime) >= cameraPresetInterval) {
            lastCameraPresetTime = time;
            cameraPresetInterval = rndJitter(54.0, 0.15);

            const curIdx = (state.cameraPresetIndex !== undefined) ? state.cameraPresetIndex : 0;
            const nextCamIdx = (curIdx + 1) % 7;
            state.cameraPresetIndex = nextCamIdx;
        }

        // 6. CAMERA MOOD CLOCK (Every 45-65s)
        if ((time - lastCameraMoodTime) >= cameraMoodInterval) {
            lastCameraMoodTime = time;
            cameraMoodInterval = rndJitter(55.0, 0.2);

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
        const colElapsed = Math.max(0, now - lastColorTime);
        const start = state.transitionStartTime ?? 0.0;
        const totalElapsed = Math.max(0, now - start);
        const transDur = state.transitionDuration ?? 5.5;
        const holdDur = state.holdDuration ?? 2.5;
        const totalCycle = transDur + holdDur;

        const morphProg = Math.min(1.0, totalElapsed / Math.max(0.1, transDur));
        const isMorphing = morphProg < 1.0;
        const overallProg = Math.min(1.0, totalElapsed / Math.max(0.1, totalCycle));
        const formRem = Math.max(0, Math.ceil(totalCycle - totalElapsed));

        const formInfo = FORMATION_PRESETS.find((f: any) => f.id === state.formationMode);

        return {
            formationProgress: overallProg,
            morphProgress: morphProg,
            isMorphing,
            timeElapsed: totalElapsed,
            timeRemaining: formRem,
            formationName: state.customFormationName || formInfo?.label || 'Saturnian Planetary Rings',
            formationIcon: formInfo?.icon || '🪐',
            colorProgress: Math.min(1.0, colElapsed / Math.max(1, colorInterval)),
            formationRemaining: formRem,
            currentArcName: (activeArc as any)?.name
        };
    };

    const skipDimension = (dim: 'formation' | 'palette' | 'material' | 'shape' | 'lighting' | 'camera'): string => {
        const prefs = getRLPreferences();
        const time = (state.currentTime !== undefined) ? state.currentTime : 0.0;
        const isSurprise = Math.random() > 0.45; // 55% chance of totally novel procedural synthesis

        if (dim === 'formation') {
            if (state.isFormationLocked) return 'Topology is Locked';
            lastFormationTime = time;
            state.isTopologyFormed = false;
            state.formedTimestamp = null;
            state.physicalConvergence = 0.0;
            state.morphProgress = 0.0;

            state.prevFormationMode = state.formationMode;
            state.prevFormationSeed = state.formationSeed;
            state.transitionStartTime = time;
            state.transitionDuration = 24.0; // Smooth 24s morph
            state.holdDuration = 18.0; // 18s appreciation window

            if (isSurprise || state.isPureProceduralMode) {
                const surprise = generateProceduralTopologySurprise();
                state.formationMode = FormationMode.Procedural;
                state.proceduralGenome = surprise.genome;
                state.customFormationName = surprise.name;
                state.formationSeed = Math.random() * 10000;
                const spCount = state.speciesCount || state.speciesColors?.length || 4;
                if (!state.isPaletteLocked) {
                    state.speciesColors = getTopologyAlignedPalette(FormationMode.Procedural, spCount);
                }
                const morphTimings = generateSpeciesMorphTimings(spCount, 24.0);
                state.speciesStartOffsets = morphTimings.startOffsets;
                state.speciesMorphDurations = morphTimings.durations;
                return `Procedural: ${surprise.name}`;
            } else {
                state.customFormationName = undefined;
                let nextMode = getNextRandomizedTopology(prefs, state.formationMode) as FormationMode;

                if (nextMode === state.formationMode) {
                    nextMode = ((state.formationMode + 1 + Math.floor(Math.random() * (TOTAL_FORMATION_COUNT - 1))) % TOTAL_FORMATION_COUNT) as FormationMode;
                }

                recentFormations.push(nextMode);
                if (recentFormations.length > 18) recentFormations.shift();

                state.formationMode = nextMode;
                state.formationSeed = Math.random() * 10000;
                const spCount = state.speciesCount || state.speciesColors?.length || 4;
                if (!state.isPaletteLocked) {
                    state.speciesColors = getTopologyAlignedPalette(nextMode, spCount);
                }
                state.speciesRandomness = generateSpeciesRandomness(spCount);
                const sizeRanges = generateSpeciesSizeRanges(spCount);
                state.speciesSizes = sizeRanges.avgSizes;
                state.speciesMinSizes = sizeRanges.minSizes;
                state.speciesMaxSizes = sizeRanges.maxSizes;
                const kin = generateSpeciesKinematics(spCount, sizeRanges.avgSizes);
                state.speciesAgilities = kin.agilities;
                state.speciesSpeeds = kin.speeds;

                const morphTimings = generateSpeciesMorphTimings(spCount, 24.0);
                state.speciesStartOffsets = morphTimings.startOffsets;
                state.speciesMorphDurations = morphTimings.durations;

                if (nextMode === FormationMode.Procedural || !state.proceduralGenome) {
                    state.proceduralGenome = generateProceduralGenome();
                }
                const presetObj = FORMATION_PRESETS.find(f => f.id === nextMode);
                return `Topology: ${presetObj?.label || 'Topology #' + nextMode}`;
            }
        } else if (dim === 'palette') {
            if (state.isPaletteLocked) return 'Palette is Locked';
            lastColorTime = time;
            colorInterval = rndJitter(54.0, 0.25);
            state.paletteTransitionDuration = 1.8;

            if (isSurprise) {
                const spCount = generateDynamicSpeciesCount();
                state.speciesCount = spCount;
                state.paletteIndex = -1;
                state.speciesColors = generateHarmoniousPalette(spCount);
                state.speciesDistribution = generateSpeciesDistribution(spCount);
                state.speciesSizes = generateSpeciesSizes(spCount);
                const kin = generateSpeciesKinematics(spCount, state.speciesSizes);
                state.speciesAgilities = kin.agilities;
                state.speciesSpeeds = kin.speeds;
                state.speciesMaterials = generateSpeciesMaterials(spCount);
                const surpriseName = `${spCount}-Species Celestial Harmony`;
                state.customPaletteName = surpriseName;
                return `Palette: ${surpriseName}`;
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
                if (Math.random() < 0.50) {
                    const spCount = generateDynamicSpeciesCount();
                    state.speciesCount = spCount;
                    state.speciesColors = generateHarmoniousPalette(spCount);
                    state.speciesDistribution = generateSpeciesDistribution(spCount);
                    state.speciesSizes = generateSpeciesSizes(spCount);
                    const kin = generateSpeciesKinematics(spCount, state.speciesSizes);
                    state.speciesAgilities = kin.agilities;
                    state.speciesSpeeds = kin.speeds;
                    state.speciesMaterials = generateSpeciesMaterials(spCount);
                    return `Palette: ${spCount}-Species Harmonic Prism`;
                } else {
                    const spCount = state.speciesCount || 4;
                    if (spCount === 4) {
                        state.speciesColors = [...COLOR_PALETTES[nextPaletteIdx]];
                    } else {
                        state.speciesColors = generateHarmoniousPalette(spCount);
                    }
                    return `Palette: #${nextPaletteIdx + 1} Harmonic Palette`;
                }
            }
        } else if (dim === 'material') {
            if (state.isMaterialLocked) return 'Material is Locked';
            lastMaterialTime = time;
            materialInterval = rndJitter(72.0, 0.2);

            if (isSurprise) {
                const surprise = generateProceduralMaterialSurprise();
                state.materialPreset = -1;
                state.materialSettings = surprise.settings;
                state.speciesMaterials = generateSpeciesMaterials();
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
                state.speciesMaterials = generateSpeciesMaterials(nextMatIdx);
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
                // Geodesic Ico-Sphere (0) heavily weighted
                const shapeChoices = [0, 0, 0, 0, 1, 2, 3, 99];
                const nextShape = shapeChoices[Math.floor(Math.random() * shapeChoices.length)];
                state.boidShape = nextShape;
                const shapeLabels: Record<number, string> = {
                    0: 'Geodesic Ico-Sphere',
                    1: 'Faceted Gemstone',
                    2: 'Stealth Arrowhead Jet',
                    3: 'Swept Delta Wing',
                    99: 'Multi-Species Diverse'
                };
                return `Shape: ${shapeLabels[nextShape] || 'Geodesic Ico-Sphere'}`;
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

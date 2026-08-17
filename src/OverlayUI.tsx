import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { SimulationState, SPECIES_COLORS, SpeciesAttributes, DefeatScenario, FormationMode, FORMATION_PRESETS, COLOR_PALETTES, MATERIAL_PRESETS, LIGHTING_PROFILES } from './BoidLogic';
import { LikedCreation, getLikedCreations, saveLikedCreation, likeDimension, dislikeDimension, generateProceduralGenome, getRLPreferences, getCentralRLStore, exportCentralRLJSON, importCentralRLJSON, resetCentralRLStore, likeCompositionCombination, dislikeCompositionCombination } from './RLEngine';
import { CAMERA_PRESETS } from './CameraRig';
import { BLOOM_PRESETS, BloomPreset } from './BloomControlPanel';

interface OverlayUIProps {
    simState: React.MutableRefObject<SimulationState>;
    population: number;
    setPopulation: (n: number | ((prev: number) => number)) => void;
    fps: number;
    isLoading?: boolean;
}

export const OverlayUI: React.FC<OverlayUIProps> = ({ simState, population, setPopulation, fps, isLoading }) => {
    const [, setTick] = useState(0);
    const rlPrefs = getRLPreferences();
    useEffect(() => {
        // 10Hz UI refresh — reads simState.current for live values without
        // forcing React to reconcile the full component tree every animation frame.
        const uiInterval = setInterval(() => {
            setTick(t => (t + 1) % 100000);
        }, 100);
        const handleRLUpdate = () => setTick(t => t + 1);
        window.addEventListener('flock_rl_store_updated', handleRLUpdate);
        return () => {
            clearInterval(uiInterval);
            window.removeEventListener('flock_rl_store_updated', handleRLUpdate);
        };
    }, []);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [activeCatalogTab, setActiveCatalogTab] = useState<'topology' | 'palette' | 'geometry' | 'material' | 'lighting' | 'camera' | 'bloom' | 'physics' | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(30);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const state = simState.current;
            if (!state) return;

            if (state.clockEngine && state.clockEngine.getCountdownProgress) {
                const info = state.clockEngine.getCountdownProgress();
                setProgress(info.formationProgress);
                setCountdown(info.formationRemaining ?? 30);
            } else {
                const now = (state.currentTime !== undefined) ? state.currentTime : (performance.now() / 1000.0);
                const start = state.transitionStartTime ?? 0.0;
                const elapsed = Math.max(0, now - start);
                const totalCycle = 32.0;
                const p = Math.min(1.0, elapsed / totalCycle);
                setProgress(p);
                const rem = Math.max(0, Math.ceil(totalCycle - elapsed));
                setCountdown(rem);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [simState]);

    // Ephemeral Like Bar Visibility state (disappears after 3 seconds of inactivity)
    const [isLikeBarVisible, setIsLikeBarVisible] = useState(true);
    const lastUserActivity = useRef(Date.now());

    useEffect(() => {
        const onActivity = () => {
            lastUserActivity.current = Date.now();
            setIsLikeBarVisible(true);
        };
        window.addEventListener('pointermove', onActivity);
        window.addEventListener('touchstart', onActivity);

        const checkFade = setInterval(() => {
            if (Date.now() - lastUserActivity.current > 3000 && !isSettingsOpen && !isGalleryOpen) {
                setIsLikeBarVisible(false);
            }
        }, 200);

        return () => {
            window.removeEventListener('pointermove', onActivity);
            window.removeEventListener('touchstart', onActivity);
            clearInterval(checkFade);
        };
    }, [isSettingsOpen, isGalleryOpen]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const currentFormation = simState.current.formationMode;
    const isAutoMode = simState.current.autoMode !== false;

    const formations = FORMATION_PRESETS;

    const shapes = [
        { id: -1, label: 'Auto (Mutate Cycle)', icon: '🤖', desc: 'Randomize shape every formation cycle' },
        // Curated 3D Volumetric Archetypes — Geodesic Ico-Sphere is the Flagship
        { id: 0, label: 'Geodesic Ico-Sphere', icon: '🌐', desc: '20-facet diamond geodesic sphere with rotating multi-angle mirror glints (20 tris) — Flagship' },
        { id: 1, label: 'Faceted Gemstone', icon: '💎', desc: '8-faced dual-pointed crystal octahedron (8 tris)' },
        { id: 2, label: 'Stealth Arrowhead Jet', icon: '🚀', desc: 'Aerodynamic 3-sided low-poly wedge (6 tris)' },
        { id: 3, label: 'Swept Delta Wing', icon: '🪽', desc: '4-sided swept-back wing blade (6 tris)' },
        { id: 99, label: 'Multi-Species Diverse', icon: '🧬', desc: 'Distinct geometric archetypes per species with Geodesic Ico-Sphere dominant' }
    ];

    const materialOptions = [
        { id: -1, label: 'Auto (Mutate Cycle)', icon: '🤖', desc: 'Randomize material every formation cycle' },
        ...MATERIAL_PRESETS
    ];

    const isAutoShape = simState.current.autoShape !== false;
    const isAutoMaterial = simState.current.autoMaterial !== false;
    const currentShapeId = isAutoShape ? -1 : (simState.current.boidShape !== undefined ? simState.current.boidShape : 0);
    const currentMaterialId = isAutoMaterial ? -1 : (simState.current.materialPreset !== undefined ? Math.abs(simState.current.materialPreset) % MATERIAL_PRESETS.length : 0);
    const currentLightingId = simState.current.lightingProfileIndex ?? 0;

    const selectFormation = (id: number) => {
        simState.current.prevFormationMode = simState.current.formationMode;
        simState.current.prevFormationSeed = simState.current.formationSeed;
        simState.current.formationMode = id;
        simState.current.formationSeed = Math.random() * 10000;
        simState.current.customFormationName = undefined;
        simState.current.transitionStartTime = (simState.current.currentTime !== undefined) ? simState.current.currentTime : 0.0;
        simState.current.transitionDuration = 5.0;

        if (id === FormationMode.Procedural || !simState.current.proceduralGenome) {
            simState.current.proceduralGenome = generateProceduralGenome();
        }

        if (simState.current.clockEngine?.setManualOverride) {
            simState.current.clockEngine.setManualOverride('formation');
        }

        setTick(t => t + 1);
        setActiveCatalogTab(null);
        showToast(`🌀 Topology Applied`);
    };

    const selectShape = (id: number) => {
        if (id === -1) {
            simState.current.autoShape = true;
        } else {
            simState.current.autoShape = false;
            simState.current.boidShape = id;
            simState.current.customShapeName = undefined;
        }
        if (simState.current.clockEngine?.setManualOverride) {
            simState.current.clockEngine.setManualOverride('shape');
        }
        setTick(t => t + 1);
        setActiveCatalogTab(null);
        showToast(`📐 Shape Applied`);
    };

    const selectMaterial = (id: number) => {
        if (id === -1) {
            simState.current.autoMaterial = true;
        } else {
            const mat = MATERIAL_PRESETS[id] || MATERIAL_PRESETS[0];
            simState.current.autoMaterial = false;
            simState.current.materialPreset = id;
            simState.current.materialSettings = { ...mat.settings };
            simState.current.customMaterialName = undefined;
        }
        if (simState.current.clockEngine?.setManualOverride) {
            simState.current.clockEngine.setManualOverride('material');
        }
        setTick(t => t + 1);
        setActiveCatalogTab(null);
        showToast(`✨ Material Applied`);
    };

    const selectPalette = (idx: number) => {
        simState.current.paletteIndex = idx;
        simState.current.customPaletteName = undefined;
        simState.current.speciesColors = [...COLOR_PALETTES[idx]];
        simState.current.paletteTransitionDuration = 1.8;
        if (simState.current.clockEngine && simState.current.clockEngine.setManualOverride) {
            simState.current.clockEngine.setManualOverride('palette');
        }
        setTick(t => t + 1);
        setActiveCatalogTab(null);
        showToast(`🎨 Palette #${idx + 1} Applied`);
    };

    const selectLighting = (id: number) => {
        const light = LIGHTING_PROFILES[id] || LIGHTING_PROFILES[0];
        simState.current.lightingProfileIndex = id;
        simState.current.lightingProfile = light;
        simState.current.customLightingName = undefined;
        if (simState.current.clockEngine && simState.current.clockEngine.setManualOverride) {
            simState.current.clockEngine.setManualOverride('lighting');
        }
        setTick(t => t + 1);
        setActiveCatalogTab(null);
        showToast(`💡 Lighting Applied`);
    };

    const handleCycleCameraPreset = () => {
        const curIdx = simState.current.cameraPresetIndex ?? 0;
        const nextIdx = (curIdx + 1) % CAMERA_PRESETS.length;
        simState.current.cameraPresetIndex = nextIdx;
        if (simState.current.clockEngine && simState.current.clockEngine.setManualOverride) {
            simState.current.clockEngine.setManualOverride('camera');
        }
        setTick(t => t + 1);
        showToast(`🎥 Camera: ${CAMERA_PRESETS[nextIdx].name}`);
    };

    const selectCameraPreset = (idx: number) => {
        simState.current.cameraPresetIndex = idx;
        if (simState.current.clockEngine && simState.current.clockEngine.setManualOverride) {
            simState.current.clockEngine.setManualOverride('camera');
        }
        setTick(t => t + 1);
        setActiveCatalogTab(null);
        showToast(`🎥 Camera: ${CAMERA_PRESETS[idx].name}`);
    };

    const handleToggleAuto = () => {
        const nextState = simState.current.autoMode === false ? true : false;
        simState.current.autoMode = nextState;
        setTick(t => t + 1);
        if (nextState) {
            showToast('▶️ Auto Cycle: ON (Active)');
        } else {
            showToast('⏸️ Auto Cycle: OFF (Paused)');
        }
    };

    const handleNextComposition = () => {
        simState.current.autoMode = true;

        if (simState.current.clockEngine?.skipDimension) {
            if (!simState.current.isFormationLocked) {
                simState.current.clockEngine.skipDimension('formation');
            }
            if (!simState.current.isPaletteLocked) {
                simState.current.clockEngine.skipDimension('palette');
            }
            if (!simState.current.isMaterialLocked) {
                simState.current.clockEngine.skipDimension('material');
            }
            if (!simState.current.isLightingLocked) {
                simState.current.clockEngine.skipDimension('lighting');
            }
            if (!simState.current.isShapeLocked) {
                simState.current.clockEngine.skipDimension('shape');
            }
            if (!simState.current.isCameraLocked) {
                simState.current.clockEngine.skipDimension('camera');
            }
        }
        setTick(t => t + 1);
        showToast('Advancing Unlocked Dimensions ⏭️');
    };

    const handleLikeDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera' | 'bloom') => {
        const state = simState.current;
        let id: number | string = 0;
        let label = 'Trait';

        if (dim === 'formation') {
            id = state.formationMode;
            label = formations.find(f => f.id === id)?.label || 'Topology';
        } else if (dim === 'palette') {
            id = state.paletteIndex ?? 0;
            label = `Palette #${Number(id) + 1}`;
        } else if (dim === 'material') {
            id = state.materialPreset ?? 0;
            label = MATERIAL_PRESETS[Number(id)]?.label || 'Material';
        } else if (dim === 'lighting') {
            id = state.lightingProfileIndex ?? 0;
            label = LIGHTING_PROFILES[Number(id)]?.label || 'Lighting';
        } else if (dim === 'shape') {
            id = state.boidShape ?? 0;
            label = shapes.find(s => s.id === id)?.label || 'Shape';
        } else if (dim === 'camera') {
            id = state.cameraPresetIndex ?? 0;
            label = CAMERA_PRESETS[Number(id)]?.name || 'Camera';
        } else if (dim === 'bloom') {
            id = state.bloomPreset ?? 0;
            label = BLOOM_PRESETS[Number(id)]?.label || 'Bloom';
        }

        likeDimension(dim, id);
        showToast(`+1 ${label} added to Taste Profile! 👍`);
        setTick(t => t + 1);
    };

    const handleDislikeDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera' | 'bloom') => {
        const state = simState.current;
        let id: number | string = 0;
        let label = 'Trait';

        if (dim === 'formation') {
            id = state.formationMode;
            label = 'Topology';
        } else if (dim === 'palette') {
            id = state.paletteIndex ?? 0;
            label = 'Color Palette';
        } else if (dim === 'material') {
            id = state.materialPreset ?? 0;
            label = 'Material';
        } else if (dim === 'lighting') {
            id = state.lightingProfileIndex ?? 0;
            label = 'Lighting Setup';
        } else if (dim === 'shape') {
            id = state.boidShape ?? 0;
            label = 'Boid Shape';
        } else if (dim === 'camera') {
            id = state.cameraPresetIndex ?? 0;
            label = 'Camera Preset';
        } else if (dim === 'bloom') {
            id = state.bloomPreset ?? 0;
            label = 'Bloom Preset';
            const nextPreset = (Number(id) + 1 + Math.floor(Math.random() * (BLOOM_PRESETS.length - 1))) % BLOOM_PRESETS.length;
            state.bloomPreset = nextPreset;
            state.bloomSettings = { ...BLOOM_PRESETS[nextPreset].settings };
        }

        dislikeDimension(dim, id);

        // Immediately morph to a fresh AI-selected creation without waiting for timer!
        if (state.clockEngine?.skipDimension && dim !== 'bloom') {
            state.clockEngine.skipDimension(dim);
        }

        showToast(`Disliked ${label} 👎 — Morphing to new variant...`);
        setTick(t => t + 1);
    };

    const handleToggleLockDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera' | 'bloom') => {
        const state = simState.current;
        let isLocked = false;
        let label = 'Trait';

        if (dim === 'formation') {
            state.isFormationLocked = !state.isFormationLocked;
            isLocked = !!state.isFormationLocked;
            label = 'Topology';
        } else if (dim === 'palette') {
            state.isPaletteLocked = !state.isPaletteLocked;
            isLocked = !!state.isPaletteLocked;
            label = 'Color Palette';
        } else if (dim === 'material') {
            state.isMaterialLocked = !state.isMaterialLocked;
            isLocked = !!state.isMaterialLocked;
            label = 'Material Finish';
        } else if (dim === 'lighting') {
            state.isLightingLocked = !state.isLightingLocked;
            isLocked = !!state.isLightingLocked;
            label = 'Lighting Setup';
        } else if (dim === 'shape') {
            state.isShapeLocked = !state.isShapeLocked;
            isLocked = !!state.isShapeLocked;
            label = 'Boid Shape';
        } else if (dim === 'camera') {
            state.isCameraLocked = !state.isCameraLocked;
            isLocked = !!state.isCameraLocked;
            label = 'Camera Angle';
        } else if (dim === 'bloom') {
            state.isBloomLocked = !state.isBloomLocked;
            isLocked = !!state.isBloomLocked;
            label = 'Optical Bloom';
        }

        setTick(t => t + 1);
        showToast(isLocked ? `🔒 ${label} Locked (will remain constant)` : `🔓 ${label} Unlocked (autonomous cycling resumed)`);
    };

    const isAllDimensionsLocked = !!(
        simState.current.isFormationLocked &&
        simState.current.isPaletteLocked &&
        simState.current.isMaterialLocked &&
        simState.current.isLightingLocked &&
        simState.current.isShapeLocked &&
        simState.current.isCameraLocked &&
        simState.current.isBloomLocked
    );

    const handleToggleGlobalLock = () => {
        const nextLock = !isAllDimensionsLocked;
        simState.current.isFormationLocked = nextLock;
        simState.current.isPaletteLocked = nextLock;
        simState.current.isMaterialLocked = nextLock;
        simState.current.isLightingLocked = nextLock;
        simState.current.isShapeLocked = nextLock;
        simState.current.isCameraLocked = nextLock;
        simState.current.isBloomLocked = nextLock;
        setTick(t => t + 1);
        showToast(nextLock ? '🔒 All Dimensions LOCKED (Total Freeze)' : '🔓 All Dimensions UNLOCKED (Full AI Flow)');
    };

    const handleRerollDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera' | 'bloom') => {
        const state = simState.current;
        let result = '';

        if (dim === 'bloom') {
            const nextPreset = Math.floor(Math.random() * BLOOM_PRESETS.length);
            state.bloomPreset = nextPreset;
            state.bloomSettings = { ...BLOOM_PRESETS[nextPreset].settings };
            result = `Bloom: ${BLOOM_PRESETS[nextPreset].label}`;
        } else if (state.clockEngine?.skipDimension) {
            result = state.clockEngine.skipDimension(dim);
        }
        showToast(`🎲 ${result}`);
        setTick(t => t + 1);
    };

    const handleSaveFullCreation = () => {
        const state = simState.current;
        const currentMode = state.formationMode ?? 0;
        const formationObj = formations.find(f => f.id === currentMode) || formations[0];
        const shapeId = state.boidShape ?? 0;
        const shapeObj = shapes.find(s => s.id === shapeId) || shapes[1];
        const matId = state.materialPreset ?? 0;
        const matObj = MATERIAL_PRESETS[matId] || MATERIAL_PRESETS[0];
        const camIdx = state.cameraPresetIndex ?? 0;
        const camObj = CAMERA_PRESETS[camIdx] || CAMERA_PRESETS[0];

        const item: LikedCreation = {
            id: `creation_${Date.now()}`,
            timestamp: Date.now(),
            formationMode: currentMode,
            formationLabel: formationObj.label,
            boidShape: shapeId,
            shapeLabel: shapeObj.label,
            materialPreset: matId,
            materialLabel: matObj.label,
            paletteIndex: state.paletteIndex ?? 0,
            lightingProfileIndex: state.lightingProfileIndex ?? 0,
            cameraPresetIndex: camIdx,
            cameraLabel: camObj.name,
            colors: state.speciesColors ? [...state.speciesColors] : [...SPECIES_COLORS],
            genome: state.proceduralGenome
        };

        saveLikedCreation(item);
        showToast(`Masterpiece Snapshot saved to Gallery & RL AI Trained! ❤️`);
        setTick(t => t + 1);
    };

    const restoreCreation = (creation: LikedCreation) => {
        if (!creation) return;
        const state = simState.current;
        state.prevFormationMode = state.formationMode;
        state.prevFormationSeed = state.formationSeed;
        state.formationMode = (creation.formationMode !== undefined) ? (creation.formationMode as FormationMode) : FormationMode.QuadHelixBraid;
        state.formationSeed = Math.random() * 10000;
        state.boidShape = creation.boidShape ?? 0;
        state.autoShape = false;

        const matIdx = (creation.materialPreset !== undefined && MATERIAL_PRESETS[creation.materialPreset])
            ? creation.materialPreset
            : 0;
        state.materialPreset = matIdx;
        state.autoMaterial = false;
        state.materialSettings = { ...(MATERIAL_PRESETS[matIdx]?.settings || MATERIAL_PRESETS[0].settings) };

        const palIdx = (creation.paletteIndex !== undefined && COLOR_PALETTES[creation.paletteIndex])
            ? creation.paletteIndex
            : 0;
        state.paletteIndex = palIdx;
        state.speciesColors = (creation.colors && creation.colors.length >= 4)
            ? [...creation.colors]
            : [...COLOR_PALETTES[palIdx]];

        const lightIdx = (creation.lightingProfileIndex !== undefined && LIGHTING_PROFILES[creation.lightingProfileIndex])
            ? creation.lightingProfileIndex
            : 0;
        state.lightingProfileIndex = lightIdx;
        state.lightingProfile = LIGHTING_PROFILES[lightIdx] || LIGHTING_PROFILES[0];

        if (creation.cameraPresetIndex !== undefined) {
            state.cameraPresetIndex = creation.cameraPresetIndex;
        }

        if (creation.genome) {
            state.proceduralGenome = creation.genome;
        }
        state.transitionStartTime = state.currentTime || 0;
        state.transitionDuration = 9.0;

        setIsGalleryOpen(false);
        setTick(t => t + 1);
        showToast(`✨ Restored: ${creation.formationLabel || 'Masterpiece'}`);
    };

    const handleLikeOverallCombination = () => {
        const state = simState.current;
        const formationObj = formations.find(f => f.id === (state.formationMode ?? 0));
        const shapeObj = shapes.find(s => s.id === (state.boidShape ?? 0));
        const matObj = MATERIAL_PRESETS[state.materialPreset ?? 0];

        likeCompositionCombination({
            formationMode: state.formationMode ?? 0,
            formationLabel: state.customFormationName || formationObj?.label,
            boidShape: state.boidShape ?? 0,
            shapeLabel: state.customShapeName || (state.boidShape === 99 ? 'Multi-Species Diverse' : shapeObj?.label),
            materialPreset: state.materialPreset ?? 0,
            materialLabel: state.customMaterialName || matObj?.label,
            paletteIndex: state.paletteIndex,
            lightingProfileIndex: state.lightingProfileIndex,
            cameraPresetIndex: state.cameraPresetIndex,
            colors: state.speciesColors || SPECIES_COLORS,
            genome: state.proceduralGenome
        });

        showToast(`✨ Overall Combination Liked! AI rewarded synergy.`);
        setTick(t => t + 1);
    };

    const handleDislikeOverallCombination = () => {
        const state = simState.current;
        const formationObj = formations.find(f => f.id === (state.formationMode ?? 0));
        const shapeObj = shapes.find(s => s.id === (state.boidShape ?? 0));
        const matObj = MATERIAL_PRESETS[state.materialPreset ?? 0];

        dislikeCompositionCombination({
            formationMode: state.formationMode ?? 0,
            formationLabel: state.customFormationName || formationObj?.label,
            boidShape: state.boidShape ?? 0,
            shapeLabel: state.customShapeName || (state.boidShape === 99 ? 'Multi-Species Diverse' : shapeObj?.label),
            materialPreset: state.materialPreset ?? 0,
            materialLabel: state.customMaterialName || matObj?.label,
            paletteIndex: state.paletteIndex,
            lightingProfileIndex: state.lightingProfileIndex,
            cameraPresetIndex: state.cameraPresetIndex
        });

        showToast(`👎 Combination Disliked — Advancing to new aesthetic`);
        handleNextComposition();
    };

    const handleSetSpeciesShape = (speciesIdx: number, shapeId: number) => {
        const s = simState.current.speciesShapes;
        const currentShapes: [number, number, number, number] = s
            ? [s[0], s[1], s[2], s[3]]
            : (simState.current.boidShape === 99 ? [0, 0, 1, 2] : [simState.current.boidShape ?? 0, simState.current.boidShape ?? 0, simState.current.boidShape ?? 0, simState.current.boidShape ?? 0]);
        currentShapes[speciesIdx] = shapeId;
        simState.current.speciesShapes = currentShapes;
        simState.current.boidShape = 99; // Differentiated
        simState.current.customShapeName = undefined;
        simState.current.autoShape = false;
        setTick(t => t + 1);
        showToast(`📐 Species ${speciesIdx + 1} Shape: ${shapes.find(s => s.id === shapeId)?.label || 'Custom'}`);
    };

    const activePreset = formations.find(f => f.id === currentFormation) || formations[0];
    const likedList = getLikedCreations();

    // Sorting helper: Highest net reactions (likes - dislikes) first, then total likes, then non-zero activity
    const getReactionScore = (likes: number, dislikes: number) => {
        return (likes - dislikes) * 1000 + likes * 10 - dislikes;
    };

    const sortedFormations = [...formations].sort((a, b) => {
        const aLikes = rlPrefs.formationLikes[a.id] || 0;
        const aDislikes = rlPrefs.formationDislikes[a.id] || 0;
        const bLikes = rlPrefs.formationLikes[b.id] || 0;
        const bDislikes = rlPrefs.formationDislikes[b.id] || 0;
        const scoreA = getReactionScore(aLikes, aDislikes);
        const scoreB = getReactionScore(bLikes, bDislikes);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.id - b.id;
    });

    const sortedPalettes = COLOR_PALETTES.map((pal, idx) => ({ pal, idx })).sort((a, b) => {
        const aLikes = rlPrefs.paletteLikes[a.idx] || 0;
        const aDislikes = rlPrefs.paletteDislikes[a.idx] || 0;
        const bLikes = rlPrefs.paletteLikes[b.idx] || 0;
        const bDislikes = rlPrefs.paletteDislikes[b.idx] || 0;
        const scoreA = getReactionScore(aLikes, aDislikes);
        const scoreB = getReactionScore(bLikes, bDislikes);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.idx - b.idx;
    });

    const sortedShapes = [...shapes].sort((a, b) => {
        if (a.id === -1) return -1;
        if (b.id === -1) return 1;
        const aLikes = rlPrefs.shapeLikes[a.id] || 0;
        const aDislikes = rlPrefs.shapeDislikes[a.id] || 0;
        const bLikes = rlPrefs.shapeLikes[b.id] || 0;
        const bDislikes = rlPrefs.shapeDislikes[b.id] || 0;
        const scoreA = getReactionScore(aLikes, aDislikes);
        const scoreB = getReactionScore(bLikes, bDislikes);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.id - b.id;
    });

    const sortedMaterials = [...materialOptions].sort((a, b) => {
        if (a.id === -1) return -1;
        if (b.id === -1) return 1;
        const aLikes = rlPrefs.materialLikes[a.id] || 0;
        const aDislikes = rlPrefs.materialDislikes[a.id] || 0;
        const bLikes = rlPrefs.materialLikes[b.id] || 0;
        const bDislikes = rlPrefs.materialDislikes[b.id] || 0;
        const scoreA = getReactionScore(aLikes, aDislikes);
        const scoreB = getReactionScore(bLikes, bDislikes);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.id - b.id;
    });

    const sortedLighting = LIGHTING_PROFILES.map((lp, idx) => ({ lp, idx })).sort((a, b) => {
        const aLikes = rlPrefs.lightingLikes[a.lp.id] || 0;
        const aDislikes = rlPrefs.lightingDislikes[a.lp.id] || 0;
        const bLikes = rlPrefs.lightingLikes[b.lp.id] || 0;
        const bDislikes = rlPrefs.lightingDislikes[b.lp.id] || 0;
        const scoreA = getReactionScore(aLikes, aDislikes);
        const scoreB = getReactionScore(bLikes, bDislikes);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.idx - b.idx;
    });

    const sortedCameras = CAMERA_PRESETS.map((cp, idx) => ({ cp, idx })).sort((a, b) => {
        const aLikes = rlPrefs.cameraLikes[String(a.idx)] || rlPrefs.cameraLikes[a.cp.id] || 0;
        const aDislikes = rlPrefs.cameraDislikes[String(a.idx)] || rlPrefs.cameraDislikes[a.cp.id] || 0;
        const bLikes = rlPrefs.cameraLikes[String(b.idx)] || rlPrefs.cameraLikes[b.cp.id] || 0;
        const bDislikes = rlPrefs.cameraDislikes[String(b.idx)] || rlPrefs.cameraDislikes[b.cp.id] || 0;
        const scoreA = getReactionScore(aLikes, aDislikes);
        const scoreB = getReactionScore(bLikes, bDislikes);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.idx - b.idx;
    });

    return (
        <>
        {/* Floating Toast Message */}
        {toastMessage && <div className="rl-toast">{toastMessage}</div>}

        {/* Initial Swarm Topology Synthesis Modal */}
        <div
            className="topology-loading-modal"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, rgba(16, 24, 40, 0.94) 0%, rgba(6, 10, 18, 0.98) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 2000,
                opacity: isLoading ? 1 : 0,
                pointerEvents: isLoading ? 'auto' : 'none',
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '36px 32px',
                    borderRadius: '24px',
                    background: 'rgba(12, 18, 30, 0.75)',
                    border: '1px solid rgba(0, 255, 204, 0.25)',
                    boxShadow: '0 0 50px rgba(0, 255, 204, 0.15), 0 20px 40px rgba(0,0,0,0.6)',
                    maxWidth: '90vw',
                    width: '360px',
                    textAlign: 'center'
                }}
            >
                {/* Futuristic Dual-Ring Spinner */}
                <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            border: '3px solid rgba(0, 255, 204, 0.15)',
                            borderTop: '3px solid #00ffcc',
                            borderRadius: '50%',
                            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: '8px',
                            border: '2.5px solid rgba(255, 204, 0, 0.15)',
                            borderBottom: '2.5px solid #ffcc00',
                            borderRadius: '50%',
                            animation: 'spin-reverse 1.8s cubic-bezier(0.5, 0, 0.5, 1) infinite'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                        }}
                    >
                        ✨
                    </div>
                </div>

                {/* Title & Status */}
                <div>
                    <div
                        style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: '#e0e8ff',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                    >
                        Synthesizing Swarm
                    </div>
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#00ffcc',
                            marginTop: '6px',
                            letterSpacing: '0.5px'
                        }}
                    >
                        Populating Initial 3D Topology...
                    </div>
                </div>

                {/* Progress Bar Animation */}
                <div
                    style={{
                        width: '100%',
                        height: '4px',
                        borderRadius: '2px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            height: '100%',
                            width: '45%',
                            background: 'linear-gradient(90deg, transparent, #00ffcc, #ffcc00, transparent)',
                            animation: 'progress-shimmer 1.5s ease-in-out infinite'
                        }}
                    />
                </div>

                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 500 }}>
                    Calibrating Quantum Spatial Matrices
                </div>
            </div>
        </div>

        {/* Bottom-Left Telemetry & FPS Badge */}
        <div
            className="hud-fps-badge"
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                background: 'rgba(12, 16, 26, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                zIndex: 999,
                userSelect: 'none',
                pointerEvents: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                <span
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: 900,
                        color: fps >= 55 ? '#00ffcc' : fps >= 30 ? '#ffcc00' : '#ff3b30',
                        letterSpacing: '-0.5px'
                    }}
                >
                    {fps || 60}
                </span>
                <span
                    style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: 'rgba(255, 255, 255, 0.45)',
                        letterSpacing: '0.5px'
                    }}
                >
                    FPS
                </span>
            </div>
        </div>

        {/* Top-Right Active Topology Display & Morph Convergence Progress Bar */}
        {(() => {
            const rawProgress = simState.current?.morphProgress !== undefined ? simState.current.morphProgress : 1.0;
            const morphPercent = Math.min(100, Math.max(0, Math.round(rawProgress * 100)));
            const isMorphing = rawProgress < 1.0;

            return (
                <div
                    className="top-right-combination-bar"
                    style={{
                        position: 'fixed',
                        top: '18px',
                        right: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '275px',
                        boxSizing: 'border-box',
                        background: 'rgba(12, 16, 26, 0.88)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(255, 255, 255, 0.16)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55), 0 0 16px rgba(0, 255, 204, 0.08)',
                        zIndex: 1000,
                        userSelect: 'none',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '6px 12px',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <div
                            onClick={() => {
                                setIsSettingsOpen(true);
                                setActiveCatalogTab('topology');
                            }}
                            title={`Click to view and choose from all ${formations.length} Topologies`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                flex: 1,
                                minWidth: 0
                            }}
                        >
                            <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 6px rgba(0,255,204,0.35))', flexShrink: 0 }}>
                                {activePreset.icon || '🌀'}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>TOPOLOGY</span>
                                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)' }}>• #{Number(simState.current.formationMode ?? 0) + 1}</span>
                                    {isMorphing && (
                                        <span style={{ fontSize: '8.5px', color: '#00ffcc', fontWeight: 900, background: 'rgba(0, 255, 204, 0.15)', padding: '0 3px', borderRadius: '4px' }}>
                                            {morphPercent}%
                                        </span>
                                    )}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {simState.current.customFormationName || activePreset.label || 'Formation'}
                                </span>
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 1px', flexShrink: 0 }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                                className="matrix-action-btn like"
                                onClick={handleLikeOverallCombination}
                                title="Like this overall composition combination (+2 RL synergy to all active traits)"
                                style={{ width: '30px', height: '30px', fontSize: '14px' }}
                            >
                                👍
                            </button>
                            <button
                                className="matrix-action-btn dislike"
                                onClick={handleDislikeOverallCombination}
                                title="Dislike this overall composition combination & morph immediately to next"
                                style={{ width: '30px', height: '30px', fontSize: '14px' }}
                            >
                                👎
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar for Completion of the Topology */}
                    <div
                        style={{
                            width: '100%',
                            height: '3px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            position: 'relative'
                        }}
                        title={`Topology Formation Morph: ${morphPercent}% completed`}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${morphPercent}%`,
                                background: isMorphing
                                    ? 'linear-gradient(90deg, #ff007f, #00ffcc)'
                                    : 'linear-gradient(90deg, #00ffcc, #00e5ff)',
                                boxShadow: isMorphing ? '0 0 8px #00ffcc' : 'none',
                                transition: 'width 0.08s linear'
                            }}
                        />
                    </div>
                </div>
            );
        })()}

        {/* Aesthetic Matrix Studio (Main Settings Menu) */}
        {isSettingsOpen && (
            <div
                className={`ephemeral-like-bar ${activeCatalogTab ? 'catalog-expanded' : ''}`}
                style={{
                    opacity: 1,
                    pointerEvents: 'auto'
                }}
            >
                {activeCatalogTab === null ? (
                    <>
                        {/* Main Settings Header */}
                        <div className="matrix-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="matrix-title">🎛️ AESTHETIC MATRIX</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '9px', color: '#00ffcc', fontWeight: 800 }}>AI RL Engine</span>
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '50%',
                                        width: '22px',
                                        height: '22px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        padding: 0
                                    }}
                                    title="Close Settings Menu"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* 1. Topology Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('topology')}
                                title={`Click to browse and select from all ${formations.length} Topologies`}
                            >
                                <span className="dimension-name">🌀 TOPOLOGY</span>
                                <span className="dimension-value" title={simState.current.customFormationName || formations.find(f => f.id === (simState.current.formationMode ?? 0))?.label}>
                                    {simState.current.customFormationName || formations.find(f => f.id === (simState.current.formationMode ?? 0))?.label || 'Topology'}
                                </span>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('formation')} title="Like Topology (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('formation')} title="Dislike Topology (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isFormationLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('formation')} title={simState.current.isFormationLocked ? "Topology is LOCKED — Click to Unlock" : "Click to LOCK Topology"}>
                                    {simState.current.isFormationLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('formation')} title="Reroll Topology (Instant Smooth Morph)">🎲</button>
                            </div>
                        </div>

                        {/* 2. Palette Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('palette')}
                                title="Click to browse and select from all 24 Color Palettes"
                            >
                                <span className="dimension-name">🎨 PALETTE</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <div style={{ display: 'flex', height: '8px', width: '48px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                                        {(simState.current.speciesColors || SPECIES_COLORS).map((c: string, i: number) => (
                                            <div key={i} style={{ flex: 1, background: c }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#e0e8ff' }}>
                                        {simState.current.customPaletteName ? '✨ Procedural' : '#' + ((simState.current.paletteIndex ?? 0) + 1)}
                                    </span>
                                </div>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('palette')} title="Like Palette (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('palette')} title="Dislike Palette (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isPaletteLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('palette')} title={simState.current.isPaletteLocked ? "Palette is LOCKED — Click to Unlock" : "Click to LOCK Palette"}>
                                    {simState.current.isPaletteLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('palette')} title="Reroll Palette (Instant Fluid Morph)">🎲</button>
                            </div>
                        </div>

                        {/* 3. Material Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('material')}
                                title="Click to browse and select from all Material finishes"
                            >
                                <span className="dimension-name">✨ MATERIAL</span>
                                <span className="dimension-value" title={simState.current.customMaterialName || MATERIAL_PRESETS[simState.current.materialPreset ?? 0]?.label}>
                                    {simState.current.customMaterialName || MATERIAL_PRESETS[simState.current.materialPreset ?? 0]?.label || 'Titanium Mirror'}
                                </span>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('material')} title="Like Material (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('material')} title="Dislike Material (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isMaterialLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('material')} title={simState.current.isMaterialLocked ? "Material is LOCKED — Click to Unlock" : "Click to LOCK Material"}>
                                    {simState.current.isMaterialLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('material')} title="Reroll Material">🎲</button>
                            </div>
                        </div>

                        {/* 4. Lighting Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('lighting')}
                                title="Click to browse and select from all Studio Lighting setups"
                            >
                                <span className="dimension-name">💡 LIGHTING</span>
                                <span className="dimension-value" title={simState.current.customLightingName || LIGHTING_PROFILES[simState.current.lightingProfileIndex ?? 0]?.label}>
                                    {simState.current.customLightingName || LIGHTING_PROFILES[simState.current.lightingProfileIndex ?? 0]?.label || 'Studio White'}
                                </span>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('lighting')} title="Like Lighting (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('lighting')} title="Dislike Lighting (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isLightingLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('lighting')} title={simState.current.isLightingLocked ? "Lighting is LOCKED — Click to Unlock" : "Click to LOCK Lighting"}>
                                    {simState.current.isLightingLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('lighting')} title="Reroll Lighting (Smooth Quintic S-Curve)">🎲</button>
                            </div>
                        </div>

                        {/* 5. Shape Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('geometry')}
                                title="Click to browse and select 3D Boid Geometries"
                            >
                                <span className="dimension-name">📐 SHAPE</span>
                                <span className="dimension-value" title={simState.current.customShapeName || (simState.current.boidShape === 99 ? 'Multi-Species Diverse' : shapes.find(s => s.id === (simState.current.boidShape ?? 0))?.label)}>
                                    {simState.current.customShapeName || (simState.current.boidShape === 99 ? 'Multi-Species Diverse' : shapes.find(s => s.id === (simState.current.boidShape ?? 0))?.label || 'Geodesic Ico-Sphere')}
                                </span>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('shape')} title="Like Shape (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('shape')} title="Dislike Shape (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isShapeLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('shape')} title={simState.current.isShapeLocked ? "Shape is LOCKED — Click to Unlock" : "Click to LOCK Shape"}>
                                    {simState.current.isShapeLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('shape')} title="Reroll Shape">🎲</button>
                            </div>
                        </div>

                        {/* 6. Camera Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('camera')}
                                title="Click to browse and select Cinematic Camera presets"
                            >
                                <span className="dimension-name">🎥 CAMERA</span>
                                <span className="dimension-value" title={CAMERA_PRESETS[simState.current.cameraPresetIndex ?? 0]?.name}>
                                    {CAMERA_PRESETS[simState.current.cameraPresetIndex ?? 0]?.name || 'Orbit'}
                                </span>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('camera')} title="Like Camera (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('camera')} title="Dislike Camera (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isCameraLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('camera')} title={simState.current.isCameraLocked ? "Camera is LOCKED — Click to Unlock" : "Click to LOCK Camera"}>
                                    {simState.current.isCameraLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('camera')} title="Reroll Camera (Silky Smooth Glide)">🎲</button>
                            </div>
                        </div>

                        {/* 7. Bloom & Optical Flares Row */}
                        <div className="ephemeral-row">
                            <div
                                className="dimension-info"
                                onClick={() => setActiveCatalogTab('bloom')}
                                title="Click to browse 24 high-intensity non-opaque Bloom presets and live sliders"
                            >
                                <span className="dimension-name">✨ OPTICAL BLOOM</span>
                                <span className="dimension-value" title={BLOOM_PRESETS[simState.current.bloomPreset ?? 0]?.label}>
                                    {BLOOM_PRESETS[simState.current.bloomPreset ?? 0]?.label || 'Diamond Facet Sparkle'}
                                </span>
                            </div>
                            <div className="matrix-actions">
                                <button className="matrix-action-btn like" onClick={() => handleLikeDimension('bloom')} title="Like Bloom (+1 RL Weight)">👍</button>
                                <button className="matrix-action-btn dislike" onClick={() => handleDislikeDimension('bloom')} title="Dislike Bloom (-1 & Morph Next)">👎</button>
                                <button className={`matrix-action-btn lock ${simState.current.isBloomLocked ? 'is-locked' : ''}`} onClick={() => handleToggleLockDimension('bloom')} title={simState.current.isBloomLocked ? "Bloom is LOCKED — Click to Unlock" : "Click to LOCK Bloom"}>
                                    {simState.current.isBloomLocked ? '🔒' : '🔓'}
                                </button>
                                <button className="matrix-action-btn reroll" onClick={() => handleRerollDimension('bloom')} title="Reroll Bloom Preset">🎲</button>
                            </div>
                        </div>

                        {/* Footer Actions: Save Masterpiece, Lock All & Masterpiece Gallery in tidy 3-column Grid */}
                        <div className="matrix-footer-grid">
                            <button
                                className="matrix-footer-btn save"
                                onClick={handleSaveFullCreation}
                                title="Save entire aesthetic Masterpiece to Gallery & train future AI generations"
                            >
                                <span>❤️</span>
                                <span>Save (+RL)</span>
                            </button>
                            <button
                                className={`matrix-footer-btn lock ${isAllDimensionsLocked ? 'is-locked' : ''}`}
                                onClick={handleToggleGlobalLock}
                                title={isAllDimensionsLocked ? "All dimensions are LOCKED — Click to Unlock All" : "Click to LOCK All Dimensions (Freeze Entire Simulation)"}
                            >
                                <span>{isAllDimensionsLocked ? '🔒' : '🔓'}</span>
                                <span>{isAllDimensionsLocked ? 'Locked' : 'Lock All'}</span>
                            </button>
                            <button
                                className="matrix-footer-btn gallery"
                                onClick={() => setIsGalleryOpen(true)}
                                title={`Open Masterpiece Gallery (${likedList.length} saved creations)`}
                            >
                                <span>🖼️</span>
                                <span>Gallery</span>
                                {likedList.length > 0 && (
                                    <span style={{
                                        background: 'rgba(255, 204, 0, 0.25)',
                                        padding: '1px 4px',
                                        borderRadius: '6px',
                                        fontSize: '9px',
                                        color: '#fff',
                                        marginLeft: '1px'
                                    }}>
                                        {likedList.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Extra Physics & Simulation Quick Trigger */}
                        <button
                            className="matrix-physics-btn"
                            onClick={() => setActiveCatalogTab('physics')}
                            title="Open Boid Population & Flight Physics settings"
                        >
                            <span>⚙️</span>
                            <span>Simulation Physics & Population</span>
                        </button>
                    </>
                ) : (
                    <>
                        {/* Sub-Catalog Header */}
                        <div className="matrix-header" style={{ paddingBottom: '8px' }}>
                            <button
                                onClick={() => setActiveCatalogTab(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px',
                                    color: '#00ffcc',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '4px 8px',
                                    cursor: 'pointer'
                                }}
                            >
                                ❮ Back
                            </button>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                {activeCatalogTab === 'topology' && `Topologies (${formations.length})`}
                                {activeCatalogTab === 'palette' && 'Color Palettes (24)'}
                                {activeCatalogTab === 'geometry' && 'Species & Shapes'}
                                {activeCatalogTab === 'material' && 'Material Finishes'}
                                {activeCatalogTab === 'lighting' && 'Studio Lighting'}
                                {activeCatalogTab === 'camera' && 'Camera Angles'}
                                {activeCatalogTab === 'bloom' && 'Optical Bloom & Flares (24)'}
                                {activeCatalogTab === 'physics' && 'Physics & Population'}
                            </span>
                            <button
                                onClick={() => { setIsSettingsOpen(false); setActiveCatalogTab(null); }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '50%',
                                    width: '22px',
                                    height: '22px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    padding: 0
                                }}
                                title="Close Settings"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sub-Catalog 1: Topology */}
                        {activeCatalogTab === 'topology' && (
                            <div className="topology-grid no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                                {sortedFormations.map(f => {
                                    const fLikes = rlPrefs.formationLikes[f.id] || 0;
                                    const fDislikes = rlPrefs.formationDislikes[f.id] || 0;
                                    const isSelected = currentFormation === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => selectFormation(f.id)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                background: isSelected ? 'rgba(0, 255, 204, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                border: isSelected ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.08)',
                                                color: isSelected ? '#00ffcc' : '#fff',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease',
                                                minWidth: 0,
                                                maxWidth: '100%',
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '4px' }}>
                                                <div style={{ width: '100%', maxWidth: '100%', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {f.icon} {f.label}
                                                </div>
                                                {(fLikes > 0 || fDislikes > 0) && (
                                                    <div style={{ display: 'flex', gap: '3px', fontSize: '9px', fontWeight: 800, flexShrink: 0 }}>
                                                        {fLikes > 0 && <span style={{ color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👍{fLikes}</span>}
                                                        {fDislikes > 0 && <span style={{ color: '#ff5c5c', background: 'rgba(255, 59, 48, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👎{fDislikes}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: '100%', maxWidth: '100%', fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {f.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Sub-Catalog 2: Palette */}
                        {activeCatalogTab === 'palette' && (
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                                <button
                                    onClick={() => {
                                        if (simState.current.clockEngine?.skipDimension) {
                                            const res = simState.current.clockEngine.skipDimension('palette');
                                            showToast(`🎲 ${res}`);
                                            setTick(t => t + 1);
                                            setActiveCatalogTab(null);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.2), rgba(255, 0, 127, 0.2))',
                                        border: '1px solid #00ffcc',
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        marginBottom: '4px'
                                    }}
                                >
                                    ✨ Generate Surprise Procedural Harmonic Palette 🎲
                                </button>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                                    {sortedPalettes.map(({ pal, idx }) => {
                                        const isSelected = simState.current.paletteIndex === idx && !simState.current.customPaletteName;
                                        const pLikes = rlPrefs.paletteLikes[idx] || 0;
                                        const pDislikes = rlPrefs.paletteDislikes[idx] || 0;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => selectPalette(idx)}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    padding: '10px 12px',
                                                    borderRadius: '12px',
                                                    background: isSelected ? 'rgba(0, 255, 204, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                    border: isSelected ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.08)',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s ease',
                                                    minWidth: 0,
                                                    boxSizing: 'border-box',
                                                    gap: '6px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#00ffcc' : '#fff' }}>
                                                        #{idx + 1} Harmonic
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {(pLikes > 0 || pDislikes > 0) && (
                                                            <div style={{ display: 'flex', gap: '3px', fontSize: '9px', fontWeight: 800, flexShrink: 0 }}>
                                                                {pLikes > 0 && <span style={{ color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👍{pLikes}</span>}
                                                                {pDislikes > 0 && <span style={{ color: '#ff5c5c', background: 'rgba(255, 59, 48, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👎{pDislikes}</span>}
                                                            </div>
                                                        )}
                                                        {isSelected && <span style={{ fontSize: '10px', color: '#00ffcc' }}>✓</span>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                    {pal.map((c, i) => (
                                                        <div key={i} style={{ flex: 1, background: c }} />
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sub-Catalog 3: Geometry & Shapes */}
                        {activeCatalogTab === 'geometry' && (
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                                <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff007f', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                            🧬 4-Species Shape Customizer
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (simState.current.clockEngine?.skipDimension) {
                                                    const res = simState.current.clockEngine.skipDimension('shape');
                                                    showToast(`🎲 ${res}`);
                                                    setTick(t => t + 1);
                                                    setActiveCatalogTab(null);
                                                }
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.2), rgba(0, 255, 204, 0.2))',
                                                border: '1px solid #ff007f',
                                                color: '#fff',
                                                fontSize: '9.5px',
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✨ Surprise Hybrid 🎲
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                                        {[0, 1, 2, 3].map((spIdx) => {
                                            const spColors = simState.current.speciesColors || SPECIES_COLORS;
                                            const currentShapes = simState.current.speciesShapes || (simState.current.boidShape === 99 ? [0, 0, 1, 2] : [simState.current.boidShape ?? 0, simState.current.boidShape ?? 0, simState.current.boidShape ?? 0, simState.current.boidShape ?? 0]);
                                            const currentSpShape = currentShapes[spIdx] ?? 0;
                                            const shapeDef = shapes.find(s => s.id === currentSpShape) || shapes[2];

                                            return (
                                                <div
                                                    key={spIdx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 10px',
                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                        border: `1px solid ${spColors[spIdx] || 'rgba(255,255,255,0.1)'}44`,
                                                        borderRadius: '10px',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: spColors[spIdx], flexShrink: 0, boxShadow: `0 0 6px ${spColors[spIdx]}` }} />
                                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                            <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.6)' }}>Species {spIdx + 1}</span>
                                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {shapeDef.icon} {shapeDef.label.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const nextShapeId = (currentSpShape + 1) % 6;
                                                            handleSetSpeciesShape(spIdx, nextShapeId);
                                                        }}
                                                        title="Cycle shape for this species"
                                                        style={{
                                                            padding: '4px 6px',
                                                            borderRadius: '6px',
                                                            background: 'rgba(255, 255, 255, 0.08)',
                                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                                            color: '#00ffcc',
                                                            fontSize: '10px',
                                                            fontWeight: 800,
                                                            cursor: 'pointer',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        Next ❯
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px' }}>
                                    {sortedShapes.map(s => {
                                        const sLikes = rlPrefs.shapeLikes[s.id] || 0;
                                        const sDislikes = rlPrefs.shapeDislikes[s.id] || 0;
                                        const isSelected = currentShapeId === s.id && !simState.current.customShapeName;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => selectShape(s.id)}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    background: isSelected ? 'rgba(255, 0, 127, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                    border: isSelected ? '1px solid #ff007f' : '1px solid rgba(255, 255, 255, 0.08)',
                                                    color: isSelected ? '#ff007f' : '#fff',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{s.icon} {s.label}</div>
                                                    {(sLikes > 0 || sDislikes > 0) && (
                                                        <div style={{ display: 'flex', gap: '3px', fontSize: '9px', fontWeight: 800 }}>
                                                            {sLikes > 0 && <span style={{ color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👍{sLikes}</span>}
                                                            {sDislikes > 0 && <span style={{ color: '#ff5c5c', background: 'rgba(255, 59, 48, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👎{sDislikes}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{s.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sub-Catalog 4: Material */}
                        {activeCatalogTab === 'material' && (
                            <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                                {sortedMaterials.map(m => {
                                    const mLikes = rlPrefs.materialLikes[m.id] || 0;
                                    const mDislikes = rlPrefs.materialDislikes[m.id] || 0;
                                    const isSelected = currentMaterialId === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => selectMaterial(m.id)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                background: isSelected ? 'rgba(157, 0, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                border: isSelected ? '1px solid #9d00ff' : '1px solid rgba(255, 255, 255, 0.08)',
                                                color: isSelected ? '#c084fc' : '#fff',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{m.icon} {m.label}</div>
                                                {(mLikes > 0 || mDislikes > 0) && (
                                                    <div style={{ display: 'flex', gap: '3px', fontSize: '9px', fontWeight: 800 }}>
                                                        {mLikes > 0 && <span style={{ color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👍{mLikes}</span>}
                                                        {mDislikes > 0 && <span style={{ color: '#ff5c5c', background: 'rgba(255, 59, 48, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👎{mDislikes}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{m.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Sub-Catalog 5: Lighting */}
                        {activeCatalogTab === 'lighting' && (
                            <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                                {sortedLighting.map(({ lp, idx }) => {
                                    const lLikes = rlPrefs.lightingLikes[lp.id] || 0;
                                    const lDislikes = rlPrefs.lightingDislikes[lp.id] || 0;
                                    const isSelected = currentLightingId === lp.id;
                                    return (
                                        <button
                                            key={lp.id}
                                            onClick={() => selectLighting(lp.id)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                background: isSelected ? 'rgba(255, 204, 0, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                border: isSelected ? '1px solid #ffcc00' : '1px solid rgba(255, 255, 255, 0.08)',
                                                color: isSelected ? '#ffcc00' : '#fff',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>💡 {lp.label}</div>
                                                    {(lLikes > 0 || lDislikes > 0) && (
                                                        <div style={{ display: 'flex', gap: '3px', fontSize: '9px', fontWeight: 800 }}>
                                                            {lLikes > 0 && <span style={{ color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👍{lLikes}</span>}
                                                            {lDislikes > 0 && <span style={{ color: '#ff5c5c', background: 'rgba(255, 59, 48, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👎{lDislikes}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                                                    Key: {lp.keyColor} • Rim: {lp.rimColor}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: lp.keyColor, border: '1px solid rgba(255,255,255,0.3)' }} />
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: lp.rimColor, border: '1px solid rgba(255,255,255,0.3)' }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Sub-Catalog 6: Camera Angles */}
                        {activeCatalogTab === 'camera' && (
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                                    Choose an artistic camera vantage:
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px' }}>
                                    {sortedCameras.map(({ cp, idx }) => {
                                        const isSelected = (simState.current.cameraPresetIndex ?? 0) === idx;
                                        const cLikes = rlPrefs.cameraLikes[String(idx)] || rlPrefs.cameraLikes[cp.id] || 0;
                                        const cDislikes = rlPrefs.cameraDislikes[String(idx)] || rlPrefs.cameraDislikes[cp.id] || 0;
                                        return (
                                            <button
                                                key={cp.id}
                                                onClick={() => selectCameraPreset(idx)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 14px',
                                                    borderRadius: '12px',
                                                    background: isSelected ? 'rgba(0, 255, 204, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                                    border: isSelected ? '1.5px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.08)',
                                                    color: isSelected ? '#00ffcc' : '#fff',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s ease',
                                                    gap: '12px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '22px' }}>{cp.icon}</span>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#00ffcc' : '#fff' }}>
                                                                {cp.name}
                                                            </div>
                                                            {(cLikes > 0 || cDislikes > 0) && (
                                                                <div style={{ display: 'flex', gap: '3px', fontSize: '9px', fontWeight: 800 }}>
                                                                    {cLikes > 0 && <span style={{ color: '#00ffcc', background: 'rgba(0, 255, 204, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👍{cLikes}</span>}
                                                                    {cDislikes > 0 && <span style={{ color: '#ff5c5c', background: 'rgba(255, 59, 48, 0.15)', padding: '1px 4px', borderRadius: '4px' }}>👎{cDislikes}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: isSelected ? 'rgba(0, 255, 204, 0.8)' : 'rgba(255, 255, 255, 0.5)', marginTop: '2px', lineHeight: 1.3 }}>
                                                            {cp.description}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '9px',
                                                    fontWeight: 900,
                                                    letterSpacing: '0.5px',
                                                    background: isSelected ? '#00ffcc' : 'rgba(255,255,255,0.08)',
                                                    color: isSelected ? '#0a0f1d' : 'rgba(255,255,255,0.6)'
                                                }}>
                                                    {isSelected ? 'ACTIVE' : 'SELECT'}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sub-Catalog 7: Optical Bloom & Flares */}
                        {activeCatalogTab === 'bloom' && (
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden', padding: '4px 2px', boxSizing: 'border-box' }}>
                                {/* 24 Presets Grid */}
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                        CURATED PRESETS (HIGH INTENSITY • NON-OPAQUE)
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '6px' }}>
                                        {BLOOM_PRESETS.map(bp => {
                                            const isSelected = (simState.current.bloomPreset ?? 0) === bp.id;
                                            return (
                                                <button
                                                    key={bp.id}
                                                    onClick={() => {
                                                        simState.current.bloomPreset = bp.id;
                                                        simState.current.bloomSettings = { ...bp.settings };
                                                        setTick(t => t + 1);
                                                        showToast(`✨ Applied: ${bp.label}`);
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        background: isSelected ? 'rgba(0, 255, 204, 0.20)' : 'rgba(255, 255, 255, 0.04)',
                                                        border: isSelected ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.08)',
                                                        color: isSelected ? '#00ffcc' : '#fff',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700 }}>{bp.icon} {bp.label}</div>
                                                        <div style={{ display: 'flex', gap: '4px', fontSize: '9px', fontWeight: 800 }}>
                                                            <span style={{ background: 'rgba(0, 255, 204, 0.15)', color: '#00ffcc', padding: '2px 5px', borderRadius: '4px' }}>
                                                                {bp.settings.intensity}x Int
                                                            </span>
                                                            <span style={{ background: 'rgba(255, 255, 255, 0.10)', color: 'rgba(255, 255, 255, 0.8)', padding: '2px 5px', borderRadius: '4px' }}>
                                                                {bp.settings.luminanceThreshold} Cutoff
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '3px' }}>{bp.desc}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Live Fine-Tuning Sliders */}
                                <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        REAL-TIME SLIDER TUNING
                                    </div>

                                    {/* Threshold */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '3px' }}>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Luminance Threshold:</span>
                                            <span style={{ fontFamily: 'monospace', color: '#00ffcc' }}>
                                                {(simState.current.bloomSettings?.luminanceThreshold ?? 0.90).toFixed(2)}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.00"
                                            max="1.50"
                                            step="0.01"
                                            value={simState.current.bloomSettings?.luminanceThreshold ?? 0.90}
                                            onChange={e => {
                                                if (!simState.current.bloomSettings) simState.current.bloomSettings = { luminanceThreshold: 0.90, radius: 0.10, intensity: 2.20, levels: 2 };
                                                simState.current.bloomSettings.luminanceThreshold = parseFloat(e.target.value);
                                                setTick(t => t + 1);
                                            }}
                                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                                        />
                                    </div>

                                    {/* Radius */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '3px' }}>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Glow Radius:</span>
                                            <span style={{ fontFamily: 'monospace', color: '#00ffcc' }}>
                                                {(simState.current.bloomSettings?.radius ?? 0.10).toFixed(2)}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.00"
                                            max="1.50"
                                            step="0.01"
                                            value={simState.current.bloomSettings?.radius ?? 0.10}
                                            onChange={e => {
                                                if (!simState.current.bloomSettings) simState.current.bloomSettings = { luminanceThreshold: 0.90, radius: 0.10, intensity: 2.20, levels: 2 };
                                                simState.current.bloomSettings.radius = parseFloat(e.target.value);
                                                setTick(t => t + 1);
                                            }}
                                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                                        />
                                    </div>

                                    {/* Intensity */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '3px' }}>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Glint Intensity:</span>
                                            <span style={{ fontFamily: 'monospace', color: '#00ffcc' }}>
                                                {(simState.current.bloomSettings?.intensity ?? 2.20).toFixed(2)}x
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.00"
                                            max="5.00"
                                            step="0.05"
                                            value={simState.current.bloomSettings?.intensity ?? 2.20}
                                            onChange={e => {
                                                if (!simState.current.bloomSettings) simState.current.bloomSettings = { luminanceThreshold: 0.90, radius: 0.10, intensity: 2.20, levels: 2 };
                                                simState.current.bloomSettings.intensity = parseFloat(e.target.value);
                                                setTick(t => t + 1);
                                            }}
                                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                                        />
                                    </div>

                                    {/* Levels */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, marginBottom: '3px' }}>
                                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Blur Pass Levels:</span>
                                            <span style={{ fontFamily: 'monospace', color: '#00ffcc' }}>
                                                {simState.current.bloomSettings?.levels ?? 2}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="8"
                                            step="1"
                                            value={simState.current.bloomSettings?.levels ?? 2}
                                            onChange={e => {
                                                if (!simState.current.bloomSettings) simState.current.bloomSettings = { luminanceThreshold: 0.90, radius: 0.10, intensity: 2.20, levels: 2 };
                                                simState.current.bloomSettings.levels = parseInt(e.target.value, 10);
                                                setTick(t => t + 1);
                                            }}
                                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sub-Catalog 8: Physics */}
                        {activeCatalogTab === 'physics' && (
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden', padding: '4px 2px', boxSizing: 'border-box' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                        BOID POPULATION
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                                        {[5000, 10000, 20000, 50000, 75000, 100000].map(count => (
                                            <button
                                                key={count}
                                                onClick={() => {
                                                    setPopulation(count);
                                                    setTick(t => t + 1);
                                                }}
                                                style={{
                                                    padding: '8px 4px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    border: population === count ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: population === count ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                                    color: population === count ? '#00ffcc' : '#fff',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                {count >= 1000 ? `${count / 1000}k` : count}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                                        <span>FLIGHT SPEED</span>
                                        <span style={{ color: '#00ffcc', fontFamily: 'monospace' }}>{((simState.current.speedMultiplier || 0.28) * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.10"
                                        max="0.60"
                                        step="0.01"
                                        value={simState.current.speedMultiplier || 0.28}
                                        onChange={(e) => {
                                            simState.current.speedMultiplier = parseFloat(e.target.value);
                                            setTick(t => t + 1);
                                        }}
                                        style={{ width: '100%', boxSizing: 'border-box', accentColor: '#00ffcc', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        )}

        {/* Floating Bottom Right Controls */}
        <div className="floating-bottom-bar" style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000 }}>
            {/* Auto Mode Toggle Button with Radial Timer Progress Ring */}
            <button
                className={`defeat-selector-btn ${isAutoMode ? 'timer-active-pulse' : ''}`}
                onClick={handleToggleAuto}
                title={isAutoMode ? `Auto-cycle is ON (${countdown}s remaining) — Click to Turn Auto OFF (Pause)` : "Auto-cycle is OFF — Click to Turn Auto ON (Resume)"}
                style={{
                    position: 'relative',
                    width: '56px',
                    height: '56px',
                    padding: 0,
                    borderRadius: '50%',
                    background: isAutoMode ? 'rgba(12, 16, 26, 0.85)' : 'rgba(18, 22, 34, 0.8)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isAutoMode ? 'none' : '1.5px solid rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: isAutoMode ? '0 0 20px rgba(0, 255, 204, 0.35)' : '0 4px 16px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Radial Animated Progress SVG Ring */}
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                    {/* Background Track Circle */}
                    <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.12)"
                        strokeWidth="3.5"
                    />
                    {/* Animated Countdown Progress Ring */}
                    <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke={isAutoMode ? '#00ffcc' : 'rgba(255, 255, 255, 0.25)'}
                        strokeWidth="3.5"
                        strokeDasharray="150.796"
                        strokeDashoffset={isAutoMode ? (150.796 * progress).toFixed(2) : '150.796'}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 0.15s linear, stroke 0.3s ease'
                        }}
                    />
                </svg>

                {/* Center Content */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                }}>
                    {isAutoMode ? (
                        <>
                            <span style={{
                                fontSize: '18px',
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                color: '#00ffcc',
                                letterSpacing: '-0.5px'
                            }}>
                                {countdown}
                            </span>
                            <span style={{
                                fontSize: '8px',
                                fontWeight: 800,
                                color: 'rgba(0, 255, 204, 0.7)',
                                letterSpacing: '0.5px',
                                marginTop: '1px'
                            }}>
                                SEC
                            </span>
                        </>
                    ) : (
                        <>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                color: 'rgba(255, 255, 255, 0.8)',
                                letterSpacing: '0.5px'
                            }}>
                                OFF
                            </span>
                            <span style={{
                                fontSize: '7.5px',
                                fontWeight: 800,
                                color: 'rgba(255, 255, 255, 0.45)',
                                letterSpacing: '0.5px',
                                marginTop: '1px'
                            }}>
                                AUTO
                            </span>
                        </>
                    )}
                </div>
            </button>

            {/* Main Settings Toggle Button with Settings Cog */}
            <button
                className="defeat-selector-btn"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                title="Toggle Swarm Studio Settings Panel"
                style={{
                    width: '52px',
                    height: '52px',
                    padding: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSettingsOpen ? 'rgba(0, 255, 204, 0.25)' : 'rgba(12, 16, 26, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isSettingsOpen ? '1.5px solid #00ffcc' : '1.5px solid rgba(255, 255, 255, 0.18)',
                    color: isSettingsOpen ? '#00ffcc' : '#ffffff',
                    boxShadow: isSettingsOpen ? '0 0 24px rgba(0, 255, 204, 0.4)' : '0 4px 16px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
            >
                {isSettingsOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                )}
            </button>
        </div>

        {/* Masterpiece Gallery Slide-Up Sheet */}
        {isGalleryOpen && (
            <div className="gallery-slide-up no-scrollbar">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffcc00', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            SAVED MASTERPIECES GALLERY
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                            {likedList.length} saved aesthetic snapshots
                        </div>
                    </div>
                    <button
                        onClick={() => setIsGalleryOpen(false)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Central RL Management & Backup Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00ffcc', boxShadow: '0 0 8px #00ffcc' }} />
                        <span>Central RL Store: <strong style={{ color: '#00ffcc' }}>👍 {rlPrefs.totalLikes}</strong> <strong style={{ color: '#ff5c5c', marginLeft: '4px' }}>👎 {rlPrefs.totalDislikes}</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => {
                                const json = exportCentralRLJSON();
                                const blob = new Blob([json], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `flock-taste-profile-${new Date().toISOString().slice(0, 10)}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                                showToast('📥 Central Taste Profile Exported as JSON');
                            }}
                            style={{ padding: '5px 10px', borderRadius: '8px', background: 'rgba(0, 255, 204, 0.12)', border: '1px solid rgba(0, 255, 204, 0.3)', color: '#00ffcc', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                            title="Download full centrally stored taste weights, history logs, and masterpieces as a JSON backup"
                        >
                            📥 Export Backup
                        </button>
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.json';
                                input.onchange = async (e: any) => {
                                    const file = e.target?.files?.[0];
                                    if (!file) return;
                                    const text = await file.text();
                                    if (importCentralRLJSON(text)) {
                                        showToast('✅ Central Taste Profile Imported & Synced');
                                        setTick(t => t + 1);
                                    } else {
                                        showToast('⚠️ Invalid Taste Profile JSON');
                                    }
                                };
                                input.click();
                            }}
                            style={{ padding: '5px 10px', borderRadius: '8px', background: 'rgba(255, 204, 0, 0.12)', border: '1px solid rgba(255, 204, 0, 0.3)', color: '#ffcc00', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                            title="Import an existing taste profile JSON"
                        >
                            📤 Import
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to reset all RL preference weights to default?')) {
                                    resetCentralRLStore();
                                    showToast('🔄 RL Preferences Reset');
                                    setTick(t => t + 1);
                                }
                            }}
                            style={{ padding: '5px 8px', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.12)', border: '1px solid rgba(255, 59, 48, 0.3)', color: '#ff5c5c', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                            title="Reset taste preferences"
                        >
                            🔄 Reset
                        </button>
                    </div>
                </div>

                {likedList.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>
                        No saved creations yet! Tap the ❤️ Save button at the bottom whenever you see an inspiring composition.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', overflowY: 'auto', maxHeight: '55vh', paddingBottom: '16px' }}>
                        {likedList.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{item.formationLabel}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Color Swatch Strip */}
                                <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                    {item.colors.map((c, idx) => (
                                        <div key={idx} style={{ flex: 1, background: c }} />
                                    ))}
                                </div>

                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {item.materialLabel} • {item.shapeLabel}
                                </div>

                                <button
                                    onClick={() => restoreCreation(item)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '10px',
                                        background: 'rgba(0, 255, 204, 0.2)',
                                        border: '1px solid #00ffcc',
                                        color: '#00ffcc',
                                        fontWeight: 800,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    RESTORE COMPOSITION
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        </>
    );
};

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { SimulationState, SPECIES_COLORS, SpeciesAttributes, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, LIGHTING_PROFILES } from './BoidLogic';
import { LikedCreation, getLikedCreations, saveLikedCreation, likeDimension, dislikeDimension, generateProceduralGenome } from './RLEngine';
import { CAMERA_PRESETS } from './CameraRig';

interface OverlayUIProps {
    simState: React.MutableRefObject<SimulationState>;
    population: number;
    setPopulation: (n: number | ((prev: number) => number)) => void;
    fps: number;
    isLoading?: boolean;
}

export const OverlayUI: React.FC<OverlayUIProps> = ({ simState, population, setPopulation, fps, isLoading }) => {
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 200);
        return () => clearInterval(interval);
    }, []);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'topology' | 'geometry' | 'material' | 'lighting' | 'camera' | 'physics'>('topology');
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

    const formations = [
        // --- Intertwined Multi-Helix & Braided Multi-Layer Formations (Featured) ---
        { id: FormationMode.QuadHelixBraid, label: 'Quad Helix Braid', icon: '🧬', desc: '4-Strand species intertwined helix with cross-ladder rungs' },
        { id: FormationMode.ConcentricDualHelixSheath, label: 'Concentric Dual Helix Sheath', icon: '🧬', desc: 'Inner double-helix nested inside outer counter-rotating helix cage' },
        { id: FormationMode.CaduceusVortex, label: 'Caduceus Vortex', icon: '⚕️', desc: 'Dual intertwined serpents ascending around central spine & wings' },
        { id: FormationMode.ToroidalHelixBraid, label: 'Toroidal Helix Braid', icon: '🍩', desc: 'Closed continuous 4-strand braided torus cable' },
        { id: FormationMode.TrefoilBraidedRibbon, label: 'Trefoil Braided Ribbon', icon: '🎗️', desc: '4-Strand braided cable woven around 3D Trefoil knot' },
        { id: FormationMode.HexaHelixVortexTower, label: 'Hexa Helix Vortex Tower', icon: '🌪️', desc: 'Multi-tiered ascending celestial helix staircase' },
        { id: FormationMode.MobiusHelixBraid, label: 'Mobius Helix Braid', icon: '🎗️', desc: 'Continuous 3D Mobius ribbon with 4 braided sub-currents' },
        { id: FormationMode.LissajousIntertwinedKnot, label: 'Lissajous Intertwined Knot', icon: '🔮', desc: '4 Weaving harmonic ribbons in 3D 8-knot' },
        { id: FormationMode.DoubleHelix, label: 'Double Helix', icon: '🧬', desc: 'Intertwined bio-macromolecule dual strand' },
        { id: FormationMode.TripleHelix, label: 'Triple Helix', icon: '🧬', desc: 'Tri-strand intertwined braided stream' },
        { id: FormationMode.DNALadder, label: 'DNA Ladder Braid', icon: '🧬', desc: 'Dual helical sugar-phosphate rails with base-pair rungs' },
        { id: FormationMode.TrefoilKnot, label: 'Trefoil Harmonics', icon: '🎗️', desc: 'Continuous canonical (2,3) cloverleaf streamline' },
        { id: FormationMode.TorusKnot, label: 'Torus Knot Stream', icon: '🍩', desc: 'Continuous seamless bio-ring flow' },
        { id: FormationMode.CalabiYauManifold, label: 'Calabi-Yau Bloom', icon: '🌌', desc: '6D String theory compactification projection' },
        { id: FormationMode.HopfFibration, label: 'Hopf Fiber Bundle', icon: '🫧', desc: 'Nested Villarceau circular fiber streams' },
        { id: FormationMode.LorenzAttractor, label: 'Lorenz Butterfly', icon: '🦋', desc: 'Continuous dual-scroll chaotic wings' },
        { id: FormationMode.GyroidMinimalSurface, label: 'Gyroid Flow', icon: '🧬', desc: 'Triply periodic minimal surface streamline' },
        { id: FormationMode.KleinBottle4D, label: 'Klein Bottle Loop', icon: '♾️', desc: 'Continuous self-intersecting topological immersion' },
        { id: FormationMode.CliffordTorus, label: 'Clifford Torus', icon: '💫', desc: 'Flat 4D hyper-torus projection' },
        // --- Kinetic Biomorphic & Fluid Formations ---
        { id: FormationMode.Serpent, label: 'Serpent Stream', icon: '🐍', desc: 'Sleek aerodynamic 3D serpentine ribbon' },
        { id: FormationMode.Spiral, label: 'Galactic Spiral', icon: '🌀', desc: 'Multi-arm logarithmic celestial galaxy' },
        { id: FormationMode.JellyfishPulse, label: 'Jellyfish Veil', icon: '🪼', desc: 'Deep-sea translucent bell with tentacles' },
        { id: FormationMode.QuantumAtom, label: 'Orbital Resonance', icon: '⚛️', desc: 'Harmonically inclined resonant orbital rings' },
        { id: FormationMode.PhoenixWings, label: 'Phoenix Wings', icon: '🪽', desc: 'Soaring undulating biomorphic wings' },
        { id: FormationMode.BlackHoleJet, label: 'Celestial Vortex', icon: '🌌', desc: 'Accretion disk with relativistic polar streams' },
        { id: FormationMode.HourglassVortex, label: 'Hyperboloid Vortex', icon: '⏳', desc: 'Spinning 3D hourglass tornado stream' },
        { id: FormationMode.LissajousKnot, label: 'Lissajous Ribbon', icon: '🔮', desc: 'Smooth harmonic 3D kinetic ribbon loop' },
        { id: FormationMode.Tesseract4D, label: 'Bioluminescent Manta', icon: '🌊', desc: 'Expansive undulating wings with trailing filaments' },
        { id: FormationMode.TornadoFunnel, label: 'Vortex Funnel', icon: '🌪️', desc: 'Aerodynamic spinning whirlwind stream' },
        { id: FormationMode.NautilusShell, label: 'Nautilus Spiral', icon: '🐚', desc: 'Golden ratio logarithmic shell spiral' },
        { id: FormationMode.BioMushroom, label: 'Bio Mushroom', icon: '🍄', desc: 'Fungal umbrella canopy with spore streams' },
        { id: FormationMode.BeehiveSwarm, label: 'Kelp Forest', icon: '🌿', desc: 'Deep-sea swaying kelp forest streamlines' },
        { id: FormationMode.DodecahedronShield, label: 'Oceanic Whirlpool', icon: '🌀', desc: 'Inward logarithmic vortex with rolling waves' },
        { id: FormationMode.SaturnRings, label: 'Saturn Rings', icon: '🪐', desc: 'Planetary core with tilted shimmering rings' },
        { id: FormationMode.PulsingHeart, label: 'Pulsing Heart', icon: '🫀', desc: '3D biomorphic cardioid heart chamber' },
        { id: FormationMode.TsunamiWave, label: 'Tsunami Wave', icon: '🌊', desc: 'Surging 3D breaking ocean curl' },
        { id: FormationMode.SupernovaBurst, label: 'Supernova Nebula', icon: '🎆', desc: 'Cosmic breathing star shockwave with radial streams' },
        { id: FormationMode.CrystalPrism, label: 'Mobius Ribbon', icon: '🎗️', desc: 'Sweeping aerodynamic 3D Mobius sash' },
        { id: FormationMode.VirusCapsid, label: 'Lotus Bloom', icon: '🌸', desc: 'Sacred multi-layered blooming lotus petals' },
        { id: FormationMode.PlasmaArc, label: 'Aurora Stream', icon: '⚡', desc: 'Curving aerodynamic plasma filament ribbon' },
        { id: FormationMode.CoralReef, label: 'Coral Fan', icon: '🪸', desc: 'Graceful fractal marine coral fan' },
        { id: FormationMode.VolcanicColumn, label: 'Thermal Plume', icon: '🌋', desc: 'Ascending turbulent thermal vortex plume' },
        { id: FormationMode.AlienMothership, label: 'Cosmic Disk', icon: '🛸', desc: 'Undulating galactic disc with central energy core' },
        { id: FormationMode.FerrisWheel, label: 'Galaxy Vortex', icon: '🌌', desc: '4-arm logarithmic spiral galaxy with density waves' },
        { id: FormationMode.SpiderWeb, label: 'Intertwined Loops', icon: '♾️', desc: 'Dual intertwined continuous ribbon loops threading through each other' },
        { id: FormationMode.NebulaCloud, label: 'Cosmic Nebula', icon: '🌌', desc: 'Organic interstellar gas and dust cloud' },
        { id: FormationMode.Procedural, label: 'Infinite Procedural', icon: '✨', desc: 'Harmonic Fourier superformula manifold' },
        { id: FormationMode.WireCube, label: 'Aurora Borealis Curtain', icon: '✨', desc: 'Billowing 3D shimmering light curtains' },
        { id: FormationMode.TreeBranch, label: 'Tree of Life', icon: '🌳', desc: 'Recursive 3D branching trunk and canopy' },
        { id: FormationMode.LightningBolt, label: 'Fluid Streamline', icon: '⚡', desc: 'High-energy aerodynamic streamline cascade' },
        { id: FormationMode.RiverDelta, label: 'River Delta', icon: '🏞️', desc: 'Planar branching meandering channels' },
        { id: FormationMode.KelvinHelmholtz, label: 'Kelvin-Helmholtz Billows', icon: '🌊', desc: 'Fluid shear layer rolling vortices' },
        { id: FormationMode.StarPolygon, label: 'Manta Ray Glide', icon: '🦈', desc: 'Majestic oceanic ray with undulating wingtips' },
        { id: FormationMode.CollapsingSphere, label: 'Singularity Breath', icon: '🕳️', desc: 'Cosmic breathing sphere with fluid expansion' },
        { id: FormationMode.BigBangExpansion, label: 'Cosmic Expansion', icon: '💥', desc: 'Radial expanding shockwave shells' },
        { id: FormationMode.GeologicStrata, label: 'Laminar Wave Sheets', icon: '🌊', desc: 'Undulating horizontal fluid current sheets' },
        { id: FormationMode.MurmurationFlow, label: 'Starling Murmuration', icon: '🕊️', desc: 'Emergent rolling starling swarm cloud' },
        { id: FormationMode.OuroborosSerpent, label: 'Ouroboros Dragon', icon: '🐉', desc: 'Coiling aerodynamic dragon swallowing its tail' },
        { id: FormationMode.DancingRibbon, label: 'Dancing Ribbon', icon: '🎀', desc: 'Twisting kinetic gymnast sash' }
    ];

    const shapes = [
        { id: -1, label: 'Auto (Mutate Cycle)', icon: '🤖', desc: 'Randomize shape every formation cycle' },
        { id: 99, label: 'Multi-Species Diverse', icon: '🧬', desc: 'Each species has its own distinctive geometric archetype' },
        { id: 0, label: 'Stealth Arrowhead Jet', icon: '🚀', desc: 'Aerodynamic 3-sided low-poly wedge (6 tris)' },
        { id: 1, label: 'Faceted Gemstone', icon: '💎', desc: '8-faced dual-pointed crystal (8 tris)' },
        { id: 2, label: 'Angular Prism Pyramid', icon: '🧊', desc: '4-sided sharp pyramid crystal (6 tris)' },
        { id: 3, label: 'Hex Shield Interceptor', icon: '🛸', desc: '6-sided faceted shield jet (12 tris)' },
        { id: 4, label: 'Swept Delta Wing', icon: '🪽', desc: '4-sided swept-back wing blade (6 tris)' },
        { id: 5, label: 'Tetrahedral Shard', icon: '📐', desc: 'Ultra-sharp 4-faced wedge shard (4 tris)' }
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

    const selectFormation = (id: FormationMode) => {
        simState.current.prevFormationMode = simState.current.formationMode;
        simState.current.prevFormationSeed = simState.current.formationSeed;
        simState.current.formationMode = id;
        simState.current.formationSeed = Math.random() * 10000;
        simState.current.transitionStartTime = simState.current.currentTime || 0;
        simState.current.transitionDuration = 9.0;

        if (id === FormationMode.Procedural || !simState.current.proceduralGenome) {
            simState.current.proceduralGenome = generateProceduralGenome();
        }

        setTick(t => t + 1);
        setIsSettingsOpen(false);
    };

    const selectShape = (id: number) => {
        if (id === -1) {
            simState.current.autoShape = true;
        } else {
            simState.current.autoShape = false;
            simState.current.boidShape = id;
        }
        setTick(t => t + 1);
        setIsSettingsOpen(false);
    };

    const selectMaterial = (id: number) => {
        if (id === -1) {
            simState.current.autoMaterial = true;
        } else {
            const mat = MATERIAL_PRESETS[id] || MATERIAL_PRESETS[0];
            simState.current.autoMaterial = false;
            simState.current.materialPreset = id;
            simState.current.materialSettings = { ...mat.settings };
        }
        setTick(t => t + 1);
        setIsSettingsOpen(false);
    };

    const selectLighting = (id: number) => {
        const light = LIGHTING_PROFILES[id] || LIGHTING_PROFILES[0];
        simState.current.lightingProfileIndex = id;
        simState.current.lightingProfile = light;
        setTick(t => t + 1);
        setIsSettingsOpen(false);
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
        showToast(`🎥 Camera: ${CAMERA_PRESETS[idx].name}`);
        setIsSettingsOpen(false);
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
        }
        setTick(t => t + 1);
        showToast('Skipping to Next Composition ⏭️');
    };

    const handleLikeDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera') => {
        const state = simState.current;
        let id: number | string = 0;
        let label = 'Trait';

        if (dim === 'formation') {
            id = state.formationMode;
            label = formations.find(f => f.id === id)?.label || 'Topology';
        } else if (dim === 'palette') {
            id = state.paletteIndex ?? 0;
            label = `Palette #${id + 1}`;
        } else if (dim === 'material') {
            id = state.materialPreset ?? 0;
            label = MATERIAL_PRESETS[id]?.label || 'Material';
        } else if (dim === 'lighting') {
            id = state.lightingProfileIndex ?? 0;
            label = LIGHTING_PROFILES[id]?.label || 'Lighting';
        } else if (dim === 'shape') {
            id = state.boidShape ?? 0;
            label = shapes.find(s => s.id === id)?.label || 'Shape';
        } else if (dim === 'camera') {
            id = state.cameraPresetIndex ?? 0;
            label = CAMERA_PRESETS[Number(id)]?.name || 'Camera';
        }

        likeDimension(dim, id);
        showToast(`+1 ${label} added to Taste Profile! 👍`);
        setTick(t => t + 1);
    };

    const handleDislikeDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera') => {
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
        }

        dislikeDimension(dim, id);

        // Immediately morph to a fresh AI-selected creation without waiting for timer!
        if (state.clockEngine?.skipDimension) {
            state.clockEngine.skipDimension(dim);
        }

        showToast(`Disliked ${label} 👎 — Morphing to new variant...`);
        setTick(t => t + 1);
    };

    const handleToggleLockDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera') => {
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
        simState.current.isCameraLocked
    );

    const handleToggleGlobalLock = () => {
        const nextLock = !isAllDimensionsLocked;
        simState.current.isFormationLocked = nextLock;
        simState.current.isPaletteLocked = nextLock;
        simState.current.isMaterialLocked = nextLock;
        simState.current.isLightingLocked = nextLock;
        simState.current.isShapeLocked = nextLock;
        simState.current.isCameraLocked = nextLock;
        setTick(t => t + 1);
        showToast(nextLock ? '🔒 All 6 Dimensions LOCKED (Total Freeze)' : '🔓 All Dimensions UNLOCKED (Full AI Flow)');
    };

    const handleRerollDimension = (dim: 'formation' | 'palette' | 'material' | 'lighting' | 'shape' | 'camera') => {
        const state = simState.current;
        let result = '';

        if (state.clockEngine?.skipDimension) {
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

    const activePreset = formations.find(f => f.id === currentFormation) || formations[0];
    const likedList = getLikedCreations();

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

        {/* Top-Left Telemetry & FPS Badge */}
        <div
            className="hud-fps-badge"
            style={{
                position: 'fixed',
                top: '18px',
                left: '18px',
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '15px',
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

        {/* Aesthetic Matrix Studio (Right Vertical Deck) */}
        <div
            className="ephemeral-like-bar"
            onPointerEnter={() => { lastUserActivity.current = Date.now(); }}
            onPointerMove={() => { lastUserActivity.current = Date.now(); }}
            style={{
                opacity: isLikeBarVisible && !isSettingsOpen && !isGalleryOpen ? 1 : 0,
                pointerEvents: isLikeBarVisible && !isSettingsOpen && !isGalleryOpen ? 'auto' : 'none'
            }}
        >
            <div className="matrix-header">
                <span className="matrix-title">🎛️ Aesthetic Matrix</span>
                <span style={{ fontSize: '9px', color: 'rgba(0, 255, 204, 0.7)', fontWeight: 700 }}>AI RL Engine</span>
            </div>

            {/* 1. Topology Row */}
            <div className="ephemeral-row">
                <div className="dimension-info">
                    <span className="dimension-name">🌀 Topology</span>
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
                <div className="dimension-info">
                    <span className="dimension-name">🎨 Palette</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', height: '8px', width: '48px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {(simState.current.speciesColors || SPECIES_COLORS).map((c, i) => (
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
                <div className="dimension-info">
                    <span className="dimension-name">✨ Material</span>
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
                <div className="dimension-info">
                    <span className="dimension-name">💡 Lighting</span>
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
                <div className="dimension-info">
                    <span className="dimension-name">📐 Shape</span>
                    <span className="dimension-value" title={simState.current.customShapeName || (simState.current.boidShape === 99 ? 'Multi-Species Diverse' : shapes.find(s => s.id === (simState.current.boidShape ?? 0))?.label)}>
                        {simState.current.customShapeName || (simState.current.boidShape === 99 ? 'Multi-Species Diverse' : shapes.find(s => s.id === (simState.current.boidShape ?? 0))?.label || 'Arrowhead Jet')}
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
                <div className="dimension-info">
                    <span className="dimension-name">🎥 Camera</span>
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

            {/* Footer Actions: Save Masterpiece & Global Lock All */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <button
                    className="save-full-btn"
                    onClick={handleSaveFullCreation}
                    title="Save entire 6-dimension Masterpiece to Gallery & train future AI generations"
                    style={{ flex: 1, margin: 0 }}
                >
                    <span>❤️</span> Save (+RL)
                </button>
                <button
                    className={`matrix-action-btn lock ${isAllDimensionsLocked ? 'is-locked' : ''}`}
                    onClick={handleToggleGlobalLock}
                    title={isAllDimensionsLocked ? "All 6 dimensions are LOCKED — Click to Unlock All" : "Click to LOCK All 6 Dimensions (Freeze Entire Simulation)"}
                    style={{
                        width: 'auto',
                        padding: '0 12px',
                        height: '35px',
                        gap: '5px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '11px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <span>{isAllDimensionsLocked ? '🔒' : '🔓'}</span>
                    <span>{isAllDimensionsLocked ? 'Locked' : 'Lock All'}</span>
                </button>
            </div>
        </div>

        {/* Floating Bottom Right Controls */}
        <div className="floating-bottom-bar" style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000 }}>
            {/* Camera Preset Fast Cycling Pill */}
            <button
                className="defeat-selector-btn"
                onClick={handleCycleCameraPreset}
                title={`Active Camera: ${CAMERA_PRESETS[simState.current.cameraPresetIndex ?? 0]?.name} — Click to cycle presets (Standard, Giant, Action, Spaceship, etc.)`}
                style={{
                    height: '52px',
                    padding: '0 16px',
                    borderRadius: '26px',
                    background: 'rgba(12, 16, 26, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(0, 255, 204, 0.35)',
                    color: '#e0e8ff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'all 0.3s ease'
                }}
            >
                <span style={{ fontSize: '18px' }}>{CAMERA_PRESETS[simState.current.cameraPresetIndex ?? 0]?.icon || '🎥'}</span>
                <span style={{ color: '#00ffcc', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                    {CAMERA_PRESETS[simState.current.cameraPresetIndex ?? 0]?.name || 'Camera'}
                </span>
            </button>

            {/* Gallery Slide-up Drawer Toggle */}
            <button
                className="defeat-selector-btn"
                onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                title="Open Saved Masterpiece Gallery"
                style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isGalleryOpen ? 'rgba(255, 204, 0, 0.25)' : 'rgba(12, 16, 26, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isGalleryOpen ? '1.5px solid #ffcc00' : '1.5px solid rgba(255, 255, 255, 0.16)',
                    color: isGalleryOpen ? '#ffcc00' : '#e0e8ff',
                    boxShadow: isGalleryOpen ? '0 0 20px rgba(255, 204, 0, 0.35)' : '0 4px 16px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="7" y="3" width="14" height="14" rx="3" opacity="0.4" />
                    <rect x="3" y="7" width="14" height="14" rx="3" fill="rgba(255, 204, 0, 0.12)" />
                    <circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
                    <path d="M3 18l4-4a1 1 0 0 1 1.4 0l4.6 4" />
                </svg>
            </button>

            {/* Auto Mode Advance Button with Radial Timer Ring */}
            <button
                className={`defeat-selector-btn ${isAutoMode ? 'timer-active-pulse' : ''}`}
                onClick={handleNextComposition}
                title={`Auto-cycle active (${countdown}s remaining) — Click to advance immediately to next composition ⏭️`}
                style={{
                    position: 'relative',
                    width: '56px',
                    height: '56px',
                    padding: 0,
                    borderRadius: '50%',
                    background: 'rgba(12, 16, 26, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: 'none',
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
                        stroke={isAutoMode ? '#00ffcc' : 'rgba(255, 255, 255, 0.3)'}
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
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 900,
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            color: 'rgba(255, 255, 255, 0.45)',
                            letterSpacing: '0.5px'
                        }}>
                            HOLD
                        </span>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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

        {/* Unified Swarm Studio Settings Panel */}
        {isSettingsOpen && (
            <div
                className="swarm-settings-panel no-scrollbar"
                style={{
                    position: 'fixed',
                    bottom: '88px',
                    right: '24px',
                    width: 'min(540px, calc(100vw - 32px))',
                    maxHeight: 'calc(100vh - 130px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    background: 'rgba(12, 16, 26, 0.95)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '24px',
                    padding: '20px',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
                    zIndex: 1001,
                    color: '#fff',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    boxSizing: 'border-box'
                }}
            >
                {/* Header Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#00ffcc', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            SWARM CONTROL PANEL
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px', fontWeight: 500 }}>
                            Active: <span style={{ color: '#fff', fontWeight: 700 }}>{activePreset.label}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(false)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '14px', overflowX: 'auto' }}>
                    {[
                        { id: 'topology', label: 'TOPOLOGY' },
                        { id: 'geometry', label: 'GEOMETRY' },
                        { id: 'material', label: 'MATERIAL' },
                        { id: 'lighting', label: 'LIGHTING' },
                        { id: 'camera', label: 'CAMERA' },
                        { id: 'physics', label: 'PHYSICS' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                flex: 1,
                                padding: '8px 2px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 800,
                                letterSpacing: '0.6px',
                                border: 'none',
                                background: activeTab === tab.id ? 'rgba(0, 255, 204, 0.2)' : 'transparent',
                                color: activeTab === tab.id ? '#00ffcc' : 'rgba(255, 255, 255, 0.5)',
                                boxShadow: activeTab === tab.id ? '0 0 12px rgba(0, 255, 204, 0.2)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab 1: Topology Grid (All Formations) */}
                {activeTab === 'topology' && (
                    <div className="topology-grid no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                        {formations.map(f => (
                            <button
                                key={f.id}
                                onClick={() => selectFormation(f.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    background: currentFormation === f.id ? 'rgba(0, 255, 204, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                    border: currentFormation === f.id ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: currentFormation === f.id ? '#00ffcc' : '#fff',
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
                                <div style={{ width: '100%', maxWidth: '100%', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {f.icon} {f.label}
                                </div>
                                <div style={{ width: '100%', maxWidth: '100%', fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {f.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 2: Geometry Grid */}
                {activeTab === 'geometry' && (
                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {shapes.map(s => (
                            <button
                                key={s.id}
                                onClick={() => selectShape(s.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: currentShapeId === s.id ? 'rgba(255, 0, 127, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                    border: currentShapeId === s.id ? '1px solid #ff007f' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: currentShapeId === s.id ? '#ff007f' : '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{s.icon} {s.label}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{s.desc}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 3: Material Aesthetics Grid */}
                {activeTab === 'material' && (
                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {materialOptions.map(m => (
                            <button
                                key={m.id}
                                onClick={() => selectMaterial(m.id)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: currentMaterialId === m.id ? 'rgba(157, 0, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                    border: currentMaterialId === m.id ? '1px solid #9d00ff' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: currentMaterialId === m.id ? '#c084fc' : '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{m.icon} {m.label}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{m.desc}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 4: Studio Lighting Grid */}
                {activeTab === 'lighting' && (
                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                        {LIGHTING_PROFILES.map(lp => (
                            <button
                                key={lp.id}
                                onClick={() => selectLighting(lp.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    background: currentLightingId === lp.id ? 'rgba(255, 204, 0, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                    border: currentLightingId === lp.id ? '1px solid #ffcc00' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: currentLightingId === lp.id ? '#ffcc00' : '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>💡 {lp.label}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                                        Key: {lp.keyColor} • Rim: {lp.rimColor}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: lp.keyColor, border: '1px solid rgba(255,255,255,0.3)' }} />
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: lp.rimColor, border: '1px solid rgba(255,255,255,0.3)' }} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 5: Cinematic Camera Presets Grid */}
                {activeTab === 'camera' && (
                    <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                            Choose an artistic camera vantage or use the quick cycle button on the bottom bar:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px' }}>
                            {CAMERA_PRESETS.map((cp, idx) => {
                                const isSelected = (simState.current.cameraPresetIndex ?? 0) === idx;
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
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#00ffcc' : '#fff' }}>
                                                    {cp.name}
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
                                            color: isSelected ? '#000' : 'rgba(255,255,255,0.4)'
                                        }}>
                                            {isSelected ? 'ACTIVE' : 'SELECT'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab 6: Physics & Population Controls */}
                {activeTab === 'physics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                BOID POPULATION
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
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
                                            transition: 'all 0.2s ease'
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
                                style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        )}
        </>
    );
};

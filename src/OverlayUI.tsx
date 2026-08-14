import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { SimulationState, SPECIES_COLORS, SpeciesAttributes, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, LIGHTING_PROFILES } from './BoidLogic';
import { LikedCreation, getLikedCreations, saveLikedCreation, likeDimension, dislikeDimension, generateProceduralGenome } from './RLEngine';

interface OverlayUIProps {
    simState: React.MutableRefObject<SimulationState>;
    population: number;
    setPopulation: (n: number | ((prev: number) => number)) => void;
    fps: number;
}

export const OverlayUI: React.FC<OverlayUIProps> = ({ simState, population, setPopulation, fps }) => {
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 200);
        return () => clearInterval(interval);
    }, []);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'topology' | 'geometry' | 'material' | 'lighting' | 'physics'>('topology');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Ephemeral Like Bar Visibility state
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
            if (Date.now() - lastUserActivity.current > 12000 && !isSettingsOpen && !isGalleryOpen) {
                setIsLikeBarVisible(false);
            }
        }, 1000);

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
        { id: FormationMode.Serpent, label: 'Serpent Waves', icon: '🐍', desc: 'Undulating 3D snake ribbons' },
        { id: FormationMode.Spiral, label: 'Galactic Spiral', icon: '🌀', desc: 'Swirling 3D spiral vortex' },
        { id: FormationMode.DoubleHelix, label: 'Double Helix', icon: '🧬', desc: 'Rotating DNA macromolecule' },
        { id: FormationMode.TorusKnot, label: 'Torus Knot', icon: '🍩', desc: '3D looped bio-ring' },
        { id: FormationMode.JellyfishPulse, label: 'Jellyfish Pulse', icon: '🪼', desc: 'Deep-sea pulsing jellyfish with tentacles' },
        { id: FormationMode.QuantumAtom, label: 'Quantum Atom', icon: '⚛️', desc: 'Intertwined atomic subshell orbitals' },
        { id: FormationMode.PhoenixWings, label: 'Phoenix Wings', icon: '🪽', desc: 'Soaring 3D biomorphic flapping wings' },
        { id: FormationMode.BlackHoleJet, label: 'Black Hole Jet', icon: '🌌', desc: 'Accretion disk & polar relativistic jets' },
        { id: FormationMode.HourglassVortex, label: 'Hourglass Portal', icon: '⏳', desc: 'Spinning 3D hyperboloid portal' },
        { id: FormationMode.LissajousKnot, label: 'Lissajous Cage', icon: '🔮', desc: 'Harmonic 3D geometric hyper-cage' },
        { id: FormationMode.Tesseract4D, label: '4D Tesseract', icon: '🕸️', desc: '4D hypercube projection in 3D' },
        { id: FormationMode.TornadoFunnel, label: 'Tornado Funnel', icon: '🌪️', desc: 'Dynamic spinning atmospheric vortex' },
        { id: FormationMode.NautilusShell, label: 'Nautilus Shell', icon: '🐚', desc: '3D logarithmic sea shell spiral' },
        { id: FormationMode.BioMushroom, label: 'Bio Mushroom', icon: '🍄', desc: 'Fungal umbrella cap & trailing spores' },
        { id: FormationMode.BeehiveSwarm, label: 'Beehive Lattice', icon: '🐝', desc: 'Hexagonal cellular honeycomb swarm' },
        { id: FormationMode.DodecahedronShield, label: 'Dodecahedron', icon: '💠', desc: '3D Platonic polyhedron mesh' },
        { id: FormationMode.SaturnRings, label: 'Saturn Rings', icon: '🪐', desc: 'Planetary sphere & 35° tilted rings' },
        { id: FormationMode.PulsingHeart, label: 'Pulsing Heart', icon: '🫀', desc: '3D biomorphic cardioid heart chamber' },
        { id: FormationMode.TsunamiWave, label: 'Tsunami Wave', icon: '🌊', desc: 'Surging 3D breaking ocean curl' },
        { id: FormationMode.SupernovaBurst, label: 'Supernova Burst', icon: '🎆', desc: 'Exploding cosmic star shockwaves' },
        { id: FormationMode.CrystalPrism, label: 'Crystal Prism', icon: '💎', desc: 'Birefringent 3D gemstone lattice' },
        { id: FormationMode.VirusCapsid, label: 'Virus Capsid', icon: '🦠', desc: 'Icosahedral protein shell with spikes' },
        { id: FormationMode.PlasmaArc, label: 'Plasma Lightning', icon: '⚡', desc: 'Branching 3D tesla arc coils' },
        { id: FormationMode.CoralReef, label: 'Coral Reef', icon: '🪸', desc: 'Branching 3D fractal coral structure' },
        { id: FormationMode.VolcanicColumn, label: 'Volcanic Plume', icon: '🌋', desc: 'Errupting magma column & ash cloud' },
        { id: FormationMode.AlienMothership, label: 'Alien Mothership', icon: '🛸', desc: 'Saucer disc & tractor beam core' },
        { id: FormationMode.TripleHelix, label: 'Triple Helix', icon: '🧬', desc: 'Tri-strand synthetic genetic helix' },
        { id: FormationMode.FerrisWheel, label: 'Ferris Wheel', icon: '🎡', desc: 'Rotating 3D spoke wheel & outer pods' },
        { id: FormationMode.SpiderWeb, label: 'Spider Web', icon: '🕸️', desc: 'Radial concentric arachnid web matrix' },
        { id: FormationMode.NebulaCloud, label: 'Cosmic Nebula', icon: '🌌', desc: 'Interstellar gas & dust cloud' },
        { id: FormationMode.Procedural, label: 'Infinite Procedural', icon: '✨', desc: 'System-generated algorithmic 3D DNA curve' },
        // --- 14 New Non-Circular / Planar / Dynamic Formations ---
        { id: FormationMode.WireCube, label: 'Wireframe Cube', icon: '🧊', desc: '12 crisp 3D edges of a rotating cube' },
        { id: FormationMode.TreeBranch, label: 'L-System Tree', icon: '🌳', desc: 'Recursive 3D branching trunk & canopy' },
        { id: FormationMode.LightningBolt, label: 'Fractal Lightning', icon: '⚡', desc: 'Stochastic downward jagged arc strike' },
        { id: FormationMode.RiverDelta, label: 'River Delta', icon: '🏞️', desc: 'Planar branching meandering channels' },
        { id: FormationMode.KelvinHelmholtz, label: 'Kelvin-Helmholtz', icon: '🌊', desc: 'Fluid shear layer rolling billow vortices' },
        { id: FormationMode.DNALadder, label: 'DNA Ladder', icon: '🪜', desc: 'Linear vertical rails with cross rungs' },
        { id: FormationMode.StarPolygon, label: 'Star Prism', icon: '⭐', desc: '3D 5-pointed geometric star prism' },
        { id: FormationMode.CollapsingSphere, label: 'Collapsing Sphere', icon: '🕳️', desc: 'Breathing singularity implosion core' },
        { id: FormationMode.BigBangExpansion, label: 'Big Bang Burst', icon: '💥', desc: 'Cosmic explosive radial shockwave shells' },
        { id: FormationMode.GeologicStrata, label: 'Geologic Strata', icon: '🧱', desc: '5 layered horizontal planar sediment sheets' },
        { id: FormationMode.TrefoilKnot, label: 'Trefoil Knot', icon: '🎗️', desc: 'Mathematical canonical (2,3) torus knot' },
        { id: FormationMode.MurmurationFlow, label: 'Murmuration Flow', icon: '🕊️', desc: 'Emergent fluid starling swarm cloud' },
        { id: FormationMode.OuroborosSerpent, label: 'Ouroboros Ring', icon: '🐉', desc: 'Planar serpent swallowing its own tail' },
        { id: FormationMode.DancingRibbon, label: 'Dancing Ribbon', icon: '🎀', desc: 'Twisting undulating 3D kinetic ribbon' }
    ];

    const shapes = [
        { id: -1, label: 'Auto (Mutate Cycle)', icon: '🤖', desc: 'Randomize shape every formation cycle' },
        { id: 0, label: 'Stealth Arrowhead Jet', icon: '🚀', desc: 'Aerodynamic 3-sided low-poly wedge' },
        { id: 1, label: 'Faceted Gemstone', icon: '💎', desc: '8-faced dual-pointed crystal' },
        { id: 2, label: 'Angular Prism Pyramid', icon: '🧊', desc: '4-sided sharp pyramid crystal' },
        { id: 3, label: 'Hex Shield Interceptor', icon: '🛸', desc: '6-sided faceted shield jet' },
        { id: 4, label: 'Swept Delta Wing', icon: '🪽', desc: '4-sided swept-back wing blade' },
        { id: 5, label: 'Dodecahedron Polyhedron', icon: '⚛️', desc: '12-faced hard-edged platonic core' },
        { id: 6, label: 'Tetrahedral Shard', icon: '📐', desc: 'Ultra-sharp 4-faced wedge shard' },
        { id: 7, label: 'Faceted Energy Orb', icon: '🔮', desc: '20-faced low-poly icosahedron' }
    ];

    const materialOptions = [
        { id: -1, label: 'Auto (Mutate Cycle)', icon: '🤖', desc: 'Randomize material every formation cycle' },
        ...MATERIAL_PRESETS
    ];

    const isAutoShape = simState.current.autoShape !== false;
    const isAutoMaterial = simState.current.autoMaterial !== false;
    const currentShapeId = isAutoShape ? -1 : (simState.current.boidShape !== undefined ? Math.abs(simState.current.boidShape) % 8 : 0);
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
            simState.current.autoMaterial = false;
            simState.current.materialPreset = id;
            simState.current.materialSettings = { ...MATERIAL_PRESETS[id].settings };
        }
        setTick(t => t + 1);
        setIsSettingsOpen(false);
    };

    const selectLighting = (id: number) => {
        simState.current.lightingProfileIndex = id;
        simState.current.lightingProfile = LIGHTING_PROFILES[id];
        setTick(t => t + 1);
        setIsSettingsOpen(false);
    };

    const toggleAutoMode = () => {
        simState.current.autoMode = !isAutoMode;
        setTick(t => t + 1);
        showToast(simState.current.autoMode ? 'Auto-Cycle Resumed' : 'Auto-Cycle Paused (Holding)');
    };

    const handleLikeDimension = (dim: 'formation' | 'shape' | 'material' | 'palette' | 'lighting') => {
        let id = 0;
        if (dim === 'formation') id = simState.current.formationMode;
        if (dim === 'shape') id = simState.current.boidShape ?? 0;
        if (dim === 'material') id = simState.current.materialPreset ?? 0;
        if (dim === 'palette') id = simState.current.paletteIndex ?? 0;
        if (dim === 'lighting') id = simState.current.lightingProfileIndex ?? 0;

        likeDimension(dim, id);
        showToast(`+1 ${dim.toUpperCase()} preference saved to Taste Profile!`);
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
            colors: state.speciesColors ? [...state.speciesColors] : [...SPECIES_COLORS],
            genome: state.proceduralGenome
        };

        saveLikedCreation(item);
        showToast(`Masterpiece Snapshot saved to Gallery! ❤️`);
        setTick(t => t + 1);
    };

    const restoreCreation = (creation: LikedCreation) => {
        const state = simState.current;
        state.prevFormationMode = state.formationMode;
        state.prevFormationSeed = state.formationSeed;
        state.formationMode = creation.formationMode as FormationMode;
        state.formationSeed = Math.random() * 10000;
        state.boidShape = creation.boidShape;
        state.autoShape = false;
        state.materialPreset = creation.materialPreset;
        state.autoMaterial = false;
        state.materialSettings = { ...MATERIAL_PRESETS[creation.materialPreset].settings };
        state.paletteIndex = creation.paletteIndex ?? 0;
        state.speciesColors = [...creation.colors];
        if (creation.lightingProfileIndex !== undefined) {
            state.lightingProfileIndex = creation.lightingProfileIndex;
            state.lightingProfile = LIGHTING_PROFILES[creation.lightingProfileIndex];
        }
        if (creation.genome) {
            state.proceduralGenome = creation.genome;
        }
        state.transitionStartTime = state.currentTime || 0;
        state.transitionDuration = 9.0;

        setIsGalleryOpen(false);
        setTick(t => t + 1);
        showToast(`Restored: ${creation.formationLabel}`);
    };

    const activePreset = formations.find(f => f.id === currentFormation) || formations[0];
    const likedList = getLikedCreations();

    return (
        <>
        {/* Floating Toast Message */}
        {toastMessage && <div className="rl-toast">{toastMessage}</div>}

        {/* Ephemeral Granular Like Bar (Center Bottom) */}
        <div
            className="ephemeral-like-bar"
            style={{
                opacity: isLikeBarVisible ? 1 : 0,
                pointerEvents: isLikeBarVisible ? 'auto' : 'none'
            }}
        >
            <button
                className="ephemeral-like-btn"
                onClick={() => handleLikeDimension('palette')}
                title="Like this Color Palette (Biases future colors)"
            >
                <span>🎨</span> Palette
            </button>
            <button
                className="ephemeral-like-btn"
                onClick={() => handleLikeDimension('formation')}
                title="Like this 3D Formation (Biases future shapes)"
            >
                <span>🌀</span> Formation
            </button>
            <button
                className="ephemeral-like-btn"
                onClick={() => handleLikeDimension('lighting')}
                title="Like this Lighting Mood (Biases future lights)"
            >
                <span>💡</span> Lighting
            </button>
            <button
                className="ephemeral-like-btn"
                onClick={() => handleLikeDimension('material')}
                title="Like this Specular Material (Biases future finishes)"
            >
                <span>🔷</span> Material
            </button>
            <button
                className="ephemeral-like-btn"
                onClick={() => handleLikeDimension('shape')}
                title="Like this Boid Shard Shape"
            >
                <span>📐</span> Shape
            </button>
            <button
                className="ephemeral-like-btn"
                onClick={handleSaveFullCreation}
                style={{ background: 'rgba(255, 59, 48, 0.2)', borderColor: '#ff3b30', color: '#ff3b30' }}
                title="Save this entire Masterpiece Snapshot to Gallery"
            >
                <span>❤️</span> Save
            </button>
        </div>

        {/* Floating Bottom Right Controls */}
        <div className="floating-bottom-bar" style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000 }}>
            {/* Gallery Slide-up Drawer Toggle */}
            <button
                className="defeat-selector-btn"
                onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                title="Open Saved Masterpiece Gallery"
                style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isGalleryOpen ? 'rgba(255, 204, 0, 0.3)' : 'rgba(12, 16, 26, 0.85)',
                    border: isGalleryOpen ? '1.5px solid #ffcc00' : '1.5px solid rgba(255, 255, 255, 0.18)',
                    color: isGalleryOpen ? '#ffcc00' : '#ffffff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
            >
                🖼️
            </button>

            {/* Auto Mode Toggle Button */}
            <button
                className={`defeat-selector-btn ${isAutoMode ? 'timer-active-pulse' : ''}`}
                onClick={toggleAutoMode}
                title={isAutoMode ? "Auto-cycle is ACTIVE — Click to Pause & Hold Formation" : "Auto-cycle is PAUSED — Click to Resume"}
                style={{
                    position: 'relative',
                    width: '52px',
                    height: '52px',
                    padding: 0,
                    borderRadius: '50%',
                    background: 'rgba(12, 16, 26, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isAutoMode ? '1.5px solid #00ffcc' : '1.5px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: isAutoMode ? '0 0 20px rgba(0, 255, 204, 0.35)' : '0 4px 16px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease'
                }}
            >
                <span style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: isAutoMode ? '#00ffcc' : 'rgba(255, 255, 255, 0.45)',
                    lineHeight: 1
                }}>
                    {isAutoMode ? 'AUTO' : 'HOLD'}
                </span>
            </button>

            {/* Main Settings Toggle Button */}
            <button
                className="defeat-selector-btn"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                title="Toggle Swarm Studio Settings Panel"
                style={{
                    width: '52px',
                    height: '52px',
                    padding: 0,
                    borderRadius: '50%',
                    fontSize: '20px',
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
                <span>{isSettingsOpen ? '✕' : '⚙️'}</span>
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
                    width: '440px',
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
                    fontFamily: 'Inter, system-ui, sans-serif'
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
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '14px' }}>
                    {[
                        { id: 'topology', label: 'TOPOLOGY' },
                        { id: 'geometry', label: 'GEOMETRY' },
                        { id: 'material', label: 'MATERIAL' },
                        { id: 'lighting', label: 'LIGHTING' },
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
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab 1: Topology Grid (All 45 Formations) */}
                {activeTab === 'topology' && (
                    <div className="topology-grid no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
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
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {f.icon} {f.label}
                                </div>
                                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

                {/* Tab 5: Physics & Population Controls */}
                {activeTab === 'physics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                BOID POPULATION
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {[5000, 10000, 15000, 20000].map(count => (
                                    <button
                                        key={count}
                                        onClick={() => {
                                            setPopulation(count);
                                            setTick(t => t + 1);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 4px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: population === count ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: population === count ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                            color: population === count ? '#00ffcc' : '#fff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {count / 1000}k
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

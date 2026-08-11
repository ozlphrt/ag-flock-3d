import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { SimulationState, SPECIES_COLORS, SpeciesAttributes, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS } from './BoidLogic';
import { LikedCreation, DislikedCreation, getRLPreferences, saveLikedCreation, saveDislikedCreation, isCreationLiked, isCreationDisliked, generateProceduralGenome, sampleRLAttribute } from './RLEngine';

// ... inside OverlayUI component ...

interface OverlayUIProps {
    simState: React.MutableRefObject<SimulationState>;
    population: number;
    setPopulation: (n: number) => void;
    fps: number;
}

// Helper for draggable number input
const DraggableNumber = ({
    value,
    onChange,
    scale = 1,
    min = -Infinity,
    max = Infinity,
    format = (v: number) => v?.toFixed(1) ?? "0.0"
}: {
    value: number,
    onChange: (v: number) => void,
    scale?: number,
    min?: number,
    max?: number,
    format?: (v: number) => string
}) => {
    const startY = useRef<number | null>(null);
    const startVal = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        startY.current = e.clientY;
        startVal.current = value;
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (startY.current === null) return;
        const delta = startY.current - e.clientY;
        const change = delta * scale;
        let newValue = startVal.current + change;
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };

    const handleMouseUp = () => {
        startY.current = null;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <span className="value-control" onMouseDown={handleMouseDown}>
            {format(value)}
        </span>
    );
};

export const OverlayUI: React.FC<OverlayUIProps> = ({ simState, population, setPopulation, fps }) => {
    // Force re-render loop
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 100);
        return () => clearInterval(interval);
    }, []);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFormationOpen, setIsFormationOpen] = useState(false);

    const currentScenario = simState.current.defeatScenario;
    const currentFormation = simState.current.formationMode;

    const scenarios = [
        { id: DefeatScenario.Remove, label: 'Remove Defeated', icon: '❌', desc: 'Species loses defeated boids' }
    ];

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
        { id: FormationMode.Procedural, label: 'Infinite Procedural', icon: '✨', desc: 'System-generated algorithmic 3D DNA curve' }
    ];

    const selectScenario = (id: DefeatScenario) => {
        simState.current.defeatScenario = id;
        setTick(t => t + 1);
        setIsMenuOpen(false);
    };

    const selectFormation = (id: FormationMode) => {
        // Save previous formation state for 100% gradual Ease-In / Ease-Out S-curve target morphing!
        simState.current.prevFormationMode = simState.current.formationMode;
        simState.current.prevFormationSeed = simState.current.formationSeed;

        simState.current.formationMode = id;
        simState.current.formationSeed = Math.random() * 10000;
        simState.current.transitionStartTime = simState.current.currentTime || 0;
        simState.current.transitionDuration = 9.0;

        if (id === FormationMode.Procedural || !simState.current.proceduralGenome) {
            simState.current.proceduralGenome = generateProceduralGenome();
        }

        // Set palette corresponding to preset for smooth 9.0s HSL color morphing
        const paletteIdx = id % COLOR_PALETTES.length;
        simState.current.speciesColors = [...COLOR_PALETTES[paletteIdx]];

        setTick(t => t + 1);
        setIsFormationOpen(false);
    };

    const updateAttribute = (speciesIdx: number, key: keyof SpeciesAttributes, val: number) => {
        if (!simState.current.attributes[speciesIdx]) return;
        simState.current.attributes[speciesIdx][key] = val;
        setTick(t => t + 1);
    };

    const updateInteraction = (r: number, c: number, val: number) => {
        if (!simState.current.interactions[r]) return;
        simState.current.interactions[r][c] = val;
        setTick(t => t + 1);
    };

    // Safe access
    if (!simState.current || !simState.current.attributes || !simState.current.interactions) return null;

    const ATTRIBUTE_ROWS: { label: string, key: keyof SpeciesAttributes, min: number, max: number, scale: number }[] = [
        { label: 'Spd', key: 'maxSpeed', min: 0.1, max: 2.0, scale: 0.01 },
        { label: 'Rng', key: 'perceptionRadius', min: 1.0, max: 50.0, scale: 0.1 },
        { label: 'Sep', key: 'separationWeight', min: 0, max: 10, scale: 0.1 },
        { label: 'Ali', key: 'alignmentWeight', min: 0, max: 10, scale: 0.1 },
        { label: 'Coh', key: 'cohesionWeight', min: 0, max: 10, scale: 0.1 },
    ];

    // Timer state for the top progress bar countdown (xx:xx format)
    const [progress, setProgress] = useState(0);
    const [countdownStr, setCountdownStr] = useState("00:22");
    const [statusLabel, setStatusLabel] = useState("FORMING TOPOLOGY...");

    useEffect(() => {
        const interval = setInterval(() => {
            const state = simState.current;
            if (!state || state.transitionStartTime === undefined) return;

            const now = state.currentTime !== undefined ? state.currentTime : (performance.now() / 1000.0);
            const startTime = state.transitionStartTime;
            const elapsed = Math.max(0.0, now - startTime);
            const totalCycle = 30.0;

            const p = Math.min(1.0, elapsed / totalCycle);
            setProgress(p * 100);

            const remainingSec = Math.max(0, Math.ceil(totalCycle - elapsed));
            const mins = Math.floor(remainingSec / 60);
            const secs = remainingSec % 60;
            const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            setCountdownStr(formatted);

            if (elapsed < 9.0) {
                setStatusLabel("FORMING TOPOLOGY...");
            } else {
                setStatusLabel("HOLDING FORMATION");
            }
        }, 150);

        return () => clearInterval(interval);
    }, [simState]);

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

    const [isShapeOpen, setIsShapeOpen] = useState(false);
    const [isMaterialOpen, setIsMaterialOpen] = useState(false);

    const isAutoShape = simState.current.autoShape !== false;
    const isAutoMaterial = simState.current.autoMaterial !== false;

    const currentShapeId = isAutoShape ? -1 : (simState.current.boidShape !== undefined ? Math.abs(simState.current.boidShape) % 8 : 0);
    const currentMaterialId = isAutoMaterial ? -1 : (simState.current.materialPreset !== undefined ? Math.abs(simState.current.materialPreset) % MATERIAL_PRESETS.length : 0);

    const selectShape = (id: number) => {
        if (id === -1) {
            simState.current.autoShape = true;
        } else {
            simState.current.autoShape = false;
            simState.current.boidShape = id;
        }
        setTick(t => t + 1);
        setIsShapeOpen(false);
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
        setIsMaterialOpen(false);
    };

    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [autoRandomize, setAutoRandomize] = useState<boolean>(true);
    const [countdown, setCountdown] = useState<number>(30);

    useEffect(() => {
        if (!autoRandomize) {
            setCountdown(30);
            return;
        }

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    handleRandomize();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [autoRandomize]);

    const handleRandomize = () => {
        const rnd = (min: number, max: number) => min + Math.random() * (max - min);

        // Save previous state for silky smooth Ease-In/Ease-Out S-curve target morphing!
        simState.current.prevFormationMode = simState.current.formationMode;
        simState.current.prevFormationSeed = simState.current.formationSeed;

        simState.current.formationMode = Math.floor(Math.random() * 31) as FormationMode;
        simState.current.formationSeed = Math.random() * 10000;
        if (simState.current.formationMode === FormationMode.Procedural) {
            simState.current.proceduralGenome = generateProceduralGenome();
        }
        simState.current.transitionStartTime = simState.current.currentTime || 0;
        simState.current.transitionDuration = 9.0;

        // Extreme Color Variety: 50% Curated Master Palettes, 50% Algorithmic HSL Color Wheel Harmony
        let selectedColors: string[];
        if (Math.random() > 0.4) {
            const randomPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
            selectedColors = [...randomPalette];
        } else {
            // Algorithmic HSL Harmony Generator (Triadic / Split-Complementary Color Wheel)
            const baseHue = Math.floor(Math.random() * 360);
            const hueOffsets = [0, 90 + Math.random() * 60, 180 + Math.random() * 40, 270 + Math.random() * 40];
            selectedColors = hueOffsets.map(offset => {
                const h = (baseHue + offset) % 360;
                const s = Math.floor(rnd(45, 85));
                const l = Math.floor(rnd(30, 62));
                return `hsl(${h}, ${s}%, ${l}%)`;
            });
        }
        simState.current.speciesColors = selectedColors;

        setTick(t => t + 1);
    };

    const toggleAutoRandomize = () => {
        const nextState = !autoRandomize;
        setAutoRandomize(nextState);
        if (nextState) {
            handleRandomize();
        }
    };

    const [activeTab, setActiveTab] = useState<'topology' | 'geometry' | 'material' | 'physics'>('topology');

    const activePreset = formations.find(f => f.id === currentFormation) || formations[0];

    return (
        <>
        {/* Floating Bottom Right Controls */}
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000 }}>
            {/* Auto Randomize (30s) Timer Toggle Button */}
            <button
                className="defeat-selector-btn"
                onClick={toggleAutoRandomize}
                title={autoRandomize ? `Auto-cycle active (${countdown}s remaining) - Click to Pause` : "Auto-cycle paused - Click to Resume"}
                style={{
                    padding: '8px 20px',
                    borderRadius: '30px',
                    fontSize: '17px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    background: autoRandomize ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                    border: autoRandomize ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: autoRandomize ? '#34d399' : 'rgba(255, 255, 255, 0.45)',
                    boxShadow: autoRandomize ? '0 0 18px rgba(16, 185, 129, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                <span>{autoRandomize ? `${countdown}` : 'PAUSED'}</span>
            </button>

            {/* Main Settings Toggle Button (Icon Only) */}
            <button
                className="defeat-selector-btn"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                title="Toggle Swarm Studio Settings Panel"
                style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    borderRadius: '50%',
                    fontSize: '17px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSettingsOpen ? 'rgba(0, 255, 204, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    border: isSettingsOpen ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: isSettingsOpen ? '#00ffcc' : '#ffffff',
                    boxShadow: isSettingsOpen ? '0 0 20px rgba(0, 255, 204, 0.35)' : 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
            >
                <span style={{ fontSize: '17px', lineHeight: 1 }}>{isSettingsOpen ? '✕' : '⚙️'}</span>
            </button>
        </div>

        {/* Unified Swarm Studio Settings Panel (Minimalist Architectural Design) */}
        {isSettingsOpen && (
            <div
                className="no-scrollbar"
                style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '24px',
                    width: '420px',
                    maxHeight: 'calc(100vh - 120px)',
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

                {/* Navigation Tabs (Minimalist Typography, No Icons) */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '14px' }}>
                    {[
                        { id: 'topology', label: 'TOPOLOGY' },
                        { id: 'geometry', label: 'GEOMETRY' },
                        { id: 'material', label: 'MATERIAL' },
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
                                letterSpacing: '0.8px',
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

                {/* Tab 1: Topology Grid (No Icons, No Scrollbars) */}
                {activeTab === 'topology' && (
                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }}>
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
                                <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.desc}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 2: Geometry Grid (No Icons, No Scrollbars) */}
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
                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{s.label}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{s.desc}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 3: Material Aesthetics Grid (No Icons, No Scrollbars) */}
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
                                <div style={{ fontSize: '12px', fontWeight: 700 }}>{m.label}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>{m.desc}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab 4: Physics & Population Controls */}
                {activeTab === 'physics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Population Selector */}
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                BOID POPULATION
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {[5000, 10000, 15000, 20000].map(count => (
                                    <button
                                        key={count}
                                        onClick={() => {
                                            simState.current.targetPopulation = count;
                                            setTick(t => t + 1);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '8px 4px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: (simState.current.targetPopulation || 20000) === count ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: (simState.current.targetPopulation || 20000) === count ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                            color: (simState.current.targetPopulation || 20000) === count ? '#00ffcc' : '#fff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {count / 1000}k
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Speed Multiplier Slider */}
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

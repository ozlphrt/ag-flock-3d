import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
    SimulationState,
    FormationMode,
    SPECIES_COLORS
} from './BoidLogic';
import {
    PreferenceLearningEngine,
    LearnPair,
    TasteProfile,
    BASELINE_LEARN_STATE
} from './PreferenceLearningEngine';
import { Flock } from './Flock';
import { GPGPUFlock } from './GPGPUFlock';

interface LearnArenaProps {
    mainState: React.MutableRefObject<SimulationState>;
    onClose: () => void;
}

// Synchronized Camera Rig for Dual Viewports (Flicker-Free Smooth Camera Sync)
function SyncCameraRig({
    cameraSyncPos,
    cameraSyncTarget,
    isMaster
}: {
    cameraSyncPos: React.MutableRefObject<THREE.Vector3>;
    cameraSyncTarget: React.MutableRefObject<THREE.Vector3>;
    isMaster: boolean;
}) {
    const controlsRef = useRef<any>(null);

    useFrame((stateContext) => {
        if (isMaster) {
            cameraSyncPos.current.copy(stateContext.camera.position);
            if (controlsRef.current) {
                cameraSyncTarget.current.copy(controlsRef.current.target);
            }
        } else {
            stateContext.camera.position.lerp(cameraSyncPos.current, 0.25);
            stateContext.camera.lookAt(cameraSyncTarget.current);
            if (controlsRef.current) {
                controlsRef.current.target.lerp(cameraSyncTarget.current, 0.25);
            }
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault fov={52} position={[0, 3.5, 14.0]} near={0.25} far={1000} />
            <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.08}
                autoRotate={false}
                minDistance={3.5}
                maxDistance={250}
            />
        </>
    );
}

// Dynamic Lighting for Learn Candidate Viewport with instant per-frame parameter sync
function CandidateLighting({ state }: { state: SimulationState }) {
    const keyRef = useRef<THREE.DirectionalLight>(null);
    const fillRef = useRef<THREE.DirectionalLight>(null);
    const rimRef = useRef<THREE.DirectionalLight>(null);
    const ambRef = useRef<THREE.AmbientLight>(null);

    useFrame(() => {
        const profile = state.lightingProfile;
        if (!profile) return;
        if (keyRef.current) {
            keyRef.current.intensity = profile.keyIntensity ?? 3.8;
            keyRef.current.color.set(profile.keyColor ?? '#ffffff');
        }
        if (fillRef.current) {
            fillRef.current.intensity = profile.fillIntensity ?? 0.65;
            fillRef.current.color.set(profile.fillColor ?? '#d8e8f8');
        }
        if (rimRef.current) {
            rimRef.current.intensity = profile.rimIntensity ?? 2.8;
            rimRef.current.color.set(profile.rimColor ?? '#ffa040');
        }
        if (ambRef.current) {
            ambRef.current.intensity = profile.ambientIntensity ?? 0.35;
        }
    });

    return (
        <>
            <directionalLight ref={keyRef} position={[35, 45, 30]} />
            <directionalLight ref={fillRef} position={[-40, 25, -25]} />
            <directionalLight ref={rimRef} position={[0, 50, -45]} />
            <ambientLight ref={ambRef} color="#f4f8ff" />
            <hemisphereLight args={['#ffffff', '#1a2234', 0.35]} />
        </>
    );
}

export const LearnArena: React.FC<LearnArenaProps> = ({ mainState, onClose }) => {
    const engine = useMemo(() => new PreferenceLearningEngine(), []);
    const [currentPair, setCurrentPair] = useState<LearnPair>(() => engine.generateNextPair(mainState.current));
    const [tasteProfile, setTasteProfile] = useState<TasteProfile>(() => engine.getProfile());
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [lastChoice, setLastChoice] = useState<'A' | 'B' | null>(null);

    // Pause main background canvas loop while in Learn Arena to free 100% GPU bandwidth & eliminate flicker
    useEffect(() => {
        mainState.current.isArenaOpen = true;
        return () => {
            mainState.current.isArenaOpen = false;
        };
    }, [mainState]);

    // Shared Camera Transform Sync
    const cameraSyncPos = useRef(new THREE.Vector3(0, 3.5, 14.0));
    const cameraSyncTarget = useRef(new THREE.Vector3(0, 0, 0));

    // Calculate split-screen population (500k -> 250k per side, 250k -> 125k per side, 50k -> 25k per side)
    const totalMainPop = mainState.current.population || 50000;
    const candidateBoidsCount = Math.min(35000, Math.max(20000, Math.floor(totalMainPop / 2)));

    // Create Candidate Simulation States with 100% Controlled Baseline
    const stateA = useRef<SimulationState>({
        ...mainState.current,
        ...BASELINE_LEARN_STATE,
        autoMode: false,
        isFormationLocked: true,
        isPaletteLocked: true,
        isMaterialLocked: true,
        isLightingLocked: true,
        isBloomLocked: true,
        ...currentPair.candidateA.state
    } as SimulationState);

    const stateB = useRef<SimulationState>({
        ...mainState.current,
        ...BASELINE_LEARN_STATE,
        autoMode: false,
        isFormationLocked: true,
        isPaletteLocked: true,
        isMaterialLocked: true,
        isLightingLocked: true,
        isBloomLocked: true,
        ...currentPair.candidateB.state
    } as SimulationState);

    // Smooth Fast In-Place State Mutation on Pair Change
    useEffect(() => {
        const updateCandidate = (target: SimulationState, candState: Partial<SimulationState>) => {
            // Apply baseline + cumulative learned preferences so far
            Object.assign(target, BASELINE_LEARN_STATE);
            engine.applyToState(target);

            target.autoMode = false;
            target.isFormationLocked = true;
            target.isPaletteLocked = true;
            target.isMaterialLocked = true;
            target.isLightingLocked = true;
            target.isBloomLocked = true;

            // Ultra-snappy 0.12s fast formation & palette morph transition
            target.transitionDuration = 0.12;
            target.paletteTransitionDuration = 0.12;

            // Apply candidate target parameter (explicitly override candidate formation)
            if (candState.formationMode !== undefined) {
                if (candState.formationMode !== target.formationMode) {
                    target.prevFormationMode = target.formationMode;
                    target.formationMode = candState.formationMode;
                    target.transitionStartTime = target.currentTime || 0;
                }
            }
            if (candState.materialSettings) target.materialSettings = { ...candState.materialSettings };
            if (candState.lightingProfile) target.lightingProfile = { ...candState.lightingProfile };
            if (candState.speciesColors) target.speciesColors = [...candState.speciesColors];
            if (candState.speedMultiplier !== undefined) target.speedMultiplier = candState.speedMultiplier;
            if (candState.noiseTurbulence !== undefined) target.noiseTurbulence = candState.noiseTurbulence;
            if (candState.bloomSettings) target.bloomSettings = { ...candState.bloomSettings };
            if (candState.bounds !== undefined) target.bounds = candState.bounds;
            if (candState.sizeMultiplier !== undefined) target.sizeMultiplier = candState.sizeMultiplier;
        };

        updateCandidate(stateA.current, currentPair.candidateA.state);
        updateCandidate(stateB.current, currentPair.candidateB.state);
    }, [currentPair, engine]);

    const handlePick = (choice: 'A' | 'B') => {
        setLastChoice(choice);
        const newProfile = engine.recordVote(currentPair, choice);
        setTasteProfile(newProfile);

        setTimeout(() => {
            setLastChoice(null);
            const next = engine.generateNextPair(mainState.current);
            setCurrentPair(next);
        }, 90);
    };

    const handleApplyToSwarm = () => {
        engine.applyToState(mainState.current);
        onClose();
    };

    // Keyboard Shortcuts: [A / LeftArrow] -> A, [B / RightArrow] -> B, [Esc] -> Close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                handlePick('A');
            } else if (e.key === 'ArrowRight' || e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                handlePick('B');
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPair]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#05070c',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#fff',
            userSelect: 'none'
        }}>
            {/* Pristine High-Legibility Top Bar */}
            <div style={{
                height: '72px',
                background: 'rgba(8, 10, 16, 0.96)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 28px',
                zIndex: 10
            }}>
                {/* Left: Engine & Round Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#8899ac', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Aesthetic Ranking
                    </span>
                    <span style={{
                        fontSize: '12px',
                        background: 'rgba(255, 255, 255, 0.10)',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontWeight: 700
                    }}>
                        Round {currentPair.round}
                    </span>
                </div>

                {/* Center: MUCH LARGER, UNMISTAKABLE VOTING LABEL & STAGE BADGE */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            background: '#ffffff',
                            color: '#05070c',
                            padding: '4px 18px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 900,
                            letterSpacing: '0.06em',
                            boxShadow: '0 0 25px rgba(255,255,255,0.35)'
                        }}>
                            {currentPair.dimension === 'lighting' ? '💡 STUDIO LIGHTING' :
                             currentPair.dimension === 'material' ? '✨ SURFACE MATERIAL' :
                             currentPair.dimension === 'topology' ? '🧬 3D TOPOLOGY' :
                             currentPair.dimension === 'helixDynamics' ? '⚡ FLOW SPEED' :
                             currentPair.dimension === 'palette' ? '🎨 COLOR PALETTE' : '🌟 BLOOM GLOW'}
                        </span>
                        <span style={{
                            background: currentPair.stageLabel.includes('FINE-TUNING') ? 'rgba(255, 170, 0, 0.20)' :
                                        currentPair.stageLabel.includes('VALIDATION') ? 'rgba(0, 229, 255, 0.20)' :
                                        currentPair.stageLabel.includes('CHAMPIONSHIP') ? 'rgba(255, 75, 150, 0.20)' : 'rgba(255, 255, 255, 0.12)',
                            color: currentPair.stageLabel.includes('FINE-TUNING') ? '#ffbb33' :
                                   currentPair.stageLabel.includes('VALIDATION') ? '#00e5ff' :
                                   currentPair.stageLabel.includes('CHAMPIONSHIP') ? '#ff66aa' : '#e2e8f0',
                            border: `1px solid ${
                                currentPair.stageLabel.includes('FINE-TUNING') ? 'rgba(255, 170, 0, 0.40)' :
                                currentPair.stageLabel.includes('VALIDATION') ? 'rgba(0, 229, 255, 0.40)' :
                                currentPair.stageLabel.includes('CHAMPIONSHIP') ? 'rgba(255, 75, 150, 0.40)' : 'rgba(255, 255, 255, 0.20)'
                            }`,
                            padding: '3px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.06em'
                        }}>
                            {currentPair.stageLabel}
                        </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                        {currentPair.question}
                    </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            color: '#e2e8f0',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        📊 DNA Profile ({tasteProfile.totalRounds})
                    </button>

                    <button
                        onClick={handleApplyToSwarm}
                        style={{
                            background: '#ffffff',
                            border: 'none',
                            color: '#000000',
                            borderRadius: '8px',
                            padding: '7px 16px',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 2px 12px rgba(255,255,255,0.25)'
                        }}
                    >
                        ✨ Apply
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#8899ac',
                            borderRadius: '8px',
                            padding: '7px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Dual Split-Screen Viewport Arena */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
                {/* Left Side: Option A */}
                <div
                    onClick={() => handlePick('A')}
                    style={{
                        flex: 1,
                        position: 'relative',
                        borderRight: '1px solid rgba(255, 255, 255, 0.10)',
                        cursor: 'pointer'
                    }}
                >
                    <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }}>
                        <color attach="background" args={['#05070c']} />
                        <SyncCameraRig cameraSyncPos={cameraSyncPos} cameraSyncTarget={cameraSyncTarget} isMaster={true} />
                        <CandidateLighting state={stateA.current} />
                        <Flock count={candidateBoidsCount} state={stateA.current} setPopulation={() => {}} />
                    </Canvas>

                    {/* Option A MUCH LARGER & SUCCINCT CARD */}
                    <div style={{
                        position: 'absolute',
                        bottom: '36px',
                        left: '36px',
                        right: '36px',
                        background: lastChoice === 'A' ? 'rgba(0, 229, 255, 0.20)' : 'rgba(8, 12, 20, 0.90)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: lastChoice === 'A' ? '2px solid #00e5ff' : '1.5px solid rgba(255, 255, 255, 0.20)',
                        borderRadius: '16px',
                        padding: '18px 24px',
                        boxShadow: lastChoice === 'A' ? '0 0 35px rgba(0,229,255,0.4)' : '0 20px 50px rgba(0,0,0,0.85)',
                        transition: 'all 0.15s ease',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                                [A] {currentPair.candidateA.title}
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                letterSpacing: '0.05em'
                            }}>
                                PRESS [A] OR [←]
                            </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.45', fontWeight: 500 }}>
                            {currentPair.candidateA.description}
                        </div>
                    </div>
                </div>

                {/* Clean Center Divider "VS" */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#090d16',
                    border: '1.5px solid rgba(255, 255, 255, 0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#94a3b8',
                    letterSpacing: '0.06em',
                    zIndex: 10,
                    boxShadow: '0 0 24px rgba(0,0,0,0.9)'
                }}>
                    VS
                </div>

                {/* Right Side: Option B */}
                <div
                    onClick={() => handlePick('B')}
                    style={{
                        flex: 1,
                        position: 'relative',
                        cursor: 'pointer'
                    }}
                >
                    <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }}>
                        <color attach="background" args={['#05070c']} />
                        <SyncCameraRig cameraSyncPos={cameraSyncPos} cameraSyncTarget={cameraSyncTarget} isMaster={false} />
                        <CandidateLighting state={stateB.current} />
                        <Flock count={candidateBoidsCount} state={stateB.current} setPopulation={() => {}} />
                    </Canvas>

                    {/* Option B MUCH LARGER & SUCCINCT CARD */}
                    <div style={{
                        position: 'absolute',
                        bottom: '36px',
                        left: '36px',
                        right: '36px',
                        background: lastChoice === 'B' ? 'rgba(0, 229, 255, 0.20)' : 'rgba(8, 12, 20, 0.90)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: lastChoice === 'B' ? '2px solid #00e5ff' : '1.5px solid rgba(255, 255, 255, 0.20)',
                        borderRadius: '16px',
                        padding: '18px 24px',
                        boxShadow: lastChoice === 'B' ? '0 0 35px rgba(0,229,255,0.4)' : '0 20px 50px rgba(0,0,0,0.85)',
                        transition: 'all 0.15s ease',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
                                [B] {currentPair.candidateB.title}
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                letterSpacing: '0.05em'
                            }}>
                                PRESS [B] OR [→]
                            </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.45', fontWeight: 500 }}>
                            {currentPair.candidateB.description}
                        </div>
                    </div>
                </div>
            </div>

            {/* Real-Time Taste Profile Modal */}
            {isProfileModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(24px)',
                    zIndex: 1000000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        width: '580px',
                        maxHeight: '85vh',
                        background: '#0d1322',
                        border: '1.5px solid rgba(47, 161, 214, 0.4)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 30px rgba(47,161,214,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '22px' }}>🧬</span>
                                <span style={{ fontSize: '17px', fontWeight: 900, color: '#fff' }}>Your Learned Aesthetic DNA</span>
                                <span style={{
                                    background: 'rgba(0, 245, 212, 0.15)',
                                    color: '#00f5d4',
                                    border: '1px solid rgba(0, 245, 212, 0.4)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 800
                                }}>
                                    🎯 {tasteProfile.overallConsistency}% Consistency
                                </span>
                            </div>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#8899ac', fontSize: '18px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Summary Feedback */}
                        <div style={{
                            background: 'rgba(47, 161, 214, 0.10)',
                            border: '1px solid rgba(47, 161, 214, 0.3)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: '#e2e8f0',
                            lineHeight: '1.5'
                        }}>
                            {tasteProfile.summaryText}
                        </div>

                        {/* Parameter Affinity Radar Bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tasteProfile.insights.map(ins => (
                                <div key={ins.dimension} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#fff' }}>{ins.label}:</span>
                                            <span style={{ color: '#2FA1D6' }}>{ins.preferredStyle}</span>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 800,
                                                background: ins.status === 'confirmed' ? 'rgba(0, 245, 212, 0.15)' : ins.status === 'reinforcing' ? 'rgba(47, 161, 214, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                                color: ins.status === 'confirmed' ? '#00f5d4' : ins.status === 'reinforcing' ? '#2FA1D6' : '#8899ac',
                                                border: `1px solid ${ins.status === 'confirmed' ? 'rgba(0, 245, 212, 0.4)' : ins.status === 'reinforcing' ? 'rgba(47, 161, 214, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`
                                            }}>
                                                {ins.status === 'confirmed' ? 'Confirmed ✓ (3/3)' : ins.status === 'reinforcing' ? `Reinforcing (${ins.trials}/3)` : 'Exploring (0/3)'}
                                            </span>
                                        </div>
                                        <span style={{ color: '#00e5ff', fontSize: '11px' }}>{ins.affinityScore}% affinity • {ins.consistencyScore}% consistent</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                                        <div style={{ height: '100%', width: `${ins.affinityScore}%`, background: ins.status === 'confirmed' ? 'linear-gradient(90deg, #00f5d4, #00bbf9)' : 'linear-gradient(90deg, #2FA1D6, #00e5ff)', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8899ac', marginBottom: ins.anglesTested.length > 0 ? '6px' : '0' }}>{ins.description}</div>
                                    {ins.anglesTested.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                            {ins.anglesTested.map((ang, idx) => (
                                                <span key={idx} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '1px 5px', borderRadius: '3px' }}>
                                                    ✓ {ang}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={handleApplyToSwarm}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ff6820, #ff9f1c)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    padding: '10px',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(255,104,32,0.4)'
                                }}
                            >
                                ✨ Apply Learned Profile to Live Swarm
                            </button>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    padding: '10px 18px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Continue Learning
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

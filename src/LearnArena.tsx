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
    TasteProfile
} from './PreferenceLearningEngine';
import { Flock } from './Flock';

interface LearnArenaProps {
    mainState: React.MutableRefObject<SimulationState>;
    onClose: () => void;
}

// Synchronized Camera Rig for Dual Viewports
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
            stateContext.camera.position.copy(cameraSyncPos.current);
            stateContext.camera.lookAt(cameraSyncTarget.current);
            if (controlsRef.current) {
                controlsRef.current.target.copy(cameraSyncTarget.current);
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

// Dynamic Lighting for Learn Candidate Viewport
function CandidateLighting({ state }: { state: SimulationState }) {
    const profile = state.lightingProfile;
    return (
        <>
            <directionalLight
                position={[35, 45, 30]}
                intensity={profile?.keyIntensity ?? 3.8}
                color={profile?.keyColor ?? '#ffffff'}
            />
            <directionalLight
                position={[-40, 25, -25]}
                intensity={profile?.fillIntensity ?? 0.65}
                color={profile?.fillColor ?? '#d8e8f8'}
            />
            <directionalLight
                position={[0, 50, -45]}
                intensity={profile?.rimIntensity ?? 2.8}
                color={profile?.rimColor ?? '#ffa040'}
            />
            <ambientLight intensity={profile?.ambientIntensity ?? 0.35} color="#f4f8ff" />
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

    // Shared Camera Transform Sync
    const cameraSyncPos = useRef(new THREE.Vector3(0, 3.5, 14.0));
    const cameraSyncTarget = useRef(new THREE.Vector3(0, 0, 0));

    // Create Candidate Simulation States
    const stateA = useRef<SimulationState>({
        ...mainState.current,
        bounds: 35,
        speedMultiplier: 0.16,
        sizeMultiplier: 1.8,
        noiseTurbulence: 0.02,
        materialSettings: { ...mainState.current.materialSettings },
        lightingProfile: { ...mainState.current.lightingProfile } as any,
        speciesColors: [...(mainState.current.speciesColors || SPECIES_COLORS)],
        ...currentPair.candidateA.state
    } as SimulationState);

    const stateB = useRef<SimulationState>({
        ...mainState.current,
        bounds: 35,
        speedMultiplier: 0.16,
        sizeMultiplier: 1.8,
        noiseTurbulence: 0.02,
        materialSettings: { ...mainState.current.materialSettings },
        lightingProfile: { ...mainState.current.lightingProfile } as any,
        speciesColors: [...(mainState.current.speciesColors || SPECIES_COLORS)],
        ...currentPair.candidateB.state
    } as SimulationState);

    // Update candidate states on pair change
    useEffect(() => {
        stateA.current = {
            ...mainState.current,
            bounds: 35,
            speedMultiplier: 0.16,
            sizeMultiplier: 1.8,
            noiseTurbulence: 0.02,
            materialSettings: { ...mainState.current.materialSettings },
            lightingProfile: { ...mainState.current.lightingProfile } as any,
            speciesColors: [...(mainState.current.speciesColors || SPECIES_COLORS)],
            ...currentPair.candidateA.state
        } as SimulationState;
        stateB.current = {
            ...mainState.current,
            bounds: 35,
            speedMultiplier: 0.16,
            sizeMultiplier: 1.8,
            noiseTurbulence: 0.02,
            materialSettings: { ...mainState.current.materialSettings },
            lightingProfile: { ...mainState.current.lightingProfile } as any,
            speciesColors: [...(mainState.current.speciesColors || SPECIES_COLORS)],
            ...currentPair.candidateB.state
        } as SimulationState;
    }, [currentPair, mainState]);

    const handlePick = (choice: 'A' | 'B') => {
        setLastChoice(choice);
        const newProfile = engine.recordVote(currentPair, choice);
        setTasteProfile(newProfile);

        setTimeout(() => {
            setLastChoice(null);
            const next = engine.generateNextPair(mainState.current);
            setCurrentPair(next);
        }, 320);
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

    const candidateBoidsCount = 20000;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#070b14',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#fff',
            userSelect: 'none'
        }}>
            {/* Top Navigation Bar */}
            <div style={{
                height: '52px',
                background: 'rgba(10, 14, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '20px' }}>🧠</span>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '0.04em', color: '#fff' }}>
                            Aesthetic Evolution Engine
                        </div>
                        <div style={{ fontSize: '11px', color: '#8899ac' }}>
                            Round {currentPair.round} • Testing: <span style={{ color: '#2FA1D6', fontWeight: 700 }}>{currentPair.dimensionLabel}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        style={{
                            background: 'rgba(47, 161, 214, 0.18)',
                            border: '1.5px solid #2FA1D6',
                            color: '#2FA1D6',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📊 View Taste Profile ({tasteProfile.totalRounds} votes)
                    </button>

                    <button
                        onClick={handleApplyToSwarm}
                        style={{
                            background: 'linear-gradient(135deg, #ff6820, #ff9f1c)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '6px 16px',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(255,104,32,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        ✨ Apply to Swarm
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        ✕ Exit
                    </button>
                </div>
            </div>

            {/* Sub-Header Question Banner */}
            <div style={{
                background: 'rgba(15, 22, 38, 0.90)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '8px 20px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 600,
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}>
                <span style={{ color: '#ff6820' }}>⚖️</span>
                <span>{currentPair.question}</span>
            </div>

            {/* Dual Split-Screen Viewport Arena */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
                {/* Left Side: Option A */}
                <div
                    onClick={() => handlePick('A')}
                    style={{
                        flex: 1,
                        position: 'relative',
                        borderRight: '2px solid rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        background: lastChoice === 'A' ? 'rgba(47, 161, 214, 0.15)' : 'transparent',
                        transition: 'background 0.2s ease'
                    }}
                >
                    <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }}>
                        <color attach="background" args={['#070b14']} />
                        <SyncCameraRig cameraSyncPos={cameraSyncPos} cameraSyncTarget={cameraSyncTarget} isMaster={true} />
                        <CandidateLighting state={stateA.current} />
                        <Flock count={candidateBoidsCount} state={stateA.current} setPopulation={() => {}} />
                    </Canvas>

                    {/* Option A Badge & Description Card */}
                    <div style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '24px',
                        right: '24px',
                        background: 'rgba(10, 15, 28, 0.92)',
                        backdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(47, 161, 214, 0.4)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{
                                background: '#2FA1D6',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '12px',
                                padding: '3px 8px',
                                borderRadius: '6px'
                            }}>
                                OPTION A (← or Key A)
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#2FA1D6' }}>
                                {currentPair.candidateA.title}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                            {currentPair.candidateA.description}
                        </div>
                    </div>
                </div>

                {/* Center Divider Line */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#0f172a',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#ff6820',
                    zIndex: 10,
                    boxShadow: '0 0 20px rgba(0,0,0,0.8)'
                }}>
                    VS
                </div>

                {/* Right Side: Option B */}
                <div
                    onClick={() => handlePick('B')}
                    style={{
                        flex: 1,
                        position: 'relative',
                        cursor: 'pointer',
                        background: lastChoice === 'B' ? 'rgba(255, 104, 32, 0.15)' : 'transparent',
                        transition: 'background 0.2s ease'
                    }}
                >
                    <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }}>
                        <color attach="background" args={['#070b14']} />
                        <SyncCameraRig cameraSyncPos={cameraSyncPos} cameraSyncTarget={cameraSyncTarget} isMaster={false} />
                        <CandidateLighting state={stateB.current} />
                        <Flock count={candidateBoidsCount} state={stateB.current} setPopulation={() => {}} />
                    </Canvas>

                    {/* Option B Badge & Description Card */}
                    <div style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '24px',
                        right: '24px',
                        background: 'rgba(10, 15, 28, 0.92)',
                        backdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(255, 104, 32, 0.4)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{
                                background: '#ff6820',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '12px',
                                padding: '3px 8px',
                                borderRadius: '6px'
                            }}>
                                OPTION B (→ or Key B)
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ff6820' }}>
                                {currentPair.candidateB.title}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '22px' }}>🧬</span>
                                <span style={{ fontSize: '17px', fontWeight: 900, color: '#fff' }}>Your Learned Aesthetic DNA</span>
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
                                <div key={ins.dimension} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
                                        <span style={{ color: '#fff' }}>{ins.label}: <span style={{ color: '#2FA1D6' }}>{ins.preferredStyle}</span></span>
                                        <span style={{ color: '#00e5ff' }}>{ins.affinityScore}% affinity</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                                        <div style={{ height: '100%', width: `${ins.affinityScore}%`, background: 'linear-gradient(90deg, #2FA1D6, #00e5ff)', borderRadius: '3px' }} />
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8899ac' }}>{ins.description}</div>
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

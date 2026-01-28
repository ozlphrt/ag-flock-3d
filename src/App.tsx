import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Html } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useState, useRef } from 'react'
import { Flock } from './Flock'
import { SpeciesAttributes, SimulationState } from './BoidLogic'
import { OverlayUI } from './OverlayUI'

const INITIAL_ATTRIBUTES: SpeciesAttributes = {
    separationWeight: 1.0,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    maxSpeed: 0.5,
    maxForce: 0.01,
    perceptionRadius: 5.0
};

// 4 Species with slightly different traits
const SPECIES_CONFIG: SpeciesAttributes[] = [
    { ...INITIAL_ATTRIBUTES, maxSpeed: 0.6, perceptionRadius: 6.0 }, // Red (Hunter)
    { ...INITIAL_ATTRIBUTES, maxSpeed: 0.5, perceptionRadius: 5.0 }, // Green
    { ...INITIAL_ATTRIBUTES, maxSpeed: 0.4, perceptionRadius: 4.0 }, // Blue
    { ...INITIAL_ATTRIBUTES, maxSpeed: 0.55, perceptionRadius: 5.5 } // Yellow
];

// Initial Matrix: All 0 (neutral) except some presets if desired
const INITIAL_MATRIX = [
    [0, 0, 0, 0], // Red
    [0, 0, 0, 0], // Green
    [0, 0, 0, 0], // Blue
    [0, 0, 0, 0]  // Yellow
];

function FPSStats() {
    const [fps, setFps] = useState(0)
    const frames = useRef(0)
    const prevTime = useRef(performance.now())

    useFrame(() => {
        frames.current++
        const time = performance.now()
        if (time >= prevTime.current + 1000) {
            setFps(Math.round((frames.current * 1000) / (time - prevTime.current)))
            prevTime.current = time
            frames.current = 0
        }
    })

    return (
        <Html
            fullscreen
            style={{
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.5)',
                color: '#00ffcc',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                border: '1px solid rgba(0,255,204,0.3)'
            }}>
                FPS: {fps}
            </div>
        </Html>
    )
}

function App() {
    const [population, setPopulation] = useState(500)

    // We use a ref for state to communicate with the loop without re-rendering everything constantly
    const simState = useRef<SimulationState>({
        attributes: SPECIES_CONFIG,
        interactions: INITIAL_MATRIX,
        bounds: 50,
        speedMultiplier: 1.0
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} />
            <Canvas shadows gl={{ antialias: false }}>
                <color attach="background" args={['#050505']} />
                <PerspectiveCamera makeDefault position={[120, 120, 120]} />
                <OrbitControls makeDefault />

                <FPSStats />

                <ambientLight intensity={0.5} />
                <pointLight position={[100, 100, 100]} castShadow intensity={1000} />
                <pointLight position={[-100, -100, -100]} color="#00ffff" intensity={500} />

                <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Flock count={population} state={simState.current} />

                <gridHelper args={[100, 20, 0x333333, 0x222222]} position={[0, -50, 0]} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.5} mipmapBlur intensity={0.5} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}

export default App

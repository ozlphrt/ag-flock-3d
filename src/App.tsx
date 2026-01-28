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

function FPSUpdater({ onChange }: { onChange: (fps: number) => void }) {
    const frames = useRef(0)
    const prevTime = useRef(performance.now())

    useFrame(() => {
        frames.current++
        const time = performance.now()
        if (time >= prevTime.current + 1000) {
            onChange(Math.round((frames.current * 1000) / (time - prevTime.current)))
            prevTime.current = time
            frames.current = 0
        }
    })
    return null
}

function App() {
    const [population, setPopulation] = useState(500)
    const [fps, setFps] = useState(0)

    // We use a ref for state to communicate with the loop without re-rendering everything constantly
    const simState = useRef<SimulationState>({
        attributes: SPECIES_CONFIG,
        interactions: INITIAL_MATRIX,
        bounds: 50,
        speedMultiplier: 0.6,
        sizeMultiplier: 1.5
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} fps={fps} />
            <Canvas shadows gl={{ antialias: false }}>
                <color attach="background" args={['#050505']} />
                <PerspectiveCamera makeDefault position={[120, 120, 120]} />
                <OrbitControls makeDefault />

                <FPSUpdater onChange={setFps} />

                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[50, 100, 50]}
                    intensity={2.0}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <pointLight position={[-100, -100, -100]} color="#00ffff" intensity={200} />


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

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Html, Environment } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useState, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Flock } from './Flock'
import { SpeciesAttributes, SimulationState, DefeatScenario, FormationMode, COLOR_PALETTES } from './BoidLogic'
import { OverlayUI } from './OverlayUI'
import { getRLPreferences, sampleRLAttribute, generateProceduralGenome } from './RLEngine'

const INITIAL_ATTRIBUTES: SpeciesAttributes = {
    separationWeight: 3.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    maxSpeed: 0.5,
    maxForce: 0.01,
    perceptionRadius: 5.0
};

// 4 Species with slightly different traits
const SPECIES_CONFIG: SpeciesAttributes[] = [
    { ...INITIAL_ATTRIBUTES, separationWeight: 4.0, maxSpeed: 0.6, perceptionRadius: 6.0 }, // Red (Hunter)
    { ...INITIAL_ATTRIBUTES, separationWeight: 3.5, maxSpeed: 0.5, perceptionRadius: 5.0 }, // Green
    { ...INITIAL_ATTRIBUTES, separationWeight: 3.2, maxSpeed: 0.4, perceptionRadius: 4.0 }, // Blue
    { ...INITIAL_ATTRIBUTES, separationWeight: 3.8, maxSpeed: 0.55, perceptionRadius: 5.5 } // Yellow
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
    const [population, setPopulation] = useState(20000)
    const [fps, setFps] = useState(0)

    const randomMode = Math.floor(Math.random() * 31) as FormationMode;

    // We use a ref for state to communicate with the loop without re-rendering everything constantly
    const simState = useRef<SimulationState>({
        attributes: SPECIES_CONFIG,
        interactions: INITIAL_MATRIX,
        bounds: 50,
        speedMultiplier: 0.28,
        sizeMultiplier: 1.5,
        defeatScenario: DefeatScenario.Remove,
        formationMode: randomMode,
        formationSeed: Math.random() * 10000,
        proceduralGenome: randomMode === FormationMode.Procedural ? generateProceduralGenome() : undefined,
        speciesColors: [...COLOR_PALETTES[randomMode % COLOR_PALETTES.length]],
        materialSettings: {
            roughness: 0.03,
            metalness: 0.94,
            wireframe: false,
            flatShading: true,
            emissiveIntensity: 0.75
        },
        materialPreset: 0
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} fps={fps} />
            <Canvas shadows gl={{ antialias: false }}>
                <color attach="background" args={['#0d111a']} />
                <fog attach="fog" args={['#0d111a', 120, 360]} />
                <PerspectiveCamera makeDefault position={[30, 25, 40]} />
                <OrbitControls makeDefault enableDamping dampingFactor={0.03} />

                <FPSUpdater onChange={setFps} />

                <Stars radius={160} depth={60} count={3000} factor={3} saturation={0.3} fade speed={0.5} />

                {/* 360° Studio Environment Map for Strong Specular Facet Reflections */}
                <Environment preset="city" environmentIntensity={2.0} />

                {/* Studio Lighting - Strong Specular Highlights & Glowing Facets */}
                {/* 1. Base Ambient Fill */}
                <ambientLight intensity={0.55 * (simState.current.lightIntensityMultiplier ?? 1.0)} color="#ffffff" />

                {/* 2. Key Light (Strong Metallic Specular Highlight) */}
                <directionalLight
                    position={[35, 45, 30]}
                    intensity={2.4 * (simState.current.lightIntensityMultiplier ?? 1.0)}
                    color="#ffffff"
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-bias={-0.0001}
                />

                {/* 3. Fill Light (Soft Neutral White Shadow Fill) */}
                <directionalLight
                    position={[-40, 25, -25]}
                    intensity={0.65 * (simState.current.lightIntensityMultiplier ?? 1.0)}
                    color="#ffffff"
                />

                {/* 4. Rim / Back Light (Strong Silhouette Edge Highlight) */}
                <directionalLight
                    position={[0, 50, -45]}
                    intensity={1.6 * (simState.current.lightIntensityMultiplier ?? 1.0)}
                    color="#ffffff"
                />

                <Flock count={population} state={simState.current} setPopulation={setPopulation} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.22} mipmapBlur intensity={1.25} radius={0.75} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}

export default App

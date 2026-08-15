import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Environment } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useState, useRef } from 'react'
import * as THREE from 'three'
import { Flock } from './Flock'
import { SpeciesAttributes, SimulationState, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, LIGHTING_PROFILES } from './BoidLogic'
import { OverlayUI } from './OverlayUI'
import { CameraRig } from './CameraRig'
import { getLastState, generateProceduralGenome } from './RLEngine'

const INITIAL_ATTRIBUTES: SpeciesAttributes = {
    separationWeight: 3.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    maxSpeed: 0.5,
    maxForce: 0.01,
    perceptionRadius: 5.0
};

const SPECIES_CONFIG: SpeciesAttributes[] = [
    { ...INITIAL_ATTRIBUTES, separationWeight: 4.0, maxSpeed: 0.6, perceptionRadius: 6.0 }, // Red (Hunter)
    { ...INITIAL_ATTRIBUTES, separationWeight: 3.5, maxSpeed: 0.5, perceptionRadius: 5.0 }, // Green
    { ...INITIAL_ATTRIBUTES, separationWeight: 3.2, maxSpeed: 0.4, perceptionRadius: 4.0 }, // Blue
    { ...INITIAL_ATTRIBUTES, separationWeight: 3.8, maxSpeed: 0.55, perceptionRadius: 5.5 } // Yellow
];

const INITIAL_MATRIX = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
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

function DynamicStudioLighting({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const ambientRef = useRef<THREE.AmbientLight>(null!);
    const keyRef = useRef<THREE.DirectionalLight>(null!);
    const fillRef = useRef<THREE.DirectionalLight>(null!);
    const rimRef = useRef<THREE.DirectionalLight>(null!);
    const bounceRef = useRef<THREE.DirectionalLight>(null!);

    const curAmbient = useRef(0.95);
    const curKey = useRef(3.0);
    const curFill = useRef(1.2);
    const curRim = useRef(2.2);
    const curKeyColor = useRef(new THREE.Color('#ffffff'));
    const curFillColor = useRef(new THREE.Color('#e8f0fe'));
    const curRimColor = useRef(new THREE.Color('#e0e8ff'));

    const targetKeyColor = useRef(new THREE.Color('#ffffff'));
    const targetFillColor = useRef(new THREE.Color('#e8f0fe'));
    const targetRimColor = useRef(new THREE.Color('#e0e8ff'));

    useFrame((stateContext) => {
        const state = simState.current;
        const profile = state.lightingProfile || LIGHTING_PROFILES[0];
        const mult = state.lightIntensityMultiplier ?? 1.0;

        let flashBoost = 1.0;
        if (state.microSurpriseType === 'lightingFlash' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            flashBoost = 2.4;
        }

        const targetAmb = (profile.ambientIntensity + 0.45) * mult;
        const targetK = (profile.keyIntensity * 1.25) * mult * flashBoost;
        const targetF = (profile.fillIntensity + 0.65) * mult;
        const targetR = (profile.rimIntensity * 1.35) * mult * flashBoost;

        targetKeyColor.current.set(profile.keyColor);
        targetFillColor.current.set(profile.fillColor);
        targetRimColor.current.set(profile.rimColor);

        curAmbient.current = THREE.MathUtils.lerp(curAmbient.current, targetAmb, 0.04);
        curKey.current = THREE.MathUtils.lerp(curKey.current, targetK, 0.05);
        curFill.current = THREE.MathUtils.lerp(curFill.current, targetF, 0.04);
        curRim.current = THREE.MathUtils.lerp(curRim.current, targetR, 0.04);

        curKeyColor.current.lerp(targetKeyColor.current, 0.03);
        curFillColor.current.lerp(targetFillColor.current, 0.03);
        curRimColor.current.lerp(targetRimColor.current, 0.03);

        if (ambientRef.current) ambientRef.current.intensity = curAmbient.current;
        if (keyRef.current) {
            keyRef.current.intensity = curKey.current;
            keyRef.current.color.copy(curKeyColor.current);
        }
        if (fillRef.current) {
            fillRef.current.intensity = curFill.current;
            fillRef.current.color.copy(curFillColor.current);
        }
        if (rimRef.current) {
            rimRef.current.intensity = curRim.current;
            rimRef.current.color.copy(curRimColor.current);
        }
        if (bounceRef.current) {
            bounceRef.current.intensity = curFill.current * 0.85;
            bounceRef.current.color.copy(curFillColor.current);
        }
    });

    return (
        <>
            <ambientLight ref={ambientRef} intensity={0.95} color="#e8f0fe" />
            <directionalLight
                ref={keyRef}
                position={[35, 45, 30]}
                intensity={3.0}
                color="#ffffff"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            />
            <directionalLight
                ref={fillRef}
                position={[-40, 25, -25]}
                intensity={1.2}
                color="#e8f0fe"
            />
            <directionalLight
                ref={rimRef}
                position={[0, 50, -45]}
                intensity={2.2}
                color="#ffffff"
            />
            <directionalLight
                ref={bounceRef}
                position={[15, -45, 20]}
                intensity={1.0}
                color="#e8f0fe"
            />
        </>
    );
}

function App() {
    const [population, setPopulation] = useState(100000)
    const [fps, setFps] = useState(0)

    // Hydrate from persisted last active state if available
    const lastSaved = getLastState();
    const initialMode = lastSaved ? (lastSaved.formationMode as FormationMode) : (Math.floor(Math.random() * 51) as FormationMode);
    const initialPaletteIdx = lastSaved ? lastSaved.paletteIndex : (initialMode % COLOR_PALETTES.length);
    const initialMatIdx = lastSaved ? lastSaved.materialPreset : 0;
    const initialLightIdx = lastSaved ? lastSaved.lightingProfileIndex : 0;
    const initialShape = lastSaved ? lastSaved.boidShape : 0;

    const simState = useRef<SimulationState>({
        attributes: SPECIES_CONFIG,
        interactions: INITIAL_MATRIX,
        bounds: 50,
        speedMultiplier: 0.28,
        sizeMultiplier: 1.5,
        defeatScenario: DefeatScenario.Remove,
        formationMode: initialMode,
        formationSeed: lastSaved ? lastSaved.formationSeed : Math.random() * 10000,
        transitionStartTime: 0.0,
        proceduralGenome: initialMode === FormationMode.Procedural ? generateProceduralGenome() : undefined,
        paletteIndex: initialPaletteIdx,
        speciesColors: [...COLOR_PALETTES[initialPaletteIdx]],
        materialSettings: { ...MATERIAL_PRESETS[initialMatIdx].settings },
        materialPreset: initialMatIdx,
        boidShape: initialShape,
        autoMode: true,
        autoShape: true,
        autoMaterial: true,
        lightingProfileIndex: initialLightIdx,
        lightingProfile: LIGHTING_PROFILES[initialLightIdx]
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} fps={fps} />
            <Canvas shadows gl={{ antialias: false }}>
                <color attach="background" args={['#141a29']} />
                <fog attach="fog" args={['#141a29', 140, 420]} />
                <CameraRig simState={simState} />

                <FPSUpdater onChange={setFps} />

                <Stars radius={180} depth={70} count={4500} factor={4.5} saturation={0.5} fade speed={0.8} />

                <Environment preset="city" environmentIntensity={3.2} />

                <DynamicStudioLighting simState={simState} />

                <Flock count={population} state={simState.current} setPopulation={setPopulation} />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.22} mipmapBlur intensity={1.25} radius={0.75} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}

export default App

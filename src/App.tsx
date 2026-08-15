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
    { ...INITIAL_ATTRIBUTES, separationWeight: 4.0, maxSpeed: 0.6, perceptionRadius: 6.0 }, // Red
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

// Perceptual Oklab Color Space Interpolation for Flawless Lighting Transitions
function srgbToLinear(c: number): number {
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
}

function linearToSrgb(c: number): number {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped > 0.0031308 ? 1.055 * Math.pow(clamped, 1.0 / 2.4) - 0.055 : 12.92 * clamped;
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);

    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    const l_ = Math.cbrt(Math.max(0, l));
    const m_ = Math.cbrt(Math.max(0, m));
    const s_ = Math.cbrt(Math.max(0, s));

    return [
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    ];
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    return [
        linearToSrgb(lr),
        linearToSrgb(lg),
        linearToSrgb(lb)
    ];
}

function lerpOklabColor(c1: THREE.Color, c2: THREE.Color, t: number, out: THREE.Color) {
    const [L1, a1, b1] = rgbToOklab(c1.r, c1.g, c1.b);
    const [L2, a2, b2] = rgbToOklab(c2.r, c2.g, c2.b);
    const L = L1 + (L2 - L1) * t;
    const a = a1 + (a2 - a1) * t;
    const b = b1 + (b2 - b1) * t;
    const [r, g, b_rgb] = oklabToRgb(L, a, b);
    out.setRGB(r, g, b_rgb);
}

function DynamicStudioLighting({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const ambientRef = useRef<THREE.AmbientLight>(null!);
    const keyRef = useRef<THREE.DirectionalLight>(null!);
    const fillRef = useRef<THREE.DirectionalLight>(null!);
    const rimRef = useRef<THREE.DirectionalLight>(null!);
    const bounceRef = useRef<THREE.DirectionalLight>(null!);

    const lastProfileId = useRef<number>(-1);
    const transitionStartTime = useRef<number>(0);
    const transitionDuration = 6.0; // 6.0s luxurious, cinematic lighting transitions

    // Physical state anchors
    const startAmbient = useRef(0.95);
    const targetAmbient = useRef(0.95);
    const curAmbient = useRef(0.95);

    const startKeyInt = useRef(3.0);
    const targetKeyInt = useRef(3.0);
    const curKeyInt = useRef(3.0);

    const startFillInt = useRef(1.2);
    const targetFillInt = useRef(1.2);
    const curFillInt = useRef(1.2);

    const startRimInt = useRef(2.2);
    const targetRimInt = useRef(2.2);
    const curRimInt = useRef(2.2);

    const startKeyColor = useRef(new THREE.Color('#ffffff'));
    const targetKeyColor = useRef(new THREE.Color('#ffffff'));
    const curKeyColor = useRef(new THREE.Color('#ffffff'));

    const startFillColor = useRef(new THREE.Color('#e8f0fe'));
    const targetFillColor = useRef(new THREE.Color('#e8f0fe'));
    const curFillColor = useRef(new THREE.Color('#e8f0fe'));

    const startRimColor = useRef(new THREE.Color('#e0e8ff'));
    const targetRimColor = useRef(new THREE.Color('#e0e8ff'));
    const curRimColor = useRef(new THREE.Color('#e0e8ff'));

    useFrame((stateContext) => {
        const time = stateContext.clock.getElapsedTime();
        const state = simState.current;
        const profile = state.lightingProfile || LIGHTING_PROFILES[0];
        const mult = state.lightIntensityMultiplier ?? 1.0;

        let flashBoost = 1.0;
        if (state.microSurpriseType === 'lightingFlash' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            flashBoost = 2.4;
        }

        const tAmb = (profile.ambientIntensity + 0.45) * mult;
        const tKey = (profile.keyIntensity * 1.25) * mult * flashBoost;
        const tFill = (profile.fillIntensity + 0.65) * mult;
        const tRim = (profile.rimIntensity * 1.35) * mult * flashBoost;

        if (lastProfileId.current !== profile.id) {
            lastProfileId.current = profile.id;
            transitionStartTime.current = time;

            // Capture exact current values as seamless transition origin
            startAmbient.current = curAmbient.current;
            startKeyInt.current = curKeyInt.current;
            startFillInt.current = curFillInt.current;
            startRimInt.current = curRimInt.current;

            startKeyColor.current.copy(curKeyColor.current);
            startFillColor.current.copy(curFillColor.current);
            startRimColor.current.copy(curRimColor.current);

            targetAmbient.current = tAmb;
            targetKeyInt.current = tKey;
            targetFillInt.current = tFill;
            targetRimInt.current = tRim;

            targetKeyColor.current.set(profile.keyColor);
            targetFillColor.current.set(profile.fillColor);
            targetRimColor.current.set(profile.rimColor);
        } else {
            // Continuously update targets for live slider/flash changes
            targetAmbient.current = tAmb;
            targetKeyInt.current = tKey;
            targetFillInt.current = tFill;
            targetRimInt.current = tRim;
        }

        const elapsed = Math.max(0.0, time - transitionStartTime.current);
        const p = Math.min(1.0, elapsed / transitionDuration);
        // Ultra-smooth C2-continuous Quintic Ease-In / Ease-Out S-Curve: 6p^5 - 15p^4 + 10p^3
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        curAmbient.current = startAmbient.current + (targetAmbient.current - startAmbient.current) * sCurve;
        curKeyInt.current = startKeyInt.current + (targetKeyInt.current - startKeyInt.current) * sCurve;
        curFillInt.current = startFillInt.current + (targetFillInt.current - startFillInt.current) * sCurve;
        curRimInt.current = startRimInt.current + (targetRimInt.current - startRimInt.current) * sCurve;

        lerpOklabColor(startKeyColor.current, targetKeyColor.current, sCurve, curKeyColor.current);
        lerpOklabColor(startFillColor.current, targetFillColor.current, sCurve, curFillColor.current);
        lerpOklabColor(startRimColor.current, targetRimColor.current, sCurve, curRimColor.current);

        if (ambientRef.current) {
            ambientRef.current.intensity = curAmbient.current;
            ambientRef.current.color.copy(curFillColor.current);
        }
        if (keyRef.current) {
            keyRef.current.intensity = curKeyInt.current;
            keyRef.current.color.copy(curKeyColor.current);
        }
        if (fillRef.current) {
            fillRef.current.intensity = curFillInt.current;
            fillRef.current.color.copy(curFillColor.current);
        }
        if (rimRef.current) {
            rimRef.current.intensity = curRimInt.current;
            rimRef.current.color.copy(curRimColor.current);
        }
        if (bounceRef.current) {
            bounceRef.current.intensity = curFillInt.current * 0.85;
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [population, setPopulation] = useState(isMobile ? 25000 : 100000);
    const [fps, setFps] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate from persisted last active state if available with full index bounds safety
    const lastSaved = getLastState();
    const initialMode = (lastSaved && lastSaved.formationMode !== undefined) ? (lastSaved.formationMode as FormationMode) : FormationMode.QuadHelixBraid;
    const initialPaletteIdx = (lastSaved && lastSaved.paletteIndex !== undefined && COLOR_PALETTES[lastSaved.paletteIndex])
        ? lastSaved.paletteIndex
        : 0;
    const initialMatIdx = (lastSaved && lastSaved.materialPreset !== undefined && MATERIAL_PRESETS[lastSaved.materialPreset])
        ? lastSaved.materialPreset
        : 0;
    const initialLightIdx = (lastSaved && lastSaved.lightingProfileIndex !== undefined && LIGHTING_PROFILES[lastSaved.lightingProfileIndex])
        ? lastSaved.lightingProfileIndex
        : 0;
    const initialShape = (lastSaved && lastSaved.boidShape !== undefined) ? lastSaved.boidShape : 0;

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
        materialSettings: { ...(MATERIAL_PRESETS[initialMatIdx]?.settings || MATERIAL_PRESETS[0].settings) },
        materialPreset: initialMatIdx,
        boidShape: initialShape,
        autoMode: true,
        autoShape: true,
        autoMaterial: true,
        lightingProfileIndex: initialLightIdx,
        lightingProfile: LIGHTING_PROFILES[initialLightIdx] || LIGHTING_PROFILES[0],
        onInitialLoadComplete: () => {
            setIsLoading(false);
        }
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} fps={fps} isLoading={isLoading} />
            <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }}>
                <color attach="background" args={['#1a233a']} />
                <fog attach="fog" args={['#1a233a', 160, 480]} />
                <CameraRig simState={simState} />

                <FPSUpdater onChange={setFps} />

                <Stars radius={180} depth={70} count={5000} factor={4.8} saturation={0.6} fade speed={0.8} />

                <Environment preset="city" environmentIntensity={3.8} />

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

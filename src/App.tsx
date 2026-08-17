import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Flock } from './Flock'
import { SpeciesAttributes, SimulationState, DefeatScenario, FormationMode, TOTAL_FORMATION_COUNT, COLOR_PALETTES, MATERIAL_PRESETS, LIGHTING_PROFILES } from './BoidLogic'
import { OverlayUI } from './OverlayUI'
import { CameraRig, CAMERA_PRESETS } from './CameraRig'
import { getLastState, generateProceduralGenome } from './RLEngine'
import { BloomSettings, BLOOM_PRESETS } from './BloomControlPanel'

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

// Pre-allocated scratch vectors for DynamicStudioLighting (zero per-frame GC pressure)
const _viewVec = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);
const _rightVec = new THREE.Vector3();
const _upVec = new THREE.Vector3();
const _idealKey = new THREE.Vector3();
const _idealFill = new THREE.Vector3();
const _idealRim = new THREE.Vector3();
const _idealBounce = new THREE.Vector3();

function DynamicStudioLighting({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const ambientRef = useRef<THREE.AmbientLight>(null!);
    const keyRef = useRef<THREE.DirectionalLight>(null!);
    const fillRef = useRef<THREE.DirectionalLight>(null!);
    const rimRef = useRef<THREE.DirectionalLight>(null!);
    const bounceRef = useRef<THREE.DirectionalLight>(null!);
    const { camera } = useThree();

    // Smoothed light positions for camera-adaptive studio rig
    const curKeyPos = useRef(new THREE.Vector3(35, 45, 30));
    const curFillPos = useRef(new THREE.Vector3(-40, 25, -25));
    const curRimPos = useRef(new THREE.Vector3(0, 50, -45));
    const curBouncePos = useRef(new THREE.Vector3(15, -45, 20));

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

    useFrame((stateContext, delta) => {
        const time = stateContext.clock.getElapsedTime();
        const state = simState.current;
        const profile = state.lightingProfile || LIGHTING_PROFILES[0];
        const mult = state.lightIntensityMultiplier ?? 1.0;

        let flashBoost = 1.0;
        if (state.microSurpriseType === 'lightingFlash' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            flashBoost = 2.4;
        }

        // Low ambient wash + high directional key & rim for deep sculptural chiaroscuro
        const tAmb = (profile.ambientIntensity * 0.40 + 0.08) * mult;
        const tKey = (profile.keyIntensity * 1.35) * mult * flashBoost;
        const tFill = (profile.fillIntensity * 0.40 + 0.12) * mult;
        const tRim = (profile.rimIntensity * 1.75) * mult * flashBoost;

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

        // --- Camera-Adaptive Studio Rig: 70° Cross-Side Rake Lighting & Crisp Silhouette Rim ---
        const camPos = camera.position;
        _viewVec.copy(camPos).normalize();
        if (_viewVec.lengthSq() < 0.001) _viewVec.set(0, 0, 1);

        _worldUp.set(0, 1, 0);
        _rightVec.crossVectors(_viewVec, _worldUp).normalize();
        if (_rightVec.lengthSq() < 0.001) _rightVec.set(1, 0, 0);

        _upVec.crossVectors(_rightVec, _viewVec).normalize();

        const lightDist = 65.0;

        // 1. Key Light: 70° Cross-Side Rake Angle (illuminates one facet steeply while casting distinct shadow on the other).
        _idealKey.set(0, 0, 0)
            .addScaledVector(_viewVec, 0.28)
            .addScaledVector(_rightVec, 0.82)
            .addScaledVector(_upVec, 0.50)
            .normalize()
            .multiplyScalar(lightDist);

        // 2. Fill Light: 65° Low Counter-Angle with Deep Complementary Shadow Tint.
        _idealFill.set(0, 0, 0)
            .addScaledVector(_viewVec, 0.40)
            .addScaledVector(_rightVec, -0.78)
            .addScaledVector(_upVec, -0.25)
            .normalize()
            .multiplyScalar(lightDist * 0.9);

        // 3. Rim / Kicker Light: 155° High Silhouette Backlight (produces razor-sharp glowing edge separation).
        _idealRim.set(0, 0, 0)
            .addScaledVector(_viewVec, -0.80)
            .addScaledVector(_rightVec, -0.38)
            .addScaledVector(_upVec, 0.52)
            .normalize()
            .multiplyScalar(lightDist * 1.15);

        // 4. Bounce / Ground Uplight: Underside specular definition.
        _idealBounce.set(0, 0, 0)
            .addScaledVector(_viewVec, -0.10)
            .addScaledVector(_rightVec, 0.35)
            .addScaledVector(_upVec, -0.90)
            .normalize()
            .multiplyScalar(lightDist * 0.85);

        // Smoothly glide light positions with organic temporal damping
        const smoothRate = Math.min(1.0, (delta || 0.016) * 7.5);
        curKeyPos.current.lerp(_idealKey, smoothRate);
        curFillPos.current.lerp(_idealFill, smoothRate);
        curRimPos.current.lerp(_idealRim, smoothRate);
        curBouncePos.current.lerp(_idealBounce, smoothRate);

        if (ambientRef.current) {
            ambientRef.current.intensity = Math.max(0.40, curAmbient.current * 2.5);
            ambientRef.current.color.copy(curFillColor.current);
        }
        if (keyRef.current) {
            keyRef.current.position.copy(curKeyPos.current);
            keyRef.current.intensity = curKeyInt.current;
            keyRef.current.color.copy(curKeyColor.current);
        }
        if (fillRef.current) {
            fillRef.current.position.copy(curFillPos.current);
            fillRef.current.intensity = curFillInt.current;
            fillRef.current.color.copy(curFillColor.current);
        }
        if (rimRef.current) {
            rimRef.current.position.copy(curRimPos.current);
            rimRef.current.intensity = curRimInt.current;
            rimRef.current.color.copy(curRimColor.current);
        }
        if (bounceRef.current) {
            bounceRef.current.position.copy(curBouncePos.current);
            bounceRef.current.intensity = curFillInt.current * 0.70;
            bounceRef.current.color.copy(curFillColor.current);
        }
    });

    return (
        <>
            <ambientLight ref={ambientRef} intensity={0.20} color="#0c1220" />
            <directionalLight
                ref={keyRef}
                position={[45, 35, 20]}
                intensity={4.2}
                color="#ffffff"
            />
            <directionalLight
                ref={fillRef}
                position={[-45, -15, -20]}
                intensity={0.45}
                color="#101828"
            />
            <directionalLight
                ref={rimRef}
                position={[-20, 45, -50]}
                intensity={3.8}
                color="#ffffff"
            />
            <directionalLight
                ref={bounceRef}
                position={[20, -45, -10]}
                intensity={0.35}
                color="#0c1424"
            />
        </>
    );
}

function FPSUpdater({ onChange }: { onChange: (fps: number) => void }) {
    const frames = useRef(0)
    const prevTime = useRef(performance.now())

    useFrame(() => {
        frames.current++
        const time = performance.now()
        if (time >= prevTime.current + 500) {
            onChange(Math.round((frames.current * 1000) / (time - prevTime.current)))
            prevTime.current = time
            frames.current = 0
        }
    })
    return null
}

function App() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [population, setPopulation] = useState(isMobile ? 25000 : 50000);
    const [fps, setFps] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // 100% Entirely Random Startup Configuration across all 7 aesthetic dimensions
    const initialMode: FormationMode = Math.floor(Math.random() * TOTAL_FORMATION_COUNT) as FormationMode;
    const initialPaletteIdx = Math.floor(Math.random() * COLOR_PALETTES.length);
    const initialMatIdx = Math.floor(Math.random() * MATERIAL_PRESETS.length);
    const initialLightIdx = Math.floor(Math.random() * LIGHTING_PROFILES.length);
    // Geodesic Ico-Sphere (0) is the default flagship shape (unless user manually changes)
    const initialShape = 0;
    const initialCameraIdx = Math.floor(Math.random() * CAMERA_PRESETS.length);
    const initialBloomIdx = Math.floor(Math.random() * BLOOM_PRESETS.length);
    const initialBloom = BLOOM_PRESETS[initialBloomIdx] || BLOOM_PRESETS[0];

    const [bloomSettings, setBloomSettings] = useState<BloomSettings>({
        ...initialBloom.settings
    });

    const simState = useRef<SimulationState>({
        attributes: SPECIES_CONFIG,
        interactions: INITIAL_MATRIX,
        bounds: 50,
        speedMultiplier: 0.28,
        sizeMultiplier: 1.5,
        defeatScenario: DefeatScenario.Remove,
        formationMode: initialMode,
        formationSeed: Math.random() * 100000,
        proceduralGenome: initialMode === FormationMode.Procedural ? generateProceduralGenome() : undefined,
        paletteIndex: initialPaletteIdx,
        speciesColors: [...COLOR_PALETTES[initialPaletteIdx]],
        materialSettings: { ...(MATERIAL_PRESETS[initialMatIdx]?.settings || MATERIAL_PRESETS[0].settings) },
        materialPreset: initialMatIdx,
        boidShape: initialShape,
        cameraPresetIndex: initialCameraIdx,
        bloomPreset: initialBloomIdx,
        bloomSettings: {
            ...initialBloom.settings
        },
        autoMode: true, // Auto timer is ON by default
        autoShape: false, // Geodesic Ico-Sphere is fixed default unless user manually changes
        autoMaterial: true,
        lightingProfileIndex: initialLightIdx,
        lightingProfile: LIGHTING_PROFILES[initialLightIdx] || LIGHTING_PROFILES[0],
        onInitialLoadComplete: () => {
            setIsLoading(false);
        }
    });

    // Keep simState and React state synchronized
    useEffect(() => {
        simState.current.bloomSettings = bloomSettings;
    }, [bloomSettings]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (simState.current.bloomSettings) {
                const s = simState.current.bloomSettings;
                setBloomSettings(prev => {
                    if (prev.luminanceThreshold !== s.luminanceThreshold ||
                        prev.radius !== s.radius ||
                        prev.intensity !== s.intensity ||
                        prev.levels !== s.levels) {
                        return { ...s };
                    }
                    return prev;
                });
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} fps={fps} isLoading={isLoading} />
            <Canvas
                dpr={[1, 1.25]}
                gl={{
                    antialias: false,
                    powerPreference: 'high-performance',
                    depth: true,
                    stencil: false,
                    alpha: false
                }}
            >
                <color attach="background" args={['#1a233a']} />
                <fog attach="fog" args={['#1a233a', 160, 480]} />
                <CameraRig simState={simState} />

                <FPSUpdater onChange={setFps} />

                <Stars radius={180} depth={70} count={5000} factor={4.8} saturation={0.6} fade speed={0.8} />

                <hemisphereLight args={['#88aadd', '#1a2233', 1.3]} />

                <DynamicStudioLighting simState={simState} />

                <Flock count={population} state={simState.current} setPopulation={setPopulation} />

                <EffectComposer>
                    <Bloom
                        key={`${bloomSettings.levels}`}
                        luminanceThreshold={bloomSettings.luminanceThreshold}
                        mipmapBlur
                        intensity={bloomSettings.intensity}
                        radius={bloomSettings.radius}
                        levels={bloomSettings.levels}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    )
}

export default App

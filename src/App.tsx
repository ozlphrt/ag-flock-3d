import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Flock } from './Flock'
import { GPGPUFlock } from './GPGPUFlock'
import { SpeciesAttributes, SimulationState, DefeatScenario, FormationMode, TOTAL_FORMATION_COUNT, COLOR_PALETTES, MATERIAL_PRESETS, LIGHTING_PROFILES, generateSpeciesDistribution, generateSpeciesMaterials, generateSpeciesSizes, generateDynamicSpeciesCount, generateHarmoniousPalette, getTopologyAlignedPalette, generateSpeciesKinematics, generateSpeciesRandomness, generateSpeciesSizeRanges, generateSpeciesMorphTimings } from './BoidLogic'
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

const INITIAL_MATRIX = Array.from({ length: 20 }, () => Array(20).fill(0));



// Perceptual Oklab Color Space Interpolation for Flawless Lighting Transitions
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
    const rL = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : (r / 12.92);
    const gL = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : (g / 12.92);
    const bL = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : (b / 12.92);

    const l = Math.cbrt(0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL);
    const m = Math.cbrt(0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL);
    const s = Math.cbrt(0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL);

    return [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);

    const rL = +4.0767439362 * l - 3.3077115913 * m + 0.2309699295 * s;
    const gL = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bL = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const r = (rL <= 0.0031308) ? (12.92 * rL) : (1.055 * Math.pow(Math.max(0, rL), 1.0 / 2.4) - 0.055);
    const g = (gL <= 0.0031308) ? (12.92 * gL) : (1.055 * Math.pow(Math.max(0, gL), 1.0 / 2.4) - 0.055);
    const b_rgb = (bL <= 0.0031308) ? (12.92 * bL) : (1.055 * Math.pow(Math.max(0, bL), 1.0 / 2.4) - 0.055);

    return [
        Math.min(1, Math.max(0, r)),
        Math.min(1, Math.max(0, g)),
        Math.min(1, Math.max(0, b_rgb))
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
// Pre-allocated scratch vectors for DynamicStudioLighting (zero per-frame GC pressure)
const _viewVec = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);
const _rightVec = new THREE.Vector3();
const _upVec = new THREE.Vector3();
const _idealKey = new THREE.Vector3();
const _idealFill = new THREE.Vector3();
const _idealRim = new THREE.Vector3();
const _rawFillScratch = new THREE.Color();
const _hslScratch = { h: 0, s: 0, l: 0 };
const _whiteColor = new THREE.Color('#ffffff');

function DynamicStudioLighting({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const ambientRef = useRef<THREE.AmbientLight>(null!);
    const keyRef = useRef<THREE.DirectionalLight>(null!);
    const fillRef = useRef<THREE.DirectionalLight>(null!);
    const rimRef = useRef<THREE.DirectionalLight>(null!);
    const { camera } = useThree();

    // Smoothed light positions for 3-Point Studio Rig (Key, Fill, Rim)
    const curKeyPos = useRef(new THREE.Vector3(38, 48, 24));
    const curFillPos = useRef(new THREE.Vector3(-28, 22, -16));
    const curRimPos = useRef(new THREE.Vector3(-36, -18, -34));

    const lastProfileId = useRef<number>(-1);
    const transitionStartTime = useRef<number>(0);
    const transitionDuration = 3.0; // 3.0s smooth lighting transitions

    // Physical state anchors
    const startAmbient = useRef(0.04);
    const targetAmbient = useRef(0.04);
    const curAmbient = useRef(0.04);

    const startKeyInt = useRef(2.2);
    const targetKeyInt = useRef(2.2);
    const curKeyInt = useRef(2.2);

    const startFillInt = useRef(0.22);
    const targetFillInt = useRef(0.22);
    const curFillInt = useRef(0.22);

    const startRimInt = useRef(2.4);
    const targetRimInt = useRef(2.4);
    const curRimInt = useRef(2.4);

    const startKeyColor = useRef(new THREE.Color('#ffffff'));
    const targetKeyColor = useRef(new THREE.Color('#ffffff'));
    const curKeyColor = useRef(new THREE.Color('#ffffff'));

    const startFillColor = useRef(new THREE.Color('#475569'));
    const targetFillColor = useRef(new THREE.Color('#475569'));
    const curFillColor = useRef(new THREE.Color('#475569'));

    const startRimColor = useRef(new THREE.Color('#93c5fd'));
    const targetRimColor = useRef(new THREE.Color('#93c5fd'));
    const curRimColor = useRef(new THREE.Color('#93c5fd'));

    useFrame((stateContext, delta) => {
        const time = stateContext.clock.getElapsedTime();
        const state = simState.current;
        const profile = state.lightingProfile || LIGHTING_PROFILES[0];
        const mult = state.lightIntensityMultiplier ?? 1.0;

        let flashBoost = 1.0;
        if (state.microSurpriseType === 'lightingFlash' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            flashBoost = 2.4;
        }

        // Calibrated dynamic ranges directly responsive to live sliders
        const tAmb = (profile.ambientIntensity ?? 0.04) * mult;
        const tKey = (profile.keyIntensity ?? 2.2) * mult * flashBoost;
        const tFill = (profile.fillIntensity ?? 0.22) * mult;
        const tRim = (profile.rimIntensity ?? 2.4) * mult * flashBoost;

        // Lift fill color luminance if it's too dark so it visibly illuminates shadows
        _rawFillScratch.set(profile.fillColor);
        _rawFillScratch.getHSL(_hslScratch);
        if (_hslScratch.l < 0.24) {
            _rawFillScratch.setHSL(_hslScratch.h, Math.max(_hslScratch.s, 0.40), 0.32);
        }

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
            targetFillColor.current.copy(_rawFillScratch);
            targetRimColor.current.set(profile.rimColor);
        } else {
            // Continuously update targets for live slider/flash changes
            targetAmbient.current = tAmb;
            targetKeyInt.current = tKey;
            targetFillInt.current = tFill;
            targetRimInt.current = tRim;
            targetKeyColor.current.set(profile.keyColor);
            targetFillColor.current.copy(_rawFillScratch);
            targetRimColor.current.set(profile.rimColor);
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

        // Dynamic Atmospheric Exponential Fog synchronized with live slider
        if (stateContext.scene.fog && 'density' in stateContext.scene.fog) {
            const rawDens = profile.fogDensity ?? 0.0035;
            (stateContext.scene.fog as THREE.FogExp2).density = rawDens;
            (stateContext.scene.fog as THREE.FogExp2).color.set('#0d121f');
        }

        // --- Standard 3-Point Studio Rig: Key Sun, Fill, and Rim Backlight ---
        _idealKey.set(38.0, 48.0, 24.0);
        _idealFill.set(-28.0, 22.0, -16.0);
        _idealRim.set(-36.0, -18.0, -34.0);

        // Smoothly glide light positions
        const smoothRate = Math.min(1.0, (delta || 0.016) * 3.0);
        curKeyPos.current.lerp(_idealKey, smoothRate);
        curFillPos.current.lerp(_idealFill, smoothRate);
        curRimPos.current.lerp(_idealRim, smoothRate);

        if (ambientRef.current) {
            ambientRef.current.intensity = Math.max(0.001, curAmbient.current);
            ambientRef.current.color.copy(curKeyColor.current).lerp(_whiteColor, 0.70);
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
    });

    return (
        <>
            <ambientLight ref={ambientRef} intensity={0.04} color="#ffffff" />
            <directionalLight
                ref={keyRef}
                position={[38, 48, 24]}
                intensity={2.2}
                color="#ffffff"
            />
            <directionalLight
                ref={fillRef}
                position={[-28, 22, -16]}
                intensity={0.22}
                color="#475569"
            />
            <directionalLight
                ref={rimRef}
                position={[-36, -18, -34]}
                intensity={2.4}
                color="#93c5fd"
            />
        </>
    );
}

function FPSUpdater({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const frames = useRef(0)
    const prevTime = useRef(performance.now())

    useFrame(() => {
        frames.current++
        const time = performance.now()
        if (time >= prevTime.current + 500) {
            simState.current.fps = Math.round((frames.current * 1000) / (time - prevTime.current));
            prevTime.current = time
            frames.current = 0
        }
    })
    return null;
}

function DynamicStars({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const starGroupRef = useRef<THREE.Group>(null!);

    useFrame(() => {
        const fogDens = simState.current.lightingProfile?.fogDensity ?? 0.004;
        // Fog attenuates background stars smoothly without shader recompilation
        const starFactor = Math.max(0.0, Math.min(1.0, 1.0 - fogDens * 14.0)) * 4.8;
        if (starGroupRef.current) {
            starGroupRef.current.traverse((child) => {
                if ((child as THREE.Points).isPoints && (child as THREE.Points).material) {
                    const mat = (child as THREE.Points).material as any;
                    if (mat.uniforms && mat.uniforms.factor) {
                        mat.uniforms.factor.value = starFactor;
                    }
                }
            });
        }
    });

    return (
        <group ref={starGroupRef}>
            <Stars radius={180} depth={70} count={5000} factor={4.8} saturation={0.6} fade speed={0.8} />
        </group>
    );
}

function DynamicBloom({ simState }: { simState: React.MutableRefObject<SimulationState> }) {
    const bloomRef = useRef<any>(null);

    useFrame(() => {
        const s = simState.current.bloomSettings;
        if (s && bloomRef.current) {
            const b = bloomRef.current;
            if (b.intensity !== undefined) {
                b.intensity = s.intensity ?? 0.75;
            }
            if (b.luminanceMaterial && b.luminanceMaterial.threshold !== undefined) {
                b.luminanceMaterial.threshold = s.luminanceThreshold ?? 0.60;
            } else if (b.luminancePass?.luminanceMaterial?.threshold !== undefined) {
                b.luminancePass.luminanceMaterial.threshold = s.luminanceThreshold ?? 0.60;
            }
            if (b.mipmapBlurPass && b.mipmapBlurPass.radius !== undefined) {
                b.mipmapBlurPass.radius = s.radius ?? 0.35;
            } else if (b.radius !== undefined) {
                b.radius = s.radius ?? 0.35;
            }
        }
    });

    const s = simState.current.bloomSettings || { luminanceThreshold: 0.60, intensity: 0.75, radius: 0.35, levels: 3 };
    return (
        <EffectComposer>
            <Bloom
                ref={bloomRef}
                luminanceThreshold={s.luminanceThreshold}
                mipmapBlur
                intensity={s.intensity}
                radius={s.radius}
                levels={s.levels || 3}
            />
        </EffectComposer>
    );
}

function App() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [population, setPopulation] = useState(isMobile ? 25000 : 500000);
    const [isLoading, setIsLoading] = useState(true);

    // Default Startup Configuration: Saturnian Planetary Rings with calibrated PBR & Bloom
    const initialMode: FormationMode = FormationMode.SaturnianRings;
    const initialPaletteIdx = Math.floor(Math.random() * COLOR_PALETTES.length);
    const initialMatIdx = 0; // Vibrant Satin Porcelain (roughness 0.30)
    const initialShape = 0; // Geodesic Ico-Sphere is fixed default
    const initialCameraIdx = 0; // Celestial Orbit
    const initialBloomIdx = 0; // Diamond Facet Sparkle (threshold 0.14, intensity 0.75)
    const initialLightIdx = 0; // Studio High-Contrast

    const initialBloom = BLOOM_PRESETS[initialBloomIdx] || BLOOM_PRESETS[0];
    const initialSpeciesCount = 4; // Default to 4 pure species
    const initialPalette = getTopologyAlignedPalette(initialMode, initialSpeciesCount);
    const initialSpeciesDistribution = generateSpeciesDistribution(initialSpeciesCount);
    const initialSpeciesMaterials = generateSpeciesMaterials(initialSpeciesCount);
    const initialSizeRanges = generateSpeciesSizeRanges(initialSpeciesCount);
    const initialKinematics = generateSpeciesKinematics(initialSpeciesCount, initialSizeRanges.avgSizes);
    const initialRandomness = generateSpeciesRandomness(initialSpeciesCount);
    const initialMorphTimings = generateSpeciesMorphTimings(initialSpeciesCount, 5.5);

    const simState = useRef<SimulationState>({
        attributes: SPECIES_CONFIG,
        interactions: INITIAL_MATRIX,
        bounds: 50,
        speedMultiplier: 0.14,
        sizeMultiplier: 1.5,
        defeatScenario: DefeatScenario.Remove,
        formationMode: initialMode,
        formationSeed: Math.random() * 100000,
        proceduralGenome: (initialMode as any) === FormationMode.Procedural ? generateProceduralGenome() : undefined,
        paletteIndex: initialPaletteIdx,
        speciesCount: initialSpeciesCount,
        speciesColors: initialPalette,
        speciesDistribution: initialSpeciesDistribution,
        speciesMaterials: initialSpeciesMaterials,
        speciesSizes: initialSizeRanges.avgSizes,
        speciesMinSizes: initialSizeRanges.minSizes,
        speciesMaxSizes: initialSizeRanges.maxSizes,
        speciesAgilities: initialKinematics.agilities,
        speciesSpeeds: initialKinematics.speeds,
        speciesRandomness: initialRandomness,
        speciesStartOffsets: initialMorphTimings.startOffsets,
        speciesMorphDurations: initialMorphTimings.durations,
        materialSettings: { ...(MATERIAL_PRESETS[initialMatIdx]?.settings || MATERIAL_PRESETS[0].settings) },
        materialPreset: initialMatIdx,
        boidShape: initialShape,
        cameraPresetIndex: initialCameraIdx,
        bloomPreset: initialBloomIdx,
        bloomSettings: {
            ...initialBloom.settings
        },
        autoMode: true,
        autoShape: false,
        autoMaterial: true,
        lightingProfileIndex: initialLightIdx,
        lightingProfile: LIGHTING_PROFILES[initialLightIdx] || LIGHTING_PROFILES[0],
        population: population,
        onInitialLoadComplete: () => {
            setIsLoading(false);
        }
    });

    simState.current.population = population;

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <OverlayUI simState={simState} population={population} setPopulation={setPopulation} fps={simState.current.fps || 60} isLoading={isLoading} />
            <Canvas
                frameloop={simState.current.isArenaOpen ? 'never' : 'always'}
                dpr={1.0}
                gl={{
                    antialias: false,
                    powerPreference: 'high-performance',
                    depth: true,
                    stencil: false,
                    alpha: false
                }}
            >
                <color attach="background" args={['#1a233a']} />
                <fogExp2 attach="fog" args={['#1a233a', 0.004]} />
                <CameraRig simState={simState} />

                <FPSUpdater simState={simState} />

                <DynamicStars simState={simState} />

                <DynamicStudioLighting simState={simState} />

                {population >= 200000 ? (
                    <GPGPUFlock key={`gpgpu-${population}`} count={population} state={simState.current} />
                ) : (
                    <Flock key={`cpu-${population}`} count={population} state={simState.current} setPopulation={setPopulation} />
                )}

                <DynamicBloom simState={simState} />
            </Canvas>
        </div>
    )
}

export default App

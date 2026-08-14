import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BoidSwarmData, BlobCenter, SimulationState, SpeciesType, SPECIES_COLORS, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, computeFormationPoint } from './BoidLogic'
import { createClockEngine, ClockEngine } from './ClockEngine'

interface FlockProps {
    count: number;
    state: SimulationState;
    setPopulation: (n: number | ((prev: number) => number)) => void;
}

// Helper to categorize camera profiles by formation
function getCameraCategory(formation: FormationMode): 'portrait' | 'tunnel' | 'overhead' | 'cinematic_sweep' | 'dynamic_burst' | 'orbit_wide' | 'intimate_close' | 'chaotic' {
    switch (formation) {
        case FormationMode.PulsingHeart:
        case FormationMode.PhoenixWings:
        case FormationMode.PulsingHeart:
        case FormationMode.PhoenixWings:
        case FormationMode.JellyfishPulse:
        case FormationMode.BioMushroom:
        case FormationMode.CoralReef:
        case FormationMode.OuroborosSerpent:
        case FormationMode.KleinBottle4D:
            return 'portrait';
        case FormationMode.DoubleHelix:
        case FormationMode.TripleHelix:
        case FormationMode.Spiral:
        case FormationMode.BlackHoleJet:
        case FormationMode.HourglassVortex:
        case FormationMode.TornadoFunnel:
        case FormationMode.HopfFibration:
        case FormationMode.LorenzAttractor:
            return 'tunnel';
        case FormationMode.SaturnRings:
        case FormationMode.TsunamiWave:
        case FormationMode.KelvinHelmholtz:
        case FormationMode.DancingRibbon:
        case FormationMode.CalabiYauManifold:
        case FormationMode.GyroidMinimalSurface:
        case FormationMode.CliffordTorus:
        case FormationMode.GeologicStrata:
        case FormationMode.SpiderWeb:
            return 'overhead';
        case FormationMode.TrefoilKnot:
        case FormationMode.TorusKnot:
        case FormationMode.LissajousKnot:
        case FormationMode.Tesseract4D:
        case FormationMode.MurmurationFlow:
            return 'cinematic_sweep';
        case FormationMode.SupernovaBurst:
        case FormationMode.BigBangExpansion:
        case FormationMode.CollapsingSphere:
        case FormationMode.LightningBolt:
            return 'dynamic_burst';
        case FormationMode.DNALadder:
        case FormationMode.WireCube:
        case FormationMode.StarPolygon:
        case FormationMode.DodecahedronShield:
        case FormationMode.FerrisWheel:
        case FormationMode.AlienMothership:
            return 'orbit_wide';
        case FormationMode.Procedural:
        case FormationMode.TreeBranch:
        case FormationMode.RiverDelta:
        case FormationMode.NautilusShell:
            return 'intimate_close';
        default:
            return 'chaotic';
    }
}

export function Flock({ count, state, setPopulation }: FlockProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const { controls } = useThree();
    const smoothCenter = useRef(new THREE.Vector3(0, 0, 0));
    const smoothDistance = useRef(14.0);
    const smoothLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const smoothCamTarget = useRef(new THREE.Vector3(12, 10, 16));
    const lastInteractionTime = useRef(0);

    // Smooth continuous angle & pitch interpolation registers
    const curPitchCenter = useRef(0.28);
    const curPitchAmp = useRef(0.42);
    const curDistScale = useRef(1.0);
    const curSweepSpeed = useRef(0.045);
    const curSweepRange = useRef(0.85);
    const curYOffset = useRef(0.0);

    // Instantiate ClockEngine with decoupled independent timers
    const clockEngine = useMemo<ClockEngine>(() => {
        const engine = createClockEngine(state);
        state.clockEngine = engine;
        return engine;
    }, [state]);

    useEffect(() => {
        const handleInteraction = () => {
            lastInteractionTime.current = performance.now();
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (e.buttons > 0) handleInteraction();
        };

        window.addEventListener('pointerdown', handleInteraction);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('wheel', handleInteraction, { passive: true });
        window.addEventListener('touchstart', handleInteraction, { passive: true });

        return () => {
            window.removeEventListener('pointerdown', handleInteraction);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('wheel', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    // Structure-of-Arrays High Performance Data Buffer & Worker Thread Link
    const swarm = useMemo(() => new BoidSwarmData(100000), []);
    const blobCentersRef = useRef<BlobCenter[]>([]);
    const lastSeed = useRef<number>(-1);
    const lastMode = useRef<number>(-1);
    const lastPaletteKey = useRef<string>('');
    const colorTransitionStartTime = useRef<number>(0);

    const workerRef = useRef<Worker | null>(null);
    const workerReady = useRef(false);
    const lastCentroid = useRef({ x: 0, y: 0, z: 0, r70: 6.0 });
    const pendingBuffer = useRef<Float32Array | null>(null);
    const isStepPending = useRef(false);

    const startColors = useRef<THREE.Color[]>([
        new THREE.Color('#ff3b30'),
        new THREE.Color('#34c759'),
        new THREE.Color('#007aff'),
        new THREE.Color('#ffcc00')
    ]);
    const targetColors = useRef<THREE.Color[]>([
        new THREE.Color('#ff3b30'),
        new THREE.Color('#34c759'),
        new THREE.Color('#007aff'),
        new THREE.Color('#ffcc00')
    ]);
    const currentColors = useRef<THREE.Color[]>([
        new THREE.Color('#ff3b30'),
        new THREE.Color('#34c759'),
        new THREE.Color('#007aff'),
        new THREE.Color('#ffcc00')
    ]);

    // Custom Shader Uniforms for Zero-CPU GPU-Direct Palette Coloring
    const customUniforms = useRef({
        uSpeciesColors: {
            value: [
                new THREE.Color('#ff3b30'),
                new THREE.Color('#34c759'),
                new THREE.Color('#007aff'),
                new THREE.Color('#ffcc00')
            ]
        }
    });

    const onBeforeCompile = useMemo(() => {
        return (shader: THREE.WebGLProgramParametersWithUniforms) => {
            shader.uniforms.uSpeciesColors = customUniforms.current.uSpeciesColors;

            shader.vertexShader = `
                attribute float aSpecies;
                uniform vec3 uSpeciesColors[4];
                varying vec3 vBoidColor;
                ${shader.vertexShader}
            `;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <color_vertex>',
                `
                #include <color_vertex>
                int spId = int(clamp(aSpecies, 0.0, 3.0));
                vBoidColor = uSpeciesColors[spId];
                `
            );

            shader.fragmentShader = `
                varying vec3 vBoidColor;
                ${shader.fragmentShader}
            `;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                diffuseColor.rgb *= vBoidColor;
                `
            );
        };
    }, []);

    // Initialize Web Worker for Multi-Core Physics Simulation
    useEffect(() => {
        try {
            const worker = new Worker(new URL('./boidWorker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker;

            worker.onmessage = (e) => {
                const { type, buffer, centerX, centerY, centerZ, r70 } = e.data;
                if (type === 'frame') {
                    pendingBuffer.current = buffer;
                    lastCentroid.current = { x: centerX, y: centerY, z: centerZ, r70 };
                    isStepPending.current = false;
                }
            };

            worker.postMessage({ type: 'init', count, state });
            workerReady.current = true;

            return () => {
                worker.terminate();
                workerRef.current = null;
            };
        } catch {
            workerReady.current = false;
        }
    }, []);

    // Initialize/Update Boid Swarm Population
    useMemo(() => {
        swarm.setPopulation(count, state);
        if (workerRef.current) {
            workerRef.current.postMessage({ type: 'init', count, state });
        }
    }, [count]);

    // Attach Instanced aSpecies attribute to geometry whenever count or shape changes
    const activeShapeIdx = state.boidShape !== undefined ? Math.abs(state.boidShape) % 6 : 0;
    useEffect(() => {
        if (!meshRef.current) return;
        meshRef.current.count = count;

        const specArr = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            specArr[i] = swarm.species[i];
        }
        meshRef.current.geometry.setAttribute('aSpecies', new THREE.InstancedBufferAttribute(specArr, 1));
    }, [count, activeShapeIdx]);

    useFrame((stateContext) => {
        if (!meshRef.current) return;
        const boidCount = count;
        const time = stateContext.clock.getElapsedTime();

        // 1. Advance Independent Clocks via ClockEngine
        clockEngine.update(time);

        // 2. Dispatch Simulation Step to Background Worker Thread
        if (workerRef.current && !isStepPending.current) {
            isStepPending.current = true;
            workerRef.current.postMessage({
                type: 'step',
                time,
                count,
                state: {
                    speedMultiplier: state.speedMultiplier,
                    sizeMultiplier: state.sizeMultiplier,
                    formationMode: state.formationMode,
                    formationSeed: state.formationSeed,
                    prevFormationMode: state.prevFormationMode,
                    prevFormationSeed: state.prevFormationSeed,
                    transitionStartTime: state.transitionStartTime,
                    transitionDuration: state.transitionDuration,
                    microSurpriseType: state.microSurpriseType,
                    currentTime: state.currentTime,
                    microSurpriseEndTime: state.microSurpriseEndTime,
                    attributes: state.attributes,
                    interactions: state.interactions,
                    proceduralGenome: state.proceduralGenome
                }
            });
        }

        // 3. Receive & Apply Worker Matrix Buffer with Zero-Copy Main Thread GPU Upload
        if (pendingBuffer.current && meshRef.current) {
            meshRef.current.instanceMatrix.array.set(pendingBuffer.current.subarray(0, boidCount * 16));
            meshRef.current.instanceMatrix.needsUpdate = true;
            
            // Return buffer back to worker for zero-allocation recycling
            if (workerRef.current) {
                workerRef.current.postMessage({ returnedBuffer: pendingBuffer.current }, [pendingBuffer.current.buffer]);
            }
            pendingBuffer.current = null;
        }

        // 4. Liquid HSL Shortest-Arc Color Interpolation over 22.0 seconds
        const newPalette = state.speciesColors || SPECIES_COLORS;
        const paletteKey = newPalette.join(',');

        if (lastPaletteKey.current !== paletteKey) {
            lastPaletteKey.current = paletteKey;
            colorTransitionStartTime.current = time;

            for (let s = 0; s < 4; s++) {
                startColors.current[s].copy(currentColors.current[s]);
                targetColors.current[s].set(newPalette[s]);
            }
        }

        const colorElapsed = Math.max(0.0, time - colorTransitionStartTime.current);
        const colorP = Math.min(1.0, colorElapsed / 22.0);
        const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

        const hsl1 = { h: 0, s: 0, l: 0 };
        const hsl2 = { h: 0, s: 0, l: 0 };

        for (let s = 0; s < 4; s++) {
            startColors.current[s].getHSL(hsl1);
            targetColors.current[s].getHSL(hsl2);

            let dHue = hsl2.h - hsl1.h;
            if (dHue > 0.5) dHue -= 1.0;
            if (dHue < -0.5) dHue += 1.0;

            let h = (hsl1.h + dHue * colorEase) % 1.0;
            if (h < 0) h += 1.0;
            const sat = hsl1.s + (hsl2.s - hsl1.s) * colorEase;
            const light = hsl1.l + (hsl2.l - hsl1.l) * colorEase;

            currentColors.current[s].setHSL(h, sat, light);
        }

        // Direct GPU Palette Uniform Upload (0ms CPU time)
        customUniforms.current.uSpeciesColors.value[0].copy(currentColors.current[0]);
        customUniforms.current.uSpeciesColors.value[1].copy(currentColors.current[1]);
        customUniforms.current.uSpeciesColors.value[2].copy(currentColors.current[2]);
        customUniforms.current.uSpeciesColors.value[3].copy(currentColors.current[3]);

        // 5. Formation-Aware Cinematic Camera Choreography
        if (boidCount > 0) {
            const centerX = lastCentroid.current.x;
            const centerY = lastCentroid.current.y;
            const centerZ = lastCentroid.current.z;
            const targetRadius = Math.max(3.0, lastCentroid.current.r70);

            const perspCam = stateContext.camera as THREE.PerspectiveCamera;
            const fovRad = (perspCam.fov || 75) * (Math.PI / 180);
            const requiredDist = (targetRadius / Math.sin(fovRad / 2)) * 0.48;
            const baseDist = THREE.MathUtils.clamp(requiredDist, 3.5, 11.5);

            smoothCenter.current.lerp(new THREE.Vector3(centerX, centerY, centerZ), 0.035);
            smoothDistance.current = THREE.MathUtils.lerp(smoothDistance.current, baseDist, 0.030);

            // Formation category driven angle and pitch
            const cat = getCameraCategory(state.formationMode);
            state.cameraCategory = cat;

            // Target camera parameter goals per topology (Dynamic 360° Spin & Intimate Framing)
            let targetPitchCenter = 0.22;
            let targetPitchAmp = 0.48; // Dramatic pitch sweep looking up and down
            let targetDistScale = 0.55;
            let targetOrbitSpeed = 0.15; // Dynamic continuous 360° rotation speed
            let targetYOffsetAmp = 5.5; // Controlled vertical amplitude to keep focus tight

            switch (cat) {
                case 'portrait':
                    targetOrbitSpeed = 0.13;
                    targetPitchCenter = 0.15;
                    targetPitchAmp = 0.42;
                    targetDistScale = 0.52;
                    targetYOffsetAmp = 4.8;
                    break;
                case 'tunnel':
                    targetOrbitSpeed = 0.18;
                    targetPitchCenter = 0.42; // Vertical spiral & helical tunnel perspective
                    targetPitchAmp = 0.45;
                    targetDistScale = 0.54;
                    targetYOffsetAmp = 5.8;
                    break;
                case 'overhead':
                    targetOrbitSpeed = 0.14;
                    targetPitchCenter = 0.52; // Plan view diving into layers
                    targetPitchAmp = 0.40;
                    targetDistScale = 0.62;
                    targetYOffsetAmp = 5.2;
                    break;
                case 'cinematic_sweep':
                    targetOrbitSpeed = 0.16;
                    targetPitchCenter = 0.20;
                    targetPitchAmp = 0.48;
                    targetDistScale = 0.56;
                    targetYOffsetAmp = 5.5;
                    break;
                case 'dynamic_burst':
                    targetOrbitSpeed = 0.17;
                    targetPitchCenter = 0.24;
                    targetPitchAmp = 0.46;
                    targetDistScale = 0.52;
                    targetYOffsetAmp = 4.8;
                    break;
                case 'orbit_wide':
                    targetOrbitSpeed = 0.14;
                    targetPitchCenter = 0.28;
                    targetPitchAmp = 0.42;
                    targetDistScale = 0.65;
                    targetYOffsetAmp = 5.0;
                    break;
                case 'intimate_close':
                    targetOrbitSpeed = 0.12;
                    targetPitchCenter = 0.18;
                    targetPitchAmp = 0.36;
                    targetDistScale = 0.44;
                    targetYOffsetAmp = 3.8;
                    break;
                default: // chaotic
                    targetOrbitSpeed = 0.15;
                    targetPitchCenter = 0.22;
                    targetPitchAmp = 0.45;
                    targetDistScale = 0.55;
                    targetYOffsetAmp = 5.2;
                    break;
            }

            // Camera Mood overlay modulation
            if (state.cameraMood === 'intimate_close') targetDistScale *= 0.75;
            if (state.cameraMood === 'orbit_wide') targetDistScale *= 1.15;
            if (state.cameraMood === 'overhead_iso') targetPitchCenter = 0.65;

            // Silky smooth exponential parameter glide
            curPitchCenter.current = THREE.MathUtils.lerp(curPitchCenter.current, targetPitchCenter, 0.025);
            curPitchAmp.current = THREE.MathUtils.lerp(curPitchAmp.current, targetPitchAmp, 0.025);
            curDistScale.current = THREE.MathUtils.lerp(curDistScale.current, targetDistScale, 0.025);
            curSweepSpeed.current = THREE.MathUtils.lerp(curSweepSpeed.current, targetOrbitSpeed, 0.025);
            curYOffset.current = THREE.MathUtils.lerp(curYOffset.current, targetYOffsetAmp, 0.025);

            // 1. Continuous 360° Orbital Revolution with subtle multi-frequency harmonic flow
            const camAngle = (time * curSweepSpeed.current) + Math.sin(time * 0.065) * 0.35;

            // 2. Full Formation Reveal Window (Guarantees user sees entire formation for 2.5-3.5 seconds)
            const formElapsed = state.transitionStartTime ? Math.max(0, time - state.transitionStartTime) : 10.0;
            const transDur = state.transitionDuration || 9.0;
            
            // Peak reveal when morph completes (from transDur to transDur + 3.5s)
            let revealBoost = 1.0;
            if (formElapsed >= transDur - 0.5 && formElapsed <= transDur + 3.5) {
                const revealProgress = (formElapsed - (transDur - 0.5)) / 4.0; // 0 -> 1
                revealBoost += Math.sin(revealProgress * Math.PI) * 0.45; // Smooth 1.0 -> 1.45 -> 1.0 reveal
            }

            // Periodic overview reveal every ~26 seconds for 3 seconds
            const periodicPhase = (time % 26.0);
            if (periodicPhase < 3.2) {
                const pProg = Math.sin((periodicPhase / 3.2) * Math.PI);
                revealBoost = Math.max(revealBoost, 1.0 + pProg * 0.40);
            }

            // 3. Engaging Vertical Swoop (Going down looking up, climbing high looking down)
            const verticalCycle = Math.sin(time * 0.125) + Math.sin(time * 0.055) * 0.40;
            const yOffset = verticalCycle * (curYOffset.current / (revealBoost > 1.1 ? 1.5 : 1.0));
            
            // Pitch tilts down (+angle) when camera is high, tilts up (-angle) when camera is low!
            const camPitch = curPitchCenter.current + (verticalCycle * curPitchAmp.current * 0.85);

            // 4. Dynamic Focal Distance Breathing with Full Formation Reveal
            const zoomMod = 0.78 + Math.sin(time * 0.08) * 0.10 + Math.cos(time * 0.16) * 0.05;
            const finalDist = smoothDistance.current * curDistScale.current * zoomMod * revealBoost;

            // 4. Spherical coordinates to 3D Cartesian space
            const targetCamX = smoothCenter.current.x + finalDist * Math.cos(camAngle) * Math.cos(camPitch);
            const targetCamY = smoothCenter.current.y + yOffset + finalDist * Math.sin(camPitch);
            const targetCamZ = smoothCenter.current.z + finalDist * Math.sin(camAngle) * Math.cos(camPitch);

            const activeControls = controls as any;
            const isDraggingNow = activeControls?.state !== undefined && activeControls?.state !== -1;
            if (isDraggingNow) {
                lastInteractionTime.current = performance.now();
            }

            const timeSinceInteraction = performance.now() - lastInteractionTime.current;
            const isUserOverriding = timeSinceInteraction < 10000;

            if (!isUserOverriding) {
                const rawGoal = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
                smoothCamTarget.current.lerp(rawGoal, 0.035);
                smoothLookTarget.current.lerp(smoothCenter.current, 0.040);

                stateContext.camera.position.copy(smoothCamTarget.current);
                if (activeControls && activeControls.target) {
                    activeControls.target.copy(smoothLookTarget.current);
                    activeControls.update();
                } else {
                    stateContext.camera.lookAt(smoothLookTarget.current);
                }
            } else {
                smoothCamTarget.current.copy(stateContext.camera.position);
                if (activeControls && activeControls.target) {
                    smoothLookTarget.current.copy(activeControls.target);
                }
            }
        }
    });

    // 6 Ultra-Fast, Low-Poly, Hard-Edged 3D Geometries with Sharp Pointy Nose (+Z)
    const geometries = useMemo(() => {
        const g0 = new THREE.ConeGeometry(0.16, 0.52, 3);
        g0.rotateX(Math.PI / 2);

        const g1 = new THREE.OctahedronGeometry(0.22, 0);
        g1.scale(0.7, 0.7, 1.6);

        const g2 = new THREE.ConeGeometry(0.18, 0.50, 4);
        g2.rotateX(Math.PI / 2);

        const g3 = new THREE.ConeGeometry(0.20, 0.48, 6);
        g3.rotateX(Math.PI / 2);

        const g4 = new THREE.CylinderGeometry(0.01, 0.20, 0.52, 4);
        g4.rotateX(Math.PI / 2);

        const g5 = new THREE.ConeGeometry(0.15, 0.54, 5);
        g5.rotateX(Math.PI / 2);

        return [g0, g1, g2, g3, g4, g5];
    }, []);

    const mat = state.materialSettings || { roughness: 0.25, metalness: 0.5, wireframe: false, flatShading: false, emissiveIntensity: 0.0 };
    const activeGeometry = geometries[activeShapeIdx];

    // Check for transient material pulse micro-surprise
    let emissiveInt = mat.emissiveIntensity;
    if (state.microSurpriseType === 'materialPulse' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
        emissiveInt = 1.4;
    }

    return (
        <instancedMesh key={`${activeShapeIdx}-${count}`} ref={meshRef} args={[activeGeometry, undefined, count]} castShadow receiveShadow>
            <meshStandardMaterial
                key={`${mat.flatShading ? 'f' : 's'}-${emissiveInt > 1.0 ? 'p' : 'n'}`}
                roughness={mat.roughness}
                metalness={mat.metalness}
                wireframe={false}
                flatShading={mat.flatShading}
                emissiveIntensity={emissiveInt}
                toneMapped={true}
                onBeforeCompile={onBeforeCompile}
                customProgramCacheKey={() => 'boid_instanced_pbr_v2'}
            />
        </instancedMesh>
    );
}

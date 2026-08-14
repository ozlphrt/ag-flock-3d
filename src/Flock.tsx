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
    const clockEngine = useMemo<ClockEngine>(() => createClockEngine(state), [state]);

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

    // Structure-of-Arrays High Performance Data Buffer
    const swarm = useMemo(() => new BoidSwarmData(100000), []);
    const blobCentersRef = useRef<BlobCenter[]>([]);
    const lastSeed = useRef<number>(-1);
    const lastMode = useRef<number>(-1);
    const lastPaletteKey = useRef<string>('');
    const colorTransitionStartTime = useRef<number>(0);

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

    // Initialize Blob Centers once
    if (blobCentersRef.current.length === 0) {
        for (let s = 0; s < 4; s++) {
            const baseR = 2.0 + s * 1.8;
            const nBlobs = 3;
            for (let b = 0; b < nBlobs; b++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const x = baseR * Math.sin(phi) * Math.cos(theta);
                const y = baseR * Math.cos(phi);
                const z = baseR * Math.sin(phi) * Math.sin(theta);
                blobCentersRef.current.push(new BlobCenter(x, y, z, s, baseR));
            }
        }
    }

    // Initialize/Update Boid Swarm Population
    useMemo(() => {
        swarm.setPopulation(count, state);
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

        // 2. Advance Blob Centers on CPU (O(B^2) where B=12)
        const centers = blobCentersRef.current;
        const speed = state.attributes[0].maxSpeed * state.speedMultiplier;
        for (const center of centers) {
            center.update(centers, state.interactions, speed, time);
        }

        // 3. Physics & Formation Parameters
        let speedMult = state ? state.speedMultiplier : 1.0;
        if (state && state.microSurpriseType === 'speedSurge' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            speedMult *= 2.2;
        }

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.Serpent;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 9.0;
        const elapsed = Math.max(0.0, time - startTime);
        const p = Math.min(1.0, elapsed / duration);
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        const activeLerpRate = (state && state.prevFormationMode !== undefined && p < 1.0)
            ? 0.03 + 0.03 * sCurve
            : 0.06;
        const activeMaxDisp = (state && state.prevFormationMode !== undefined && p < 1.0)
            ? (0.04 + 0.02 * sCurve) * speedMult
            : 0.06 * speedMult;
        const maxAccel = 0.0025 * speedMult;
        const maxAccelSq = maxAccel * maxAccel;
        const maxDispSq = activeMaxDisp * activeMaxDisp;

        // 4. Direct Column-Major Matrix4 Composition directly into Float32Array (0ms Object3D overhead)
        const matArray = meshRef.current.instanceMatrix.array;
        const baseScale = state.sizeMultiplier * 0.5;

        for (let i = 0; i < boidCount; i++) {
            const prevX = swarm.posX[i];
            const prevY = swarm.posY[i];
            const prevZ = swarm.posZ[i];

            const sp = swarm.species[i];
            const sepWeight = (state && state.attributes && state.attributes[sp])
                ? state.attributes[sp].separationWeight
                : 3.5;

            const total = swarm.totalInSpecies[i] > 0 ? swarm.totalInSpecies[i] : 100;
            const rawU = swarm.indexInSpecies[i] / total;
            const u = Math.sin(rawU * Math.PI * 0.5);

            let [txCurr, tyCurr, tzCurr] = computeFormationPoint(formation, seed, u, time, sp, swarm.indexInSpecies[i], sepWeight, speedMult, state);

            if (swarm.isStray[i] === 1 && p > 0.8) {
                const strayAngle = time * swarm.strayOrbitSpeed[i] + swarm.noiseSeed[i];
                txCurr = swarm.strayOrbitRadius[i] * Math.cos(strayAngle);
                tyCurr = Math.sin(strayAngle * 2.0) * 2.5 + (sp - 1.5) * 1.5;
                tzCurr = swarm.strayOrbitRadius[i] * Math.sin(strayAngle);
            }

            let tx = txCurr, ty = tyCurr, tz = tzCurr;

            if (state && state.prevFormationMode !== undefined && p <= 1.0) {
                const prevSeed = state.prevFormationSeed !== undefined ? state.prevFormationSeed : seed;
                const [txPrev, tyPrev, tzPrev] = computeFormationPoint(
                    state.prevFormationMode,
                    prevSeed,
                    u,
                    time,
                    sp,
                    swarm.indexInSpecies[i],
                    sepWeight,
                    speedMult,
                    state
                );
                tx = txPrev + (txCurr - txPrev) * sCurve;
                ty = tyPrev + (tyCurr - tyPrev) * sCurve;
                tz = tzPrev + (tzCurr - tzPrev) * sCurve;
            }

            // Clamp spring target to R=14
            const targetDistSq = tx * tx + ty * ty + tz * tz;
            if (targetDistSq > 196.0 && targetDistSq > 1e-6) {
                const invT = 14.0 / Math.sqrt(targetDistSq);
                tx *= invT; ty *= invT; tz *= invT;
            }

            let dx = (tx - swarm.posX[i]) * activeLerpRate;
            let dy = (ty - swarm.posY[i]) * activeLerpRate;
            let dz = (tz - swarm.posZ[i]) * activeLerpRate;

            if (swarm.isLeader[i] === 1) {
                dx *= 1.12; dy *= 1.12; dz *= 1.12;
            }

            const nSeed = swarm.noiseSeed[i];
            const driftX = Math.sin(time * 1.5 + nSeed) * 0.015 * speedMult;
            const driftY = Math.cos(time * 1.2 + nSeed * 1.3) * 0.015 * speedMult;
            const driftZ = Math.sin(time * 1.8 + nSeed * 0.7) * 0.015 * speedMult;

            const targetVelX = dx + driftX;
            const targetVelY = dy + driftY;
            const targetVelZ = dz + driftZ;

            let ax = targetVelX - swarm.velX[i];
            let ay = targetVelY - swarm.velY[i];
            let az = targetVelZ - swarm.velZ[i];

            const accelMagSq = ax * ax + ay * ay + az * az;
            if (accelMagSq > maxAccelSq && accelMagSq > 1e-6) {
                const scale = maxAccel / Math.sqrt(accelMagSq);
                ax *= scale; ay *= scale; az *= scale;
            }

            swarm.velX[i] += ax;
            swarm.velY[i] += ay;
            swarm.velZ[i] += az;

            const speedSq = swarm.velX[i] * swarm.velX[i] + swarm.velY[i] * swarm.velY[i] + swarm.velZ[i] * swarm.velZ[i];
            if (speedSq > maxDispSq && speedSq > 1e-6) {
                const invSpd = activeMaxDisp / Math.sqrt(speedSq);
                swarm.velX[i] *= invSpd;
                swarm.velY[i] *= invSpd;
                swarm.velZ[i] *= invSpd;
            }

            swarm.posX[i] += swarm.velX[i];
            swarm.posY[i] += swarm.velY[i];
            swarm.posZ[i] += swarm.velZ[i];

            const distFromCenterSq = swarm.posX[i] * swarm.posX[i] + swarm.posY[i] * swarm.posY[i] + swarm.posZ[i] * swarm.posZ[i];
            if (distFromCenterSq > 196.0 && distFromCenterSq > 1e-6) {
                const inv = 14.0 / Math.sqrt(distFromCenterSq);
                swarm.posX[i] *= inv;
                swarm.posY[i] *= inv;
                swarm.posZ[i] *= inv;
            }

            const vx = swarm.posX[i] - prevX;
            const vy = swarm.posY[i] - prevY;
            const vz = swarm.posZ[i] - prevZ;
            if (vx * vx + vy * vy + vz * vz > 1e-8) {
                swarm.velX[i] += (vx - swarm.velX[i]) * 0.25;
                swarm.velY[i] += (vy - swarm.velY[i]) * 0.25;
                swarm.velZ[i] += (vz - swarm.velZ[i]) * 0.25;
            }

            // Inline Column-Major Orientation Matrix
            const s = swarm.size[i] * baseScale;
            const offset = i * 16;

            let zx = -swarm.velX[i];
            let zy = -swarm.velY[i];
            let zz = -swarm.velZ[i];
            let zLenSq = zx * zx + zy * zy + zz * zz;
            if (zLenSq < 1e-8) {
                zx = 0; zy = 0; zz = 1;
            } else {
                const invZ = 1.0 / Math.sqrt(zLenSq);
                zx *= invZ; zy *= invZ; zz *= invZ;
            }

            let xx = -zz;
            let xy = 0;
            let xz = zx;
            let xLenSq = xx * xx + xz * xz;
            if (xLenSq < 1e-8) {
                zx += 0.0001;
                const invZ = 1.0 / Math.sqrt(zx * zx + zy * zy + zz * zz);
                zx *= invZ; zy *= invZ; zz *= invZ;
                xx = -zz; xz = zx;
                xLenSq = xx * xx + xz * xz;
            }
            const invX = 1.0 / Math.sqrt(xLenSq);
            xx *= invX; xz *= invX;

            const yx = zy * xz;
            const yy = zz * xx - zx * xz;
            const yz = -zy * xx;

            matArray[offset + 0] = xx * s;
            matArray[offset + 1] = xy * s;
            matArray[offset + 2] = xz * s;
            matArray[offset + 3] = 0;

            matArray[offset + 4] = yx * s;
            matArray[offset + 5] = yy * s;
            matArray[offset + 6] = yz * s;
            matArray[offset + 7] = 0;

            matArray[offset + 8] = zx * s;
            matArray[offset + 9] = zy * s;
            matArray[offset + 10] = zz * s;
            matArray[offset + 11] = 0;

            matArray[offset + 12] = swarm.posX[i];
            matArray[offset + 13] = swarm.posY[i];
            matArray[offset + 14] = swarm.posZ[i];
            matArray[offset + 15] = 1;
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

        // 5. Liquid HSL Shortest-Arc Color Interpolation over 22.0 seconds
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

        if (lastSeed.current !== state.formationSeed || lastMode.current !== state.formationMode) {
            lastSeed.current = state.formationSeed;
            lastMode.current = state.formationMode;
            state.transitionStartTime = time;
        }

        const colorElapsed = Math.max(0.0, time - colorTransitionStartTime.current);
        const colorP = Math.min(1.0, colorElapsed / 22.0);
        const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

        const hsl1 = { h: 0, s: 0, l: 0 };
        const hsl2 = { h: 0, s: 0, l: 0 };

        let colorsChanged = false;
        for (let s = 0; s < 4; s++) {
            const prevHex = currentColors.current[s].getHex();
            
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

            if (currentColors.current[s].getHex() !== prevHex) {
                colorsChanged = true;
            }
        }

        // Direct GPU Palette Uniform Upload (0ms CPU time)
        customUniforms.current.uSpeciesColors.value[0].copy(currentColors.current[0]);
        customUniforms.current.uSpeciesColors.value[1].copy(currentColors.current[1]);
        customUniforms.current.uSpeciesColors.value[2].copy(currentColors.current[2]);
        customUniforms.current.uSpeciesColors.value[3].copy(currentColors.current[3]);

        // 5. Formation-Aware Cinematic Camera Choreography
        if (boidCount > 0) {
            let sumX = 0, sumY = 0, sumZ = 0;
            const sampleStep = Math.max(1, Math.floor(boidCount / 100));
            let samples = 0;
            for (let i = 0; i < boidCount; i += sampleStep) {
                sumX += swarm.posX[i];
                sumY += swarm.posY[i];
                sumZ += swarm.posZ[i];
                samples++;
            }
            const centerX = samples > 0 ? sumX / samples : 0;
            const centerY = samples > 0 ? sumY / samples : 0;
            const centerZ = samples > 0 ? sumZ / samples : 0;

            const dists: number[] = [];
            for (let i = 0; i < boidCount; i += sampleStep) {
                const dx = swarm.posX[i] - centerX;
                const dy = swarm.posY[i] - centerY;
                const dz = swarm.posZ[i] - centerZ;
                dists.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
            }
            dists.sort((a, b) => a - b);
            const p70Index = Math.min(dists.length - 1, Math.floor(dists.length * 0.70));
            const r70 = dists.length > 0 ? dists[p70Index] : 6.0;
            const targetRadius = Math.max(3.0, r70);

            const perspCam = stateContext.camera as THREE.PerspectiveCamera;
            const fovRad = (perspCam.fov || 75) * (Math.PI / 180);
            const requiredDist = (targetRadius / Math.sin(fovRad / 2)) * 0.58;
            const baseDist = THREE.MathUtils.clamp(requiredDist, 4.5, 16.0);

            smoothCenter.current.lerp(new THREE.Vector3(centerX, centerY, centerZ), 0.015);
            smoothDistance.current = THREE.MathUtils.lerp(smoothDistance.current, baseDist, 0.012);

            // Formation category driven angle and pitch
            const cat = getCameraCategory(state.formationMode);
            state.cameraCategory = cat;

            // Target camera parameter goals per topology (Closer, more intimate & immersive)
            let targetPitchCenter = 0.25;
            let targetPitchAmp = 0.38; // Dramatic pitch sweep looking up and down
            let targetDistScale = 0.68;
            let targetOrbitSpeed = 0.045; // Continuous 360° rotation speed
            let targetYOffsetAmp = 4.5; // Controlled vertical amplitude to keep focus tight

            switch (cat) {
                case 'portrait':
                    targetOrbitSpeed = 0.035;
                    targetPitchCenter = 0.15;
                    targetPitchAmp = 0.30;
                    targetDistScale = 0.62;
                    targetYOffsetAmp = 4.0;
                    break;
                case 'tunnel':
                    targetOrbitSpeed = 0.050;
                    targetPitchCenter = 0.50; // Vertical spiral & helical tunnel perspective
                    targetPitchAmp = 0.35;
                    targetDistScale = 0.65;
                    targetYOffsetAmp = 5.0;
                    break;
                case 'overhead':
                    targetOrbitSpeed = 0.038;
                    targetPitchCenter = 0.55; // Plan view diving into layers
                    targetPitchAmp = 0.30;
                    targetDistScale = 0.75;
                    targetYOffsetAmp = 4.5;
                    break;
                case 'cinematic_sweep':
                    targetOrbitSpeed = 0.045;
                    targetPitchCenter = 0.20;
                    targetPitchAmp = 0.38;
                    targetDistScale = 0.68;
                    targetYOffsetAmp = 5.0;
                    break;
                case 'dynamic_burst':
                    targetOrbitSpeed = 0.048;
                    targetPitchCenter = 0.26;
                    targetPitchAmp = 0.35;
                    targetDistScale = 0.64;
                    targetYOffsetAmp = 4.0;
                    break;
                case 'orbit_wide':
                    targetOrbitSpeed = 0.040;
                    targetPitchCenter = 0.30;
                    targetPitchAmp = 0.30;
                    targetDistScale = 0.80;
                    targetYOffsetAmp = 4.0;
                    break;
                case 'intimate_close':
                    targetOrbitSpeed = 0.030;
                    targetPitchCenter = 0.20;
                    targetPitchAmp = 0.25;
                    targetDistScale = 0.50;
                    targetYOffsetAmp = 3.2;
                    break;
                default: // chaotic
                    targetOrbitSpeed = 0.042;
                    targetPitchCenter = 0.25;
                    targetPitchAmp = 0.35;
                    targetDistScale = 0.68;
                    targetYOffsetAmp = 4.5;
                    break;
            }

            // Camera Mood overlay modulation
            if (state.cameraMood === 'intimate_close') targetDistScale *= 0.75;
            if (state.cameraMood === 'orbit_wide') targetDistScale *= 1.15;
            if (state.cameraMood === 'overhead_iso') targetPitchCenter = 0.65;

            // Silky smooth exponential parameter glide (~6-8s gradual transition, zero abrupt cuts)
            curPitchCenter.current = THREE.MathUtils.lerp(curPitchCenter.current, targetPitchCenter, 0.010);
            curPitchAmp.current = THREE.MathUtils.lerp(curPitchAmp.current, targetPitchAmp, 0.010);
            curDistScale.current = THREE.MathUtils.lerp(curDistScale.current, targetDistScale, 0.010);
            curSweepSpeed.current = THREE.MathUtils.lerp(curSweepSpeed.current, targetOrbitSpeed, 0.010);
            curYOffset.current = THREE.MathUtils.lerp(curYOffset.current, targetYOffsetAmp, 0.010);

            // 1. Continuous 360° Orbital Revolution with subtle multi-frequency harmonic flow
            const camAngle = (time * curSweepSpeed.current) + Math.sin(time * 0.035) * 0.25;

            // 2. Full Formation Reveal Window (Guarantees user sees entire formation for 2.5-3.5 seconds)
            const formElapsed = state.transitionStartTime ? Math.max(0, time - state.transitionStartTime) : 10.0;
            const transDur = state.transitionDuration || 9.0;
            
            // Peak reveal when morph completes (from transDur to transDur + 3.5s)
            let revealBoost = 1.0;
            if (formElapsed >= transDur - 0.5 && formElapsed <= transDur + 3.5) {
                const revealProgress = (formElapsed - (transDur - 0.5)) / 4.0; // 0 -> 1
                revealBoost += Math.sin(revealProgress * Math.PI) * 0.50; // Smooth 1.0 -> 1.50 -> 1.0 reveal
            }

            // Periodic overview reveal every ~26 seconds for 3 seconds
            const periodicPhase = (time % 26.0);
            if (periodicPhase < 3.2) {
                const pProg = Math.sin((periodicPhase / 3.2) * Math.PI);
                revealBoost = Math.max(revealBoost, 1.0 + pProg * 0.45);
            }

            // 3. Engaging Vertical Swoop (Going down looking up, climbing high looking down)
            const verticalCycle = Math.sin(time * 0.082) + Math.sin(time * 0.038) * 0.35;
            // During full formation reveal, tone down vertical offset slightly so the full structure is centered
            const yOffset = verticalCycle * (curYOffset.current / (revealBoost > 1.1 ? 1.6 : 1.0));
            
            // Pitch tilts down (+angle) when camera is high, tilts up (-angle) when camera is low!
            const camPitch = curPitchCenter.current + (verticalCycle * curPitchAmp.current * 0.85);

            // 4. Dynamic Focal Distance Breathing with Full Formation Reveal
            const zoomMod = 0.78 + Math.sin(time * 0.055) * 0.12 + Math.cos(time * 0.11) * 0.05;
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
                smoothCamTarget.current.lerp(rawGoal, 0.014);
                smoothLookTarget.current.lerp(smoothCenter.current, 0.016);

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

    // 6 Ultra-Fast, Low-Poly, Hard-Edged 3D Geometries
    const geometries = useMemo(() => {
        const g0 = new THREE.ConeGeometry(0.16, 0.5, 3);
        g0.rotateX(Math.PI / 2);

        const g1 = new THREE.OctahedronGeometry(0.22, 0);
        g1.scale(0.8, 0.8, 1.4);

        const g2 = new THREE.ConeGeometry(0.18, 0.48, 4);
        g2.rotateX(Math.PI / 2);

        const g3 = new THREE.ConeGeometry(0.2, 0.45, 6);
        g3.rotateX(Math.PI / 2);

        const g4 = new THREE.CylinderGeometry(0.02, 0.22, 0.45, 4);
        g4.rotateX(Math.PI / 2);
        g4.scale(1.3, 0.5, 1.0);

        const g5 = new THREE.TetrahedronGeometry(0.2, 0);
        g5.scale(0.7, 0.7, 1.5);

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

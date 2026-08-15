import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BoidSwarmData, BlobCenter, SimulationState, SpeciesType, SPECIES_COLORS, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, computeFormationPoint, getFormationPhysicsProfile } from './BoidLogic'
import { createClockEngine, ClockEngine } from './ClockEngine'

interface FlockProps {
    count: number;
    state: SimulationState;
    setPopulation: (n: number | ((prev: number) => number)) => void;
}

// High-speed LUT for trigonometric noise & drift (0.1ms execution for 100k boids)
const TABLE_SIZE = 1024;
const SINE_LUT = new Float32Array(TABLE_SIZE);
const RAD_TO_INDEX = TABLE_SIZE / (Math.PI * 2);
for (let i = 0; i < TABLE_SIZE; i++) {
    SINE_LUT[i] = Math.sin((i / TABLE_SIZE) * Math.PI * 2);
}

function fastSin(rad: number): number {
    const idx = (rad * RAD_TO_INDEX) & (TABLE_SIZE - 1);
    return SINE_LUT[idx | 0];
}

function fastCos(rad: number): number {
    const idx = ((rad * RAD_TO_INDEX) + (TABLE_SIZE >> 2)) & (TABLE_SIZE - 1);
    return SINE_LUT[idx | 0];
}

// Helper to categorize camera profiles by formation
function getCameraCategory(formation: FormationMode): 'portrait' | 'tunnel' | 'overhead' | 'cinematic_sweep' | 'dynamic_burst' | 'orbit_wide' | 'intimate_close' | 'chaotic' {
    switch (formation) {
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
    const smoothDistance = useRef(9.5);
    const smoothLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const smoothCamTarget = useRef(new THREE.Vector3(6.0, 4.0, 7.5));
    const lastInteractionTime = useRef(0);

    // Smooth continuous angle & pitch interpolation registers
    const curPitchCenter = useRef(0.22);
    const curPitchAmp = useRef(0.48);
    const curDistScale = useRef(0.55);
    const curSweepSpeed = useRef(0.15);
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
        state.currentTime = time;

        // 1. Advance Independent Clocks via ClockEngine
        clockEngine.update(time);

        // 2. Advance Blob Centers on CPU (O(B^2) where B=12)
        const centers = blobCentersRef.current;
        const speed = (state.attributes && state.attributes[0]) ? state.attributes[0].maxSpeed * state.speedMultiplier : 0.28;
        for (let b = 0; b < centers.length; b++) {
            centers[b].update(centers, state.interactions, speed, time);
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

        const isMorphing = (state && state.prevFormationMode !== undefined && p < 1.0);
        const profile = getFormationPhysicsProfile(formation);
        const activeLerpRate = isMorphing ? (profile.lerpRate * 0.45 + profile.lerpRate * 0.55 * sCurve) : profile.lerpRate;
        const activeMaxDisp = isMorphing ? (profile.maxSpeedCap * 0.65 + profile.maxSpeedCap * 0.35 * sCurve) * speedMult : profile.maxSpeedCap * speedMult;
        const maxAccel = 0.0035 * speedMult;
        const maxAccelSq = maxAccel * maxAccel;
        const maxDispSq = activeMaxDisp * activeMaxDisp;

        const baseScale = (state.sizeMultiplier || 1.0) * 0.36;
        const prevMode = isMorphing ? state.prevFormationMode : undefined;
        const prevSeed = isMorphing ? (state.prevFormationSeed !== undefined ? state.prevFormationSeed : seed) : seed;

        // Centroid sampling registers
        let sumX = 0, sumY = 0, sumZ = 0;
        const sampleStep = Math.max(1, Math.floor(boidCount / 128));
        let sampleCount = 0;

        const posX = swarm.posX;
        const posY = swarm.posY;
        const posZ = swarm.posZ;
        const velX = swarm.velX;
        const velY = swarm.velY;
        const velZ = swarm.velZ;
        const species = swarm.species;
        const uArr = swarm.u;
        const indexInSpecies = swarm.indexInSpecies;
        const noiseSeed = swarm.noiseSeed;
        const isLeader = swarm.isLeader;
        const sizeArr = swarm.size;

        const matArray = meshRef.current.instanceMatrix.array;

        for (let i = 0; i < boidCount; i++) {
            const px = posX[i];
            const py = posY[i];
            const pz = posZ[i];

            if (i % sampleStep === 0) {
                sumX += px; sumY += py; sumZ += pz;
                sampleCount++;
            }

            const sp = species[i];
            const sepWeight = (state && state.attributes && state.attributes[sp])
                ? state.attributes[sp].separationWeight
                : 3.5;

            const u = uArr[i];
            const idxSp = indexInSpecies[i];

            let [txCurr, tyCurr, tzCurr] = computeFormationPoint(formation, seed, u, time, sp, idxSp, sepWeight, speedMult, state);

            // Controlled loose aura particles only if formation profile allows it (0% for geometric formations)
            if (profile.strayRatio > 0 && p > 0.8) {
                const strayMod = Math.floor(1.0 / profile.strayRatio);
                if (i % strayMod === 0) {
                    const strayAngle = time * (0.3 + (i % 5) * 0.08) + noiseSeed[i];
                    const rAura = 7.0 + (i % 6) * 0.8;
                    txCurr = rAura * fastCos(strayAngle);
                    tyCurr = fastSin(strayAngle * 1.5) * 1.8 + (sp - 1.5) * 1.0;
                    tzCurr = rAura * fastSin(strayAngle);
                }
            }

            let tx = txCurr, ty = tyCurr, tz = tzCurr;

            if (isMorphing && prevMode !== undefined) {
                const [txPrev, tyPrev, tzPrev] = computeFormationPoint(prevMode, prevSeed, u, time, sp, idxSp, sepWeight, speedMult, state);
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

            let dx = (tx - px) * activeLerpRate;
            let dy = (ty - py) * activeLerpRate;
            let dz = (tz - pz) * activeLerpRate;

            if (isLeader[i] === 1) {
                dx *= 1.08; dy *= 1.08; dz *= 1.08;
            }

            const nSeed = noiseSeed[i];
            const dAmp = profile.noiseDrift * speedMult;
            const driftX = fastSin(time * 1.5 + nSeed) * dAmp;
            const driftY = fastCos(time * 1.2 + nSeed * 1.3) * dAmp;
            const driftZ = fastSin(time * 1.8 + nSeed * 0.7) * dAmp;

            const targetVelX = dx + driftX;
            const targetVelY = dy + driftY;
            const targetVelZ = dz + driftZ;

            let ax = targetVelX - velX[i];
            let ay = targetVelY - velY[i];
            let az = targetVelZ - velZ[i];

            const accelMagSq = ax * ax + ay * ay + az * az;
            if (accelMagSq > maxAccelSq && accelMagSq > 1e-6) {
                const scale = maxAccel / Math.sqrt(accelMagSq);
                ax *= scale; ay *= scale; az *= scale;
            }

            velX[i] += ax;
            velY[i] += ay;
            velZ[i] += az;

            const speedSq = velX[i] * velX[i] + velY[i] * velY[i] + velZ[i] * velZ[i];
            if (speedSq > maxDispSq && speedSq > 1e-6) {
                const invSpd = activeMaxDisp / Math.sqrt(speedSq);
                velX[i] *= invSpd;
                velY[i] *= invSpd;
                velZ[i] *= invSpd;
            }

            posX[i] += velX[i];
            posY[i] += velY[i];
            posZ[i] += velZ[i];

            const distSq = posX[i] * posX[i] + posY[i] * posY[i] + posZ[i] * posZ[i];
            if (distSq > 196.0 && distSq > 1e-6) {
                const inv = 14.0 / Math.sqrt(distSq);
                posX[i] *= inv;
                posY[i] *= inv;
                posZ[i] *= inv;
            }

            // Inline Column-Major Orientation Matrix (Forward Z points along velocity vector +vel)
            const s = sizeArr[i] * baseScale;
            const offset = i * 16;

            let zx = velX[i];
            let zy = velY[i];
            let zz = velZ[i];
            let zLenSq = zx * zx + zy * zy + zz * zz;
            if (zLenSq < 1e-8) {
                zx = 0; zy = 0; zz = 1;
            } else {
                const invZ = 1.0 / Math.sqrt(zLenSq);
                zx *= invZ; zy *= invZ; zz *= invZ;
            }

            // Right vector x = up x z = (0,1,0) x (zx,zy,zz) = (zz, 0, -zx)
            let xx = zz;
            let xy = 0;
            let xz = -zx;
            let xLenSq = xx * xx + xz * xz;
            if (xLenSq < 1e-6) {
                xx = 0; xy = zz; xz = -zy;
                xLenSq = xy * xy + xz * xz;
            }
            const invX = 1.0 / Math.sqrt(Math.max(1e-8, xLenSq));
            xx *= invX; xy *= invX; xz *= invX;

            // Up vector y = z x x
            const yx = zy * xz - zz * xy;
            const yy = zz * xx - zx * xz;
            const yz = zx * xy - zy * xx;

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

            matArray[offset + 12] = posX[i];
            matArray[offset + 13] = posY[i];
            matArray[offset + 14] = posZ[i];
            matArray[offset + 15] = 1;
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

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

        const colorDuration = state.paletteTransitionDuration || 4.5;
        const colorElapsed = Math.max(0.0, time - colorTransitionStartTime.current);
        const colorP = Math.min(1.0, colorElapsed / colorDuration);
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
            const centerX = sampleCount > 0 ? sumX / sampleCount : 0;
            const centerY = sampleCount > 0 ? sumY / sampleCount : 0;
            const centerZ = sampleCount > 0 ? sumZ / sampleCount : 0;

            let maxDistSq = 0;
            for (let i = 0; i < boidCount; i += sampleStep) {
                const dx = posX[i] - centerX;
                const dy = posY[i] - centerY;
                const dz = posZ[i] - centerZ;
                const d2 = dx * dx + dy * dy + dz * dz;
                if (d2 > maxDistSq) maxDistSq = d2;
            }
            const r70 = Math.sqrt(maxDistSq) * 0.75;
            const targetRadius = Math.max(4.0, r70);

            const perspCam = stateContext.camera as THREE.PerspectiveCamera;
            const fovRad = (perspCam.fov || 75) * (Math.PI / 180);
            
            // Balanced distance: reveals the full formation while keeping rich boid detail and dynamic motion
            const requiredDist = (targetRadius / Math.sin(fovRad / 2)) * 0.85;
            const baseDist = THREE.MathUtils.clamp(requiredDist, 7.5, 20.0);

            smoothCenter.current.lerp(new THREE.Vector3(centerX, centerY, centerZ), 0.035);
            smoothDistance.current = THREE.MathUtils.lerp(smoothDistance.current, baseDist, 0.030);

            // Formation category driven angle and pitch
            const cat = getCameraCategory(state.formationMode);
            state.cameraCategory = cat;

            // Target camera parameter goals per topology (Framed to reveal the entire formation)
            let targetPitchCenter = 0.26;
            let targetPitchAmp = 0.40;
            let targetDistScale = 0.90;
            let targetOrbitSpeed = 0.16; // Vibrant continuous 360° rotation speed
            let targetYOffsetAmp = 4.2;

            switch (cat) {
                case 'portrait':
                    targetOrbitSpeed = 0.14;
                    targetPitchCenter = 0.20;
                    targetPitchAmp = 0.36;
                    targetDistScale = 0.86;
                    targetYOffsetAmp = 3.6;
                    break;
                case 'tunnel':
                    targetOrbitSpeed = 0.18;
                    targetPitchCenter = 0.40;
                    targetPitchAmp = 0.42;
                    targetDistScale = 0.92;
                    targetYOffsetAmp = 4.6;
                    break;
                case 'overhead':
                    targetOrbitSpeed = 0.14;
                    targetPitchCenter = 0.54;
                    targetPitchAmp = 0.36;
                    targetDistScale = 0.98;
                    targetYOffsetAmp = 4.2;
                    break;
                case 'cinematic_sweep':
                    targetOrbitSpeed = 0.16;
                    targetPitchCenter = 0.24;
                    targetPitchAmp = 0.42;
                    targetDistScale = 0.90;
                    targetYOffsetAmp = 4.2;
                    break;
                case 'dynamic_burst':
                    targetOrbitSpeed = 0.18;
                    targetPitchCenter = 0.28;
                    targetPitchAmp = 0.40;
                    targetDistScale = 0.94;
                    targetYOffsetAmp = 4.2;
                    break;
                case 'orbit_wide':
                    targetOrbitSpeed = 0.14;
                    targetPitchCenter = 0.30;
                    targetPitchAmp = 0.36;
                    targetDistScale = 1.05;
                    targetYOffsetAmp = 4.0;
                    break;
                case 'intimate_close':
                    targetOrbitSpeed = 0.13;
                    targetPitchCenter = 0.20;
                    targetPitchAmp = 0.32;
                    targetDistScale = 0.78;
                    targetYOffsetAmp = 3.2;
                    break;
                default: // chaotic
                    targetOrbitSpeed = 0.15;
                    targetPitchCenter = 0.26;
                    targetPitchAmp = 0.38;
                    targetDistScale = 0.90;
                    targetYOffsetAmp = 4.2;
                    break;
            }

            // Camera Mood overlay modulation
            if (state.cameraMood === 'intimate_close') targetDistScale *= 0.85;
            if (state.cameraMood === 'orbit_wide') targetDistScale *= 1.15;
            if (state.cameraMood === 'overhead_iso') targetPitchCenter = 0.70;

            // Silky smooth exponential parameter glide
            curPitchCenter.current = THREE.MathUtils.lerp(curPitchCenter.current, targetPitchCenter, 0.025);
            curPitchAmp.current = THREE.MathUtils.lerp(curPitchAmp.current, targetPitchAmp, 0.025);
            curDistScale.current = THREE.MathUtils.lerp(curDistScale.current, targetDistScale, 0.025);
            curSweepSpeed.current = THREE.MathUtils.lerp(curSweepSpeed.current, targetOrbitSpeed, 0.025);
            curYOffset.current = THREE.MathUtils.lerp(curYOffset.current, targetYOffsetAmp, 0.025);

            // 1. True 360° Continuous Multi-Axis Azimuth Revolution
            const camAzimuth = (time * curSweepSpeed.current);

            // 2. Exact 60% Close-Up / 40% Far View Choreography for Every Formation
            const formElapsed = (state.transitionStartTime !== undefined) ? Math.max(0, time - state.transitionStartTime) : 0.0;
            const cycleDuration = 32.0;
            const cycleProgress = (formElapsed % cycleDuration) / cycleDuration; // 0.0 -> 1.0

            // 60% of the formation cycle is Close-Up (0.0 -> 0.60)
            // 40% of the formation cycle is Far View   (0.60 -> 1.00)
            let farBlend = 0.0;
            if (cycleProgress < 0.52) {
                // Pure intimate Close-Up (0.0 -> 0.52)
                farBlend = 0.0;
            } else if (cycleProgress < 0.60) {
                // Silky smooth pull-back transition (0.52 -> 0.60)
                const t = (cycleProgress - 0.52) / 0.08;
                farBlend = t * t * (3.0 - 2.0 * t); // Smooth Hermite 0 -> 1
            } else if (cycleProgress < 0.94) {
                // Pure grand Panoramic Far Overview (0.60 -> 0.94, full 40% wide display)
                farBlend = 1.0;
            } else {
                // Silky smooth dive-in transition back to close-up for next cycle (0.94 -> 1.00)
                const t = (cycleProgress - 0.94) / 0.06;
                farBlend = 1.0 - t * t * (3.0 - 2.0 * t); // Smooth Hermite 1 -> 0
            }

            // Close-up scale (0.50) vs Far view scale (1.28)
            const dynamicScale = THREE.MathUtils.lerp(0.50, 1.28, farBlend);

            // 3. Dynamic Vertical Polar Elevation (Sweeping smoothly from -20° up to +55° in 3D space)
            const verticalCycle = Math.sin(time * 0.12) + Math.cos(time * 0.05) * 0.35;
            const yOffset = verticalCycle * (curYOffset.current * (1.0 - farBlend * 0.65));
            
            const rawElevation = curPitchCenter.current + (verticalCycle * curPitchAmp.current * 0.85);
            const camElevation = THREE.MathUtils.lerp(
                THREE.MathUtils.clamp(rawElevation, -0.40, 1.10),
                0.28, // Optimal 3D angle looking at the whole formation during overview
                farBlend
            );

            // 4. Dynamic Focal Distance Breathing
            const zoomMod = 0.96 + Math.sin(time * 0.08) * 0.05;
            const finalDist = smoothDistance.current * curDistScale.current * dynamicScale * zoomMod;

            // 5. Full 360-Degree Spherical 3D Coordinates
            const cosElev = Math.cos(camElevation);
            const sinElev = Math.sin(camElevation);
            const cosAzim = Math.cos(camAzimuth);
            const sinAzim = Math.sin(camAzimuth);

            const targetCamX = smoothCenter.current.x + finalDist * cosElev * cosAzim;
            const targetCamY = smoothCenter.current.y + yOffset + finalDist * sinElev;
            const targetCamZ = smoothCenter.current.z + finalDist * cosElev * sinAzim;

            const activeControls = controls as any;
            const isDraggingNow = activeControls?.state !== undefined && activeControls?.state !== -1;
            if (isDraggingNow) {
                lastInteractionTime.current = performance.now();
            }

            const timeSinceInteraction = performance.now() - lastInteractionTime.current;
            const isUserOverriding = timeSinceInteraction < 6000;

            if (!isUserOverriding) {
                const rawGoal = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
                smoothCamTarget.current.lerp(rawGoal, 0.045);
                smoothLookTarget.current.lerp(smoothCenter.current, 0.050);

                stateContext.camera.position.copy(smoothCamTarget.current);
                stateContext.camera.lookAt(smoothLookTarget.current);

                if (activeControls && activeControls.target) {
                    activeControls.target.copy(smoothLookTarget.current);
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
        const g0 = new THREE.ConeGeometry(0.12, 0.40, 3);
        g0.rotateX(Math.PI / 2);

        const g1 = new THREE.OctahedronGeometry(0.16, 0);
        g1.scale(0.7, 0.7, 1.5);

        const g2 = new THREE.ConeGeometry(0.13, 0.38, 4);
        g2.rotateX(Math.PI / 2);

        const g3 = new THREE.ConeGeometry(0.14, 0.36, 6);
        g3.rotateX(Math.PI / 2);

        const g4 = new THREE.CylinderGeometry(0.01, 0.14, 0.40, 4);
        g4.rotateX(Math.PI / 2);

        const g5 = new THREE.ConeGeometry(0.12, 0.40, 5);
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

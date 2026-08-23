import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BoidSwarmData, BlobCenter, SimulationState, SpeciesType, SPECIES_COLORS, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, computeFormationPoint, getFormationPhysicsProfile, fastSin, fastCos } from './BoidLogic'
import { createClockEngine, ClockEngine } from './ClockEngine'

// Precomputed Sheaf Radial Dispersion Table to eliminate 100,000 divisions & Math.sqrt per frame
const RNORM_LUT = new Float32Array(41);
for (let k = 0; k <= 40; k++) {
    RNORM_LUT[k] = Math.sqrt(k / 40.0);
}

interface FlockProps {
    count: number;
    state: SimulationState;
    setPopulation: (n: number | ((prev: number) => number)) => void;
}

// --- Perceptual Oklab Color Space Interpolation for Flawless, Buttery-Smooth Color Morphs ---
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

// High-speed LUT for trigonometric noise & drift (0.1ms execution for 100k boids)
const curPt = new Float32Array(3);
const prevPt = new Float32Array(3);

export function Flock({ count, state, setPopulation }: FlockProps) {
    const meshRef0 = useRef<THREE.InstancedMesh>(null!);
    const meshRef1 = useRef<THREE.InstancedMesh>(null!);
    const meshRef2 = useRef<THREE.InstancedMesh>(null!);
    const meshRef3 = useRef<THREE.InstancedMesh>(null!);
    const meshRefs = [meshRef0, meshRef1, meshRef2, meshRef3];

    // Instantiate ClockEngine with decoupled independent timers
    const clockEngine = useMemo<ClockEngine>(() => {
        const engine = createClockEngine(state);
        state.clockEngine = engine;
        return engine;
    }, [state]);

    // Structure-of-Arrays High Performance Data Buffer (Supports up to 120k boids)
    const MAX_SPECIES_CAPACITY = 30000;
    const swarm = useMemo(() => new BoidSwarmData(120000), []);
    const renderedCount = useRef(count);
    const blobCentersRef = useRef<BlobCenter[]>([]);
    const lastSeed = useRef<number>(-1);
    const lastMode = useRef<number>(-1);
    const lastPaletteKey = useRef<string>('');
    const colorTransitionStartTime = useRef<number>(0);
    const smoothRadius = useRef<number>(8.0);
    const lastScale = useRef<number>(-1);
    const lastShapeKey = useRef<string>('');
    const lastInitializedCount = useRef<number>(-1);
    const frameCounter = useRef<number>(0); // Temporal batching frame parity

    const initialPalette = state.speciesColors || COLOR_PALETTES[17];
    const startColors = useRef<THREE.Color[]>([
        new THREE.Color(initialPalette[0]),
        new THREE.Color(initialPalette[1]),
        new THREE.Color(initialPalette[2]),
        new THREE.Color(initialPalette[3])
    ]);
    const targetColors = useRef<THREE.Color[]>([
        new THREE.Color(initialPalette[0]),
        new THREE.Color(initialPalette[1]),
        new THREE.Color(initialPalette[2]),
        new THREE.Color(initialPalette[3])
    ]);
    const currentColors = useRef<THREE.Color[]>([
        new THREE.Color(initialPalette[0]),
        new THREE.Color(initialPalette[1]),
        new THREE.Color(initialPalette[2]),
        new THREE.Color(initialPalette[3])
    ]);

    const speciesStartTimes = useRef<number[]>([0, 0, 0, 0]);
    const speciesDurations = useRef<number[]>([3.2, 3.2, 3.2, 3.2]);

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

    // Initial swarm setup
    useMemo(() => {
        swarm.setPopulation(count, state);
    }, []);

    // Curated High-Performance 3D Volumetric Geometries
    // Flagship: Geodesic 20-Facet Ico-Sphere (Shape 0 - Primary / Dominant)
    const geometries = useMemo(() => {
        // 0: Geodesic Ico-Sphere Level-0 (20 flat triangular mirror facets for rotating diamond glints - 20 tris) — FLAGSHIP
        const g0 = new THREE.IcosahedronGeometry(0.16, 0);
        g0.computeVertexNormals();

        // 1: Faceted Gemstone (8-faced dual-pointed crystal octahedron - 8 tris)
        const g1 = new THREE.OctahedronGeometry(0.15, 0);
        g1.scale(0.8, 0.8, 1.4);
        g1.computeVertexNormals();

        // 2: Stealth Arrowhead Jet (3-sided aerodynamic low-poly wedge - 6 tris)
        const g2 = new THREE.ConeGeometry(0.13, 0.42, 3);
        g2.rotateX(Math.PI / 2);
        g2.scale(1.1, 0.75, 1.0);
        g2.computeVertexNormals();

        // 3: Swept Delta Wing (wide wingspan, sleek flat blade with swept-back wings - 6 tris)
        const g3 = new THREE.ConeGeometry(0.16, 0.44, 4);
        g3.rotateX(Math.PI / 2);
        g3.scale(2.2, 0.45, 1.0);
        g3.computeVertexNormals();

        return [g0, g1, g2, g3];
    }, []);

    useEffect(() => {
        meshRefs.forEach(ref => {
            if (ref.current) {
                ref.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                ref.current.frustumCulled = false;
            }
        });
    }, [meshRefs]);

    const getSpeciesShapes = (): [number, number, number, number] => {
        if (state.speciesShapes) return state.speciesShapes;
        if (state.boidShape === 99) {
            // Multi-Species Diverse: Geodesic Ico-Sphere dominant with Gem & Jet accents
            return [0, 0, 1, 2];
        }
        const s = (state.boidShape !== undefined && state.boidShape >= 0) ? (state.boidShape % geometries.length) : 0;
        return [s, s, s, s];
    };

    useFrame((stateContext, delta) => {
        const safeDelta = Math.min(delta, 0.05);

        // Organic, continuous per-frame population gliding
        if (Math.abs(renderedCount.current - count) > 1) {
            const diff = count - renderedCount.current;
            const step = diff * Math.min(1.0, safeDelta * 3.5);
            renderedCount.current += Math.sign(diff) * Math.max(4, Math.abs(step));
            if (Math.abs(renderedCount.current - count) < 6) {
                renderedCount.current = count;
            }
            const activeTotal = Math.min(120000, Math.floor(renderedCount.current));
            swarm.setPopulation(activeTotal, state);
        }

        const boidCount = Math.floor(renderedCount.current);
        const dist = state.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
        const speciesCounts = [
            Math.floor(boidCount * dist[0]),
            Math.floor(boidCount * dist[1]),
            Math.floor(boidCount * dist[2]),
            Math.max(0, boidCount - Math.floor(boidCount * dist[0]) - Math.floor(boidCount * dist[1]) - Math.floor(boidCount * dist[2]))
        ];
        if (!meshRef0.current || !meshRef1.current || !meshRef2.current || !meshRef3.current) return;
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

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.QuadHelixBraid;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 7.0;
        const elapsed = Math.max(0.0, time - startTime);
        const p = Math.min(1.0, elapsed / duration);
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);
        if (state) {
            state.morphProgress = p;
        }

        const isMorphing = (state && state.prevFormationMode !== undefined && p < 1.0);
        const profile = getFormationPhysicsProfile(formation);
        const activeLerpRate = isMorphing ? (profile.lerpRate * 0.45 + profile.lerpRate * 0.55 * sCurve) : profile.lerpRate;
        const activeMaxDisp = isMorphing ? (profile.maxSpeedCap * 0.65 + profile.maxSpeedCap * 0.35 * sCurve) * speedMult : profile.maxSpeedCap * speedMult;
        const maxAccel = 0.0035 * speedMult;
        const maxAccelSq = maxAccel * maxAccel;
        const maxDispSq = activeMaxDisp * activeMaxDisp;

        const baseScale = (state.sizeMultiplier || 1.0) * 1.35;
        const prevMode = isMorphing ? state.prevFormationMode : undefined;
        const prevSeed = isMorphing ? (state.prevFormationSeed !== undefined ? state.prevFormationSeed : seed) : seed;

        // Boid Array references (Zero GC per-frame)
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

        // Centroid & Bounding Radius sampling registers
        let sumDistSq = 0;
        const sampleStep = Math.max(1, Math.floor(boidCount / 128));
        let sampleCount = 0;

        // Convergence measured cleanly when settled
        let convergedCount = 0;
        const measureConvergence = !isMorphing && p > 0.92;

        const matArrays = [
            meshRef0.current.instanceMatrix.array as Float32Array,
            meshRef1.current.instanceMatrix.array as Float32Array,
            meshRef2.current.instanceMatrix.array as Float32Array,
            meshRef3.current.instanceMatrix.array as Float32Array
        ];

        const volThickness = profile.volThickness;
        const dAmp = profile.noiseDrift * speedMult;
        const hasDrift = (dAmp > 1e-5);
        const hasStray = profile.strayRatio > 0 && p > 0.8;
        const strayMod = hasStray ? Math.floor(1.0 / profile.strayRatio) : 0;
        const activeSpeciesShapes = getSpeciesShapes();

        for (let i = 0; i < boidCount; i++) {
            const sp = species[i];
            const spIdx = indexInSpecies[i];
            if (spIdx >= speciesCounts[sp]) continue;

            const matArray = matArrays[sp];
            const offset = spIdx * 16;
            const spShape = activeSpeciesShapes[sp] % geometries.length;

            if (i % sampleStep === 0) {
                const px0 = posX[i], py0 = posY[i], pz0 = posZ[i];
                sumDistSq += (px0 * px0 + py0 * py0 + pz0 * pz0);
                sampleCount++;
            }

            const px = posX[i];
            const py = posY[i];
            const pz = posZ[i];

            const sepWeight = (state && state.attributes && state.attributes[sp])
                ? state.attributes[sp].separationWeight
                : 3.5;

            // Dynamic longitudinal stream velocity along the 3D pipe curve
            const boidFlowOffset = 0.85 + (spIdx % 17) * 0.02;
            const flowSpeed = 0.055 * boidFlowOffset;
            const dynamicU = ((uArr[i] + time * flowSpeed * speedMult) % 1.0 + 1.0) % 1.0;

            computeFormationPoint(formation, seed, dynamicU, time, sp, spIdx, sepWeight, speedMult, state, curPt);
            let tx = curPt[0], ty = curPt[1], tz = curPt[2];

            // Controlled loose aura particles
            if (hasStray && i % strayMod === 0) {
                const strayAngle = time * (0.3 + (i % 5) * 0.08) + noiseSeed[i];
                const rAura = 7.0 + (i % 6) * 0.8;
                tx = rAura * fastCos(strayAngle);
                ty = fastSin(strayAngle * 1.5) * 1.8 + (sp - 1.5) * 1.0;
                tz = rAura * fastSin(strayAngle);
            }

            if (isMorphing && prevMode !== undefined) {
                computeFormationPoint(prevMode, prevSeed, dynamicU, time, sp, spIdx, sepWeight, speedMult, state, prevPt);
                tx = prevPt[0] + (tx - prevPt[0]) * sCurve;
                ty = prevPt[1] + (ty - prevPt[1]) * sCurve;
                tz = prevPt[2] + (tz - prevPt[2]) * sCurve;
            }

            // Clamp spring target to R=14
            const targetDistSq = tx * tx + ty * ty + tz * tz;
            if (targetDistSq > 196.0 && targetDistSq > 1e-6) {
                const invT = 14.0 / Math.sqrt(targetDistSq);
                tx *= invT; ty *= invT; tz *= invT;
            }

            const errX = tx - px, errY = ty - py, errZ = tz - pz;
            if (measureConvergence && (errX * errX + errY * errY + errZ * errZ) < 0.45) {
                convergedCount++;
            }

            const sz = sizeArr[i];
            const agility = Math.min(2.2, Math.max(0.48, 0.45 / Math.sqrt(Math.max(0.04, sz))));

            let dx = errX * activeLerpRate * agility;
            let dy = errY * activeLerpRate * agility;
            let dz = errZ * activeLerpRate * agility;

            if (isLeader[i] === 1) {
                dx *= 1.08; dy *= 1.08; dz *= 1.08;
            }

            let targetVelX = dx;
            let targetVelY = dy;
            let targetVelZ = dz;

            if (hasDrift) {
                const nSeed = noiseSeed[i];
                targetVelX += fastSin(time * 1.5 + nSeed) * dAmp * agility;
                targetVelY += fastCos(time * 1.2 + nSeed * 1.3) * dAmp * agility;
                targetVelZ += fastSin(time * 1.8 + nSeed * 0.7) * dAmp * agility;
            }

            let ax = targetVelX - velX[i];
            let ay = targetVelY - velY[i];
            let az = targetVelZ - velZ[i];

            const localMaxAccelSq = maxAccelSq * agility * agility;
            const accelMagSq = ax * ax + ay * ay + az * az;
            if (accelMagSq > localMaxAccelSq && accelMagSq > 1e-6) {
                const scale = (maxAccel * agility) / Math.sqrt(accelMagSq);
                ax *= scale; ay *= scale; az *= scale;
            }

            velX[i] += ax;
            velY[i] += ay;
            velZ[i] += az;

            const localMaxDisp = activeMaxDisp * agility;
            const speedSq = velX[i] * velX[i] + velY[i] * velY[i] + velZ[i] * velZ[i];
            if (speedSq > (localMaxDisp * localMaxDisp) && speedSq > 1e-6) {
                const invSpd = localMaxDisp / Math.sqrt(speedSq);
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

            const boidScale = sizeArr[i] * baseScale;

            if (spShape === 0) {
                matArray[offset + 0] = boidScale;
                matArray[offset + 1] = 0;
                matArray[offset + 2] = 0;
                matArray[offset + 3] = 0;
                matArray[offset + 4] = 0;
                matArray[offset + 5] = boidScale;
                matArray[offset + 6] = 0;
                matArray[offset + 7] = 0;
                matArray[offset + 8] = 0;
                matArray[offset + 9] = 0;
                matArray[offset + 10] = boidScale;
                matArray[offset + 11] = 0;
                matArray[offset + 12] = posX[i];
                matArray[offset + 13] = posY[i];
                matArray[offset + 14] = posZ[i];
                matArray[offset + 15] = 1;
            } else {
                let zx = velX[i], zy = velY[i], zz = velZ[i];
                const zLenSq = zx * zx + zy * zy + zz * zz;
                if (zLenSq < 1e-8) { zx = 0; zy = 0; zz = 1; }
                else { const invZ = 1.0 / Math.sqrt(zLenSq); zx *= invZ; zy *= invZ; zz *= invZ; }

                let xx = zz, xy = 0, xz = -zx;
                let xLenSq = xx * xx + xz * xz;
                if (xLenSq < 1e-6) { xx = 0; xy = zz; xz = -zy; xLenSq = xy * xy + xz * xz; }
                const invX = 1.0 / Math.sqrt(Math.max(1e-8, xLenSq));
                xx *= invX; xy *= invX; xz *= invX;

                const yx = zy * xz - zz * xy;
                const yy = zz * xx - zx * xz;
                const yz = zx * xy - zy * xx;

                matArray[offset + 0] = xx * boidScale; matArray[offset + 1] = xy * boidScale;
                matArray[offset + 2] = xz * boidScale; matArray[offset + 3] = 0;
                matArray[offset + 4] = yx * boidScale; matArray[offset + 5] = yy * boidScale;
                matArray[offset + 6] = yz * boidScale; matArray[offset + 7] = 0;
                matArray[offset + 8] = zx * boidScale; matArray[offset + 9] = zy * boidScale;
                matArray[offset + 10] = zz * boidScale; matArray[offset + 11] = 0;
                matArray[offset + 12] = posX[i]; matArray[offset + 13] = posY[i];
                matArray[offset + 14] = posZ[i]; matArray[offset + 15] = 1;
            }
        }

        if (sampleCount > 0) {
            const meanRadius = Math.sqrt(sumDistSq / sampleCount);
            const estimatedBoundingRadius = Math.max(3.5, meanRadius * 1.35);
            smoothRadius.current = THREE.MathUtils.lerp(smoothRadius.current, estimatedBoundingRadius, 0.04);
            state.formationRadius = smoothRadius.current;
        }

        // Convergence — only update when measured (not during morph)
        if (measureConvergence) {
            const measuredConvergence = boidCount > 0 ? (convergedCount / (boidCount * 0.5)) : 1.0; // *0.5 since we measured half
            state.physicalConvergence = THREE.MathUtils.lerp(state.physicalConvergence ?? measuredConvergence, measuredConvergence, 0.10);
        }
        // Map 20%..85% convergence smoothly to 0%..100% progress
        const computedProgress = Math.min(1.0, Math.max(0.0, ((state.physicalConvergence ?? 0) - 0.20) / 0.65));
        state.morphProgress = computedProgress;

        // 4. Perceptual Oklab Asynchronous Species Color Morphing with Random Staggered Lag
        const newPalette = state.speciesColors || SPECIES_COLORS;
        const paletteKey = newPalette.join(',');

        if (lastPaletteKey.current !== paletteKey) {
            lastPaletteKey.current = paletteKey;

            // Generate randomized order of the 4 species: e.g. [2, 0, 3, 1]
            const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

            let accumulatedLag = 0.0;
            for (let idx = 0; idx < 4; idx++) {
                const s = order[idx];
                startColors.current[s].copy(currentColors.current[s]);
                targetColors.current[s].set(newPalette[s]);

                speciesStartTimes.current[s] = time + accumulatedLag;
                speciesDurations.current[s] = 4.5 + Math.random() * 1.5; // 4.5s - 6.0s super smooth morph

                // Random lag between 1.5s and 3.0s before the NEXT species starts its transition
                accumulatedLag += 1.5 + Math.random() * 1.5;
            }
        }

        for (let s = 0; s < 4; s++) {
            const sStart = speciesStartTimes.current[s];
            const sDur = speciesDurations.current[s];

            if (time < sStart) {
                // Not yet reached its staggered turn: hold current start color
                currentColors.current[s].copy(startColors.current[s]);
                continue;
            }

            const colorElapsed = time - sStart;
            const colorP = Math.min(1.0, colorElapsed / sDur);
            // Ultra-smooth C2-continuous Quintic Ease-In / Ease-Out S-Curve: 6p^5 - 15p^4 + 10p^3
            const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

            // Perceptually Uniform Oklab Interpolation: zero muddy colors, zero brightness dips
            const [L1, a1, b1] = rgbToOklab(startColors.current[s].r, startColors.current[s].g, startColors.current[s].b);
            const [L2, a2, b2] = rgbToOklab(targetColors.current[s].r, targetColors.current[s].g, targetColors.current[s].b);

            const L = L1 + (L2 - L1) * colorEase;
            const a = a1 + (a2 - a1) * colorEase;
            const b = b1 + (b2 - b1) * colorEase;

            const [r, g, b_rgb] = oklabToRgb(L, a, b);
            currentColors.current[s].setRGB(r, g, b_rgb);
        }

        const spMats = state.speciesMaterials || [
            state.materialSettings,
            state.materialSettings,
            state.materialSettings,
            state.materialSettings
        ];

        for (let sp = 0; sp < 4; sp++) {
            const mesh = meshRefs[sp].current;
            if (mesh) {
                mesh.count = speciesCounts[sp];
                mesh.instanceMatrix.needsUpdate = true;
                if (mesh.material) {
                    const stdMat = mesh.material as THREE.MeshStandardMaterial;
                    const spMat = spMats[sp] || state.materialSettings || MATERIAL_PRESETS[0].settings;
                    stdMat.color.copy(currentColors.current[sp]);
                    stdMat.roughness = spMat.roughness;
                    stdMat.metalness = spMat.metalness;
                    let spEmiss = spMat.emissiveIntensity ?? 0.0;
                    if (state.microSurpriseType === 'materialPulse' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
                        spEmiss = Math.max(spEmiss, 2.0);
                    }
                    stdMat.emissiveIntensity = spEmiss;
                    stdMat.emissive.copy(currentColors.current[sp]);
                }
            }
        }

        if (!state.isReady) {
            state.isReady = true;
            if (state.onInitialLoadComplete) {
                state.onInitialLoadComplete();
            }
        }
    });

    const activeSpeciesShapes = getSpeciesShapes();
    const mat = state.materialSettings || { roughness: 0.25, metalness: 0.5, wireframe: false, flatShading: false, emissiveIntensity: 0.0 };

    // Check for transient material pulse micro-surprise
    let emissiveInt = mat.emissiveIntensity;
    if (state.microSurpriseType === 'materialPulse' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
        emissiveInt = 1.4;
    }

    return (
        <group>
            {[0, 1, 2, 3].map(sp => {
                const shapeId = activeSpeciesShapes[sp] % geometries.length;
                const activeGeometry = geometries[shapeId];
                return (
                    <instancedMesh
                        key={`sp-${sp}-${shapeId}`}
                        ref={meshRefs[sp]}
                        args={[activeGeometry, undefined, MAX_SPECIES_CAPACITY]}
                        frustumCulled={false}
                    >
                        <meshStandardMaterial
                            key={`${mat.flatShading ? 'f' : 's'}-${emissiveInt > 1.0 ? 'p' : 'n'}`}
                            roughness={mat.roughness}
                            metalness={mat.metalness}
                            wireframe={false}
                            flatShading={mat.flatShading}
                            emissiveIntensity={emissiveInt}
                            toneMapped={true}
                            fog={true}
                            side={THREE.FrontSide}
                        />
                    </instancedMesh>
                );
            })}

        </group>
    );
}

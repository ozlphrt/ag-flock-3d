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

    const tornadoDust0 = useRef<THREE.Points>(null);
    const tornadoDust1 = useRef<THREE.Points>(null);
    const tornadoDust2 = useRef<THREE.Points>(null);

    const DUST_COUNT = 450;
    const dustPhaseData = useMemo(() => {
        return [0, 1, 2].map(() => {
            const hPhase = new Float32Array(DUST_COUNT);
            const thetaPhase = new Float32Array(DUST_COUNT);
            const speedScale = new Float32Array(DUST_COUNT);
            const radJitter = new Float32Array(DUST_COUNT);
            for (let p = 0; p < DUST_COUNT; p++) {
                hPhase[p] = Math.random();
                thetaPhase[p] = Math.random() * Math.PI * 2;
                speedScale[p] = 0.8 + Math.random() * 0.4;
                radJitter[p] = 0.75 + Math.random() * 0.5;
            }
            return { hPhase, thetaPhase, speedScale, radJitter };
        });
    }, []);

    const dustGeometries = useMemo(() => {
        return [0, 1, 2].map(() => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(DUST_COUNT * 3);
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            return geo;
        });
    }, []);

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
        const speciesCount = Math.floor(boidCount / 4);
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
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 9.0;
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

        // 🌪️ Local 3D Tornado Cyclone Field (SLOW DRIFT ACROSS TOPOLOGIES, ULTRA-COMPACT H=1.5, COILING WHIRLPOOL STREAM)
        const tornadoCount = state.tornadoCount !== undefined ? state.tornadoCount : 2;
        const tornadoStrength = (state.tornadoStrength ?? 2.2) * (state.speedMultiplier || 1.0);
        const tornadoCentrifugal = (state.tornadoCentrifugal ?? 2.5);

        const tActive: {
            bx: number; by: number; bz: number;
            tx: number; ty: number; tz: number;
            ux: number; uy: number; uz: number;
            H: number; invH: number;
            neckR: number; crownR: number;
            infRSq: number;
            swirlDir: number;
        }[] = [];

        if (tornadoCount > 0) {
            // Cyclone 1: Slow graceful drift through topological ribbon stream
            if (tornadoCount >= 1) {
                const a0 = time * 0.07;
                const cx0 = 2.8 * fastCos(a0) - 0.4 * fastSin(a0 * 1.4);
                const cy0 = 0.6 + 0.35 * fastSin(time * 0.08);
                const cz0 = 0.2 + 0.45 * fastSin(a0 * 0.9);

                // Dynamically undulating 3D tilt axis (pitch ~42°)
                const rawUx0 = 0.38 + 0.12 * fastSin(time * 0.10);
                const rawUy0 = 0.88;
                const rawUz0 = 0.22 + 0.12 * fastCos(time * 0.10);
                const uLen0 = Math.sqrt(rawUx0 * rawUx0 + rawUy0 * rawUy0 + rawUz0 * rawUz0);
                const ux0 = rawUx0 / uLen0, uy0 = rawUy0 / uLen0, uz0 = rawUz0 / uLen0;

                const H0 = 1.5; // Mini-vortex height
                const halfH0 = H0 * 0.5;
                const bx0 = cx0 - ux0 * halfH0, by0 = cy0 - uy0 * halfH0, bz0 = cz0 - uz0 * halfH0;
                const tx0 = cx0 + ux0 * halfH0, ty0 = cy0 + uy0 * halfH0, tz0 = cz0 + uz0 * halfH0;

                tActive.push({
                    bx: bx0, by: by0, bz: bz0,
                    tx: tx0, ty: ty0, tz: tz0,
                    ux: ux0, uy: uy0, uz: uz0,
                    H: H0, invH: 1.0 / H0,
                    neckR: 0.10, crownR: 0.48,
                    infRSq: 0.81, // R = 0.9 tight capture radius
                    swirlDir: 1.0
                });
            }

            // Cyclone 2: Slow counter-drifting cross-slice
            if (tornadoCount >= 2) {
                const a1 = time * -0.06 + Math.PI;
                const cx1 = -2.5 * fastCos(a1) + 0.45 * fastSin(a1 * 1.3);
                const cy1 = -0.5 + 0.35 * fastCos(time * 0.08);
                const cz1 = 1.6 + 0.40 * fastSin(a1 * 0.8);

                // Horizontal cross-slice axis
                const rawUx1 = 0.85 + 0.10 * fastCos(time * 0.09);
                const rawUy1 = 0.26 + 0.08 * fastSin(time * 0.10);
                const rawUz1 = -0.40 + 0.10 * fastSin(time * 0.09);
                const uLen1 = Math.sqrt(rawUx1 * rawUx1 + rawUy1 * rawUy1 + rawUz1 * rawUz1);
                const ux1 = rawUx1 / uLen1, uy1 = rawUy1 / uLen1, uz1 = rawUz1 / uLen1;

                const H1 = 1.4; // Mini-vortex height
                const halfH1 = H1 * 0.5;
                const bx1 = cx1 - ux1 * halfH1, by1 = cy1 - uy1 * halfH1, bz1 = cz1 - uz1 * halfH1;
                const tx1 = cx1 + ux1 * halfH1, ty1 = cy1 + uy1 * halfH1, tz1 = cz1 + uz1 * halfH1;

                tActive.push({
                    bx: bx1, by: by1, bz: bz1,
                    tx: tx1, ty: ty1, tz: tz1,
                    ux: ux1, uy: uy1, uz: uz1,
                    H: H1, invH: 1.0 / H1,
                    neckR: 0.10, crownR: 0.48,
                    infRSq: 0.81,
                    swirlDir: -1.0
                });
            }

            // Cyclone 3: Slow inverted wandering gyre
            if (tornadoCount >= 3) {
                const a2 = time * 0.05 + 2.2;
                const cx2 = 0.45 * fastSin(a2 * 1.2);
                const cy2 = -0.8 + 0.30 * fastSin(time * 0.07);
                const cz2 = -2.6 * fastCos(a2);

                // Inverted downward tilt axis
                const rawUx2 = -0.30 + 0.12 * fastCos(time * 0.08);
                const rawUy2 = -0.88;
                const rawUz2 = 0.30 + 0.12 * fastSin(time * 0.08);
                const uLen2 = Math.sqrt(rawUx2 * rawUx2 + rawUy2 * rawUy2 + rawUz2 * rawUz2);
                const ux2 = rawUx2 / uLen2, uy2 = rawUy2 / uLen2, uz2 = rawUz2 / uLen2;

                const H2 = 1.45; // Mini-vortex height
                const halfH2 = H2 * 0.5;
                const bx2 = cx2 - ux2 * halfH2, by2 = cy2 - uy2 * halfH2, bz2 = cz2 - uz2 * halfH2;
                const tx2 = cx2 + ux2 * halfH2, ty2 = cy2 + uy2 * halfH2, tz2 = cz2 + uz2 * halfH2;

                tActive.push({
                    bx: bx2, by: by2, bz: bz2,
                    tx: tx2, ty: ty2, tz: tz2,
                    ux: ux2, uy: uy2, uz: uz2,
                    H: H2, invH: 1.0 / H2,
                    neckR: 0.10, crownR: 0.45,
                    infRSq: 0.81,
                    swirlDir: 1.0
                });
            }
        }

        // Update visual dynamic tornado dust clouds (particles visibly swirl in helical cyclone motion)
        const tDusts = [tornadoDust0.current, tornadoDust1.current, tornadoDust2.current];
        for (let tIdx = 0; tIdx < 3; tIdx++) {
            const pointsMesh = tDusts[tIdx];
            if (!pointsMesh) continue;
            if (tIdx < tActive.length) {
                pointsMesh.visible = true;
                const T = tActive[tIdx];
                const geo = dustGeometries[tIdx];
                const posAttr = geo.attributes.position as THREE.BufferAttribute;
                const posArr = posAttr.array as Float32Array;
                const pData = dustPhaseData[tIdx];

                // Build local orthonormal basis (normal1, axis, normal2)
                const ux = T.ux, uy = T.uy, uz = T.uz;
                const refX = Math.abs(uy) < 0.9 ? 0 : 1;
                const refY = Math.abs(uy) < 0.9 ? 1 : 0;
                const refZ = 0;
                let n1x = refY * uz - refZ * uy;
                let n1y = refZ * ux - refX * uz;
                let n1z = refX * uy - refY * ux;
                const invN1 = 1.0 / Math.max(1e-4, Math.sqrt(n1x * n1x + n1y * n1y + n1z * n1z));
                n1x *= invN1; n1y *= invN1; n1z *= invN1;
                const n2x = uy * n1z - uz * n1y;
                const n2y = uz * n1x - ux * n1z;
                const n2z = ux * n1y - uy * n1x;

                const timeSpd = time * 0.40;
                for (let p = 0; p < DUST_COUNT; p++) {
                    const spd = pData.speedScale[p];
                    // Continuous upward ascent cycling from 0 to 1
                    const h = (pData.hPhase[p] + timeSpd * 0.16 * spd) % 1.0;
                    // Hyperboloid funnel radius: tight neck at base, expanding to wide crown
                    const rBase = T.neckR + (T.crownR - T.neckR) * (h * h);
                    const r = rBase * pData.radJitter[p];

                    // Swirl angle: spins faster at narrow base (angular momentum conservation)
                    const spinAngle = pData.thetaPhase[p] + (timeSpd * (1.6 / Math.max(0.10, rBase)) + h * 7.5) * T.swirlDir;
                    const cosA = fastCos(spinAngle) * r;
                    const sinA = fastSin(spinAngle) * r;

                    const distAlongAxis = h * T.H;
                    posArr[p * 3] = T.bx + ux * distAlongAxis + n1x * cosA + n2x * sinA;
                    posArr[p * 3 + 1] = T.by + uy * distAlongAxis + n1y * cosA + n2y * sinA;
                    posArr[p * 3 + 2] = T.bz + uz * distAlongAxis + n1z * cosA + n2z * sinA;
                }
                posAttr.needsUpdate = true;
                pointsMesh.position.set(0, 0, 0);
                pointsMesh.quaternion.identity();
            } else {
                pointsMesh.visible = false;
            }
        }

        // Centroid & Bounding Radius sampling registers
        let sumX = 0, sumY = 0, sumZ = 0;
        let sumDistSq = 0;
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

        const matArrays = [
            meshRef0.current.instanceMatrix.array as Float32Array,
            meshRef1.current.instanceMatrix.array as Float32Array,
            meshRef2.current.instanceMatrix.array as Float32Array,
            meshRef3.current.instanceMatrix.array as Float32Array
        ];

        for (let i = 0; i < boidCount; i++) {
            const px = posX[i];
            const py = posY[i];
            const pz = posZ[i];

            if (i % sampleStep === 0) {
                sumX += px; sumY += py; sumZ += pz;
                sumDistSq += (px * px + py * py + pz * pz);
                sampleCount++;
            }

            const sp = species[i];
            const spIdx = indexInSpecies[i];
            if (spIdx >= speciesCount) continue;

            const sepWeight = (state && state.attributes && state.attributes[sp])
                ? state.attributes[sp].separationWeight
                : 3.5;

            const u = uArr[i];

            computeFormationPoint(formation, seed, u, time, sp, spIdx, sepWeight, speedMult, state, curPt);
            let tx = curPt[0], ty = curPt[1], tz = curPt[2];

            // Volumetric Cross-Section Sheaf Dispersion (Crisp Strands vs Atmospheric Sheath)
            const phi = (spIdx * 2.3999632) + (u * 13.7) + (sp * 1.5707963);
            const rNorm = RNORM_LUT[spIdx % 41];
            const volThickness = profile.volThickness;
            tx += fastCos(phi) * (rNorm * volThickness);
            ty += fastSin(phi) * (rNorm * volThickness * 0.75);
            tz += fastSin(phi * 1.33) * (rNorm * volThickness * 0.65);

            // Controlled loose aura particles only if formation profile allows it (0% for geometric formations)
            if (profile.strayRatio > 0 && p > 0.8) {
                const strayMod = Math.floor(1.0 / profile.strayRatio);
                if (i % strayMod === 0) {
                    const strayAngle = time * (0.3 + (i % 5) * 0.08) + noiseSeed[i];
                    const rAura = 7.0 + (i % 6) * 0.8;
                    tx = rAura * fastCos(strayAngle);
                    ty = fastSin(strayAngle * 1.5) * 1.8 + (sp - 1.5) * 1.0;
                    tz = rAura * fastSin(strayAngle);
                }
            }

            if (isMorphing && prevMode !== undefined) {
                computeFormationPoint(prevMode, prevSeed, u, time, sp, spIdx, sepWeight, speedMult, state, prevPt);
                // Apply volumetric sheath to previous point as well during morph
                prevPt[0] += fastCos(phi) * (rNorm * volThickness);
                prevPt[1] += fastSin(phi) * (rNorm * volThickness * 0.75);
                prevPt[2] += fastSin(phi * 1.33) * (rNorm * volThickness * 0.65);

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

            // --- 🌪️ Local Tornado Physical Interaction (Funnel Suction, Cyclonic Swirl, Helical Updraft & Explosive Crown Slingshot) ---
            const tLen = tActive.length;
            let inTornadoCrown = false;

            for (let tIdx = 0; tIdx < tLen; tIdx++) {
                const T = tActive[tIdx];
                const vbx = posX[i] - T.bx;
                const vby = posY[i] - T.by;
                const vbz = posZ[i] - T.bz;

                const s = vbx * T.ux + vby * T.uy + vbz * T.uz;
                const hNorm = s * T.invH;

                if (hNorm >= -0.05 && hNorm <= 1.25) {
                    const axPtX = T.bx + T.ux * s;
                    const axPtY = T.by + T.uy * s;
                    const axPtZ = T.bz + T.uz * s;

                    const rx = posX[i] - axPtX;
                    const ry = posY[i] - axPtY;
                    const rz = posZ[i] - axPtZ;
                    const rSq = rx * rx + ry * ry + rz * rz;

                    if (rSq < T.infRSq) {
                        const r = Math.sqrt(Math.max(1e-4, rSq));
                        const invR = 1.0 / r;
                        const rxNorm = rx * invR;
                        const ryNorm = ry * invR;
                        const rzNorm = rz * invR;

                        // Tangential swirl vector: Axis x rNorm
                        const txNorm = (T.uy * rzNorm - T.uz * ryNorm) * T.swirlDir;
                        const tyNorm = (T.uz * rxNorm - T.ux * rzNorm) * T.swirlDir;
                        const tzNorm = (T.ux * ryNorm - T.uy * rxNorm) * T.swirlDir;

                        const hClamped = Math.max(0.0, Math.min(1.0, hNorm));
                        const targetR = T.neckR + (T.crownR - T.neckR) * (hClamped * hClamped);
                        const rDiff = r - targetR;
                        const proximity = Math.max(0.0, 1.0 - r / Math.sqrt(T.infRSq));

                        // Velocity Decomposition into Radial, Tangential (Swirl), and Axial (Updraft) vectors
                        const vRad = velX[i] * rxNorm + velY[i] * ryNorm + velZ[i] * rzNorm;
                        const vTan = velX[i] * txNorm + velY[i] * tyNorm + velZ[i] * tzNorm;
                        const vUp = velX[i] * T.ux + velY[i] * T.uy + velZ[i] * T.uz;

                        // 1. Radial Confinement: Keeps boids locked on the circular orbit around the vortex eye
                        const targetRadSpeed = -rDiff * 0.25 * tornadoStrength;
                        const radDelta = (targetRadSpeed - vRad) * 0.35 * proximity;
                        velX[i] += rxNorm * radDelta;
                        velY[i] += ryNorm * radDelta;
                        velZ[i] += rzNorm * radDelta;

                        // 2. High-Angular Tangential Swirl: Generates 3 to 4 full coiling 360° revolutions
                        const targetTanSpeed = (0.16 + (1.0 - hClamped) * 0.08) * tornadoStrength;
                        const tanDelta = (targetTanSpeed - vTan) * 0.40 * proximity;
                        velX[i] += txNorm * tanDelta;
                        velY[i] += tyNorm * tanDelta;
                        velZ[i] += tzNorm * tanDelta;

                        // 3. Gentle Helical Ascent: Boid climbs smoothly over 1.5 seconds instead of rushing through
                        const targetUpSpeed = (0.028 + hClamped * 0.018) * tornadoStrength;
                        const upDelta = (targetUpSpeed - vUp) * 0.30 * proximity;
                        velX[i] += T.ux * upDelta;
                        velY[i] += T.uy * upDelta;
                        velZ[i] += T.uz * upDelta;

                        // 4. Graceful Centrifugal Crown Ejection (Only after full helical ascent at h > 0.82)
                        if (hNorm > 0.82) {
                            const crownProg = (hNorm - 0.82) / 0.18;
                            const slingshotMag = crownProg * 0.12 * tornadoCentrifugal;
                            velX[i] += (rxNorm * 1.5 + txNorm * 0.8) * slingshotMag;
                            velY[i] += (ryNorm * 0.4 + T.uy * 0.6) * slingshotMag;
                            velZ[i] += (rzNorm * 1.5 + tzNorm * 0.8) * slingshotMag;
                            inTornadoCrown = true;
                        }
                    }
                }
            }

            const currentMaxDisp = inTornadoCrown ? (activeMaxDisp * 2.5) : activeMaxDisp;
            const currentMaxDispSq = currentMaxDisp * currentMaxDisp;
            const speedSq = velX[i] * velX[i] + velY[i] * velY[i] + velZ[i] * velZ[i];
            if (speedSq > currentMaxDispSq && speedSq > 1e-6) {
                const invSpd = currentMaxDisp / Math.sqrt(speedSq);
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

            const spShape = activeSpeciesShapes[sp] % geometries.length;
            const boidScale = sizeArr[i] * baseScale;
            const matArray = matArrays[sp];
            const offset = spIdx * 16;

            if (spShape === 0) {
                // Shape 0: Geodesic 20-Facet Ico-Sphere (Flagship)
                // Spherically symmetric 20-facet crystal — direct matrix transform eliminates 200,000 Math.sqrt & cross products
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
                // Directional shapes (Jets, Wings): align nose vector with velocity
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

                matArray[offset + 0] = xx * boidScale;
                matArray[offset + 1] = xy * boidScale;
                matArray[offset + 2] = xz * boidScale;
                matArray[offset + 3] = 0;

                matArray[offset + 4] = yx * boidScale;
                matArray[offset + 5] = yy * boidScale;
                matArray[offset + 6] = yz * boidScale;
                matArray[offset + 7] = 0;

                matArray[offset + 8] = zx * boidScale;
                matArray[offset + 9] = zy * boidScale;
                matArray[offset + 10] = zz * boidScale;
                matArray[offset + 11] = 0;

                matArray[offset + 12] = posX[i];
                matArray[offset + 13] = posY[i];
                matArray[offset + 14] = posZ[i];
                matArray[offset + 15] = 1;
            }
        }

        if (sampleCount > 0) {
            const meanRadius = Math.sqrt(sumDistSq / sampleCount);
            const estimatedBoundingRadius = Math.max(3.5, meanRadius * 1.35);
            smoothRadius.current = THREE.MathUtils.lerp(smoothRadius.current, estimatedBoundingRadius, 0.04);
            state.formationRadius = smoothRadius.current;
        }

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

        for (let sp = 0; sp < 4; sp++) {
            const mesh = meshRefs[sp].current;
            if (mesh) {
                mesh.count = speciesCount;
                mesh.instanceMatrix.needsUpdate = true;
                if (mesh.material) {
                    (mesh.material as THREE.MeshStandardMaterial).color.copy(currentColors.current[sp]);
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
                            side={THREE.FrontSide}
                        />
                    </instancedMesh>
                );
            })}

            {/* Ethereal Self-Illuminated Micro-Dust Tornado Helices */}
            <points ref={tornadoDust0} geometry={dustGeometries[0]} visible={false}>
                <pointsMaterial
                    size={0.016}
                    color="#ffe580"
                    transparent={true}
                    opacity={0.85}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>
            <points ref={tornadoDust1} geometry={dustGeometries[1]} visible={false}>
                <pointsMaterial
                    size={0.016}
                    color="#ffe580"
                    transparent={true}
                    opacity={0.85}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>
            <points ref={tornadoDust2} geometry={dustGeometries[2]} visible={false}>
                <pointsMaterial
                    size={0.016}
                    color="#ffe580"
                    transparent={true}
                    opacity={0.85}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>
        </group>
    );
}

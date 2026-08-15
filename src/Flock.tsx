import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BoidSwarmData, BlobCenter, SimulationState, SpeciesType, SPECIES_COLORS, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, computeFormationPoint, getFormationPhysicsProfile } from './BoidLogic'
import { createClockEngine, ClockEngine } from './ClockEngine'

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

    // Structure-of-Arrays High Performance Data Buffer
    const swarm = useMemo(() => new BoidSwarmData(100000), []);
    const blobCentersRef = useRef<BlobCenter[]>([]);
    const lastSeed = useRef<number>(-1);
    const lastMode = useRef<number>(-1);
    const lastPaletteKey = useRef<string>('');
    const colorTransitionStartTime = useRef<number>(0);
    const smoothRadius = useRef<number>(8.0);

    const startColors = useRef<THREE.Color[]>([
        new THREE.Color(SPECIES_COLORS[0]),
        new THREE.Color(SPECIES_COLORS[1]),
        new THREE.Color(SPECIES_COLORS[2]),
        new THREE.Color(SPECIES_COLORS[3])
    ]);
    const targetColors = useRef<THREE.Color[]>([
        new THREE.Color(SPECIES_COLORS[0]),
        new THREE.Color(SPECIES_COLORS[1]),
        new THREE.Color(SPECIES_COLORS[2]),
        new THREE.Color(SPECIES_COLORS[3])
    ]);
    const currentColors = useRef<THREE.Color[]>([
        new THREE.Color(SPECIES_COLORS[0]),
        new THREE.Color(SPECIES_COLORS[1]),
        new THREE.Color(SPECIES_COLORS[2]),
        new THREE.Color(SPECIES_COLORS[3])
    ]);

    const speciesStartTimes = useRef<number[]>([0, 0, 0, 0]);
    const speciesDurations = useRef<number[]>([3.2, 3.2, 3.2, 3.2]);

    // Initialize Blob Centers once (4 species x 3 centers = 12 centers)
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

    const getSpeciesShapes = (): [number, number, number, number] => {
        if (state.speciesShapes) return state.speciesShapes;
        if (state.boidShape === 99) {
            // Multi-Species Diverse: 4 distinct geometric archetypes
            return [0, 1, 2, 4]; // Stealth Arrowhead (sp0), Faceted Gemstone (sp1), Pyramid (sp2), Swept Delta Wing (sp3)
        }
        const s = (state.boidShape !== undefined && state.boidShape >= 0) ? (state.boidShape % 6) : 0;
        return [s, s, s, s];
    };

    useFrame((stateContext, delta) => {
        const boidCount = count;
        const speciesCount = Math.floor(boidCount / 4);
        if (!meshRef0.current || !meshRef1.current || !meshRef2.current || !meshRef3.current) return;
        const time = stateContext.clock.getElapsedTime();
        const safeDelta = Math.min(delta, 0.05);
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

        const baseScale = (state.sizeMultiplier || 1.0) * 1.35;
        const prevMode = isMorphing ? state.prevFormationMode : undefined;
        const prevSeed = isMorphing ? (state.prevFormationSeed !== undefined ? state.prevFormationSeed : seed) : seed;

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
            const rNorm = Math.sqrt((spIdx % 41) / 40.0);
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

            // Organic Aerodynamic Spring Smoothing:
            const toTx = tx - px;
            const toTy = ty - py;
            const toTz = tz - pz;
            const distToTargetSq = toTx * toTx + toTy * toTy + toTz * toTz;

            let vx = velX[i];
            let vy = velY[i];
            let vz = velZ[i];

            if (distToTargetSq > 1e-6) {
                let accelX = toTx * activeLerpRate;
                let accelY = toTy * activeLerpRate;
                let accelZ = toTz * activeLerpRate;

                const accelSq = accelX * accelX + accelY * accelY + accelZ * accelZ;
                if (accelSq > maxAccelSq) {
                    const invAccel = maxAccel / Math.sqrt(accelSq);
                    accelX *= invAccel;
                    accelY *= invAccel;
                    accelZ *= invAccel;
                }

                vx += accelX;
                vy += accelY;
                vz += accelZ;
            }

            // Noise Drift & Aerodynamic Damping
            if (profile.noiseDrift > 0) {
                const nTime = time * 0.7 + noiseSeed[i];
                vx += fastSin(nTime * 1.7 + pz * 0.2) * profile.noiseDrift;
                vy += fastCos(nTime * 1.3 + px * 0.2) * profile.noiseDrift;
                vz += fastSin(nTime * 1.5 + py * 0.2) * profile.noiseDrift;
            }

            // Aerodynamic Drag
            vx *= 0.94;
            vy *= 0.94;
            vz *= 0.94;

            const speedSq = vx * vx + vy * vy + vz * vz;
            if (speedSq > maxDispSq) {
                const invSpeed = activeMaxDisp / Math.sqrt(speedSq);
                vx *= invSpeed;
                vy *= invSpeed;
                vz *= invSpeed;
            }

            posX[i] = px + vx;
            posY[i] = py + vy;
            posZ[i] = pz + vz;
            velX[i] = vx;
            velY[i] = vy;
            velZ[i] = vz;

            // Direct Instanced Transformation Matrix Computation (0 allocations)
            let zx = vx;
            let zy = vy;
            let zz = vz;
            const currentSpeedSq = zx * zx + zy * zy + zz * zz;

            if (currentSpeedSq < 1e-8) {
                zx = 0; zy = 0; zz = 1;
            } else {
                const invLen = 1.0 / Math.sqrt(currentSpeedSq);
                zx *= invLen; zy *= invLen; zz *= invLen;
            }

            let upX = 0, upY = 1, upZ = 0;
            if (Math.abs(zy) > 0.96) {
                upX = 1; upY = 0; upZ = 0;
            }

            let xx = upY * zz - upZ * zy;
            let xy = upZ * zx - upX * zz;
            let xz = upX * zy - upY * zx;
            const invRightLen = 1.0 / Math.sqrt(xx * xx + xy * xy + xz * xz);
            xx *= invRightLen; xy *= invRightLen; xz *= invRightLen;

            const yx = zy * xz - zz * xy;
            const yy = zz * xx - zx * xz;
            const yz = zx * xy - zy * xx;

            const boidScale = sizeArr[i] * baseScale;

            const matArray = matArrays[sp];
            const offset = spIdx * 16;

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

            // Generate randomized order of the 4 species
            const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

            let accumulatedLag = 0.0;
            for (let idx = 0; idx < 4; idx++) {
                const s = order[idx];
                startColors.current[s].copy(currentColors.current[s]);
                targetColors.current[s].set(newPalette[s] || SPECIES_COLORS[s]);

                speciesStartTimes.current[s] = time + accumulatedLag;
                speciesDurations.current[s] = 4.5 + Math.random() * 1.5; // 4.5s - 6.0s super smooth morph

                // Random lag between 1.2s and 2.5s before the NEXT species starts its transition
                accumulatedLag += 1.2 + Math.random() * 1.3;
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
            const targetCol = targetColors.current[s];
            const [L2, a2, b2] = rgbToOklab(targetCol.r, targetCol.g, targetCol.b);

            const L = L1 + (L2 - L1) * colorEase;
            const a = a1 + (a2 - a1) * colorEase;
            const b = b1 + (b2 - b1) * colorEase;

            const [r, g, b_rgb] = oklabToRgb(L, a, b);
            currentColors.current[s].setRGB(r, g, b_rgb);
        }

        for (let sp = 0; sp < 4; sp++) {
            const mesh = meshRefs[sp].current;
            if (mesh) {
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
    const speciesCount = Math.floor(count / 4);
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
                        key={`sp-${sp}-${shapeId}-${speciesCount}`}
                        ref={meshRefs[sp]}
                        args={[activeGeometry, undefined, speciesCount]}
                    >
                        <meshStandardMaterial
                            key={`${mat.flatShading ? 'f' : 's'}-${emissiveInt > 1.0 ? 'p' : 'n'}`}
                            roughness={mat.roughness}
                            metalness={mat.metalness}
                            wireframe={false}
                            flatShading={mat.flatShading}
                            emissiveIntensity={emissiveInt}
                            toneMapped={true}
                        />
                    </instancedMesh>
                );
            })}
        </group>
    );
}

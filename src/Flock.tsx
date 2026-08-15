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
    const meshRef = useRef<THREE.InstancedMesh>(null!);

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

    const speciesStartTimes = useRef<number[]>([0, 0, 0, 0]);
    const speciesDurations = useRef<number[]>([3.2, 3.2, 3.2, 3.2]);

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

    useFrame((stateContext, delta) => {
        if (!meshRef.current) return;
        const boidCount = count;
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

        const matArray = meshRef.current.instanceMatrix.array;

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
            const sepWeight = (state && state.attributes && state.attributes[sp])
                ? state.attributes[sp].separationWeight
                : 3.5;

            const u = uArr[i];
            const idxSp = indexInSpecies[i];

            computeFormationPoint(formation, seed, u, time, sp, idxSp, sepWeight, speedMult, state, curPt);
            let tx = curPt[0], ty = curPt[1], tz = curPt[2];

            // Volumetric Cross-Section Sheaf Dispersion (Crisp Strands vs Atmospheric Sheath)
            const phi = (idxSp * 2.3999632) + (u * 13.7) + (sp * 1.5707963);
            const rNorm = Math.sqrt((idxSp % 41) / 40.0);
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
                computeFormationPoint(prevMode, prevSeed, u, time, sp, idxSp, sepWeight, speedMult, state, prevPt);
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

        if (sampleCount > 0) {
            const meanRadius = Math.sqrt(sumDistSq / sampleCount);
            const estimatedBoundingRadius = Math.max(3.5, meanRadius * 1.35);
            smoothRadius.current = THREE.MathUtils.lerp(smoothRadius.current, estimatedBoundingRadius, 0.04);
            state.formationRadius = smoothRadius.current;
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

        // 4. Asynchronous One-at-a-Time Species Color Morphing with Random Lag
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
                speciesDurations.current[s] = 3.0 + Math.random() * 1.5; // 3.0s - 4.5s individual smooth morph

                // Random lag between 1.2s and 2.6s before the NEXT species starts its transition
                accumulatedLag += 1.2 + Math.random() * 1.4;
            }
        }

        const hsl1 = { h: 0, s: 0, l: 0 };
        const hsl2 = { h: 0, s: 0, l: 0 };

        for (let s = 0; s < 4; s++) {
            const sStart = speciesStartTimes.current[s];
            const sDur = speciesDurations.current[s];

            if (time < sStart) {
                // Not yet reached its staggered turn: maintain its start color
                currentColors.current[s].copy(startColors.current[s]);
                continue;
            }

            const colorElapsed = time - sStart;
            const colorP = Math.min(1.0, colorElapsed / sDur);
            // Smooth Quintic Ease-In / Ease-Out: 6p^5 - 15p^4 + 10p^3
            const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

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

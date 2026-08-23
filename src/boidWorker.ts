import { BoidSwarmData, BlobCenter, computeFormationPoint } from './BoidLogic'

const MAX_BOIDS = 100000;
let swarm = new BoidSwarmData(MAX_BOIDS);
let blobCenters: BlobCenter[] = [];
let currentCount = 0;

// High-speed LUT for trigonometric noise & drift (0.2ms total execution for 100k boids)
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

// Reusable persistent buffers
let outBuffer = new Float32Array(MAX_BOIDS * 16);
const targetX = new Float32Array(MAX_BOIDS);
const targetY = new Float32Array(MAX_BOIDS);
const targetZ = new Float32Array(MAX_BOIDS);
let tickCount = 0;

// Initialize Blob Centers
for (let s = 0; s < 4; s++) {
    const baseR = 2.0 + s * 1.8;
    const nBlobs = 3;
    for (let b = 0; b < nBlobs; b++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = baseR * Math.sin(phi) * Math.cos(theta);
        const y = baseR * Math.cos(phi);
        const z = baseR * Math.sin(phi) * Math.sin(theta);
        blobCenters.push(new BlobCenter(x, y, z, s, baseR));
    }
}

self.onmessage = (e: MessageEvent) => {
    const data = e.data;
    if (!data) return;

    if (data.returnedBuffer && data.returnedBuffer.byteLength === MAX_BOIDS * 16 * 4) {
        outBuffer = data.returnedBuffer;
        return;
    }

    if (data.type === 'init' || (data.count && data.count !== currentCount)) {
        currentCount = data.count;
        swarm.setPopulation(currentCount, data.state);
        return;
    }

    if (data.type === 'step') {
        const boidCount = currentCount || data.count;
        if (!boidCount) return;
        tickCount++;

        const time = data.time;
        const state = data.state;

        // 1. Advance Blob Centers (O(B^2) where B=12)
        const speed = (state.attributes && state.attributes[0]) ? state.attributes[0].maxSpeed * state.speedMultiplier : 0.28;
        for (let b = 0; b < blobCenters.length; b++) {
            blobCenters[b].update(blobCenters, state.interactions, speed, time);
        }

        // 2. Physics & Formation Parameters
        let speedMult = state ? state.speedMultiplier : 1.0;
        if (state && state.microSurpriseType === 'speedSurge' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            speedMult *= 2.2;
        }

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : 0;
        const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;

        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const duration = (state && state.transitionDuration !== undefined) ? state.transitionDuration : 7.0;
        const elapsed = Math.max(0.0, time - startTime);
        const p = Math.min(1.0, elapsed / duration);
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        const isMorphing = (state && state.prevFormationMode !== undefined && p < 1.0);
        const activeLerpRate = isMorphing ? (0.03 + 0.03 * sCurve) : 0.06;
        const activeMaxDisp = isMorphing ? (0.04 + 0.02 * sCurve) * speedMult : 0.06 * speedMult;
        const maxAccel = 0.0025 * speedMult;
        const maxAccelSq = maxAccel * maxAccel;
        const maxDispSq = activeMaxDisp * activeMaxDisp;

        const baseScale = (state.sizeMultiplier || 1.0) * 0.5;
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
        const isStray = swarm.isStray;
        const strayOrbitRadius = swarm.strayOrbitRadius;
        const strayOrbitSpeed = swarm.strayOrbitSpeed;
        const noiseSeed = swarm.noiseSeed;
        const isLeader = swarm.isLeader;
        const sizeArr = swarm.size;

        const buf = outBuffer;

        // Interleaved Target Computation (50% per frame) for 120+ FPS throughput
        const updateSlice = tickCount & 1;
        const sliceStart = updateSlice === 0 ? 0 : 1;

        for (let i = sliceStart; i < boidCount; i += 2) {
            const sp = species[i];
            const sepWeight = (state && state.attributes && state.attributes[sp])
                ? state.attributes[sp].separationWeight
                : 3.5;

            const idxSp = indexInSpecies[i];
            const boidFlowOffset = 0.85 + (idxSp % 17) * 0.02;
            const flowSpeed = 0.055 * boidFlowOffset;
            const dynamicU = ((uArr[i] + time * flowSpeed * speedMult) % 1.0 + 1.0) % 1.0;

            let [txCurr, tyCurr, tzCurr] = computeFormationPoint(formation, seed, dynamicU, time, sp, idxSp, sepWeight, speedMult, state);

            if (isStray[i] === 1 && p > 0.8) {
                const strayAngle = time * strayOrbitSpeed[i] + noiseSeed[i];
                txCurr = strayOrbitRadius[i] * fastCos(strayAngle);
                tyCurr = fastSin(strayAngle * 2.0) * 2.5 + (sp - 1.5) * 1.5;
                tzCurr = strayOrbitRadius[i] * fastSin(strayAngle);
            }

            let tx = txCurr, ty = tyCurr, tz = tzCurr;

            if (isMorphing && prevMode !== undefined) {
                const [txPrev, tyPrev, tzPrev] = computeFormationPoint(prevMode, prevSeed, dynamicU, time, sp, idxSp, sepWeight, speedMult, state);
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

            targetX[i] = tx;
            targetY[i] = ty;
            targetZ[i] = tz;
        }

        // Vectorized Physics & Matrix Composition
        for (let i = 0; i < boidCount; i++) {
            const px = posX[i];
            const py = posY[i];
            const pz = posZ[i];

            if (i % sampleStep === 0) {
                sumX += px; sumY += py; sumZ += pz;
                sampleCount++;
            }

            const tx = targetX[i];
            const ty = targetY[i];
            const tz = targetZ[i];

            let dx = (tx - px) * activeLerpRate;
            let dy = (ty - py) * activeLerpRate;
            let dz = (tz - pz) * activeLerpRate;

            if (isLeader[i] === 1) {
                dx *= 1.12; dy *= 1.12; dz *= 1.12;
            }

            const nSeed = noiseSeed[i];
            const driftX = fastSin(time * 1.5 + nSeed) * 0.015 * speedMult;
            const driftY = fastCos(time * 1.2 + nSeed * 1.3) * 0.015 * speedMult;
            const driftZ = fastSin(time * 1.8 + nSeed * 0.7) * 0.015 * speedMult;

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
                xx = 0;
                xy = zz;
                xz = -zy;
                xLenSq = xy * xy + xz * xz;
            }
            const invX = 1.0 / Math.sqrt(Math.max(1e-8, xLenSq));
            xx *= invX; xy *= invX; xz *= invX;

            // Up vector y = z x x
            const yx = zy * xz - zz * xy;
            const yy = zz * xx - zx * xz;
            const yz = zx * xy - zy * xx;

            buf[offset + 0] = xx * s;
            buf[offset + 1] = xy * s;
            buf[offset + 2] = xz * s;
            buf[offset + 3] = 0;

            buf[offset + 4] = yx * s;
            buf[offset + 5] = yy * s;
            buf[offset + 6] = yz * s;
            buf[offset + 7] = 0;

            buf[offset + 8] = zx * s;
            buf[offset + 9] = zy * s;
            buf[offset + 10] = zz * s;
            buf[offset + 11] = 0;

            buf[offset + 12] = posX[i];
            buf[offset + 13] = posY[i];
            buf[offset + 14] = posZ[i];
            buf[offset + 15] = 1;
        }

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
        const r70 = Math.sqrt(maxDistSq) * 0.72;

        // Post zero-copy transferable back to main thread
        (self as any).postMessage(
            {
                type: 'frame',
                buffer: buf,
                centerX,
                centerY,
                centerZ,
                r70
            },
            [buf.buffer]
        );

        // Prepare fresh buffer
        outBuffer = new Float32Array(MAX_BOIDS * 16);
    }
};

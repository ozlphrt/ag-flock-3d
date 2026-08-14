import { BoidSwarmData, BlobCenter, SimulationState, computeFormationPoint } from './BoidLogic'

let swarm = new BoidSwarmData(100000);
let blobCenters: BlobCenter[] = [];
let currentCount = 0;
let isUpdating = false;

// Double buffer for zero-allocation zero-copy transfers
let matrixBuffer = new Float32Array(100000 * 16);

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
    const { type, count, state, time, returnedBuffer } = e.data;

    if (returnedBuffer && returnedBuffer.byteLength > 0) {
        matrixBuffer = returnedBuffer;
    }

    if (type === 'init' || (count && count !== currentCount)) {
        currentCount = count;
        swarm.setPopulation(count, state);
    }

    if (type === 'step') {
        if (!currentCount || isUpdating) return;
        isUpdating = true;

        const boidCount = currentCount;

        // 1. Advance Blob Centers (O(B^2) where B=12)
        const speed = (state.attributes && state.attributes[0]) ? state.attributes[0].maxSpeed * state.speedMultiplier : 0.28;
        for (const center of blobCenters) {
            center.update(blobCenters, state.interactions, speed, time);
        }

        // 2. Physics & Formation Parameters
        let speedMult = state ? state.speedMultiplier : 1.0;
        if (state && state.microSurpriseType === 'speedSurge' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
            speedMult *= 2.2;
        }

        const formation = (state && state.formationMode !== undefined) ? state.formationMode : 0;
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

        const baseScale = (state.sizeMultiplier || 1.0) * 0.5;

        // Centroid sampling registers
        let sumX = 0, sumY = 0, sumZ = 0;
        const sampleStep = Math.max(1, Math.floor(boidCount / 100));
        let samples = 0;

        for (let i = 0; i < boidCount; i++) {
            const prevX = swarm.posX[i];
            const prevY = swarm.posY[i];
            const prevZ = swarm.posZ[i];

            if (i % sampleStep === 0) {
                sumX += prevX;
                sumY += prevY;
                sumZ += prevZ;
                samples++;
            }

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

            matrixBuffer[offset + 0] = xx * s;
            matrixBuffer[offset + 1] = xy * s;
            matrixBuffer[offset + 2] = xz * s;
            matrixBuffer[offset + 3] = 0;

            matrixBuffer[offset + 4] = yx * s;
            matrixBuffer[offset + 5] = yy * s;
            matrixBuffer[offset + 6] = yz * s;
            matrixBuffer[offset + 7] = 0;

            matrixBuffer[offset + 8] = zx * s;
            matrixBuffer[offset + 9] = zy * s;
            matrixBuffer[offset + 10] = zz * s;
            matrixBuffer[offset + 11] = 0;

            matrixBuffer[offset + 12] = swarm.posX[i];
            matrixBuffer[offset + 13] = swarm.posY[i];
            matrixBuffer[offset + 14] = swarm.posZ[i];
            matrixBuffer[offset + 15] = 1;
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

        // Post zero-copy transferable back to main thread
        (self as any).postMessage(
            {
                type: 'frame',
                buffer: matrixBuffer,
                species: Array.from(swarm.species.subarray(0, boidCount)),
                centerX,
                centerY,
                centerZ,
                r70
            },
            [matrixBuffer.buffer]
        );

        // Allocate fresh buffer if transferred away
        matrixBuffer = new Float32Array(100000 * 16);
        isUpdating = false;
    }
};

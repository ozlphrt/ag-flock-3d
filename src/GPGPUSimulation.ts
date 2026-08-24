import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { SimulationState, FormationMode, ProceduralGenome, computeFormationPoint } from './BoidLogic';

// GLSL Fragment Shader for Position FBO Ping-Pong Integration
const positionShader = `
uniform float uDelta;
uniform float uBounds;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 posTex = texture2D(texturePosition, uv);
    vec4 velTex = texture2D(textureVelocity, uv);

    vec3 pos = posTex.xyz;
    vec3 vel = velTex.xyz;
    float speciesAndU = posTex.w; // Encodes species in integer part and u in fractional part

    // Integrate position with framerate-normalized delta scaling (eliminates micro-stuttering)
    float dtScale = clamp(uDelta * 60.0, 0.5, 2.0);
    pos += vel * dtScale;

    // Soft spherical boundary containment at R = 14.0
    float distSq = dot(pos, pos);
    if (distSq > 196.0) {
        pos *= (14.0 / sqrt(distSq));
    }

    gl_FragColor = vec4(pos, speciesAndU);
}
`;

// GLSL Fragment Shader for Velocity & Time-Decaying Stray Alignment
const velocityShader = `
uniform float uTime;
uniform float uStartTime;
uniform float uDelta;
uniform float uSpeedMult;
uniform int uFormationMode;
uniform int uPrevFormationMode;
uniform float uMorphProgress;
uniform float uLerpRate;
uniform float uMaxSpeed;
uniform float uMaxAccel;
uniform float uVolThickness;
uniform float uNoiseDrift;
uniform float uSeed;
uniform int uSpeciesCount;
uniform float uSpeciesThresholds[20];
uniform float uSpeciesSizes[20];
uniform float uSpeciesMinSizes[20];
uniform float uSpeciesMaxSizes[20];
uniform float uSpeciesAgility[20];
uniform float uSpeciesSpeed[20];
uniform float uSpeciesRandomness[20];
uniform float uSpeciesMorphProgress[20];

// Procedural Parameters
uniform int uP_family;
uniform float uP_r1, uP_r2, uP_r3;
uniform float uP_a1, uP_a2, uP_a3;
uniform float uP_k1, uP_k2, uP_k3, uP_k4, uP_k5, uP_k6, uP_k7, uP_k8;
uniform float uP_phi1, uP_phi2, uP_phi3;
uniform float uP_m, uP_n1, uP_n2, uP_n3, uP_a, uP_b;

#define PI 3.14159265358979323846
#define TWO_PI 6.28318530717958647692

// Fast Pseudo-Random Generator
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// 3D Rotation helper
vec3 rotateY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 rotateZ(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

// 3-Tier Nested Spiral Tube Sheathing (Tailored per-species pipe randomness & dispersion)
vec3 applyMultiLayerSheath(
    vec3 m,
    vec3 tanV,
    float u,
    float time,
    float sp,
    float nSeed,
    float speedMult,
    float radius,
    float angFreq,
    float vol,
    float settleDecay
) {
    vec3 tNorm = normalize(tanV + vec3(1e-6));
    vec3 pVec = (abs(tNorm.y) < 0.95) ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 normal = normalize(cross(tNorm, pVec));
    vec3 binormal = cross(tNorm, normal);

    // Look up per-species individual randomness factor (0.10 to 1.00)
    int spIdx = int(clamp(sp, 0.0, 19.0));
    float spRand = 0.50;
    for (int k = 0; k < 20; k++) {
        if (k == spIdx) {
            spRand = uSpeciesRandomness[k];
        }
    }

    // 1. Order-2 Meso cord: Integer multiple of TWO_PI ensures exact C_infinity seamless closure (no head/tail gaps)
    float windingTurns = floor(angFreq * 0.5 + 0.5);
    float cordAngle = sp * (TWO_PI / max(1.0, float(uSpeciesCount))) + (u * windingTurns * TWO_PI) + time * 0.5 * speedMult;
    float cosMeso = cos(cordAngle);
    float sinMeso = sin(cordAngle);

    // Dynamic local radial basis vectors (N2, B2) rotating with the Meso cord
    vec3 n2 = normal * cosMeso + binormal * sinMeso;
    vec3 b2 = -normal * sinMeso + binormal * cosMeso;

    // Centerline of the species cord
    vec3 p2 = m + n2 * radius;

    // 2. Order-3 Micro Child Helices (Differentiated per-species laminar ribbons with seamless periodic closure)
    float trackId = floor(fract(nSeed * 17.31) * 6.0);
    float microAngle = trackId * (TWO_PI / 6.0) + (u * 4.0 * TWO_PI) + time * 0.6 * speedMult;
    float cosMicro = cos(microAngle);
    float sinMicro = sin(microAngle);

    // Local rotating frame (N3, B3) for the child helix
    vec3 n3 = n2 * cosMicro + b2 * sinMicro;
    vec3 b3 = -n2 * sinMicro + b2 * cosMicro;

    float rMicro = (0.16 + 0.32 * spRand) * vol * (0.6 + 0.4 * ((trackId + 0.5) / 6.0));
    vec3 p3 = p2 + n3 * rMicro;

    // 3. Order-4 Nano Filaments (Tight cohesive sub-stream inside each ribbon with seamless periodic closure)
    float nanoId = floor(fract(nSeed * 43.19) * 3.0);
    float nanoAngle = nanoId * (TWO_PI / 3.0) + (u * 6.0 * TWO_PI) + time * 0.8 * speedMult;
    float rNano = (0.04 + 0.12 * spRand) * vol;
    vec3 p4 = p3 + (n3 * cos(nanoAngle) + b3 * sin(nanoAngle)) * rNano;

    return p4;
}

// Compute Target Formation Point
vec3 evaluateTopology(int mode, float u, float sp, float nSeed, float time, float speedMult, float vol, float settleDecay) {
    vec3 target = vec3(0.0);

    if (mode == 0) {
        // Quad Helix Braid
        float h = (u - 0.5) * 12.0;
        float theta = u * 8.0 * PI + time * 0.5 * speedMult;
        float R = 3.6;
        vec3 m = vec3(R * cos(theta), h, R * sin(theta));
        vec3 tanV = vec3(-R * sin(theta), 1.2, R * cos(theta));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.15, 10.0, vol, settleDecay);
    }
    else if (mode == 1) {
        // Concentric Dual Helix Sheath
        float h = (u - 0.5) * 12.0;
        bool isInner = (sp < 2.0);
        if (isInner) {
            float theta = u * 9.0 * PI + time * 0.7 * speedMult;
            vec3 m = vec3(2.2 * cos(theta), h, 2.2 * sin(theta));
            vec3 tanV = vec3(-2.2 * sin(theta), 1.2, 2.2 * cos(theta));
            target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.55, 8.0, vol * 0.8, settleDecay);
        } else {
            float theta = -u * 6.0 * PI - time * 0.5 * speedMult;
            vec3 m = vec3(4.4 * cos(theta), h, 4.4 * sin(theta));
            vec3 tanV = vec3(4.4 * sin(theta), 1.2, -4.4 * cos(theta));
            target = applyMultiLayerSheath(m, tanV, u, time, sp - 2.0, nSeed, speedMult, 0.75, 8.0, vol * 0.9, settleDecay);
        }
    }
    else if (mode == 2) {
        // Toroidal Helix Braid
        float t = u * TWO_PI + time * 0.3 * speedMult;
        float R0 = 4.8;
        vec3 m = vec3(R0 * cos(t), 0.0, R0 * sin(t));
        vec3 tanV = vec3(-R0 * sin(t), 0.0, R0 * cos(t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.35, 8.0, vol, settleDecay);
    }
    else if (mode == 3) {
        // Trefoil Braided Ribbon (2,3)
        float t = u * TWO_PI + time * 0.35 * speedMult;
        vec3 m = vec3((sin(t) + 2.0 * sin(2.0 * t)) * 1.5, (cos(t) - 2.0 * cos(2.0 * t)) * 1.5, (-sin(3.0 * t)) * 2.0);
        vec3 tanV = vec3((cos(t) + 4.0 * cos(2.0 * t)) * 1.5, (-sin(t) + 4.0 * sin(2.0 * t)) * 1.5, (-3.0 * cos(3.0 * t)) * 2.0);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 6.0, vol, settleDecay);
    }
    else if (mode == 4) {
        // Mobius Helix Braid
        float t = u * TWO_PI + time * 0.35 * speedMult;
        float halfT = t * 0.5;
        float R0 = 4.5;
        vec3 m = vec3(R0 * cos(t), sin(halfT) * 1.8, R0 * sin(t));
        vec3 tanV = vec3(-R0 * sin(t), cos(halfT) * 0.9, R0 * cos(t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.1, 7.0, vol, settleDecay);
    }
    else if (mode == 5) {
        // Lissajous Intertwined Knot
        float t = u * TWO_PI + time * 0.35 * speedMult;
        vec3 m = vec3(4.2 * sin(2.0 * t), 3.5 * cos(3.0 * t), 2.8 * sin(4.0 * t));
        vec3 tanV = vec3(8.4 * cos(2.0 * t), -10.5 * sin(3.0 * t), 11.2 * cos(4.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 6.0, vol, settleDecay);
    }
    else if (mode == 6) {
        // Caduceus Vortex: Dual Intertwined Serpents Coiling around Central Spine
        if (u < 0.18) {
            target = vec3(0.0, (u / 0.18 - 0.5) * 12.0, 0.0);
        } else {
            float segU = (u - 0.18) / 0.82;
            float h = (segU - 0.5) * 11.5;
            float strand = (mod(sp, 2.0) < 1.0 ? 0.0 : 1.0);
            float theta = segU * 8.0 * PI + time * 0.7 * speedMult + (strand * PI);
            float loopScale = sin(segU * PI * 3.0) * 1.6 + 2.8;
            vec3 m = vec3(loopScale * cos(theta), h, loopScale * sin(theta));
            vec3 tanV = vec3(-loopScale * sin(theta), 1.2, loopScale * cos(theta));
            target = applyMultiLayerSheath(m, tanV, segU, time, floor(sp * 0.5), nSeed, speedMult, 0.55, 6.0, vol, settleDecay);
        }
    }
    else if (mode == 7) {
        // Borromean Rings
        float ringIdx = mod(sp + floor(u * 3.0), 3.0);
        float t = fract(u * 3.0) * TWO_PI + time * 0.45 * speedMult;
        vec3 m = vec3(0.0);
        vec3 tanV = vec3(0.0);
        if (ringIdx < 0.5) {
            m = vec3(4.4 * cos(t), 2.5 * sin(t), 1.4 * sin(2.0 * t) + 0.9);
            tanV = vec3(-4.4 * sin(t), 2.5 * cos(t), 2.8 * cos(2.0 * t));
        } else if (ringIdx < 1.5) {
            m = vec3(1.4 * sin(2.0 * t) + 0.9, 4.4 * cos(t), 2.5 * sin(t));
            tanV = vec3(2.8 * cos(2.0 * t), -4.4 * sin(t), 2.5 * cos(t));
        } else {
            m = vec3(2.5 * sin(t), 1.4 * sin(2.0 * t) + 0.9, 4.4 * cos(t));
            tanV = vec3(2.5 * cos(t), 2.8 * cos(2.0 * t), -4.4 * sin(t));
        }
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.65, 6.0, vol, settleDecay);
    }
    else if (mode == 8) {
        // Figure-Eight Knot Braid (4_1 Listing Knot)
        float t = u * TWO_PI + time * 0.38 * speedMult;
        float rBase = 2.8 + 1.3 * cos(2.0 * t);
        vec3 m = vec3(rBase * cos(3.0 * t), rBase * sin(3.0 * t), 2.4 * sin(4.0 * t));
        vec3 tanV = vec3(-3.0 * rBase * sin(3.0 * t), 3.0 * rBase * cos(3.0 * t), 9.6 * cos(4.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 6.0, vol, settleDecay);
    }
    else if (mode == 9) {
        // Cinqfoil Knot Braid (5,2)
        float t = u * TWO_PI + time * 0.32 * speedMult;
        float r = 3.6 + 1.5 * cos(5.0 * t);
        vec3 m = vec3(r * cos(2.0 * t), r * sin(2.0 * t), -2.5 * sin(5.0 * t));
        vec3 tanV = vec3(-2.0 * r * sin(2.0 * t), 2.0 * r * cos(2.0 * t), -12.5 * cos(5.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 5.0, vol, settleDecay);
    }
    else if (mode == 10) {
        // Septafoil Stellar Braid (7,3)
        float t = u * TWO_PI + time * 0.28 * speedMult;
        float r = 3.8 + 1.6 * cos(7.0 * t);
        vec3 m = vec3(r * cos(3.0 * t), r * sin(3.0 * t), -2.6 * sin(7.0 * t));
        vec3 tanV = vec3(-3.0 * r * sin(3.0 * t), 3.0 * r * cos(3.0 * t), -18.2 * cos(7.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 7.0, vol, settleDecay);
    }
    else if (mode == 11) {
        // Fractal Supercoil
        float h = (u - 0.5) * 12.0;
        float tMacro = u * 4.0 * PI + time * 0.4 * speedMult;
        float rMacro = 3.8;
        vec3 m = vec3(rMacro * cos(tMacro), h, rMacro * sin(tMacro));
        vec3 tanV = vec3(-rMacro * sin(tMacro), 1.2, rMacro * cos(tMacro));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.35, 14.0, vol, settleDecay);
    }
    else if (mode == 12) {
        // Superhelical Torus Knot (3,5)
        float t = u * TWO_PI + time * 0.3 * speedMult;
        float r = cos(5.0 * t) * 1.6 + 4.0;
        vec3 m = vec3(r * cos(3.0 * t), sin(5.0 * t) * 2.2, r * sin(3.0 * t));
        vec3 tanV = vec3(-3.0 * r * sin(3.0 * t), 5.0 * cos(5.0 * t) * 2.2, 3.0 * r * cos(3.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.15, 14.0, vol, settleDecay);
    }
    else if (mode == 13) {
        // DNA Chromatin Solenoid
        float nBeads = 12.0;
        float beadIdx = floor(u * nBeads);
        float beadU = fract(u * nBeads);
        float beadAngle = (beadIdx / nBeads) * 6.0 * PI + time * 0.4 * speedMult;
        float bx = 3.6 * cos(beadAngle);
        float by = (beadIdx / nBeads - 0.5) * 11.0;
        float bz = 3.6 * sin(beadAngle);
        float wrapAngle = beadU * 3.3 * PI + mod(sp, 2.0) * PI + time * 1.2;
        float rBead = 0.85 + (sp >= 2.0 ? 0.35 : 0.0);
        target = vec3(bx + cos(wrapAngle) * rBead, by + (beadU - 0.5) * 0.9, bz + sin(wrapAngle) * rBead);
    }
    else if (mode == 14) {
        // Triquetra Celtic Braid (Trinity Knot)
        float t = u * TWO_PI + time * 0.38 * speedMult;
        float r = 3.3 * (1.0 + 0.48 * cos(3.0 * t));
        vec3 m = vec3(r * cos(t), r * sin(t), 2.3 * sin(3.0 * t));
        vec3 tanV = vec3(-r * sin(t), r * cos(t), 6.9 * cos(3.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 6.0, vol, settleDecay);
    }
    else if (mode == 15) {
        // Whitehead Link Braid
        float isRing = step(sp, 1.5);
        float t = u * TWO_PI + time * 0.42 * speedMult;
        if (isRing > 0.5) {
            vec3 m = vec3(4.0 * cos(t), 4.0 * sin(t), 0.7 * sin(2.0 * t));
            vec3 tanV = vec3(-4.0 * sin(t), 4.0 * cos(t), 1.4 * cos(2.0 * t));
            target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.6, 6.0, vol, settleDecay);
        } else {
            vec3 m = vec3(2.4 * sin(2.0 * t), 0.9 * sin(4.0 * t), 3.6 * cos(t));
            vec3 tanV = vec3(4.8 * cos(2.0 * t), 3.6 * cos(4.0 * t), -3.6 * sin(t));
            target = applyMultiLayerSheath(m, tanV, u, time, sp - 2.0, nSeed, speedMult, 0.6, 6.0, vol, settleDecay);
        }
    }
    else if (mode == 16) {
        // Quatrefoil Knot Braid (4-Leaf Clover Knot)
        float t = u * TWO_PI + time * 0.34 * speedMult;
        float r = 3.6 + 1.5 * cos(4.0 * t);
        vec3 m = vec3(r * cos(3.0 * t), r * sin(3.0 * t), 2.3 * sin(4.0 * t));
        vec3 tanV = vec3(-3.0 * r * sin(3.0 * t), 3.0 * r * cos(3.0 * t), 9.2 * cos(4.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 6.0, vol, settleDecay);
    }
    else if (mode == 17) {
        // Granny Knot Braid (Composite Trefoils)
        float isUpper = step(u, 0.5);
        float segU = (isUpper > 0.5) ? u * 2.0 : (u - 0.5) * 2.0;
        float t = segU * TWO_PI + time * 0.4 * speedMult;
        float yOff = (isUpper > 0.5) ? 2.2 : -2.2;
        vec3 m = vec3((sin(t) + 1.6 * sin(2.0 * t)) * 1.25, (cos(t) - 1.6 * cos(2.0 * t)) * 1.25 + yOff, (-sin(3.0 * t)) * 1.8);
        vec3 tanV = vec3((cos(t) + 3.2 * cos(2.0 * t)) * 1.25, (-sin(t) + 3.2 * sin(2.0 * t)) * 1.25, (-3.0 * cos(3.0 * t)) * 1.8);
        target = applyMultiLayerSheath(m, tanV, segU, time, sp, nSeed, speedMult, 0.75, 6.0, vol, settleDecay);
    }
    else if (mode == 18) {
        // Double Helix Braid with Cross Rungs
        float h = (u - 0.5) * 11.5;
        float theta = u * 8.0 * PI + time * 0.6 * speedMult;
        float strand = mod(sp, 2.0);
        float strandAngle = theta + (strand * PI);
        float r = 3.6;
        vec3 m = vec3(r * cos(strandAngle), h, r * sin(strandAngle));
        vec3 tanV = vec3(-r * sin(strandAngle), 1.2, r * cos(strandAngle));
        target = applyMultiLayerSheath(m, tanV, u, time, floor(sp * 0.5), nSeed, speedMult, 0.55, 6.0, vol, settleDecay);
    }
    else if (mode == 19) {
        // Triple Helix Braid
        float strand = mod(floor(u * 300.0) + sp, 3.0);
        float strandOffset = strand * (TWO_PI / 3.0);
        float theta = u * 8.0 * PI + time * 0.7 * speedMult + strandOffset;
        float h = (u - 0.5) * 11.0;
        float r = 3.4;
        vec3 m = vec3(r * cos(theta), h, r * sin(theta));
        vec3 tanV = vec3(-r * sin(theta), 1.2, r * cos(theta));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.65, 6.0, vol, settleDecay);
    }
    else if (mode == 20) {
        // DNA Ladder Braid
        float h = (u - 0.5) * 11.5;
        float theta = u * 6.0 * PI + time * 0.5 * speedMult;
        float strand = mod(sp, 2.0);
        float strandAngle = theta + (strand * PI);
        vec3 m = vec3(3.6 * cos(strandAngle), h, 3.6 * sin(strandAngle));
        vec3 tanV = vec3(-3.6 * sin(strandAngle), 1.2, 3.6 * cos(strandAngle));
        target = applyMultiLayerSheath(m, tanV, u, time, floor(sp * 0.5), nSeed, speedMult, 0.55, 6.0, vol, settleDecay);
    }
    else if (mode == 21) {
        // Gyroid Braid Labyrinth
        float t = u * TWO_PI + time * 0.3 * speedMult;
        vec3 m = vec3(
            (sin(t) * cos(t * 1.5) + cos(t * 0.5)) * 2.8,
            (sin(t * 1.5) * cos(t * 0.5) + cos(t)) * 2.8,
            (sin(t * 0.5) * cos(t) + cos(t * 1.5)) * 2.8
        );
        vec3 tanV = vec3(cos(t) * 2.8, cos(t * 1.5) * 2.8, cos(t * 0.5) * 2.8);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 6.0, vol, settleDecay);
    }
    else if (mode == 22) {
        // Lorenz Chaotic Braid (Butterfly Attractor)
        float t = u * TWO_PI + time * 0.4 * speedMult;
        float s = sin(t);
        vec3 m = vec3(s * 4.4, cos(t) * 3.8, (s > 0.0 ? 1.0 : -1.0) * (4.2 - abs(s) * 2.6));
        vec3 tanV = vec3(cos(t) * 4.4, -sin(t) * 3.8, cos(t) * 2.6);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 6.0, vol, settleDecay);
    }
    else if (mode == 23) {
        // Klein Bottle Braid
        float ku = u * TWO_PI + time * 0.25 * speedMult;
        float kv = fract(nSeed * 17.13) * TWO_PI;
        float rk = 4.0 * (1.0 - cos(ku) * 0.5);
        float kx = (rk + cos(ku * 0.5) * sin(kv) - sin(ku * 0.5) * sin(2.0 * kv)) * cos(ku);
        float ky = (rk + cos(ku * 0.5) * sin(kv) - sin(ku * 0.5) * sin(2.0 * kv)) * sin(ku);
        float kz = (sin(ku * 0.5) * sin(kv) + cos(ku * 0.5) * sin(2.0 * kv)) * 2.2;
        vec3 m = vec3(kx * 0.75, ky * 0.75, kz * 0.75);
        vec3 tanV = vec3(-ky * 0.75, kx * 0.75, kz * 0.5);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.75, 6.0, vol, settleDecay);
    }
    else if (mode == 24) {
        // Clifford Torus Braid (4D Hyper-Torus stereographic projection)
        float thC = u * TWO_PI + time * 0.35 * speedMult;
        vec3 m = vec3(4.2 * cos(thC), 4.2 * sin(thC), 0.0);
        vec3 tanV = vec3(-4.2 * sin(thC), 4.2 * cos(thC), 0.0);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.25, 8.0, vol, settleDecay);
    }
    else if (mode == 25) {
        // Ouroboros Dragon Braid
        float ringAngle = u * TWO_PI + time * 0.4 * speedMult;
        float baseR = 4.2;
        vec3 m = vec3(baseR * cos(ringAngle), sin(u * 7.0 + time) * 0.7, baseR * sin(ringAngle));
        vec3 tanV = vec3(-baseR * sin(ringAngle), 0.5, baseR * cos(ringAngle));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 8.0, vol, settleDecay);
    }
    else if (mode == 26) {
        // Dancing Ribbon Braid
        float ribT = (u - 0.5) * 11.0;
        float ribWave = ribT * 0.7 - time * 0.8 * speedMult;
        vec3 m = vec3(sin(ribWave) * 3.2, ribT * 0.85 + cos(ribWave) * 1.2, cos(ribWave) * 3.0);
        vec3 tanV = vec3(cos(ribWave) * 3.2, 0.85, -sin(ribWave) * 3.0);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 7.0, vol, settleDecay);
    }
    else if (mode == 27) {
        // Solar Flare Prominence
        float s = (u - 0.5) * PI;
        float cx = 5.2 * sin(s);
        float cy = 4.6 * cos(s) - 1.2;
        float cz = sin(s * 2.0) * 1.6;
        float thetaMag = s * 7.0 + time * 0.75 * speedMult + sp * (PI * 0.5);
        float rRope = 0.85 + 0.35 * cos(s * 2.0);
        target = vec3(cx + rRope * cos(thetaMag) * cos(s), cy - rRope * cos(thetaMag) * sin(s), cz + rRope * sin(thetaMag) * 1.3);
    }
    else if (mode == 28) {
        // Olympic Chain Link
        float ringK = mod(sp + floor(u * 4.0), 4.0);
        float ringTheta = ringK * (PI * 0.5) + time * 0.25 * speedMult;
        float cx = 3.4 * cos(ringTheta);
        float cz = 3.4 * sin(ringTheta);
        float cy = (mod(ringK, 2.0) < 0.5 ? 0.6 : -0.6);
        float tau = fract(u * 4.0) * TWO_PI + time * 0.6;
        float cosTau = cos(tau), sinTau = sin(tau);
        float cosTh = cos(ringTheta), sinTh = sin(ringTheta);
        vec3 l = vec3(2.0 * cosTau * (-sinTh) + 0.5 * sinTau * cosTh, 2.0 * sinTau, 2.0 * cosTau * cosTh + 0.5 * sinTau * sinTh);
        target = vec3(cx, cy, cz) + l;
    }
    else if (mode == 29) {
        // Saturnian Rings: Species 0 is the Dynamic Differential Planet Core Sphere; Species 1..N-1 are the Dust Rings
        if (sp < 0.5) {
            // Central Gas Giant Core Sphere with Dynamic Multi-Band Jet Streams
            float uLat = fract(u * 137.5 + nSeed * 11.3);
            float phi = asin(clamp(uLat * 2.0 - 1.0, -0.98, 0.98));
            float bandSpeed = (1.2 + 0.8 * cos(phi * 3.0)) * speedMult;
            float theta = u * 40.0 * PI + time * bandSpeed * 1.5 + (sp * TWO_PI);
            float rPlanet = 2.4 + (fract(nSeed * 13.7) - 0.5) * 0.08 * vol;
            vec3 pCore = vec3(rPlanet * cos(phi) * cos(theta), rPlanet * sin(phi) * 0.88, rPlanet * cos(phi) * sin(theta));
            target = rotateZ(pCore, 0.44); // 25° axial tilt
        } else {
            // Hyper-Dense Planetary Dust Ring System (Species 1 to N-1)
            float ringSpecies = sp - 1.0;
            float maxRingSp = max(1.0, float(uSpeciesCount - 2));
            float uRing = fract(u * 500.0);
            float ringRadius = 3.6 + (ringSpecies / maxRingSp) * 4.8 + uRing * 0.6 + (fract(nSeed * 29.13) - 0.5) * 0.12 * vol;
            float ringAngle = (uRing * 180.0 * PI) + time * (1.6 / sqrt(ringRadius)) * speedMult + nSeed * TWO_PI + (ringSpecies * 1.047);
            float ringThickness = (fract(nSeed * 31.7) - 0.5) * 0.16 * vol;
            vec3 ringPt = vec3(ringRadius * cos(ringAngle), ringThickness, ringRadius * sin(ringAngle));
            target = rotateZ(ringPt, 0.44); // 25° axial tilt
        }
    }
    else if (mode == 30) {
        // Spherical Surface Vortices: High-Speed Zonal Jet Streams, Dynamic Rossby Waves & Swirling Convection
        float uLat = fract(u * 137.5 + nSeed * 23.17);
        float phi0 = asin(clamp(uLat * 2.0 - 1.0, -0.96, 0.96)); // Continuous uniform latitude
        
        // Multi-tier alternating atmospheric jet streams (Equator East, Mid-lat West, Subpolar East)
        float jetFlow = (sin(phi0 * 5.0) * 1.6 + cos(phi0 * 2.0) * 0.9) * speedMult;
        float theta = u * 60.0 * PI + time * jetFlow * 1.4 + sp * (TWO_PI / max(1.0, float(uSpeciesCount)));
        float phi = phi0;
        
        // Stable surface shell without radial bouncing
        float rSurf = 5.2 + (fract(nSeed * 19.4) - 0.5) * 0.20 * vol;
        target = vec3(rSurf * cos(phi) * cos(theta), rSurf * sin(phi), rSurf * cos(phi) * sin(theta));
    }
    else if (mode == 31) {
        // Villarceau Torus Mantle: Continuous 2D Torus Surface & Volume (eliminates artificial 1D diagonal cut lines)
        float u1 = fract(u * 137.5077 + nSeed * 19.31);
        float u2 = fract(u * 271.3197 + nSeed * 47.13);
        float theta = u1 * TWO_PI + time * 0.30 * speedMult;
        float phi = u2 * TWO_PI + time * 0.45 * speedMult;
        float R0 = 4.4, r0 = 2.0 + (fract(nSeed * 17.5) - 0.5) * 0.18 * vol;
        target = vec3((R0 + r0 * cos(phi)) * cos(theta), r0 * sin(phi), (R0 + r0 * cos(phi)) * sin(theta));
    }
    else if (mode == 32) {
        // Galactic Spiral (4-Arm Density Wave)
        float arm = mod(sp + floor(u * 4.0), 4.0);
        float armOffset = arm * (TWO_PI / 4.0);
        float uArm = fract(u * 4.0);
        float r = 0.8 + uArm * 7.5 + (fract(nSeed * 41.3) - 0.5) * 0.18 * vol;
        float theta = armOffset + log(max(0.2, r)) * 2.2 + time * (1.8 / max(0.5, sqrt(r))) * speedMult + (fract(nSeed * 19.1) - 0.5) * 0.12;
        float zDisc = (fract(nSeed * 47.1) - 0.5) * exp(-r * 0.25) * 0.35 * vol;
        target = vec3(r * cos(theta), zDisc, r * sin(theta));
    }
    else if (mode == 33) {
        // Dyson Sphere Cage: High-Velocity Great-Circle Energy Rings & Central Churning Star
        float isCore = step(fract(u * 100.0), 0.22);
        if (isCore > 0.5) {
            // Central Star Core
            float uCoreLat = fract(u * 73.19 + nSeed * 37.1);
            float phiCore = asin(clamp(uCoreLat * 2.0 - 1.0, -0.96, 0.96));
            float thetaCore = u * 80.0 * PI + time * 1.6 * speedMult;
            float rStar = 2.0 + (fract(nSeed * 27.8) - 0.5) * 0.15 * vol;
            target = vec3(rStar * cos(phiCore) * cos(thetaCore), rStar * sin(phiCore), rStar * cos(phiCore) * sin(thetaCore));
        } else {
            // 6 Intertwined Great-Circle Armillary High-Speed Orbital Highway Tracks
            float ringId = mod(floor(u * 6.0) + sp, 6.0);
            float incAngle = ringId * (PI / 6.0); // 0°, 30°, 60°, 90°, 120°, 150°
            float nodeAngle = ringId * (TWO_PI / 6.0) + time * 0.15 * speedMult;
            float orbAngle = fract(u * 6.0) * TWO_PI + time * 2.2 * speedMult + nSeed * 0.15;
            
            float rRing = 5.4 + (fract(nSeed * 41.3) - 0.5) * 0.20 * vol;
            vec3 pOrb = vec3(rRing * cos(orbAngle), (fract(nSeed * 67.1) - 0.5) * 0.15 * vol, rRing * sin(orbAngle));
            
            // Inclination rotation around X
            float ci = cos(incAngle), si = sin(incAngle);
            vec3 pInc = vec3(pOrb.x, pOrb.y * ci - pOrb.z * si, pOrb.y * si + pOrb.z * ci);
            
            // Ascending node precession around Y
            float cn = cos(nodeAngle), sn = sin(nodeAngle);
            target = vec3(pInc.x * cn + pInc.z * sn, pInc.y, -pInc.x * sn + pInc.z * cn);
        }
    }
    else if (mode == 34) {
        // Black Hole Accretion Disk & Polar Jets
        if (u < 0.12) {
            // Relativistic Collimated Polar Jets
            float uJet = u / 0.12;
            float jetSign = (sp < 2.0) ? 1.0 : -1.0;
            float hJet = (uJet * 6.5 + 1.2) * jetSign;
            float rJet = 0.25 + uJet * 0.65 + (fract(nSeed * 15.3) - 0.5) * 0.10 * vol;
            float thetaJet = uJet * 20.0 * PI + time * 2.5 * speedMult + nSeed * TWO_PI;
            target = vec3(rJet * cos(thetaJet), hJet, rJet * sin(thetaJet));
        } else {
            // Swirling Accretion Disk
            float uDisk = (u - 0.12) / 0.88;
            float rDisk = 1.8 + uDisk * 6.2 + (fract(nSeed * 33.7) - 0.5) * 0.15 * vol;
            float omega = 3.2 / pow(rDisk, 1.5);
            float thetaDisk = uDisk * 200.0 * PI + time * omega * speedMult + nSeed * TWO_PI;
            float zDisk = (fract(nSeed * 19.3) - 0.5) * 0.08 * rDisk * vol;
            target = vec3(rDisk * cos(thetaDisk), zDisk, rDisk * sin(thetaDisk));
        }
    }
    else if (mode == 35 || mode == 36) {
        // Infinite Procedural Harmonic & Superformula Genomes
        float t = u * TWO_PI + time * 0.3 * speedMult;
        vec3 m = vec3(0.0);
        vec3 tanV = vec3(0.0, 1.0, 0.0);

        if (uP_family == 1) {
            // Family 1: 3D Torus Supercoil Knots (p, q with nested secondary and tertiary harmonics)
            float p = max(1.0, float(uP_k1));
            float q = max(1.0, float(uP_k2));
            float rMaj = 3.6 + uP_r2 * 0.3;
            float rMin = 1.4 + uP_r3 * 0.25;
            float superFreq = max(2.0, float(uP_k3));
            float rMod = rMin;

            float ct = cos(p * t);
            float st = sin(p * t);
            float cq = cos(q * t + uP_phi2);
            float sq = sin(q * t + uP_phi2);

            m = vec3(
                (rMaj + rMod * cq) * ct,
                rMod * sq * 1.5 + uP_a2 * sin(superFreq * t * 0.5),
                (rMaj + rMod * cq) * st
            );

            float d_ct = -p * st;
            float d_st = p * ct;
            float d_cq = -q * sq;
            float d_sq = q * cq;
            tanV = vec3(
                (rMod * d_cq) * ct + (rMaj + rMod * cq) * d_ct,
                (rMod * d_sq) * 1.5 + uP_a2 * superFreq * 0.5 * cos(superFreq * t * 0.5),
                (rMod * d_cq) * st + (rMaj + rMod * cq) * d_st
            );
        } else if (uP_family == 2) {
            // Family 2: 3D Epitrochoid & Hypotrochoid Vortex Knots
            float R = 3.4;
            float r = max(0.6, uP_r2);
            float d = max(0.6, uP_r1);
            float k = (R - r) / r;
            float hX = (R - r) * cos(t) + d * cos(k * t + uP_phi1);
            float hY = uP_a1 * sin(float(uP_k2) * t + uP_phi2) + uP_a2 * cos(float(uP_k4) * t);
            float hZ = (R - r) * sin(t) - d * sin(k * t + uP_phi1);
            m = vec3(hX, hY * 0.8, hZ);
            tanV = vec3(
                -(R - r) * sin(t) - d * k * sin(k * t + uP_phi1),
                (uP_a1 * float(uP_k2) * cos(float(uP_k2) * t + uP_phi2) - uP_a2 * float(uP_k4) * sin(float(uP_k4) * t)) * 0.8,
                (R - r) * cos(t) - d * k * cos(k * t + uP_phi1)
            );
        } else {
            // Family 0: Multidimensional Fourier Space Knots
            float x = uP_r1 * sin(float(uP_k1) * t + uP_phi1) + uP_r2 * sin(float(uP_k3) * t + uP_phi2) + uP_r3 * cos(float(uP_k5) * t);
            float y = uP_a1 * cos(float(uP_k2) * t + uP_phi1) + uP_a2 * sin(float(uP_k4) * t + uP_phi3) + uP_a3 * cos(float(uP_k6) * t);
            float z = uP_r1 * cos(float(uP_k1) * t + uP_phi2) + uP_r2 * cos(float(uP_k4) * t) + uP_r3 * sin(float(uP_k7) * t);

            float maxR = max(0.01, uP_r1 + uP_r2 + uP_r3);
            float scaleFit = 4.2 / maxR;
            m = vec3(x, y * 0.85, z) * scaleFit;

            float dx = float(uP_k1) * uP_r1 * cos(float(uP_k1) * t + uP_phi1) + float(uP_k3) * uP_r2 * cos(float(uP_k3) * t + uP_phi2) - float(uP_k5) * uP_r3 * sin(float(uP_k5) * t);
            float dy = -float(uP_k2) * uP_a1 * sin(float(uP_k2) * t + uP_phi1) + float(uP_k4) * uP_a2 * cos(float(uP_k4) * t + uP_phi3) - float(uP_k6) * uP_a3 * sin(float(uP_k6) * t);
            float dz = -float(uP_k1) * uP_r1 * sin(float(uP_k1) * t + uP_phi2) - float(uP_k4) * uP_r2 * sin(float(uP_k4) * t) + float(uP_k7) * uP_r3 * cos(float(uP_k7) * t);
            tanV = vec3(dx, dy * 0.85, dz);
        }

        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.25, 8.0, vol * 1.35, settleDecay);
    }
    else {
        // Universal Harmonic Ribbon Fallback
        float t = u * TWO_PI + time * 0.35 * speedMult;
        vec3 m = vec3(4.2 * cos(2.0 * t), 2.5 * sin(3.0 * t), 4.2 * sin(2.0 * t));
        vec3 tanV = vec3(-8.4 * sin(2.0 * t), 7.5 * cos(3.0 * t), 8.4 * cos(2.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.15, 6.0, vol, settleDecay);
    }

    return target;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 posTex = texture2D(texturePosition, uv);
    vec4 velTex = texture2D(textureVelocity, uv);

    vec3 pos = posTex.xyz;
    vec3 vel = velTex.xyz;

    float speciesAndU = posTex.w;
    float species = floor(speciesAndU);
    float u = fract(speciesAndU);
    float nSeed = velTex.w;

    // Fixed continuous parametric coordinate along the 3D topology (eliminates phantom tail-to-head return streams)
    float dynamicU = u;

    // Time decay calculation: misaligned boids settle into a baseline organic aura (retaining ~30% permanent noise)
    float elapsed = max(0.0, uTime - uStartTime);
    float settleDecay = 0.30 + 0.70 * exp(-elapsed * 0.12);

    // 1. Dynamic Per-Species Kinematic, Randomness & Staggered Morph Profiles (up to 20 species)
    int spIdx = int(clamp(species, 0.0, 19.0));
    float spSpeed = 1.0;
    float spAgility = 1.0;
    float spBaseScale = 1.0;
    float spMin = 0.15;
    float spMax = 3.5;
    float spRand = 0.50;
    float spMorph = uMorphProgress;

    for (int k = 0; k < 20; k++) {
        if (k == spIdx) {
            spSpeed = uSpeciesSpeed[k];
            spAgility = uSpeciesAgility[k];
            spBaseScale = uSpeciesSizes[k];
            spMin = uSpeciesMinSizes[k];
            spMax = uSpeciesMaxSizes[k];
            spRand = uSpeciesRandomness[k];
            spMorph = uSpeciesMorphProgress[k];
        }
    }

    // Evaluate target position with organic time-decaying stray noise and balanced volumetric dispersion
    vec3 targetPos = evaluateTopology(uFormationMode, dynamicU, species, nSeed, uTime, uSpeedMult, uVolThickness, settleDecay);

    // If this individual species is transitioning, evaluate previous formation with smooth quintic S-curve
    if (spMorph < 0.999) {
        vec3 prevTarget = evaluateTopology(uPrevFormationMode, dynamicU, species, nSeed, uTime, uSpeedMult, uVolThickness, settleDecay);
        float sCurve = spMorph * spMorph * spMorph * (spMorph * (spMorph * 6.0 - 15.0) + 10.0);
        targetPos = mix(prevTarget, targetPos, sCurve);
    }

    // Clamp spring target to safe sphere
    float targetDistSq = dot(targetPos, targetPos);
    if (targetDistSq > 196.0) {
        targetPos *= (14.0 / sqrt(targetDistSq));
    }

    // Compute boid size scale from nSeed (Asymmetric Long-Tail Power-Law)
    float r_sz = fract(nSeed * 97.13);
    float boidSize = 0.50;
    if (r_sz < 0.97) {
        float u1_sz = max(1e-6, fract(nSeed * 17.319));
        float u2_sz = fract(nSeed * 43.821);
        float z0_sz = sqrt(-2.0 * log(u1_sz)) * cos(TWO_PI * u2_sz);
        boidSize = clamp(0.50 * exp(z0_sz * 0.32), 0.20, 1.0);
    } else if (r_sz < 0.995) {
        float subU = (r_sz - 0.97) / 0.025;
        boidSize = 1.1 + pow(subU, 1.4) * 0.8;
    } else if (r_sz < 0.9992) {
        float subU = (r_sz - 0.995) / 0.0042;
        boidSize = 2.0 + pow(subU, 1.6) * 1.5;
    } else {
        float subU = (r_sz - 0.9992) / 0.0008;
        boidSize = 3.8 + subU * 1.4;
    }

    float spFreq = 0.55 + (float(spIdx) / max(1.0, float(uSpeciesCount - 1))) * 1.30;

    // 2. Total Effective Physical Size for this individual boid
    float effectiveSize = clamp(boidSize * spBaseScale, spMin, spMax);

    // 3. Physical Size-Inertia Law:
    // Heavy/Large boids have larger momentum & graceful turning radius
    // Nimble/Micro boids have lightning agility, snappier responsiveness & lively flutter
    float sizeAgility = clamp(1.0 / sqrt(max(0.08, effectiveSize)), 0.45, 2.40);
    float sizeSpeed = clamp(1.0 + (1.0 - effectiveSize) * 0.22, 0.70, 1.40);

    // Active morphing aerodynamic agility boost
    bool isSpeciesMorphing = (spMorph > 0.001 && spMorph < 0.999);
    float morphAgilityBoost = isSpeciesMorphing ? 1.35 : 1.0;
    float morphSpeedBoost = isSpeciesMorphing ? 1.25 : 1.0;

    float totalAgility = spAgility * sizeAgility * morphAgilityBoost;
    float totalSpeed = spSpeed * sizeSpeed * morphSpeedBoost;

    float localLerp = uLerpRate * totalAgility;
    float localMaxSpeed = uMaxSpeed * totalSpeed;

    // Smooth Critical-Damped Velocity Filter
    vec3 err = targetPos - pos;
    vec3 targetVel = err * localLerp;

    // Organic living fluid noise turbulence tailored per individual boid (decorrelated phase prevents collective bouncing)
    float activeNoise = uNoiseDrift * 0.35 * spRand * (0.35 + 0.65 * settleDecay) * totalAgility;
    if (activeNoise > 1e-5) {
        float indPhase1 = fract(nSeed * 18.28) * TWO_PI;
        float indPhase2 = fract(nSeed * 24.12) * TWO_PI;
        float indPhase3 = fract(nSeed * 14.41) * TWO_PI;
        targetVel += vec3(
            sin(uTime * 0.8 + indPhase1) * activeNoise,
            cos(uTime * 0.7 + indPhase2) * activeNoise,
            sin(uTime * 0.9 + indPhase3) * activeNoise
        );
    }

    // Analytical exponential damping with per-species/size responsiveness
    float blendRate = clamp(0.14 * totalAgility, 0.06, 0.42);
    vel = mix(vel, targetVel, blendRate);

    // Smooth soft-knee speed limiter (no hard trajectory clipping)
    float speed = length(vel);
    if (speed > localMaxSpeed && speed > 1e-6) {
        vel = (vel / speed) * (localMaxSpeed + (speed - localMaxSpeed) * 0.05);
    }

    gl_FragColor = vec4(vel, nSeed);
}
`;

export interface GPGPUController {
    renderer: THREE.WebGLRenderer;
    gpuCompute: GPUComputationRenderer;
    positionVariable: any;
    velocityVariable: any;
    positionUniforms: { [key: string]: THREE.IUniform };
    velocityUniforms: { [key: string]: THREE.IUniform };
    sizeX: number;
    sizeY: number;
    count: number;
    update: (time: number, delta: number, state: SimulationState) => void;
    getCurrentPositionTexture: () => THREE.Texture;
    getCurrentVelocityTexture: () => THREE.Texture;
}

export function createGPGPUSimulation(renderer: THREE.WebGLRenderer, population: number, state?: SimulationState): GPGPUController {
    // 250k: 512x512 = 262,144; 500k: 1024x512 = 524,288
    let sizeX = 512;
    let sizeY = 512;
    if (population > 262144) {
        sizeX = 1024;
        sizeY = 512;
    }
    const count = sizeX * sizeY;

    const gpuCompute = new GPUComputationRenderer(sizeX, sizeY, renderer);
    if (renderer.capabilities.isWebGL2 === false) {
        gpuCompute.setDataType(THREE.HalfFloatType);
    }

    const dtPosition = gpuCompute.createTexture();
    const dtVelocity = gpuCompute.createTexture();

    const posArray = dtPosition.image.data as Float32Array;
    const velArray = dtVelocity.image.data as Float32Array;

    const initialMode = state?.formationMode ?? FormationMode.QuadHelixBraid;
    const initialSeed = state?.formationSeed ?? 42.0;
    const tempPt: [number, number, number] = [0, 0, 0];
    const dist = state?.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
    const t0 = dist[0];
    const t1 = dist[0] + dist[1];
    const t2 = dist[0] + dist[1] + dist[2];

    // Initialize initial spatial distribution precisely on the target topology from frame 0
    for (let i = 0; i < count; i++) {
        const i4 = i * 4;
        const u = ((i * 137.50776405) % count) / count;
        // Low-discrepancy hash dispersion (matches GPGPUFlock.tsx exactly)
        let h = (i + 1) ^ 0x9e3779b9;
        h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
        h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
        h = (h ^ (h >>> 16)) >>> 0;
        const q = (h + 0.5) / 4294967296.0;

        let sp = 0;
        if (q < t0) sp = 0;
        else if (q < t1) sp = 1;
        else if (q < t2) sp = 2;
        else sp = 3;

        if (state) {
            computeFormationPoint(initialMode, initialSeed, u, 0, sp, i, 3.5, 0.14, state, tempPt);
            posArray[i4 + 0] = tempPt[0];
            posArray[i4 + 1] = tempPt[1];
            posArray[i4 + 2] = tempPt[2];
        } else {
            const theta = Math.random() * Math.PI * 2.0;
            const phi = Math.acos(Math.random() * 2.0 - 1.0);
            const r = 2.5 + Math.random() * 3.5;
            posArray[i4 + 0] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i4 + 1] = r * Math.cos(phi) * 0.75;
            posArray[i4 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        posArray[i4 + 3] = sp + u; // Encodes species in integer and u in decimal

        velArray[i4 + 0] = (Math.random() - 0.5) * 0.01;
        velArray[i4 + 1] = (Math.random() - 0.5) * 0.01;
        velArray[i4 + 2] = (Math.random() - 0.5) * 0.01;
        velArray[i4 + 3] = Math.random(); // Unique Noise Seed
    }

    const positionVariable = gpuCompute.addVariable('texturePosition', positionShader, dtPosition);
    const velocityVariable = gpuCompute.addVariable('textureVelocity', velocityShader, dtVelocity);

    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);

    const positionUniforms = positionVariable.material.uniforms;
    const velocityUniforms = velocityVariable.material.uniforms;

    positionUniforms.uDelta = { value: 0.016 };
    positionUniforms.uBounds = { value: 50.0 };

    velocityUniforms.uTime = { value: 0.0 };
    velocityUniforms.uStartTime = { value: 0.0 };
    velocityUniforms.uDelta = { value: 0.016 };
    velocityUniforms.uSpeedMult = { value: 0.14 };
    velocityUniforms.uFormationMode = { value: initialMode };
    velocityUniforms.uPrevFormationMode = { value: initialMode };
    velocityUniforms.uMorphProgress = { value: 1.0 };
    velocityUniforms.uLerpRate = { value: 0.16 };
    velocityUniforms.uMaxSpeed = { value: 0.55 };
    velocityUniforms.uMaxAccel = { value: 0.12 };
    velocityUniforms.uVolThickness = { value: 0.95 }; // Defined, rich volumetric pipe thickness
    velocityUniforms.uNoiseDrift = { value: 0.002 }; // Smooth cohesive laminar flow
    velocityUniforms.uSeed = { value: initialSeed };
    velocityUniforms.uSpeciesCount = { value: 4 };
    velocityUniforms.uSpeciesThresholds = { value: new Float32Array(20) };
    velocityUniforms.uSpeciesSizes = { value: new Float32Array(20) };
    velocityUniforms.uSpeciesMinSizes = { value: new Float32Array(20).fill(0.15) };
    velocityUniforms.uSpeciesMaxSizes = { value: new Float32Array(20).fill(3.5) };
    velocityUniforms.uSpeciesAgility = { value: new Float32Array(20) };
    velocityUniforms.uSpeciesSpeed = { value: new Float32Array(20) };
    velocityUniforms.uSpeciesRandomness = { value: new Float32Array(20).fill(0.5) };
    velocityUniforms.uSpeciesMorphProgress = { value: new Float32Array(20).fill(1.0) };

    // Procedural Uniforms
    velocityUniforms.uP_family = { value: 0 };
    velocityUniforms.uP_r1 = { value: 3.5 };
    velocityUniforms.uP_r2 = { value: 1.8 };
    velocityUniforms.uP_r3 = { value: 0.9 };
    velocityUniforms.uP_a1 = { value: 2.5 };
    velocityUniforms.uP_a2 = { value: 1.5 };
    velocityUniforms.uP_a3 = { value: 0.8 };
    velocityUniforms.uP_k1 = { value: 3 };
    velocityUniforms.uP_k2 = { value: 2 };
    velocityUniforms.uP_k3 = { value: 4 };
    velocityUniforms.uP_k4 = { value: 1 };
    velocityUniforms.uP_k5 = { value: 5 };
    velocityUniforms.uP_k6 = { value: 2 };
    velocityUniforms.uP_k7 = { value: 3 };
    velocityUniforms.uP_k8 = { value: 1 };
    velocityUniforms.uP_phi1 = { value: 0.0 };
    velocityUniforms.uP_phi2 = { value: 0.0 };
    velocityUniforms.uP_phi3 = { value: 0.0 };
    velocityUniforms.uP_m = { value: 4.0 };
    velocityUniforms.uP_n1 = { value: 1.0 };
    velocityUniforms.uP_n2 = { value: 1.0 };
    velocityUniforms.uP_n3 = { value: 1.0 };
    velocityUniforms.uP_a = { value: 1.0 };
    velocityUniforms.uP_b = { value: 1.0 };

    gpuCompute.init();

    return {
        renderer,
        gpuCompute,
        positionVariable,
        velocityVariable,
        positionUniforms,
        velocityUniforms,
        sizeX,
        sizeY,
        count,
        update: (time: number, delta: number, state: SimulationState) => {
            const speedMult = state.speedMultiplier ?? 0.14;
            const mode = state.formationMode ?? FormationMode.QuadHelixBraid;
            const prevMode = state.prevFormationMode ?? mode;

            // Overall & Staggered Per-Species Morph Progress calculation
            const startTime = state.transitionStartTime ?? 0.0;
            const duration = state.transitionDuration ?? 5.5;
            const elapsed = Math.max(0.0, time - startTime);
            const overallP = Math.min(1.0, elapsed / Math.max(0.1, duration));

            const offsets = state.speciesStartOffsets;
            const durations = state.speciesMorphDurations;
            const morphArr = velocityUniforms.uSpeciesMorphProgress.value as Float32Array;

            let minProgress = 1.0;
            let anyActivelyMorphing = false;

            for (let k = 0; k < 20; k++) {
                const offset = (offsets && k < offsets.length) ? offsets[k] : 0.0;
                const dur = (durations && k < durations.length) ? durations[k] : duration;
                const spElapsed = Math.max(0.0, time - (startTime + offset));
                const pK = Math.min(1.0, spElapsed / Math.max(0.1, dur));
                morphArr[k] = pK;
                if (pK < minProgress) minProgress = pK;
                if (pK > 0.001 && pK < 0.999) anyActivelyMorphing = true;
            }

            // Sync state for UI & Clock Engine
            state.morphProgress = overallP;
            const isMorphing = minProgress < 1.0 || anyActivelyMorphing;
            state.isTopologyFormed = !isMorphing;
            if (!isMorphing && !state.formedTimestamp) {
                state.formedTimestamp = time;
            }

            // Silky Smooth Morphing & Cruising Dynamics (calibrated to match CPU 50k flock)
            const speedScale = speedMult > 0 ? (speedMult / 0.14) : 1.0;
            const activeLerpRate = (isMorphing ? 0.12 : 0.08) * speedScale;
            const activeMaxSpeed = (isMorphing ? 0.24 : 0.15) * speedScale;
            const activeMaxAccel = (isMorphing ? 0.07 : 0.035) * speedScale;

            positionUniforms.uDelta.value = delta;

            velocityUniforms.uTime.value = time;
            velocityUniforms.uStartTime.value = startTime;
            velocityUniforms.uDelta.value = delta;
            velocityUniforms.uSpeedMult.value = speedMult;
            velocityUniforms.uFormationMode.value = mode;
            velocityUniforms.uPrevFormationMode.value = prevMode;
            velocityUniforms.uMorphProgress.value = overallP;
            velocityUniforms.uLerpRate.value = activeLerpRate;
            velocityUniforms.uMaxSpeed.value = activeMaxSpeed;
            velocityUniforms.uMaxAccel.value = activeMaxAccel;
            velocityUniforms.uSeed.value = state.formationSeed ?? 42.0;

            const spCount = Math.max(2, Math.min(20, state.speciesCount || state.speciesColors?.length || 4));
            velocityUniforms.uSpeciesCount.value = spCount;

            const dist = state.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
            let acc = 0;
            const threshArr = velocityUniforms.uSpeciesThresholds.value as Float32Array;
            for (let k = 0; k < 20; k++) {
                if (k < dist.length) {
                    acc += dist[k];
                    threshArr[k] = acc;
                } else {
                    threshArr[k] = 1.0;
                }
            }

            const spSizes = state.speciesSizes || [1.35, 0.90, 0.58, 0.36];
            const spMinSizes = state.speciesMinSizes;
            const spMaxSizes = state.speciesMaxSizes;
            const sizesArr = velocityUniforms.uSpeciesSizes.value as Float32Array;
            const minSizesArr = velocityUniforms.uSpeciesMinSizes.value as Float32Array;
            const maxSizesArr = velocityUniforms.uSpeciesMaxSizes.value as Float32Array;
            for (let k = 0; k < 20; k++) {
                sizesArr[k] = (k < spSizes.length) ? spSizes[k] : 1.0;
                minSizesArr[k] = (spMinSizes && k < spMinSizes.length) ? spMinSizes[k] : 0.15;
                maxSizesArr[k] = (spMaxSizes && k < spMaxSizes.length) ? spMaxSizes[k] : 3.5;
            }

            const agArr = velocityUniforms.uSpeciesAgility.value as Float32Array;
            const spdArr = velocityUniforms.uSpeciesSpeed.value as Float32Array;
            const randArr = velocityUniforms.uSpeciesRandomness.value as Float32Array;
            const spAg = state.speciesAgilities || [0.70, 1.15, 1.50, 1.95];
            const spSpd = state.speciesSpeeds || [0.85, 1.18, 1.28, 1.05];
            const spRand = state.speciesRandomness || [0.5, 0.5, 0.5, 0.5];
            for (let k = 0; k < 20; k++) {
                agArr[k] = (k < spAg.length) ? spAg[k] : 1.0;
                spdArr[k] = (k < spSpd.length) ? spSpd[k] : 1.0;
                randArr[k] = (k < spRand.length) ? spRand[k] : 0.5;
            }

            if (state.proceduralGenome) {
                const g = state.proceduralGenome;
                velocityUniforms.uP_family.value = g.family === 'superformula' ? 1 : (g.family === 'branching' ? 2 : 0);
                velocityUniforms.uP_r1.value = g.r1; velocityUniforms.uP_r2.value = g.r2; velocityUniforms.uP_r3.value = g.r3;
                velocityUniforms.uP_a1.value = g.a1; velocityUniforms.uP_a2.value = g.a2; velocityUniforms.uP_a3.value = g.a3;
                velocityUniforms.uP_k1.value = g.k1; velocityUniforms.uP_k2.value = g.k2; velocityUniforms.uP_k3.value = g.k3;
                velocityUniforms.uP_k4.value = g.k4; velocityUniforms.uP_k5.value = g.k5; velocityUniforms.uP_k6.value = g.k6;
                velocityUniforms.uP_k7.value = g.k7; velocityUniforms.uP_k8.value = g.k8;
                velocityUniforms.uP_phi1.value = g.phi1; velocityUniforms.uP_phi2.value = g.phi2; velocityUniforms.uP_phi3.value = g.phi3;
                if (g.m !== undefined) velocityUniforms.uP_m.value = g.m;
                if (g.n1 !== undefined) velocityUniforms.uP_n1.value = g.n1;
                if (g.n2 !== undefined) velocityUniforms.uP_n2.value = g.n2;
                if (g.n3 !== undefined) velocityUniforms.uP_n3.value = g.n3;
                if (g.a !== undefined) velocityUniforms.uP_a.value = g.a;
                if (g.b !== undefined) velocityUniforms.uP_b.value = g.b;
            }

            gpuCompute.compute();
        },
        getCurrentPositionTexture: () => {
            return gpuCompute.getCurrentRenderTarget(positionVariable).texture;
        },
        getCurrentVelocityTexture: () => {
            return gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
        }
    };
}

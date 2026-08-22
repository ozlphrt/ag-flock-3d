import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { SimulationState, FormationMode, ProceduralGenome } from './BoidLogic';

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

    // Integrate position: pos += vel
    pos += vel;

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

// Coordinate Frame generator with dynamic time-decaying stray alignment
vec3 applyMultiLayerSheath(vec3 m, vec3 tangent, float u, float time, float sp, float nSeed, float speedMult, float radius, float angFreq, float vol, float settleDecay) {
    vec3 tNorm = normalize(tangent);
    vec3 up = abs(tNorm.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 normal = normalize(cross(tNorm, up));
    vec3 binormal = cross(tNorm, normal);

    // 1. Order-2 Meso cord (4 species cords spiraling around macro spine)
    float cordAngle = sp * (TWO_PI / 4.0) + (u * angFreq * PI) + time * 0.6 * speedMult;
    float rx = cos(cordAngle) * radius;
    float ry = sin(cordAngle) * radius;

    // 2. Order-3 Micro multi-strands (4 clean sub-strands per species cord)
    float subStrand = floor(fract(nSeed * 13.37) * 4.0);
    float microAngle = subStrand * (TWO_PI / 4.0) + u * 24.0 * PI + time * 0.75 * speedMult;
    float rMicro = 0.16 * vol;
    rx += cos(microAngle) * rMicro;
    ry += sin(microAngle) * rMicro;

    // 3. Order-4 Volumetric Fermat Golden-Angle Radial dispersion
    float goldenAngle = 2.399963229728653;
    float pAngle = fract(nSeed * 37.19) * TWO_PI + goldenAngle * u * 8000.0;
    float pRadius = (sqrt(fract(nSeed * 89.41)) * 0.5 + 0.1) * vol * 0.60;
    rx += cos(pAngle) * pRadius;
    ry += sin(pAngle) * pRadius;

    // 4. Permanent Organic Stray Aura with Convergence:
    // ~18% of boids always maintain a subtle, gentle halo floating slightly outside the core ribbon
    float isStray = step(0.82, fract(nSeed * 19.87));
    float individualDecay = clamp(settleDecay + (fract(nSeed * 77.13) - 0.5) * 0.20, 0.25, 1.0);
    float strayAngle = nSeed * TWO_PI * 5.0 + time * 0.35 + sin(time * 0.5 + nSeed * 8.2) * 0.4;
    float strayDist = (fract(nSeed * 43.21) * 0.65 + 0.25) * vol * 2.0 * isStray * individualDecay;
    rx += cos(strayAngle) * strayDist;
    ry += sin(strayAngle) * strayDist;

    // 5. Longitudinal jitter & permanent organic particle breathing
    float longJitter = (fract(nSeed * 71.23) - 0.5) * 0.15 + (isStray * individualDecay * (fract(nSeed * 31.11) - 0.5) * 0.35);

    return m + normal * rx + binormal * ry + tNorm * longJitter;
}

// Compute Target Formation Point
vec3 evaluateTopology(int mode, float u, float sp, float nSeed, float time, float speedMult, float vol, float settleDecay) {
    vec3 target = vec3(0.0);

    // Stray flag for geometric shapes
    float isStray = step(0.82, fract(nSeed * 19.87));
    float individualDecay = clamp(settleDecay + (fract(nSeed * 77.13) - 0.5) * 0.25, 0.0, 1.0);

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
    else if (mode == 29) {
        // Saturnian Rings with Central Planetary Sphere
        float ringRadiusRatio = 0.78;
        if (u < (1.0 - ringRadiusRatio)) {
            // Central Gas Giant Core Sphere
            float uSph = u / (1.0 - ringRadiusRatio);
            float phi = acos(1.0 - 2.0 * uSph);
            float theta = sqrt(uSph * 250000.0) * 2.39996 + time * 0.25 * speedMult;
            float rPlanet = 2.4 + (fract(nSeed * 13.7) - 0.5) * 0.08 * vol + isStray * individualDecay * (fract(nSeed * 19.3) - 0.5) * 0.3;
            target = vec3(rPlanet * sin(phi) * cos(theta), rPlanet * cos(phi) * 0.92, rPlanet * sin(phi) * sin(theta));
        } else {
            // Hyper-Dense Planetary Dust Ring System
            float uRing = (u - (1.0 - ringRadiusRatio)) / ringRadiusRatio;
            float ringRadius = 4.0 + uRing * 5.2 + (fract(nSeed * 29.13) - 0.5) * 0.12 * vol;
            float ringAngle = uRing * 180.0 * PI + time * (1.2 / sqrt(ringRadius)) * speedMult + nSeed * TWO_PI;
            float ringThickness = (fract(nSeed * 31.7) - 0.5) * 0.16 * vol + isStray * individualDecay * (fract(nSeed * 53.1) - 0.5) * 0.35;
            vec3 ringPt = vec3(ringRadius * cos(ringAngle), ringThickness, ringRadius * sin(ringAngle));
            target = rotateZ(ringPt, 0.44); // 25° axial tilt
        }
    }
    else if (mode == 30) {
        // Spherical Surface Vortex
        float phi = acos(1.0 - 2.0 * u);
        float latSpeed = (sin(phi * 4.0) * 0.7 + 0.9) * speedMult;
        float theta = sqrt(u * 250000.0) * 2.39996 + time * latSpeed * 0.45 + nSeed * 0.08;
        float rSurf = 5.2 + sin(phi * 8.0 + time * 1.5) * 0.18 + (fract(nSeed * 19.4) - 0.5) * 0.22 * vol + isStray * individualDecay * (fract(nSeed * 47.9) - 0.5) * 0.4;
        target = vec3(rSurf * sin(phi) * cos(theta), rSurf * cos(phi), rSurf * sin(phi) * sin(theta));
    }
    else if (mode == 31) {
        // Villarceau Torus
        float t = u * TWO_PI + time * 0.35 * speedMult;
        float R0 = 4.2, r0 = 2.2 + (fract(nSeed * 17.5) - 0.5) * 0.20 * vol;
        float theta = t;
        float phi = t + sp * (PI * 0.5) + (fract(nSeed * 23.1) - 0.5) * 0.15 + isStray * individualDecay * (fract(nSeed * 11.2) - 0.5) * 0.35;
        target = vec3((R0 + r0 * cos(phi)) * cos(theta), r0 * sin(phi), (R0 + r0 * cos(phi)) * sin(theta));
    }
    else if (mode == 32) {
        // Galactic Spiral (4-Arm Density Wave)
        float arm = mod(sp + floor(u * 4.0), 4.0);
        float armOffset = arm * (TWO_PI / 4.0);
        float uArm = fract(u * 4.0);
        float r = 0.8 + uArm * 7.5 + (fract(nSeed * 41.3) - 0.5) * 0.18 * vol;
        float theta = armOffset + log(max(0.2, r)) * 2.2 + time * (1.8 / max(0.5, sqrt(r))) * speedMult + (fract(nSeed * 19.1) - 0.5) * 0.12;
        float zDisc = (fract(nSeed * 47.1) - 0.5) * exp(-r * 0.25) * 0.35 * vol + isStray * individualDecay * (fract(nSeed * 67.3) - 0.5) * 0.35;
        target = vec3(r * cos(theta), zDisc, r * sin(theta));
    }
    else if (mode == 33) {
        // Dyson Sphere Lattice
        float phi = acos(1.0 - 2.0 * u);
        float theta = sqrt(u * 250000.0) * 2.39996 + time * 0.2 * speedMult;
        float rDyson = 5.5 + 0.2 * sin(phi * 12.0) * cos(theta * 12.0) + (fract(nSeed * 27.8) - 0.5) * 0.16 * vol + isStray * individualDecay * (fract(nSeed * 89.1) - 0.5) * 0.35;
        target = vec3(rDyson * sin(phi) * cos(theta), rDyson * cos(phi), rDyson * sin(phi) * sin(theta));
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
            float zDisk = (fract(nSeed * 19.3) - 0.5) * 0.08 * rDisk * vol + isStray * individualDecay * (fract(nSeed * 41.7) - 0.5) * 0.3;
            target = vec3(rDisk * cos(thetaDisk), zDisk, rDisk * sin(thetaDisk));
        }
    }
    else if (mode == 35 || mode == 36) {
        // Infinite Procedural Harmonic & Superformula Genomes
        if (uP_family == 1) {
            // 3D Superformula Manifold
            float theta = u * TWO_PI + time * 0.25 * speedMult;
            float phi = (sp / 4.0 - 0.5) * PI + sin(time * 0.3) * 0.2;
            float t1 = abs(cos(uP_m * theta / 4.0) / max(0.01, uP_a));
            float t2 = abs(sin(uP_m * theta / 4.0) / max(0.01, uP_b));
            float rSup = pow(pow(t1, uP_n2) + pow(t2, uP_n3), -1.0 / max(0.01, uP_n1));
            float rScaled = clamp(rSup * 3.5, 1.2, 8.5) + (fract(nSeed * 53.1) - 0.5) * 0.20 * vol + isStray * individualDecay * (fract(nSeed * 17.9) - 0.5) * 0.4;
            target = vec3(rScaled * cos(theta) * cos(phi), rScaled * sin(phi) * 1.5, rScaled * sin(theta) * cos(phi));
        } else {
            // Harmonic Fourier Series with 3D Sheath
            float t = u * TWO_PI + time * 0.3 * speedMult;
            float x = uP_r1 * sin(uP_k1 * t + uP_phi1) + uP_r2 * sin(uP_k3 * t + uP_phi2) + uP_r3 * cos(uP_k5 * t);
            float y = uP_a1 * cos(uP_k2 * t + uP_phi1) + uP_a2 * sin(uP_k4 * t + uP_phi3) + uP_a3 * cos(uP_k6 * t);
            float z = uP_r1 * cos(uP_k1 * t + uP_phi2) + uP_r2 * cos(uP_k4 * t) + uP_r3 * sin(uP_k7 * t);
            vec3 m = vec3(x, y, z) * 1.2;
            vec3 tanV = vec3(uP_r1 * cos(uP_k1 * t), -uP_a1 * sin(uP_k2 * t), -uP_r1 * sin(uP_k1 * t));
            target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 6.0, vol, settleDecay);
        }
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

    // Time decay calculation: misaligned boids settle into a baseline organic aura (retaining ~30% permanent noise)
    float elapsed = max(0.0, uTime - uStartTime);
    float settleDecay = 0.30 + 0.70 * exp(-elapsed * 0.12);

    // Evaluate target position with organic time-decaying stray noise and balanced volumetric dispersion
    vec3 targetPos = evaluateTopology(uFormationMode, u, species, nSeed, uTime, uSpeedMult, uVolThickness, settleDecay);

    // If morphing between topologies, evaluate previous formation & apply Quintic S-Curve
    if (uMorphProgress < 1.0) {
        vec3 prevTarget = evaluateTopology(uPrevFormationMode, u, species, nSeed, uTime, uSpeedMult, uVolThickness, settleDecay);
        float p = uMorphProgress;
        float sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);
        targetPos = mix(prevTarget, targetPos, sCurve);
    }

    // Clamp spring target to safe sphere
    float targetDistSq = dot(targetPos, targetPos);
    if (targetDistSq > 196.0) {
        targetPos *= (14.0 / sqrt(targetDistSq));
    }

    // Compute boid size scale from nSeed (Box-Muller distribution)
    float u1_sz = max(1e-6, fract(nSeed * 17.319));
    float u2_sz = fract(nSeed * 43.821);
    float z0_sz = sqrt(-2.0 * log(u1_sz)) * cos(TWO_PI * u2_sz);
    float boidSize = clamp(exp(z0_sz * 0.78), 0.18, 5.5);

    // Dynamic Agility & Inertia Scaling:
    // Smaller micro-boids have low inertia: up to 2.2x speed & fast agile turns
    // Giant alpha boids have heavy inertia: 0.5x speed & majestic steady glides
    float agilityMult = clamp(1.0 / sqrt(boidSize), 0.48, 2.2);

    float localLerp = uLerpRate * agilityMult;
    float localMaxAccel = uMaxAccel * agilityMult;
    float localMaxSpeed = uMaxSpeed * agilityMult;

    // Smooth Critical-Damped Spring Physics (Zero oscillation, Zero stair-stepping)
    vec3 err = targetPos - pos;
    vec3 springForce = err * localLerp;
    vec3 dragForce = -vel * (0.12 + 0.06 * agilityMult);
    vec3 accel = springForce + dragForce;

    // Organic living fluid noise turbulence (smaller boids have higher agility/frequency)
    float activeNoise = uNoiseDrift * (0.35 + 0.65 * settleDecay);
    if (activeNoise > 1e-5) {
        float freq = 0.8 + 0.6 * agilityMult;
        accel += vec3(
            sin(uTime * 1.4 * freq + nSeed * 18.28 + pos.y * 0.4) * activeNoise * agilityMult,
            cos(uTime * 1.1 * freq + nSeed * 24.12 + pos.z * 0.4) * activeNoise * agilityMult,
            sin(uTime * 1.6 * freq + nSeed * 14.41 + pos.x * 0.4) * activeNoise * agilityMult
        );
    }

    // Soft Acceleration Clamping
    float accelMag = length(accel);
    if (accelMag > localMaxAccel && accelMag > 1e-6) {
        accel *= (localMaxAccel / accelMag);
    }

    vel += accel;

    // Velocity Clamping
    float speed = length(vel);
    if (speed > localMaxSpeed && speed > 1e-6) {
        vel *= (localMaxSpeed / speed);
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

export function createGPGPUSimulation(renderer: THREE.WebGLRenderer, population: number): GPGPUController {
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

    // Initialize initial spatial distribution
    for (let i = 0; i < count; i++) {
        const i4 = i * 4;
        const u = i / count;
        const sp = i % 4;

        const theta = Math.random() * Math.PI * 2.0;
        const phi = Math.acos(Math.random() * 2.0 - 1.0);
        const r = 2.0 + Math.random() * 6.0;

        posArray[i4 + 0] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i4 + 1] = r * Math.cos(phi);
        posArray[i4 + 2] = r * Math.sin(phi) * Math.sin(theta);
        posArray[i4 + 3] = sp + u; // Encodes species in integer and u in decimal

        velArray[i4 + 0] = (Math.random() - 0.5) * 0.02;
        velArray[i4 + 1] = (Math.random() - 0.5) * 0.02;
        velArray[i4 + 2] = (Math.random() - 0.5) * 0.02;
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
    velocityUniforms.uFormationMode = { value: FormationMode.QuadHelixBraid };
    velocityUniforms.uPrevFormationMode = { value: FormationMode.QuadHelixBraid };
    velocityUniforms.uMorphProgress = { value: 1.0 };
    velocityUniforms.uLerpRate = { value: 0.075 };
    velocityUniforms.uMaxSpeed = { value: 0.16 };
    velocityUniforms.uMaxAccel = { value: 0.028 };
    velocityUniforms.uVolThickness = { value: 0.30 }; // Defined, clean ribbon thickness
    velocityUniforms.uNoiseDrift = { value: 0.006 }; // Subtle organic fluid turbulence
    velocityUniforms.uSeed = { value: 42.0 };

    // Procedural Uniforms
    velocityUniforms.uP_family = { value: 0 };
    velocityUniforms.uP_r1 = { value: 3.5 };
    velocityUniforms.uP_r2 = { value: 1.8 };
    velocityUniforms.uP_r3 = { value: 0.9 };
    velocityUniforms.uP_a1 = { value: 2.5 };
    velocityUniforms.uP_a2 = { value: 1.2 };
    velocityUniforms.uP_a3 = { value: 0.6 };
    velocityUniforms.uP_k1 = { value: 1.0 };
    velocityUniforms.uP_k2 = { value: 2.0 };
    velocityUniforms.uP_k3 = { value: 3.0 };
    velocityUniforms.uP_k4 = { value: 4.0 };
    velocityUniforms.uP_k5 = { value: 5.0 };
    velocityUniforms.uP_k6 = { value: 1.0 };
    velocityUniforms.uP_k7 = { value: 2.0 };
    velocityUniforms.uP_k8 = { value: 3.0 };
    velocityUniforms.uP_phi1 = { value: 0.0 };
    velocityUniforms.uP_phi2 = { value: 1.57 };
    velocityUniforms.uP_phi3 = { value: 0.78 };
    velocityUniforms.uP_m = { value: 6.0 };
    velocityUniforms.uP_n1 = { value: 1.0 };
    velocityUniforms.uP_n2 = { value: 1.0 };
    velocityUniforms.uP_n3 = { value: 1.0 };
    velocityUniforms.uP_a = { value: 1.0 };
    velocityUniforms.uP_b = { value: 1.0 };

    const error = gpuCompute.init();
    if (error !== null) {
        console.error('GPGPU Initialization Error:', error);
    }

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

            // Morph Progress calculation
            const startTime = state.transitionStartTime ?? 0.0;
            const duration = state.transitionDuration ?? 7.0;
            const elapsed = Math.max(0.0, time - startTime);
            const p = Math.min(1.0, elapsed / duration);

            positionUniforms.uDelta.value = delta;

            velocityUniforms.uTime.value = time;
            velocityUniforms.uStartTime.value = startTime;
            velocityUniforms.uDelta.value = delta;
            velocityUniforms.uSpeedMult.value = speedMult;
            velocityUniforms.uFormationMode.value = mode;
            velocityUniforms.uPrevFormationMode.value = prevMode;
            velocityUniforms.uMorphProgress.value = p;
            velocityUniforms.uSeed.value = state.formationSeed ?? 42.0;

            if (state.proceduralGenome) {
                const g = state.proceduralGenome;
                velocityUniforms.uP_family.value = g.family === 'superformula' ? 1 : 0;
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

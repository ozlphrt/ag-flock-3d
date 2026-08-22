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

// GLSL Fragment Shader for Velocity & Topology Math
const velocityShader = `
uniform float uTime;
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

// Coordinate Frame generator around tangent
vec3 applyMultiLayerSheath(vec3 m, vec3 tangent, float u, float time, float sp, float nSeed, float speedMult, float radius, float angFreq, float vol) {
    vec3 tNorm = normalize(tangent);
    vec3 up = abs(tNorm.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 normal = normalize(cross(tNorm, up));
    vec3 binormal = cross(tNorm, normal);

    float cordAngle = sp * (TWO_PI / 4.0) + (u * angFreq * PI) + time * 0.6 * speedMult;
    float rx = cos(cordAngle) * radius;
    float ry = sin(cordAngle) * radius;

    // Micro-radial sheath dispersion
    float microAngle = nSeed * TWO_PI + time * 0.4;
    float microR = sqrt(fract(nSeed * 17.13)) * vol;
    rx += cos(microAngle) * microR;
    ry += sin(microAngle) * microR;

    return m + normal * rx + binormal * ry;
}

// Compute Target Formation Point
vec3 evaluateTopology(int mode, float u, float sp, float nSeed, float time, float speedMult) {
    vec3 target = vec3(0.0);

    if (mode == 0) {
        // Quad Helix Braid
        float h = (u - 0.5) * 12.0;
        float theta = u * 8.0 * PI + time * 0.5 * speedMult;
        float R = 3.6;
        vec3 m = vec3(R * cos(theta), h, R * sin(theta));
        vec3 tanV = vec3(-R * sin(theta), 1.2, R * cos(theta));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.15, 10.0, 0.28);
    }
    else if (mode == 1) {
        // Concentric Dual Helix Sheath
        float h = (u - 0.5) * 12.0;
        bool isInner = (sp < 2.0);
        if (isInner) {
            float theta = u * 9.0 * PI + time * 0.7 * speedMult;
            vec3 m = vec3(2.2 * cos(theta), h, 2.2 * sin(theta));
            vec3 tanV = vec3(-2.2 * sin(theta), 1.2, 2.2 * cos(theta));
            target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.55, 8.0, 0.20);
        } else {
            float theta = -u * 6.0 * PI - time * 0.5 * speedMult;
            vec3 m = vec3(4.4 * cos(theta), h, 4.4 * sin(theta));
            vec3 tanV = vec3(4.4 * sin(theta), 1.2, -4.4 * cos(theta));
            target = applyMultiLayerSheath(m, tanV, u, time, sp - 2.0, nSeed, speedMult, 0.75, 8.0, 0.22);
        }
    }
    else if (mode == 2) {
        // Toroidal Helix Braid
        float t = u * TWO_PI + time * 0.3 * speedMult;
        float R0 = 4.8;
        vec3 m = vec3(R0 * cos(t), 0.0, R0 * sin(t));
        vec3 tanV = vec3(-R0 * sin(t), 0.0, R0 * cos(t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.35, 8.0, 0.28);
    }
    else if (mode == 3) {
        // Trefoil Braided Ribbon (2,3)
        float t = u * TWO_PI + time * 0.35 * speedMult;
        vec3 m = vec3((sin(t) + 2.0 * sin(2.0 * t)) * 1.5, (cos(t) - 2.0 * cos(2.0 * t)) * 1.5, (-sin(3.0 * t)) * 2.0);
        vec3 tanV = vec3((cos(t) + 4.0 * cos(2.0 * t)) * 1.5, (-sin(t) + 4.0 * sin(2.0 * t)) * 1.5, (-3.0 * cos(3.0 * t)) * 2.0);
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 6.0, 0.26);
    }
    else if (mode == 4) {
        // Mobius Helix Braid
        float t = u * TWO_PI + time * 0.35 * speedMult;
        float halfT = t * 0.5;
        float R0 = 4.5;
        vec3 m = vec3(R0 * cos(t), sin(halfT) * 1.8, R0 * sin(t));
        vec3 tanV = vec3(-R0 * sin(t), cos(halfT) * 0.9, R0 * cos(t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.1, 7.0, 0.25);
    }
    else if (mode == 5) {
        // Lissajous Intertwined Knot
        float t = u * TWO_PI + time * 0.35 * speedMult;
        vec3 m = vec3(4.2 * sin(2.0 * t), 3.5 * cos(3.0 * t), 2.8 * sin(4.0 * t));
        vec3 tanV = vec3(8.4 * cos(2.0 * t), -10.5 * sin(3.0 * t), 11.2 * cos(4.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.95, 6.0, 0.26);
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
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.65, 6.0, 0.22);
    }
    else if (mode == 8) {
        // Figure-Eight Knot Braid (4_1 Listing Knot)
        float t = u * TWO_PI + time * 0.38 * speedMult;
        float rBase = 2.8 + 1.3 * cos(2.0 * t);
        vec3 m = vec3(rBase * cos(3.0 * t), rBase * sin(3.0 * t), 2.4 * sin(4.0 * t));
        vec3 tanV = vec3(-3.0 * rBase * sin(3.0 * t), 3.0 * rBase * cos(3.0 * t), 9.6 * cos(4.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 6.0, 0.24);
    }
    else if (mode == 9) {
        // Cinqfoil Knot Braid (5,2)
        float t = u * TWO_PI + time * 0.32 * speedMult;
        float r = 3.6 + 1.5 * cos(5.0 * t);
        vec3 m = vec3(r * cos(2.0 * t), r * sin(2.0 * t), -2.5 * sin(5.0 * t));
        vec3 tanV = vec3(-2.0 * r * sin(2.0 * t), 2.0 * r * cos(2.0 * t), -12.5 * cos(5.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 0.85, 5.0, 0.24);
    }
    else if (mode == 11) {
        // Fractal Supercoil
        float h = (u - 0.5) * 12.0;
        float tMacro = u * 4.0 * PI + time * 0.4 * speedMult;
        float rMacro = 3.8;
        vec3 m = vec3(rMacro * cos(tMacro), h, rMacro * sin(tMacro));
        vec3 tanV = vec3(-rMacro * sin(tMacro), 1.2, rMacro * cos(tMacro));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.35, 14.0, 0.25);
    }
    else if (mode == 12) {
        // Superhelical Torus Knot (3,5)
        float t = u * TWO_PI + time * 0.3 * speedMult;
        float r = cos(5.0 * t) * 1.6 + 4.0;
        vec3 m = vec3(r * cos(3.0 * t), sin(5.0 * t) * 2.2, r * sin(3.0 * t));
        vec3 tanV = vec3(-3.0 * r * sin(3.0 * t), 5.0 * cos(5.0 * t) * 2.2, 3.0 * r * cos(3.0 * t));
        target = applyMultiLayerSheath(m, tanV, u, time, sp, nSeed, speedMult, 1.15, 14.0, 0.25);
    }
    else if (mode == 29) {
        // Saturnian Rings with Central Planetary Sphere
        float ringRadiusRatio = 0.78;
        if (u < (1.0 - ringRadiusRatio)) {
            // Central Gas Giant Core Sphere
            float uSph = u / (1.0 - ringRadiusRatio);
            float phi = acos(1.0 - 2.0 * uSph);
            float theta = sqrt(uSph * 250000.0) * 2.39996 + time * 0.25 * speedMult;
            float rPlanet = 2.4 + fract(nSeed * 13.7) * 0.12;
            target = vec3(rPlanet * sin(phi) * cos(theta), rPlanet * cos(phi) * 0.92, rPlanet * sin(phi) * sin(theta));
        } else {
            // Hyper-Dense Planetary Dust Ring System
            float uRing = (u - (1.0 - ringRadiusRatio)) / ringRadiusRatio;
            float ringRadius = 4.2 + uRing * 4.8;
            float ringAngle = uRing * 180.0 * PI + time * (1.2 / sqrt(ringRadius)) * speedMult + nSeed * 0.05;
            float ringThickness = (fract(nSeed * 31.7) - 0.5) * 0.14;
            vec3 ringPt = vec3(ringRadius * cos(ringAngle), ringThickness, ringRadius * sin(ringAngle));
            target = rotateZ(ringPt, 0.44); // 25° axial tilt
        }
    }
    else if (mode == 30) {
        // Spherical Surface Vortex (Fibonacci Lattice with Latitudinal Jet Streams)
        float phi = acos(1.0 - 2.0 * u);
        float latSpeed = (sin(phi * 4.0) * 0.7 + 0.9) * speedMult;
        float theta = sqrt(u * 250000.0) * 2.39996 + time * latSpeed * 0.45;
        float rSurf = 5.2 + sin(phi * 8.0 + time * 1.5) * 0.18;
        target = vec3(rSurf * sin(phi) * cos(theta), rSurf * cos(phi), rSurf * sin(phi) * sin(theta));
    }
    else if (mode == 31) {
        // Villarceau Torus (Circles on Torus)
        float t = u * TWO_PI + time * 0.35 * speedMult;
        float R0 = 4.2, r0 = 2.2;
        float theta = t;
        float phi = t + sp * (PI * 0.5);
        target = vec3((R0 + r0 * cos(phi)) * cos(theta), r0 * sin(phi), (R0 + r0 * cos(phi)) * sin(theta));
    }
    else if (mode == 32) {
        // Galactic Spiral (4-Arm Density Wave)
        float arm = mod(sp + floor(u * 4.0), 4.0);
        float armOffset = arm * (TWO_PI / 4.0);
        float uArm = fract(u * 4.0);
        float r = 0.8 + uArm * 7.5;
        float theta = armOffset + log(max(0.2, r)) * 2.2 + time * (1.8 / max(0.5, sqrt(r))) * speedMult;
        float zDisc = (fract(nSeed * 47.1) - 0.5) * exp(-r * 0.25) * 0.8;
        target = vec3(r * cos(theta), zDisc, r * sin(theta));
    }
    else if (mode == 33) {
        // Dyson Sphere Lattice
        float phi = acos(1.0 - 2.0 * u);
        float theta = sqrt(u * 250000.0) * 2.39996 + time * 0.2 * speedMult;
        float rDyson = 5.5 + 0.2 * sin(phi * 12.0) * cos(theta * 12.0);
        target = vec3(rDyson * sin(phi) * cos(theta), rDyson * cos(phi), rDyson * sin(phi) * sin(theta));
    }
    else if (mode == 34) {
        // Black Hole Accretion Disk & Polar Jets
        if (u < 0.12) {
            // Relativistic Collimated Polar Jets
            float uJet = u / 0.12;
            float jetSign = (sp < 2.0) ? 1.0 : -1.0;
            float hJet = (uJet * 6.5 + 1.2) * jetSign;
            float rJet = 0.25 + uJet * 0.65;
            float thetaJet = uJet * 20.0 * PI + time * 2.5 * speedMult;
            target = vec3(rJet * cos(thetaJet), hJet, rJet * sin(thetaJet));
        } else {
            // Swirling Accretion Disk
            float uDisk = (u - 0.12) / 0.88;
            float rDisk = 1.8 + uDisk * 6.2;
            float omega = 3.2 / pow(rDisk, 1.5);
            float thetaDisk = uDisk * 200.0 * PI + time * omega * speedMult;
            float zDisk = (fract(nSeed * 19.3) - 0.5) * 0.12 * rDisk;
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
            float rScaled = clamp(rSup * 3.5, 1.2, 8.5);
            target = vec3(rScaled * cos(theta) * cos(phi), rScaled * sin(phi) * 1.5, rScaled * sin(theta) * cos(phi));
        } else {
            // Harmonic Fourier Series
            float t = u * TWO_PI + time * 0.3 * speedMult;
            float x = uP_r1 * sin(uP_k1 * t + uP_phi1) + uP_r2 * sin(uP_k3 * t + uP_phi2) + uP_r3 * cos(uP_k5 * t);
            float y = uP_a1 * cos(uP_k2 * t + uP_phi1) + uP_a2 * sin(uP_k4 * t + uP_phi3) + uP_a3 * cos(uP_k6 * t);
            float z = uP_r1 * cos(uP_k1 * t + uP_phi2) + uP_r2 * cos(uP_k4 * t) + uP_r3 * sin(uP_k7 * t);
            target = vec3(x, y, z) * 1.2;
        }
    }
    else {
        // Universal Harmonic Ribbon Fallback
        float t = u * TWO_PI + time * 0.35 * speedMult;
        float r = 4.2 + 1.2 * sin(3.0 * t + sp);
        target = vec3(r * cos(2.0 * t), 2.5 * sin(3.0 * t), r * sin(2.0 * t));
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

    // Evaluate target position for current formation
    vec3 targetPos = evaluateTopology(uFormationMode, u, species, nSeed, uTime, uSpeedMult);

    // If morphing between topologies, evaluate previous formation & apply Quintic S-Curve
    if (uMorphProgress < 1.0) {
        vec3 prevTarget = evaluateTopology(uPrevFormationMode, u, species, nSeed, uTime, uSpeedMult);
        float p = uMorphProgress;
        float sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);
        targetPos = mix(prevTarget, targetPos, sCurve);
    }

    // Clamp spring target to safe sphere
    float targetDistSq = dot(targetPos, targetPos);
    if (targetDistSq > 196.0) {
        targetPos *= (14.0 / sqrt(targetDistSq));
    }

    // Spring Relaxation
    vec3 err = targetPos - pos;
    vec3 targetVel = err * uLerpRate;

    // Noise Drift
    if (uNoiseDrift > 1e-4) {
        targetVel += vec3(
            sin(uTime * 1.5 + nSeed * 6.28) * uNoiseDrift,
            cos(uTime * 1.2 + nSeed * 8.12) * uNoiseDrift,
            sin(uTime * 1.8 + nSeed * 4.41) * uNoiseDrift
        );
    }

    // Acceleration Clamping
    vec3 accel = targetVel - vel;
    float accelMag = length(accel);
    if (accelMag > uMaxAccel && accelMag > 1e-6) {
        accel *= (uMaxAccel / accelMag);
    }

    vel += accel;

    // Velocity Clamping
    float speed = length(vel);
    if (speed > uMaxSpeed && speed > 1e-6) {
        vel *= (uMaxSpeed / speed);
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
    velocityUniforms.uDelta = { value: 0.016 };
    velocityUniforms.uSpeedMult = { value: 0.14 };
    velocityUniforms.uFormationMode = { value: FormationMode.QuadHelixBraid };
    velocityUniforms.uPrevFormationMode = { value: FormationMode.QuadHelixBraid };
    velocityUniforms.uMorphProgress = { value: 1.0 };
    velocityUniforms.uLerpRate = { value: 0.045 };
    velocityUniforms.uMaxSpeed = { value: 0.12 };
    velocityUniforms.uMaxAccel = { value: 0.0035 };
    velocityUniforms.uVolThickness = { value: 0.28 };
    velocityUniforms.uNoiseDrift = { value: 0.0 };
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

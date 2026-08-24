import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationState, SPECIES_COLORS, COLOR_PALETTES } from './BoidLogic';
import { createGPGPUSimulation, GPGPUController } from './GPGPUSimulation';
import { ClockEngine, createClockEngine } from './ClockEngine';

interface GPGPUFlockProps {
    count: number;
    state: SimulationState;
}

// Oklab Color Space Interpolation for smooth color transitions
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

    return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

export function GPGPUFlock({ count, state }: GPGPUFlockProps) {
    const { gl } = useThree();
    const meshRef = useRef<THREE.InstancedMesh>(null!);

    // Clock Engine setup
    const clockEngine = useMemo<ClockEngine>(() => {
        const engine = createClockEngine(state);
        state.clockEngine = engine;
        return engine;
    }, [state]);

    // GPGPU Simulation Controller
    const gpgpuRef = useRef<GPGPUController | null>(null);

    useEffect(() => {
        const gpgpu = createGPGPUSimulation(gl, count, state);
        gpgpuRef.current = gpgpu;
        return () => {
            // Cleanup
        };
    }, [gl, count, state]);

    const actualCapacity = count > 262144 ? 524288 : 262144;
    const sizeX = count > 262144 ? 1024 : 512;
    const sizeY = 512;

    // Instanced Geometry with UV references and precomputed facet normals (Flagship 20-Facet Geodesic Ico-Sphere)
    const geometry = useMemo(() => {
        const baseGeom = new THREE.IcosahedronGeometry(1.0, 0).toNonIndexed();
        baseGeom.computeVertexNormals();

        const instGeom = new THREE.InstancedBufferGeometry();
        instGeom.attributes.position = baseGeom.attributes.position;
        instGeom.attributes.normal = baseGeom.attributes.normal;

        const uvs = new Float32Array(actualCapacity * 2);
        const species = new Float32Array(actualCapacity);
        const sizes = new Float32Array(actualCapacity);

        const dist = state.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
        const t0 = dist[0];
        const t1 = dist[0] + dist[1];
        const t2 = dist[0] + dist[1] + dist[2];

        for (let i = 0; i < actualCapacity; i++) {
            const x = (i % sizeX) + 0.5;
            const y = Math.floor(i / sizeX) + 0.5;
            uvs[i * 2 + 0] = x / sizeX;
            uvs[i * 2 + 1] = y / sizeY;

            // Low-discrepancy hash dispersion: perfectly distributes species across 3D space, eliminating spiral parastichy bands
            let h = (i + 1) ^ 0x9e3779b9;
            h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
            h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
            h = (h ^ (h >>> 16)) >>> 0;
            species[i] = (h + 0.5) / 4294967296.0;

            // Ultra-Sparse Giant Hierarchy:
            // - 97.0% sleek fine & mid boids (0.20x - 1.0x)
            // - 2.5% slightly larger leaders (1.1x - 1.9x)
            // - 0.4% alpha giants (2.0x - 3.5x)
            // - 0.08% rare super-giant titans (3.8x - 5.2x)
            const r = Math.random();
            let scale: number;
            if (r < 0.97) {
                const u1 = Math.max(1e-6, Math.random());
                const u2 = Math.random();
                const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                scale = 0.50 * Math.exp(z * 0.32);
                scale = Math.min(1.0, Math.max(0.20, scale));
            } else if (r < 0.995) {
                const subU = (r - 0.97) / 0.025;
                scale = 1.1 + Math.pow(subU, 1.4) * 0.8;
            } else if (r < 0.9992) {
                const subU = (r - 0.995) / 0.0042;
                scale = 2.0 + Math.pow(subU, 1.6) * 1.5;
            } else {
                const subU = (r - 0.9992) / 0.0008;
                scale = 3.8 + subU * 1.4;
            }
            sizes[i] = scale;
        }

        instGeom.setAttribute('aReferenceUV', new THREE.InstancedBufferAttribute(uvs, 2));
        instGeom.setAttribute('aParticleRatio', new THREE.InstancedBufferAttribute(species, 1));
        instGeom.setAttribute('aSizeScale', new THREE.InstancedBufferAttribute(sizes, 1));
        return instGeom;
    }, [actualCapacity, sizeX, sizeY]);

    // Species color state & morphing
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
    const lastPaletteKey = useRef<string>('');

    // Per-species Material & Optical Bloom state
    const currentRoughness = useRef<[number, number, number, number]>([0.28, 0.15, 0.35, 0.22]);
    const currentMetalness = useRef<[number, number, number, number]>([0.85, 0.05, 0.05, 0.50]);
    const currentEmissive = useRef<[number, number, number, number]>([0.05, 2.40, 0.0, 0.60]);
    const currentThresholds = useRef<THREE.Vector3>(new THREE.Vector3(0.55, 0.75, 0.90));

    // Custom Shader Uniforms
    const uniformsRef = useRef<{ [key: string]: THREE.IUniform }>({
        texturePosition: { value: null },
        textureVelocity: { value: null },
        uBoidScale: { value: actualCapacity > 300000 ? 0.0095 : 0.0165 },
        uColor0: { value: currentColors.current[0] },
        uColor1: { value: currentColors.current[1] },
        uColor2: { value: currentColors.current[2] },
        uColor3: { value: currentColors.current[3] },
        uMatRoughness: { value: new THREE.Vector4(0.30, 0.28, 0.32, 0.29) },
        uMatMetalness: { value: new THREE.Vector4(0.45, 0.25, 0.65, 0.35) },
        uMatEmissive: { value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0) },
        uSpeciesSizes: { value: new THREE.Vector4(1.35, 0.90, 0.58, 0.36) },
        uDistThresholds: { value: currentThresholds.current }
    });

    // Custom Material onBeforeCompile
    const customMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            roughness: 0.28,
            metalness: 0.05,
            flatShading: false,
            fog: true
        });

        mat.onBeforeCompile = (shader) => {
            shader.uniforms.texturePosition = uniformsRef.current.texturePosition;
            shader.uniforms.textureVelocity = uniformsRef.current.textureVelocity;
            shader.uniforms.uBoidScale = uniformsRef.current.uBoidScale;
            shader.uniforms.uColor0 = uniformsRef.current.uColor0;
            shader.uniforms.uColor1 = uniformsRef.current.uColor1;
            shader.uniforms.uColor2 = uniformsRef.current.uColor2;
            shader.uniforms.uColor3 = uniformsRef.current.uColor3;
            shader.uniforms.uMatRoughness = uniformsRef.current.uMatRoughness;
            shader.uniforms.uMatMetalness = uniformsRef.current.uMatMetalness;
            shader.uniforms.uMatEmissive = uniformsRef.current.uMatEmissive;
            shader.uniforms.uSpeciesSizes = uniformsRef.current.uSpeciesSizes;
            shader.uniforms.uDistThresholds = uniformsRef.current.uDistThresholds;

            // Vertex Shader: inject reference UV & instance attributes
            shader.vertexShader = `
                attribute vec2 aReferenceUV;
                attribute float aParticleRatio;
                attribute float aSizeScale;
                uniform sampler2D texturePosition;
                uniform sampler2D textureVelocity;
                uniform float uBoidScale;
                uniform vec3 uColor0;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                uniform vec4 uMatRoughness;
                uniform vec4 uMatMetalness;
                uniform vec4 uMatEmissive;
                uniform vec4 uSpeciesSizes;
                uniform vec3 uDistThresholds;
                varying vec3 vInstanceColor;
                varying float vSpeciesRoughness;
                varying float vSpeciesMetalness;
                varying float vSpeciesEmissive;
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                vec4 posTex = texture2D(texturePosition, aReferenceUV);
                vec3 instancePos = posTex.xyz;

                float q = aParticleRatio;
                float spScale = 1.0;

                // Color & Material & Size continuous smooth evaluation per species
                if (q < uDistThresholds.x) {
                    vInstanceColor = uColor0;
                    vSpeciesRoughness = uMatRoughness.x;
                    vSpeciesMetalness = uMatMetalness.x;
                    vSpeciesEmissive = uMatEmissive.x;
                    spScale = uSpeciesSizes.x;
                } else if (q < uDistThresholds.y) {
                    vInstanceColor = uColor1;
                    vSpeciesRoughness = uMatRoughness.y;
                    vSpeciesMetalness = uMatMetalness.y;
                    vSpeciesEmissive = uMatEmissive.y;
                    spScale = uSpeciesSizes.y;
                } else if (q < uDistThresholds.z) {
                    vInstanceColor = uColor2;
                    vSpeciesRoughness = uMatRoughness.z;
                    vSpeciesMetalness = uMatMetalness.z;
                    vSpeciesEmissive = uMatEmissive.z;
                    spScale = uSpeciesSizes.z;
                } else {
                    vInstanceColor = uColor3;
                    vSpeciesRoughness = uMatRoughness.w;
                    vSpeciesMetalness = uMatMetalness.w;
                    vSpeciesEmissive = uMatEmissive.w;
                    spScale = uSpeciesSizes.w;
                }

                // Transform vertex with Gaussian bell curve scale, species average scale, and instance position
                vec3 transformed = position * (uBoidScale * aSizeScale * spScale) + instancePos;
                `
            );

            // Fragment Shader: inject species colors and PBR properties
            shader.fragmentShader = `
                varying vec3 vInstanceColor;
                varying float vSpeciesRoughness;
                varying float vSpeciesMetalness;
                varying float vSpeciesEmissive;
            ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                diffuseColor.rgb = vInstanceColor;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <roughnessmap_fragment>',
                `
                #include <roughnessmap_fragment>
                roughnessFactor = vSpeciesRoughness;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <metalnessmap_fragment>',
                `
                #include <metalnessmap_fragment>
                metalnessFactor = vSpeciesMetalness;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <emissivemap_fragment>',
                `
                #include <emissivemap_fragment>
                totalEmissiveRadiance = vInstanceColor * vSpeciesEmissive;
                `
            );
        };

        return mat;
    }, []);

    useFrame((stateContext, delta) => {
        const time = stateContext.clock.getElapsedTime();
        state.currentTime = time;
        clockEngine.update(time);

        if (gpgpuRef.current) {
            gpgpuRef.current.update(time, delta, state);
            uniformsRef.current.texturePosition.value = gpgpuRef.current.getCurrentPositionTexture();
            uniformsRef.current.textureVelocity.value = gpgpuRef.current.getCurrentVelocityTexture();
        }

        // Boid Scale based on population (thick, lush pipes matching 50k)
        const baseScale = (state.sizeMultiplier || 1.0) * (actualCapacity > 300000 ? 0.024 : 0.032);
        uniformsRef.current.uBoidScale.value = baseScale;

        // Species Color Morphing
        const newPalette = state.speciesColors || SPECIES_COLORS;
        const paletteKey = newPalette.join(',');

        if (lastPaletteKey.current !== paletteKey) {
            lastPaletteKey.current = paletteKey;
            const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
            let accumulatedLag = 0.0;
            for (let idx = 0; idx < 4; idx++) {
                const s = order[idx];
                startColors.current[s].copy(currentColors.current[s]);
                targetColors.current[s].set(newPalette[s]);
                speciesStartTimes.current[s] = time + accumulatedLag;
                speciesDurations.current[s] = 4.5 + Math.random() * 1.5;
                accumulatedLag += 1.5 + Math.random() * 1.5;
            }
        }

        for (let s = 0; s < 4; s++) {
            const sStart = speciesStartTimes.current[s];
            const sDur = speciesDurations.current[s];

            if (time < sStart) {
                currentColors.current[s].copy(startColors.current[s]);
                continue;
            }

            const colorElapsed = time - sStart;
            const colorP = Math.min(1.0, colorElapsed / sDur);
            const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

            const [L1, a1, b1] = rgbToOklab(startColors.current[s].r, startColors.current[s].g, startColors.current[s].b);
            const [L2, a2, b2] = rgbToOklab(targetColors.current[s].r, targetColors.current[s].g, targetColors.current[s].b);

            const L = L1 + (L2 - L1) * colorEase;
            const a = a1 + (a2 - a1) * colorEase;
            const b = b1 + (b2 - b1) * colorEase;

            const [r, g, b_rgb] = oklabToRgb(L, a, b);
            currentColors.current[s].setRGB(r, g, b_rgb);
        }

        uniformsRef.current.uColor0.value.copy(currentColors.current[0]);
        uniformsRef.current.uColor1.value.copy(currentColors.current[1]);
        uniformsRef.current.uColor2.value.copy(currentColors.current[2]);
        uniformsRef.current.uColor3.value.copy(currentColors.current[3]);

        // Per-Species Material & Optical Bloom Live Dynamics
        const spMats = state.speciesMaterials || [
            state.materialSettings,
            state.materialSettings,
            state.materialSettings,
            state.materialSettings
        ];

        const rate = Math.min(1.0, (delta || 0.016) * 3.5);
        for (let s = 0; s < 4; s++) {
            const targetMat = spMats[s] || state.materialSettings || { roughness: 0.28, metalness: 0.05, emissiveIntensity: 0.0 };
            const tRough = targetMat.roughness ?? 0.28;
            const tMetal = targetMat.metalness ?? 0.05;
            let tEmiss = targetMat.emissiveIntensity ?? 0.0;
            if (state.microSurpriseType === 'materialPulse' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
                tEmiss = Math.max(tEmiss, 2.0);
            }

            currentRoughness.current[s] += (tRough - currentRoughness.current[s]) * rate;
            currentMetalness.current[s] += (tMetal - currentMetalness.current[s]) * rate;
            currentEmissive.current[s] += (tEmiss - currentEmissive.current[s]) * rate;
        }

        uniformsRef.current.uMatRoughness.value.set(
            currentRoughness.current[0],
            currentRoughness.current[1],
            currentRoughness.current[2],
            currentRoughness.current[3]
        );
        uniformsRef.current.uMatMetalness.value.set(
            currentMetalness.current[0],
            currentMetalness.current[1],
            currentMetalness.current[2],
            currentMetalness.current[3]
        );
        uniformsRef.current.uMatEmissive.value.set(
            currentEmissive.current[0],
            currentEmissive.current[1],
            currentEmissive.current[2],
            currentEmissive.current[3]
        );

        const spSizes = state.speciesSizes || [1.35, 0.90, 0.58, 0.36];
        uniformsRef.current.uSpeciesSizes.value.set(
            spSizes[0],
            spSizes[1],
            spSizes[2],
            spSizes[3]
        );

        // Smooth continuous population distribution threshold morphing
        const dist = state.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
        const targetT0 = dist[0];
        const targetT1 = dist[0] + dist[1];
        const targetT2 = dist[0] + dist[1] + dist[2];
        const distRate = Math.min(1.0, (delta || 0.016) * 1.8);

        currentThresholds.current.x += (targetT0 - currentThresholds.current.x) * distRate;
        currentThresholds.current.y += (targetT1 - currentThresholds.current.y) * distRate;
        currentThresholds.current.z += (targetT2 - currentThresholds.current.z) * distRate;

        uniformsRef.current.uDistThresholds.value.copy(currentThresholds.current);

        if (!state.isReady) {
            state.isReady = true;
            if (state.onInitialLoadComplete) {
                state.onInitialLoadComplete();
            }
        }
    });

    return (
        <mesh
            ref={meshRef as any}
            geometry={geometry}
            material={customMaterial}
            frustumCulled={false}
        />
    );
}

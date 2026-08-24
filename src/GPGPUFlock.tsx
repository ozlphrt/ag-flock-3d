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

    // Species color state & morphing (up to 20 species)
    const initialPalette = state.speciesColors || COLOR_PALETTES[17];
    const startColors = useRef<THREE.Color[]>(Array.from({ length: 20 }, (_, i) => new THREE.Color(initialPalette[i % initialPalette.length] || '#ffffff')));
    const targetColors = useRef<THREE.Color[]>(Array.from({ length: 20 }, (_, i) => new THREE.Color(initialPalette[i % initialPalette.length] || '#ffffff')));
    const currentColors = useRef<THREE.Color[]>(Array.from({ length: 20 }, (_, i) => new THREE.Color(initialPalette[i % initialPalette.length] || '#ffffff')));

    const speciesStartTimes = useRef<Float32Array>(new Float32Array(20));
    const speciesDurations = useRef<Float32Array>(new Float32Array(20).fill(3.2));
    const lastPaletteKey = useRef<string>('');

    // Per-species Material & Dynamics arrays
    const currentRoughness = useRef<Float32Array>(new Float32Array(20).fill(0.30));
    const currentMetalness = useRef<Float32Array>(new Float32Array(20).fill(0.40));
    const currentSizes = useRef<Float32Array>(new Float32Array(20).fill(1.0));
    const currentMinSizes = useRef<Float32Array>(new Float32Array(20).fill(0.15));
    const currentMaxSizes = useRef<Float32Array>(new Float32Array(20).fill(3.5));
    const currentThresholds = useRef<Float32Array>(new Float32Array(20));

    // Custom Shader Uniforms
    const uniformsRef = useRef<{ [key: string]: THREE.IUniform }>({
        texturePosition: { value: null },
        textureVelocity: { value: null },
        uBoidScale: { value: actualCapacity > 300000 ? 0.0075 : 0.0125 },
        uSpeciesCount: { value: 4 },
        uSpeciesColors: { value: currentColors.current },
        uSpeciesRoughness: { value: currentRoughness.current },
        uSpeciesMetalness: { value: currentMetalness.current },
        uSpeciesSizes: { value: currentSizes.current },
        uSpeciesMinSizes: { value: currentMinSizes.current },
        uSpeciesMaxSizes: { value: currentMaxSizes.current },
        uSpeciesThresholds: { value: currentThresholds.current }
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
            shader.uniforms.uSpeciesCount = uniformsRef.current.uSpeciesCount;
            shader.uniforms.uSpeciesColors = uniformsRef.current.uSpeciesColors;
            shader.uniforms.uSpeciesRoughness = uniformsRef.current.uSpeciesRoughness;
            shader.uniforms.uSpeciesMetalness = uniformsRef.current.uSpeciesMetalness;
            shader.uniforms.uSpeciesSizes = uniformsRef.current.uSpeciesSizes;
            shader.uniforms.uSpeciesMinSizes = uniformsRef.current.uSpeciesMinSizes;
            shader.uniforms.uSpeciesMaxSizes = uniformsRef.current.uSpeciesMaxSizes;
            shader.uniforms.uSpeciesThresholds = uniformsRef.current.uSpeciesThresholds;

            // Vertex Shader: inject reference UV & instance attributes
            shader.vertexShader = `
                attribute vec2 aReferenceUV;
                attribute float aParticleRatio;
                attribute float aSizeScale;
                uniform sampler2D texturePosition;
                uniform sampler2D textureVelocity;
                uniform float uBoidScale;
                uniform int uSpeciesCount;
                uniform vec3 uSpeciesColors[20];
                uniform float uSpeciesRoughness[20];
                uniform float uSpeciesMetalness[20];
                uniform float uSpeciesSizes[20];
                uniform float uSpeciesMinSizes[20];
                uniform float uSpeciesMaxSizes[20];
                uniform float uSpeciesThresholds[20];
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

                // Match species index across up to 20 dynamically sized species
                int spIdx = 0;
                for (int k = 0; k < 19; k++) {
                    if (k < uSpeciesCount - 1 && q >= uSpeciesThresholds[k]) {
                        spIdx = k + 1;
                    }
                }

                vec3 spCol = uSpeciesColors[0];
                float spRough = uSpeciesRoughness[0];
                float spMetal = uSpeciesMetalness[0];
                float spScale = uSpeciesSizes[0];
                float spMin = uSpeciesMinSizes[0];
                float spMax = uSpeciesMaxSizes[0];

                for (int k = 0; k < 20; k++) {
                    if (k == spIdx) {
                        spCol = uSpeciesColors[k];
                        spRough = uSpeciesRoughness[k];
                        spMetal = uSpeciesMetalness[k];
                        spScale = uSpeciesSizes[k];
                        spMin = uSpeciesMinSizes[k];
                        spMax = uSpeciesMaxSizes[k];
                    }
                }

                vInstanceColor = spCol;
                vSpeciesRoughness = spRough;
                vSpeciesMetalness = spMetal;
                vSpeciesEmissive = 0.0;

                // Transform vertex with Gaussian bell curve scale, species scale, and min/max clamp
                float individualScale = clamp(aSizeScale * spScale, spMin, spMax);
                vec3 transformed = position * (uBoidScale * individualScale) + instancePos;
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

        // Species Color Morphing (up to 20 species)
        const spCount = Math.max(2, Math.min(20, state.speciesCount || state.speciesColors?.length || 4));
        uniformsRef.current.uSpeciesCount.value = spCount;

        const newPalette = state.speciesColors || COLOR_PALETTES[17];
        const paletteKey = `${spCount}:${newPalette.join(',')}`;

        if (lastPaletteKey.current !== paletteKey) {
            lastPaletteKey.current = paletteKey;
            const order = Array.from({ length: spCount }, (_, i) => i).sort(() => Math.random() - 0.5);
            let accumulatedLag = 0.0;
            for (let idx = 0; idx < spCount; idx++) {
                const s = order[idx];
                const targetHex = newPalette[s % newPalette.length] || '#ffffff';
                startColors.current[s].copy(currentColors.current[s]);
                targetColors.current[s].set(targetHex);
                speciesStartTimes.current[s] = time + accumulatedLag;
                speciesDurations.current[s] = 3.5 + Math.random() * 1.5;
                accumulatedLag += 0.4 + Math.random() * 0.4;
            }
        }

        for (let s = 0; s < 20; s++) {
            if (s >= spCount) {
                currentColors.current[s].copy(currentColors.current[s % spCount]);
                continue;
            }

            const sStart = speciesStartTimes.current[s];
            const sDur = speciesDurations.current[s];

            if (time < sStart) {
                currentColors.current[s].copy(startColors.current[s]);
                continue;
            }

            const colorElapsed = time - sStart;
            const colorP = Math.min(1.0, colorElapsed / Math.max(0.1, sDur));
            const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

            const [L1, a1, b1] = rgbToOklab(startColors.current[s].r, startColors.current[s].g, startColors.current[s].b);
            const [L2, a2, b2] = rgbToOklab(targetColors.current[s].r, targetColors.current[s].g, targetColors.current[s].b);

            const L = L1 + (L2 - L1) * colorEase;
            const a = a1 + (a2 - a1) * colorEase;
            const b = b1 + (b2 - b1) * colorEase;

            const [r, g, b_rgb] = oklabToRgb(L, a, b);
            currentColors.current[s].setRGB(r, g, b_rgb);
        }

        // Per-Species Material Live Dynamics
        const spMats = state.speciesMaterials;
        const rate = Math.min(1.0, (delta || 0.016) * 3.5);
        for (let s = 0; s < 20; s++) {
            const targetMat = (spMats && spMats[s]) || state.materialSettings || { roughness: 0.30, metalness: 0.35, emissiveIntensity: 0.0 };
            const tRough = targetMat.roughness ?? 0.30;
            const tMetal = targetMat.metalness ?? 0.35;

            currentRoughness.current[s] += (tRough - currentRoughness.current[s]) * rate;
            currentMetalness.current[s] += (tMetal - currentMetalness.current[s]) * rate;
        }

        // Species Sizes & Min/Max Extents
        const spSizes = state.speciesSizes;
        const spMinSizes = state.speciesMinSizes;
        const spMaxSizes = state.speciesMaxSizes;
        for (let s = 0; s < 20; s++) {
            const tSize = (spSizes && s < spSizes.length) ? spSizes[s] : 1.0;
            const tMin = (spMinSizes && s < spMinSizes.length) ? spMinSizes[s] : 0.15;
            const tMax = (spMaxSizes && s < spMaxSizes.length) ? spMaxSizes[s] : 3.5;

            currentSizes.current[s] += (tSize - currentSizes.current[s]) * rate;
            currentMinSizes.current[s] += (tMin - currentMinSizes.current[s]) * rate;
            currentMaxSizes.current[s] += (tMax - currentMaxSizes.current[s]) * rate;
        }

        // Smooth population distribution threshold morphing across N species
        const dist = state.speciesDistribution || [0.55, 0.20, 0.15, 0.10];
        let acc = 0;
        const distRate = Math.min(1.0, (delta || 0.016) * 1.8);
        for (let k = 0; k < 20; k++) {
            if (k < dist.length) {
                acc += dist[k];
                currentThresholds.current[k] += (acc - currentThresholds.current[k]) * distRate;
            } else {
                currentThresholds.current[k] = 1.0;
            }
        }

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

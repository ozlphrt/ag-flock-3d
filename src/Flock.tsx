import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Boid, BlobCenter, SimulationState, SpeciesType, SPECIES_COLORS, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, computeFormationPoint } from './BoidLogic'
import { getRLPreferences, sampleRLAttribute, generateProceduralGenome } from './RLEngine'

interface FlockProps {
    count: number;
    state: SimulationState;
    setPopulation: (n: number | ((prev: number) => number)) => void;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const tempTarget = new THREE.Vector3();

export function Flock({ count, state, setPopulation }: FlockProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const { controls } = useThree();

    const smoothCenter = useRef(new THREE.Vector3(0, 0, 0));
    const smoothDistance = useRef(110.0);
    const smoothCamTarget = useRef(new THREE.Vector3(80, 65, 100));
    const smoothLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const recentFormationsHistory = useRef<number[]>([]);
    const lastInteractionTime = useRef<number>(0);

    useEffect(() => {
        const handleInteraction = () => {
            lastInteractionTime.current = performance.now();
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (e.buttons > 0) handleInteraction();
        };

        window.addEventListener('pointerdown', handleInteraction);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('wheel', handleInteraction, { passive: true });
        window.addEventListener('touchstart', handleInteraction, { passive: true });

        return () => {
            window.removeEventListener('pointerdown', handleInteraction);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('wheel', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    // Pre-rotated geometry
    const geometry = useMemo(() => {
        // ConeGeometry rotated for realistic boid/organic pointing
        const g = new THREE.ConeGeometry(0.12, 0.45, 8);
        g.rotateX(Math.PI / 2);
        return g;
    }, []);

    const boids = useRef<Boid[]>([]);
    const blobCentersRef = useRef<BlobCenter[]>([]);
    const lastSeed = useRef<number>(-1);
    const lastMode = useRef<number>(-1);
    const lastPaletteKey = useRef<string>('');
    const colorTransitionStartTime = useRef<number>(0);

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

    // Initialize Blob Centers once (or when interactions change)
    if (blobCentersRef.current.length === 0) {
        for (let s = 0; s < 4; s++) {
            const baseR = 2.0 + s * 1.8;
            const nBlobs = 3; // 3 distinct blobs per species (12 total mixed-color blobs!)
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

    // Initialize/Update Boid Population (mixed color blobs!)
    useMemo(() => {
        const centers = blobCentersRef.current;
        if (centers.length === 0) return;

        if (boids.current.length < count) {
            const speciesBaseSizes = [0.45, 0.30, 0.18, 0.10];
            const additional = Array.from({ length: count - boids.current.length }, (_, idx) => {
                const species = Math.floor(Math.random() * 4) as SpeciesType;
                const baseSize = speciesBaseSizes[species];

                // Fine-grain micro-shard size variance (max size ~0.6)
                const sizeVariance = 0.4 + Math.pow(Math.random(), 2.0) * 0.5;
                const isAlphaLeader = (idx % 12 === 0);
                const isTitanLeader = (idx % 45 === 0);
                const leaderMult = isTitanLeader ? 1.25 : (isAlphaLeader ? 1.1 : 1.0);
                const size = baseSize * sizeVariance * leaderMult;
                
                // Uniformly assign to ANY active blob center to form multi-color organic blobs!
                const assignedBlob = centers[Math.floor(Math.random() * centers.length)];

                // 3D Gaussian local offset using Box-Muller transform
                const u1 = Math.random(), u2 = Math.random(), u3 = Math.random(), u4 = Math.random();
                const mag1 = 1.0 * Math.sqrt(-2.0 * Math.log(u1 + 1e-9));
                const mag2 = 1.0 * Math.sqrt(-2.0 * Math.log(u3 + 1e-9));
                
                const dx = mag1 * Math.cos(u2 * Math.PI * 2.0) * 1.2;
                const dy = mag1 * Math.sin(u2 * Math.PI * 2.0) * 1.2;
                const dz = mag2 * Math.cos(u4 * Math.PI * 2.0) * 1.2;

                return new Boid(
                    0, 0, 0,
                    species,
                    size,
                    assignedBlob,
                    new THREE.Vector3(dx, dy, dz)
                );
            });
            boids.current.push(...additional);
        } else if (boids.current.length > count) {
            boids.current.splice(count);
        }

        // Update species index distribution and snap initial position directly to target formation point on spawn!
        const speciesCounts = [0, 0, 0, 0];
        boids.current.forEach(b => {
            b.indexInSpecies = speciesCounts[b.species]++;
        });
        boids.current.forEach(b => {
            b.totalInSpecies = speciesCounts[b.species];
            const u = b.indexInSpecies / (b.totalInSpecies > 0 ? b.totalInSpecies : 100);
            const mode = state.formationMode !== undefined ? state.formationMode : 0;
            const seed = state.formationSeed !== undefined ? state.formationSeed : 42;
            const [tx, ty, tz] = computeFormationPoint(mode, seed, u, 0, b.species, b.indexInSpecies, 3.5, state.speedMultiplier, state);
            
            // Only set position if it's currently at origin (0,0,0) or brand new spawn
            if (b.position.lengthSq() < 1e-3) {
                b.position.set(tx, ty, tz);
            }
        });
    }, [count]);

    // Update colors whenever population changes
    useEffect(() => {
        if (!meshRef.current) return;
        meshRef.current.count = boids.current.length;

        boids.current.forEach((boid, i) => {
            tempColor.set(SPECIES_COLORS[boid.species]);
            meshRef.current.setColorAt(i, tempColor);
        });

        meshRef.current.instanceColor!.needsUpdate = true;
    }, [count]);

    useFrame((stateContext) => {
        if (!meshRef.current) return;
        let boidsList = boids.current;
        let boidCount = boidsList.length;
        const time = stateContext.clock.getElapsedTime();

        // 1. Advance Blob Centers on CPU (O(B^2) where B=12 - virtually instant!)
        const centers = blobCentersRef.current;
        const speed = state.attributes[0].maxSpeed * state.speedMultiplier;
        for (const center of centers) {
            center.update(centers, state.interactions, speed, time);
        }

        // 2. Advance Particles pass (O(N) - extremely fast!)
        for (let i = 0; i < boidCount; i++) {
            const boid = boidsList[i];
            boid.update(state, time);

            tempObject.position.copy(boid.position);
            tempObject.scale.setScalar(boid.size * state.sizeMultiplier * 0.5);

            // Orient the cone's pointy tip towards its movement direction
            if (boid.velocity && boid.velocity.lengthSq() > 1e-6) {
                tempTarget.addVectors(boid.position, boid.velocity);
                tempObject.lookAt(tempTarget);
            }

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

        // 2.5 Liquid HSL Shortest-Arc Color Interpolation over 14.0 seconds (Zero RGB mud, zero hue snap)
        const newPalette = state.speciesColors || SPECIES_COLORS;
        const paletteKey = newPalette.join(',');

        if (lastPaletteKey.current !== paletteKey) {
            lastPaletteKey.current = paletteKey;
            colorTransitionStartTime.current = time;

            for (let s = 0; s < 4; s++) {
                startColors.current[s].copy(currentColors.current[s]);
                targetColors.current[s].set(newPalette[s]);
            }
        }

        if (lastSeed.current !== state.formationSeed || lastMode.current !== state.formationMode) {
            lastSeed.current = state.formationSeed;
            lastMode.current = state.formationMode;
            state.transitionStartTime = time;
        }

        const colorElapsed = Math.max(0.0, time - colorTransitionStartTime.current);
        const colorP = Math.min(1.0, colorElapsed / 9.0); // 9.0s liquid smooth HSL color glide (matches formation morph speed)
        // Quintic Smoothstep Ease-In & Ease-Out S-Curve: 6p^5 - 15p^4 + 10p^3
        const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

        const hsl1 = { h: 0, s: 0, l: 0 };
        const hsl2 = { h: 0, s: 0, l: 0 };

        let colorsChanged = false;
        for (let s = 0; s < 4; s++) {
            const prevHex = currentColors.current[s].getHex();
            
            startColors.current[s].getHSL(hsl1);
            targetColors.current[s].getHSL(hsl2);

            // Shortest circular arc on HSL color wheel
            let dHue = hsl2.h - hsl1.h;
            if (dHue > 0.5) dHue -= 1.0;
            if (dHue < -0.5) dHue += 1.0;

            let h = (hsl1.h + dHue * colorEase) % 1.0;
            if (h < 0) h += 1.0;
            const sat = hsl1.s + (hsl2.s - hsl1.s) * colorEase;
            const light = hsl1.l + (hsl2.l - hsl1.l) * colorEase;

            currentColors.current[s].setHSL(h, sat, light);

            if (currentColors.current[s].getHex() !== prevHex) {
                colorsChanged = true;
            }
        }

        if (colorsChanged || colorP < 1.0) {
            boidsList.forEach((boid, i) => {
                meshRef.current.setColorAt(i, currentColors.current[boid.species]);
            });
            meshRef.current.instanceColor!.needsUpdate = true;
        }

        // 2.8 Auto-Cycle Formations (RL-guided order + Procedural DNA): 30.0s total per preset
        state.currentTime = time;
        if (state.isInspecting) {
            state.transitionStartTime = time - 9.0; // Hold formation at 9s steady morph state during inspection
        }
        const startTime = (state && state.transitionStartTime !== undefined) ? state.transitionStartTime : 0.0;
        const elapsed = Math.max(0.0, time - startTime);
        const totalCycleTime = 30.0;
        if (elapsed >= totalCycleTime && !state.isInspecting) {
            const currentMode = state.formationMode !== undefined ? state.formationMode : 0;
            const prefs = getRLPreferences();

            // Sample next formation (31 options) with Anti-Saturation exclusion and Net RL Likes - Dislikes
            const history = recentFormationsHistory.current;
            let nextMode = sampleRLAttribute(
                31,
                prefs.formationLikes,
                prefs.formationDislikes,
                prefs.totalLikes,
                prefs.totalDislikes,
                history
            ) as FormationMode;

            if (nextMode === currentMode) {
                nextMode = ((currentMode + 1) % 31) as FormationMode;
            }

            history.push(nextMode);
            if (history.length > 6) history.shift();

            // Save previous formation state for 100% gradual Quintic Ease-In / Ease-Out morphing
            state.prevFormationMode = state.formationMode;
            state.prevFormationSeed = state.formationSeed;

            state.formationMode = nextMode;
            state.formationSeed = Math.random() * 10000;
            state.transitionStartTime = time;
            state.transitionDuration = 9.0;
            state.isCameraLocked = false;

            if (nextMode === FormationMode.Procedural || !state.proceduralGenome) {
                state.proceduralGenome = generateProceduralGenome();
            }

            // Randomize Palette & Material Aesthetics based on RL Positive + Negative feedback
            const randomPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
            state.speciesColors = [...randomPalette];

            if (state.autoShape !== false) {
                state.boidShape = sampleRLAttribute(
                    8,
                    prefs.shapeLikes,
                    prefs.shapeDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes
                );
            }

            if (state.autoMaterial !== false) {
                const sampledMatIdx = sampleRLAttribute(
                    MATERIAL_PRESETS.length,
                    prefs.materialLikes,
                    prefs.materialDislikes,
                    prefs.totalLikes,
                    prefs.totalDislikes
                );
                state.materialPreset = sampledMatIdx;
                state.materialSettings = { ...MATERIAL_PRESETS[sampledMatIdx].settings };
            }

            const sepPreset = [4.2, 3.8, 3.5, 4.0];
            const spdPreset = [0.65, 0.55, 0.45, 0.60];
            const radPreset = [6.5, 5.5, 4.5, 6.0];
            state.attributes.forEach((attr, idx) => {
                attr.separationWeight = sepPreset[idx];
                attr.alignmentWeight = 1.2;
                attr.cohesionWeight = 1.0;
                attr.maxSpeed = spdPreset[idx];
                attr.perceptionRadius = radPreset[idx];
            });
        }

        // 3. Dynamic multi-harmonic cinematic camera choreography & dramatic perspective angles
        if (boidCount > 0) {
            let sumX = 0, sumY = 0, sumZ = 0;
            const sampleStep = Math.max(1, Math.floor(boidCount / 100));
            let samples = 0;
            for (let i = 0; i < boidCount; i += sampleStep) {
                const p = boidsList[i].position;
                sumX += p.x;
                sumY += p.y;
                sumZ += p.z;
                samples++;
            }
            const centerX = samples > 0 ? sumX / samples : 0;
            const centerY = samples > 0 ? sumY / samples : 0;
            const centerZ = samples > 0 ? sumZ / samples : 0;

            const dists: number[] = [];
            for (let i = 0; i < boidCount; i += sampleStep) {
                const p = boidsList[i].position;
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const dz = p.z - centerZ;
                dists.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
            }
            dists.sort((a, b) => a - b);
            const p80Index = Math.min(dists.length - 1, Math.floor(dists.length * 0.80));
            const r80 = dists.length > 0 ? dists[p80Index] : 10.0;
            const targetRadius = Math.max(4.0, r80);

            const perspCam = stateContext.camera as THREE.PerspectiveCamera;
            const fovRad = (perspCam.fov || 75) * (Math.PI / 180);
            const requiredDist = (targetRadius / Math.sin(fovRad / 2)) * 0.90;
            const targetDist = THREE.MathUtils.clamp(requiredDist, 8.0, 32.0);

            // Dynamic camera tracking lerp (snappy yet smooth)
            smoothCenter.current.lerp(new THREE.Vector3(centerX, centerY, centerZ), 0.02);
            smoothDistance.current = THREE.MathUtils.lerp(smoothDistance.current, targetDist, 0.015);

            // Multi-harmonic orbital motion with wide pitch variation (hero low shots + high isometric plan views)
            const orbitTime = time * 0.07;
            const camAngle = orbitTime;
            // Pitch oscillates smoothly between low hero angles (-0.1 rad / -6°) and high isometric angles (0.75 rad / 43°)
            const camPitch = 0.32 + Math.sin(time * 0.09) * 0.38 + Math.cos(time * 0.04) * 0.12;
            // Distance modulates dynamically between tight close-ups and dramatic wide overviews
            const distMod = 0.82 + Math.sin(time * 0.065) * 0.20 + Math.sin(time * 0.14) * 0.06;
            // Vertical offset swoop
            const camOffsetY = Math.sin(time * 0.08) * 3.2 + Math.cos(time * 0.03) * 1.8;

            const finalDist = smoothDistance.current * distMod;
            const targetCamX = smoothCenter.current.x + finalDist * Math.cos(camAngle) * Math.cos(camPitch);
            const targetCamY = smoothCenter.current.y + camOffsetY + finalDist * Math.sin(camPitch);
            const targetCamZ = smoothCenter.current.z + finalDist * Math.sin(camAngle) * Math.cos(camPitch);

            const activeControls = controls as any;
            const isDraggingNow = activeControls?.state !== undefined && activeControls?.state !== -1;
            if (isDraggingNow) {
                lastInteractionTime.current = performance.now();
            }

            const timeSinceInteraction = performance.now() - lastInteractionTime.current;
            const isUserOverriding = timeSinceInteraction < 10000; // 10 seconds manual drag override

            if (!isUserOverriding) {
                // Responsive & cinematic camera motion (0.015 lerp factor)
                const rawGoal = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
                smoothCamTarget.current.lerp(rawGoal, 0.015);
                smoothLookTarget.current.lerp(smoothCenter.current, 0.02);

                stateContext.camera.position.copy(smoothCamTarget.current);
                if (activeControls && activeControls.target) {
                    activeControls.target.copy(smoothLookTarget.current);
                    activeControls.update();
                } else {
                    stateContext.camera.lookAt(smoothLookTarget.current);
                }
            } else {
                // Keep smoothCamTarget seamlessly in sync with manual user drag
                smoothCamTarget.current.copy(stateContext.camera.position);
                if (activeControls && activeControls.target) {
                    smoothLookTarget.current.copy(activeControls.target);
                }
            }
        }
    });

    // 8 Pre-calculated distinct Hard-Edged Low-Poly 3D Geometries
    const geometries = useMemo(() => {
        // 0. Stealth Arrowhead Jet (3-sided sharp aerodynamic wedge)
        const g0 = new THREE.ConeGeometry(0.16, 0.5, 3);
        g0.rotateX(Math.PI / 2);

        // 1. Faceted Gemstone Octahedron (8-faced dual-pointed crystal)
        const g1 = new THREE.OctahedronGeometry(0.22, 0);
        g1.scale(0.8, 0.8, 1.4);

        // 2. Angular Prism Pyramid (4-sided sharp pyramid crystal)
        const g2 = new THREE.ConeGeometry(0.18, 0.48, 4);
        g2.rotateX(Math.PI / 2);

        // 3. Low-Poly Hex Shield (6-sided faceted shield interceptor)
        const g3 = new THREE.ConeGeometry(0.2, 0.45, 6);
        g3.rotateX(Math.PI / 2);

        // 4. Swept Delta Wing (4-sided swept-back wing blade)
        const g4 = new THREE.CylinderGeometry(0.02, 0.22, 0.45, 4);
        g4.rotateX(Math.PI / 2);
        g4.scale(1.3, 0.5, 1.0);

        // 5. Dodecahedron Core (12-faced hard-edged platonic polyhedron)
        const g5 = new THREE.DodecahedronGeometry(0.18, 0);

        // 6. Sharp Tetrahedral Shard (Ultra-sharp 4-faced wedge shard)
        const g6 = new THREE.TetrahedronGeometry(0.2, 0);
        g6.scale(0.7, 0.7, 1.5);

        // 7. Faceted Energy Orb (20-faced low-poly icosahedron)
        const g7 = new THREE.IcosahedronGeometry(0.18, 0);

        return [g0, g1, g2, g3, g4, g5, g6, g7];
    }, []);

    const mat = state.materialSettings || { roughness: 0.25, metalness: 0.5, wireframe: false, flatShading: false, emissiveIntensity: 0.0 };
    const activeShapeIdx = state.boidShape !== undefined ? Math.abs(state.boidShape) % geometries.length : 0;
    const activeGeometry = geometries[activeShapeIdx];

    return (
        <instancedMesh key={activeShapeIdx} ref={meshRef} args={[activeGeometry, undefined, count]} castShadow receiveShadow>
            <meshStandardMaterial
                key={`${mat.flatShading ? 'f' : 's'}`}
                roughness={mat.roughness}
                metalness={mat.metalness}
                wireframe={false}
                flatShading={mat.flatShading}
                emissiveIntensity={mat.emissiveIntensity}
                toneMapped={true}
            />
        </instancedMesh>
    );
}

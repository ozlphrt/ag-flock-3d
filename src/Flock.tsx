import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Boid, BlobCenter, SimulationState, SpeciesType, SPECIES_COLORS, DefeatScenario, FormationMode, COLOR_PALETTES, MATERIAL_PRESETS, computeFormationPoint } from './BoidLogic'
import { createClockEngine, ClockEngine } from './ClockEngine'

interface FlockProps {
    count: number;
    state: SimulationState;
    setPopulation: (n: number | ((prev: number) => number)) => void;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const tempTarget = new THREE.Vector3();

// Helper to categorize camera profiles by formation
function getCameraCategory(formation: FormationMode): 'portrait' | 'tunnel' | 'overhead' | 'cinematic_sweep' | 'dynamic_burst' | 'orbit_wide' | 'intimate_close' | 'chaotic' {
    switch (formation) {
        case FormationMode.PulsingHeart:
        case FormationMode.PhoenixWings:
        case FormationMode.JellyfishPulse:
        case FormationMode.BioMushroom:
        case FormationMode.CoralReef:
        case FormationMode.OuroborosSerpent:
        case FormationMode.KleinBottle4D:
            return 'portrait';
        case FormationMode.DoubleHelix:
        case FormationMode.TripleHelix:
        case FormationMode.Spiral:
        case FormationMode.TornadoFunnel:
        case FormationMode.DNALadder:
        case FormationMode.BlackHoleJet:
        case FormationMode.HourglassVortex:
        case FormationMode.HopfFibration:
            return 'tunnel';
        case FormationMode.SpiderWeb:
        case FormationMode.GeologicStrata:
        case FormationMode.WireCube:
        case FormationMode.StarPolygon:
        case FormationMode.AlienMothership:
        case FormationMode.BeehiveSwarm:
        case FormationMode.GyroidMinimalSurface:
            return 'overhead';
        case FormationMode.Serpent:
        case FormationMode.TsunamiWave:
        case FormationMode.KelvinHelmholtz:
        case FormationMode.DancingRibbon:
        case FormationMode.RiverDelta:
        case FormationMode.LightningBolt:
        case FormationMode.LorenzAttractor:
            return 'cinematic_sweep';
        case FormationMode.SupernovaBurst:
        case FormationMode.BigBangExpansion:
        case FormationMode.CollapsingSphere:
            return 'dynamic_burst';
        case FormationMode.SaturnRings:
        case FormationMode.FerrisWheel:
        case FormationMode.TorusKnot:
        case FormationMode.LissajousKnot:
        case FormationMode.TrefoilKnot:
        case FormationMode.CalabiYauManifold:
        case FormationMode.CliffordTorus:
            return 'orbit_wide';
        case FormationMode.VirusCapsid:
        case FormationMode.DodecahedronShield:
        case FormationMode.CrystalPrism:
        case FormationMode.QuantumAtom:
            return 'intimate_close';
        default:
            return 'chaotic';
    }
}

export function Flock({ count, state, setPopulation }: FlockProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const { controls } = useThree();

    const smoothCenter = useRef(new THREE.Vector3(0, 0, 0));
    const smoothDistance = useRef(110.0);
    const smoothCamTarget = useRef(new THREE.Vector3(80, 65, 100));
    const smoothLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const lastInteractionTime = useRef<number>(0);

    // Smooth continuous parameter lerp anchors
    const curPitchCenter = useRef(0.30);
    const curPitchAmp = useRef(0.16);
    const curDistScale = useRef(1.0);
    const curSweepSpeed = useRef(0.035);
    const curSweepRange = useRef(0.85);
    const curYOffset = useRef(0.0);

    // Instantiate ClockEngine with decoupled independent timers
    const clockEngine = useMemo<ClockEngine>(() => createClockEngine(state), [state]);

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

    // Initialize/Update Boid Population
    useMemo(() => {
        const centers = blobCentersRef.current;
        if (centers.length === 0) return;

        if (boids.current.length < count) {
            const speciesBaseSizes = [0.45, 0.30, 0.18, 0.10];
            const additional = Array.from({ length: count - boids.current.length }, (_, idx) => {
                const species = Math.floor(Math.random() * 4) as SpeciesType;
                const baseSize = speciesBaseSizes[species];

                const sizeVariance = 0.4 + Math.pow(Math.random(), 2.0) * 0.5;
                const isAlphaLeader = (idx % 12 === 0);
                const isTitanLeader = (idx % 45 === 0);
                const leaderMult = isTitanLeader ? 1.25 : (isAlphaLeader ? 1.1 : 1.0);
                const size = baseSize * sizeVariance * leaderMult;
                
                const assignedBlob = centers[Math.floor(Math.random() * centers.length)];

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

        // 1. Advance Independent Clocks via ClockEngine (formation, color, material, lighting, camera, surprise)
        clockEngine.update(time);

        // 2. Advance Blob Centers on CPU (O(B^2) where B=12)
        const centers = blobCentersRef.current;
        const speed = state.attributes[0].maxSpeed * state.speedMultiplier;
        for (const center of centers) {
            center.update(centers, state.interactions, speed, time);
        }

        // 3. Advance Particles pass (O(N))
        for (let i = 0; i < boidCount; i++) {
            const boid = boidsList[i];
            boid.update(state, time);

            tempObject.position.copy(boid.position);
            tempObject.scale.setScalar(boid.size * state.sizeMultiplier * 0.5);

            if (boid.velocity && boid.velocity.lengthSq() > 1e-6) {
                tempTarget.addVectors(boid.position, boid.velocity);
                tempObject.lookAt(tempTarget);
            }

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

        // 4. Liquid HSL Shortest-Arc Color Interpolation over 22.0 seconds (Super Smooth & Gradual)
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
        const colorP = Math.min(1.0, colorElapsed / 22.0);
        const colorEase = colorP * colorP * colorP * (colorP * (colorP * 6.0 - 15.0) + 10.0);

        const hsl1 = { h: 0, s: 0, l: 0 };
        const hsl2 = { h: 0, s: 0, l: 0 };

        let colorsChanged = false;
        for (let s = 0; s < 4; s++) {
            const prevHex = currentColors.current[s].getHex();
            
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

        // 5. Formation-Aware Cinematic Camera Choreography
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
            const baseDist = THREE.MathUtils.clamp(requiredDist, 8.0, 32.0);

            smoothCenter.current.lerp(new THREE.Vector3(centerX, centerY, centerZ), 0.015);
            smoothDistance.current = THREE.MathUtils.lerp(smoothDistance.current, baseDist, 0.012);

            // Formation category driven angle and pitch
            const cat = getCameraCategory(state.formationMode);
            state.cameraCategory = cat;

            // Target camera parameter goals per topology
            let targetPitchCenter = 0.28;
            let targetPitchAmp = 0.45; // Wide dramatic pitch sweep (-15° looking up to +50° looking down)
            let targetDistScale = 1.0;
            let targetOrbitSpeed = 0.045; // Majestic continuous 360° rotation speed
            let targetYOffsetAmp = 7.5; // High/low vertical flight amplitude

            switch (cat) {
                case 'portrait':
                    targetOrbitSpeed = 0.035;
                    targetPitchCenter = 0.15;
                    targetPitchAmp = 0.35;
                    targetDistScale = 0.88;
                    targetYOffsetAmp = 6.0;
                    break;
                case 'tunnel':
                    targetOrbitSpeed = 0.055;
                    targetPitchCenter = 0.55; // Vertical spiral & helical tunnel perspective
                    targetPitchAmp = 0.40;
                    targetDistScale = 0.92;
                    targetYOffsetAmp = 9.0;
                    break;
                case 'overhead':
                    targetOrbitSpeed = 0.038;
                    targetPitchCenter = 0.60; // Dramatic high plan view diving down into layers
                    targetPitchAmp = 0.35;
                    targetDistScale = 1.12;
                    targetYOffsetAmp = 8.0;
                    break;
                case 'cinematic_sweep':
                    targetOrbitSpeed = 0.048;
                    targetPitchCenter = 0.20;
                    targetPitchAmp = 0.45;
                    targetDistScale = 0.95;
                    targetYOffsetAmp = 8.5;
                    break;
                case 'dynamic_burst':
                    targetOrbitSpeed = 0.050;
                    targetPitchCenter = 0.30;
                    targetPitchAmp = 0.40;
                    targetDistScale = 0.90;
                    targetYOffsetAmp = 7.0;
                    break;
                case 'orbit_wide':
                    targetOrbitSpeed = 0.042;
                    targetPitchCenter = 0.35;
                    targetPitchAmp = 0.35;
                    targetDistScale = 1.20;
                    targetYOffsetAmp = 6.5;
                    break;
                case 'intimate_close':
                    targetOrbitSpeed = 0.030;
                    targetPitchCenter = 0.22;
                    targetPitchAmp = 0.30;
                    targetDistScale = 0.76;
                    targetYOffsetAmp = 5.0;
                    break;
                default: // chaotic
                    targetOrbitSpeed = 0.045;
                    targetPitchCenter = 0.30;
                    targetPitchAmp = 0.42;
                    targetDistScale = 1.0;
                    targetYOffsetAmp = 7.5;
                    break;
            }

            // Camera Mood overlay modulation
            if (state.cameraMood === 'intimate_close') targetDistScale *= 0.80;
            if (state.cameraMood === 'orbit_wide') targetDistScale *= 1.25;
            if (state.cameraMood === 'overhead_iso') targetPitchCenter = 0.70;

            // Silky smooth exponential parameter glide (~6-8s gradual transition, zero abrupt cuts)
            curPitchCenter.current = THREE.MathUtils.lerp(curPitchCenter.current, targetPitchCenter, 0.010);
            curPitchAmp.current = THREE.MathUtils.lerp(curPitchAmp.current, targetPitchAmp, 0.010);
            curDistScale.current = THREE.MathUtils.lerp(curDistScale.current, targetDistScale, 0.010);
            curSweepSpeed.current = THREE.MathUtils.lerp(curSweepSpeed.current, targetOrbitSpeed, 0.010);
            curYOffset.current = THREE.MathUtils.lerp(curYOffset.current, targetYOffsetAmp, 0.010);

            // 1. Continuous 360° Orbital Revolution with subtle multi-frequency harmonic flow
            const camAngle = (time * curSweepSpeed.current) + Math.sin(time * 0.035) * 0.25;

            // 2. Engaging Vertical Swoop (Going down looking up, climbing high looking down)
            // Primary vertical cycle (period ~75s) + secondary harmonic
            const verticalCycle = Math.sin(time * 0.082) + Math.sin(time * 0.038) * 0.35;
            const yOffset = verticalCycle * curYOffset.current;
            
            // Pitch tilts down (+angle) when camera is high, tilts up (-angle) when camera is low!
            const camPitch = curPitchCenter.current + (verticalCycle * curPitchAmp.current * 0.85);

            // 3. Dynamic Focal Distance Breathing (Gliding between intimate close-ups and wide reveals)
            const zoomMod = 0.90 + Math.sin(time * 0.055) * 0.22 + Math.cos(time * 0.11) * 0.08;
            const finalDist = smoothDistance.current * curDistScale.current * zoomMod;

            // 4. Spherical coordinates to 3D Cartesian space
            const targetCamX = smoothCenter.current.x + finalDist * Math.cos(camAngle) * Math.cos(camPitch);
            const targetCamY = smoothCenter.current.y + yOffset + finalDist * Math.sin(camPitch);
            const targetCamZ = smoothCenter.current.z + finalDist * Math.sin(camAngle) * Math.cos(camPitch);

            const activeControls = controls as any;
            const isDraggingNow = activeControls?.state !== undefined && activeControls?.state !== -1;
            if (isDraggingNow) {
                lastInteractionTime.current = performance.now();
            }

            const timeSinceInteraction = performance.now() - lastInteractionTime.current;
            const isUserOverriding = timeSinceInteraction < 10000;

            if (!isUserOverriding) {
                const rawGoal = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
                smoothCamTarget.current.lerp(rawGoal, 0.014);
                smoothLookTarget.current.lerp(smoothCenter.current, 0.016);

                stateContext.camera.position.copy(smoothCamTarget.current);
                if (activeControls && activeControls.target) {
                    activeControls.target.copy(smoothLookTarget.current);
                    activeControls.update();
                } else {
                    stateContext.camera.lookAt(smoothLookTarget.current);
                }
            } else {
                smoothCamTarget.current.copy(stateContext.camera.position);
                if (activeControls && activeControls.target) {
                    smoothLookTarget.current.copy(activeControls.target);
                }
            }
        }
    });

    // 8 Pre-calculated distinct Hard-Edged Low-Poly 3D Geometries
    const geometries = useMemo(() => {
        const g0 = new THREE.ConeGeometry(0.16, 0.5, 3);
        g0.rotateX(Math.PI / 2);

        const g1 = new THREE.OctahedronGeometry(0.22, 0);
        g1.scale(0.8, 0.8, 1.4);

        const g2 = new THREE.ConeGeometry(0.18, 0.48, 4);
        g2.rotateX(Math.PI / 2);

        const g3 = new THREE.ConeGeometry(0.2, 0.45, 6);
        g3.rotateX(Math.PI / 2);

        const g4 = new THREE.CylinderGeometry(0.02, 0.22, 0.45, 4);
        g4.rotateX(Math.PI / 2);
        g4.scale(1.3, 0.5, 1.0);

        const g5 = new THREE.DodecahedronGeometry(0.18, 0);

        const g6 = new THREE.TetrahedronGeometry(0.2, 0);
        g6.scale(0.7, 0.7, 1.5);

        const g7 = new THREE.IcosahedronGeometry(0.18, 0);

        return [g0, g1, g2, g3, g4, g5, g6, g7];
    }, []);

    const mat = state.materialSettings || { roughness: 0.25, metalness: 0.5, wireframe: false, flatShading: false, emissiveIntensity: 0.0 };
    const activeShapeIdx = state.boidShape !== undefined ? Math.abs(state.boidShape) % geometries.length : 0;
    const activeGeometry = geometries[activeShapeIdx];

    // Check for transient material pulse micro-surprise
    let emissiveInt = mat.emissiveIntensity;
    if (state.microSurpriseType === 'materialPulse' && state.currentTime && state.microSurpriseEndTime && state.currentTime < state.microSurpriseEndTime) {
        emissiveInt = 1.4;
    }

    return (
        <instancedMesh key={activeShapeIdx} ref={meshRef} args={[activeGeometry, undefined, count]} castShadow receiveShadow>
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
}

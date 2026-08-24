import * as React from 'react';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState, FormationMode, computeFormationPoint } from './BoidLogic';

export interface CameraPreset {
    id: string;
    name: string;
    icon: string;
    description: string;
    fov: number;
    defaultPos: [number, number, number];
    target: [number, number, number];
    autoRotateSpeed: number;
    type: 'rollercoaster' | 'chopper' | 'giant' | 'orbit' | 'corkscrew' | 'slalom' | 'vortex';
}

export const CAMERA_PRESETS: CameraPreset[] = [
    {
        id: 'rollercoaster',
        name: 'Roller-Coaster Shoot',
        icon: '🎢',
        description: 'Thrilling rail-cam riding directly along the active topology\'s continuous loop strands',
        fov: 76,
        defaultPos: [0, 2.5, 8.5],
        target: [0, 0, 0],
        autoRotateSpeed: 0.22,
        type: 'rollercoaster'
    },
    {
        id: 'chopper',
        name: 'Chopper Core Hover',
        icon: '🚁',
        description: 'Hovering float inside the central void with 360° panoramic scan as the swarm weaves around you',
        fov: 70,
        defaultPos: [0, 0.5, 2.2],
        target: [0, 0, 8.0],
        autoRotateSpeed: 0.16,
        type: 'chopper'
    },
    {
        id: 'giant',
        name: 'Monumental Giant',
        icon: '🗿',
        description: 'Ultra-wide close-up base angle gazing straight up into the colossal structure',
        fov: 84,
        defaultPos: [0, -3.4, 5.2],
        target: [0, 1.2, 0],
        autoRotateSpeed: 0.12,
        type: 'giant'
    },
    {
        id: 'standard',
        name: 'Celestial Orbit',
        icon: '🪐',
        description: 'Expansive 360° celestial orbit with rich depth perspective from foreground to horizon',
        fov: 66,
        defaultPos: [0, 3.2, 12.8],
        target: [0, 0, 0],
        autoRotateSpeed: 0.18,
        type: 'orbit'
    },
    {
        id: 'corkscrew',
        name: 'Helical Spiral',
        icon: '🌀',
        description: 'Ascending outer spiral showcasing close foreground spirals receding into far background rings',
        fov: 68,
        defaultPos: [0, 0.8, 12.2],
        target: [0, 0, 0],
        autoRotateSpeed: 0.16,
        type: 'corkscrew'
    },
    {
        id: 'action',
        name: 'Action Slalom',
        icon: '⚡',
        description: 'Rapid undulating slalom flyby skimming foreground ribbons across multi-layered depths',
        fov: 70,
        defaultPos: [0, 2.2, 11.8],
        target: [0, -0.2, 0],
        autoRotateSpeed: 0.20,
        type: 'slalom'
    },
    {
        id: 'vortex',
        name: 'Vortex Horizon',
        icon: '🌌',
        description: 'High-angle deep plunge overlooking the entire multi-dimensional swirl down to the glowing nexus',
        fov: 74,
        defaultPos: [0, 10.5, 6.8],
        target: [0, -1.2, 0],
        autoRotateSpeed: 0.15,
        type: 'vortex'
    }
];

interface CameraRigProps {
    simState: React.MutableRefObject<SimulationState>;
}

export const CameraRig: React.FC<CameraRigProps> = ({ simState }) => {
    const controlsRef = useRef<any>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const spotLightRef = useRef<THREE.SpotLight>(null!);
    const spotTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());
    const { camera, scene } = useThree();

    const isUserInteracting = useRef(false);
    const lastInteractionTime = useRef(0);

    // Filtered continuous kinematic positions for ultra-smooth director glide
    const curPos = useRef(new THREE.Vector3(0, 3.2, 12.8));
    const curTarget = useRef(new THREE.Vector3(0, 0, 0));
    const curFov = useRef(66);

    const calcPosScratch = useRef(new THREE.Vector3());
    const calcTargetScratch = useRef(new THREE.Vector3());

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

        // Ensure spot target is in the scene
        if (spotTargetRef.current && !spotTargetRef.current.parent) {
            scene.add(spotTargetRef.current);
        }

        const onStart = () => {
            isUserInteracting.current = true;
            lastInteractionTime.current = performance.now();
        };

        const onEnd = () => {
            isUserInteracting.current = false;
            lastInteractionTime.current = performance.now();
            curPos.current.copy(camera.position);
            curTarget.current.copy(controls.target);
        };

        controls.addEventListener('start', onStart);
        controls.addEventListener('end', onEnd);

        return () => {
            controls.removeEventListener('start', onStart);
            controls.removeEventListener('end', onEnd);
            if (spotTargetRef.current && spotTargetRef.current.parent) {
                scene.remove(spotTargetRef.current);
            }
        };
    }, [camera, scene]);

    useFrame((stateContext, delta) => {
        const time = stateContext.clock.getElapsedTime();
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];

        // Evaluate Artistic Camera Trajectory based on Active Mode
        const mode = preset.type;
        const posOut = calcPosScratch.current;
        const tgtOut = calcTargetScratch.current;

        if (mode === 'rollercoaster') {
            // 🎢 Roller-Coaster Rail Shoot: Rides on an elevated chase-track safely OUTSIDE the pipe looking down the ribbon
            const formMode = (state && state.formationMode !== undefined) ? state.formationMode : FormationMode.QuadHelixBraid;
            const seed = (state && state.formationSeed !== undefined) ? state.formationSeed : 42;
            const speedMult = (state && state.speedMultiplier !== undefined) ? state.speedMultiplier : 0.14;

            // Continuous parametric travel along the loop
            const trackSpeed = 0.034; // Serene majestic flying velocity along the strand
            const uCam = ((time * trackSpeed) % 1.0 + 1.0) % 1.0;
            const uLookAhead = (uCam + 0.04) % 1.0;
            const uFarAhead = (uCam + 0.14) % 1.0;

            // Evaluate exact positions on the active mathematical manifold
            const camPt = computeFormationPoint(formMode, seed, uCam, time, 0, 0, 3.5, speedMult, state) as [number, number, number];
            const lookPt = computeFormationPoint(formMode, seed, uLookAhead, time, 0, 0, 3.5, speedMult, state) as [number, number, number];
            const farLookPt = computeFormationPoint(formMode, seed, uFarAhead, time, 0, 0, 3.5, speedMult, state) as [number, number, number];

            // Tangent direction along the loop
            const dirX = lookPt[0] - camPt[0];
            const dirY = lookPt[1] - camPt[1];
            const dirZ = lookPt[2] - camPt[2];
            const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1.0;
            const nDirX = dirX / dirLen;
            const nDirY = dirY / dirLen;
            const nDirZ = dirZ / dirLen;

            // Radial outward normal from world origin to float safely outside the pipe envelope
            const rLen = Math.sqrt(camPt[0] * camPt[0] + camPt[1] * camPt[1] + camPt[2] * camPt[2]) || 1.0;
            const radX = camPt[0] / rLen;
            const radY = camPt[1] / rLen;
            const radZ = camPt[2] / rLen;

            // Generous stand-off distance floats comfortably outside the dense boid pipe with trailing chase offset
            const standOff = 4.2;
            const trailDist = 2.2;
            posOut.x = camPt[0] + radX * standOff - nDirX * trailDist;
            posOut.y = camPt[1] + radY * standOff - nDirY * trailDist + 0.8;
            posOut.z = camPt[2] + radZ * standOff - nDirZ * trailDist;

            // Target looks down the forward loop corridor ahead
            tgtOut.x = farLookPt[0];
            tgtOut.y = farLookPt[1];
            tgtOut.z = farLookPt[2];
        } else if (mode === 'chopper') {
            // 🚁 Chopper Core Hover: Slow hovering float inside the inner void tracking the orbiting swarm loops
            const tChop = time * 0.08;
            posOut.x = Math.sin(tChop * 1.4) * 2.8;
            posOut.y = Math.sin(tChop * 2.2) * 1.5 + Math.cos(tChop * 0.8) * 0.5;
            posOut.z = Math.cos(tChop * 1.4) * 2.8;

            // Focus directly on proximate swirling ribbon loops orbiting around the chopper
            const focusAngle = time * 0.16;
            const focusR = 6.2 + Math.sin(time * 0.25) * 1.5;
            tgtOut.x = Math.sin(focusAngle) * focusR;
            tgtOut.y = Math.sin(time * 0.25) * 2.0;
            tgtOut.z = Math.cos(focusAngle) * focusR;
        } else if (mode === 'giant') {
            // 🗿 Monumental Giant: Close base-level wide-angle lens right at the foot of the structure
            const tG = time * 0.08;
            posOut.x = Math.sin(tG) * 5.6;
            posOut.y = -3.2 + Math.sin(time * 0.12) * 0.3;
            posOut.z = Math.cos(tG) * 5.6;

            tgtOut.x = 0.0;
            tgtOut.y = 1.4 + Math.cos(time * 0.15) * 0.6;
            tgtOut.z = 0.0;
        } else if (mode === 'corkscrew') {
            // 🌀 Helical Spiral: Ascending corkscrew tracing the vertical helix looking through the core
            const tCS = time * 0.16;
            const rCS = 10.5 + Math.cos(time * 0.12) * 1.5;
            posOut.x = Math.sin(tCS) * rCS;
            posOut.y = Math.sin(time * 0.08) * 5.5;
            posOut.z = Math.cos(tCS) * rCS;

            tgtOut.x = Math.sin(tCS + 1.2) * 2.5;
            tgtOut.y = -posOut.y * 0.25;
            tgtOut.z = Math.cos(tCS + 1.2) * 2.5;
        } else if (mode === 'slalom') {
            // ⚡ Action Slalom: Rapid undulating slalom flyby skimming ribbons
            const tS = time * 0.20;
            const rS = 9.8 + Math.sin(tS * 2.6) * 2.2;
            posOut.x = Math.sin(tS) * rS;
            posOut.y = 1.6 + Math.cos(tS * 2.8) * 2.6;
            posOut.z = Math.cos(tS) * rS;

            tgtOut.x = Math.sin(tS + 0.6) * 3.2;
            tgtOut.y = 0.0;
            tgtOut.z = Math.cos(tS + 0.6) * 3.2;
        } else if (mode === 'vortex') {
            // 🌌 Vortex Horizon: Top-down vantage point looking into the funnel
            const tV = time * 0.10;
            posOut.x = Math.sin(tV) * 6.5;
            posOut.y = 9.8 + Math.sin(tV * 1.4) * 1.5;
            posOut.z = Math.cos(tV) * 6.5;

            tgtOut.x = 0.0;
            tgtOut.y = -1.2;
            tgtOut.z = 0.0;
        } else {
            // 🪐 Celestial Orbit: Smooth 360° majestic horizon sweep
            const tOrb = time * 0.11;
            posOut.x = Math.sin(tOrb) * 12.2;
            posOut.y = 2.8 + Math.sin(tOrb * 1.4) * 1.5;
            posOut.z = Math.cos(tOrb) * 12.2;

            tgtOut.x = 0.0;
            tgtOut.y = 0.0;
            tgtOut.z = 0.0;
        }

        const now = performance.now();
        const timeSinceUser = (now - lastInteractionTime.current) / 1000;
        const dt = Math.min(0.1, Math.max(0.001, delta || 0.016));

        if (controlsRef.current) {
            const controls = controlsRef.current;
            const perspCam = camera as THREE.PerspectiveCamera;

            if (isUserInteracting.current) {
                curPos.current.copy(perspCam.position);
                curTarget.current.copy(controls.target);
            } else if (timeSinceUser > 0.8) {
                // Silky-Smooth Critically Damped Director Glide (Exponential smoothing with zero abrupt jumps)
                const smoothLambda = 1.45; // Silky cinematic blending rate
                const smoothFactor = 1.0 - Math.exp(-smoothLambda * dt);

                curPos.current.lerp(posOut, smoothFactor);
                curTarget.current.lerp(tgtOut, smoothFactor);

                if (perspCam) {
                    curFov.current = THREE.MathUtils.lerp(curFov.current, preset.fov, smoothFactor);
                    if (Math.abs(perspCam.fov - curFov.current) > 0.01) {
                        perspCam.fov = curFov.current;
                        perspCam.updateProjectionMatrix();
                    }
                }

                controls.target.copy(curTarget.current);
                perspCam.position.copy(curPos.current);
                perspCam.lookAt(controls.target);
            }

            // Synchronize Camera-Mounted Spotlight as a gentle soft fill light (prevents blinding specular blowouts)
            if (spotLightRef.current && spotTargetRef.current) {
                spotLightRef.current.position.copy(perspCam.position);
                spotTargetRef.current.position.copy(controls.target);
                spotLightRef.current.target = spotTargetRef.current;

                const mult = state.lightIntensityMultiplier ?? 1.0;
                spotLightRef.current.intensity = 0.65 * mult;
                spotLightRef.current.distance = 45.0;
                spotLightRef.current.penumbra = 0.95;
                spotLightRef.current.decay = 2.0;
            }
        }
    });

    return (
        <>
            <PerspectiveCamera
                ref={cameraRef}
                makeDefault
                fov={66}
                position={[0, 3.2, 12.8]}
                near={0.80}
                far={1000}
            />
            <OrbitControls
                ref={controlsRef}
                enableDamping={true}
                dampingFactor={0.08}
                autoRotate={false}
                minDistance={2.5}
                maxDistance={220}
                minPolarAngle={0.02}
                maxPolarAngle={Math.PI - 0.02}
            />

            {/* Camera-Mounted Spotlight (Soft fill light to illuminate dark/shady sides without blinding specular bloom) */}
            <spotLight
                ref={spotLightRef}
                position={[0, 3.2, 12.8]}
                intensity={0.65}
                distance={45.0}
                angle={Math.PI / 3.0}
                penumbra={0.95}
                decay={2.0}
                color="#f8fafc"
            />
        </>
    );
};

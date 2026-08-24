import * as React from 'react';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState } from './BoidLogic';

export interface CameraPreset {
    id: string;
    name: string;
    icon: string;
    description: string;
    fov: number;
    defaultPos: [number, number, number];
    target: [number, number, number];
    autoRotateSpeed: number;
    type: 'orbit' | 'flythrough' | 'corkscrew';
}

export const CAMERA_PRESETS: CameraPreset[] = [
    {
        id: 'standard',
        name: 'Celestial Orbit',
        icon: '🪐',
        description: 'Smooth 360° celestial orbit with intimate framing and full envelope visibility',
        fov: 46,
        defaultPos: [0, 2.0, 7.8],
        target: [0, 0, 0],
        autoRotateSpeed: 0.18,
        type: 'orbit'
    },
    {
        id: 'giant',
        name: 'Hero Low Angle',
        icon: '🗿',
        description: 'Positioned close beneath the swarm gazing upward into the glowing geometry',
        fov: 50,
        defaultPos: [0, -3.4, 5.6],
        target: [0, 0.4, 0],
        autoRotateSpeed: 0.14,
        type: 'orbit'
    },
    {
        id: 'action',
        name: 'Action Sweep',
        icon: '⚡',
        description: 'Dynamic close proximity sweep weaving along ribbon contours',
        fov: 48,
        defaultPos: [0, 1.2, 6.2],
        target: [0, 0, 0],
        autoRotateSpeed: 0.22,
        type: 'orbit'
    },
    {
        id: 'spaceship',
        name: 'Ribbon Glider',
        icon: '🚀',
        description: 'Close-quarters sweeping flyby skimming the outer boid strands',
        fov: 45,
        defaultPos: [0, 1.4, 6.8],
        target: [0, 0, 0],
        autoRotateSpeed: 0.12,
        type: 'flythrough'
    },
    {
        id: 'corkscrew',
        name: 'Helical Spiral',
        icon: '🌀',
        description: 'Ascending outer spiral gliding alongside the exterior envelope',
        fov: 46,
        defaultPos: [0, 0.4, 6.4],
        target: [0, 0, 0],
        autoRotateSpeed: 0.18,
        type: 'corkscrew'
    },
    {
        id: 'vortex',
        name: 'Vortex Horizon',
        icon: '🌌',
        description: 'High-angle deep plunge looking directly through the swirl core',
        fov: 44,
        defaultPos: [0, 6.2, 2.6],
        target: [0, -0.3, 0],
        autoRotateSpeed: 0.15,
        type: 'orbit'
    },
    {
        id: 'tunnel',
        name: 'Core Tunnel Track',
        icon: '🎯',
        description: 'Ultra-immersive close perspective inside the topological stream',
        fov: 52,
        defaultPos: [0, 0.1, 5.0],
        target: [0, 0, 0],
        autoRotateSpeed: 0.14,
        type: 'flythrough'
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

    // Initial state initialized to close intimate orbit
    const currentRadius = useRef(8.05);
    const currentPolar = useRef(1.31);
    const currentAzimuth = useRef(0.0);
    const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
    const currentFov = useRef(46);
    const currentSpeed = useRef(0.18);

    // Track active preset transitions
    const lastPresetIdx = useRef(0);

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

            // Seamlessly capture user's new position into kinematic state
            const offset = camera.position.clone().sub(controls.target);
            const r = offset.length();
            if (r > 0.001) {
                currentRadius.current = r;
                currentPolar.current = Math.acos(Math.max(-0.999, Math.min(0.999, offset.y / r)));
                currentAzimuth.current = Math.atan2(offset.x, offset.z);
                currentTarget.current.copy(controls.target);
            }
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

    useFrame((_, delta) => {
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];

        if (lastPresetIdx.current !== presetIdx) {
            lastPresetIdx.current = presetIdx;
        }

        // Compute target spherical parameters for current preset
        const dx = preset.defaultPos[0] - preset.target[0];
        const dy = preset.defaultPos[1] - preset.target[1];
        const dz = preset.defaultPos[2] - preset.target[2];
        const targetRadius = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const targetPolar = Math.acos(Math.max(-0.999, Math.min(0.999, dy / Math.max(0.001, targetRadius))));
        const targetTarget = new THREE.Vector3(preset.target[0], preset.target[1], preset.target[2]);
        const targetFov = preset.fov;
        const targetSpeed = preset.autoRotateSpeed;

        const now = performance.now();
        const timeSinceUser = (now - lastInteractionTime.current) / 1000;
        const dt = Math.min(0.1, Math.max(0.001, delta || 0.016));

        if (controlsRef.current) {
            const controls = controlsRef.current;
            const perspCam = camera as THREE.PerspectiveCamera;

            if (isUserInteracting.current) {
                // User is actively controlling camera - keep internal state synchronized
                const offset = perspCam.position.clone().sub(controls.target);
                const r = offset.length();
                if (r > 0.001) {
                    currentRadius.current = r;
                    currentPolar.current = Math.acos(Math.max(-0.999, Math.min(0.999, offset.y / r)));
                    currentAzimuth.current = Math.atan2(offset.x, offset.z);
                    currentTarget.current.copy(controls.target);
                }
            } else if (timeSinceUser > 1.0) {
                // Silky-Smooth Critically Damped Director Glide (Exponential smoothing with zero abrupt jumps)
                const smoothLambda = 1.85; // Natural smooth response rate
                const smoothFactor = 1.0 - Math.exp(-smoothLambda * dt);

                currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, smoothFactor);
                currentRadius.current = THREE.MathUtils.lerp(currentRadius.current, targetRadius, smoothFactor);
                currentPolar.current = THREE.MathUtils.lerp(currentPolar.current, targetPolar, smoothFactor);
                currentTarget.current.lerp(targetTarget, smoothFactor);

                // Continuous, majestic orbital drift
                currentAzimuth.current += currentSpeed.current * dt * 0.14;

                // Smooth FOV interpolation
                if (perspCam) {
                    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, smoothFactor);
                    if (Math.abs(perspCam.fov - currentFov.current) > 0.01) {
                        perspCam.fov = currentFov.current;
                        perspCam.updateProjectionMatrix();
                    }
                }

                // Compute exact continuous spherical camera coordinates
                const r = Math.max(2.5, currentRadius.current);
                const phi = Math.max(0.08, Math.min(Math.PI - 0.08, currentPolar.current));
                const theta = currentAzimuth.current;

                controls.target.copy(currentTarget.current);
                perspCam.position.x = controls.target.x + r * Math.sin(phi) * Math.sin(theta);
                perspCam.position.y = controls.target.y + r * Math.cos(phi);
                perspCam.position.z = controls.target.z + r * Math.sin(phi) * Math.cos(theta);
                perspCam.lookAt(controls.target);
            }

            // Synchronize Camera-Mounted Spotlight to follow camera and illuminate shadowed regions
            if (spotLightRef.current && spotTargetRef.current) {
                spotLightRef.current.position.copy(perspCam.position);
                spotTargetRef.current.position.copy(controls.target);
                spotLightRef.current.target = spotTargetRef.current;

                const mult = state.lightIntensityMultiplier ?? 1.0;
                spotLightRef.current.intensity = 2.2 * mult;
            }
        }
    });

    return (
        <>
            <PerspectiveCamera
                ref={cameraRef}
                makeDefault
                fov={46}
                position={[0, 2.0, 7.8]}
                near={0.20}
                far={1000}
            />
            <OrbitControls
                ref={controlsRef}
                enableDamping={true}
                dampingFactor={0.08}
                autoRotate={false}
                minDistance={2.2}
                maxDistance={120}
                minPolarAngle={0.05}
                maxPolarAngle={Math.PI - 0.05}
            />

            {/* Camera-Mounted Spotlight (Follows view frustum to illuminate dark/shady sides of topology) */}
            <spotLight
                ref={spotLightRef}
                position={[0, 2.0, 7.8]}
                intensity={2.2}
                distance={45.0}
                angle={Math.PI / 3.8}
                penumbra={0.75}
                decay={1.1}
                color="#f8fafc"
            />
        </>
    );
};

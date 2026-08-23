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
        fov: 52,
        defaultPos: [0, 3.5, 14.0],
        target: [0, 0, 0],
        autoRotateSpeed: 0.20,
        type: 'orbit'
    },
    {
        id: 'giant',
        name: 'Hero Low Angle',
        icon: '🗿',
        description: 'Positioned close beneath the swarm gazing upward into the glowing geometry',
        fov: 65,
        defaultPos: [0, -8.0, 7.5],
        target: [0, 0.8, 0],
        autoRotateSpeed: 0.15,
        type: 'orbit'
    },
    {
        id: 'action',
        name: 'Action Sweep',
        icon: '⚡',
        description: 'Dynamic close perimeter flyby with wave height oscillations',
        fov: 58,
        defaultPos: [0, 2.5, 11.0],
        target: [0, 0, 0],
        autoRotateSpeed: 0.28,
        type: 'orbit'
    },
    {
        id: 'spaceship',
        name: 'Exterior Flyby',
        icon: '🚀',
        description: 'Majestic close sweeping flyby along outer perimeter',
        fov: 56,
        defaultPos: [0, 2.0, 13.5],
        target: [0, 0, 0],
        autoRotateSpeed: 0.12,
        type: 'flythrough'
    },
    {
        id: 'corkscrew',
        name: 'Helical Spiral',
        icon: '🌀',
        description: 'Ascending outer spiral gliding alongside the exterior envelope',
        fov: 55,
        defaultPos: [0, 0.5, 12.5],
        target: [0, 0, 0],
        autoRotateSpeed: 0.22,
        type: 'corkscrew'
    }
];

interface CameraRigProps {
    simState: React.MutableRefObject<SimulationState>;
}

export const CameraRig: React.FC<CameraRigProps> = ({ simState }) => {
    const controlsRef = useRef<any>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const { camera } = useThree();

    const isUserInteracting = useRef(false);
    const lastInteractionTime = useRef(0);

    const currentRadius = useRef(14.43);
    const currentPolar = useRef(1.33);
    const currentAzimuth = useRef(0.0);
    const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
    const currentFov = useRef(52);
    const currentSpeed = useRef(0.20);

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

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
        };
    }, [camera]);

    useFrame((_, delta) => {
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];

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
                // User is controlling camera - keep internal state synchronized
                const offset = perspCam.position.clone().sub(controls.target);
                const r = offset.length();
                if (r > 0.001) {
                    currentRadius.current = r;
                    currentPolar.current = Math.acos(Math.max(-0.999, Math.min(0.999, offset.y / r)));
                    currentAzimuth.current = Math.atan2(offset.x, offset.z);
                    currentTarget.current.copy(controls.target);
                }
            } else if (timeSinceUser > 1.0) {
                // Gentle continuous director glide (zero jumps, zero fighting)
                const glideRate = Math.min(1.0, dt * 0.45);
                const speedRate = Math.min(1.0, dt * 0.60);

                currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, speedRate);
                currentRadius.current = THREE.MathUtils.lerp(currentRadius.current, targetRadius, glideRate);
                currentPolar.current = THREE.MathUtils.lerp(currentPolar.current, targetPolar, glideRate);
                currentTarget.current.lerp(targetTarget, glideRate);

                // Elegant, slow cinematic orbital drift
                currentAzimuth.current += currentSpeed.current * dt * 0.12;

                // Smooth FOV
                if (perspCam) {
                    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, glideRate);
                    if (Math.abs(perspCam.fov - currentFov.current) > 0.02) {
                        perspCam.fov = currentFov.current;
                        perspCam.updateProjectionMatrix();
                    }
                }

                // Compute exact continuous spherical camera position
                const r = currentRadius.current;
                const phi = Math.max(0.08, Math.min(Math.PI - 0.08, currentPolar.current));
                const theta = currentAzimuth.current;

                controls.target.copy(currentTarget.current);
                perspCam.position.x = controls.target.x + r * Math.sin(phi) * Math.sin(theta);
                perspCam.position.y = controls.target.y + r * Math.cos(phi);
                perspCam.position.z = controls.target.z + r * Math.sin(phi) * Math.cos(theta);
                perspCam.lookAt(controls.target);
            }
        }
    });

    return (
        <>
            <PerspectiveCamera ref={cameraRef} makeDefault fov={52} position={[0, 3.5, 14.0]} near={0.25} far={1000} />
            <OrbitControls
                ref={controlsRef}
                enableDamping={true}
                dampingFactor={0.08}
                autoRotate={false}
                minDistance={3.5}
                maxDistance={250}
                minPolarAngle={0.05}
                maxPolarAngle={Math.PI - 0.05}
            />
        </>
    );
};

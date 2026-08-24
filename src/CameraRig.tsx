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
        description: 'Expansive 360° celestial orbit with rich depth perspective from foreground to horizon',
        fov: 66,
        defaultPos: [0, 3.2, 12.8],
        target: [0, 0, 0],
        autoRotateSpeed: 0.18,
        type: 'orbit'
    },
    {
        id: 'giant',
        name: 'Hero Low Angle',
        icon: '🗿',
        description: 'Dramatically pitched low-angle vista gazing up through proximate strands into deep space',
        fov: 72,
        defaultPos: [0, -5.5, 9.5],
        target: [0, 0.8, 0],
        autoRotateSpeed: 0.14,
        type: 'orbit'
    },
    {
        id: 'action',
        name: 'Action Sweep',
        icon: '⚡',
        description: 'Dynamic perspective sweep with foreground boids skimming the lens across multi-layered ribbons',
        fov: 68,
        defaultPos: [0, 2.2, 11.8],
        target: [0, -0.2, 0],
        autoRotateSpeed: 0.20,
        type: 'orbit'
    },
    {
        id: 'spaceship',
        name: 'Ribbon Glider',
        icon: '🚀',
        description: 'Wide-angle flight tracking outer filaments while preserving deep architectural background vanishings',
        fov: 65,
        defaultPos: [0, 1.8, 12.5],
        target: [0, 0, 0],
        autoRotateSpeed: 0.12,
        type: 'flythrough'
    },
    {
        id: 'corkscrew',
        name: 'Helical Spiral',
        icon: '🌀',
        description: 'Ascending outer spiral showcasing close foreground spirals receding into far background rings',
        fov: 67,
        defaultPos: [0, 0.8, 12.2],
        target: [0, 0, 0],
        autoRotateSpeed: 0.16,
        type: 'corkscrew'
    },
    {
        id: 'vortex',
        name: 'Vortex Horizon',
        icon: '🌌',
        description: 'High-angle deep plunge overlooking the entire multi-dimensional swirl down to the glowing nexus',
        fov: 70,
        defaultPos: [0, 9.2, 7.8],
        target: [0, -0.6, 0],
        autoRotateSpeed: 0.15,
        type: 'orbit'
    },
    {
        id: 'tunnel',
        name: 'Deep Stream Horizon',
        icon: '🎯',
        description: 'Immersive wide perspective with large proximate boids framing the expansive topological field',
        fov: 68,
        defaultPos: [0, 1.5, 11.2],
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

    // Initial state initialized to wide-angle perspective depth
    const currentRadius = useRef(13.2);
    const currentPolar = useRef(1.33);
    const currentAzimuth = useRef(0.0);
    const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
    const currentFov = useRef(66);
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
                currentAzimuth.current += currentSpeed.current * dt * 0.12;

                // Smooth FOV interpolation
                if (perspCam) {
                    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, smoothFactor);
                    if (Math.abs(perspCam.fov - currentFov.current) > 0.01) {
                        perspCam.fov = currentFov.current;
                        perspCam.updateProjectionMatrix();
                    }
                }

                // Compute exact continuous spherical camera coordinates
                const r = Math.max(3.5, currentRadius.current);
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
                spotLightRef.current.intensity = 2.4 * mult;
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
                near={0.10}
                far={1000}
            />
            <OrbitControls
                ref={controlsRef}
                enableDamping={true}
                dampingFactor={0.08}
                autoRotate={false}
                minDistance={3.0}
                maxDistance={180}
                minPolarAngle={0.05}
                maxPolarAngle={Math.PI - 0.05}
            />

            {/* Camera-Mounted Spotlight (Follows view frustum to illuminate dark/shady sides of topology) */}
            <spotLight
                ref={spotLightRef}
                position={[0, 3.2, 12.8]}
                intensity={2.4}
                distance={65.0}
                angle={Math.PI / 3.2}
                penumbra={0.80}
                decay={1.1}
                color="#f8fafc"
            />
        </>
    );
};

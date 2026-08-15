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
        name: 'Standard Orbit',
        icon: '🪐',
        description: 'Smooth 360° celestial orbit with natural depth',
        fov: 55,
        defaultPos: [0, 4, 18],
        target: [0, 0, 0],
        autoRotateSpeed: 0.8,
        type: 'orbit'
    },
    {
        id: 'giant',
        name: 'Giant Colossus',
        icon: '🗿',
        description: 'Placed at the bottom looking up into the sky with an ultra-wide angle lens',
        fov: 82,
        defaultPos: [0, -5.5, 8.8],
        target: [0, 1.8, 0],
        autoRotateSpeed: 0.7,
        type: 'orbit'
    },
    {
        id: 'action',
        name: 'Action / Dynamic',
        icon: '⚡',
        description: 'Fast dynamic banking flyby with wave height oscillations',
        fov: 65,
        defaultPos: [0, 2, 11],
        target: [0, 0, 0],
        autoRotateSpeed: 2.2,
        type: 'orbit'
    },
    {
        id: 'spaceship',
        name: 'Spaceship Fly-Through',
        icon: '🚀',
        description: 'Cockpit fly-through: dives straight through the heart and loops back',
        fov: 72,
        defaultPos: [0, 0, 24],
        target: [0, 0, 0],
        autoRotateSpeed: 0.0,
        type: 'flythrough'
    },
    {
        id: 'celestial',
        name: 'Celestial Top-Down',
        icon: '🌌',
        description: 'Overhead bird\'s-eye view looking down on sacred spiral ripples',
        fov: 48,
        defaultPos: [0, 26, 0.1],
        target: [0, 0, 0],
        autoRotateSpeed: 0.5,
        type: 'orbit'
    },
    {
        id: 'corkscrew',
        name: 'Vortex Corkscrew',
        icon: '🌀',
        description: 'Helical 3D corkscrew diving in and out along the central axis',
        fov: 62,
        defaultPos: [0, 0, 16],
        target: [0, 0, 0],
        autoRotateSpeed: 1.2,
        type: 'corkscrew'
    }
];

interface CameraRigProps {
    simState: React.MutableRefObject<SimulationState>;
}

export const CameraRig: React.FC<CameraRigProps> = ({ simState }) => {
    const controlsRef = useRef<any>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const lastPresetIdx = useRef<number>(-1);
    const flightTime = useRef(0);
    const lastInteractionTime = useRef(0);
    const { camera, size } = useThree();

    useEffect(() => {
        const onInteraction = () => {
            lastInteractionTime.current = performance.now();
        };
        window.addEventListener('pointerdown', onInteraction);
        window.addEventListener('wheel', onInteraction, { passive: true });
        window.addEventListener('touchstart', onInteraction, { passive: true });
        return () => {
            window.removeEventListener('pointerdown', onInteraction);
            window.removeEventListener('wheel', onInteraction);
            window.removeEventListener('touchstart', onInteraction);
        };
    }, []);

    useFrame((_, delta) => {
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];
        const safeDelta = Math.min(delta, 0.05);

        // 1. Dynamic Viewport-Adaptive Framing Distance Calculation
        const perspCam = camera as THREE.PerspectiveCamera;
        const vFovRad = (perspCam.fov || preset.fov) * (Math.PI / 180);
        const aspect = size.width / Math.max(1, size.height);
        const hFovRad = 2.0 * Math.atan(Math.tan(vFovRad * 0.5) * aspect);
        const limitingHalfAngle = Math.min(vFovRad, hFovRad) * 0.5;

        const rBound = (state && state.formationRadius) ? state.formationRadius : 7.5;
        // Immersive framing: the swarm dominates the viewport with outer boids dynamically bleeding past the edges
        const baseFramingDist = (rBound / Math.sin(Math.max(0.12, vFovRad * 0.5))) * 0.58;

        let presetDistMult = 1.0;
        if (preset.id === 'giant') presetDistMult = 0.85;
        else if (preset.id === 'action') presetDistMult = 0.68;
        else if (preset.id === 'celestial') presetDistMult = 1.10;

        const targetDistance = baseFramingDist * presetDistMult;

        // 2. Smooth FOV Transition
        if (perspCam && Math.abs(perspCam.fov - preset.fov) > 0.1) {
            perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, preset.fov, 0.05);
            perspCam.updateProjectionMatrix();
        }

        // 3. On Preset Switch or Frame, synchronize OrbitControls active state
        if (controlsRef.current) {
            const isOrbitMode = (preset.type === 'orbit');
            if (controlsRef.current.enabled !== isOrbitMode) {
                controlsRef.current.enabled = isOrbitMode;
                controlsRef.current.autoRotate = isOrbitMode;
            }

            if (lastPresetIdx.current !== presetIdx) {
                lastPresetIdx.current = presetIdx;
                if (isOrbitMode) {
                    controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed;
                    controlsRef.current.target.set(preset.target[0], preset.target[1], preset.target[2]);
                    
                    const dir = new THREE.Vector3(preset.defaultPos[0], preset.defaultPos[1], preset.defaultPos[2]).normalize();
                    camera.position.copy(controlsRef.current.target).addScaledVector(dir, targetDistance);
                    controlsRef.current.update();
                }
            }
        }

        // 4. Custom Cinematic Motion Paths (Spaceship & Corkscrew)
        if (preset.type === 'flythrough') {
            // Calm, immersive pursuit dive flight
            flightTime.current += safeDelta * 0.20;
            const t = flightTime.current;
            const rScale = Math.max(0.65, (rBound / 7.5));

            // Smooth 3D figure-8 dive trajectory weaving through and around the swarm
            const x = Math.sin(t) * (7.5 * rScale);
            const y = Math.sin(t * 2.0) * (2.6 * rScale);
            const z = Math.cos(t) * (8.5 * rScale);

            camera.position.set(x, y, z);
            camera.up.set(0, 1, 0);

            // ALWAYS locked on the formation center — the swarm NEVER leaves the viewport
            const lookTarget = new THREE.Vector3(0, Math.sin(t * 1.5) * 0.8, 0);
            camera.lookAt(lookTarget);
        } else if (preset.type === 'corkscrew') {
            // Calm helical spiral
            flightTime.current += safeDelta * 0.14;
            const t = flightTime.current;
            const rScale = Math.max(0.65, (rBound / 7.5));

            const r = (5.5 + Math.sin(t * 0.6) * 3.0) * rScale;
            const x = Math.cos(t) * r;
            const z = Math.sin(t) * r;
            const y = Math.sin(t * 0.8) * (5.5 * rScale);

            camera.position.set(x, y, z);
            camera.up.set(0, 1, 0);
            const lookTarget = new THREE.Vector3(0, Math.sin(t * 0.8) * 1.2, 0);
            camera.lookAt(lookTarget);
        } else {
            camera.up.set(0, 1, 0);
            // Orbit Presets: Auto-adjust zoom distance when not actively dragging
            const timeSinceUser = performance.now() - lastInteractionTime.current;
            const isUserInteracting = timeSinceUser < 4000;

            if (!isUserInteracting && controlsRef.current) {
                const target = controlsRef.current.target;
                const curDist = camera.position.distanceTo(target);
                if (curDist > 0.1 && Math.abs(curDist - targetDistance) > 0.05) {
                    const nextDist = THREE.MathUtils.lerp(curDist, targetDistance, 0.025);
                    const dir = new THREE.Vector3().subVectors(camera.position, target).normalize();
                    camera.position.copy(target).addScaledVector(dir, nextDist);
                }
            }
        }
    });

    return (
        <>
            <PerspectiveCamera ref={cameraRef} makeDefault fov={55} position={[0, 4, 18]} />
            <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.05}
                autoRotate
                autoRotateSpeed={0.8}
                minDistance={1.5}
                maxDistance={250}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                target={[0, 0, 0]}
            />
        </>
    );
};

import * as React from 'react';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState } from './BoidLogic';

// Pre-allocated scratch vectors for CameraRig (zero per-frame GC pressure)
const _camIdealPos = new THREE.Vector3();
const _camIdealTarget = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _camDir2 = new THREE.Vector3();

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
        autoRotateSpeed: 0.7,
        type: 'orbit'
    },
    {
        id: 'giant',
        name: 'Hero Low Angle',
        icon: '🗿',
        description: 'Positioned close beneath the swarm gazing upward into the glowing geometry',
        fov: 65,
        defaultPos: [0, -8.0, 7.5],
        target: [0, 0.5, 0],
        autoRotateSpeed: 0.6,
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
        autoRotateSpeed: 1.5,
        type: 'orbit'
    },
    {
        id: 'spaceship',
        name: 'Exterior Flyby',
        icon: '🚀',
        description: 'Majestic close sweeping flyby along outer perimeter',
        fov: 58,
        defaultPos: [0, 2.0, 13.5],
        target: [0, 0, 0],
        autoRotateSpeed: 0.0,
        type: 'flythrough'
    },
    {
        id: 'corkscrew',
        name: 'Helical Spiral',
        icon: '🌀',
        description: 'Ascending outer spiral gliding alongside the exterior envelope',
        fov: 55,
        defaultPos: [0, 0, 12.5],
        target: [0, 0, 0],
        autoRotateSpeed: 0.9,
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
    const { camera } = useThree();

    useFrame(() => {
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];

        if (controlsRef.current) {
            // Only update speed - never overwrite target every frame (that fights OrbitControls)
            controlsRef.current.autoRotateSpeed = (preset.autoRotateSpeed || 0.7) * 1.2;
        }

        if (lastPresetIdx.current !== presetIdx) {
            lastPresetIdx.current = presetIdx;
            const perspCam = camera as THREE.PerspectiveCamera;
            if (perspCam && perspCam.fov !== preset.fov) {
                perspCam.fov = preset.fov;
                perspCam.updateProjectionMatrix();
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
                autoRotate={true}
                autoRotateSpeed={0.8}
                minDistance={3.5}
                maxDistance={250}
                minPolarAngle={0.05}
                maxPolarAngle={Math.PI - 0.05}
            />
        </>
    );
};

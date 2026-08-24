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
    type: 'rollercoaster' | 'chopper' | 'giant' | 'orbit' | 'corkscrew' | 'slalom' | 'vortex';
}

export const CAMERA_PRESETS: CameraPreset[] = [
    {
        id: 'rollercoaster',
        name: 'Roller-Coaster Shoot',
        icon: '🎢',
        description: 'Thrilling rail-cam weaving directly through the ribbons and strands with dynamic banking',
        fov: 74,
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
        description: 'Ultra-wide low-ground hero angle gazing up into the towering cosmic structure',
        fov: 82,
        defaultPos: [0, -7.5, 10.5],
        target: [0, 3.2, 0],
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
            // 🎢 Roller-Coaster Rail Shoot: Weaves dynamically through the ribbons with banking
            const tRC = time * 0.16;
            const rRC = 6.8 + Math.sin(tRC * 2.5) * 2.8;
            posOut.x = Math.sin(tRC * 1.8) * rRC;
            posOut.y = Math.cos(tRC * 2.2) * 3.2 + Math.sin(tRC * 0.9) * 1.5;
            posOut.z = Math.cos(tRC * 1.8) * rRC;

            const tAhead = tRC + 0.18;
            const rAhead = 6.8 + Math.sin(tAhead * 2.5) * 2.8;
            tgtOut.x = Math.sin(tAhead * 1.8) * rAhead;
            tgtOut.y = Math.cos(tAhead * 2.2) * 3.2 + Math.sin(tAhead * 0.9) * 1.5;
            tgtOut.z = Math.cos(tAhead * 1.8) * rAhead;
        } else if (mode === 'chopper') {
            // 🚁 Chopper Core Hover: Slow, stable hovering float inside the inner void
            const tChop = time * 0.12;
            posOut.x = Math.sin(tChop * 1.4) * 2.2;
            posOut.y = Math.sin(tChop * 2.2) * 1.4 + Math.cos(tChop * 0.8) * 0.6;
            posOut.z = Math.cos(tChop * 1.4) * 2.2;

            const panAngle = time * 0.20;
            tgtOut.x = posOut.x + Math.sin(panAngle) * 9.0;
            tgtOut.y = posOut.y + Math.sin(time * 0.18) * 3.5;
            tgtOut.z = posOut.z + Math.cos(panAngle) * 9.0;
        } else if (mode === 'giant') {
            // 🗿 Monumental Giant: Low-ground wide-angle lens gazing up into the towering monolith
            const tG = time * 0.08;
            posOut.x = Math.sin(tG) * 10.5;
            posOut.y = -7.5 + Math.sin(time * 0.12) * 0.6;
            posOut.z = Math.cos(tG) * 10.5;

            tgtOut.x = 0.0;
            tgtOut.y = 3.2 + Math.cos(time * 0.15) * 1.2;
            tgtOut.z = 0.0;
        } else if (mode === 'corkscrew') {
            // 🌀 Helical Spiral: Ascending corkscrew tracing the vertical helix
            const tCS = time * 0.18;
            const rCS = 11.8 + Math.cos(time * 0.12) * 1.8;
            posOut.x = Math.sin(tCS) * rCS;
            posOut.y = Math.sin(time * 0.09) * 6.5;
            posOut.z = Math.cos(tCS) * rCS;

            tgtOut.x = Math.sin(tCS + Math.PI * 0.5) * 3.0;
            tgtOut.y = -posOut.y * 0.3;
            tgtOut.z = Math.cos(tCS + Math.PI * 0.5) * 3.0;
        } else if (mode === 'slalom') {
            // ⚡ Action Slalom: Rapid undulating slalom flyby skimming ribbons
            const tS = time * 0.22;
            const rS = 11.2 + Math.sin(tS * 2.8) * 3.2;
            posOut.x = Math.sin(tS) * rS;
            posOut.y = 1.8 + Math.cos(tS * 3.2) * 3.6;
            posOut.z = Math.cos(tS) * rS;

            tgtOut.x = Math.sin(tS + 0.3) * 4.0;
            tgtOut.y = 0.0;
            tgtOut.z = Math.cos(tS + 0.3) * 4.0;
        } else if (mode === 'vortex') {
            // 🌌 Vortex Horizon: Top-down vantage point looking into the funnel
            const tV = time * 0.10;
            posOut.x = Math.sin(tV) * 6.8;
            posOut.y = 10.5 + Math.sin(tV * 1.4) * 1.8;
            posOut.z = Math.cos(tV) * 6.8;

            tgtOut.x = 0.0;
            tgtOut.y = -1.2;
            tgtOut.z = 0.0;
        } else {
            // 🪐 Celestial Orbit: Smooth 360° majestic horizon sweep
            const tOrb = time * 0.12;
            posOut.x = Math.sin(tOrb) * 12.8;
            posOut.y = 3.2 + Math.sin(tOrb * 1.5) * 1.8;
            posOut.z = Math.cos(tOrb) * 12.8;

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

            // Synchronize Camera-Mounted Spotlight to follow camera and illuminate shadowed regions
            if (spotLightRef.current && spotTargetRef.current) {
                spotLightRef.current.position.copy(perspCam.position);
                spotTargetRef.current.position.copy(controls.target);
                spotLightRef.current.target = spotTargetRef.current;

                const mult = state.lightIntensityMultiplier ?? 1.0;
                const isClosePreset = (preset.type === 'chopper' || preset.type === 'rollercoaster');
                spotLightRef.current.intensity = (isClosePreset ? 3.0 : 2.4) * mult;
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
                minDistance={1.8}
                maxDistance={220}
                minPolarAngle={0.02}
                maxPolarAngle={Math.PI - 0.02}
            />

            {/* Camera-Mounted Spotlight (Follows view frustum to illuminate dark/shady sides of topology) */}
            <spotLight
                ref={spotLightRef}
                position={[0, 3.2, 12.8]}
                intensity={2.4}
                distance={70.0}
                angle={Math.PI / 3.0}
                penumbra={0.85}
                decay={1.1}
                color="#f8fafc"
            />
        </>
    );
};

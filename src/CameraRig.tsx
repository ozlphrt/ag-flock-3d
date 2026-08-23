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
    const lastInteractionTime = useRef(0);
    const isUserDragging = useRef(false);
    const userHasOverridden = useRef(false);
    const { camera, gl } = useThree();

    // Seamless Transition Anchors (Quintic C2-Continuous Morphing)
    const transitionStartTime = useRef(0);
    const transitionDuration = 3.5;
    const startCamPos = useRef(new THREE.Vector3(0, 3.5, 14.0));
    const startLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const startFov = useRef(52);
    const curLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const smoothTargetDist = useRef(14.0);
    const orbitBaseAngle = useRef(0);

    const handleUserInteraction = () => {
        lastInteractionTime.current = performance.now();
        userHasOverridden.current = true;
        transitionStartTime.current = -100;
        if (controlsRef.current) {
            controlsRef.current.enabled = true;
        }
    };

    useEffect(() => {
        const dom = gl.domElement;
        const onPointerDown = () => {
            isUserDragging.current = true;
            handleUserInteraction();
        };
        const onPointerUp = () => {
            isUserDragging.current = false;
            lastInteractionTime.current = performance.now();
        };
        const onWheel = () => {
            handleUserInteraction();
        };

        dom.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        dom.addEventListener('wheel', onWheel, { passive: true });
        dom.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });

        return () => {
            dom.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
            dom.removeEventListener('wheel', onWheel);
            dom.removeEventListener('touchstart', onPointerDown);
            window.removeEventListener('touchend', onPointerUp);
        };
    }, [gl]);

    useFrame((stateContext, delta) => {
        const time = stateContext.clock.getElapsedTime();
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];
        const safeDelta = Math.min(delta, 0.05);

        const perspCam = camera as THREE.PerspectiveCamera;
        const vFovRad = (preset.fov) * (Math.PI / 180);
        const rBound = (state && state.formationRadius) ? Math.max(4.5, state.formationRadius) : 7.0;
        const baseFramingDist = (rBound / Math.sin(Math.max(0.12, vFovRad * 0.5))) * 0.44;

        const minSafeStandoff = rBound + 1.6;
        let presetDistMult = 1.0;
        if (preset.id === 'giant') presetDistMult = 0.85;
        else if (preset.id === 'action') presetDistMult = 0.88;

        const targetDistance = Math.max(minSafeStandoff, baseFramingDist * presetDistMult);
        smoothTargetDist.current = THREE.MathUtils.damp(smoothTargetDist.current, targetDistance, 2.5, safeDelta);

        // 1. Detect Preset Switch
        if (lastPresetIdx.current !== presetIdx) {
            userHasOverridden.current = false;
            if (lastPresetIdx.current === -1) {
                transitionStartTime.current = -100;
            } else {
                transitionStartTime.current = time;
                startCamPos.current.copy(camera.position);
                startLookTarget.current.copy(curLookTarget.current);
                startFov.current = perspCam.fov;
            }
            lastPresetIdx.current = presetIdx;
            orbitBaseAngle.current = Math.atan2(camera.position.x, camera.position.z);
        }

        const isUserInteracting = (performance.now() - lastInteractionTime.current) < 4000 || isUserDragging.current;

        // 2. User Interactive Mode (OrbitControls active)
        if (isUserInteracting || isUserDragging.current) {
            if (controlsRef.current) {
                if (!controlsRef.current.enabled) {
                    controlsRef.current.enabled = true;
                }
                curLookTarget.current.copy(controlsRef.current.target);
            }
            return;
        }

        // Disable OrbitControls in Autonomous Mode so it never conflicts with CameraRig frame updates
        if (controlsRef.current && controlsRef.current.enabled) {
            controlsRef.current.enabled = false;
        }

        // 3. Re-enter Autonomous Mode seamlessly from user's current camera position
        if (userHasOverridden.current) {
            userHasOverridden.current = false;
            transitionStartTime.current = time;
            startCamPos.current.copy(camera.position);
            startLookTarget.current.copy(curLookTarget.current);
            startFov.current = perspCam.fov;
            orbitBaseAngle.current = Math.atan2(camera.position.x, camera.position.z) - (time * preset.autoRotateSpeed * 0.35);
            smoothTargetDist.current = Math.max(minSafeStandoff, camera.position.distanceTo(curLookTarget.current));
        }

        const elapsed = Math.max(0.0, time - transitionStartTime.current);
        const p = Math.min(1.0, elapsed / transitionDuration);
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        // 4. Compute Analytic Trajectory
        _camIdealTarget.set(preset.target[0], preset.target[1], preset.target[2]);
        const rPerimeter = Math.max(minSafeStandoff, rBound + 1.8);

        if (preset.type === 'flythrough') {
            const t = time * 0.16;
            _camIdealPos.set(
                Math.sin(t) * rPerimeter,
                Math.sin(t * 1.5) * (rBound * 0.35) + 1.2,
                Math.cos(t) * rPerimeter
            );
            _camIdealTarget.set(0, Math.sin(t * 0.8) * 0.4, 0);
        } else if (preset.type === 'corkscrew') {
            const t = time * 0.12;
            const rSpiral = rPerimeter + Math.sin(t * 0.5) * 0.8;
            _camIdealPos.set(
                Math.cos(t) * rSpiral,
                Math.sin(t * 0.6) * (rBound * 0.50) + 0.8,
                Math.sin(t) * rSpiral
            );
            _camIdealTarget.set(0, Math.sin(t * 0.6) * 0.5, 0);
        } else {
            // Pure Analytic Orbit
            const orbitAngle = orbitBaseAngle.current + time * (preset.autoRotateSpeed * 0.35);
            const rOrbit = smoothTargetDist.current;
            const yOrbit = preset.id === 'giant' ? -(rBound * 0.75 + 1.2) : preset.defaultPos[1];
            _camIdealPos.set(
                Math.sin(orbitAngle) * rOrbit,
                yOrbit,
                Math.cos(orbitAngle) * rOrbit
            );
        }

        // 5. Apply Camera Transforms
        if (p < 1.0) {
            camera.position.lerpVectors(startCamPos.current, _camIdealPos, sCurve);
            curLookTarget.current.lerpVectors(startLookTarget.current, _camIdealTarget, sCurve);

            const nextFov = startFov.current + (preset.fov - startFov.current) * sCurve;
            if (Math.abs(perspCam.fov - nextFov) > 0.05) {
                perspCam.fov = nextFov;
                perspCam.updateProjectionMatrix();
            }
        } else {
            camera.position.copy(_camIdealPos);
            curLookTarget.current.copy(_camIdealTarget);

            if (Math.abs(perspCam.fov - preset.fov) > 0.05) {
                perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, preset.fov, 0.05);
                perspCam.updateProjectionMatrix();
            }
        }

        if (controlsRef.current) {
            controlsRef.current.target.copy(curLookTarget.current);
        }
        camera.lookAt(curLookTarget.current);
    });

    return (
        <>
            <PerspectiveCamera ref={cameraRef} makeDefault fov={52} position={[0, 3.5, 14.0]} near={0.25} far={1000} />
            <OrbitControls
                ref={controlsRef}
                enableDamping={false}
                autoRotate={false}
                minDistance={3.5}
                maxDistance={250}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                onStart={() => {
                    isUserDragging.current = true;
                    handleUserInteraction();
                }}
                onEnd={() => {
                    isUserDragging.current = false;
                    lastInteractionTime.current = performance.now();
                }}
                onChange={() => {
                    if (isUserDragging.current) {
                        handleUserInteraction();
                    }
                }}
            />
        </>
    );
};

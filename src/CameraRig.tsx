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
        name: 'Orbit',
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
        name: 'Low Angle',
        icon: '🗿',
        description: 'Positioned close beneath the bottom of the topology gazing upward into the swarm',
        fov: 84,
        defaultPos: [0, -12.0, 7.5],
        target: [0, 1.5, 0],
        autoRotateSpeed: 0.7,
        type: 'orbit'
    },
    {
        id: 'action',
        name: 'Action',
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
        name: 'Fly-Through',
        icon: '🚀',
        description: 'Cockpit fly-through: dives straight through the heart and loops back',
        fov: 72,
        defaultPos: [0, 0, 24],
        target: [0, 0, 0],
        autoRotateSpeed: 0.0,
        type: 'flythrough'
    },
    {
        id: 'corkscrew',
        name: 'Corkscrew',
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
    const isUserDragging = useRef(false);
    const userHasOverridden = useRef(false);
    const { camera } = useThree();

    // Seamless Transition Anchors (Quintic C2-Continuous Morphing)
    const transitionStartTime = useRef(0);
    const transitionDuration = 4.5; // 4.5s silky-smooth cinematic camera glide
    const startCamPos = useRef(new THREE.Vector3(0, 4, 18));
    const startLookTarget = useRef(new THREE.Vector3(0, 0, 0));
    const startFov = useRef(55);
    const curLookTarget = useRef(new THREE.Vector3(0, 0, 0));

    const handleUserInteraction = () => {
        lastInteractionTime.current = performance.now();
        userHasOverridden.current = true;
        transitionStartTime.current = -100; // Immediately stop transition from overriding
        if (simState.current.clockEngine?.setManualOverride) {
            simState.current.clockEngine.setManualOverride('camera');
        }
    };

    useEffect(() => {
        const onPointerDown = () => {
            isUserDragging.current = true;
            handleUserInteraction();
        };
        const onPointerUp = () => {
            isUserDragging.current = false;
        };
        const onWheel = () => {
            handleUserInteraction();
        };

        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });
        return () => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onPointerDown);
            window.removeEventListener('touchend', onPointerUp);
        };
    }, []);

    useFrame((stateContext, delta) => {
        const time = stateContext.clock.getElapsedTime();
        const state = simState.current;
        const presetIdx = (state && state.cameraPresetIndex !== undefined)
            ? Math.abs(state.cameraPresetIndex) % CAMERA_PRESETS.length
            : 0;
        const preset = CAMERA_PRESETS[presetIdx];
        const safeDelta = Math.min(delta, 0.05);

        // 1. Dynamic Viewport-Adaptive Framing Distance Calculation
        const perspCam = camera as THREE.PerspectiveCamera;
        const vFovRad = (preset.fov) * (Math.PI / 180);
        const rBound = (state && state.formationRadius) ? state.formationRadius : 7.5;
        const baseFramingDist = (rBound / Math.sin(Math.max(0.12, vFovRad * 0.5))) * 0.58;

        let presetDistMult = 1.0;
        if (preset.id === 'giant') presetDistMult = 0.62;
        else if (preset.id === 'action') presetDistMult = 0.68;
        else if (preset.id === 'celestial') presetDistMult = 1.10;

        const targetDistance = baseFramingDist * presetDistMult;

        // 2. Trigger Smooth Transition on Explicit Preset Switch
        if (lastPresetIdx.current !== presetIdx) {
            userHasOverridden.current = false; // Reset override on intentional preset switch
            if (lastPresetIdx.current === -1) {
                // Initial load: snap immediately
                transitionStartTime.current = -100;
            } else {
                transitionStartTime.current = time;
                startCamPos.current.copy(camera.position);
                startLookTarget.current.copy(curLookTarget.current);
                startFov.current = perspCam.fov;
            }
            lastPresetIdx.current = presetIdx;
        }

        const isUserInteracting = (performance.now() - lastInteractionTime.current) < 5000 || isUserDragging.current;

        // User mouse/touch drag PREVAILS immediately over all presets & paths
        if (userHasOverridden.current) {
            if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.autoRotate = !isUserInteracting;
                controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed * 0.6;
                curLookTarget.current.copy(controlsRef.current.target);
            }
            return;
        }

        const elapsed = Math.max(0.0, time - transitionStartTime.current);
        const p = Math.min(1.0, elapsed / transitionDuration);
        // Ultra-smooth C2-continuous Quintic Ease-In / Ease-Out: 6p^5 - 15p^4 + 10p^3
        const sCurve = p * p * p * (p * (p * 6.0 - 15.0) + 10.0);

        // 3. Compute Ideal Preset Trajectory / Position & LookTarget
        _camIdealTarget.set(preset.target[0], preset.target[1], preset.target[2]);

        const rScale = Math.max(0.65, (rBound / 7.5));

        if (preset.type === 'flythrough') {
            flightTime.current += safeDelta * 0.20;
            const t = flightTime.current;
            _camIdealPos.set(
                Math.sin(t) * (7.5 * rScale),
                Math.sin(t * 2.0) * (2.6 * rScale),
                Math.cos(t) * (8.5 * rScale)
            );
            _camIdealTarget.set(0, Math.sin(t * 1.5) * 0.8, 0);
        } else if (preset.type === 'corkscrew') {
            flightTime.current += safeDelta * 0.14;
            const t = flightTime.current;
            const r = (5.5 + Math.sin(t * 0.6) * 3.0) * rScale;
            _camIdealPos.set(
                Math.cos(t) * r,
                Math.sin(t * 0.8) * (5.5 * rScale),
                Math.sin(t) * r
            );
            _camIdealTarget.set(0, Math.sin(t * 0.8) * 1.2, 0);
        } else {
            // Orbit Presets
            _camDir.set(preset.defaultPos[0], preset.defaultPos[1], preset.defaultPos[2]).normalize();
            _camIdealPos.copy(_camIdealTarget).addScaledVector(_camDir, targetDistance);
            if (preset.id === 'giant') {
                // Ensure camera is snugly situated close beneath the bottom of the topology
                _camIdealPos.y = Math.min(_camIdealPos.y, -rBound * 0.85 - 1.2);
            }
        }

        // 4. Smoothly Blend Position, LookTarget, and FOV
        if (p < 1.0) {
            // Actively Morphing
            camera.position.lerpVectors(startCamPos.current, _camIdealPos, sCurve);
            curLookTarget.current.lerpVectors(startLookTarget.current, _camIdealTarget, sCurve);
            camera.up.set(0, 1, 0);
            camera.lookAt(curLookTarget.current);

            perspCam.fov = startFov.current + (preset.fov - startFov.current) * sCurve;
            perspCam.updateProjectionMatrix();

            if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.target.copy(curLookTarget.current);
            }
        } else {
            // Settled in Preset Mode — only update projection when FOV actually changes
            const targetFov = preset.fov;
            if (Math.abs(perspCam.fov - targetFov) > 0.01) {
                perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFov, 0.05);
                perspCam.updateProjectionMatrix();
            }

            if (preset.type === 'flythrough' || preset.type === 'corkscrew') {
                camera.position.copy(_camIdealPos);
                curLookTarget.current.copy(_camIdealTarget);
                camera.up.set(0, 1, 0);
                camera.lookAt(curLookTarget.current);

                if (controlsRef.current) {
                    controlsRef.current.enabled = true;
                    controlsRef.current.target.copy(curLookTarget.current);
                }
            } else {
                // Orbit mode
                if (controlsRef.current) {
                    controlsRef.current.enabled = true;
                    controlsRef.current.autoRotate = !isUserInteracting;
                    controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed;

                    if (!isUserInteracting) {
                        const target = controlsRef.current.target;
                        const curDist = camera.position.distanceTo(target);
                        if (curDist > 0.1 && Math.abs(curDist - targetDistance) > 0.05) {
                            const nextDist = THREE.MathUtils.lerp(curDist, targetDistance, 0.025);
                            _camDir2.subVectors(camera.position, target).normalize();
                            camera.position.copy(target).addScaledVector(_camDir2, nextDist);
                        }
                    }
                    curLookTarget.current.copy(controlsRef.current.target);
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
                onStart={() => handleUserInteraction()}
                onChange={() => {
                    if (isUserDragging.current) {
                        handleUserInteraction();
                    }
                }}
            />
        </>
    );
};

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationState } from './BoidLogic';

const VORTEX_COLORS = [
    { core: '#00ffcc', glow: '#00ffaa', ring: '#80ffe5' },
    { core: '#ff9900', glow: '#ffcc00', ring: '#ffe066' },
    { core: '#ff007f', glow: '#ff3399', ring: '#ff80bf' },
    { core: '#7000ff', glow: '#a64dff', ring: '#d9b3ff' }
];

export const VortexBeacons: React.FC<{ simState: React.MutableRefObject<SimulationState> }> = ({ simState }) => {
    const groupRef = useRef<THREE.Group>(null);
    const vortexMeshes = useRef<(THREE.Group | null)[]>([]);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const time = clock.getElapsedTime();
        const state = simState.current;
        const speedMult = state.speedMultiplier || 0.28;
        const numVortices = Math.min(4, Math.max(1, state.localVortexCount ?? 2));

        for (let v = 0; v < 4; v++) {
            const meshGroup = vortexMeshes.current[v];
            if (!meshGroup) continue;

            if (v < numVortices) {
                meshGroup.visible = true;
                const vPhase = time * (0.65 + v * 0.22) * speedMult + (v * Math.PI * 2.0 / numVortices);
                const vRad = 3.8 + Math.sin(time * 0.4 + v * 1.5) * 1.6;
                const vx = Math.cos(vPhase) * vRad;
                const vy = Math.sin(vPhase * 1.4) * 2.4 + (v - (numVortices - 1) * 0.5) * 1.2;
                const vz = Math.sin(vPhase) * vRad;

                meshGroup.position.set(vx, vy, vz);

                // Spin the rings rapidly to reflect rotational vorticity
                meshGroup.rotation.y = time * (2.5 + v * 0.8);
                meshGroup.rotation.x = Math.sin(time * 1.5 + v) * 0.4;
                meshGroup.rotation.z = Math.cos(time * 1.2 + v) * 0.4;

                const pulse = 1.0 + Math.sin(time * 4.0 + v * 2.0) * 0.15;
                meshGroup.scale.set(pulse, pulse, pulse);
            } else {
                meshGroup.visible = false;
            }
        }
    });

    return (
        <group ref={groupRef}>
            {[0, 1, 2, 3].map((v) => {
                const colorSet = VORTEX_COLORS[v];
                return (
                    <group
                        key={v}
                        ref={(el) => (vortexMeshes.current[v] = el)}
                        visible={false}
                    >
                        {/* 1. Luminous Vortex Eye Core */}
                        <mesh>
                            <sphereGeometry args={[0.28, 16, 16]} />
                            <meshBasicMaterial color={colorSet.core} transparent opacity={0.9} />
                        </mesh>

                        {/* 2. Inner Spinning Holographic Vortex Ring */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.9, 0.04, 8, 32]} />
                            <meshBasicMaterial color={colorSet.glow} wireframe transparent opacity={0.8} />
                        </mesh>

                        {/* 3. Outer Swirling Funnel Ring */}
                        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
                            <torusGeometry args={[1.6, 0.05, 8, 32]} />
                            <meshBasicMaterial color={colorSet.ring} wireframe transparent opacity={0.65} />
                        </mesh>

                        {/* 4. Third Tilted Whirlpool Ring */}
                        <mesh rotation={[-Math.PI / 3, -Math.PI / 4, 0]}>
                            <torusGeometry args={[2.3, 0.04, 8, 32]} />
                            <meshBasicMaterial color={colorSet.core} wireframe transparent opacity={0.5} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

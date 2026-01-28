import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Boid, SimulationState, SpeciesType, SPECIES_COLORS } from './BoidLogic'

interface FlockProps {
    count: number;
    state: SimulationState;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export function Flock({ count, state }: FlockProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!);

    // Pre-rotated geometry
    const geometry = useMemo(() => {
        const g = new THREE.ConeGeometry(0.2, 0.6, 8);
        g.rotateX(Math.PI / 2);
        return g;
    }, []);

    const boids = useRef<Boid[]>([]);

    // Initialize/Update Boid Population
    useMemo(() => {
        if (boids.current.length < count) {
            const additional = Array.from({ length: count - boids.current.length }, () => {
                const size = 0.5 + Math.random() * 1.0;
                // Assign random species
                const species = Math.floor(Math.random() * 4) as SpeciesType;
                return new Boid(
                    (Math.random() - 0.5) * state.bounds * 1.8,
                    (Math.random() - 0.5) * state.bounds * 1.8,
                    (Math.random() - 0.5) * state.bounds * 1.8,
                    species,
                    size
                );
            });
            boids.current.push(...additional);
        } else if (boids.current.length > count) {
            boids.current.splice(count);
        }
    }, [count, state.bounds]);

    // Update colors whenever population changes
    useEffect(() => {
        if (!meshRef.current) return;

        boids.current.forEach((boid, i) => {
            tempColor.set(SPECIES_COLORS[boid.species]);
            meshRef.current.setColorAt(i, tempColor);
        });

        meshRef.current.instanceColor!.needsUpdate = true;
    }, [count]);

    useFrame(() => {
        if (!meshRef.current) return;
        const boidsList = boids.current;
        const boidCount = boidsList.length;

        // Collision resolution pass
        for (let i = 0; i < boidCount; i++) {
            for (let j = i + 1; j < boidCount; j++) {
                boidsList[i].resolveCollision(boidsList[j]);
            }
        }

        // Flocking and Update pass
        for (let i = 0; i < boidCount; i++) {
            const boid = boidsList[i];
            boid.flock(boidsList, state);
            boid.update(state);

            tempObject.position.copy(boid.position);
            tempObject.scale.setScalar(boid.size * state.sizeMultiplier);

            if (boid.velocity.lengthSq() > 0.0001) {
                tempObject.lookAt(boid.position.clone().add(boid.velocity));
            }

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, undefined, count]} castShadow receiveShadow>
            <meshStandardMaterial
                roughness={0.3}
                metalness={0.6}
                emissiveIntensity={0} // Rely on light for visibility
                toneMapped={false}
            />
        </instancedMesh>
    );
}

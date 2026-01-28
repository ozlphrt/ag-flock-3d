import * as THREE from 'three';

export enum SpeciesType {
    Red = 0,
    Green = 1,
    Blue = 2,
    Yellow = 3
}

export const SPECIES_COLORS = [
    '#ff4444', // Red
    '#44ff44', // Green
    '#4444ff', // Blue
    '#ffff44'  // Yellow
];

export interface SpeciesAttributes {
    separationWeight: number;
    alignmentWeight: number;
    cohesionWeight: number;
    maxSpeed: number;
    maxForce: number;
    perceptionRadius: number;
}

// Global Matrices provided by App
export interface SimulationState {
    attributes: SpeciesAttributes[];
    interactions: number[][]; // [i][j] = Weight of species i being attracted/repelled by species j
    bounds: number;
    speedMultiplier: number;
    sizeMultiplier: number;
}

export class Boid {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    species: SpeciesType;
    size: number;

    constructor(x: number, y: number, z: number, species: SpeciesType, size: number) {
        this.position = new THREE.Vector3(x, y, z);
        this.species = species;
        this.size = size;
        this.velocity = new THREE.Vector3().randomDirection().multiplyScalar(0.1);
        this.acceleration = new THREE.Vector3();
    }

    // Gradual edge avoidance
    avoidEdges(bounds: number, maxForce: number) {
        const margin = 8;
        const steer = new THREE.Vector3();
        const force = maxForce * 5;

        if (this.position.x > bounds - margin) steer.x = -force;
        if (this.position.x < -bounds + margin) steer.x = force;
        if (this.position.y > bounds - margin) steer.y = -force;
        if (this.position.y < -bounds + margin) steer.y = force;
        if (this.position.z > bounds - margin) steer.z = -force;
        if (this.position.z < -bounds + margin) steer.z = force;

        this.acceleration.add(steer);

        // Hard safety
        if (this.position.x >= bounds) { this.position.x = bounds; this.velocity.x *= -0.5; }
        if (this.position.x <= -bounds) { this.position.x = -bounds; this.velocity.x *= -0.5; }
        if (this.position.y >= bounds) { this.position.y = bounds; this.velocity.y *= -0.5; }
        if (this.position.y <= -bounds) { this.position.y = -bounds; this.velocity.y *= -0.5; }
        if (this.position.z >= bounds) { this.position.z = bounds; this.velocity.z *= -0.5; }
        if (this.position.z <= -bounds) { this.position.z = -bounds; this.velocity.z *= -0.5; }
    }

    resolveCollision(other: Boid) {
        const minDistance = (this.size + other.size) * 0.25;
        const diff = new THREE.Vector3().subVectors(this.position, other.position);
        const distance = diff.length();

        if (distance < minDistance && distance > 0) {
            const overlap = minDistance - distance;
            const push = diff.normalize().multiplyScalar(overlap * 0.5);
            this.position.add(push);
            other.position.sub(push);

            const dot = new THREE.Vector3().subVectors(this.velocity, other.velocity).dot(diff.normalize());
            if (dot < 0) {
                const impulse = diff.normalize().multiplyScalar(dot);
                this.velocity.sub(impulse);
                other.velocity.add(impulse);
            }
        }
    }

    update(state: SimulationState) {
        const attr = state.attributes[this.species];
        const maxSpeed = attr.maxSpeed * state.speedMultiplier;

        this.avoidEdges(state.bounds, attr.maxForce);

        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0.01, maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.set(0, 0, 0);
    }

    flock(boids: Boid[], state: SimulationState) {
        const attr = state.attributes[this.species];
        const interactionRow = state.interactions[this.species];

        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        const interSpecies = new THREE.Vector3();

        let sameTotal = 0;
        let interTotal = 0;

        for (const other of boids) {
            if (other === this) continue;

            const dist = this.position.distanceTo(other.position);

            if (other.species === this.species) {
                // Same species: standard flocking
                if (dist < attr.perceptionRadius) {
                    // Separation
                    if (dist < attr.perceptionRadius * 0.5 && dist > 0) {
                        const diff = new THREE.Vector3().subVectors(this.position, other.position);
                        diff.divideScalar(dist * dist);
                        separation.add(diff);
                    }
                    // Alignment
                    alignment.add(other.velocity);
                    // Cohesion
                    cohesion.add(other.position);
                    sameTotal++;
                }
            } else {
                // Different species: interaction matrix
                if (dist < attr.perceptionRadius * 1.5) {
                    const weight = interactionRow[other.species];
                    if (weight !== 0) {
                        const diff = new THREE.Vector3().subVectors(other.position, this.position);
                        // Normalize and weight by attraction/repulsion
                        // Positive weight = attract, Negative = repel
                        diff.setLength(Math.abs(weight));
                        if (weight < 0) diff.negate();

                        // Inverse square law for interaction strength
                        diff.divideScalar(Math.max(1, dist * 0.2));
                        interSpecies.add(diff);
                        interTotal++;
                    }
                }
            }
        }

        if (sameTotal > 0) {
            // Process same-species behaviors
            separation.divideScalar(sameTotal).setLength(attr.maxSpeed).sub(this.velocity).clampLength(0, attr.maxForce * attr.separationWeight);
            alignment.divideScalar(sameTotal).setLength(attr.maxSpeed).sub(this.velocity).clampLength(0, attr.maxForce * attr.alignmentWeight);

            cohesion.divideScalar(sameTotal).sub(this.position).setLength(attr.maxSpeed).sub(this.velocity).clampLength(0, attr.maxForce * attr.cohesionWeight);

            this.acceleration.add(separation);
            this.acceleration.add(alignment);
            this.acceleration.add(cohesion);
        }

        if (interTotal > 0) {
            interSpecies.divideScalar(interTotal).clampLength(0, attr.maxForce * 2);
            this.acceleration.add(interSpecies);
        }
    }
}

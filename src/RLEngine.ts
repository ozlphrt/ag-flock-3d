import { COLOR_PALETTES, MATERIAL_PRESETS, FormationMode, ProceduralGenome } from './BoidLogic';

export interface LikedCreation {
    id: string;
    timestamp: number;
    formationMode: number;
    formationLabel: string;
    boidShape: number;
    shapeLabel: string;
    materialPreset: number;
    materialLabel: string;
    colors: string[];
    genome?: ProceduralGenome;
}

export interface DislikedCreation {
    id: string;
    timestamp: number;
    formationMode: number;
    boidShape: number;
    materialPreset: number;
}

export interface RLPreferences {
    formationLikes: Record<number, number>;
    formationDislikes: Record<number, number>;
    shapeLikes: Record<number, number>;
    shapeDislikes: Record<number, number>;
    materialLikes: Record<number, number>;
    materialDislikes: Record<number, number>;
    totalLikes: number;
    totalDislikes: number;
    likedGenomes: ProceduralGenome[];
}

const STORAGE_KEY_LIKES = 'flock_liked_creations';
const STORAGE_KEY_DISLIKES = 'flock_disliked_creations';
const STORAGE_KEY_PREFS = 'flock_rl_preferences_v2';

export function getLikedCreations(): LikedCreation[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY_LIKES);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function getDislikedCreations(): DislikedCreation[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY_DISLIKES);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function getRLPreferences(): RLPreferences {
    try {
        const data = localStorage.getItem(STORAGE_KEY_PREFS);
        if (data) return JSON.parse(data);
    } catch { }

    return {
        formationLikes: {},
        formationDislikes: {},
        shapeLikes: {},
        shapeDislikes: {},
        materialLikes: {},
        materialDislikes: {},
        totalLikes: 0,
        totalDislikes: 0,
        likedGenomes: []
    };
}

export function saveLikedCreation(creation: LikedCreation): { isNew: boolean; totalLikes: number; totalDislikes: number } {
    const likes = getLikedCreations();
    const prefs = getRLPreferences();

    const existingIndex = likes.findIndex(
        l => l.formationMode === creation.formationMode &&
             l.boidShape === creation.boidShape &&
             l.materialPreset === creation.materialPreset
    );

    let isNew = false;
    if (existingIndex === -1) {
        likes.unshift(creation);
        isNew = true;

        prefs.formationLikes[creation.formationMode] = (prefs.formationLikes[creation.formationMode] || 0) + 1;
        prefs.shapeLikes[creation.boidShape] = (prefs.shapeLikes[creation.boidShape] || 0) + 1;
        prefs.materialLikes[creation.materialPreset] = (prefs.materialLikes[creation.materialPreset] || 0) + 1;
        prefs.totalLikes = (prefs.totalLikes || 0) + 1;

        if (creation.genome) {
            prefs.likedGenomes.push(creation.genome);
            if (prefs.likedGenomes.length > 20) prefs.likedGenomes.shift();
        }

        localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(likes.slice(0, 100)));
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    }

    return { isNew, totalLikes: prefs.totalLikes, totalDislikes: prefs.totalDislikes || 0 };
}

export function saveDislikedCreation(dislike: DislikedCreation): { isNew: boolean; totalLikes: number; totalDislikes: number } {
    const dislikes = getDislikedCreations();
    const prefs = getRLPreferences();

    const existingIndex = dislikes.findIndex(
        d => d.formationMode === dislike.formationMode &&
             d.boidShape === dislike.boidShape &&
             d.materialPreset === dislike.materialPreset
    );

    let isNew = false;
    if (existingIndex === -1) {
        dislikes.unshift(dislike);
        isNew = true;

        prefs.formationDislikes[dislike.formationMode] = (prefs.formationDislikes[dislike.formationMode] || 0) + 1;
        prefs.shapeDislikes[dislike.boidShape] = (prefs.shapeDislikes[dislike.boidShape] || 0) + 1;
        prefs.materialDislikes[dislike.materialPreset] = (prefs.materialDislikes[dislike.materialPreset] || 0) + 1;
        prefs.totalDislikes = (prefs.totalDislikes || 0) + 1;

        localStorage.setItem(STORAGE_KEY_DISLIKES, JSON.stringify(dislikes.slice(0, 100)));
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    }

    return { isNew, totalLikes: prefs.totalLikes || 0, totalDislikes: prefs.totalDislikes };
}

export function isCreationLiked(formationMode: number, boidShape: number, materialPreset: number): boolean {
    const likes = getLikedCreations();
    return likes.some(
        l => l.formationMode === formationMode &&
             l.boidShape === boidShape &&
             l.materialPreset === materialPreset
    );
}

export function isCreationDisliked(formationMode: number, boidShape: number, materialPreset: number): boolean {
    const dislikes = getDislikedCreations();
    return dislikes.some(
        d => d.formationMode === formationMode &&
             d.boidShape === boidShape &&
             d.materialPreset === materialPreset
    );
}

// Softmax Weighted Sampling with Anti-Saturation, Hard Dislike Blacklisting & Novelty Exploration
export function sampleRLAttribute(
    totalOptions: number,
    likeCounts: Record<number, number>,
    dislikeCounts: Record<number, number>,
    totalLikes: number,
    totalDislikes: number,
    excludeList: number[] = [],
    exploitProb = 0.65
): number {
    const validCandidates: number[] = [];
    for (let i = 0; i < totalOptions; i++) {
        const dislikes = dislikeCounts[i] || 0;
        const likes = likeCounts[i] || 0;

        // Hard Filter: Strictly block items with net negative feedback
        if (dislikes > likes) continue;
        if (excludeList.includes(i)) continue;

        validCandidates.push(i);
    }

    // Fallback if all options were excluded
    const candidatePool = validCandidates.length > 0
        ? validCandidates
        : Array.from({ length: totalOptions }, (_, idx) => idx).filter(i => (dislikeCounts[i] || 0) <= (likeCounts[i] || 0));

    const finalPool = candidatePool.length > 0 ? candidatePool : Array.from({ length: totalOptions }, (_, idx) => idx);

    // Surprise & Novelty Exploration (35% probability or if no Likes yet)
    if (totalLikes === 0 || Math.random() > exploitProb) {
        return finalPool[Math.floor(Math.random() * finalPool.length)];
    }

    // Softmax Preference Exploitation with Anti-Saturation Weight Capping
    let totalWeight = 0;
    const weights: { id: number; weight: number }[] = [];

    for (const id of finalPool) {
        const likes = likeCounts[id] || 0;
        const dislikes = dislikeCounts[id] || 0;

        const netScore = Math.max(0, likes - dislikes);
        // Anti-Saturation Cap (max weight = 20.0) so single presets cannot monopolize auto-cycle
        const weight = Math.min(20.0, Math.pow(netScore + 1, 1.5));

        weights.push({ id, weight });
        totalWeight += weight;
    }

    if (totalWeight <= 0) return finalPool[Math.floor(Math.random() * finalPool.length)];

    let rnd = Math.random() * totalWeight;
    for (const item of weights) {
        if (rnd < item.weight) return item.id;
        rnd -= item.weight;
    }

    return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// Procedural DNA Genome Synthesis with Genetic Crossover & Wildcard Surprise Mutations
export function generateProceduralGenome(): ProceduralGenome {
    const prefs = getRLPreferences();
    const likedGenomes = prefs.likedGenomes || [];

    const rndInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
    const rndFloat = (min: number, max: number) => min + Math.random() * (max - min);

    // 25% Surprise Wildcard Mutation (Radical non-repetitive DNA)
    const isSurpriseWildcard = Math.random() < 0.25;

    if (!isSurpriseWildcard && likedGenomes.length > 0 && Math.random() < 0.70) {
        const parentA = likedGenomes[Math.floor(Math.random() * likedGenomes.length)];
        const parentB = likedGenomes[Math.floor(Math.random() * likedGenomes.length)];

        const rndMutate = (v: number, scale = 0.2) => v + (Math.random() * 2 - 1) * scale;

        return {
            k1: Math.max(1, Math.round(rndMutate((parentA.k1 + parentB.k1) / 2, 1))),
            k2: Math.max(1, Math.round(rndMutate((parentA.k2 + parentB.k2) / 2, 1))),
            k3: Math.max(1, Math.round(rndMutate((parentA.k3 + parentB.k3) / 2, 1))),
            k4: Math.max(1, Math.round(rndMutate((parentA.k4 + parentB.k4) / 2, 1))),
            k5: Math.max(1, Math.round(rndMutate((parentA.k5 + parentB.k5) / 2, 1))),
            k6: Math.max(1, Math.round(rndMutate((parentA.k6 + parentB.k6) / 2, 1))),
            k7: Math.max(1, Math.round(rndMutate((parentA.k7 + parentB.k7) / 2, 1))),
            k8: Math.max(1, Math.round(rndMutate((parentA.k8 + parentB.k8) / 2, 1))),
            r1: Math.max(3.0, rndMutate((parentA.r1 + parentB.r1) / 2, 2.0)),
            r2: Math.max(3.0, rndMutate((parentA.r2 + parentB.r2) / 2, 2.0)),
            r3: Math.max(3.0, rndMutate((parentA.r3 + parentB.r3) / 2, 2.0)),
            a1: Math.max(0.5, rndMutate((parentA.a1 + parentB.a1) / 2, 1.0)),
            a2: Math.max(0.5, rndMutate((parentA.a2 + parentB.a2) / 2, 1.0)),
            a3: Math.max(0.5, rndMutate((parentA.a3 + parentB.a3) / 2, 1.0)),
            phi1: (parentA.phi1 + parentB.phi1) / 2 + Math.random() * 0.5,
            phi2: (parentA.phi2 + parentB.phi2) / 2 + Math.random() * 0.5,
            phi3: (parentA.phi3 + parentB.phi3) / 2 + Math.random() * 0.5
        };
    }

    // Fresh Wildcard Surprise Procedural Genome
    return {
        k1: rndInt(1, 8),
        k2: rndInt(1, 8),
        k3: rndInt(1, 8),
        k4: rndInt(1, 8),
        k5: rndInt(1, 8),
        k6: rndInt(1, 8),
        k7: rndInt(1, 8),
        k8: rndInt(1, 8),
        r1: rndFloat(4.0, 18.0),
        r2: rndFloat(4.0, 18.0),
        r3: rndFloat(4.0, 18.0),
        a1: rndFloat(1.0, 8.0),
        a2: rndFloat(1.0, 8.0),
        a3: rndFloat(1.0, 8.0),
        phi1: rndFloat(0, Math.PI * 2),
        phi2: rndFloat(0, Math.PI * 2),
        phi3: rndFloat(0, Math.PI * 2)
    };
}

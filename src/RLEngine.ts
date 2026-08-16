import { COLOR_PALETTES, MATERIAL_PRESETS, FormationMode, ProceduralGenome, LIGHTING_PROFILES } from './BoidLogic';

export interface LikedCreation {
    id: string;
    timestamp: number;
    formationMode: number;
    formationLabel: string;
    boidShape: number;
    shapeLabel: string;
    materialPreset: number;
    materialLabel: string;
    paletteIndex?: number;
    lightingProfileIndex?: number;
    cameraPresetIndex?: number;
    cameraLabel?: string;
    colors: string[];
    genome?: ProceduralGenome;
}

export interface DislikedCreation {
    id: string;
    timestamp: number;
    formationMode: number;
    boidShape: number;
    materialPreset: number;
    paletteIndex?: number;
    lightingProfileIndex?: number;
    cameraPresetIndex?: number;
}

export interface RLPreferences {
    formationLikes: Record<number, number>;
    formationDislikes: Record<number, number>;
    shapeLikes: Record<number, number>;
    shapeDislikes: Record<number, number>;
    materialLikes: Record<number, number>;
    materialDislikes: Record<number, number>;
    paletteLikes: Record<number, number>;
    paletteDislikes: Record<number, number>;
    lightingLikes: Record<number, number>;
    lightingDislikes: Record<number, number>;
    cameraLikes: Record<string, number>;
    cameraDislikes: Record<string, number>;
    bloomLikes?: Record<number, number>;
    bloomDislikes?: Record<number, number>;
    totalLikes: number;
    totalDislikes: number;
    likedGenomes: ProceduralGenome[];
}

export interface PersistedLastState {
    formationMode: number;
    formationSeed: number;
    paletteIndex: number;
    materialPreset: number;
    lightingProfileIndex: number;
    boidShape: number;
    savedAt: number;
}

export interface RLActionLogEntry {
    timestamp: number;
    action: 'like' | 'dislike' | 'save' | 'reroll' | 'lock' | 'unlock';
    dimension?: 'formation' | 'shape' | 'material' | 'palette' | 'lighting' | 'camera' | 'bloom' | 'full';
    id?: number | string;
    label?: string;
    details?: any;
}

export interface CentralRLStore {
    version: number;
    lastUpdated: number;
    totalLikes: number;
    totalDislikes: number;
    preferences: RLPreferences;
    likedCreations: LikedCreation[];
    dislikedCreations: DislikedCreation[];
    historyLog: RLActionLogEntry[];
}

const STORAGE_KEY_CENTRAL_STORE = 'flock_central_rl_store_v1';
const STORAGE_KEY_LIKES = 'flock_liked_creations';
const STORAGE_KEY_DISLIKES = 'flock_disliked_creations';
const STORAGE_KEY_PREFS_V3 = 'flock_rl_preferences_v3';
const STORAGE_KEY_PREFS_V2 = 'flock_rl_preferences_v2';
const STORAGE_KEY_LAST_STATE = 'flock_last_state';

// In-memory cache for ultra-fast, zero-overhead access inside render loops
let cachedCentralStore: CentralRLStore | null = null;
let cachedPrefs: RLPreferences | null = null;

// Multi-tab Real-time Broadcast Channel
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
        syncChannel = new BroadcastChannel('flock_rl_central_sync');
        syncChannel.onmessage = (event) => {
            if (event.data?.type === 'SYNC_RL_STORE' && event.data?.store) {
                cachedCentralStore = event.data.store;
                cachedPrefs = cachedCentralStore?.preferences || null;
                window.dispatchEvent(new CustomEvent('flock_rl_store_updated', { detail: cachedCentralStore }));
            }
        };
    } catch { }
}

function broadcastSync(store: CentralRLStore) {
    try {
        syncChannel?.postMessage({ type: 'SYNC_RL_STORE', store });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('flock_rl_store_updated', { detail: store }));
        }
    } catch { }
}

function createDefaultPreferences(): RLPreferences {
    return {
        formationLikes: { 16: 8, 28: 6 },
        formationDislikes: {},
        shapeLikes: {},
        shapeDislikes: {},
        materialLikes: { 6: 12, 8: 8, 0: 4, 3: 4 },
        materialDislikes: {},
        paletteLikes: {},
        paletteDislikes: {},
        lightingLikes: {},
        lightingDislikes: {},
        cameraLikes: {},
        cameraDislikes: {},
        totalLikes: 32,
        totalDislikes: 0,
        likedGenomes: []
    };
}

export function getCentralRLStore(): CentralRLStore {
    if (cachedCentralStore) return cachedCentralStore;

    try {
        const dataCentral = localStorage.getItem(STORAGE_KEY_CENTRAL_STORE);
        if (dataCentral) {
            cachedCentralStore = JSON.parse(dataCentral);
            cachedPrefs = cachedCentralStore!.preferences;
            return cachedCentralStore!;
        }

        // Migrate legacy separate keys into unified central store
        let legacyLikes: LikedCreation[] = [];
        try {
            const rawLikes = localStorage.getItem(STORAGE_KEY_LIKES);
            if (rawLikes) legacyLikes = JSON.parse(rawLikes);
        } catch { }

        let legacyDislikes: DislikedCreation[] = [];
        try {
            const rawDislikes = localStorage.getItem(STORAGE_KEY_DISLIKES);
            if (rawDislikes) legacyDislikes = JSON.parse(rawDislikes);
        } catch { }

        let legacyPrefs = createDefaultPreferences();
        try {
            const rawV3 = localStorage.getItem(STORAGE_KEY_PREFS_V3);
            if (rawV3) {
                legacyPrefs = { ...legacyPrefs, ...JSON.parse(rawV3) };
            } else {
                const rawV2 = localStorage.getItem(STORAGE_KEY_PREFS_V2);
                if (rawV2) legacyPrefs = { ...legacyPrefs, ...JSON.parse(rawV2) };
            }
        } catch { }

        cachedCentralStore = {
            version: 1,
            lastUpdated: Date.now(),
            totalLikes: legacyPrefs.totalLikes || 32,
            totalDislikes: legacyPrefs.totalDislikes || 0,
            preferences: legacyPrefs,
            likedCreations: legacyLikes,
            dislikedCreations: legacyDislikes,
            historyLog: []
        };

        saveCentralRLStore(cachedCentralStore);
        return cachedCentralStore;
    } catch {
        cachedCentralStore = {
            version: 1,
            lastUpdated: Date.now(),
            totalLikes: 32,
            totalDislikes: 0,
            preferences: createDefaultPreferences(),
            likedCreations: [],
            dislikedCreations: [],
            historyLog: []
        };
        return cachedCentralStore;
    }
}

export function saveCentralRLStore(store: CentralRLStore) {
    store.lastUpdated = Date.now();
    cachedCentralStore = store;
    cachedPrefs = store.preferences;

    try {
        const serialized = JSON.stringify(store);
        localStorage.setItem(STORAGE_KEY_CENTRAL_STORE, serialized);
        // Backwards compatibility mirrors for older components
        localStorage.setItem(STORAGE_KEY_PREFS_V3, JSON.stringify(store.preferences));
        localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(store.likedCreations));
        localStorage.setItem(STORAGE_KEY_DISLIKES, JSON.stringify(store.dislikedCreations));
    } catch { }

    broadcastSync(store);
}

export function recordRLAction(entry: Omit<RLActionLogEntry, 'timestamp'>) {
    const store = getCentralRLStore();
    const fullEntry: RLActionLogEntry = {
        ...entry,
        timestamp: Date.now()
    };
    store.historyLog.unshift(fullEntry);
    if (store.historyLog.length > 500) store.historyLog.length = 500; // Cap log history
    saveCentralRLStore(store);
}

export function exportCentralRLJSON(): string {
    const store = getCentralRLStore();
    return JSON.stringify(store, null, 2);
}

export function importCentralRLJSON(jsonString: string): boolean {
    try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== 'object' || !parsed.preferences) {
            return false;
        }
        const store: CentralRLStore = {
            version: parsed.version || 1,
            lastUpdated: Date.now(),
            totalLikes: parsed.totalLikes || parsed.preferences.totalLikes || 0,
            totalDislikes: parsed.totalDislikes || parsed.preferences.totalDislikes || 0,
            preferences: parsed.preferences,
            likedCreations: Array.isArray(parsed.likedCreations) ? parsed.likedCreations : [],
            dislikedCreations: Array.isArray(parsed.dislikedCreations) ? parsed.dislikedCreations : [],
            historyLog: Array.isArray(parsed.historyLog) ? parsed.historyLog : []
        };
        saveCentralRLStore(store);
        return true;
    } catch {
        return false;
    }
}

export function resetCentralRLStore(): CentralRLStore {
    const defaultStore: CentralRLStore = {
        version: 1,
        lastUpdated: Date.now(),
        totalLikes: 0,
        totalDislikes: 0,
        preferences: {
            formationLikes: {},
            formationDislikes: {},
            shapeLikes: {},
            shapeDislikes: {},
            materialLikes: {},
            materialDislikes: {},
            paletteLikes: {},
            paletteDislikes: {},
            lightingLikes: {},
            lightingDislikes: {},
            cameraLikes: {},
            cameraDislikes: {},
            totalLikes: 0,
            totalDislikes: 0,
            likedGenomes: []
        },
        likedCreations: [],
        dislikedCreations: [],
        historyLog: []
    };
    saveCentralRLStore(defaultStore);
    return defaultStore;
}

export function getLikedCreations(): LikedCreation[] {
    const store = getCentralRLStore();
    return store.likedCreations || [];
}

export function getDislikedCreations(): DislikedCreation[] {
    const store = getCentralRLStore();
    return store.dislikedCreations || [];
}

export function getRLPreferences(): RLPreferences {
    const store = getCentralRLStore();
    return store.preferences;
}

function persistPrefs(prefs: RLPreferences) {
    const store = getCentralRLStore();
    store.preferences = prefs;
    store.totalLikes = prefs.totalLikes;
    store.totalDislikes = prefs.totalDislikes;
    saveCentralRLStore(store);
}

// Granular Like/Dislike Functions per Aesthetic Dimension
export function likeDimension(dimension: 'formation' | 'shape' | 'material' | 'palette' | 'lighting' | 'camera' | 'bloom', id: number | string, label?: string): { totalLikes: number } {
    const store = getCentralRLStore();
    const prefs = store.preferences;
    prefs.totalLikes = (prefs.totalLikes || 0) + 1;
    store.totalLikes = prefs.totalLikes;

    switch (dimension) {
        case 'formation':
            prefs.formationLikes[Number(id)] = (prefs.formationLikes[Number(id)] || 0) + 1;
            break;
        case 'shape':
            prefs.shapeLikes[Number(id)] = (prefs.shapeLikes[Number(id)] || 0) + 1;
            break;
        case 'material':
            prefs.materialLikes[Number(id)] = (prefs.materialLikes[Number(id)] || 0) + 1;
            break;
        case 'palette':
            prefs.paletteLikes[Number(id)] = (prefs.paletteLikes[Number(id)] || 0) + 1;
            break;
        case 'lighting':
            prefs.lightingLikes[Number(id)] = (prefs.lightingLikes[Number(id)] || 0) + 1;
            break;
        case 'camera':
            prefs.cameraLikes[String(id)] = (prefs.cameraLikes[String(id)] || 0) + 1;
            break;
        case 'bloom':
            if (!prefs.bloomLikes) prefs.bloomLikes = {};
            prefs.bloomLikes[Number(id)] = (prefs.bloomLikes[Number(id)] || 0) + 1;
            break;
    }

    recordRLAction({
        action: 'like',
        dimension,
        id,
        label
    });

    return { totalLikes: prefs.totalLikes };
}

export function dislikeDimension(dimension: 'formation' | 'shape' | 'material' | 'palette' | 'lighting' | 'camera' | 'bloom', id: number | string, label?: string): { totalDislikes: number } {
    const store = getCentralRLStore();
    const prefs = store.preferences;
    prefs.totalDislikes = (prefs.totalDislikes || 0) + 1;
    store.totalDislikes = prefs.totalDislikes;

    switch (dimension) {
        case 'formation':
            prefs.formationDislikes[Number(id)] = (prefs.formationDislikes[Number(id)] || 0) + 1;
            break;
        case 'shape':
            prefs.shapeDislikes[Number(id)] = (prefs.shapeDislikes[Number(id)] || 0) + 1;
            break;
        case 'material':
            prefs.materialDislikes[Number(id)] = (prefs.materialDislikes[Number(id)] || 0) + 1;
            break;
        case 'palette':
            prefs.paletteDislikes[Number(id)] = (prefs.paletteDislikes[Number(id)] || 0) + 1;
            break;
        case 'lighting':
            prefs.lightingDislikes[Number(id)] = (prefs.lightingDislikes[Number(id)] || 0) + 1;
            break;
        case 'camera':
            prefs.cameraDislikes[String(id)] = (prefs.cameraDislikes[String(id)] || 0) + 1;
            break;
        case 'bloom':
            if (!prefs.bloomDislikes) prefs.bloomDislikes = {};
            prefs.bloomDislikes[Number(id)] = (prefs.bloomDislikes[Number(id)] || 0) + 1;
            break;
    }

    recordRLAction({
        action: 'dislike',
        dimension,
        id,
        label
    });

    return { totalDislikes: prefs.totalDislikes };
}

export interface CompositionStateSnapshot {
    formationMode: number;
    formationLabel?: string;
    boidShape: number;
    shapeLabel?: string;
    materialPreset: number;
    materialLabel?: string;
    paletteIndex?: number;
    lightingProfileIndex?: number;
    cameraPresetIndex?: number;
    colors?: string[];
    genome?: ProceduralGenome;
}

export function likeCompositionCombination(comp: CompositionStateSnapshot): { totalLikes: number } {
    const store = getCentralRLStore();
    const prefs = store.preferences;

    // Harmoniously weight all active traits as a winning combination synergy (+2 each)
    prefs.formationLikes[comp.formationMode] = (prefs.formationLikes[comp.formationMode] || 0) + 2;
    prefs.shapeLikes[comp.boidShape] = (prefs.shapeLikes[comp.boidShape] || 0) + 2;
    prefs.materialLikes[comp.materialPreset] = (prefs.materialLikes[comp.materialPreset] || 0) + 2;
    if (comp.paletteIndex !== undefined) {
        prefs.paletteLikes[comp.paletteIndex] = (prefs.paletteLikes[comp.paletteIndex] || 0) + 2;
    }
    if (comp.lightingProfileIndex !== undefined) {
        prefs.lightingLikes[comp.lightingProfileIndex] = (prefs.lightingLikes[comp.lightingProfileIndex] || 0) + 2;
    }
    if (comp.cameraPresetIndex !== undefined) {
        prefs.cameraLikes[String(comp.cameraPresetIndex)] = (prefs.cameraLikes[String(comp.cameraPresetIndex)] || 0) + 2;
    }

    prefs.totalLikes = (prefs.totalLikes || 0) + 1;
    store.totalLikes = prefs.totalLikes;

    if (comp.genome) {
        prefs.likedGenomes.push(comp.genome);
        if (prefs.likedGenomes.length > 30) prefs.likedGenomes.shift();
    }

    recordRLAction({
        action: 'like',
        dimension: 'full',
        id: `${comp.formationMode}_${comp.materialPreset}_${comp.paletteIndex ?? 0}`,
        label: `✨ Combination: ${comp.formationLabel || 'Topology'} + ${comp.materialLabel || 'Material'}`,
        details: comp
    });

    return { totalLikes: prefs.totalLikes };
}

export function dislikeCompositionCombination(comp: CompositionStateSnapshot): { totalDislikes: number } {
    const store = getCentralRLStore();
    const prefs = store.preferences;

    prefs.formationDislikes[comp.formationMode] = (prefs.formationDislikes[comp.formationMode] || 0) + 1;
    prefs.shapeDislikes[comp.boidShape] = (prefs.shapeDislikes[comp.boidShape] || 0) + 1;
    prefs.materialDislikes[comp.materialPreset] = (prefs.materialDislikes[comp.materialPreset] || 0) + 1;
    if (comp.paletteIndex !== undefined) {
        prefs.paletteDislikes[comp.paletteIndex] = (prefs.paletteDislikes[comp.paletteIndex] || 0) + 1;
    }
    if (comp.lightingProfileIndex !== undefined) {
        prefs.lightingDislikes[comp.lightingProfileIndex] = (prefs.lightingDislikes[comp.lightingProfileIndex] || 0) + 1;
    }
    if (comp.cameraPresetIndex !== undefined) {
        prefs.cameraDislikes[String(comp.cameraPresetIndex)] = (prefs.cameraDislikes[String(comp.cameraPresetIndex)] || 0) + 1;
    }

    prefs.totalDislikes = (prefs.totalDislikes || 0) + 1;
    store.totalDislikes = prefs.totalDislikes;

    recordRLAction({
        action: 'dislike',
        dimension: 'full',
        id: `${comp.formationMode}_${comp.materialPreset}_${comp.paletteIndex ?? 0}`,
        label: `Combination Dislike: ${comp.formationLabel || 'Topology'} + ${comp.materialLabel || 'Material'}`,
        details: comp
    });

    return { totalDislikes: prefs.totalDislikes };
}

export function saveLikedCreation(creation: LikedCreation): { isNew: boolean; totalLikes: number; totalDislikes: number } {
    const store = getCentralRLStore();
    const likes = store.likedCreations;
    const prefs = store.preferences;

    const existingIndex = likes.findIndex(
        l => l.formationMode === creation.formationMode &&
             l.boidShape === creation.boidShape &&
             l.materialPreset === creation.materialPreset
    );

    let isNew = false;
    if (existingIndex === -1) {
        likes.unshift(creation);
        if (likes.length > 100) likes.length = 100;
        isNew = true;

        // Heavily weight whole-setup saves (+3 RL points each) to train future AI generations
        prefs.formationLikes[creation.formationMode] = (prefs.formationLikes[creation.formationMode] || 0) + 3;
        prefs.shapeLikes[creation.boidShape] = (prefs.shapeLikes[creation.boidShape] || 0) + 3;
        prefs.materialLikes[creation.materialPreset] = (prefs.materialLikes[creation.materialPreset] || 0) + 3;
        if (creation.paletteIndex !== undefined) {
            prefs.paletteLikes[creation.paletteIndex] = (prefs.paletteLikes[creation.paletteIndex] || 0) + 3;
        }
        if (creation.lightingProfileIndex !== undefined) {
            prefs.lightingLikes[creation.lightingProfileIndex] = (prefs.lightingLikes[creation.lightingProfileIndex] || 0) + 3;
        }
        if (creation.cameraPresetIndex !== undefined) {
            prefs.cameraLikes[String(creation.cameraPresetIndex)] = (prefs.cameraLikes[String(creation.cameraPresetIndex)] || 0) + 3;
        }
        prefs.totalLikes = (prefs.totalLikes || 0) + 3;
        store.totalLikes = prefs.totalLikes;

        if (creation.genome) {
            prefs.likedGenomes.push(creation.genome);
            if (prefs.likedGenomes.length > 30) prefs.likedGenomes.shift();
        }

        recordRLAction({
            action: 'save',
            dimension: 'full',
            id: creation.id,
            label: `${creation.formationLabel} • ${creation.materialLabel}`,
            details: creation
        });
    }

    return { isNew, totalLikes: prefs.totalLikes, totalDislikes: prefs.totalDislikes || 0 };
}

export function saveDislikedCreation(dislike: DislikedCreation): { isNew: boolean; totalLikes: number; totalDislikes: number } {
    const store = getCentralRLStore();
    const dislikes = store.dislikedCreations;
    const prefs = store.preferences;

    const existingIndex = dislikes.findIndex(
        d => d.formationMode === dislike.formationMode &&
             d.boidShape === dislike.boidShape &&
             d.materialPreset === dislike.materialPreset
    );

    let isNew = false;
    if (existingIndex === -1) {
        dislikes.unshift(dislike);
        if (dislikes.length > 100) dislikes.length = 100;
        isNew = true;

        prefs.formationDislikes[dislike.formationMode] = (prefs.formationDislikes[dislike.formationMode] || 0) + 1;
        prefs.shapeDislikes[dislike.boidShape] = (prefs.shapeDislikes[dislike.boidShape] || 0) + 1;
        prefs.materialDislikes[dislike.materialPreset] = (prefs.materialDislikes[dislike.materialPreset] || 0) + 1;
        if (dislike.paletteIndex !== undefined) {
            prefs.paletteDislikes[dislike.paletteIndex] = (prefs.paletteDislikes[dislike.paletteIndex] || 0) + 1;
        }
        if (dislike.lightingProfileIndex !== undefined) {
            prefs.lightingDislikes[dislike.lightingProfileIndex] = (prefs.lightingDislikes[dislike.lightingProfileIndex] || 0) + 1;
        }
        prefs.totalDislikes = (prefs.totalDislikes || 0) + 1;
        store.totalDislikes = prefs.totalDislikes;

        recordRLAction({
            action: 'dislike',
            dimension: 'full',
            id: dislike.id,
            details: dislike
        });
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

// Session Resumption State (Last active aesthetic configuration)
export function saveLastState(state: PersistedLastState) {
    try {
        localStorage.setItem(STORAGE_KEY_LAST_STATE, JSON.stringify(state));
    } catch { }
}

export function getLastState(): PersistedLastState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_LAST_STATE);
        if (!raw) return null;
        const parsed: PersistedLastState = JSON.parse(raw);
        // If state is older than 7 days, start fresh
        if (Date.now() - (parsed.savedAt || 0) > 7 * 24 * 60 * 60 * 1000) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

// 5 Curated Organic Aesthetic Symphony Suites
export const HARMONIC_FORMATION_SUITES: FormationMode[][] = [
    // Suite 1: Ocean Aerodynamics & Sovereign Flight
    [
        FormationMode.MurmurationFlow,    // Starling Murmuration (42)
        FormationMode.StarPolygon,        // Manta Ray Glide (37)
        FormationMode.PhoenixWings,       // Phoenix Wings (6)
        FormationMode.JellyfishPulse,     // Jellyfish Veil (4)
        FormationMode.OuroborosSerpent,   // Ouroboros Dragon (43)
        FormationMode.DancingRibbon,      // Dancing Ribbon (44)
        FormationMode.NautilusShell,      // Nautilus Spiral (12)
        FormationMode.Serpent,            // Serpent Stream (0)
        FormationMode.TsunamiWave         // Tsunami Wave (18)
    ],
    // Suite 2: Aurora & Celestial Luminescence
    [
        FormationMode.WireCube,           // Aurora Borealis Curtain (31)
        FormationMode.Spiral,             // Galactic Spiral (1)
        FormationMode.FerrisWheel,        // Galaxy Vortex (27)
        FormationMode.NebulaCloud,        // Cosmic Nebula (29)
        FormationMode.SaturnRings,        // Saturn Rings (16)
        FormationMode.BlackHoleJet,       // Celestial Vortex (7)
        FormationMode.SupernovaBurst,     // Supernova Nebula (19)
        FormationMode.BigBangExpansion,   // Cosmic Expansion (39)
        FormationMode.AlienMothership     // Cosmic Disk (25)
    ],
    // Suite 3: Sacred Botanical & Living Growth
    [
        FormationMode.VirusCapsid,        // Lotus Bloom (21)
        FormationMode.CoralReef,          // Coral Fan (23)
        FormationMode.BioMushroom,        // Bio Mushroom (13)
        FormationMode.BeehiveSwarm,       // Kelp Forest (14)
        FormationMode.TreeBranch,         // Tree of Life (32)
        FormationMode.RiverDelta,         // River Delta (34)
        FormationMode.PulsingHeart,       // Pulsing Heart (17)
        FormationMode.SpiderWeb           // Dewdrop Web (28)
    ],
    // Suite 4: Resonant Harmonic Manifolds & Sacred Geometry
    [
        FormationMode.DoubleHelix,        // Double Helix (2)
        FormationMode.TorusKnot,          // Torus Knot Stream (3)
        FormationMode.TrefoilKnot,        // Trefoil Harmonics (41)
        FormationMode.CalabiYauManifold,  // Calabi-Yau Bloom (45)
        FormationMode.HopfFibration,      // Hopf Fiber Bundle (46)
        FormationMode.LorenzAttractor,    // Lorenz Butterfly (47)
        FormationMode.GyroidMinimalSurface,// Gyroid Flow (48)
        FormationMode.CliffordTorus,      // Clifford Torus (50)
        FormationMode.KleinBottle4D,      // Klein Bottle Loop (49)
        FormationMode.TripleHelix,        // Triple Helix (26)
        FormationMode.LissajousKnot,      // Lissajous Ribbon (9)
        FormationMode.HourglassVortex,    // Hyperboloid Vortex (8)
        FormationMode.QuantumAtom,        // Orbital Resonance (5)
        FormationMode.CrystalPrism,       // Mobius Ribbon (20)
        FormationMode.DNALadder,          // Braided Stream (36)
        FormationMode.KelvinHelmholtz,    // Kelvin-Helmholtz Billows (35)
        FormationMode.CollapsingSphere,   // Singularity Breath (38)
        FormationMode.GeologicStrata      // Laminar Wave Sheets (40)
    ],
    // Suite 5: Infinite Algorithmic DNA
    [
        FormationMode.Procedural          // Infinite Procedural (30)
    ],
    // Suite 6: Intertwined Multi-Helix & Topological Knots / Braids
    [
        FormationMode.QuadHelixBraid,
        FormationMode.ConcentricDualHelixSheath,
        FormationMode.CaduceusVortex,
        FormationMode.ToroidalHelixBraid,
        FormationMode.TrefoilBraidedRibbon,
        FormationMode.HexaHelixVortexTower,
        FormationMode.MobiusHelixBraid,
        FormationMode.LissajousIntertwinedKnot,
        FormationMode.BorromeanRings,
        FormationMode.FigureEightKnot,
        FormationMode.CinqfoilKnot,
        FormationMode.SeptafoilKnot,
        FormationMode.OlympicChainLink,
        FormationMode.TriquetraCelticBraid,
        FormationMode.SolarFlareProminence,
        FormationMode.WhiteheadLink,
        FormationMode.QuatrefoilKnotBraid,
        FormationMode.GrannyKnotBraid
    ]
];

// Harmonic Curated Symphony Sequencer (Eliminates disjointed "dice-roll" jumps)
export function sampleHarmonicFormation(
    currentMode: number,
    prefs: RLPreferences,
    excludeList: number[] = []
): number {
    const likeCounts = prefs.formationLikes || {};
    const dislikeCounts = prefs.formationDislikes || {};

    // 1. Find which harmonic suite the current formation belongs to
    let currentSuiteIdx = 0;
    let indexInSuite = 0;
    for (let sIdx = 0; sIdx < HARMONIC_FORMATION_SUITES.length; sIdx++) {
        const suite = HARMONIC_FORMATION_SUITES[sIdx];
        const found = suite.indexOf(currentMode as FormationMode);
        if (found !== -1) {
            currentSuiteIdx = sIdx;
            indexInSuite = found;
            break;
        }
    }

    const currentSuite = HARMONIC_FORMATION_SUITES[currentSuiteIdx];

    // 2. Build candidate pool prioritized by:
    // a) Next organic form within current suite (smooth thematic continuity)
    // b) Aesthetically complementary sister suite
    const suiteCandidates: number[] = [];

    // Look ahead in current suite
    for (let offset = 1; offset < currentSuite.length; offset++) {
        const nextId = currentSuite[(indexInSuite + offset) % currentSuite.length];
        const likes = likeCounts[nextId] || 0;
        const dislikes = dislikeCounts[nextId] || 0;
        if (dislikes > likes) continue; // Hard blacklist disliked items
        if (excludeList.includes(nextId)) continue;
        suiteCandidates.push(nextId);
    }

    // Look in adjacent harmonic sister suite (30% chance to evolve to next theme suite)
    const nextSuiteIdx = (currentSuiteIdx + 1) % HARMONIC_FORMATION_SUITES.length;
    const nextSuite = HARMONIC_FORMATION_SUITES[nextSuiteIdx];
    const sisterCandidates: number[] = [];
    for (const id of nextSuite) {
        const likes = likeCounts[id] || 0;
        const dislikes = dislikeCounts[id] || 0;
        if (dislikes > likes) continue;
        if (excludeList.includes(id)) continue;
        sisterCandidates.push(id);
    }

    // 3. Score candidates with RL feedback
    const pool = (Math.random() < 0.65 && suiteCandidates.length > 0)
        ? suiteCandidates
        : (sisterCandidates.length > 0 ? sisterCandidates : suiteCandidates);

    if (pool.length === 0) {
        // Fallback to global valid pool with strict dislike filter
        return sampleRLAttribute(51, likeCounts, dislikeCounts, prefs.totalLikes, prefs.totalDislikes, excludeList);
    }

    // Weighted selection inside harmonious pool
    let totalWeight = 0;
    const scored: { id: number; weight: number }[] = [];
    for (const id of pool) {
        const likes = likeCounts[id] || 0;
        const dislikes = dislikeCounts[id] || 0;
        const netScore = Math.max(0, likes - dislikes);
        const weight = Math.min(15.0, Math.pow(netScore + 1, 1.4));
        scored.push({ id, weight });
        totalWeight += weight;
    }

    let rnd = Math.random() * totalWeight;
    for (const item of scored) {
        if (rnd < item.weight) return item.id;
        rnd -= item.weight;
    }

    return pool[0];
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

// Procedural DNA Genome Synthesis across 3 Distinct Math Families
export function generateProceduralGenome(): ProceduralGenome {
    const prefs = getRLPreferences();
    const likedGenomes = prefs.likedGenomes || [];

    const rndInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
    const rndFloat = (min: number, max: number) => min + Math.random() * (max - min);

    // Randomly pick one of 3 distinct genome families: Fourier, Superformula, Branching
    const families: ('harmonic' | 'superformula' | 'branching')[] = ['harmonic', 'superformula', 'branching'];
    const family = families[Math.floor(Math.random() * families.length)];

    // 25% Surprise Wildcard Mutation
    const isSurpriseWildcard = Math.random() < 0.25;

    if (!isSurpriseWildcard && likedGenomes.length > 0 && Math.random() < 0.70) {
        const parentA = likedGenomes[Math.floor(Math.random() * likedGenomes.length)];
        const parentB = likedGenomes[Math.floor(Math.random() * likedGenomes.length)];

        const rndMutate = (v: number, scale = 0.2) => v + (Math.random() * 2 - 1) * scale;

        return {
            family: parentA.family || family,
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
            phi3: (parentA.phi3 + parentB.phi3) / 2 + Math.random() * 0.5,
            m: parentA.m,
            n1: parentA.n1,
            n2: parentA.n2,
            n3: parentA.n3
        };
    }

    return {
        family,
        k1: rndInt(1, 8),
        k2: rndInt(1, 8),
        k3: rndInt(1, 8),
        k4: rndInt(1, 8),
        k5: rndInt(1, 8),
        k6: rndInt(1, 8),
        k7: rndInt(1, 8),
        k8: rndInt(1, 8),
        r1: rndFloat(4.0, 16.0),
        r2: rndFloat(4.0, 16.0),
        r3: rndFloat(4.0, 16.0),
        a1: rndFloat(1.0, 8.0),
        a2: rndFloat(1.0, 8.0),
        a3: rndFloat(1.0, 8.0),
        phi1: rndFloat(0, Math.PI * 2),
        phi2: rndFloat(0, Math.PI * 2),
        phi3: rndFloat(0, Math.PI * 2),
        // Superformula parameters
        m: rndInt(3, 12),
        n1: rndFloat(0.2, 5.0),
        n2: rndFloat(0.2, 5.0),
        n3: rndFloat(0.2, 5.0),
        a: 1.0,
        b: 1.0
    };
}

// 8 Built-in Emotional Arcs (Narrative sequence of thematic formations)
export interface EmotionalArc {
    name: string;
    description: string;
    modes: FormationMode[];
}

export const EMOTIONAL_ARCS: EmotionalArc[] = [
    {
        name: 'Chaos to Order',
        description: 'From free dynamic murmuration into structured geometric lattice',
        modes: [FormationMode.MurmurationFlow, FormationMode.SpiderWeb, FormationMode.GeologicStrata]
    },
    {
        name: 'Birth & Cosmic Expansion',
        description: 'From central singularity into shockwave burst and nebula dust',
        modes: [FormationMode.BigBangExpansion, FormationMode.SupernovaBurst, FormationMode.NebulaCloud]
    },
    {
        name: 'Organic Biome Growth',
        description: 'From rooted forest tree to deep coral reef and fungal mushroom',
        modes: [FormationMode.TreeBranch, FormationMode.CoralReef, FormationMode.BioMushroom]
    },
    {
        name: 'Crystalline Synthesis',
        description: 'Imploding into diamond prism and multi-faceted platonic polyhedron',
        modes: [FormationMode.CollapsingSphere, FormationMode.StarPolygon, FormationMode.WireCube]
    },
    {
        name: 'Storm & Celestial Calm',
        description: 'Fractal lightning bolt crashing into ocean wave and settling into planetary rings',
        modes: [FormationMode.LightningBolt, FormationMode.TsunamiWave, FormationMode.SaturnRings]
    },
    {
        name: 'Fluid Kinetic Architecture',
        description: 'Rolling shear wave vortices evolving into dancing ribbons and trefoil knot',
        modes: [FormationMode.KelvinHelmholtz, FormationMode.DancingRibbon, FormationMode.TrefoilKnot]
    },
    {
        name: 'Molecular Genetics',
        description: 'Linear DNA ladder morphing into rotating double helix and quantum orbital',
        modes: [FormationMode.DNALadder, FormationMode.DoubleHelix, FormationMode.QuantumAtom]
    },
    {
        name: 'Digital Hyper-Geometry',
        description: 'Clean wireframe cube unfolding into 4D tesseract and star prism',
        modes: [FormationMode.WireCube, FormationMode.Tesseract4D, FormationMode.StarPolygon]
    },
    {
        name: 'Topological Links & Knots',
        description: 'Orthogonal Borromean rings weaving into figure-eight prime knot and Celtic triquetra braid',
        modes: [FormationMode.BorromeanRings, FormationMode.FigureEightKnot, FormationMode.TriquetraCelticBraid]
    },
    {
        name: 'Helical Pagoda Architecture',
        description: 'Multi-tiered quad helix morphing into concentric sheath and soaring hexa-helix vortex tower',
        modes: [FormationMode.QuadHelixBraid, FormationMode.ConcentricDualHelixSheath, FormationMode.HexaHelixVortexTower]
    }
];

export function getRandomEmotionalArc(): EmotionalArc {
    return EMOTIONAL_ARCS[Math.floor(Math.random() * EMOTIONAL_ARCS.length)];
}

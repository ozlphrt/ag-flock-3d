import React, { useState } from 'react';

export interface BloomSettings {
    luminanceThreshold: number;
    radius: number;
    intensity: number;
    levels: number;
}

export interface BloomPreset {
    id: number;
    label: string;
    icon: string;
    desc: string;
    settings: BloomSettings;
}

export const BLOOM_PRESETS: BloomPreset[] = [
    {
        id: 0,
        label: 'Diamond Facet Sparkle',
        icon: '💎',
        desc: 'Sharp specular glints from crystalline facets with deep background contrast',
        settings: { luminanceThreshold: 0.65, radius: 0.35, intensity: 0.85, levels: 3 }
    },
    {
        id: 1,
        label: 'Razor Anamorphic Star',
        icon: '⚡',
        desc: 'Focused optical bloom burst strictly bounded to glint peaks',
        settings: { luminanceThreshold: 0.70, radius: 0.30, intensity: 0.95, levels: 3 }
    },
    {
        id: 2,
        label: 'Stellar Supernova Burst',
        icon: '🌟',
        desc: 'Radiant coronal glow with deep shadow contrast',
        settings: { luminanceThreshold: 0.60, radius: 0.40, intensity: 0.90, levels: 3 }
    },
    {
        id: 3,
        label: 'High-Carat Prism Gleam',
        icon: '✨',
        desc: 'Prismatic dispersion glints around triangular polyhedra',
        settings: { luminanceThreshold: 0.65, radius: 0.35, intensity: 0.80, levels: 3 }
    },
    {
        id: 4,
        label: 'Solar Flare Specular',
        icon: '☀️',
        desc: 'Warm optical corona highlights along the swarm flow',
        settings: { luminanceThreshold: 0.62, radius: 0.38, intensity: 0.85, levels: 3 }
    },
    {
        id: 5,
        label: 'Crystalline Laser Flash',
        icon: '🔮',
        desc: 'Vibrant optical bloom radiance on leading geometry edges',
        settings: { luminanceThreshold: 0.72, radius: 0.28, intensity: 1.05, levels: 3 }
    },
    {
        id: 6,
        label: 'Champagne Gold Mirror',
        icon: '🏆',
        desc: 'Warm golden optical sheen on metallic polyhedra',
        settings: { luminanceThreshold: 0.65, radius: 0.35, intensity: 0.80, levels: 3 }
    },
    {
        id: 7,
        label: 'Cryo-Platinum Glint',
        icon: '❄️',
        desc: 'Ice-cold luminous platinum specular flashes',
        settings: { luminanceThreshold: 0.68, radius: 0.32, intensity: 0.90, levels: 3 }
    },
    {
        id: 8,
        label: 'Obsidian Edge Flash',
        icon: '🖤',
        desc: 'Deep black stealth boids with piercing silhouette bloom',
        settings: { luminanceThreshold: 0.72, radius: 0.28, intensity: 1.00, levels: 3 }
    },
    {
        id: 9,
        label: 'Cyber Neon Radiant',
        icon: '🛸',
        desc: 'Vibrant neon optical halo with deep background contrast',
        settings: { luminanceThreshold: 0.60, radius: 0.40, intensity: 0.85, levels: 3 }
    },
    {
        id: 10,
        label: 'Quantum Pulsar Spark',
        icon: '💫',
        desc: 'High-frequency optical bloom with smooth atmospheric falloff',
        settings: { luminanceThreshold: 0.66, radius: 0.35, intensity: 0.90, levels: 3 }
    },
    {
        id: 11,
        label: 'Polished Chrome Rim',
        icon: '🛡️',
        desc: 'Bright metallic rim glow highlighting aerodynamic facets',
        settings: { luminanceThreshold: 0.65, radius: 0.35, intensity: 0.80, levels: 3 }
    },
    {
        id: 12,
        label: 'Hyper-Velocity Arc',
        icon: '⚡',
        desc: 'High-energy electrical arc bloom bursts with smooth roll-off',
        settings: { luminanceThreshold: 0.70, radius: 0.30, intensity: 1.10, levels: 3 }
    },
    {
        id: 13,
        label: 'Saturn Dust Speckles',
        icon: '🪐',
        desc: 'Smooth luminous dust aura across orbital rings',
        settings: { luminanceThreshold: 0.62, radius: 0.35, intensity: 0.75, levels: 3 }
    },
    {
        id: 14,
        label: 'Emerald Prism Sheen',
        icon: '💎',
        desc: 'Rich jewel-toned optical bloom with deep shadow contrast',
        settings: { luminanceThreshold: 0.60, radius: 0.38, intensity: 0.85, levels: 3 }
    },
    {
        id: 15,
        label: 'Fireworks Pinpoint Glints',
        icon: '🎆',
        desc: 'Dazzling starburst optical flares along the ribbon trajectory',
        settings: { luminanceThreshold: 0.72, radius: 0.28, intensity: 1.05, levels: 3 }
    },
    {
        id: 16,
        label: 'Optical Calcite Refraction',
        icon: '🔮',
        desc: 'Double-refraction geometric optical glow with sharp facet edges',
        settings: { luminanceThreshold: 0.65, radius: 0.32, intensity: 0.85, levels: 3 }
    },
    {
        id: 17,
        label: 'Deep Void Bioluminescence',
        icon: '🌊',
        desc: 'Luminescent deep-ocean glow on pitch-black void',
        settings: { luminanceThreshold: 0.58, radius: 0.45, intensity: 0.80, levels: 3 }
    },
    {
        id: 18,
        label: 'Golden Hour Silhouette',
        icon: '🌅',
        desc: 'Steep rake optical sheen with golden facet rim lighting',
        settings: { luminanceThreshold: 0.64, radius: 0.35, intensity: 0.82, levels: 3 }
    },
    {
        id: 19,
        label: 'Filament Bio-Sparks',
        icon: '🧬',
        desc: 'Braided macromolecule nodes with luminous highlight beads',
        settings: { luminanceThreshold: 0.65, radius: 0.35, intensity: 0.85, levels: 3 }
    },
    {
        id: 20,
        label: 'HDR Studio Specular',
        icon: '📸',
        desc: 'Clean 70-degree cross-side studio reflection bloom',
        settings: { luminanceThreshold: 0.68, radius: 0.30, intensity: 0.75, levels: 3 }
    },
    {
        id: 21,
        label: 'Super-Intense Laser Sparkle',
        icon: '💥',
        desc: 'High optical brilliance strictly bounded to glint peaks',
        settings: { luminanceThreshold: 0.75, radius: 0.25, intensity: 1.25, levels: 3 }
    },
    {
        id: 22,
        label: 'Subtle Micro-Sheen',
        icon: '✨',
        desc: 'Gentle, refined optical highlights with smooth falloff',
        settings: { luminanceThreshold: 0.70, radius: 0.28, intensity: 0.65, levels: 3 }
    },
    {
        id: 23,
        label: 'Zero Bloom Pristine',
        icon: '🚫',
        desc: 'Completely disables post-processing glow for 100% raw unblurred geometry',
        settings: { luminanceThreshold: 1.0, radius: 0.0, intensity: 0.0, levels: 1 }
    }
];

export function BloomControlPanel({
    settings,
    onChange,
    currentPresetId,
    onSelectPreset
}: {
    settings: BloomSettings;
    onChange: (settings: BloomSettings) => void;
    currentPresetId?: number;
    onSelectPreset?: (preset: BloomPreset) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    const resetDefaults = () => {
        onChange({
            luminanceThreshold: 0.90,
            radius: 0.10,
            intensity: 2.20,
            levels: 2
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '72px',
                left: '20px',
                zIndex: 1001,
                background: 'rgba(10, 16, 30, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '12px',
                padding: collapsed ? '8px 14px' : '16px 18px',
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                width: collapsed ? 'auto' : '300px',
                maxHeight: '80vh',
                overflowY: 'auto',
                userSelect: 'none'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: collapsed ? 0 : '12px',
                    cursor: 'pointer'
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>✨</span>
                    <span style={{ fontWeight: 800, letterSpacing: '0.5px', color: '#00ffcc', fontSize: '12px' }}>
                        OPTICAL BLOOM TUNER
                    </span>
                </div>
                <button
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700
                    }}
                >
                    {collapsed ? '▲ Expand' : '▼ Minimize'}
                </button>
            </div>

            {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Quick Preset Selector */}
                    {onSelectPreset && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                PRESET QUICK-LOAD (24 PRESETS)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxHeight: '110px', overflowY: 'auto', paddingRight: '4px' }}>
                                {BLOOM_PRESETS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => onSelectPreset(p)}
                                        style={{
                                            background: currentPresetId === p.id ? 'rgba(0, 255, 204, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                                            border: currentPresetId === p.id ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            padding: '4px 6px',
                                            color: currentPresetId === p.id ? '#00ffcc' : '#ffffff',
                                            cursor: 'pointer',
                                            fontSize: '10px',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                        title={p.desc}
                                    >
                                        <span>{p.icon}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 1. Luminance Threshold */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Cutoff Threshold:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00ffcc' }}>
                                {settings.luminanceThreshold.toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.00"
                            max="1.50"
                            step="0.01"
                            value={settings.luminanceThreshold}
                            onChange={e => onChange({ ...settings, luminanceThreshold: parseFloat(e.target.value) })}
                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                        />
                        <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.45)' }}>
                            {settings.luminanceThreshold >= 0.88 ? '💎 Crisp Sparkles (No Background Fog)' : '⚠️ Low Threshold (May Add Milky Haze)'}
                        </div>
                    </div>

                    {/* 2. Radius */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Glow Radius:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00ffcc' }}>
                                {settings.radius.toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.00"
                            max="1.50"
                            step="0.01"
                            value={settings.radius}
                            onChange={e => onChange({ ...settings, radius: parseFloat(e.target.value) })}
                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                        />
                    </div>

                    {/* 3. Intensity */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Glint Intensity:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00ffcc' }}>
                                {settings.intensity.toFixed(2)}x
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.00"
                            max="5.00"
                            step="0.05"
                            value={settings.intensity}
                            onChange={e => onChange({ ...settings, intensity: parseFloat(e.target.value) })}
                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                        />
                    </div>

                    {/* 4. Levels */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>Blur Pass Levels:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00ffcc' }}>
                                {settings.levels}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="8"
                            step="1"
                            value={settings.levels}
                            onChange={e => onChange({ ...settings, levels: parseInt(e.target.value, 10) })}
                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                        />
                    </div>

                    {/* Reset Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                            onClick={resetDefaults}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: 700
                            }}
                        >
                            Reset Defaults
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

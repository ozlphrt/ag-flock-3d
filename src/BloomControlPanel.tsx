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
        desc: 'Pin-sharp high-intensity glints from mirror facets with zero background fog',
        settings: { luminanceThreshold: 0.90, radius: 0.10, intensity: 2.20, levels: 2 }
    },
    {
        id: 1,
        label: 'Razor Anamorphic Star',
        icon: '⚡',
        desc: 'Ultra-focused laser specular bursts with razor-sharp definition',
        settings: { luminanceThreshold: 0.94, radius: 0.08, intensity: 2.80, levels: 2 }
    },
    {
        id: 2,
        label: 'Stellar Supernova Burst',
        icon: '🌟',
        desc: 'Blinding stellar core flares with high contrast and dark velvet space',
        settings: { luminanceThreshold: 0.88, radius: 0.16, intensity: 2.50, levels: 3 }
    },
    {
        id: 3,
        label: 'High-Carat Prism Gleam',
        icon: '✨',
        desc: 'High refractive dispersion on triangular polyhedra with crisp edges',
        settings: { luminanceThreshold: 0.92, radius: 0.12, intensity: 2.60, levels: 2 }
    },
    {
        id: 4,
        label: 'Solar Flare Specular',
        icon: '☀️',
        desc: 'High-energy coronal highlights strictly on leading facet ridges',
        settings: { luminanceThreshold: 0.86, radius: 0.18, intensity: 2.10, levels: 3 }
    },
    {
        id: 5,
        label: 'Crystalline Laser Flash',
        icon: '🔮',
        desc: 'Instantaneous diamond edge flashes with zero body opacity',
        settings: { luminanceThreshold: 0.96, radius: 0.06, intensity: 3.40, levels: 2 }
    },
    {
        id: 6,
        label: 'Champagne Gold Mirror',
        icon: '🏆',
        desc: 'Warm golden specular flashes on metallic polyhedra',
        settings: { luminanceThreshold: 0.89, radius: 0.14, intensity: 2.25, levels: 2 }
    },
    {
        id: 7,
        label: 'Cryo-Platinum Glint',
        icon: '❄️',
        desc: 'Ice-cold razor-sharp platinum specular flashes',
        settings: { luminanceThreshold: 0.93, radius: 0.09, intensity: 2.70, levels: 2 }
    },
    {
        id: 8,
        label: 'Obsidian Edge Flash',
        icon: '🖤',
        desc: 'Deep black stealth boids with piercing chrome silhouette flashes',
        settings: { luminanceThreshold: 0.95, radius: 0.07, intensity: 3.20, levels: 2 }
    },
    {
        id: 9,
        label: 'Cyber Neon Radiant',
        icon: '🛸',
        desc: 'Vibrant neon specular streaks with deep background contrast',
        settings: { luminanceThreshold: 0.87, radius: 0.15, intensity: 2.30, levels: 3 }
    },
    {
        id: 10,
        label: 'Quantum Pulsar Spark',
        icon: '💫',
        desc: 'High-frequency pulsing glints with needle-thin halo',
        settings: { luminanceThreshold: 0.91, radius: 0.11, intensity: 2.90, levels: 2 }
    },
    {
        id: 11,
        label: 'Polished Chrome Rim',
        icon: '🛡️',
        desc: 'Bright metallic rim reflections highlighting aerodynamic wing blades',
        settings: { luminanceThreshold: 0.90, radius: 0.13, intensity: 2.40, levels: 2 }
    },
    {
        id: 12,
        label: 'Hyper-Velocity Arc',
        icon: '⚡',
        desc: 'Blinding electrical arc bursts with instantaneous falloff',
        settings: { luminanceThreshold: 0.97, radius: 0.05, intensity: 3.80, levels: 2 }
    },
    {
        id: 13,
        label: 'Saturn Dust Speckles',
        icon: '🪐',
        desc: 'Micro-glint sparkles across orbital rings without haze',
        settings: { luminanceThreshold: 0.92, radius: 0.10, intensity: 2.10, levels: 2 }
    },
    {
        id: 14,
        label: 'Emerald Prism Sheen',
        icon: '💎',
        desc: 'Rich jewel-toned specular sparkle with high contrast',
        settings: { luminanceThreshold: 0.88, radius: 0.15, intensity: 2.35, levels: 3 }
    },
    {
        id: 15,
        label: 'Fireworks Pinpoint Glints',
        icon: '🎆',
        desc: 'Dazzling starburst points exploding along the ribbon trajectory',
        settings: { luminanceThreshold: 0.95, radius: 0.07, intensity: 3.30, levels: 2 }
    },
    {
        id: 16,
        label: 'Optical Calcite Refraction',
        icon: '🔮',
        desc: 'Double-refraction geometric glints with sharp facet edges',
        settings: { luminanceThreshold: 0.91, radius: 0.12, intensity: 2.55, levels: 2 }
    },
    {
        id: 17,
        label: 'Deep Void Bioluminescence',
        icon: '🌊',
        desc: 'Luminescent deep-ocean glow on pitch-black void',
        settings: { luminanceThreshold: 0.84, radius: 0.20, intensity: 1.95, levels: 3 }
    },
    {
        id: 18,
        label: 'Golden Hour Silhouette',
        icon: '🌅',
        desc: 'Steep rake specular sheen with golden facet rim lighting',
        settings: { luminanceThreshold: 0.86, radius: 0.17, intensity: 2.15, levels: 3 }
    },
    {
        id: 19,
        label: 'Filament Bio-Sparks',
        icon: '🧬',
        desc: 'Braided macromolecule nodes with sparkling highlight beads',
        settings: { luminanceThreshold: 0.89, radius: 0.13, intensity: 2.40, levels: 2 }
    },
    {
        id: 20,
        label: 'HDR Studio Specular',
        icon: '📸',
        desc: 'Clean 70-degree cross-side studio reflection glints',
        settings: { luminanceThreshold: 0.92, radius: 0.14, intensity: 1.85, levels: 2 }
    },
    {
        id: 21,
        label: 'Super-Intense Laser Sparkle',
        icon: '💥',
        desc: 'Extreme specular brilliance (4.5x) strictly bounded to glint peaks',
        settings: { luminanceThreshold: 0.98, radius: 0.06, intensity: 4.50, levels: 2 }
    },
    {
        id: 22,
        label: 'Subtle Micro-Sheen',
        icon: '✨',
        desc: 'Gentle, refined specular highlights with zero diffusion',
        settings: { luminanceThreshold: 0.93, radius: 0.08, intensity: 1.10, levels: 2 }
    },
    {
        id: 23,
        label: 'Pure Shading (Bloom Off)',
        icon: '🎯',
        desc: 'Raw WebGL hardware shading with zero bloom post-processing',
        settings: { luminanceThreshold: 1.50, radius: 0.00, intensity: 0.00, levels: 1 }
    },
    {
        id: 24,
        label: 'Radiant Specular Halo',
        icon: '🌋',
        desc: 'Rich atmospheric bloom bursting from glowing metallic magma speckles',
        settings: { luminanceThreshold: 0.21, radius: 0.72, intensity: 2.35, levels: 3 }
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

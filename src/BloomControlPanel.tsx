import React, { useState } from 'react';

export interface BloomSettings {
    luminanceThreshold: number;
    radius: number;
    intensity: number;
    levels: number;
}

export function BloomControlPanel({
    settings,
    onChange
}: {
    settings: BloomSettings;
    onChange: (settings: BloomSettings) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);

    const resetDefaults = () => {
        onChange({
            luminanceThreshold: 0.88,
            radius: 0.12,
            intensity: 0.45,
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
                background: 'rgba(10, 16, 30, 0.88)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: collapsed ? '8px 14px' : '16px 18px',
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                width: collapsed ? 'auto' : '280px',
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
                    <span style={{ fontSize: '14px' }}>✨</span>
                    <span style={{ fontWeight: 800, letterSpacing: '0.5px', color: '#00ffcc', fontSize: '12px' }}>
                        BLOOM TUNER
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
                    {/* 1. Luminance Threshold */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>Threshold:</span>
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
                    </div>

                    {/* 2. Radius */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>Radius:</span>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>Intensity:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00ffcc' }}>
                                {settings.intensity.toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.00"
                            max="3.00"
                            step="0.01"
                            value={settings.intensity}
                            onChange={e => onChange({ ...settings, intensity: parseFloat(e.target.value) })}
                            style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                        />
                    </div>

                    {/* 4. Levels */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>Levels:</span>
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

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { SimulationState, SPECIES_COLORS, SpeciesAttributes } from './BoidLogic';

interface OverlayUIProps {
    simState: React.MutableRefObject<SimulationState>;
    population: number;
    setPopulation: (n: number) => void;
    fps: number;
}

// Helper for draggable number input
const DraggableNumber = ({
    value,
    onChange,
    scale = 1,
    min = -Infinity,
    max = Infinity,
    format = (v: number) => v?.toFixed(1) ?? "0.0"
}: {
    value: number,
    onChange: (v: number) => void,
    scale?: number,
    min?: number,
    max?: number,
    format?: (v: number) => string
}) => {
    const startY = useRef<number | null>(null);
    const startVal = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        startY.current = e.clientY;
        startVal.current = value;
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (startY.current === null) return;
        const delta = startY.current - e.clientY;
        const change = delta * scale;
        let newValue = startVal.current + change;
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };

    const handleMouseUp = () => {
        startY.current = null;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <span className="value-control" onMouseDown={handleMouseDown}>
            {format(value)}
        </span>
    );
};

export const OverlayUI: React.FC<OverlayUIProps> = ({ simState, population, setPopulation, fps }) => {
    // Force re-render loop
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 100);
        return () => clearInterval(interval);
    }, []);

    const updateAttribute = (speciesIdx: number, key: keyof SpeciesAttributes, val: number) => {
        if (!simState.current.attributes[speciesIdx]) return;
        simState.current.attributes[speciesIdx][key] = val;
        setTick(t => t + 1);
    };

    const updateInteraction = (r: number, c: number, val: number) => {
        if (!simState.current.interactions[r]) return;
        simState.current.interactions[r][c] = val;
        setTick(t => t + 1);
    };

    // Safe access
    if (!simState.current || !simState.current.attributes || !simState.current.interactions) return null;

    const ATTRIBUTE_ROWS: { label: string, key: keyof SpeciesAttributes, min: number, max: number, scale: number }[] = [
        { label: 'Spd', key: 'maxSpeed', min: 0.1, max: 2.0, scale: 0.01 },
        { label: 'Rng', key: 'perceptionRadius', min: 1.0, max: 50.0, scale: 0.1 },
        { label: 'Sep', key: 'separationWeight', min: 0, max: 10, scale: 0.1 },
        { label: 'Ali', key: 'alignmentWeight', min: 0, max: 10, scale: 0.1 },
        { label: 'Coh', key: 'cohesionWeight', min: 0, max: 10, scale: 0.1 },
    ];

    return (
        <div className="overlay-controls">
            <div className="control-section">
                <table className="controls-table">
                    <tbody>
                        <tr>
                            <td>FPS</td>
                            <td style={{ color: fps < 30 ? '#ff5555' : '#55ffbb', fontWeight: 'bold' }}>{fps}</td>
                        </tr>
                        <tr>
                            <td>Population</td>
                            <td>
                                <DraggableNumber
                                    value={population}
                                    onChange={setPopulation}
                                    scale={5}
                                    min={10}
                                    max={2000}
                                    format={(v) => Math.round(v).toString()}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Global Speed</td>
                            <td>
                                <DraggableNumber
                                    value={simState.current.speedMultiplier}
                                    onChange={(v) => simState.current.speedMultiplier = v}
                                    scale={0.01}
                                    min={0.0}
                                    max={3.0}
                                    format={(v) => v.toFixed(2)}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Global Size</td>
                            <td>
                                <DraggableNumber
                                    value={simState.current.sizeMultiplier}
                                    onChange={(v) => simState.current.sizeMultiplier = v}
                                    scale={0.1}
                                    min={0.1}
                                    max={5.0}
                                    format={(v) => v.toFixed(1)}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="control-section">
                <div className="control-header">Attributes (Transposed)</div>
                <table className="controls-table">
                    <thead>
                        <tr>
                            <th>Param</th>
                            {SPECIES_COLORS.map((c, i) => (
                                <th key={i}><div className="color-dot" style={{ backgroundColor: c }}></div></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ATTRIBUTE_ROWS.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <td>{row.label}</td>
                                {SPECIES_COLORS.map((_, speciesIdx) => {
                                    const val = simState.current.attributes[speciesIdx][row.key];
                                    const intensity = Math.min(1, val / row.max);
                                    // Cyan base, opacity based on value intensity relative to max range
                                    const bg = `rgba(0, 200, 255, ${0.1 + intensity * 0.5})`;

                                    return (
                                        <td key={speciesIdx} className="matrix-cell" style={{ backgroundColor: bg }}>
                                            <div className="matrix-cell-content">
                                                <DraggableNumber
                                                    value={val}
                                                    onChange={(v) => updateAttribute(speciesIdx, row.key, v)}
                                                    scale={row.scale}
                                                    min={row.min}
                                                    max={row.max}
                                                    format={(v) => row.key === 'perceptionRadius' ? Math.round(v).toString() : v.toFixed(2)}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="control-section">
                <div className="control-header">Interactions (Row &rarr; Col)</div>
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th></th>
                            {SPECIES_COLORS.map((c, i) => (
                                <th key={i}><div className="color-dot" style={{ backgroundColor: c }}></div></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {simState.current.interactions.map((row, r) => (
                            <tr key={r}>
                                <td><div className="color-dot" style={{ backgroundColor: SPECIES_COLORS[r] }}></div></td>
                                {row.map((val, c) => {
                                    let bg = 'transparent';
                                    if (val > 0) {
                                        const intensity = Math.min(1, val / 10);
                                        bg = `rgba(0, 255, 0, ${intensity * 0.6})`;
                                    } else if (val < 0) {
                                        const intensity = Math.min(1, Math.abs(val) / 10);
                                        bg = `rgba(255, 0, 0, ${intensity * 0.6})`;
                                    }

                                    return (
                                        <td key={c} className="matrix-cell" style={{ backgroundColor: bg, padding: 0 }}>
                                            <div className="matrix-cell-content">
                                                <DraggableNumber
                                                    value={val}
                                                    onChange={(v) => updateInteraction(r, c, v)}
                                                    scale={0.1} min={-10} max={10}
                                                    format={(v) => Math.round(v).toString()}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#888', marginTop: '5px' }}>
                    Drag values to change.
                </div>
            </div>

            <div className="control-section">
                <div className="btn-row">
                    <button className="app-btn" onClick={() => {
                        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
                            updateInteraction(i, j, (Math.random() * 20) - 10);
                        }

                        simState.current.attributes.forEach((attr, idx) => {
                            const rnd = (min: number, max: number) => min + Math.random() * (max - min);
                            attr.maxSpeed = rnd(0.2, 0.8);
                            attr.perceptionRadius = rnd(3.0, 10.0);
                            attr.separationWeight = rnd(0.5, 3.0);
                            attr.alignmentWeight = rnd(0.5, 3.0);
                            attr.cohesionWeight = rnd(0.5, 3.0);
                        });
                        setTick(t => t + 1);
                    }}>Randomize</button>
                    <button className="app-btn" onClick={() => {
                        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) updateInteraction(i, j, 0);
                    }}>Reset</button>
                </div>
            </div>
        </div>
    );
};

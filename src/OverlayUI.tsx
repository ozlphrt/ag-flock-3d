import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationState, SPECIES_COLORS, SpeciesAttributes } from './BoidLogic';

interface OverlayUIProps {
    simState: React.MutableRefObject<SimulationState>;
    population: number;
    setPopulation: (n: number) => void;
}

const SPECIES_NAMES = ['Red', 'Green', 'Blue', 'Yellow'];

// Helper for draggable number input
const DraggableNumber = ({ value, onChange, scale = 1, min = -Infinity, max = Infinity, format = (v: number) => v.toFixed(1) }: { value: number, onChange: (v: number) => void, scale?: number, min?: number, max?: number, format?: (v: number) => string }) => {
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

export const OverlayUI: React.FC<OverlayUIProps> = ({ simState, population, setPopulation }) => {
    // Force re-render loop
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 100); // UI update rate
        return () => clearInterval(interval);
    }, []);

    const updateAttribute = (speciesIdx: number, key: keyof SpeciesAttributes, val: number) => {
        simState.current.attributes[speciesIdx][key] = val;
        setTick(t => t + 1); // Force update
    };

    const updateInteraction = (r: number, c: number, val: number) => {
        simState.current.interactions[r][c] = val;
        setTick(t => t + 1);
    };

    return (
        <div className="overlay-controls">
            <div className="control-section">
                <table className="controls-table">
                    <tbody>
                        <tr>
                            <td>Stats</td>
                            <td>FPS shown right</td>
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
                            <td>Time Scale</td>
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
                    </tbody>
                </table>
            </div>

            <div className="control-section">
                <div className="control-header">Attributes</div>
                <table className="controls-table">
                    <thead>
                        <tr>
                            <th>Color</th>
                            <th>Speed</th>
                            <th>Range</th>
                            <th>Sep</th>
                            <th>Align</th>
                            <th>Cohere</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simState.current.attributes.map((attr, idx) => (
                            <tr key={idx}>
                                <td><div className="color-dot" style={{ backgroundColor: SPECIES_COLORS[idx] }}></div></td>
                                <td>
                                    <DraggableNumber
                                        value={attr.maxSpeed}
                                        onChange={(v) => updateAttribute(idx, 'maxSpeed', v)}
                                        scale={0.01} min={0.1} max={2.0}
                                    />
                                </td>
                                <td>
                                    <DraggableNumber
                                        value={attr.perceptionRadius}
                                        onChange={(v) => updateAttribute(idx, 'perceptionRadius', v)}
                                        scale={0.1} min={1.0} max={50.0}
                                        format={(v) => Math.round(v).toString()}
                                    />
                                </td>
                                <td>
                                    <DraggableNumber
                                        value={attr.separationWeight}
                                        onChange={(v) => updateAttribute(idx, 'separationWeight', v)}
                                        scale={0.1} min={0} max={10}
                                    />
                                </td>
                                <td>
                                    <DraggableNumber
                                        value={attr.alignmentWeight}
                                        onChange={(v) => updateAttribute(idx, 'alignmentWeight', v)}
                                        scale={0.1} min={0} max={10}
                                    />
                                </td>
                                <td>
                                    <DraggableNumber
                                        value={attr.cohesionWeight}
                                        onChange={(v) => updateAttribute(idx, 'cohesionWeight', v)}
                                        scale={0.1} min={0} max={10}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="control-section">
                <div className="control-header">Interactions</div>
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
                                    // Calculate background color based on value
                                    let bg = 'transparent';
                                    if (val > 0) {
                                        const intensity = Math.min(1, val / 10);
                                        bg = `rgba(0, 255, 0, ${intensity * 0.6})`;
                                    } else if (val < 0) {
                                        const intensity = Math.min(1, Math.abs(val) / 10);
                                        bg = `rgba(255, 0, 0, ${intensity * 0.6})`;
                                    }

                                    return (
                                        <td key={c} className="matrix-cell" style={{ backgroundColor: bg }}>
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
                    Row = Actor, Col = Target. Positive = Attract, Negative = Repel.
                </div>
            </div>

            <div className="control-section">
                <div className="btn-row">
                    <button className="app-btn" onClick={() => {
                        // Randomize Matrix
                        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
                            updateInteraction(i, j, (Math.random() * 20) - 10);
                        }

                        // Randomize Attributes
                        simState.current.attributes.forEach((attr, idx) => {
                            // Helper to set random value and trigger update
                            const rnd = (min: number, max: number) => min + Math.random() * (max - min);

                            // We don't use updateAttribute for all to avoid too many re-renders in loop (though React batches usually)
                            // But we do need to update the object reference

                            attr.maxSpeed = rnd(0.2, 0.8);
                            attr.perceptionRadius = rnd(3.0, 10.0);
                            attr.separationWeight = rnd(0.5, 3.0);
                            attr.alignmentWeight = rnd(0.5, 3.0);
                            attr.cohesionWeight = rnd(0.5, 3.0);
                        });
                        setTick(t => t + 1); // Single force update for UI
                    }}>Randomize</button>
                    <button className="app-btn" onClick={() => {
                        // Reset Matrix
                        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) updateInteraction(i, j, 0);
                    }}>Reset</button>
                </div>
            </div>
        </div>
    );
};

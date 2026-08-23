import React, { useState, useEffect } from 'react';
import { SimulationState } from './BoidLogic';
import {
    AestheticAgentEngine,
    AgentRecommendation,
    AgentInsightSummary
} from './AestheticAgentEngine';

interface AgentForYouOverlayProps {
    simState: React.MutableRefObject<SimulationState>;
    agentEngine: AestheticAgentEngine;
    onClose: () => void;
}

export const AgentForYouOverlay: React.FC<AgentForYouOverlayProps> = ({
    simState,
    agentEngine,
    onClose
}) => {
    const [currentRec, setCurrentRec] = useState<AgentRecommendation>(() =>
        agentEngine.recommendNext(simState.current, 0.15)
    );
    const [insights, setInsights] = useState<AgentInsightSummary>(() =>
        agentEngine.getInsights()
    );
    const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
    const [likeFeedbackGiven, setLikeFeedbackGiven] = useState<boolean | null>(null);

    // Apply the recommended configuration to the live swarm
    const applyRecommendation = (rec: AgentRecommendation) => {
        const target = simState.current;
        const s = rec.state;

        if (s.materialSettings) {
            target.materialSettings = { ...s.materialSettings };
        }
        if (s.lightingProfile) {
            target.lightingProfile = { ...s.lightingProfile };
        }
        if (s.formationMode !== undefined) {
            target.prevFormationMode = target.formationMode;
            target.formationMode = s.formationMode;
            target.transitionStartTime = target.currentTime || 0;
        }
        if (s.speedMultiplier !== undefined) target.speedMultiplier = s.speedMultiplier;
        if (s.noiseTurbulence !== undefined) target.noiseTurbulence = s.noiseTurbulence;
        if (s.speciesColors) target.speciesColors = [...s.speciesColors];
        if (s.bloomSettings) target.bloomSettings = { ...s.bloomSettings };
    };

    // Initial recommendation apply
    useEffect(() => {
        applyRecommendation(currentRec);
    }, []);

    const handleLoveIt = () => {
        setLikeFeedbackGiven(true);
        const updatedInsights = agentEngine.recordFeedback(currentRec, true);
        setInsights(updatedInsights);

        setTimeout(() => {
            setLikeFeedbackGiven(null);
            const next = agentEngine.recommendNext(simState.current, 0.15);
            setCurrentRec(next);
            applyRecommendation(next);
        }, 350);
    };

    const handleNextForYou = () => {
        const next = agentEngine.recommendNext(simState.current, 0.18);
        setCurrentRec(next);
        applyRecommendation(next);
    };

    const handleMutateSlightly = () => {
        const next = agentEngine.recommendNext(simState.current, 0.30);
        setCurrentRec(next);
        applyRecommendation(next);
    };

    const handleWildSurprise = () => {
        const next = agentEngine.recommendNext(simState.current, 0.50);
        setCurrentRec(next);
        applyRecommendation(next);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: '680px',
            background: 'rgba(10, 14, 26, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(47, 161, 214, 0.45)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(47,161,214,0.25)',
            zIndex: 99999,
            padding: '16px 20px',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.25s ease-out'
        }}>
            {/* Top Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>✨</span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '0.03em', color: '#fff' }}>
                                Aesthetic Agent
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg, #2FA1D6, #00e5ff)',
                                color: '#070b14',
                                fontSize: '10px',
                                fontWeight: 900,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                            }}>
                                For You #{currentRec.generationNumber}
                            </span>
                            <span style={{
                                background: 'rgba(0, 245, 212, 0.15)',
                                color: '#00f5d4',
                                border: '1px solid rgba(0, 245, 212, 0.35)',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                {currentRec.predictedAffinity}% Match
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                        style={{
                            background: isInsightsExpanded ? 'rgba(47, 161, 214, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#e2e8f0',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        🧠 Taste Model ({insights.profileStrength}%)
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8899ac',
                            fontSize: '16px',
                            cursor: 'pointer',
                            padding: '4px 6px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Agent Rationale Message */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: '1.45'
            }}>
                <div style={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}>
                    {currentRec.rationale}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00e5ff' }}>
                    <span>🧬 Novelty Test ({currentRec.explorationPercentage}%):</span>
                    <span style={{ color: '#94a3b8' }}>{currentRec.explorationFeature}</span>
                </div>
            </div>

            {/* Taste Model Insights (Expandable) */}
            {isInsightsExpanded && (
                <div style={{
                    background: 'rgba(7, 11, 20, 0.85)',
                    border: '1px solid rgba(47, 161, 214, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '11px'
                }}>
                    <div style={{ fontWeight: 800, color: '#2FA1D6' }}>
                        Agent Understanding of Your Taste DNA:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {insights.topAttributes.map((attr, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#8899ac' }}>{attr.name}: </span>
                                <span style={{ color: '#fff', fontWeight: 700 }}>{attr.value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        {insights.agentMessage}
                    </div>
                </div>
            )}

            {/* Action Buttons (Reels / YouTube Algorithm Interaction) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={handleLoveIt}
                    style={{
                        flex: 1.2,
                        background: likeFeedbackGiven ? 'linear-gradient(135deg, #00f5d4, #00bbf9)' : 'linear-gradient(135deg, #ff6820, #ff9f1c)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '9px 14px',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 15px rgba(255,104,32,0.35)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {likeFeedbackGiven ? '✓ Taste Reinforced!' : '🔥 Love This (Reinforce)'}
                </button>

                <button
                    onClick={handleNextForYou}
                    style={{
                        flex: 1,
                        background: 'rgba(47, 161, 214, 0.18)',
                        border: '1.5px solid #2FA1D6',
                        color: '#2FA1D6',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                    }}
                >
                    ✨ Next For You
                </button>

                <button
                    onClick={handleMutateSlightly}
                    style={{
                        flex: 0.9,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#e2e8f0',
                        borderRadius: '8px',
                        padding: '9px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    🧬 Mutate
                </button>

                <button
                    onClick={handleWildSurprise}
                    style={{
                        flex: 0.9,
                        background: 'rgba(255, 215, 0, 0.12)',
                        border: '1px solid rgba(255, 215, 0, 0.35)',
                        color: '#ffd700',
                        borderRadius: '8px',
                        padding: '9px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    🎲 Surprise
                </button>
            </div>
        </div>
    );
};

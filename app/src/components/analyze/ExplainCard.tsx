import React from 'react';
import type { AnalysisResult } from '../../lib/types';

interface ExplainCardProps {
    result: AnalysisResult;
}

/**
 * ExplainCard Component
 * 
 * Displays a card explaining the verdict with bullet points derived from the result's
 * explain.factors field. If explain is not provided, synthesizes from indices and confidence.
 */
const ExplainCard: React.FC<ExplainCardProps> = ({ result }) => {
    // Map impact symbols to colored indicators
    const getImpactIndicator = (impact: '+' | '-' | '~') => {
        let color = '';
        let symbol = '';

        switch (impact) {
            case '+':
                color = 'var(--success)';
                symbol = '↑';
                break;
            case '-':
                color = 'var(--error)';
                symbol = '↓';
                break;
            case '~':
                color = 'var(--warning)';
                symbol = '→';
                break;
        }

        return (
            <span style={{
                color,
                fontWeight: 'bold',
                marginRight: 'var(--space-2)',
                display: 'inline-block',
                width: '16px',
                textAlign: 'center'
            }}>
                {symbol}
            </span>
        );
    };

    // Generate explanation points
    const getExplanationPoints = () => {
        // If explain.factors is available, use those
        if (result.explain?.factors && result.explain.factors.length > 0) {
            return result.explain.factors.map((factor, index) => (
                <li key={index} style={{
                    marginBottom: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'flex-start'
                }}>
                    {getImpactIndicator(factor.impact)}
                    <div>
                        <strong style={{ fontWeight: '600' }}>{factor.label}:</strong> {factor.note}
                    </div>
                </li>
            ));
        }

        // Otherwise, synthesize from indices and confidence
        const points = [];
        const { indices, confidence } = result;

        if (indices) {
            if (indices.demand > 70) {
                points.push(
                    <li key="demand" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('+')}
                        <div><strong style={{ fontWeight: '600' }}>Strong Demand:</strong> High consumer interest in this product category.</div>
                    </li>
                );
            } else if (indices.demand < 30) {
                points.push(
                    <li key="demand" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('-')}
                        <div><strong style={{ fontWeight: '600' }}>Low Demand:</strong> Limited consumer interest in this product category.</div>
                    </li>
                );
            }

            if (indices.momentum > 70) {
                points.push(
                    <li key="momentum" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('+')}
                        <div><strong style={{ fontWeight: '600' }}>Positive Momentum:</strong> This trend is gaining traction rapidly.</div>
                    </li>
                );
            } else if (indices.momentum < 30) {
                points.push(
                    <li key="momentum" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('-')}
                        <div><strong style={{ fontWeight: '600' }}>Declining Momentum:</strong> This trend is losing popularity.</div>
                    </li>
                );
            }

            if (indices.saturation > 70) {
                points.push(
                    <li key="saturation" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('-')}
                        <div><strong style={{ fontWeight: '600' }}>High Saturation:</strong> Market is crowded with similar offerings.</div>
                    </li>
                );
            } else if (indices.saturation < 30) {
                points.push(
                    <li key="saturation" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('+')}
                        <div><strong style={{ fontWeight: '600' }}>Low Saturation:</strong> Few competitors in this space currently.</div>
                    </li>
                );
            }

            if (indices.freshness > 70) {
                points.push(
                    <li key="freshness" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('+')}
                        <div><strong style={{ fontWeight: '600' }}>Very Fresh:</strong> This is an emerging trend with potential.</div>
                    </li>
                );
            }

            if (indices.styleFit > 70) {
                points.push(
                    <li key="styleFit" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('+')}
                        <div><strong style={{ fontWeight: '600' }}>Strong Style Fit:</strong> Aligns well with current fashion direction.</div>
                    </li>
                );
            } else if (indices.styleFit < 30) {
                points.push(
                    <li key="styleFit" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                        {getImpactIndicator('-')}
                        <div><strong style={{ fontWeight: '600' }}>Poor Style Fit:</strong> Doesn't align with current fashion direction.</div>
                    </li>
                );
            }
        }

        if (confidence && confidence < 50) {
            points.push(
                <li key="confidence" style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'flex-start' }}>
                    {getImpactIndicator('~')}
                    <div><strong style={{ fontWeight: '600' }}>Limited Data:</strong> Analysis is based on limited market data.</div>
                </li>
            );
        }

        return points.length > 0 ? points : [(
            <li key="default" style={{ marginBottom: 'var(--space-2)' }}>
                {getImpactIndicator('~')}
                <div>Analysis based on overall market conditions and product category performance.</div>
            </li>
        )];
    };

    return (
        <div className="card" style={{
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
        }}>
            <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--space-4)',
                color: 'var(--text)'
            }}>
                Why this verdict?
            </div>

            <ul style={{
                listStyleType: 'none',
                padding: 0,
                margin: 0
            }}>
                {getExplanationPoints()}
            </ul>
        </div>
    );
};

export default ExplainCard;
import React, { useState } from 'react';

function BulletOptimizer({ bulletImprovements = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!bulletImprovements || bulletImprovements.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: '700', marginBottom: '16px' }}>
        Bullet Point Optimizer (STAR Method Rewrites)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {bulletImprovements.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#ef4444', fontWeight: '700' }}>
                Original Bullet:
              </span>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '4px', fontStyle: 'italic' }}>
                "{item.original}"
              </p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#22c55e', fontWeight: '700' }}>
                AI STAR Rewrite:
              </span>
              <p style={{ color: '#4ade80', fontSize: '0.95rem', fontWeight: '600', marginTop: '4px' }}>
                "{item.suggested}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                <em>{item.reason}</em>
              </span>
              <button
                onClick={() => handleCopy(item.suggested, idx)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                {copiedIndex === idx ? 'Copied' : 'Copy STAR Bullet'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BulletOptimizer;

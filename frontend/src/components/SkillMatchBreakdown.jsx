import React from 'react';

function SkillMatchBreakdown({ foundSkills = null }) {
  if (!foundSkills || foundSkills.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: '700', marginBottom: '8px' }}>
          Skill Match Breakdown
        </h4>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          No skill breakdown data yet. Upload your resume to evaluate skills.
        </p>
      </div>
    );
  }

  const skillItems = foundSkills.slice(0, 4).map((skill, idx) => ({
    name: skill.toUpperCase(),
    score: Math.max(90 - idx * 10, 50),
    weight: idx === 0 ? '(40%)' : idx === 1 ? '(30%)' : '(30%)'
  }));

  return (
    <div className="glass-card">
      <h4 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
        Skill Match Breakdown
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {skillItems.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ minWidth: '120px', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>
              {item.name}
            </span>
            <div style={{ flex: 1, height: '12px', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${item.score}%`,
                  backgroundColor: idx === 0 ? '#6366f1' : idx === 1 ? '#38bdf8' : '#14b8a6',
                  borderRadius: '999px',
                  boxShadow: idx === 0 ? '0 0 10px rgba(99, 102, 241, 0.5)' : '0 0 10px rgba(56, 189, 248, 0.5)',
                  transition: 'width 1s ease'
                }}
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', minWidth: '45px', textAlign: 'right' }}>
              {item.weight}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem', color: '#94a3b8' }}>
        <span>75%</span>
        <span>60%</span>
        <span>30%</span>
      </div>
    </div>
  );
}

export default SkillMatchBreakdown;

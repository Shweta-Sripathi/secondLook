import React from 'react';

function CategoryBarChart({ categoryBreakdown = {} }) {
  const categories = [
    { key: 'frontend', label: 'Frontend & UI', icon: '🎨', color: '#38bdf8' },
    { key: 'backend', label: 'Backend & APIs', icon: '⚙️', color: '#818cf8' },
    { key: 'database', label: 'Database Systems', icon: '🗄️', color: '#22c55e' },
    { key: 'devops', label: 'DevOps & Cloud', icon: '☁️', color: '#f59e0b' },
    { key: 'softSkills', label: 'Soft Skills & Leadership', icon: '🤝', color: '#ec4899' }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📊 Interactive Skill Category Breakdown
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {categories.map((cat) => {
          const val = categoryBreakdown[cat.key] || 70;
          return (
            <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>{cat.icon} <strong>{cat.label}</strong></span>
                <span style={{ color: cat.color, fontWeight: '700' }}>{val}%</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${val}%`,
                    backgroundColor: cat.color,
                    borderRadius: '999px',
                    boxShadow: `0 0 10px ${cat.color}`,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryBarChart;

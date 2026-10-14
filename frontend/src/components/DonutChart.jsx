import React from 'react';

function DonutChart({ techScore = null, softScore = null, expScore = null, hasData = true }) {
  if (!hasData || (techScore === null && softScore === null && expScore === null)) {
    return (
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: '700', marginBottom: '6px' }}>
          Skill Match Profile Fit
        </h4>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          No profile fit data yet. Upload your resume to evaluate profile fit distribution.
        </p>
      </div>
    );
  }

  const tScore = techScore || 40;
  const sScore = softScore || 30;
  const eScore = expScore || 30;

  const total = tScore + sScore + eScore || 100;
  const techPct = Math.round((tScore / total) * 100);
  const softPct = Math.round((sScore / total) * 100);
  const expPct = Math.round((eScore / total) * 100);

  // SVG Circle Calculations
  const size = 140;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segment offsets
  const seg1 = (techPct / 100) * circumference;
  const seg2 = (softPct / 100) * circumference;
  const seg3 = (expPct / 100) * circumference;

  const offset1 = 0;
  const offset2 = -seg1;
  const offset3 = -(seg1 + seg2);

  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Tech Skills Segment (Cyan) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#38bdf8"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${seg1} ${circumference - seg1}`}
            strokeDashoffset={offset1}
          />
          {/* Soft Skills Segment (Teal) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#14b8a6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${seg2} ${circumference - seg2}`}
            strokeDashoffset={offset2}
          />
          {/* Experience Segment (Amber) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${seg3} ${circumference - seg3}`}
            strokeDashoffset={offset3}
          />
        </svg>
        <div style={styles.centerHole}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>Fit</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: '700', marginBottom: '2px' }}>
          Skill Match Profile Fit
        </h4>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: '#38bdf8' }} />
          <span style={styles.legendLabel}>Technical Skills</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: '#14b8a6' }} />
          <span style={styles.legendLabel}>Soft Skills ({softPct}%)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: '#f59e0b' }} />
          <span style={styles.legendLabel}>Experience ({expPct}%)</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  centerHole: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  legendLabel: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    fontWeight: '600'
  }
};

export default DonutChart;

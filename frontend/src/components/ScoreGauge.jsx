import React from 'react';

function ScoreGauge({ score = 0, title = 'ATS Score', size = 120 }) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = '#ef4444'; // Red (0 - 49)
  if (normalizedScore >= 75) {
    color = '#22c55e'; // Green (75 - 100)
  } else if (normalizedScore >= 50) {
    color = '#f59e0b'; // Yellow/Orange (50 - 74)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={styles.scoreText}>
          <span style={{ fontSize: size > 100 ? '1.8rem' : '1.2rem', fontWeight: '800', color: color }}>
            {normalizedScore}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/100</span>
        </div>
      </div>
      <span style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>
        {title}
      </span>
    </div>
  );
}

const styles = {
  scoreText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

export default ScoreGauge;

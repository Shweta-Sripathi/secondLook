import React from 'react';

function KeywordBadges({ foundKeywords = [], missingKeywords = [] }) {
  return (
    <div style={{ margin: '20px 0' }}>
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: '#059669', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
          Identified Matching Keywords ({foundKeywords.length})
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {foundKeywords.length > 0 ? (
            foundKeywords.map((kw, i) => (
              <span key={i} className="badge badge-success">
                {kw}
              </span>
            ))
          ) : (
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No matching keywords detected.</span>
          )}
        </div>
      </div>

      <div>
        <h4 style={{ color: '#dc2626', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
          Missing Recommended Keywords ({missingKeywords.length})
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {missingKeywords.length > 0 ? (
            missingKeywords.map((kw, i) => (
              <span key={i} className="badge badge-danger">
                + {kw}
              </span>
            ))
          ) : (
            <span style={{ color: '#059669', fontSize: '0.85rem' }}>No critical domain keywords missing.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default KeywordBadges;

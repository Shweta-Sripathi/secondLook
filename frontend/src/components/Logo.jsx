import React from 'react';

/**
 * secondLook Logo -- Image-based component.
 *
 * @param {"lg"|"md"|"sm"|"xs"} size
 * @param {boolean} logoOnly - show only the image, no text
 * @param {object} style - additional inline styles
 * @param {string} className - additional CSS classes
 */
export default function Logo({ size = 'lg', logoOnly = false, animate = true, style, className, ...rest }) {
  const heightMap = { lg: 80, md: 48, sm: 36, xs: 28 };
  const h = heightMap[size] || heightMap.lg;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: logoOnly ? 0 : '10px',
        ...style,
      }}
      {...rest}
    >
      <img
        src="/logo.jpg"
        alt="secondLook"
        style={{
          height: `${h}px`,
          width: `${h}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
      {!logoOnly && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: size === 'lg' ? '1.5rem' : size === 'md' ? '1.2rem' : size === 'sm' ? '1.1rem' : '0.9rem',
            letterSpacing: '-0.02em',
            color: 'inherit',
            lineHeight: 1,
          }}
        >
          secondLook
        </span>
      )}
    </div>
  );
}

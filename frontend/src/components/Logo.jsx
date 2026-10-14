import React from 'react';

/**
 * secondLook Logo -- Image-based component.
 *
 * @param {"lg"|"sm"|"xs"} size - "lg" for hero, "sm" for navbar, "xs" for small
 * @param {boolean} animate - unused now, kept for API compatibility
 * @param {object} style - additional inline styles
 * @param {string} className - additional CSS classes
 */
export default function Logo({ size = 'lg', animate = true, style, className, ...rest }) {
  const heightMap = { lg: 56, sm: 36, xs: 28 };
  const h = heightMap[size] || heightMap.lg;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
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
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: size === 'lg' ? '1.5rem' : size === 'sm' ? '1.1rem' : '0.9rem',
          letterSpacing: '-0.02em',
          color: 'inherit',
          lineHeight: 1,
        }}
      >
        secondLook
      </span>
    </div>
  );
}

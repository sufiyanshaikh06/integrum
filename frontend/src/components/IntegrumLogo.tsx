interface IntegrumLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function IntegrumLogo({ size = 32, className = '', style }: IntegrumLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Circular outer boundary */}
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" />
      {/* Slanted dot positioned toward the upper-right corner */}
      <circle cx="58" cy="27" r="6.5" fill="currentColor" />
      {/* Slanted italic stem leaning toward the upper-right corner */}
      <rect x="47" y="39" width="11" height="35" rx="5.5" fill="currentColor" transform="rotate(14 50 55)" />
    </svg>
  );
}

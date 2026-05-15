import { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Brand logo with graceful PNG → SVG fallback.
 * Tries to load /brand/emi-falck-logo.png (dropped by the asset-fetcher skill).
 * Falls back to the inline shield+cross SVG if the image is missing or fails.
 *
 * Lives in shared/ because it is domain-agnostic (used in app/ layout).
 * Architecture: shared/ may not import features/ or pages/.
 */
export function BrandLogo({
  className = 'h-8 md:h-10 w-auto',
  alt = 'Grupo EMI Falck',
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FallbackShield className={className} aria-label={alt} />;
  }

  return (
    <img
      src="/brand/emi-falck-logo.png"
      alt={alt}
      className={className}
      onError={() => {
        console.warn('[BrandLogo] /brand/emi-falck-logo.png failed to load — falling back to inline SVG');
        setFailed(true);
      }}
    />
  );
}

function FallbackShield({
  className,
  ...rest
}: { className?: string } & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 36"
      className={className}
      fill="none"
      {...rest}
    >
      {/* Shield body */}
      <path
        d="M16 1L2 7v11c0 8.5 6 16 14 18 8-2 14-9.5 14-18V7L16 1z"
        fill="#d4001a"
        stroke="#aa0016"
        strokeWidth="1"
      />
      {/* Inner shield highlight */}
      <path
        d="M16 5L5 10v9c0 6.5 4.8 12.4 11 14.3C22.2 31.4 27 25.5 27 19V10L16 5z"
        fill="#ff1f2d"
        opacity="0.25"
      />
      {/* Medical cross — horizontal bar */}
      <rect x="13" y="10" width="6" height="16" rx="1.5" fill="white" opacity="0.95" />
      {/* Medical cross — vertical bar */}
      <rect x="8" y="15" width="16" height="6" rx="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}

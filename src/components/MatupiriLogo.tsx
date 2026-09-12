import React from 'react';

interface MatupiriLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
}

export const MatupiriLogo: React.FC<MatupiriLogoProps> = ({
  className = "h-12 w-auto",
  height = "100%",
  width = "auto"
}) => {
  return (
    <div className={`bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 600 200" 
        className="h-full w-auto max-h-14 max-w-[280px]"
        style={{ height, width }}
      >
        <rect width="600" height="200" fill="#ffffff" rx="12"/>
        <g transform="translate(24, 16)">
          <text x="6" y="38" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="30" fill="#580766" letterSpacing="3">
            CONSÓRCIO
          </text>
          <text x="2" y="118" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="88" fill="#580766" letterSpacing="-2">
            Matupiri
          </text>
          <line x1="4" y1="138" x2="546" y2="138" stroke="#580766" strokeWidth="12" strokeLinecap="round"/>
          <line x1="12" y1="138" x2="538" y2="138" stroke="#ffffff" strokeWidth="3" strokeDasharray="12 10" strokeLinecap="round"/>
          <text x="6" y="168" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="18" fill="#580766" letterSpacing="1">
            MODERA ENGENHARIA • SCB BIM &amp; GIS
          </text>
        </g>
      </svg>
    </div>
  );
};

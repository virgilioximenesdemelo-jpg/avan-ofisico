import React from 'react';

export const DNIT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 135" width="600" height="135" fill="none">
  <g fill="#162a5c">
    <text x="12" y="112" font-family="'Arial Black', Arial, Helvetica, sans-serif" font-weight="900" font-style="italic" font-size="124" letter-spacing="-3">DNIT</text>
    <g font-family="Arial, Helvetica, sans-serif" font-weight="800" font-style="italic" font-size="18.5" letter-spacing="0.5">
      <text x="368" y="38">DEPARTAMENTO</text>
      <text x="368" y="63">NACIONAL DE</text>
      <text x="368" y="88">INFRAESTRUTURA</text>
      <text x="368" y="113">DE TRANSPORTES</text>
    </g>
  </g>
</svg>`;

export const DEFAULT_DNIT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(DNIT_LOGO_SVG)}`;

interface DnitLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
}

export const DnitLogo: React.FC<DnitLogoProps> = ({
  className = "h-8 w-auto",
  height,
  width
}) => {
  return (
    <div 
      className={`flex items-center justify-center shrink-0 bg-white p-1 rounded-md border border-slate-200 shadow-2xs ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 600 135" 
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-auto block shrink-0"
        style={{ 
          height: height || '100%', 
          width: width || 'auto' 
        }}
      >
        <g fill="#162a5c">
          <text 
            x="12" 
            y="112" 
            fontFamily="'Arial Black', Arial, Helvetica, sans-serif" 
            fontWeight="900" 
            fontStyle="italic" 
            fontSize="124" 
            letterSpacing="-3"
          >
            DNIT
          </text>
          <g fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontStyle="italic" fontSize="18.5" letterSpacing="0.5">
            <text x="368" y="38">DEPARTAMENTO</text>
            <text x="368" y="63">NACIONAL DE</text>
            <text x="368" y="88">INFRAESTRUTURA</text>
            <text x="368" y="113">DE TRANSPORTES</text>
          </g>
        </g>
      </svg>
    </div>
  );
};

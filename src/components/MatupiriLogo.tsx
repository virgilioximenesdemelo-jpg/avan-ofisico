import React from 'react';

export const MATUPIRI_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 340" width="720" height="340">
  <defs>
    <style>
      .mat-purple { fill: #4c0663; }
      .mat-font { font-family: 'Outfit', 'Montserrat', 'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </defs>

  <!-- Fundo branco suave integrado para garantir contraste perfeito em qualquer tema -->
  <rect width="720" height="340" rx="18" fill="#ffffff" />

  <!-- Arco superior CONSÓRCIO curvado sobre o início de Matupiri -->
  <g class="mat-purple mat-font" style="font-weight: 800; font-size: 34px; letter-spacing: 0.5px;">
    <text x="46.0" y="108.0" transform="rotate(-23.0, 46.0, 108.0)">C</text>
    <text x="70.0" y="97.0" transform="rotate(-17.0, 70.0, 97.0)">O</text>
    <text x="95.0" y="88.0" transform="rotate(-11.5, 95.0, 88.0)">N</text>
    <text x="120.0" y="82.0" transform="rotate(-6.0, 120.0, 82.0)">S</text>
    <text x="144.0" y="79.0" transform="rotate(0.5, 144.0, 79.0)">Ó</text>
    <text x="169.0" y="80.5" transform="rotate(7.0, 169.0, 80.5)">R</text>
    <text x="193.0" y="85.5" transform="rotate(13.0, 193.0, 85.5)">C</text>
    <text x="214.0" y="92.0" transform="rotate(18.0, 214.0, 92.0)">I</text>
    <text x="233.0" y="99.0" transform="rotate(23.5, 233.0, 99.0)">O</text>
  </g>

  <!-- Palavra principal Matupiri -->
  <text 
    x="34" 
    y="234" 
    class="mat-purple mat-font" 
    style="font-weight: 900; font-size: 170px; letter-spacing: -2.5px;"
  >
    Matupiri
  </text>

  <!-- Barra horizontal em pílula rodoviária -->
  <rect x="34" y="254" width="652" height="32" rx="16" fill="#4c0663" />

  <!-- Faixa tracejada branca central da rodovia -->
  <line 
    x1="52" 
    y1="270" 
    x2="668" 
    y2="270" 
    stroke="#ffffff" 
    stroke-width="5.5" 
    stroke-dasharray="20 13" 
    stroke-linecap="round" 
  />

  <!-- Subtítulo MODERA ENGENHARIA • SCB BIM & GIS -->
  <text 
    x="360" 
    y="322" 
    text-anchor="middle" 
    class="mat-purple mat-font" 
    style="font-weight: 800; font-size: 26px; letter-spacing: 2.8px;"
  >
    MODERA ENGENHARIA • SCB BIM &amp; GIS
  </text>
</svg>`;

export const DEFAULT_MATUPIRI_LOGO = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3MjAgMzQwIiB3aWR0aD0iNzIwIiBoZWlnaHQ9IjM0MCI+CiAgPHJlY3Qgd2lkdGg9IjcyMCIgaGVpZ2h0PSIzNDAiIGZpbGw9IiNmZmZmZmYiIHJ4PSIxOCIvPgogIDxnIGZpbGw9IiM0YzA2NjMiIGZvbnQtZmFtaWx5PSInT3V0Zml0JywgJ01vbnRzZXJyYXQnLCAnQ2VudHVyeSBHb3RoaWMnLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iODAwIiBmb250LXNpemU9IjM0Ij4KICAgIDx0ZXh0IHg9IjQ2LjAiIHk9IjEwOC4wIiB0cmFuc2Zvcm09InJvdGF0ZSgtMjMuMCwgNDYuMCwgMTA4LjApIj5DPC90ZXh0PgogICAgPHRleHQgeD0iNzAuMCIgeT0iOTcuMCIgdHJhbnNmb3JtPSJyb3RhdGUoLTE3LjAsIDcwLjAsIDk3LjApIj5PPC90ZXh0PgogICAgPHRleHQgeD0iOTUuMCIgeT0iODguMCIgdHJhbnNmb3JtPSJyb3RhdGUoLTExLjUsIDk1LjAsIDg4LjApIj5OPC90ZXh0PgogICAgPHRleHQgeD0iMTIwLjAiIHk9IjgyLjAiIHRyYW5zZm9ybT0icm90YXRlKC02LjAsIDEyMC4wLCA4Mi4wKSI+UzwvdGV4dD4KICAgIDx0ZXh0IHg9IjE0NC4wIiB5PSI3OS4wIiB0cmFuc2Zvcm09InJvdGF0ZSgwLjUsIDE0NC4wLCA3OS4wKSI+w5M8L3RleHQ+CiAgICA8dGV4dCB4PSIxNjkuMCIgeT0iODAuNSIgdHJhbnNmb3JtPSJyb3RhdGUoNy4wLCAxNjkuMCwgODAuNSkiPlI8L3RleHQ+CiAgICA8dGV4dCB4PSIxOTMuMCIgeT0iODUuNSIgdHJhbnNmb3JtPSJyb3RhdGUoMTMuMCwgMTkzLjAsIDg1LjUpIj5DPC90ZXh0PgogICAgPHRleHQgeD0iMjE0LjAiIHk9IjkyLjAiIHRyYW5zZm9ybT0icm90YXRlKDE4LjAsIDIxNC4wLCA5Mi4wKSI+STwvdGV4dD4KICAgIDx0ZXh0IHg9IjIzMy4wIiB5PSI5OS4wIiB0cmFuc2Zvcm09InJvdGF0ZSgyMy41LCAyMzMuMCwgOTkuMCkiPk88L3RleHQ+CiAgPC9nPgogIDx0ZXh0IHg9IjM0IiB5PSIyMzQiIGZpbGw9IiM0YzA2NjMiIGZvbnQtZmFtaWx5PSInT3V0Zml0JywgJ01vbnRzZXJyYXQnLCAnQ2VudHVyeSBHb3RoaWMnLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjE3MCIgbGV0dGVyLXNwYWNpbmc9Ii0yLjUiPk1hdHVwaXJpPC90ZXh0PgogIDxyZWN0IHg9IjM0IiB5PSIyNTQiIHdpZHRoPSI2NTIiIGhlaWdodD0iMzIiIHJ4PSIxNiIgZmlsbD0iIzRjMDY2MyIvPgogIDxsaW5lIHgxPSI1MiIgeTE9IjI3MCIgeDI9IjY2OCIgeTI9IjI3MCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjUuNSIgc3Ryb2tlLWRhc2hhcnJheT0iMjAgMTMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDx0ZXh0IHg9IjM2MCIgeT0iMzIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNGMwNjYzIiBmb250LWZhbWlseT0iJ091dGZpdCcsICdNb250c2VycmF0JywgJ0NlbnR1cnkgR290aGljJywgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjgwMCIgZm9udC1zaXplPSIyNiIgbGV0dGVyLXNwYWNpbmc9IjIuOCI+TU9ERVJBIEVOR0VOSEFSSUEg4oCiIFNDQiBCSU0gJmFtcDsgR0lTPC90ZXh0Pgo8L3N2Zz4=`;

interface MatupiriLogoProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  hideBackgroundBadge?: boolean;
}

export const MatupiriLogo: React.FC<MatupiriLogoProps> = ({
  className = "h-10 sm:h-12 w-auto",
  height,
  width,
  hideBackgroundBadge = false
}) => {
  return (
    <div 
      className={`${hideBackgroundBadge ? '' : 'bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs'} flex items-center justify-center shrink-0 ${className}`}
      style={{
        boxSizing: 'border-box'
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 720 340" 
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-auto block shrink-0"
        style={{ 
          height: height || '100%', 
          width: width || 'auto'
        }}
      >
        <defs>
          <style>{`
            .mat-purple { fill: #4c0663; }
            .mat-font { font-family: 'Outfit', 'Montserrat', 'Century Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          `}</style>
        </defs>

        {/* Fundo branco de alta fidelidade */}
        <rect width="720" height="340" rx="18" fill="#ffffff" />

        {/* Arco superior CONSÓRCIO curvado sobre o início de Matupiri */}
        <g className="mat-purple mat-font" style={{ fontWeight: 800, fontSize: '34px', letterSpacing: '0.5px' }}>
          <text x="46.0" y="108.0" transform="rotate(-23.0, 46.0, 108.0)">C</text>
          <text x="70.0" y="97.0" transform="rotate(-17.0, 70.0, 97.0)">O</text>
          <text x="95.0" y="88.0" transform="rotate(-11.5, 95.0, 88.0)">N</text>
          <text x="120.0" y="82.0" transform="rotate(-6.0, 120.0, 82.0)">S</text>
          <text x="144.0" y="79.0" transform="rotate(0.5, 144.0, 79.0)">Ó</text>
          <text x="169.0" y="80.5" transform="rotate(7.0, 169.0, 80.5)">R</text>
          <text x="193.0" y="85.5" transform="rotate(13.0, 193.0, 85.5)">C</text>
          <text x="214.0" y="92.0" transform="rotate(18.0, 214.0, 92.0)">I</text>
          <text x="233.0" y="99.0" transform="rotate(23.5, 233.0, 99.0)">O</text>
        </g>

        {/* Palavra principal Matupiri */}
        <text 
          x="34" 
          y="234" 
          className="mat-purple mat-font" 
          style={{ fontWeight: 900, fontSize: '170px', letterSpacing: '-2.5px' }}
        >
          Matupiri
        </text>

        {/* Barra horizontal em pílula rodoviária */}
        <rect x="34" y="254" width="652" height="32" rx="16" fill="#4c0663" />

        {/* Faixa tracejada branca central da rodovia */}
        <line 
          x1="52" 
          y1="270" 
          x2="668" 
          y2="270" 
          stroke="#ffffff" 
          strokeWidth="5.5" 
          strokeDasharray="20 13" 
          strokeLinecap="round" 
        />

        {/* Subtítulo MODERA ENGENHARIA • SCB BIM & GIS */}
        <text 
          x="360" 
          y="322" 
          textAnchor="middle" 
          className="mat-purple mat-font" 
          style={{ fontWeight: 800, fontSize: 26, letterSpacing: '2.8px' }}
        >
          MODERA ENGENHARIA • SCB BIM &amp; GIS
        </text>
      </svg>
    </div>
  );
};

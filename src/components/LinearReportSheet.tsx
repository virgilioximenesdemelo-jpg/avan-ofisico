import React from 'react';
import { Contract, RoadService, Segment20m } from '../types';
import { MatupiriLogo } from './MatupiriLogo';

const DEFAULT_DNIT_LOGO = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NDAgMTYwIiB3aWR0aD0iNTQwIiBoZWlnaHQ9IjE2MCI+PHJlY3Qgd2lkdGg9IjU0MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmZmZmYiIHJ4PSI4Ii8+PGcgZmlsbD0iIzFkMzM2ZiI+PHRleHQgeD0iMTAiIHk9IjEyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZm9udC1zaXplPSIxMzIiIGxldHRlci1zcGFjaW5nPSItMyI+RE5JVDwvdGV4dD48dGV4dCB4PSIzNDAiIHk9IjQ2IiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCIgZm9udC1zdHlsZT0iaXRhbGljIiBmb250LXNpemU9IjE5IiBsZXR0ZXItc3BhY2luZz0iMC41Ij5ERVBBUlRBTUVOVE88L3RleHQ+PHRleHQgeD0iMzQwIiB5PSI3MiIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZm9udC1zaXplPSIxOSIgbGV0dGVyLXNwYWNpbmc9IjAuNSI+TkFDSU9OQUwgREU8L3RleHQ+PHRleHQgeD0iMzQwIiB5PSI5OCIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZm9udC1zaXplPSIxOSIgbGV0dGVyLXNwYWNpbmc9IjAuNSI+SU5GUkFFU1RSVVRVUkE8L3RleHQ+PHRleHQgeD0iMzQwIiB5PSIxMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIiBmb250LXN0eWxlPSJpdGFsaWMiIGZvbnQtc2l6ZT0iMTkiIGxldHRlci1zcGFjaW5nPSIwLjUiPkRFIFRSQU5TUE9SVEVTPC90ZXh0PjwvZz48L3N2Zz4=`;

export interface LinearChunkData {
  index: number;
  title: string;
  startKm: number;
  endKm: number;
  segments: Segment20m[];
  executedPercentageTotal: number;
  executedPercentageSub: number;
  executedCount: number;
}

interface LinearReportSheetProps {
  id?: string;
  contract: Contract;
  pageNumber: number;
  totalPages: number;
  chunks: LinearChunkData[];
  services: RoadService[];
  isPavedContract: boolean;
  getFaixaDominioLeColor: (seg: Segment20m) => string;
  getFaixaDominioLdColor: (seg: Segment20m) => string;
  getAcostamentoLeColor: (seg: Segment20m) => string;
  getAcostamentoLdColor: (seg: Segment20m) => string;
  getEixoPistaColor: (seg: Segment20m) => string;
  companyLogoUrl?: string;
  companyName?: string;
  includeTableHeaders?: boolean;
  customCompanyHeader?: boolean;
  className?: string;
  showPageCount?: boolean;
  showSupervisionBadge?: boolean;
  showSubPercentage?: boolean;
}

export const LinearReportSheet: React.FC<LinearReportSheetProps> = ({
  id,
  contract,
  pageNumber,
  totalPages,
  chunks,
  services,
  isPavedContract,
  getFaixaDominioLeColor,
  getFaixaDominioLdColor,
  getAcostamentoLeColor,
  getAcostamentoLdColor,
  getEixoPistaColor,
  companyLogoUrl,
  companyName = 'Consórcio Matupiri',
  includeTableHeaders = true,
  customCompanyHeader = true,
  className = '',
  showPageCount = false,
  showSupervisionBadge = false,
  showSubPercentage = false
}) => {
  // Filtrar serviços por categoria para a legenda do relatório
  const pavedServices = services.filter(s => s.surfaceType === 'Pavimentado' || s.surfaceType === 'Ambos');
  const unpavedServices = services.filter(s => s.surfaceType === 'Não Pavimentado');
  const relevantServices = isPavedContract ? pavedServices : unpavedServices;

  // Garante até 4 sub-trechos por folha
  const displayChunks = chunks.slice(0, 4);

  return (
    <div
      id={id}
      className={`linear-page-sheet bg-white text-slate-900 p-2.5 rounded-none shadow-none border-none w-[1440px] h-[1018px] max-h-[1018px] mx-auto flex flex-col justify-between select-none overflow-hidden print:p-0 print:border-none print:m-0 print:shadow-none ${className}`}
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        width: '1440px',
        height: '1018px',
        maxHeight: '1018px',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. CABEÇALHO INSTITUCIONAL OFICIAL (IDENTICO AO PREVIEW) */}
      <div className="rounded-xl border border-slate-300 shadow-2xs overflow-hidden bg-white text-slate-900 shrink-0" style={{ backgroundColor: '#ffffff' }}>
        {/* Faixa do Título na Cor Roxo Imperial Matupiri (#3b0764) */}
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-3 text-white"
          style={{ backgroundColor: '#3b0764', color: '#ffffff' }}
        >
          {/* Logo do Consórcio Matupiri */}
          <div className="flex items-center space-x-3 shrink-0">
            {companyLogoUrl && !companyLogoUrl.includes('Matupiri') ? (
              <img src={companyLogoUrl} alt={companyName} className="h-9 w-auto object-contain max-w-[150px]" />
            ) : (
              <MatupiriLogo className="h-9 sm:h-10 w-auto shadow-sm" />
            )}
          </div>

          {/* Dados Centrais do Contrato e Rodovia */}
          <div className="text-center flex-1 min-w-[280px]">
            <h1 className="text-sm font-black text-white tracking-wider uppercase font-mono text-center leading-tight" style={{ color: '#ffffff' }}>
              DIAGRAMA LINEAR DE AVANÇO FÍSICO DA RODOVIA — {contract?.highway || 'RODOVIA'} — CONTRATO {contract?.number || ''}
            </h1>
            <p className="text-[10.5px] text-purple-200 font-medium text-center mt-0.5" style={{ color: '#e9d5ff' }}>
              {contract?.executingCompany || 'EMPRESA CONTRATADA'} • EXTENSÃO TOTAL: {contract?.extensionKm} KM (KM {contract?.kmInitial} AO KM {contract?.kmFinal})
            </p>
          </div>

          {/* Logo DNIT e Itens Opcionais */}
          <div className="flex items-center space-x-2 shrink-0 text-right">
            {showSupervisionBadge && (
              <div className="bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800 text-[9.5px] text-purple-200 text-center">
                <span className="font-bold block text-white">CONSORCIO MATUPIRI</span>
                <span className="text-[8.5px] text-purple-300">SUPERVISÃO E FISCALIZAÇÃO</span>
              </div>
            )}

            {showPageCount && (
              <div className="bg-white text-purple-950 px-2 py-0.5 rounded-md border border-purple-200 font-mono font-black text-xs shadow-xs text-center">
                <div>FOLHA {pageNumber}/{totalPages}</div>
                <div className="text-[8px] text-purple-700 font-normal">4 FAIXAS / PÁG</div>
              </div>
            )}

            <img
              src={DEFAULT_DNIT_LOGO}
              alt="DNIT"
              className="h-8.5 w-auto object-contain bg-white p-1 rounded-md border border-purple-800 shadow-xs"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* 2. BARRA DE LEGENDA DOS SERVIÇOS (IDENTICA AO PREVIEW) */}
        {includeTableHeaders && (
          <div className="p-2.5 space-y-1.5 text-xs border-t border-slate-200 bg-white text-slate-800" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
              <div className="flex items-center space-x-2">
                <div className="px-2.5 py-0.5 rounded text-[10px] font-black text-white tracking-wide uppercase border border-purple-900 shrink-0 shadow-xs" style={{ color: '#ffffff', backgroundColor: '#3b0764' }}>
                  SERVIÇOS E LEGENDAS DO DIAGRAMA
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Segmento: <strong>{isPavedContract ? 'Pavimentado (PAV)' : 'Não Pavimentado (NPAV)'}</strong>
              </div>
            </div>

            {/* Grid com Serviços Relevantes + Terreno Natural */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 pt-1 text-left">
              {relevantServices.map((s) => (
                <div
                  key={`leg-${s.id}`}
                  className="flex items-center space-x-1.5 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-900 shadow-2xs w-full"
                  style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}
                >
                  <span className="w-3 h-3 rounded-xs inline-block shrink-0 border border-slate-400" style={{ backgroundColor: s.color }} />
                  <span className="text-[9.5px] font-bold truncate" style={{ color: '#0f172a' }}>{s.name}</span>
                </div>
              ))}
              <div
                className="flex items-center space-x-1.5 px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-900 shadow-2xs w-full"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#78350f' }}
              >
                <span className="w-3 h-3 rounded-xs inline-block shrink-0 border border-amber-700" style={{ backgroundColor: '#fef08a' }} />
                <span className="text-[9.5px] font-bold truncate" style={{ color: '#78350f' }}>Não Executado / Terreno Natural</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CORPO DA PÁGINA: ATÉ 4 FAIXAS (SUB-TRECHOS) PADRONIZADAS */}
      <div className="flex-1 flex flex-col justify-between my-1 space-y-1 overflow-hidden">
        {displayChunks.map((chunk) => {
          const segCount = Math.max(1, chunk.segments.length);
          const segWidthPct = `${(100 / segCount).toFixed(4)}%`;

          return (
            <div
              key={`page-chunk-${chunk.index}`}
              className="linear-chunk-strip bg-white rounded-lg border border-slate-300 shadow-2xs overflow-hidden space-y-1 p-1.5"
              style={{ backgroundColor: '#ffffff' }}
            >
              {/* BARRA DE TÍTULO E AVANÇO DO SUB-TRECHO */}
              <div
                className="flex items-center justify-between px-2.5 py-1 text-white rounded-md border border-purple-900 text-xs"
                style={{ backgroundColor: '#1e1b4b', color: '#ffffff' }}
              >
                <div className="flex items-center space-x-2 font-mono">
                  <span className="px-1.5 py-0.5 bg-purple-700 text-white rounded text-[9.5px] font-black uppercase tracking-wider">
                    FAIXA #{chunk.index}
                  </span>
                  <span className="font-bold text-[10.5px] uppercase text-purple-100">
                    KM {chunk.startKm.toFixed(1).replace('.', ',')} AO KM {chunk.endKm.toFixed(1).replace('.', ',')} ({(chunk.endKm - chunk.startKm).toFixed(1).replace('.', ',')} KM)
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="text-purple-200">
                    Amostragem: <strong>{chunk.segments.length} estacas (20m)</strong>
                  </span>
                  {showSubPercentage && (
                    <span className="px-2 py-0.5 bg-purple-950 text-emerald-300 font-mono font-bold rounded border border-purple-800 shadow-2xs">
                      Avanço Sub-trecho: {chunk.executedPercentageSub}%
                    </span>
                  )}
                </div>
              </div>

              {/* GRID VETORIAL DAS 8 LINHAS (IDENTICO AO PREVIEW) */}
              <div className="estaca-flex flex flex-col w-full min-w-full rounded-lg overflow-hidden border border-slate-300 select-none">
                {/* LINHA 1: ESTACA / KM */}
                <div className="estaca-row flex items-stretch bg-slate-200 text-slate-900 border-b border-slate-300" style={{ backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center font-extrabold text-[10px] text-white uppercase font-mono tracking-wider"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span>ESTACA / KM</span>
                    <span className="text-[8.5px] text-purple-200 font-sans font-normal normal-case leading-none">DNIT • Trecho de 20m</span>
                  </div>
                  <div className="flex flex-1 font-mono text-[8px] h-8 items-center bg-slate-100 w-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                    {chunk.segments.map((seg, sIdx) => {
                      const kmFloat = seg.km;
                      const kmBase = Math.floor(kmFloat + 0.0001);
                      const metersFromKm = Math.round((kmFloat - kmBase) * 1000);
                      const isExactKm = metersFromKm === 0 || metersFromKm === 1000;
                      const isStart = sIdx === 0;

                      return (
                        <div
                          key={`h-km-${seg.id}`}
                          className="estaca-item shrink-0 h-10 flex flex-col items-center justify-center border-r font-mono text-[8px] relative overflow-visible"
                          style={{
                            width: segWidthPct,
                            minWidth: '1px',
                            maxWidth: segWidthPct,
                            flex: `0 0 ${segWidthPct}`,
                            backgroundColor: '#f1f5f9',
                            borderColor: '#cbd5e1'
                          }}
                        >
                          {isExactKm ? (
                            <span
                              className="font-black text-slate-950 text-[8px] px-1 py-0.5 rounded border border-amber-500 shadow-2xs z-10 whitespace-nowrap select-none"
                              style={{
                                backgroundColor: '#fde047',
                                color: '#020617',
                                borderColor: '#d97706',
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                display: 'inline-block'
                              }}
                            >
                              KM {kmBase}
                            </span>
                          ) : isStart ? (
                            <span
                              className="font-extrabold text-white text-[8px] px-1 py-0.5 rounded border border-purple-900 z-10 whitespace-nowrap select-none"
                              style={{
                                backgroundColor: '#7e22ce',
                                color: '#ffffff',
                                borderColor: '#581c87',
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                display: 'inline-block'
                              }}
                            >
                              KM {seg.km.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[7px]" style={{ color: '#94a3b8' }}>|</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LINHA 2: CONTRATADA E EMPRESA */}
                <div className="estaca-row flex items-stretch border-b border-slate-300" style={{ backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex items-center justify-center text-center font-black text-[9.5px] text-white uppercase font-mono"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    CONTRATADA / EMPRESA
                  </div>
                  <div className="flex-1 px-3 py-1 font-black text-[10px] uppercase tracking-wide flex items-center justify-center text-center" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
                    <span>CONTRATO {contract?.number} — {contract?.executingCompany || 'EMPRESA CONTRATADA'}</span>
                  </div>
                </div>

                {/* FAIXA 1: LE FAIXA DE DOMÍNIO */}
                <div className="estaca-row flex items-stretch border-b border-slate-300" style={{ borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center text-white"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[9.5px] tracking-tight uppercase truncate">LE FAIXA DE DOMÍNIO</span>
                    <span className="text-[8px] font-semibold leading-none mt-0.5" style={{ color: '#6ee7b7' }}>Roçada Manual • Drenagem • Limpeza</span>
                  </div>
                  <div className="flex flex-1 w-full overflow-hidden" style={{ backgroundColor: '#fef08a' }}>
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f1-${seg.id}`}
                        className="estaca-item shrink-0 h-5 border-r"
                        style={{
                          backgroundColor: getFaixaDominioLeColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 2: LE ACOSTAMENTO */}
                <div className="estaca-row flex items-stretch border-b border-slate-300" style={{ borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center text-white"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[9.5px] tracking-tight uppercase truncate">LE ACOSTAMENTO</span>
                    <span className="text-[8px] font-semibold leading-none mt-0.5" style={{ color: '#fde047' }}>
                      {isPavedContract ? 'Sub-base BGS • Imprimação • Pintura' : 'Conformação • Regularização'}
                    </span>
                  </div>
                  <div className="flex flex-1 w-full overflow-hidden" style={{ backgroundColor: '#fef08a' }}>
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f2-${seg.id}`}
                        className="estaca-item shrink-0 h-5 border-r"
                        style={{
                          backgroundColor: getAcostamentoLeColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 3: EIXO DA PISTA */}
                <div className="estaca-row flex items-stretch border-b border-slate-300" style={{ borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center text-white"
                    style={{ backgroundColor: '#312e81', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[10px] tracking-tight uppercase" style={{ color: '#fde047' }}>EIXO DA PISTA</span>
                    <span className="text-[8px] font-semibold leading-none mt-0.5" style={{ color: '#e9d5ff' }}>CBUQ • Capa Asfáltica</span>
                  </div>
                  <div className="flex flex-1 relative w-full overflow-hidden" style={{ backgroundColor: '#fef08a' }}>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed pointer-events-none z-10" style={{ borderColor: '#d97706', opacity: 0.8 }} />
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f3-${seg.id}`}
                        className="estaca-item shrink-0 h-6 border-r"
                        style={{
                          backgroundColor: getEixoPistaColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 4: LD ACOSTAMENTO */}
                <div className="estaca-row flex items-stretch border-b border-slate-300" style={{ borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center text-white"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[9.5px] tracking-tight uppercase truncate">LD ACOSTAMENTO</span>
                    <span className="text-[8px] font-semibold leading-none mt-0.5" style={{ color: '#fde047' }}>
                      {isPavedContract ? 'Sub-base BGS • Imprimação • Pintura' : 'Conformação • Regularização'}
                    </span>
                  </div>
                  <div className="flex flex-1 w-full overflow-hidden" style={{ backgroundColor: '#fef08a' }}>
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f4-${seg.id}`}
                        className="estaca-item shrink-0 h-5 border-r"
                        style={{
                          backgroundColor: getAcostamentoLdColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 5: LD FAIXA DE DOMÍNIO */}
                <div className="estaca-row flex items-stretch border-b border-slate-300" style={{ borderColor: '#cbd5e1' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center text-white"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[9.5px] tracking-tight uppercase truncate">LD FAIXA DE DOMÍNIO</span>
                    <span className="text-[8px] font-semibold leading-none mt-0.5" style={{ color: '#6ee7b7' }}>Roçada Manual • Drenagem • Limpeza</span>
                  </div>
                  <div className="flex flex-1 w-full overflow-hidden" style={{ backgroundColor: '#fef08a' }}>
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f5-${seg.id}`}
                        className="estaca-item shrink-0 h-5 border-r"
                        style={{
                          backgroundColor: getFaixaDominioLdColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* LINHA INFERIOR: ESTACAMENTO DNIT (20M) */}
                <div className="estaca-row flex items-stretch" style={{ backgroundColor: '#e2e8f0' }}>
                  <div
                    className="shrink-0 border-r border-slate-600 px-2 py-1 flex flex-col justify-center items-center text-center font-extrabold text-[10px] text-white uppercase font-mono tracking-wider"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', borderColor: '#475569' }}
                  >
                    <span>ESTACAMENTO</span>
                    <span className="text-[8.5px] text-purple-200 font-sans font-normal normal-case leading-none mt-0.5">(DNIT - 20m)</span>
                  </div>
                  <div className="flex flex-1 font-mono text-[8px] h-8 items-center w-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                    {chunk.segments.map((seg, sIdx) => {
                      // Se houver mais de 150 estacas, exibe a cada 5 estacas para manter legibilidade perfeita
                      const showLabel = segCount <= 150 || sIdx % 5 === 0 || sIdx === segCount - 1;

                      return (
                        <div
                          key={`h-est-${seg.id}`}
                          className="estaca-item shrink-0 h-full text-center border-r flex flex-col items-center justify-center font-mono py-0.5"
                          style={{
                            width: segWidthPct,
                            minWidth: '1px',
                            maxWidth: segWidthPct,
                            flex: `0 0 ${segWidthPct}`,
                            borderColor: '#cbd5e1',
                            color: '#0f172a'
                          }}
                        >
                          {showLabel ? (
                            <span
                              className="font-extrabold text-[8px] text-slate-900 tracking-tighter whitespace-nowrap select-none"
                              style={{
                                color: '#0f172a',
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                display: 'inline-block'
                              }}
                            >
                              E-{seg.estaca}
                            </span>
                          ) : (
                            <span className="text-[6.5px]" style={{ color: '#cbd5e1' }}>•</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. RODAPÉ INSTITUCIONAL */}
      <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-500 font-mono shrink-0">
        <div>
          SUPERVISORA: <strong>{contract?.supervisingCompany || 'CONSÓRCIO MATUPIRI'}</strong> • FISCALIZAÇÃO: <strong>DNIT / AM</strong>
        </div>
        <div>
          SCLAF — Sistema de Controle Linear de Avanço Físico • Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

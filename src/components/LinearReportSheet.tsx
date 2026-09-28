import React from 'react';
import { Contract, RoadService, Segment20m } from '../types';
import { MatupiriLogo } from './MatupiriLogo';
import { DnitLogo } from './DnitLogo';

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
  // Filtrar serviços cadastrados estritamente para o contrato selecionado
  const contractServices = React.useMemo(() => {
    if (!contract) return services;
    const direct = services.filter(s => s.contractId === contract.id);
    if (direct.length > 0) return direct;
    return services.filter(s => !s.contractId || s.contractId === 'ALL' || s.contractId === contract.id);
  }, [services, contract]);

  const relevantServices = React.useMemo(() => {
    const list = contractServices.filter(s => {
      if (isPavedContract) {
        return s.surfaceType === 'Pavimentado' || s.surfaceType === 'Ambos' || !s.surfaceType;
      } else {
        return s.surfaceType === 'Não Pavimentado' || s.surfaceType === 'Ambos' || !s.surfaceType;
      }
    });
    return list.length > 0 ? list : contractServices;
  }, [contractServices, isPavedContract]);

  // Garante até 4 sub-trechos por folha
  const displayChunks = chunks.slice(0, 4);

  return (
    <div
      id={id}
      className={`linear-page-sheet bg-white text-slate-900 p-1.5 rounded-none shadow-none border-none w-[1440px] min-h-[1018px] max-h-[1018px] mx-auto flex flex-col justify-between select-none print:p-0 print:border-none print:m-0 print:shadow-none print:max-h-none ${className}`}
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        width: '1440px',
        minHeight: '1018px',
        maxHeight: '1018px',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. CABEÇALHO INSTITUCIONAL OFICIAL (IDENTICO AO PREVIEW) */}
      <div className="rounded-xl border border-slate-300 shadow-2xs overflow-hidden bg-white text-slate-900 shrink-0" style={{ backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
        {/* Faixa do Título na Cor Roxo Imperial Matupiri (#3b0764) */}
        <div
          className="px-3 py-1 flex items-center justify-between gap-3 text-white"
          style={{ backgroundColor: '#3b0764', color: '#ffffff' }}
        >
          {/* Logo do Consórcio Matupiri */}
          <div className="flex items-center space-x-2 shrink-0">
            {companyLogoUrl && !companyLogoUrl.includes('Matupiri') ? (
              <img src={companyLogoUrl} alt={companyName} className="h-7 w-auto object-contain max-w-[130px]" />
            ) : (
              <MatupiriLogo className="h-7 w-auto shadow-sm" />
            )}
          </div>

          {/* Dados Centrais do Contrato e Rodovia */}
          <div className="text-center flex-1 min-w-[280px]">
            <h1 className="text-[11px] font-black text-white tracking-wider uppercase font-mono text-center leading-tight" style={{ color: '#ffffff' }}>
              DIAGRAMA LINEAR DE AVANÇO FÍSICO DA RODOVIA — {contract?.highway || 'RODOVIA'} — CONTRATO {contract?.number || ''}
            </h1>
            <p className="text-[9px] text-purple-200 font-medium text-center mt-0.5" style={{ color: '#e9d5ff' }}>
              {contract?.executingCompany || 'EMPRESA CONTRATADA'} • EXTENSÃO TOTAL: {contract?.extensionKm} KM (KM {contract?.kmInitial} AO KM {contract?.kmFinal})
            </p>
          </div>

          {/* Logo DNIT e Itens Opcionais */}
          <div className="flex items-center space-x-2 shrink-0 text-right">
            {showSupervisionBadge && (
              <div className="bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-800 text-[8.5px] text-purple-200 text-center">
                <span className="font-bold block text-white">CONSORCIO MATUPIRI</span>
                <span className="text-[7.5px] text-purple-300">SUPERVISÃO E FISCALIZAÇÃO</span>
              </div>
            )}

            {showPageCount && (
              <div className="bg-white text-purple-950 px-2 py-0.5 rounded-md border border-purple-200 font-mono font-black text-[10px] shadow-xs text-center">
                <div>FOLHA {pageNumber}/{totalPages}</div>
                <div className="text-[7px] text-purple-700 font-normal">4 FAIXAS / PÁG</div>
              </div>
            )}

            <DnitLogo className="h-7 w-auto shadow-xs" />
          </div>
        </div>

        {/* 2. BARRA DE LEGENDA DOS SERVIÇOS (IDENTICA AO PREVIEW) */}
        {includeTableHeaders && (
          <div className="px-2 py-0.5 space-y-0.5 text-xs border-t border-slate-200 bg-white text-slate-800" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-0.5">
              <div className="flex items-center space-x-2">
                <div className="px-2 py-0.2 rounded text-[9px] font-black text-white tracking-wide uppercase border border-purple-900 shrink-0 shadow-xs" style={{ color: '#ffffff', backgroundColor: '#3b0764' }}>
                  LEGENDAS:
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                Segmento: <strong>{isPavedContract ? 'Pavimentado (PAV)' : 'Não Pavimentado (NPAV)'}</strong>
              </div>
            </div>

            {/* Grid com Serviços Relevantes do Contrato + Terreno Natural */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 pt-0.5 text-left">
              {relevantServices.map((s) => (
                <div
                  key={`leg-${s.id}`}
                  className="flex items-center space-x-1 px-1.5 py-0.2 rounded border border-slate-200 bg-slate-50 text-slate-900 shadow-2xs w-full"
                  style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}
                >
                  <span className="w-2 h-2 rounded-xs inline-block shrink-0 border border-slate-400" style={{ backgroundColor: s.color }} />
                  <span className="text-[8.5px] font-bold truncate" style={{ color: '#0f172a' }}>{s.name}</span>
                </div>
              ))}
              <div
                className="flex items-center space-x-1 px-1.5 py-0.2 rounded border border-amber-200 bg-amber-50 text-amber-900 shadow-2xs w-full"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#78350f' }}
              >
                <span className="w-2 h-2 rounded-xs inline-block shrink-0 border border-amber-700" style={{ backgroundColor: '#fef08a' }} />
                <span className="text-[8.5px] font-bold truncate" style={{ color: '#78350f' }}>Não Executado / Terreno Natural</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CORPO DA PÁGINA: ATÉ 4 FAIXAS (SUB-TRECHOS) PADRONIZADAS */}
      <div className="flex-1 flex flex-col justify-start space-y-1 my-0.5" style={{ width: '100%', boxSizing: 'border-box' }}>
        {displayChunks.map((chunk) => {
          const segCount = Math.max(1, chunk.segments.length);
          const segWidthPct = `${(100 / segCount).toFixed(4)}%`;
          const kmStep = segCount <= 100 ? 1 : segCount <= 250 ? 2 : segCount <= 500 ? 5 : 10;
          const estacaStep = segCount <= 60 ? 1 : segCount <= 150 ? 5 : segCount <= 300 ? 10 : 25;

          return (
            <div
              key={`page-chunk-${chunk.index}`}
              className="linear-chunk-strip bg-white rounded-lg border border-slate-300 shadow-2xs space-y-0.5 p-1 shrink-0"
              style={{ backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box' }}
            >
              {/* BARRA DE TÍTULO E AVANÇO DO SUB-TRECHO */}
              <div
                className="flex items-center justify-between px-2 py-0.5 text-white rounded border border-purple-900 text-xs"
                style={{ backgroundColor: '#1e1b4b', color: '#ffffff' }}
              >
                <div className="flex items-center space-x-1.5 font-mono">
                  <span className="px-1.5 py-0.2 bg-purple-700 text-white rounded text-[8.5px] font-black uppercase tracking-wider">
                    FAIXA #{chunk.index}
                  </span>
                  <span className="font-bold text-[9.5px] uppercase text-purple-100">
                    KM {chunk.startKm.toFixed(1).replace('.', ',')} AO KM {chunk.endKm.toFixed(1).replace('.', ',')} ({(chunk.endKm - chunk.startKm).toFixed(1).replace('.', ',')} KM)
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[9px]">
                  <span className="text-purple-200">
                    Amostragem: <strong>{chunk.segments.length} estacas (20m)</strong>
                  </span>
                  {showSubPercentage && (
                    <span className="px-1.5 py-0.2 bg-purple-950 text-emerald-300 font-mono font-bold rounded border border-purple-800 shadow-2xs">
                      Avanço Sub-trecho: {chunk.executedPercentageSub}%
                    </span>
                  )}
                </div>
              </div>

              {/* GRID VETORIAL DAS 8 LINHAS (TODAS AS FAIXAS DA RODOVIA INCLUINDO LD E ESTACAMENTO) */}
              <div
                className="estaca-flex flex flex-col w-full rounded border border-slate-300 select-none overflow-hidden"
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                {/* LINHA 1: ESTACA / KM */}
                <div
                  className="estaca-row flex items-stretch bg-slate-200 text-slate-900 border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1 py-0.5 flex flex-col justify-center items-center text-center font-extrabold text-[8.5px] text-white uppercase font-mono tracking-wider h-[22px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span>ESTACA / KM</span>
                    <span className="text-[7px] text-purple-200 font-sans font-normal normal-case leading-none">DNIT • Trecho de 20m</span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 font-mono text-[7px] h-[22px] items-center bg-slate-100 overflow-hidden"
                    style={{ backgroundColor: '#f1f5f9', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    {chunk.segments.map((seg, sIdx) => {
                      const kmFloat = seg.km;
                      const kmBase = Math.floor(kmFloat + 0.0001);
                      const metersFromKm = Math.round((kmFloat - kmBase) * 1000);
                      const isExactKm = metersFromKm === 0 || metersFromKm === 1000;
                      const isStart = sIdx === 0;
                      const isEnd = sIdx === segCount - 1;
                      const showKmBadge = (isExactKm && kmBase % kmStep === 0) || isStart || isEnd;

                      return (
                        <div
                          key={`h-km-${seg.id}`}
                          className="estaca-item shrink-0 h-[22px] flex flex-col items-center justify-center border-r font-mono text-[7px] relative overflow-visible"
                          style={{
                            width: segWidthPct,
                            minWidth: '1px',
                            maxWidth: segWidthPct,
                            flex: `0 0 ${segWidthPct}`,
                            boxSizing: 'border-box',
                            backgroundColor: '#f1f5f9',
                            borderColor: '#cbd5e1'
                          }}
                        >
                          {showKmBadge && isExactKm ? (
                            <span
                              className="font-black text-slate-950 text-[7px] px-0.5 py-0.2 rounded border border-amber-500 shadow-2xs z-10 whitespace-nowrap select-none"
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
                          ) : showKmBadge && isStart ? (
                            <span
                              className="font-extrabold text-white text-[7px] px-0.5 py-0.2 rounded border border-purple-900 z-10 whitespace-nowrap select-none"
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
                            <span className="text-[6px]" style={{ color: '#94a3b8' }}>|</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LINHA 2: CONTRATADA E EMPRESA */}
                <div
                  className="estaca-row flex items-stretch border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1 py-0.5 flex items-center justify-center text-center font-bold text-[8px] text-white uppercase font-mono h-[16px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    CONTRATADA / EMPRESA
                  </div>
                  <div
                    className="flex-1 min-w-0 px-2 py-0.5 font-bold text-[8.5px] uppercase tracking-wide flex items-center justify-center text-center overflow-hidden h-[16px]"
                    style={{ backgroundColor: '#f8fafc', color: '#0f172a', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', boxSizing: 'border-box' }}
                  >
                    <span className="truncate">CONTRATO {contract?.number} — {contract?.executingCompany || 'EMPRESA CONTRATADA'}</span>
                  </div>
                </div>

                {/* FAIXA 1: LE FAIXA DE DOMÍNIO */}
                <div
                  className="estaca-row flex items-stretch border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1.5 py-0.5 flex flex-col justify-center items-center text-center text-white h-[16px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[8px] tracking-tight uppercase truncate">LE FAIXA DE DOMÍNIO</span>
                    <span className="text-[6px] font-semibold leading-none text-emerald-300">Roçada Manual • Drenagem • Limpeza</span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 overflow-hidden h-[16px]"
                    style={{ backgroundColor: '#fef08a', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f1-${seg.id}`}
                        className="estaca-item shrink-0 h-[16px] border-r"
                        style={{
                          backgroundColor: getFaixaDominioLeColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          boxSizing: 'border-box',
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 2: LE ACOSTAMENTO */}
                <div
                  className="estaca-row flex items-stretch border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1.5 py-0.5 flex flex-col justify-center items-center text-center text-white h-[16px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[8px] tracking-tight uppercase truncate">LE ACOSTAMENTO</span>
                    <span className="text-[6px] font-semibold leading-none text-amber-300">
                      {isPavedContract ? 'Sub-base BGS • Imprimação • Pintura' : 'Conformação • Regularização'}
                    </span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 overflow-hidden h-[16px]"
                    style={{ backgroundColor: '#fef08a', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f2-${seg.id}`}
                        className="estaca-item shrink-0 h-[16px] border-r"
                        style={{
                          backgroundColor: getAcostamentoLeColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          boxSizing: 'border-box',
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 3: EIXO DA PISTA */}
                <div
                  className="estaca-row flex items-stretch border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1.5 py-0.5 flex flex-col justify-center items-center text-center text-white h-[18px]"
                    style={{ backgroundColor: '#312e81', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[8.5px] tracking-tight uppercase" style={{ color: '#fde047' }}>EIXO DA PISTA</span>
                    <span className="text-[6px] font-semibold leading-none text-purple-200">CBUQ • Capa Asfáltica</span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 relative overflow-hidden h-[18px]"
                    style={{ backgroundColor: '#fef08a', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed pointer-events-none z-10" style={{ borderColor: '#d97706', opacity: 0.8 }} />
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f3-${seg.id}`}
                        className="estaca-item shrink-0 h-[18px] border-r"
                        style={{
                          backgroundColor: getEixoPistaColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          boxSizing: 'border-box',
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 4: LD ACOSTAMENTO */}
                <div
                  className="estaca-row flex items-stretch border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1.5 py-0.5 flex flex-col justify-center items-center text-center text-white h-[16px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[8px] tracking-tight uppercase truncate">LD ACOSTAMENTO</span>
                    <span className="text-[6px] font-semibold leading-none text-amber-300">
                      {isPavedContract ? 'Sub-base BGS • Imprimação • Pintura' : 'Conformação • Regularização'}
                    </span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 overflow-hidden h-[16px]"
                    style={{ backgroundColor: '#fef08a', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f4-${seg.id}`}
                        className="estaca-item shrink-0 h-[16px] border-r"
                        style={{
                          backgroundColor: getAcostamentoLdColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          boxSizing: 'border-box',
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* FAIXA 5: LD FAIXA DE DOMÍNIO */}
                <div
                  className="estaca-row flex items-stretch border-b border-slate-300"
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: '#cbd5e1' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1.5 py-0.5 flex flex-col justify-center items-center text-center text-white h-[16px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span className="font-extrabold text-[8px] tracking-tight uppercase truncate">LD FAIXA DE DOMÍNIO</span>
                    <span className="text-[6px] font-semibold leading-none text-emerald-300">Roçada Manual • Drenagem • Limpeza</span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 overflow-hidden h-[16px]"
                    style={{ backgroundColor: '#fef08a', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    {chunk.segments.map((seg) => (
                      <div
                        key={`r-f5-${seg.id}`}
                        className="estaca-item shrink-0 h-[16px] border-r"
                        style={{
                          backgroundColor: getFaixaDominioLdColor(seg) || '#fef08a',
                          width: segWidthPct,
                          minWidth: '1px',
                          maxWidth: segWidthPct,
                          flex: `0 0 ${segWidthPct}`,
                          boxSizing: 'border-box',
                          borderColor: '#cbd5e1'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* LINHA INFERIOR: ESTACAMENTO DNIT (20M) */}
                <div
                  className="estaca-row flex items-stretch"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#e2e8f0' }}
                >
                  <div
                    className="shrink-0 border-r border-slate-600 px-1 py-0.5 flex flex-col justify-center items-center text-center font-extrabold text-[8.5px] text-white uppercase font-mono tracking-wider h-[24px]"
                    style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px', maxWidth: '220px', flex: '0 0 220px', boxSizing: 'border-box', borderColor: '#475569' }}
                  >
                    <span>ESTACAMENTO</span>
                    <span className="text-[7px] text-purple-200 font-sans font-normal normal-case leading-none mt-0.5">(DNIT - 20m)</span>
                  </div>
                  <div
                    className="flex flex-1 min-w-0 font-mono text-[7px] h-[24px] items-center overflow-hidden"
                    style={{ backgroundColor: '#f1f5f9', width: 'calc(100% - 220px)', maxWidth: 'calc(100% - 220px)', flex: '1 1 0%', minWidth: 0, boxSizing: 'border-box' }}
                  >
                    {chunk.segments.map((seg, sIdx) => {
                      const showLabel = sIdx % estacaStep === 0 || sIdx === segCount - 1;

                      return (
                        <div
                          key={`h-est-${seg.id}`}
                          className="estaca-item shrink-0 h-[24px] text-center border-r flex flex-col items-center justify-center font-mono py-0.2"
                          style={{
                            width: segWidthPct,
                            minWidth: '1px',
                            maxWidth: segWidthPct,
                            flex: `0 0 ${segWidthPct}`,
                            boxSizing: 'border-box',
                            borderColor: '#cbd5e1',
                            color: '#0f172a'
                          }}
                        >
                          {showLabel ? (
                            <span
                              className="font-extrabold text-[7px] text-slate-900 tracking-tighter whitespace-nowrap select-none"
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
                            <span className="text-[5.5px]" style={{ color: '#cbd5e1' }}>•</span>
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
      <div className="pt-0.5 border-t border-slate-200 flex items-center justify-between text-[7.5px] text-slate-500 font-mono shrink-0">
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

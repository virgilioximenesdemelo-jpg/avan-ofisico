import React from 'react';
import { FichaDeCampoRecord } from '../types';
import { MatupiriLogo } from './MatupiriLogo';
import { DEFAULT_MATUPIRI_LOGO } from '../services/db';

const DEFAULT_DNIT_LOGO = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NDAgMTYwIiB3aWR0aD0iNTQwIiBoZWlnaHQ9IjE2MCI+PHJlY3Qgd2lkdGg9IjU0MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmZmZmZmYiIHJ4PSI4Ii8+PGcgZmlsbD0iIzFkMzM2ZiI+PHRleHQgeD0iMTAiIHk9IjEyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZm9udC1zaXplPSIxMzIiIGxldHRlci1zcGFjaW5nPSItMyI+RE5JVDwvdGV4dD48dGV4dCB4PSIzNDAiIHk9IjQ2IiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCIgZm9udC1zdHlsZT0iaXRhbGljIiBmb250LXNpemU9IjE5IiBsZXR0ZXItc3BhY2luZz0iMC41Ij5ERVBBUlRBTUVOVE88L3RleHQ+PHRleHQgeD0iMzQwIiB5PSI3MiIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZm9udC1zaXplPSIxOSIgbGV0dGVyLXNwYWNpbmc9IjAuNSI+TkFDSU9OQUwgREU8L3RleHQ+PHRleHQgeD0iMzQwIiB5PSI5OCIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZm9udC1zaXplPSIxOSIgbGV0dGVyLXNwYWNpbmc9IjAuNSI+SU5GUkFFU1RSVVRVUkE8L3RleHQ+PHRleHQgeD0iMzQwIiB5PSIxMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iNzAwIiBmb250LXN0eWxlPSJpdGFsaWMiIGZvbnQtc2l6ZT0iMTkiIGxldHRlci1zcGFjaW5nPSIwLjUiPkRFIFRSQU5TUE9SVEVTPC90ZXh0PjwvZz48L3N2Zz4=`;

interface FichaDeCampoDocumentProps {
  ficha: FichaDeCampoRecord;
  companyLogoUrl?: string;
  companyName?: string;
  dnitLogoUrl?: string;
  includeTableHeaders?: boolean;
  pageBreakAfterEvery4thItem?: boolean;
  customCompanyHeader?: boolean;
}

export const FichaDeCampoDocument: React.FC<FichaDeCampoDocumentProps> = ({
  ficha,
  companyLogoUrl,
  companyName = 'Consórcio Matupiri',
  dnitLogoUrl,
  includeTableHeaders = true,
  pageBreakAfterEvery4thItem = true,
  customCompanyHeader = true
}) => {
  // Se pageBreakAfterEvery4thItem estiver ativado, agrupar atividades em blocos de 4 itens
  const activityChunks = React.useMemo(() => {
    const acts = ficha.activities || [];
    if (!pageBreakAfterEvery4thItem || acts.length <= 4) {
      return [acts];
    }
    const chunks: typeof acts[] = [];
    for (let i = 0; i < acts.length; i += 4) {
      chunks.push(acts.slice(i, i + 4));
    }
    return chunks;
  }, [ficha.activities, pageBreakAfterEvery4thItem]);

  return (
    <div className="bg-white text-slate-900 font-sans max-w-4xl mx-auto p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200 rounded-2xl print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-xs">
      {/* PÁGINA 1 */}
      <div className="space-y-5">
        {/* Cabeçalho com Logos */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-4">
          {/* Logo da Supervisora / Consórcio (Esquerda) - Custom Company Header */}
          {customCompanyHeader ? (
            <div className="flex items-center space-x-3">
              {companyLogoUrl && companyLogoUrl !== DEFAULT_MATUPIRI_LOGO && !companyLogoUrl.includes('Matupiri') ? (
                <img
                  src={companyLogoUrl}
                  alt={companyName}
                  className="h-14 w-auto object-contain max-w-[220px]"
                />
              ) : (
                <MatupiriLogo className="h-14 w-auto" />
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs">
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">
                SUPERVISÃO OFICIAL DNIT
              </span>
            </div>
          )}

          {/* Logo Oficial DNIT (Direita) */}
          <div className="flex items-center justify-end shrink-0">
            <img
              src={dnitLogoUrl || DEFAULT_DNIT_LOGO}
              alt="DNIT - Departamento Nacional de Infraestrutura de Transportes"
              className="h-12 sm:h-14 w-auto object-contain max-w-[220px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Banner do Título */}
        <div className="bg-[#4a0e4e] text-white py-2.5 px-4 rounded-xl text-center shadow-sm">
          <h1 className="text-sm sm:text-base font-black tracking-wide uppercase">
            FICHA DE CAMPO - DIÁRIO DE OBRAS
          </h1>
        </div>

        {/* Informações Gerais */}
        <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <h2 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-1">
            INFORMAÇÕES GERAIS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs">
            <div className="flex">
              <span className="font-bold text-slate-900 w-36 shrink-0">Contrato:</span>
              <span className="font-mono font-bold text-slate-800">{ficha.contractNumber}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-slate-900 w-36 shrink-0">Empresa Executora:</span>
              <span className="text-slate-800 truncate">{ficha.executingCompany}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-slate-900 w-36 shrink-0">Supervisora:</span>
              <span className="text-slate-800">{customCompanyHeader ? (ficha.supervisingCompany || companyName) : 'Supervisão Regional DNIT'}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-slate-900 w-36 shrink-0">Data:</span>
              <span className="font-mono text-slate-800">{ficha.date}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-slate-900 w-36 shrink-0">Condição Climática:</span>
              <span className="text-slate-800">{ficha.weatherCondition}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-slate-900 w-36 shrink-0">Técnico Responsável:</span>
              <span className="text-slate-800 font-semibold">{ficha.responsibleTech}</span>
            </div>
          </div>
        </div>

        {/* Equipamentos em Serviço */}
        <div className="space-y-2">
          <div className="inline-block bg-[#f3e8ff] text-[#4a0e4e] px-3 py-1 rounded-md font-black text-xs uppercase tracking-wider border border-[#e9d5ff]">
            EQUIPAMENTOS EM SERVIÇO
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-900 text-xs border-collapse">
              {includeTableHeaders && (
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 font-black text-slate-900">
                    <th className="p-2 border-r border-slate-900">Tipo</th>
                    <th className="p-2 text-center w-32">Quantidade</th>
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-900">
                {ficha.equipments && ficha.equipments.length > 0 ? (
                  ficha.equipments.map((eq, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-900 font-medium">{eq.type}</td>
                      <td className="p-2 text-center font-bold font-mono">{eq.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-2 text-slate-500 italic text-center">Nenhum equipamento registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Atividades em Execução */}
        <div className="space-y-2">
          <div className="inline-block bg-[#f3e8ff] text-[#4a0e4e] px-3 py-1 rounded-md font-black text-xs uppercase tracking-wider border border-[#e9d5ff]">
            ATIVIDADES EM EXECUÇÃO
          </div>
          <div className="space-y-3">
            {activityChunks.map((actGroup, chunkIndex) => (
              <div
                key={`act-chunk-${chunkIndex}`}
                className={`overflow-x-auto ${chunkIndex > 0 && pageBreakAfterEvery4thItem ? 'break-before-page print:break-before-page pt-4 border-t-2 border-dashed border-slate-300' : ''}`}
              >
                <table className="w-full text-left border border-slate-900 text-xs border-collapse">
                  {includeTableHeaders && (
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-900 font-black text-slate-900">
                        <th className="p-2 border-r border-slate-900">Atividade</th>
                        <th className="p-2 border-r border-slate-900 text-center w-28">KM Inicial</th>
                        <th className="p-2 border-r border-slate-900 text-center w-28">KM Final</th>
                        <th className="p-2 text-center w-32">Extensão (km)</th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-900">
                    {actGroup && actGroup.length > 0 ? (
                      actGroup.map((act, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-900 font-medium">{act.activity}</td>
                          <td className="p-2 border-r border-slate-900 text-center font-mono">{act.kmInitial.toFixed(2)}</td>
                          <td className="p-2 border-r border-slate-900 text-center font-mono">{act.kmFinal.toFixed(2)}</td>
                          <td className="p-2 text-center font-bold font-mono">{act.extensionKm.toFixed(3)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-2 text-slate-500 italic text-center">Nenhuma atividade física lançada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Ocorrências */}
        <div className="space-y-1.5">
          <div className="inline-block bg-[#f3e8ff] text-[#4a0e4e] px-3 py-1 rounded-md font-black text-xs uppercase tracking-wider border border-[#e9d5ff]">
            OCORRÊNCIAS
          </div>
          <div className="p-2.5 border border-slate-300 rounded-lg bg-slate-50/30 text-slate-800 text-xs font-medium min-h-[38px]">
            {ficha.occurrences || 'Nenhuma ocorrência registrada'}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <div className="inline-block bg-[#f3e8ff] text-[#4a0e4e] px-3 py-1 rounded-md font-black text-xs uppercase tracking-wider border border-[#e9d5ff]">
            OBSERVAÇÕES
          </div>
          <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/30 text-slate-800 text-xs leading-relaxed font-normal whitespace-pre-wrap">
            {ficha.observations || 'Sem observações adicionais para este relatório.'}
          </div>
        </div>

        {/* Rodapé da Página 1 */}
        <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div>Gerado em: {ficha.generatedAt || `${ficha.date} 12:00`}</div>
          <div className="font-bold text-slate-700">
            {ficha.kmReference || 'KM 386.92'} — Página 1 de 1
          </div>
          <div>{customCompanyHeader ? (ficha.pageInfo || `${ficha.supervisingCompany || companyName} - DNIT/AM`) : 'DNIT/AM — Diretoria de Infraestrutura'}</div>
        </div>
      </div>
    </div>
  );
};

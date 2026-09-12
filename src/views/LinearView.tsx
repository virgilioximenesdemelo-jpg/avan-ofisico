/**
 * SCLAF — Motor Linear de Avanço Físico (Segmentos de 20m)
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { db } from '../services/db';
import { Contract, Segment20m, RoadService, ExecutionRecord } from '../types';
import { SegmentDetailModal } from '../components/SegmentDetailModal';
import { MatupiriLogo } from '../components/MatupiriLogo';
import { LinearReportSheet, LinearChunkData } from '../components/LinearReportSheet';
import { cleanClonedDocForPdfExport, installCanvasPatternSafeguard } from '../services/pdfExport';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Filter,
  Layers,
  Info,
  Calendar,
  Camera,
  Award,
  ChevronLeft,
  ChevronRight,
  GitCommitHorizontal,
  Download,
  Printer,
  RefreshCw,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';

interface LinearViewProps {
  activeContractId: string;
}

export const LinearView: React.FC<LinearViewProps> = ({ activeContractId }) => {
  const contracts = db.getContracts();
  const services = db.getServices();

  // Se o filtro global for ALL, escolhe o primeiro contrato ou o selecionado
  const selectedContract = useMemo(() => {
    if (activeContractId && activeContractId !== 'ALL') {
      return contracts.find(c => c.id === activeContractId) || contracts[0];
    }
    return contracts[0];
  }, [activeContractId, contracts]);

  const [currentContractId, setCurrentContractId] = useState<string>(selectedContract ? selectedContract.id : '');
  
  useEffect(() => {
    if (selectedContract) {
      setCurrentContractId(selectedContract.id);
      setSelectedChunkIndex('ALL');
    }
  }, [selectedContract]);

  const activeContract = contracts.find(c => c.id === currentContractId) || selectedContract;

  // Gerar sub-segmentos de 20 metros para o contrato ativo
  const segments = useMemo(() => {
    if (!activeContract) return [];
    return db.generateSegmentsForContract(activeContract.id);
  }, [activeContract]);

  // Controles de Visualização / Zoom e Divisão em Sub-trechos (2 km)
  const [zoomLevel, setZoomLevel] = useState<number>(2); // 1 = Compacto, 2 = Normal, 3 = Detalhado, 4 = Perto (20m expandido)
  const [chunkSizeKm, setChunkSizeKm] = useState<number>(2); // Padrão: 2 km por segmento
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<string>('ALL'); // 'ALL' ou o número do sub-trecho
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedSegId, setHighlightedSegId] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<Segment20m | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment20m | null>(null);

  // Classificação da Superfície do Contrato (Pavimentado vs Não Pavimentado)
  const isPavedContract = useMemo(() => {
    if (!activeContract) return true;
    return ['CBUQ', 'Concreto Rígido', 'TSU/TSD'].includes(activeContract.surfaceType);
  }, [activeContract]);

  // Modo de Exibição das Legendas ('AUTO' | 'PAV' | 'NPAV' | 'SEPARADO')
  const [legendFilterMode, setLegendFilterMode] = useState<'AUTO' | 'PAV' | 'NPAV' | 'SEPARADO'>('SEPARADO');

  // Serviços Filtrados por Tipo de Superfície
  const pavedServices = useMemo(() => {
    return services.filter(s => {
      const st = s.surfaceType as string | undefined;
      if (st === 'Pavimentado' || st === 'PAV' || st === 'Ambos') return true;
      if (st === 'Não Pavimentado' || st === 'NPAV') return false;
      const nameLower = s.name.toLowerCase();
      return (
        nameLower.includes('cbuq') ||
        nameLower.includes('bgs') ||
        nameLower.includes('sub-base') ||
        nameLower.includes('imprimação') ||
        nameLower.includes('pintura') ||
        nameLower.includes('microrrevestimento') ||
        nameLower.includes('sinalização') ||
        nameLower.includes('limpeza') ||
        nameLower.includes('roçada') ||
        s.category === 'Pavimentação' ||
        s.category === 'Sinalização' ||
        !st
      );
    });
  }, [services]);

  const unpavedServices = useMemo(() => {
    return services.filter(s => {
      const st = s.surfaceType as string | undefined;
      if (st === 'Não Pavimentado' || st === 'NPAV' || st === 'Ambos') return true;
      if (st === 'Pavimentado' || st === 'PAV') return false;
      const nameLower = s.name.toLowerCase();
      return (
        nameLower.includes('revestimento') ||
        nameLower.includes('cascalh') ||
        nameLower.includes('patrol') ||
        nameLower.includes('escarifica') ||
        nameLower.includes('limpeza') ||
        nameLower.includes('roçada') ||
        nameLower.includes('rocada') ||
        nameLower.includes('terraplenagem') ||
        nameLower.includes('drenagem') ||
        s.category === 'Conservação' ||
        s.category === 'Terraplenagem'
      );
    });
  }, [services]);

  // Helper: Identifica se um serviço pertence estritamente à Faixa de Domínio (Limpeza, Roçada, Drenagem, Conservação)
  const isFaixaDeDominioService = (s: { category?: string; name: string } | undefined): boolean => {
    if (!s) return false;
    const nameLower = s.name.toLowerCase();
    
    // Serviços de pista/pavimento/estrutura JAMAIS devem ser tratados como Faixa de Domínio
    if (
      nameLower.includes('revestimento primário') ||
      nameLower.includes('revestimento primario') ||
      nameLower.includes('cascalhamento') ||
      nameLower.includes('cascalho') ||
      nameLower.includes('cbuq') ||
      nameLower.includes('bgs') ||
      nameLower.includes('sub-base') ||
      nameLower.includes('base') ||
      nameLower.includes('imprimação') ||
      nameLower.includes('pintura de ligação') ||
      nameLower.includes('terraplenagem') ||
      nameLower.includes('subleito') ||
      nameLower.includes('patrolamento') ||
      nameLower.includes('escarificação') ||
      nameLower.includes('concreto') ||
      nameLower.includes('microrrevestimento')
    ) {
      return false;
    }

    if (s.category === 'Conservação' || s.category === 'Drenagem') {
      return true;
    }

    return (
      nameLower.includes('limpeza') ||
      nameLower.includes('roçada') ||
      nameLower.includes('rocada') ||
      nameLower.includes('capina') ||
      nameLower.includes('desmate') ||
      nameLower.includes('drenagem') ||
      nameLower.includes('drenante') ||
      nameLower.includes('remoção') ||
      nameLower.includes('remocao') ||
      nameLower.includes('faixa de domínio') ||
      nameLower.includes('faixa de dominio') ||
      nameLower.includes('sarjeta') ||
      nameLower.includes('valeta') ||
      nameLower.includes('bueiro') ||
      nameLower.includes('direção')
    );
  };

  // Helper para obter a execução mais recente (último serviço lançado/executado)
  const getLatestExec = (execs: ExecutionRecord[]) => {
    if (execs.length === 0) return undefined;
    return [...execs].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date).getTime() || 0;
      const timeB = new Date(b.createdAt || b.date).getTime() || 0;
      if (timeB !== timeA) return timeB - timeA;
      return b.id.localeCompare(a.id);
    })[0];
  };

  // Helper: Cor para Faixa de Domínio LE (Somente limpeza, drenagem, roçada)
  const getFaixaDominioLeColor = (seg: Segment20m): string => {
    const fdExecs = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      if (!isFaixaDeDominioService(s)) return false;
      const d = e.direction;
      return d === 'Decrescente' || d === 'Pista Dupla Esq' || d === 'Lado Esquerdo' || d === 'Eixo Central' || d === 'Ambos os Lados';
    });
    const latestExec = getLatestExec(fdExecs);
    if (latestExec) {
      const s = services.find(srv => srv.id === latestExec.serviceId);
      return s ? s.color : '#fef08a';
    }
    return '#fef08a'; // Terreno Natural (Não executado)
  };

  // Helper: Cor para Faixa de Domínio LD (Somente limpeza, drenagem, roçada)
  const getFaixaDominioLdColor = (seg: Segment20m): string => {
    const fdExecs = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      if (!isFaixaDeDominioService(s)) return false;
      const d = e.direction;
      return d === 'Crescente' || d === 'Pista Dupla Dir' || d === 'Lado Direito' || d === 'Eixo Central' || d === 'Ambos os Lados';
    });
    const latestExec = getLatestExec(fdExecs);
    if (latestExec) {
      const s = services.find(srv => srv.id === latestExec.serviceId);
      return s ? s.color : '#fef08a';
    }
    return '#fef08a'; // Terreno Natural (Não executado)
  };

  // Helper: Cor para Acostamento LE (Serviços de Pista / Pavimentação / NPAV no Lado Esquerdo)
  const getAcostamentoLeColor = (seg: Segment20m): string => {
    const execsLe = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      if (isFaixaDeDominioService(s)) return false;
      const d = e.direction;
      return d === 'Decrescente' || d === 'Pista Dupla Esq' || d === 'Lado Esquerdo';
    });
    const latestLe = getLatestExec(execsLe);
    if (latestLe) {
      const s = services.find(srv => srv.id === latestLe.serviceId);
      return s ? s.color : '#fef08a';
    }
    const execsAmbos = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      if (isFaixaDeDominioService(s)) return false;
      const d = e.direction;
      return d === 'Eixo Central' || d === 'Ambos os Lados' || !d;
    });
    const latestAmbos = getLatestExec(execsAmbos);
    if (latestAmbos) {
      const s = services.find(srv => srv.id === latestAmbos.serviceId);
      return s ? s.color : '#fef08a';
    }
    return '#fef08a';
  };

  // Helper: Cor para Acostamento LD (Serviços de Pista / Pavimentação / NPAV no Lado Direito)
  const getAcostamentoLdColor = (seg: Segment20m): string => {
    const execsLd = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      if (isFaixaDeDominioService(s)) return false;
      const d = e.direction;
      return d === 'Crescente' || d === 'Pista Dupla Dir' || d === 'Lado Direito';
    });
    const latestLd = getLatestExec(execsLd);
    if (latestLd) {
      const s = services.find(srv => srv.id === latestLd.serviceId);
      return s ? s.color : '#fef08a';
    }
    const execsAmbos = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      if (isFaixaDeDominioService(s)) return false;
      const d = e.direction;
      return d === 'Eixo Central' || d === 'Ambos os Lados' || !d;
    });
    const latestAmbos = getLatestExec(execsAmbos);
    if (latestAmbos) {
      const s = services.find(srv => srv.id === latestAmbos.serviceId);
      return s ? s.color : '#fef08a';
    }
    return '#fef08a';
  };

  // Helper: Cor para Eixo da Pista (Serviços de Pista / Pavimentação / NPAV no Eixo Central)
  const getEixoPistaColor = (seg: Segment20m): string => {
    const roadExecs = seg.executionHistory.filter(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      return !isFaixaDeDominioService(s);
    });

    const latestRoadExec = getLatestExec(roadExecs);
    if (latestRoadExec) {
      const s = services.find(srv => srv.id === latestRoadExec.serviceId);
      if (s) return s.color;
    }

    const topService = services.find(s => s.id === seg.latestServiceId);
    if (topService && !isFaixaDeDominioService(topService) && seg.latestServiceColor) {
      return seg.latestServiceColor;
    }

    return '#fef08a';
  };

  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [activeExportPageIdx, setActiveExportPageIdx] = useState<number | null>(null);
  const [exportProgress, setExportProgress] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const linearExportRef = useRef<HTMLDivElement>(null);

  // Impressão nativa do navegador (Vetorizada / PDF de alta qualidade)
  const handlePrintLinear = () => {
    window.print();
  };

  // Agrupar estacas/segmentos em sub-trechos de 12 km (ou tamanho configurável)
  const chunks: LinearChunkData[] = useMemo(() => {
    if (!activeContract || segments.length === 0) return [];

    const totalContractSegments = segments.length;

    if (chunkSizeKm === 0) {
      const execCount = segments.filter(s => !!s.latestServiceColor).length;
      const pct = totalContractSegments > 0 ? Number(((execCount / totalContractSegments) * 100).toFixed(2)) : 0;
      return [{
        index: 1,
        title: `Tronco Completo — KM ${activeContract.kmInitial.toFixed(1)} ao KM ${activeContract.kmFinal.toFixed(1)} (${activeContract.extensionKm} km)`,
        startKm: activeContract.kmInitial,
        endKm: activeContract.kmFinal,
        segments: segments,
        executedPercentageTotal: pct,
        executedPercentageSub: pct,
        executedCount: execCount
      }];
    }

    const list: LinearChunkData[] = [];

    const startKm = activeContract.kmInitial;
    const endKm = activeContract.kmFinal;

    let currentStart = startKm;
    let idx = 1;

    while (currentStart < endKm) {
      const currentEnd = Math.min(endKm, currentStart + chunkSizeKm);
      const segs = segments.filter(s => {
        if (currentEnd === endKm) {
          return s.km >= currentStart && s.km <= currentEnd;
        }
        return s.km >= currentStart && s.km < currentEnd;
      });

      const executedCount = segs.filter(s => !!s.latestServiceColor).length;

      // Avanço Físico calculado pelo KM Total do Contrato
      const executedPercentageTotal = totalContractSegments > 0
        ? Number(((executedCount / totalContractSegments) * 100).toFixed(2))
        : 0;

      // Avanço Físico relativo apenas ao Sub-trecho
      const executedPercentageSub = segs.length > 0
        ? Math.round((executedCount / segs.length) * 100)
        : 0;

      list.push({
        index: idx,
        title: `Sub-trecho #${idx} — KM ${currentStart.toFixed(1).replace('.', ',')} ao KM ${currentEnd.toFixed(1).replace('.', ',')} (${(currentEnd - currentStart).toFixed(1)} km)`,
        startKm: Number(currentStart.toFixed(3)),
        endKm: Number(currentEnd.toFixed(3)),
        segments: segs,
        executedPercentageTotal,
        executedPercentageSub,
        executedCount
      });

      currentStart = currentEnd;
      idx++;
    }

    return list;
  }, [activeContract, segments, chunkSizeKm]);

  // Agrupar sub-trechos em páginas de exatamente 4 faixas fixas por página
  const paginatedChunks = useMemo(() => {
    const pages: LinearChunkData[][] = [];
    for (let i = 0; i < chunks.length; i += 4) {
      pages.push(chunks.slice(i, i + 4));
    }
    return pages;
  }, [chunks]);

  // Sub-trechos visíveis conforme o filtro da tela interativa
  const visibleChunks = useMemo(() => {
    if (selectedChunkIndex === 'ALL') return chunks;
    const idx = parseInt(selectedChunkIndex, 10);
    return chunks.filter(c => c.index === idx);
  }, [chunks, selectedChunkIndex]);

  // Exportação em PDF do Diagrama Linear (4 Faixas Fixas por Página)
  const handleExportPdf = async () => {
    if (!activeContract || paginatedChunks.length === 0) {
      alert('Nenhum dado linear disponível para exportação.');
      return;
    }

    setIsExportingPdf(true);
    setExportProgress('Iniciando renderização de alta fidelidade...');

    // Instalar proteção contra travamento em createPattern
    const restoreCanvasPattern = installCanvasPatternSafeguard();

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const totalPages = paginatedChunks.length;
      const pdfWidth = 297; // mm A4 Landscape (largura total)
      const pdfHeight = 210; // mm A4 Landscape (altura total)

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        setActiveExportPageIdx(pageIdx);
        setExportProgress(`Renderizando folha ${pageIdx + 1} de ${totalPages} (4 faixas por página)...`);
        
        // Aguarda a montagem e layout do componente ativo
        await new Promise((resolve) => setTimeout(resolve, 250));

        const modalBackdrop = document.getElementById('linear-pdf-export-modal-backdrop');
        if (modalBackdrop) modalBackdrop.scrollTop = 0;

        const pageEl = document.getElementById('linear-active-export-sheet');
        if (!pageEl) {
          console.warn(`Elemento linear-active-export-sheet para a folha ${pageIdx} não encontrado.`);
          continue;
        }

        const pageCanvas = await html2canvas(pageEl, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          windowWidth: 1440,
          width: 1440,
          onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
            (clonedEl.style as any).webkitFontSmoothing = 'antialiased';
            (clonedEl.style as any).textRendering = 'optimizeLegibility';
            cleanClonedDocForPdfExport(clonedDoc, clonedEl);
          }
        });

        if (!pageCanvas || pageCanvas.width <= 0 || pageCanvas.height <= 0) continue;

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        if (pageIdx > 0) {
          pdf.addPage('a4', 'landscape');
        }

        // Preenche a folha inteira A4 (297 x 210 mm) sem margens residuais e sem cortes
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      setExportProgress('Finalizando arquivo PDF...');
      const cleanContractNum = activeContract ? activeContract.number.replace(/[\/\s]/g, '_') : 'SCLAF';
      pdf.save(`Diagrama_Linear_${cleanContractNum}_4Faixas_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF do Gráfico Linear:', error);
      alert('Ocorreu um erro ao gerar o PDF do Diagrama Linear. Utilize a opção "Imprimir" como alternativa rápida.');
    } finally {
      restoreCanvasPattern();
      setActiveExportPageIdx(null);
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  // Busca por KM ou Estaca
  const handleSearchKM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const cleanSearch = searchTerm.replace('+', '.').replace(',', '.').trim();
    const targetKm = parseFloat(cleanSearch);

    if (!isNaN(targetKm)) {
      const found = segments.find(s => Math.abs(s.km - targetKm) < 0.03);
      if (found) {
        setHighlightedSegId(found.id);

        // Se estiver num sub-trecho filtrado, reexibe todos ou ajusta para o sub-trecho do KM
        const ownerChunk = chunks.find(c => c.segments.some(s => s.id === found.id));
        if (ownerChunk && selectedChunkIndex !== 'ALL' && parseInt(selectedChunkIndex, 10) !== ownerChunk.index) {
          setSelectedChunkIndex(ownerChunk.index.toString());
        }

        setTimeout(() => {
          const el = document.getElementById(`seg-el-${found.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }, 100);
      } else {
        alert(`Quilometragem KM ${targetKm} não localizada dentro do trecho do contrato (KM ${activeContract?.kmInitial} a KM ${activeContract?.kmFinal}).`);
      }
    }
  };

  // Ajuste do tamanho do bloco de 20m conforme zoom
  const getSegmentWidthClass = () => {
    switch (zoomLevel) {
      case 1: return 'w-3 h-10 text-[8px]'; // 12px
      case 2: return 'w-6 h-12 text-[10px]'; // 24px
      case 3: return 'w-10 h-14 text-xs';   // 40px
      case 4: return 'w-16 h-16 text-xs';   // 64px
      default: return 'w-6 h-12 text-[10px]';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 text-slate-800 flex flex-col h-full bg-slate-100">
      {/* Top Header do Linear de Avanço Físico */}
      <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCommitHorizontal className="w-5 h-5 text-purple-700" />
            <h2 className="text-lg font-black text-slate-900">Linear de Avanço Físico</h2>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 font-mono text-[11px] font-bold rounded-full border border-purple-300">
              {segments.length.toLocaleString()} estacas de 20m
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Representação vetorial do tronco rodoviário. Clique em qualquer segmento de 20m para acessar a Ficha do Trecho, Fotos e RDO.
          </p>
        </div>

        {/* Seleção de Contrato, Sub-trecho, Divisão e Busca */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-semibold text-slate-700">Contrato:</span>
            <select
              value={activeContract?.id || ''}
              onChange={(e) => {
                setCurrentContractId(e.target.value);
                setSelectedChunkIndex('ALL');
              }}
              className="bg-white text-slate-900 text-xs font-mono rounded px-2 py-1 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.number} — {c.highway} ({c.kmInitial} - {c.kmFinal} km)
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Sub-trecho */}
          <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-semibold text-slate-700">Exibir:</span>
            <select
              value={selectedChunkIndex}
              onChange={(e) => setSelectedChunkIndex(e.target.value)}
              className="bg-white text-purple-900 text-xs font-mono rounded px-2 py-1 border border-slate-300 focus:outline-none font-bold"
            >
              <option value="ALL">Todos os Sub-trechos ({chunkSizeKm > 0 ? `${chunkSizeKm} km` : ''})</option>
              {chunks.map(chk => (
                <option key={`chk-opt-${chk.index}`} value={chk.index.toString()}>
                  Sub-trecho #{chk.index} (KM {chk.startKm.toFixed(1)} ao {chk.endKm.toFixed(1)})
                </option>
              ))}
            </select>
          </div>

          {/* Seleção do Tamanho do Sub-trecho (Apenas 10km, 5km e 2km - Padrão 2km) */}
          <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300">
            <span className="text-xs font-semibold text-slate-700">Divisão:</span>
            <select
              value={chunkSizeKm}
              onChange={(e) => {
                setChunkSizeKm(Number(e.target.value));
                setSelectedChunkIndex('ALL');
              }}
              className="bg-white text-emerald-800 text-xs font-mono rounded px-2 py-1 border border-slate-300 focus:outline-none font-bold"
            >
              <option value={10}>10 km por segmento</option>
              <option value={5}>5 km por segmento</option>
              <option value={2}>2 km por segmento (Padrão)</option>
            </select>
          </div>

          {/* Form de Busca por KM */}
          <form onSubmit={handleSearchKM} className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-300">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ir p/ KM ex: 105+200"
              className="bg-white text-slate-900 text-xs px-2 py-1 rounded border border-slate-300 w-36 focus:outline-none focus:border-purple-600 font-mono"
            />
            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white p-1.5 rounded text-xs transition shadow-xs"
              title="Buscar Estaca"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Controles de Zoom */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-300 space-x-1">
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-purple-900 px-1">
              Zoom {zoomLevel}x
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 1))}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botões de Exportação e Impressão */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintLinear}
              className="no-print flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm border border-slate-600 cursor-pointer"
              title="Imprimir ou Salvar em PDF via Navegador (Vetorizado)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="no-print flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-sm border border-emerald-600 disabled:opacity-50 cursor-pointer"
              title="Gerar e Baixar Documento PDF do Diagrama Linear"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isExportingPdf ? (exportProgress || 'Gerando PDF...') : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA EXPORTÁVEL PARA PDF (CABEÇALHO + DIAGRAMA LINEAR DE 5 FAIXAS EM TEMA CLARO) */}
      <div ref={linearExportRef} className="space-y-4 bg-white p-3.5 rounded-2xl border border-slate-300 shadow-md">
        {/* Cabeçalho e Legenda Principal (COMPONENTES SELECIONADOS EM ROXO #3b0764, RESTANTE EM BRANCO #ffffff) */}
        <div id="pdf-header-area" className="rounded-xl border border-slate-300 shadow-md overflow-hidden bg-white text-slate-900" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          {/* Faixa do Título do Diagrama na Cor da Empresa (ROXO SELECIONADO) */}
          <div className="px-4 py-3 border-b border-purple-950 flex flex-wrap items-center justify-between gap-3 text-white" style={{ backgroundColor: '#3b0764', color: '#ffffff' }}>
            <div className="flex items-center space-x-3">
              <MatupiriLogo className="h-10 sm:h-12 w-auto shadow-sm" />
            </div>

            <div className="text-center flex-1 min-w-[280px]">
              <h2 className="text-sm md:text-base font-black text-white tracking-wider uppercase font-mono text-center" style={{ color: '#ffffff' }}>
                DIAGRAMA LINEAR DE AVANÇO FÍSICO DA RODOVIA — {activeContract?.highway || 'RODOVIA'} — CONTRATO {activeContract?.number || ''}
              </h2>
              <p className="text-[11px] text-purple-200 font-medium text-center mt-0.5" style={{ color: '#e9d5ff' }}>
                {activeContract?.executingCompany || 'EMPRESA CONTRATADA'} • EXTENSÃO TOTAL: {activeContract?.extensionKm} KM (KM {activeContract?.kmInitial} AO KM {activeContract?.kmFinal})
              </p>
            </div>

            <div className="hidden lg:flex items-center space-x-2 text-right">
              <div className="bg-purple-950/80 px-3 py-1.5 rounded-lg border border-purple-800 text-[10px] text-purple-200">
                <span className="font-bold block text-white">CONSORCIO MATUPIRI</span>
                <span className="text-[9px] text-purple-300">SUPERVISÃO E FISCALIZAÇÃO</span>
              </div>
            </div>
          </div>

          {/* Barra de Legendas dos Serviços Executados (Fundo Branco Limpo) */}
          <div className="p-3 space-y-2 text-xs border-t border-slate-200 bg-white text-slate-800" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                {/* Badge do Título de Legendas (ROXO SELECIONADO) */}
                <div className="px-3 py-1 rounded text-[11px] font-black text-white tracking-wide uppercase border border-purple-900 shrink-0 shadow-xs" style={{ color: '#ffffff', backgroundColor: '#3b0764' }}>
                  SERVIÇOS E LEGENDAS DO DIAGRAMA
                </div>
              </div>

              {/* Botões para alternar a exibição das legendas */}
              <div className="flex items-center space-x-1.5 text-[10px]">
                <button
                  onClick={() => setLegendFilterMode('AUTO')}
                  className={`px-2 py-1 rounded font-bold border transition ${
                    legendFilterMode === 'AUTO'
                      ? 'bg-purple-800 text-white border-purple-900 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Exibir automaticamente conforme a superfície do contrato"
                >
                  Auto ({activeContract?.surfaceType})
                </button>
                <button
                  onClick={() => setLegendFilterMode('PAV')}
                  className={`px-2 py-1 rounded font-bold border transition ${
                    legendFilterMode === 'PAV'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  PAV
                </button>
                <button
                  onClick={() => setLegendFilterMode('NPAV')}
                  className={`px-2 py-1 rounded font-bold border transition ${
                    legendFilterMode === 'NPAV'
                      ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  NPAV
                </button>
                <button
                  onClick={() => setLegendFilterMode('SEPARADO')}
                  className={`px-2 py-1 rounded font-bold border transition ${
                    legendFilterMode === 'SEPARADO'
                      ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  PAV & NPAV Separados
                </button>
              </div>
            </div>

            {/* Listagem dos Serviços do Segmento Pavimentado e Não Pavimentado em Cards Brancos */}
            {legendFilterMode === 'SEPARADO' || legendFilterMode === 'AUTO' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Bloco Pavimentado (PAV) - Header Roxo + Cards Brancos */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-white space-y-1.5 shadow-xs" style={{ backgroundColor: '#ffffff' }}>
                  {/* Banner do Título do Bloco PAV (ROXO SELECIONADO) */}
                  <div className="flex items-center justify-center text-center px-2.5 py-1.5 rounded text-white shadow-xs" style={{ backgroundColor: '#3b0764' }}>
                    <span className="text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 text-center" style={{ color: '#ffffff' }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-400" style={{ backgroundColor: '#34d399' }}></span>
                      <span>SERVIÇOS DO SEGMENTO PAVIMENTADO (PAV)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-left">
                    {pavedServices.map(s => (
                      <div key={`paved-${s.id}`} className="flex items-center space-x-2 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-900 shadow-2xs transition w-full" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}>
                        <span className="w-3.5 h-3.5 rounded-xs inline-block shrink-0 border border-slate-400 shadow-2xs" style={{ backgroundColor: s.color }}></span>
                        <span className="text-[10.5px] font-bold truncate" style={{ color: '#0f172a' }}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bloco Não Pavimentado (NPAV) - Header Roxo + Cards Brancos */}
                <div className="p-2.5 rounded-lg border border-purple-200 bg-white space-y-1.5 shadow-xs" style={{ backgroundColor: '#ffffff' }}>
                  {/* Banner do Título do Bloco NPAV (ROXO SELECIONADO) */}
                  <div className="flex items-center justify-center text-center px-2.5 py-1.5 rounded text-white shadow-xs" style={{ backgroundColor: '#3b0764' }}>
                    <span className="text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 text-center" style={{ color: '#ffffff' }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-400" style={{ backgroundColor: '#fbbf24' }}></span>
                      <span>SERVIÇOS DO SEGMENTO NÃO PAVIMENTADO (NPAV)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-left">
                    {unpavedServices.map(s => (
                      <div key={`unpaved-${s.id}`} className="flex items-center space-x-2 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-900 shadow-2xs transition w-full" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}>
                        <span className="w-3.5 h-3.5 rounded-xs inline-block shrink-0 border border-slate-400 shadow-2xs" style={{ backgroundColor: s.color }}></span>
                        <span className="text-[10.5px] font-bold truncate" style={{ color: '#0f172a' }}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1 text-left">
                <div className="text-[10.5px] font-bold uppercase text-slate-800 text-center" style={{ color: '#1e293b' }}>
                  {legendFilterMode === 'PAV'
                    ? '🟢 SERVIÇOS DO SEGMENTO PAVIMENTADO (PAV):'
                    : '🟠 SERVIÇOS DO SEGMENTO NÃO PAVIMENTADO (NPAV):'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {(legendFilterMode === 'PAV' ? pavedServices : unpavedServices).map(s => (
                    <div key={s.id} className="flex items-center space-x-2 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-900 shadow-2xs transition w-full" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a' }}>
                      <span className="w-3.5 h-3.5 rounded-xs inline-block shrink-0 border border-slate-400 shadow-2xs" style={{ backgroundColor: s.color }}></span>
                      <span className="text-[10.5px] font-bold truncate" style={{ color: '#0f172a' }}>{s.name}</span>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2 px-2.5 py-1 rounded border border-slate-200 bg-amber-50 text-amber-900 shadow-2xs w-full" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#78350f' }}>
                    <span className="w-3.5 h-3.5 rounded-xs inline-block shrink-0 border border-amber-700" style={{ backgroundColor: '#78350f' }}></span>
                    <span className="text-[10.5px] font-medium truncate" style={{ color: '#78350f' }}>Não Executado / Terreno Natural</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAINEL PRINCIPAL DO DIAGRAMA LINEAR DIVIDIDO EM SUB-TRECHOS (TEMA CLARO) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 shadow-inner relative flex-1 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* Informações Globais do Contrato e Filtros */}
          <div className="flex flex-wrap items-center justify-center text-center text-xs text-slate-600 border-b border-slate-300 pb-2.5 gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center justify-center text-center gap-3">
              <span className="font-bold text-slate-900 text-sm">{activeContract?.highway}</span>
              <span className="text-slate-400">|</span>
              <span>Extensão Total: <strong className="text-slate-900">{activeContract?.extensionKm} km</strong> ({activeContract?.kmInitial} km ao {activeContract?.kmFinal} km)</span>
              <span className="text-slate-400">|</span>
              <span>Sub-trechos: <strong className="text-purple-800 font-extrabold">{chunks.length} segmento(s) de {chunkSizeKm > 0 ? `${chunkSizeKm} km` : 'Tamanho Total'}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium italic text-center">
              * Perfil de 5 Faixas da Rodovia com Estacamento DNIT (20 metros por célula)
            </div>
          </div>

          {/* DIAGRAMA DOS SUB-TRECHOS (LARGURA COMPLETA) */}
          <div className="space-y-6 w-full min-w-0">
            {visibleChunks.map((chunk) => (
              <div
                key={`chunk-card-${chunk.index}`}
                className="pdf-chunk-card bg-white p-3.5 rounded-xl border border-slate-300 shadow-md space-y-2.5"
              >
                {/* BARRA DE TÍTULO E AVANÇO DO SUB-TRECHO */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-linear-to-r from-[#1e1b4b] to-[#3b0764] text-white rounded-lg border border-purple-900 shadow-xs">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="px-2 py-0.5 bg-purple-700 text-white rounded text-xs font-black uppercase tracking-wider">
                      FAIXA #{chunk.index}
                    </span>
                    <span className="font-bold text-xs uppercase text-purple-100">
                      KM {chunk.startKm.toFixed(1).replace('.', ',')} AO KM {chunk.endKm.toFixed(1).replace('.', ',')} ({(chunk.endKm - chunk.startKm).toFixed(1).replace('.', ',')} KM)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-purple-200">
                      Amostragem: <strong>{chunk.segments.length} estacas (20m)</strong>
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-950 text-emerald-300 font-mono font-bold rounded border border-purple-800 shadow-2xs">
                      Avanço Sub-trecho: {chunk.executedPercentageSub}%
                    </span>
                  </div>
                </div>

                {/* ROLAGEM HORIZONTAL DO DIAGRAMA LINEAR DO SUB-TRECHO */}
                <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 select-none">
                  <div className="estaca-flex inline-flex flex-col min-w-full rounded-lg overflow-hidden border border-slate-300 shadow-md">
                    
                    {/* CABEÇALHO DO SUB-TRECHO: ESTACA / KM */}
                    <div className="estaca-row flex items-stretch bg-slate-200 text-slate-900 border-b border-slate-300">
                      {/* Célula do Título Lateral Esquerdo */}
                      <div className="shrink-0 border-r border-slate-600 p-2 flex flex-col justify-center items-center text-center font-extrabold text-[11px] text-white uppercase font-mono tracking-wider" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <span>ESTACA / KM</span>
                        <span className="text-[9px] text-purple-200 font-semibold font-sans normal-case">DNIT • Trecho de 20m</span>
                      </div>

                      {/* Células Superiores de KM */}
                      <div className="flex flex-1 font-mono text-[8px] h-16 items-center">
                        {chunk.segments.map((seg, idx) => {
                          const kmFloat = seg.km;
                          const kmBase = Math.floor(kmFloat + 0.0001);
                          const metersFromKm = Math.round((kmFloat - kmBase) * 1000);
                          
                          const isExactKm = metersFromKm === 0 || metersFromKm === 1000;
                          const isStartOfChunk = idx === 0;

                          return (
                            <div
                              key={`km-mark-${seg.id}`}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-16 flex flex-col items-center justify-center border-r border-slate-300/80 font-mono text-[9px] bg-slate-100 hover:bg-slate-200 transition relative overflow-visible`}
                              title={`KM ${seg.kmFormatted} (Estaca ${seg.estaca})`}
                            >
                              {/* Destaque do Quilômetro */}
                              {isExactKm ? (
                                <span
                                  className="font-black text-slate-950 text-[9px] bg-amber-300 px-1 py-0.5 rounded border border-amber-500 shadow-2xs z-10 whitespace-nowrap select-none"
                                  style={{
                                    writingMode: 'vertical-rl',
                                    transform: 'rotate(180deg)',
                                    display: 'inline-block'
                                  }}
                                >
                                  KM {kmBase}
                                </span>
                              ) : isStartOfChunk ? (
                                <span
                                  className="font-extrabold text-white text-[9px] bg-purple-700 px-1 py-0.5 rounded border border-purple-900 z-10 whitespace-nowrap select-none"
                                  style={{
                                    writingMode: 'vertical-rl',
                                    transform: 'rotate(180deg)',
                                    display: 'inline-block'
                                  }}
                                >
                                  KM {seg.km.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-300">|</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CABEÇALHO INTERMEDIÁRIO: CONTRATADA E EMPRESA */}
                    <div className="estaca-row flex items-stretch bg-slate-200 text-slate-900 border-b border-slate-300">
                      <div className="shrink-0 border-r border-slate-600 p-1.5 flex items-center justify-center text-center font-black text-[10px] text-white uppercase font-mono" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        CONTRATADA / EMPRESA
                      </div>
                      <div className="flex-1 bg-slate-100 px-4 py-1.5 font-black text-xs text-slate-900 uppercase tracking-wide flex items-center justify-center text-center">
                        <span className="text-center">CONTRATO {activeContract?.number} — {activeContract?.executingCompany || 'EMPRESA CONTRATADA'}</span>
                      </div>
                    </div>

                    {/* CORPO DO GRÁFICO (5 FAIXAS DA RODOVIA COM LEGENDAS LATERAIS ESQUERDAS) */}
                    
                    {/* FAIXA 1: LADO ESQUERDO — FAIXA DE DOMÍNIO */}
                    <div className="estaca-row flex items-stretch bg-amber-100 border-b border-slate-300">
                      <div className="shrink-0 border-r border-slate-600 px-3 py-1.5 flex flex-col justify-center items-center text-center text-white" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <div className="flex items-center justify-center space-x-1.5 text-center">
                          <span className="font-extrabold text-[10.5px] tracking-tight uppercase truncate text-center">LE FAIXA DE DOMÍNIO</span>
                        </div>
                        <div className="text-[8.5px] font-semibold text-emerald-300 truncate mt-0.5 leading-tight text-center">
                          Roçada Manual • Drenagem • Limpeza
                        </div>
                      </div>
                      <div className="flex flex-1 bg-[#fef08a]/90">
                        {chunk.segments.map((seg) => {
                          const isHighlighted = highlightedSegId === seg.id;
                          const serviceColor = getFaixaDominioLeColor(seg);

                          return (
                            <button
                              key={`f1-${seg.id}`}
                              id={`seg-el-${seg.id}`}
                              onClick={() => setSelectedSegment(seg)}
                              onMouseEnter={() => setHoveredSegment(seg)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-6 border-r border-b border-slate-300 transition transform hover:brightness-110 relative flex items-center justify-center ${
                                isHighlighted ? 'ring-2 ring-yellow-400 z-30' : ''
                              }`}
                              style={{ backgroundColor: serviceColor }}
                              title={`${seg.kmFormatted} - LE Faixa de Domínio (Limpeza / Drenagem / Roçada)`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* FAIXA 2: LADO ESQUERDO — ACOSTAMENTO */}
                    <div className="estaca-row flex items-stretch bg-amber-100 border-b border-slate-300">
                      <div className="shrink-0 border-r border-slate-600 px-3 py-1.5 flex flex-col justify-center items-center text-center text-white" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <div className="flex items-center justify-center space-x-1.5 text-center">
                          <span className="font-extrabold text-[10.5px] tracking-tight uppercase truncate text-center">LE ACOSTAMENTO</span>
                        </div>
                        <div className="text-[8.5px] font-semibold text-amber-300 truncate mt-0.5 leading-tight text-center">
                          {isPavedContract ? 'Sub-base BGS • Imprimação • Pintura' : 'Conformação • Regularização'}
                        </div>
                      </div>
                      <div className="flex flex-1 bg-[#fef08a]/90">
                        {chunk.segments.map((seg) => {
                          const isHighlighted = highlightedSegId === seg.id;
                          const serviceColor = getAcostamentoLeColor(seg);

                          return (
                            <button
                              key={`f2-${seg.id}`}
                              onClick={() => setSelectedSegment(seg)}
                              onMouseEnter={() => setHoveredSegment(seg)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-6 border-r border-b border-slate-300 transition transform hover:brightness-110 relative flex items-center justify-center ${
                                isHighlighted ? 'ring-2 ring-yellow-400 z-30' : ''
                              }`}
                              style={{ backgroundColor: serviceColor }}
                              title={`${seg.kmFormatted} - LE Acostamento`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* FAIXA 3: EIXO DA PISTA (DESTAQUE CENTRAL COM LINHA TRACEJADA AMARELA) */}
                    <div className="estaca-row flex items-stretch bg-amber-100 border-b border-slate-300">
                      <div className="shrink-0 border-r border-slate-600 px-3 py-1.5 flex flex-col justify-center items-center text-center text-white" style={{ backgroundColor: '#312e81', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <div className="flex items-center justify-center space-x-1.5 font-extrabold text-[10.5px] tracking-tight uppercase text-center">
                          <span className="truncate text-center">EIXO DA PISTA</span>
                        </div>
                        <div className="text-[8.5px] font-semibold text-amber-300 truncate mt-0.5 leading-tight text-center">
                          {isPavedContract ? 'CBUQ Capa • Microrrevestimento • BGS' : 'Revestimento Primário • Cascalho'}
                        </div>
                      </div>
                      <div className="flex flex-1 bg-[#fef08a]/90 relative">
                        {/* Linha de Eixo Tracejada Amarela na Pista */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-amber-600 pointer-events-none z-10 opacity-80" />

                        {chunk.segments.map((seg) => {
                          const isHighlighted = highlightedSegId === seg.id;
                          const serviceColor = getEixoPistaColor(seg);

                          return (
                            <button
                              key={`f3-${seg.id}`}
                              onClick={() => setSelectedSegment(seg)}
                              onMouseEnter={() => setHoveredSegment(seg)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-8 border-r border-b border-slate-300 transition transform hover:brightness-110 relative flex items-center justify-center ${
                                isHighlighted ? 'ring-2 ring-yellow-400 z-30' : ''
                              }`}
                              style={{ backgroundColor: serviceColor }}
                              title={`${seg.kmFormatted} - Eixo da Pista`}
                            >
                              {seg.hasPhotos && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-0.5 right-0.5 shadow z-20"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FAIXA 4: LADO DIREITO — ACOSTAMENTO */}
                    <div className="estaca-row flex items-stretch bg-amber-100 border-b border-slate-300">
                      <div className="shrink-0 border-r border-slate-600 px-3 py-1.5 flex flex-col justify-center items-center text-center text-white" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <div className="flex items-center justify-center space-x-1.5 text-center">
                          <span className="font-extrabold text-[10.5px] tracking-tight uppercase truncate text-center">LD ACOSTAMENTO</span>
                        </div>
                        <div className="text-[8.5px] font-semibold text-amber-300 truncate mt-0.5 leading-tight text-center">
                          {isPavedContract ? 'Sub-base BGS • Imprimação • Pintura' : 'Conformação • Regularização'}
                        </div>
                      </div>
                      <div className="flex flex-1 bg-[#fef08a]/90">
                        {chunk.segments.map((seg) => {
                          const isHighlighted = highlightedSegId === seg.id;
                          const serviceColor = getAcostamentoLdColor(seg);

                          return (
                            <button
                              key={`f4-${seg.id}`}
                              onClick={() => setSelectedSegment(seg)}
                              onMouseEnter={() => setHoveredSegment(seg)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-6 border-r border-b border-slate-300 transition transform hover:brightness-110 relative flex items-center justify-center ${
                                isHighlighted ? 'ring-2 ring-yellow-400 z-30' : ''
                              }`}
                              style={{ backgroundColor: serviceColor }}
                              title={`${seg.kmFormatted} - LD Acostamento`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* FAIXA 5: LADO DIREITO — FAIXA DE DOMÍNIO */}
                    <div className="estaca-row flex items-stretch bg-amber-100">
                      <div className="shrink-0 border-r border-slate-600 px-3 py-1.5 flex flex-col justify-center items-center text-center text-white" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <div className="flex items-center justify-center space-x-1.5 text-center">
                          <span className="font-extrabold text-[10.5px] tracking-tight uppercase truncate text-center">LD FAIXA DE DOMÍNIO</span>
                        </div>
                        <div className="text-[8.5px] font-semibold text-emerald-300 truncate mt-0.5 leading-tight text-center">
                          Roçada Manual • Drenagem • Limpeza
                        </div>
                      </div>
                      <div className="flex flex-1 bg-[#fef08a]/90">
                        {chunk.segments.map((seg) => {
                          const isHighlighted = highlightedSegId === seg.id;
                          const serviceColor = getFaixaDominioLdColor(seg);

                          return (
                            <button
                              key={`f5-${seg.id}`}
                              onClick={() => setSelectedSegment(seg)}
                              onMouseEnter={() => setHoveredSegment(seg)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-6 border-r border-slate-300 transition transform hover:brightness-110 relative flex items-center justify-center ${
                                isHighlighted ? 'ring-2 ring-yellow-400 z-30' : ''
                              }`}
                              style={{ backgroundColor: serviceColor }}
                              title={`${seg.kmFormatted} - LD Faixa de Domínio (Limpeza / Drenagem / Roçada)`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* REGRA INFERIOR COM AS ESTACAS DNIT EM POSIÇÃO VERTICAL DE BAIXO PARA CIMA */}
                    <div className="estaca-row flex items-stretch bg-slate-200 text-slate-800 border-t border-slate-400">
                      <div className="shrink-0 border-r border-slate-600 p-2 flex flex-col justify-center items-center text-center font-extrabold text-[11px] text-white uppercase font-mono tracking-wider" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', minWidth: '220px', width: '220px' }}>
                        <span>ESTACAMENTO</span>
                        <span className="text-[9px] text-purple-200 font-semibold font-sans normal-case">(DNIT - 20m)</span>
                      </div>
                      <div className="flex flex-1 font-mono text-[8px] h-16 items-center">
                        {chunk.segments.map((seg) => {
                          return (
                            <div
                              key={`est-mark-${seg.id}`}
                              className={`estaca-item ${getSegmentWidthClass()} shrink-0 h-full text-center border-r border-slate-300/80 text-slate-800 flex flex-col items-center justify-center font-mono overflow-visible py-1`}
                              title={`Estaca ${seg.estaca} (${seg.kmFormatted})`}
                            >
                              <span
                                className="font-extrabold text-[8.5px] text-slate-900 tracking-tighter whitespace-nowrap select-none"
                                style={{
                                  writingMode: 'vertical-rl',
                                  transform: 'rotate(180deg)',
                                  display: 'inline-block'
                                }}
                              >
                                E-{seg.estaca}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOOLTIP FIXA EM TEMPO REAL AO PASSAR O MOUSE */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-md mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-800">
            {hoveredSegment ? (
              <div className="flex items-center space-x-4 w-full">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-4 h-4 rounded shadow-xs"
                    style={{ backgroundColor: hoveredSegment.latestServiceColor || '#fef08a' }}
                  ></span>
                  <span className="font-extrabold text-slate-900 text-sm">{hoveredSegment.kmFormatted}</span>
                  <span className="text-slate-500 font-mono">(Estaca {hoveredSegment.estaca})</span>
                </div>

                <div className="text-slate-700 font-semibold border-l border-slate-300 pl-4">
                  Serviço Executado: <span className="text-slate-900 font-bold">{hoveredSegment.latestServiceName || 'Pendente / Terreno Natural'}</span>
                </div>

                {hoveredSegment.latestExecutionDate && (
                  <div className="text-slate-500 border-l border-slate-300 pl-4">
                    Data: <span className="text-slate-800 font-medium">{hoveredSegment.latestExecutionDate}</span>
                  </div>
                )}

                {hoveredSegment.rdoNumber && (
                  <div className="text-slate-500 border-l border-slate-300 pl-4">
                    RDO: <span className="text-purple-700 font-mono font-bold">{hoveredSegment.rdoNumber}</span>
                  </div>
                )}

                <div className="ml-auto text-[11px] text-purple-700 font-bold hover:underline cursor-pointer">
                  Clique para abrir Ficha do Trecho
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic flex items-center space-x-2">
                <Info className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Passe o mouse sobre os blocos de qualquer faixa para visualizar os detalhes da estaca ou clique para abrir a Ficha do Trecho.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Estaca de 20m */}
      <SegmentDetailModal
        segment={selectedSegment}
        contract={activeContract}
        onClose={() => setSelectedSegment(null)}
        onRefresh={() => {}}
      />

      {/* MODAL DE PROGRESSO E ESTÁGIO DE RENDERIZAÇÃO ATIVA DO PDF */}
      {isExportingPdf && activeExportPageIdx !== null && paginatedChunks[activeExportPageIdx] && (
        <div
          id="linear-pdf-export-modal-backdrop"
          className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 select-none"
        >
          {/* Card de Progresso */}
          <div className="sticky top-4 z-50 bg-white p-5 rounded-2xl shadow-2xl border border-purple-300 max-w-lg w-full text-center space-y-3 mb-4">
            <div className="flex items-center justify-center space-x-2 text-purple-900 font-bold text-base">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-700" />
              <span>Exportando Diagrama Linear</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {exportProgress || `Renderizando folha ${activeExportPageIdx + 1} de ${paginatedChunks.length}...`}
            </p>
            {/* Barra de Progresso */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-purple-700 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((activeExportPageIdx + 1) / paginatedChunks.length) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] font-mono font-bold text-purple-900">
              Folha {activeExportPageIdx + 1} de {paginatedChunks.length} ({Math.round(((activeExportPageIdx + 1) / paginatedChunks.length) * 100)}%)
            </div>
          </div>

          {/* Palco de Renderização Ativa 100% Visível para Captura Exata do html2canvas */}
          <div className="w-[1440px] max-w-[1440px] bg-white rounded-none shadow-2xl p-0 my-2 border border-slate-300 overflow-hidden">
            <div id="linear-active-export-sheet" className="w-[1440px] h-[1018px] bg-white p-0 m-0 overflow-hidden">
              <LinearReportSheet
                id={`active-sheet-${activeExportPageIdx}`}
                contract={activeContract}
                pageNumber={activeExportPageIdx + 1}
                totalPages={paginatedChunks.length}
                chunks={paginatedChunks[activeExportPageIdx]}
                services={services}
                isPavedContract={isPavedContract}
                getFaixaDominioLeColor={getFaixaDominioLeColor}
                getFaixaDominioLdColor={getFaixaDominioLdColor}
                getAcostamentoLeColor={getAcostamentoLeColor}
                getAcostamentoLdColor={getAcostamentoLdColor}
                getEixoPistaColor={getEixoPistaColor}
                includeTableHeaders={true}
                customCompanyHeader={true}
                showPageCount={false}
                showSupervisionBadge={false}
                showSubPercentage={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* RECIPIENTE DE IMPRESSÃO NATIVA (WINDOW.PRINT) COM QUEBRA DE PÁGINA */}
      <div 
        id="linear-pdf-export-container"
        className="hidden print:block print:w-full select-none"
        aria-hidden="true"
      >
        {paginatedChunks.map((pageChunks, pageIdx) => (
          <div key={`linear-export-sheet-wrapper-${pageIdx}`} className="break-after-page print:break-after-page mb-8 print:mb-0">
            <LinearReportSheet
              id={`linear-export-sheet-${pageIdx}`}
              contract={activeContract}
              pageNumber={pageIdx + 1}
              totalPages={paginatedChunks.length}
              chunks={pageChunks}
              services={services}
              isPavedContract={isPavedContract}
              getFaixaDominioLeColor={getFaixaDominioLeColor}
              getFaixaDominioLdColor={getFaixaDominioLdColor}
              getAcostamentoLeColor={getAcostamentoLeColor}
              getAcostamentoLdColor={getAcostamentoLdColor}
              getEixoPistaColor={getEixoPistaColor}
              includeTableHeaders={true}
              customCompanyHeader={true}
              showPageCount={false}
              showSupervisionBadge={false}
              showSubPercentage={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

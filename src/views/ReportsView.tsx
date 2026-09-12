/**
 * SCLAF — Módulo de Relatórios Técnicos e RDO Oficial
 * Gerador de Ficha de Campo - Diário de Obras (Consórcio Matupiri / DNIT)
 */

import React, { useState, useRef, useMemo } from 'react';
import { db } from '../services/db';
import { FichaDeCampoRecord, EquipmentItem, ActivityItem, Segment20m } from '../types';
import { FichaDeCampoDocument } from '../components/FichaDeCampoDocument';
import { LinearReportSheet, LinearChunkData } from '../components/LinearReportSheet';
import { parseFichaDeCampoFile, syncActivitiesToSclaf } from '../services/fichaParser';
import { cleanClonedDocForPdfExport, installCanvasPatternSafeguard } from '../services/pdfExport';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  FileText,
  UploadCloud,
  CheckCircle2,
  Filter,
  Plus,
  Trash2,
  FileCheck,
  Eye,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Table,
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface ReportsViewProps {
  activeContractId: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeContractId }) => {
  const contracts = db.getContracts();
  const services = db.getServices();
  const settings = db.getSettings();

  const [activeTab, setActiveTab] = useState<'ficha_oficial' | 'upload_externo' | 'diagrama_linear' | 'boletim_medicao'>('ficha_oficial');
  const [selectedContractId, setSelectedContractId] = useState<string>(
    activeContractId !== 'ALL' ? activeContractId : contracts[0]?.id || ''
  );

  // Estados para o Painel de Configuração de Impressão & Layout (Print Configuration Options)
  const [includeTableHeaders, setIncludeTableHeaders] = useState<boolean>(() => {
    const saved = localStorage.getItem('sclaf_print_include_headers');
    return saved !== null ? saved === 'true' : true;
  });
  const [pageBreakAfterEvery4thItem, setPageBreakAfterEvery4thItem] = useState<boolean>(() => {
    const saved = localStorage.getItem('sclaf_print_page_break_4th');
    return saved !== null ? saved === 'true' : true;
  });
  const [customCompanyHeader, setCustomCompanyHeader] = useState<boolean>(() => {
    const saved = localStorage.getItem('sclaf_print_custom_header');
    return saved !== null ? saved === 'true' : true;
  });
  const [isConfigPanelExpanded, setIsConfigPanelExpanded] = useState<boolean>(true);

  const toggleIncludeTableHeaders = (val: boolean) => {
    setIncludeTableHeaders(val);
    localStorage.setItem('sclaf_print_include_headers', String(val));
  };
  const togglePageBreakAfterEvery4thItem = (val: boolean) => {
    setPageBreakAfterEvery4thItem(val);
    localStorage.setItem('sclaf_print_page_break_4th', String(val));
  };
  const toggleCustomCompanyHeader = (val: boolean) => {
    setCustomCompanyHeader(val);
    localStorage.setItem('sclaf_print_custom_header', String(val));
  };

  const handleResetPrintConfig = () => {
    toggleIncludeTableHeaders(true);
    togglePageBreakAfterEvery4thItem(true);
    toggleCustomCompanyHeader(true);
  };

  const contract = contracts.find(c => c.id === selectedContractId) || contracts[0];
  const executions = db.getExecutions(contract?.id);
  const metrics = db.getDashboardMetrics(contract?.id);
  const fichasDoBanco = db.getFichasDeCampo(contract?.id);

  // Estados para o Diagrama Linear (Relatório com 4 Faixas Fixas por Página)
  const [linearChunkSizeKm, setLinearChunkSizeKm] = useState<number>(12); // Padrão 12 km (4 faixas por página)
  const [activeLinearPage, setActiveLinearPage] = useState<number>(1);
  const [isExportingLinearPdf, setIsExportingLinearPdf] = useState<boolean>(false);
  const [linearPdfProgress, setLinearPdfProgress] = useState<string>('');

  const isPavedContract = contract?.surfaceType === 'CBUQ' || contract?.surfaceType === 'Concreto Rígido' || contract?.surfaceType === 'TSU/TSD';

  const segments = useMemo(() => {
    if (!contract) return [];
    return db.generateSegmentsForContract(contract.id);
  }, [contract]);

  const chunks: LinearChunkData[] = useMemo(() => {
    if (!contract || segments.length === 0) return [];
    const totalContractSegments = segments.length;
    const startKm = contract.kmInitial;
    const endKm = contract.kmFinal;
    const list: LinearChunkData[] = [];
    let currentStart = startKm;
    let idx = 1;

    while (currentStart < endKm) {
      const currentEnd = Math.min(endKm, currentStart + linearChunkSizeKm);
      const segs = segments.filter(s => {
        if (currentEnd === endKm) {
          return s.km >= currentStart && s.km <= currentEnd;
        }
        return s.km >= currentStart && s.km < currentEnd;
      });

      const executedCount = segs.filter(s => !!s.latestServiceColor).length;
      const executedPercentageTotal = totalContractSegments > 0
        ? Number(((executedCount / totalContractSegments) * 100).toFixed(2))
        : 0;
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
  }, [contract, segments, linearChunkSizeKm]);

  // Agrupar sub-trechos em páginas com exatamente 4 faixas fixas por página
  const paginatedChunks = useMemo(() => {
    const pages: LinearChunkData[][] = [];
    for (let i = 0; i < chunks.length; i += 4) {
      pages.push(chunks.slice(i, i + 4));
    }
    return pages;
  }, [chunks]);

  const getFaixaDominioLeColor = (seg: Segment20m) => {
    const lim = seg.executionHistory?.find(e => e.serviceId === 'SRV-01' || e.serviceId === 'SRV-06');
    if (lim) {
      const srv = services.find(s => s.id === lim.serviceId);
      return srv?.color || '#16a34a';
    }
    return '#fef08a';
  };
  const getFaixaDominioLdColor = (seg: Segment20m) => {
    const lim = seg.executionHistory?.find(e => e.serviceId === 'SRV-01' || e.serviceId === 'SRV-06');
    if (lim) {
      const srv = services.find(s => s.id === lim.serviceId);
      return srv?.color || '#16a34a';
    }
    return '#fef08a';
  };
  const getAcostamentoLeColor = (seg: Segment20m) => {
    const ac = seg.executionHistory?.find(e => e.serviceId === 'SRV-03' || e.serviceId === 'SRV-04');
    if (ac) {
      const srv = services.find(s => s.id === ac.serviceId);
      return srv?.color || '#eab308';
    }
    return '#fef08a';
  };
  const getAcostamentoLdColor = (seg: Segment20m) => {
    const ac = seg.executionHistory?.find(e => e.serviceId === 'SRV-03' || e.serviceId === 'SRV-04');
    if (ac) {
      const srv = services.find(s => s.id === ac.serviceId);
      return srv?.color || '#eab308';
    }
    return '#fef08a';
  };
  const getEixoPistaColor = (seg: Segment20m) => {
    if (seg.latestServiceColor) return seg.latestServiceColor;
    return '#fef08a';
  };

  // Exportar Relatório PDF do Diagrama Linear (4 Faixas Fixas por Página)
  const handleExportLinearReportPdf = async () => {
    if (!contract || paginatedChunks.length === 0) {
      alert('Nenhum dado linear disponível para o relatório.');
      return;
    }

    setIsExportingLinearPdf(true);
    setLinearPdfProgress(`Iniciando geração de PDF (${paginatedChunks.length} página(s), 4 faixas por página)...`);

    const restoreCanvasPattern = installCanvasPatternSafeguard();

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const totalPages = paginatedChunks.length;
      const pdfWidth = 297;
      const pdfHeight = 210;
      const margin = 4;
      const pWidth = pdfWidth - (margin * 2);
      const pHeight = pdfHeight - (margin * 2);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        setLinearPdfProgress(`Renderizando folha ${pageIdx + 1} de ${totalPages} (4 faixas fixas)...`);
        const pageEl = document.getElementById(`reports-linear-sheet-${pageIdx}`);
        if (!pageEl) continue;

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

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        if (pageIdx > 0) {
          pdf.addPage('a4', 'landscape');
        }

        // Preenchimento total da página A4 inteira (297 x 210 mm) sem margens residuais
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      setLinearPdfProgress('Finalizando e baixando...');
      const cleanContractNum = contract.number.replace(/[\/\s]/g, '_');
      pdf.save(`Relatorio_Diagrama_Linear_${cleanContractNum}_4Faixas_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF do relatório linear:', err);
      alert('Erro ao gerar o PDF. Utilize a opção de impressão do navegador.');
    } finally {
      restoreCanvasPattern();
      setIsExportingLinearPdf(false);
      setLinearPdfProgress('');
    }
  };

  // Ficha de Campo Ativa para edição / preview
  const defaultFicha = fichasDoBanco[0] || {
    id: 'f-default',
    contractId: contract?.id || 'c1',
    contractNumber: contract?.number || 'SR-400/2023',
    executingCompany: contract?.executingCompany || 'CONSTRUTORA MEIRELLES MASCARENHAS - CMM',
    supervisingCompany: contract?.supervisingCompany || 'Consórcio Matupiri',
    date: new Date().toISOString().split('T')[0],
    weatherCondition: 'Bom',
    responsibleTech: 'Eng. Civil Patrick Diniz, Téc. Virgílio Ximenes',
    equipments: [
      { type: 'Caminhão Comboio', quantity: 1 },
      { type: 'Caminhão Pipa', quantity: 2 },
      { type: 'Caminhão Basculante', quantity: 2 },
      { type: 'Espargidor', quantity: 1 },
      { type: 'Motoniveladora', quantity: 2 },
      { type: 'Rolo Compactador', quantity: 2 },
      { type: 'Trator Agrícola com Grade', quantity: 1 },
      { type: 'Caminhão Silo (Cebolão)', quantity: 1 },
      { type: 'Carro de Apoio', quantity: 1 }
    ],
    activities: [
      {
        activity: 'Revestimento Primário Com Adição de 3,5% de Cimento',
        kmInitial: 386.96,
        kmFinal: 386.20,
        extensionKm: 0.760
      }
    ],
    occurrences: 'Nenhuma ocorrência registrada',
    observations: 'Foi registrado que, no período matutino, a equipe da empresa executora deu continuidade aos serviços de execução do revestimento primário com adição de 3,5% de cimento, no segmento compreendido entre os quilômetros 386,96 e 386,20, perfazendo uma extensão total de 760 metros. As atividades foram realizadas em conformidade com o planejamento operacional, atendendo às especificações técnicas e aos procedimentos executivos estabelecidos para a obra.',
    generatedAt: new Date().toLocaleDateString('pt-BR') + ' 12:04',
    kmReference: 'KM 386.92',
    pageInfo: `${contract?.supervisingCompany || 'Consórcio Matupiri'} - DNIT/AM`
  };

  const [currentFicha, setCurrentFicha] = useState<FichaDeCampoRecord>(defaultFicha);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUploadedModal, setPreviewUploadedModal] = useState<FichaDeCampoRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar Ficha ao mudar contrato
  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    const selContract = contracts.find(c => c.id === contractId);
    const fichas = db.getFichasDeCampo(contractId);
    if (fichas.length > 0) {
      setCurrentFicha(fichas[0]);
    } else if (selContract) {
      setCurrentFicha({
        ...defaultFicha,
        id: 'f-' + Date.now(),
        contractId: selContract.id,
        contractNumber: selContract.number,
        executingCompany: selContract.executingCompany,
        supervisingCompany: selContract.supervisingCompany,
      });
    }
  };

  // Sincronizar Atividades da Ficha atual com o Banco do SCLAF
  const handleSyncCurrentActivitiesToSclaf = () => {
    if (!currentFicha.activities || currentFicha.activities.length === 0) {
      setUploadError('Nenhuma atividade cadastrada na Ficha de Campo para sincronizar com o SCLAF.');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }

    const count = syncActivitiesToSclaf(
      contract.id,
      currentFicha.activities,
      currentFicha.date,
      `RDO-${currentFicha.contractNumber.replace(/[\/\s]/g, '')}`
    );

    setUploadSuccess(`Sucesso! ${count} atividade(s) da Ficha de Campo foram lançadas e registradas no Motor Linear do SCLAF!`);
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  // Preencher atividades do RDO a partir dos lançamentos reais do contrato
  const handlePopulateFromExecutions = () => {
    const recentExecs = db.getExecutions(contract?.id);
    if (recentExecs.length === 0) {
      alert('Não há execuções cadastradas neste contrato para carregar.');
      return;
    }

    const mapActivities: ActivityItem[] = recentExecs.slice(0, 5).map(e => {
      const s = services.find(srv => srv.id === e.serviceId);
      return {
        activity: s?.name || 'Serviço de Pavimentação',
        kmInitial: e.kmInitial,
        kmFinal: e.kmFinal,
        extensionKm: Number((e.extensionMeters / 1000).toFixed(3))
      };
    });

    setCurrentFicha(prev => ({
      ...prev,
      activities: mapActivities,
      observations: `Atividades importadas automaticamente do Motor Linear do SCLAF referente à data ${mapActivities[0] ? recentExecs[0].date : prev.date}. Total de ${mapActivities.length} trechos mapeados com controle de amostragem.`
    }));
  };

  // Gerar PDF do Resumo de Execuções Físicas
  const handleGenerateResumoPdf = async () => {
    setIsGeneratingPdf(true);
    const restoreCanvasPattern = installCanvasPatternSafeguard();
    try {
      const element = document.getElementById('resumo-execucoes-container');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc, clonedEl) => {
          if (clonedEl) {
            (clonedEl.style as any).webkitFontSmoothing = 'antialiased';
            clonedEl.style.textRendering = 'optimizeLegibility';
          }
          cleanClonedDocForPdfExport(clonedDoc, clonedEl);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const cleanContractNum = contract?.number ? contract.number.replace(/[\/\s]/g, '_') : 'SCLAF';
      pdf.save(`RESUMO_EXECUCOES_${cleanContractNum}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF do resumo:', err);
      window.print();
    } finally {
      restoreCanvasPattern();
      setIsGeneratingPdf(false);
    }
  };

  // Gerenciador inteligente do botão principal de exportação de PDF
  const handleMainExportPdf = () => {
    if (activeTab === 'diagrama_linear') {
      handleExportLinearReportPdf();
    } else if (activeTab === 'boletim_medicao') {
      handleGenerateResumoPdf();
    } else {
      handleGeneratePdfJs();
    }
  };

  // Gerar PDF direto usando jsPDF + html2canvas
  const handleGeneratePdfJs = async () => {
    setIsGeneratingPdf(true);
    const restoreCanvasPattern = installCanvasPatternSafeguard();
    try {
      const element = document.getElementById('ficha-de-campo-container');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1600,
        onclone: (clonedDoc, clonedEl) => {
          if (clonedEl) {
            (clonedEl.style as any).webkitFontSmoothing = 'antialiased';
            clonedEl.style.textRendering = 'optimizeLegibility';
          }
          cleanClonedDocForPdfExport(clonedDoc, clonedEl);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`FICHA_DE_CAMPO_RDO_${currentFicha.contractNumber.replace(/[\/\s]/g, '_')}_${currentFicha.date}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF com jsPDF, utilizando impressão nativa:', err);
      window.print();
    } finally {
      restoreCanvasPattern();
      setIsGeneratingPdf(false);
    }
  };

  // Salvar Ficha de Campo no banco de dados local do SCLAF e sincronizar atividades
  const handleSaveFicha = () => {
    db.addFichaDeCampo({
      ...currentFicha,
      contractId: contract.id,
      contractNumber: contract.number,
      executingCompany: contract.executingCompany,
      supervisingCompany: contract.supervisingCompany,
      generatedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    if (currentFicha.activities && currentFicha.activities.length > 0) {
      syncActivitiesToSclaf(contract.id, currentFicha.activities, currentFicha.date);
    }

    setUploadSuccess('Ficha de Campo (Diário de Obras) e suas atividades foram salvas e sincronizadas com o SCLAF!');
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  // Upload de arquivo externo com extração de atividades via IA e sincronização no SCLAF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);

    try {
      // 1. Ler e extrair dados/atividades do arquivo (PDF, Imagem ou JSON)
      const parseResult = await parseFichaDeCampoFile(file, contract.id, contract.number);

      // Ler base64 para armazenar o anexo
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileBase64 = event.target?.result as string;

        // 2. Sincronizar as atividades lidas diretamente com as execuções físicas do SCLAF
        const syncedCount = syncActivitiesToSclaf(
          contract.id,
          parseResult.activities,
          parseResult.date || new Date().toISOString().split('T')[0]
        );

        // 3. Criar registro de Ficha no Banco do SCLAF com as atividades extraídas
        const newFicha = db.addFichaDeCampo({
          contractId: contract.id,
          contractNumber: parseResult.contractNumber || contract.number,
          executingCompany: contract.executingCompany,
          supervisingCompany: contract.supervisingCompany,
          date: parseResult.date || new Date().toISOString().split('T')[0],
          weatherCondition: parseResult.weatherCondition || 'Bom',
          responsibleTech: parseResult.responsibleTech || 'Eng. Civil / Téc. de Campo DNIT',
          equipments: parseResult.equipments && parseResult.equipments.length > 0 ? parseResult.equipments : currentFicha.equipments,
          activities: parseResult.activities,
          occurrences: parseResult.occurrences || 'Ficha de campo anexada e lida via SCLAF',
          observations: parseResult.observations || `Atividades extraídas automaticamente do arquivo ${file.name}.`,
          uploadedFileUrl: fileBase64,
          fileName: file.name,
          fileType: file.type,
          generatedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });

        setCurrentFicha(newFicha);
        setIsParsingFile(false);
        setUploadSuccess(
          `Arquivo "${file.name}" processado com sucesso! ` +
          `${parseResult.activities.length} atividade(s) lida(s) do arquivo e ${syncedCount} registrada(s) no Motor Linear SCLAF.`
        );
      };

      if (file.type.includes('json') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Erro ao ler e processar arquivo de Ficha de Campo:', err);
      setIsParsingFile(false);
      setUploadError('Erro ao ler o arquivo. Certifique-se de que é um documento PDF, imagem ou JSON válido.');
    }
  };

  // Adicionar equipamento
  const handleAddEquipment = () => {
    setCurrentFicha(prev => ({
      ...prev,
      equipments: [...prev.equipments, { type: 'Novo Equipamento', quantity: 1 }]
    }));
  };

  // Remover equipamento
  const handleRemoveEquipment = (index: number) => {
    setCurrentFicha(prev => ({
      ...prev,
      equipments: prev.equipments.filter((_, idx) => idx !== index)
    }));
  };

  // Adicionar atividade
  const handleAddActivity = () => {
    setCurrentFicha(prev => ({
      ...prev,
      activities: [...prev.activities, { activity: 'Novo Serviço', kmInitial: 100.0, kmFinal: 101.0, extensionKm: 1.0 }]
    }));
  };

  // Remover atividade
  const handleRemoveActivity = (index: number) => {
    setCurrentFicha(prev => ({
      ...prev,
      activities: prev.activities.filter((_, idx) => idx !== index)
    }));
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Banner Principal */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <FileCheck className="w-4 h-4" />
            <span>Módulo de Emissão de Relatórios e RDO DNIT</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Ficha de Campo - Diário de Obras (RDO)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gere, visualize e faça upload de Fichas de Campo no modelo idêntico ao do Consórcio Matupiri / DNIT.
          </p>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingFile}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 font-bold rounded-xl text-xs transition shadow flex items-center space-x-2 disabled:opacity-50"
          >
            {isParsingFile ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <UploadCloud className="w-4 h-4 text-blue-400" />
            )}
            <span>{isParsingFile ? 'Lendo Atividades do Arquivo...' : 'Upload Ficha (PDF/Anexo)'}</span>
          </button>

          <button
            onClick={handleMainExportPdf}
            disabled={isGeneratingPdf || isExportingLinearPdf}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center space-x-2 border border-purple-500 disabled:opacity-50"
          >
            {isGeneratingPdf || isExportingLinearPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {isGeneratingPdf || isExportingLinearPdf
                ? 'Gerando PDF...'
                : activeTab === 'diagrama_linear'
                ? 'Baixar PDF Diagrama Linear'
                : activeTab === 'boletim_medicao'
                ? 'Baixar PDF Resumo Físico'
                : 'Baixar PDF Oficial'}
            </span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
            title="Imprimir via Navegador (Ctrl+P)"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Imprimir</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Tabs e Seletor de Contrato */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('ficha_oficial')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
              activeTab === 'ficha_oficial'
                ? 'bg-[#580766] text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ficha de Campo (Diário de Obras)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload_externo')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
              activeTab === 'upload_externo'
                ? 'bg-[#580766] text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Fichas Anexadas ({fichasDoBanco.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('boletim_medicao')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
              activeTab === 'boletim_medicao'
                ? 'bg-[#580766] text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Resumo de Execuções Físicas</span>
          </button>

          <button
            onClick={() => setActiveTab('diagrama_linear')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
              activeTab === 'diagrama_linear'
                ? 'bg-[#580766] text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Diagrama Linear (4 Faixas/Página)</span>
          </button>
        </div>

        {/* Seletor do Contrato */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-300 shrink-0">Contrato:</span>
          <select
            value={selectedContractId}
            onChange={(e) => handleContractChange(e.target.value)}
            className="bg-slate-800 text-purple-200 font-mono font-bold text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 max-w-xs truncate"
          >
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.number} — {c.highway}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PAINEL DE CONFIGURAÇÃO DE IMPRESSÃO & LAYOUT (PRINT CONFIGURATION PANEL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:hidden">
        {/* Cabeçalho do Painel de Configurações */}
        <div className="p-4 sm:px-5 sm:py-3.5 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-950/80 border border-purple-800 rounded-xl text-purple-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  Opções de Impressão & Layout do Relatório
                </h3>
                <span className="px-2 py-0.5 bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded-full text-[10px] font-mono font-bold">
                  Print Options
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Personalize cabeçalhos de tabela, quebras de página a cada 4 itens e identificação visual corporativa.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetPrintConfig}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
              title="Restaurar valores padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Padrões</span>
            </button>

            <button
              onClick={() => setIsConfigPanelExpanded(!isConfigPanelExpanded)}
              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800 text-xs font-bold rounded-lg transition flex items-center space-x-1.5"
            >
              <span>{isConfigPanelExpanded ? 'Recolher Opções' : 'Configurar Opções'}</span>
              {isConfigPanelExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Corpo do Painel com os 3 Toggles Solicitados */}
        {isConfigPanelExpanded && (
          <div className="p-4 sm:p-5 space-y-4 bg-slate-900/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Opção 1: Include Table Headers */}
              <div
                onClick={() => toggleIncludeTableHeaders(!includeTableHeaders)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  includeTableHeaders
                    ? 'bg-purple-950/30 border-purple-700/80 shadow-md shadow-purple-950/20'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${includeTableHeaders ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        <Table className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-white">
                        Incluir Cabeçalhos de Tabela
                      </span>
                    </div>

                    {/* Custom Toggle Switch */}
                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${includeTableHeaders ? 'bg-purple-600' : 'bg-slate-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${includeTableHeaders ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Exibe títulos de colunas e linhas identificadoras nas tabelas de equipamentos, serviços e avanços físicos.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">Include Table Headers</span>
                  <span className={`font-bold ${includeTableHeaders ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {includeTableHeaders ? 'ATIVADO' : 'OCULTO'}
                  </span>
                </div>
              </div>

              {/* Opção 2: Page Break After Every 4th Item */}
              <div
                onClick={() => togglePageBreakAfterEvery4thItem(!pageBreakAfterEvery4thItem)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  pageBreakAfterEvery4thItem
                    ? 'bg-purple-950/30 border-purple-700/80 shadow-md shadow-purple-950/20'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${pageBreakAfterEvery4thItem ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-white">
                        Quebra de Página (4 Itens)
                      </span>
                    </div>

                    {/* Custom Toggle Switch */}
                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${pageBreakAfterEvery4thItem ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${pageBreakAfterEvery4thItem ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Formata e agrupa listas de atividades, medições e faixas em blocos de 4 itens por folha para impressão A4.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">Page Break Every 4th</span>
                  <span className={`font-bold ${pageBreakAfterEvery4thItem ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {pageBreakAfterEvery4thItem ? '4 ITENS / PÁGINA' : 'FLUXO CONTÍNUO'}
                  </span>
                </div>
              </div>

              {/* Opção 3: Custom Company Header */}
              <div
                onClick={() => toggleCustomCompanyHeader(!customCompanyHeader)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  customCompanyHeader
                    ? 'bg-purple-950/30 border-purple-700/80 shadow-md shadow-purple-950/20'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${customCompanyHeader ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-white">
                        Cabeçalho Corporativo
                      </span>
                    </div>

                    {/* Custom Toggle Switch */}
                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ${customCompanyHeader ? 'bg-purple-600' : 'bg-slate-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${customCompanyHeader ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Exibe a logomarca do Consórcio/Supervisora e dados da executora em conjunto com a chancela oficial DNIT.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">Custom Company Header</span>
                  <span className={`font-bold ${customCompanyHeader ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {customCompanyHeader ? 'EMPRESA + DNIT' : 'APENAS DNIT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 text-[11px] font-semibold">Predefinições Rápidas:</span>
                <button
                  onClick={() => {
                    toggleIncludeTableHeaders(true);
                    togglePageBreakAfterEvery4thItem(true);
                    toggleCustomCompanyHeader(true);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px] border border-slate-700 font-medium transition"
                >
                  Padrão Oficial (Todos Ativos)
                </button>
                <button
                  onClick={() => {
                    toggleIncludeTableHeaders(false);
                    togglePageBreakAfterEvery4thItem(false);
                    toggleCustomCompanyHeader(true);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px] border border-slate-700 font-medium transition"
                >
                  Modo Compacto Sem Cabeçalhos
                </button>
                <button
                  onClick={() => {
                    toggleIncludeTableHeaders(true);
                    togglePageBreakAfterEvery4thItem(true);
                    toggleCustomCompanyHeader(false);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px] border border-slate-700 font-medium transition"
                >
                  Modo Institucional DNIT
                </button>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                <span>Aplicado em tempo real em todas as abas e exportações PDF.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alertas de Notificação */}
      {uploadSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold rounded-xl flex items-center space-x-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-xl flex items-center space-x-2 print:hidden">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* TABA 1: FICHA DE CAMPO OFICIAL E EDITOR INTERATIVO */}
      {activeTab === 'ficha_oficial' && (
        <div className="space-y-6">
          {/* Painel de Edição Rápida da Ficha de Campo */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Formulário da Ficha de Campo</h3>
                <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
                  DNIT Modelo Matupiri
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePopulateFromExecutions}
                  className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Carregar Execuções Recentes do SCLAF</span>
                </button>

                <button
                  onClick={handleSaveFicha}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Salvar Ficha no Banco</span>
                </button>
              </div>
            </div>

            {/* Grid de Campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Data da Ficha:</label>
                <input
                  type="date"
                  value={currentFicha.date}
                  onChange={(e) => setCurrentFicha({ ...currentFicha, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Condição Climática:</label>
                <select
                  value={currentFicha.weatherCondition}
                  onChange={(e) => setCurrentFicha({ ...currentFicha, weatherCondition: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Bom">Bom</option>
                  <option value="Nublado">Nublado</option>
                  <option value="Chuvoso">Chuvoso</option>
                  <option value="Impraticável">Impraticável (Chuva Forte)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Técnico Responsável:</label>
                <input
                  type="text"
                  value={currentFicha.responsibleTech}
                  onChange={(e) => setCurrentFicha({ ...currentFicha, responsibleTech: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Eng. Civil Patrick Diniz..."
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Estaca / KM Referência:</label>
                <input
                  type="text"
                  value={currentFicha.kmReference || 'KM 386.92'}
                  onChange={(e) => setCurrentFicha({ ...currentFicha, kmReference: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Gerenciamento de Equipamentos */}
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 text-xs uppercase">
                  Equipamentos em Serviço ({currentFicha.equipments?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={handleAddEquipment}
                  className="px-2 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold hover:bg-purple-900 transition flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Equipamento</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {currentFicha.equipments?.map((eq, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      value={eq.type}
                      onChange={(e) => {
                        const updated = [...currentFicha.equipments];
                        updated[idx].type = e.target.value;
                        setCurrentFicha({ ...currentFicha, equipments: updated });
                      }}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs flex-1 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      value={eq.quantity}
                      onChange={(e) => {
                        const updated = [...currentFicha.equipments];
                        updated[idx].quantity = Number(e.target.value);
                        setCurrentFicha({ ...currentFicha, equipments: updated });
                      }}
                      className="bg-slate-800 border border-slate-700 rounded w-14 px-2 py-1 text-white text-xs font-mono text-center focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(idx)}
                      className="text-slate-400 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gerenciamento de Atividades */}
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-purple-300 text-xs uppercase">
                    Atividades em Execução ({currentFicha.activities?.length || 0})
                  </span>
                  {currentFicha.fileName && (
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
                      <FileCheck className="w-3 h-3 text-blue-400" />
                      <span>Lido de: {currentFicha.fileName}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSyncCurrentActivitiesToSclaf}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    title="Registra estas atividades no banco de execuções físicas do SCLAF"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Sincronizar no SCLAF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="px-2 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-lg text-xs font-semibold hover:bg-purple-900 transition flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Atividade</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {currentFicha.activities?.map((act, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 items-center text-xs">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={act.activity}
                        onChange={(e) => {
                          const updated = [...currentFicha.activities];
                          updated[idx].activity = e.target.value;
                          setCurrentFicha({ ...currentFicha, activities: updated });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none"
                        placeholder="Nome da atividade"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step={0.01}
                        value={act.kmInitial}
                        onChange={(e) => {
                          const updated = [...currentFicha.activities];
                          updated[idx].kmInitial = Number(e.target.value);
                          updated[idx].extensionKm = Math.abs(updated[idx].kmFinal - updated[idx].kmInitial);
                          setCurrentFicha({ ...currentFicha, activities: updated });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-center focus:outline-none"
                        placeholder="KM Inicial"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step={0.01}
                        value={act.kmFinal}
                        onChange={(e) => {
                          const updated = [...currentFicha.activities];
                          updated[idx].kmFinal = Number(e.target.value);
                          updated[idx].extensionKm = Math.abs(updated[idx].kmFinal - updated[idx].kmInitial);
                          setCurrentFicha({ ...currentFicha, activities: updated });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-center focus:outline-none"
                        placeholder="KM Final"
                      />
                    </div>
                    <div className="sm:col-span-2 font-mono font-bold text-center text-emerald-400">
                      {act.extensionKm.toFixed(3)} km
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(idx)}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ocorrências e Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Ocorrências Registradas:</label>
                <textarea
                  rows={2}
                  value={currentFicha.occurrences}
                  onChange={(e) => setCurrentFicha({ ...currentFicha, occurrences: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Observações do Diário:</label>
                <textarea
                  rows={2}
                  value={currentFicha.observations}
                  onChange={(e) => setCurrentFicha({ ...currentFicha, observations: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* VISUALIZADOR DA FICHA DE CAMPO IMPRESSA / DOCUMENTO OFICIAL */}
          <div id="ficha-de-campo-container" className="py-2">
            <FichaDeCampoDocument
              ficha={currentFicha}
              companyLogoUrl={settings.companyLogoUrl}
              companyName={settings.companyName}
              includeTableHeaders={includeTableHeaders}
              pageBreakAfterEvery4thItem={pageBreakAfterEvery4thItem}
              customCompanyHeader={customCompanyHeader}
            />
          </div>
        </div>
      )}

      {/* TABA 2: UPLOAD DE FICHAS EXTERNAS E HISTÓRICO DE ANEXOS */}
      {activeTab === 'upload_externo' && (
        <div className="space-y-6">
          {/* Zona de Drop Zone para Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-purple-800/80 hover:border-purple-500 bg-slate-900/90 hover:bg-slate-900 p-8 rounded-2xl text-center cursor-pointer transition space-y-3 group"
          >
            <div className="w-14 h-14 bg-purple-950/80 border border-purple-800 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition shadow-lg">
              <UploadCloud className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Clique ou arraste a Ficha de Campo (PDF / Imagem / JSON)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Suporta relatórios gerados em aplicativos de campo separados (PDF, PNG, JPG, JSON)
              </p>
            </div>
            <div className="inline-block px-4 py-1.5 bg-purple-900/50 text-purple-300 font-mono text-xs rounded-lg border border-purple-800">
              Contrato Ativo: {contract?.number} ({contract?.highway})
            </div>
          </div>

          {/* Lista de Fichas Anexadas */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Histórico de Fichas de Campo e Anexos no Sistema</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {fichasDoBanco.length} registros cadastrados
              </span>
            </div>

            {fichasDoBanco.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma Ficha de Campo externa anexada até o momento para este contrato.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Contrato</th>
                      <th className="p-3">Responsável</th>
                      <th className="p-3">Tipo / Arquivo</th>
                      <th className="p-3 text-center">Atividades</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {fichasDoBanco.map(f => (
                      <tr key={f.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono font-bold text-purple-300">{f.date}</td>
                        <td className="p-3 font-mono text-slate-300">{f.contractNumber}</td>
                        <td className="p-3 text-slate-300">{f.responsibleTech}</td>
                        <td className="p-3">
                          {f.fileName ? (
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono text-[11px] inline-block max-w-[180px] truncate">
                              {f.fileName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                              SCLAF Nativo
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-white">
                          {f.activities?.length || 0}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setCurrentFicha(f);
                              setActiveTab('ficha_oficial');
                            }}
                            className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded-lg font-semibold transition inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visualizar</span>
                          </button>

                          {f.uploadedFileUrl && (
                            <a
                              href={f.uploadedFileUrl}
                              download={f.fileName || 'Ficha_de_Campo_Anexo'}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg font-semibold transition inline-flex items-center space-x-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar Anexo</span>
                            </a>
                          )}

                          <button
                            onClick={() => {
                              db.deleteFichaDeCampo(f.id);
                              setUploadSuccess('Ficha de Campo removida com sucesso.');
                              setTimeout(() => setUploadSuccess(null), 3000);
                            }}
                            className="p-1 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABA 3: BOLETIM DE EXECUÇÕES FÍSICAS DO CONTRATO */}
      {activeTab === 'boletim_medicao' && (
        <div id="resumo-execucoes-container" className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 max-w-5xl mx-auto print:p-0 print:shadow-none print:border-none">
          {/* Cabeçalho */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 160" width="540" height="160"><g fill="%231d336f"><text x="10" y="125" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-style="italic" font-size="132" letter-spacing="-3">DNIT</text><text x="350" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-style="italic" font-size="20" letter-spacing="0.5">DEPARTAMENTO</text><text x="350" y="72" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-style="italic" font-size="20" letter-spacing="0.5">NACIONAL DE</text><text x="350" y="98" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-style="italic" font-size="20" letter-spacing="0.5">INFRAESTRUTURA</text><text x="350" y="124" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-style="italic" font-size="20" letter-spacing="0.5">DE TRANSPORTES</text></g></svg>`}
                alt="DNIT"
                className="h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-base font-black uppercase text-slate-900 leading-tight">
                  REPÚBLICA FEDERATIVA DO BRASIL — MINISTÉRIO DOS TRANSPORTES
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  DEPARTAMENTO NACIONAL DE INFRAESTRUTURA DE TRANSPORTES — DNIT
                </p>
                <p className="text-[11px] text-slate-600 font-bold">
                  {customCompanyHeader ? (settings.companyName || 'Consórcio Matupiri') : 'Supervisão Regional de Obras Rodoviárias'}
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              {customCompanyHeader && <div className="font-bold text-[#580766]">CONUG: {contract?.conug}</div>}
              <div className="text-slate-600">Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          {/* Ficha Técnica do Contrato */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">N° Contrato</span>
              <span className="font-bold font-mono text-slate-900">{contract?.number}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Rodovia / Lote</span>
              <span className="font-bold text-slate-900">{contract?.highway} ({contract?.lot})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Extensão Total</span>
              <span className="font-bold font-mono text-slate-900">{contract?.extensionKm} km</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Executora</span>
              <span className="font-bold text-slate-900 truncate block">{contract?.executingCompany}</span>
            </div>
          </div>

          {/* Tabela do Relatório */}
          <div>
            <h3 className="font-black text-sm text-slate-900 uppercase border-b border-slate-300 pb-1 mb-3">
              Detalhamento das Execuções Físicas Registradas
            </h3>

            {(() => {
              const executionChunks = pageBreakAfterEvery4thItem && executions.length > 4
                ? Array.from({ length: Math.ceil(executions.length / 4) }, (_, i) => executions.slice(i * 4, i * 4 + 4))
                : [executions];

              return (
                <div className="space-y-4">
                  {executionChunks.map((chunk, chunkIdx) => (
                    <div
                      key={`exec-chunk-${chunkIdx}`}
                      className={chunkIdx > 0 && pageBreakAfterEvery4thItem ? 'break-before-page print:break-before-page pt-4 border-t-2 border-dashed border-slate-300' : ''}
                    >
                      {pageBreakAfterEvery4thItem && executionChunks.length > 1 && (
                        <div className="text-[10px] font-mono font-bold text-slate-500 mb-1 flex items-center justify-between">
                          <span>Página {chunkIdx + 1} de {executionChunks.length}</span>
                          <span>Itens {chunkIdx * 4 + 1} a {Math.min(executions.length, (chunkIdx + 1) * 4)} de {executions.length}</span>
                        </div>
                      )}
                      <table className="w-full text-left text-xs border border-slate-300">
                        {includeTableHeaders && (
                          <thead className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                            <tr>
                              <th className="p-2 border-r border-slate-300">Data</th>
                              <th className="p-2 border-r border-slate-300">RDO</th>
                              <th className="p-2 border-r border-slate-300">Serviço Executado</th>
                              <th className="p-2 border-r border-slate-300">Quilometragem</th>
                              <th className="p-2 border-r border-slate-300">Extensão (m)</th>
                              <th className="p-2 border-r border-slate-300">Pista</th>
                              <th className="p-2">Responsável</th>
                            </tr>
                          </thead>
                        )}
                        <tbody className="divide-y divide-slate-200">
                          {chunk.map(exec => {
                            const s = services.find(srv => srv.id === exec.serviceId);
                            return (
                              <tr key={exec.id} className="hover:bg-slate-50">
                                <td className="p-2 border-r border-slate-200 font-mono">{exec.date}</td>
                                <td className="p-2 border-r border-slate-200 font-mono font-bold text-blue-900">{exec.rdoNumber || '-'}</td>
                                <td className="p-2 border-r border-slate-200 font-bold">{s?.name || 'Serviço'}</td>
                                <td className="p-2 border-r border-slate-200 font-mono">KM {exec.kmInitial.toFixed(3)} - {exec.kmFinal.toFixed(3)}</td>
                                <td className="p-2 border-r border-slate-200 font-bold font-mono">{exec.extensionMeters} m</td>
                                <td className="p-2 border-r border-slate-200">{exec.direction}</td>
                                <td className="p-2 text-slate-700">{exec.createdBy}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Resumo Consolidado */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Resumo do Avanço Físico do Contrato:</span>
              <span className="text-slate-600">Capa Final Concluída: <strong>{metrics.cbuqExecutedKm} km</strong> de {metrics.totalExtensionKm} km</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-900">{metrics.globalProgressPct}%</span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Avanço Físico Acumulado</span>
            </div>
          </div>
        </div>
      )}

      {/* TABA 4: RELATÓRIO DO DIAGRAMA LINEAR COM 4 FAIXAS FIXAS POR PÁGINA */}
      {activeTab === 'diagrama_linear' && (
        <div className="space-y-6">
          {/* Painel de Controle e Exportação */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>Layout Padronizado DNIT / Consórcio Matupiri</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Relatório Oficial do Diagrama Linear (4 Faixas Fixas / Página A4)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização técnica do avanço físico segmentado com 4 faixas estritas por folha, legenda técnica e cabeçalho executivo.
                </p>
              </div>

              {/* Botões de Exportação */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportLinearReportPdf}
                  disabled={isExportingLinearPdf}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center space-x-2 border border-purple-500 disabled:opacity-50"
                >
                  {isExportingLinearPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExportingLinearPdf ? (linearPdfProgress || 'Gerando PDF...') : 'Baixar PDF (4 Faixas/Pág)'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow"
                  title="Imprimir via Navegador (Ctrl+P)"
                >
                  <Printer className="w-4 h-4 text-purple-400" />
                  <span>Imprimir Relatório</span>
                </button>
              </div>
            </div>

            {/* Configurações e Navegação de Páginas */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Metadados do Relatório */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                  Extensão: <strong className="text-white font-mono">{contract?.extensionKm} km</strong> (KM {contract?.kmInitial.toFixed(1)} ao {contract?.kmFinal.toFixed(1)})
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                  Total de Faixas: <strong className="text-purple-300 font-mono">{chunks.length}</strong>
                </div>
                <div className="bg-purple-950/80 px-3 py-1.5 rounded-lg border border-purple-800 text-purple-200">
                  Paginação: <strong className="text-white font-mono">{paginatedChunks.length} folha(s)</strong> (4 faixas/folha)
                </div>
              </div>

              {/* Seletor de Extensão por Faixa */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-medium">Extensão por Faixa:</span>
                <select
                  value={linearChunkSizeKm}
                  onChange={(e) => {
                    setLinearChunkSizeKm(Number(e.target.value));
                    setActiveLinearPage(1);
                  }}
                  className="bg-slate-800 text-purple-300 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={12}>12 km / faixa (Padrão 4 Faixas = 48 km/pág)</option>
                  <option value={10}>10 km / faixa (4 Faixas = 40 km/pág)</option>
                  <option value={8}>8 km / faixa (4 Faixas = 32 km/pág)</option>
                  <option value={5}>5 km / faixa (4 Faixas = 20 km/pág)</option>
                  <option value={15}>15 km / faixa (4 Faixas = 60 km/pág)</option>
                  <option value={20}>20 km / faixa (4 Faixas = 80 km/pág)</option>
                </select>
              </div>

              {/* Paginação Interativa */}
              {paginatedChunks.length > 1 && (
                <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveLinearPage(p => Math.max(1, p - 1))}
                    disabled={activeLinearPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Página Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <select
                    value={activeLinearPage}
                    onChange={(e) => setActiveLinearPage(Number(e.target.value))}
                    className="bg-slate-800 text-white font-bold text-xs rounded-lg px-2 py-1 border border-slate-700"
                  >
                    {paginatedChunks.map((_, pIdx) => (
                      <option key={`p-sel-${pIdx}`} value={pIdx + 1}>
                        Folha {pIdx + 1} de {paginatedChunks.length} (Faixas {pIdx * 4 + 1} a {Math.min(chunks.length, (pIdx + 1) * 4)})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setActiveLinearPage(p => Math.min(paginatedChunks.length, p + 1))}
                    disabled={activeLinearPage >= paginatedChunks.length}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Próxima Página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pré-visualização da Folha Ativa (Exatamente 4 faixas fixas) */}
          {paginatedChunks.length > 0 && paginatedChunks[activeLinearPage - 1] ? (
            <div className="bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto">
              <div className="min-w-[1100px] max-w-[1440px] mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
                <LinearReportSheet
                  id={`reports-linear-preview-sheet-${activeLinearPage - 1}`}
                  contract={contract}
                  pageNumber={activeLinearPage}
                  totalPages={paginatedChunks.length}
                  chunks={paginatedChunks[activeLinearPage - 1]}
                  services={services}
                  isPavedContract={isPavedContract}
                  getFaixaDominioLeColor={getFaixaDominioLeColor}
                  getFaixaDominioLdColor={getFaixaDominioLdColor}
                  getAcostamentoLeColor={getAcostamentoLeColor}
                  getAcostamentoLdColor={getAcostamentoLdColor}
                  getEixoPistaColor={getEixoPistaColor}
                  companyLogoUrl={settings.companyLogoUrl}
                  companyName={settings.companyName}
                  includeTableHeaders={includeTableHeaders}
                  customCompanyHeader={customCompanyHeader}
                  showPageCount={true}
                  showSupervisionBadge={true}
                  showSubPercentage={true}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              Nenhum dado de sub-trecho disponível para este contrato.
            </div>
          )}
        </div>
      )}

      {/* RECIPIENTE OFF-SCREEN PARA EXPORTAÇÃO COMPLETA DE TODAS AS FOLHAS (4 FAIXAS/FOLHA) */}
      <div
        id="reports-linear-export-container"
        className="fixed left-0 top-0 opacity-0 pointer-events-none w-[1440px] z-[-9999] print:static print:left-0 print:opacity-100 print:z-auto print:pointer-events-auto print:w-full select-none"
        aria-hidden="true"
      >
        {paginatedChunks.map((pageChunks, pageIdx) => (
          <div key={`reports-export-sheet-wrapper-${pageIdx}`} className="break-after-page print:break-after-page mb-8 print:mb-0">
            <LinearReportSheet
              id={`reports-linear-sheet-${pageIdx}`}
              contract={contract}
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
              companyLogoUrl={settings.companyLogoUrl}
              companyName={settings.companyName}
              includeTableHeaders={includeTableHeaders}
              customCompanyHeader={customCompanyHeader}
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

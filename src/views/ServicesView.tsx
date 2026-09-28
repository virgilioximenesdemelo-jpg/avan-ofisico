/**
 * SCLAF — Tabela Mestre de Serviços Rodoviários por Contrato (Normas DNIT)
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { RoadService, Contract } from '../types';
import { getDnitStandardForService, DNIT_SERVICE_SPECS } from '../data/dnitStandards';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Palette,
  FileText,
  Bookmark,
  Sparkles,
  Search,
  Filter,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Ruler
} from 'lucide-react';

interface ServicesViewProps {
  activeContractId?: string;
  onRefresh: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ activeContractId = 'ALL', onRefresh }) => {
  const contracts = db.getContracts();
  const allServices = db.getServices();
  const currentUser = db.getCurrentUser();

  const [selectedContractFilter, setSelectedContractFilter] = useState<string>(
    activeContractId !== 'ALL' ? activeContractId : 'ALL'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<RoadService | null>(null);

  // Deletion Confirmation State (sem depender de window.confirm que falha em iframes)
  const [serviceToDelete, setServiceToDelete] = useState<RoadService | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const [serviceContractId, setServiceContractId] = useState<string>('ctr-101');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RoadService['category']>('Pavimentação');
  const [surfaceType, setSurfaceType] = useState<RoadService['surfaceType']>('Pavimentado');
  const [executiveOrder, setExecutiveOrder] = useState<number>(1);
  const [color, setColor] = useState('#1e293b');
  const [dnitStandard, setDnitStandard] = useState('');
  const [defaultThicknessCm, setDefaultThicknessCm] = useState<string>('5.0');
  const [defaultWidthMeters, setDefaultWidthMeters] = useState<string>('7.2');
  const [description, setDescription] = useState('');

  const openCreateModal = (targetContractId?: string) => {
    setEditingService(null);
    const contractToAssign = targetContractId || (selectedContractFilter !== 'ALL' ? selectedContractFilter : contracts[0]?.id || 'ALL');
    setServiceContractId(contractToAssign);
    const count = allServices.length + 1;
    setCode(`SER-${count.toString().padStart(3, '0')}`);
    setName('');
    setCategory('Pavimentação');
    setSurfaceType('Pavimentado');
    setExecutiveOrder(count);
    setColor('#1e293b');
    setDnitStandard('DNIT 031/2006-ES');
    setDefaultThicknessCm('5.0');
    setDefaultWidthMeters('7.2');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: RoadService) => {
    setEditingService(s);
    setServiceContractId(s.contractId || 'ALL');
    setCode(s.code);
    setName(s.name);
    setCategory(s.category);
    setSurfaceType(s.surfaceType || 'Pavimentado');
    setExecutiveOrder(s.executiveOrder);
    setColor(s.color);
    setDnitStandard(s.dnitStandard || '');
    setDefaultThicknessCm(s.defaultThicknessCm !== undefined ? s.defaultThicknessCm.toString() : '');
    setDefaultWidthMeters(s.defaultWidthMeters !== undefined ? s.defaultWidthMeters.toString() : '');
    setDescription(s.description);
    setIsModalOpen(true);
  };

  // Sugere automaticamente norma DNIT ao preencher o nome
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingService) {
      const matched = getDnitStandardForService(val, category);
      if (matched.isMatched) {
        setDnitStandard(matched.normCode);
        setDefaultThicknessCm(matched.thicknessCm.toString());
        setDefaultWidthMeters(matched.widthMeters.toString());
      }
    }
  };

  const handleCategoryChange = (cat: RoadService['category']) => {
    setCategory(cat);
    if (!editingService) {
      const matched = getDnitStandardForService(name, cat);
      if (matched.isMatched) {
        setDnitStandard(matched.normCode);
        setDefaultThicknessCm(matched.thicknessCm.toString());
        setDefaultWidthMeters(matched.widthMeters.toString());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const thickness = defaultThicknessCm ? parseFloat(defaultThicknessCm.replace(',', '.')) : undefined;
    const width = defaultWidthMeters ? parseFloat(defaultWidthMeters.replace(',', '.')) : undefined;

    if (editingService) {
      db.updateService(editingService.id, {
        contractId: serviceContractId === 'ALL' ? undefined : serviceContractId,
        code,
        name,
        category,
        surfaceType,
        executiveOrder,
        color,
        dnitStandard,
        defaultThicknessCm: isNaN(thickness as number) ? undefined : thickness,
        defaultWidthMeters: isNaN(width as number) ? undefined : width,
        description,
      });
    } else {
      db.addService({
        contractId: serviceContractId === 'ALL' ? undefined : serviceContractId,
        code,
        name,
        category,
        surfaceType,
        executiveOrder,
        color,
        dnitStandard,
        defaultThicknessCm: isNaN(thickness as number) ? undefined : thickness,
        defaultWidthMeters: isNaN(width as number) ? undefined : width,
        iconName: 'Layers',
        description,
        active: true,
      });
    }
    setIsModalOpen(false);
    onRefresh();
  };

  const handleDeleteService = (id: string, serviceName?: string) => {
    const srv = allServices.find(s => s.id === id) || (editingService?.id === id ? editingService : null);
    if (srv) {
      setServiceToDelete(srv);
    } else {
      // Se por algum motivo o objeto não for encontrado, exclui diretamente
      db.deleteService(id);
      setIsModalOpen(false);
      onRefresh();
    }
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      const srvName = serviceToDelete.name;
      await db.deleteService(serviceToDelete.id);
      setServiceToDelete(null);
      setIsModalOpen(false);
      setFeedbackMessage(`Serviço "${srvName}" removido com sucesso.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
      onRefresh();
    }
  };

  // Filtragem de serviços por termo de busca
  const filterServicesBySearch = (srvList: RoadService[]) => {
    if (!searchTerm) return srvList;
    const q = searchTerm.toLowerCase();
    return srvList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.dnitStandard && s.dnitStandard.toLowerCase().includes(q))
    );
  };

  // Lista de contratos a exibir na visualização
  const displayedContracts = selectedContractFilter === 'ALL'
    ? contracts
    : contracts.filter(c => c.id === selectedContractFilter);

  // Serviços gerais sem contrato específico (ou ALL)
  const generalServices = allServices.filter(s => !s.contractId || s.contractId === 'ALL');

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Engenharia Rodoviária SCLAF • Normas DNIT</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Tabela de Serviços por Contrato</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Serviços executivos organizados e segregados por contrato rodoviário com conformidade às normas técnicas do DNIT.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar serviço ou norma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-[#580766] hover:bg-[#43054f] text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      {/* Feedback de Ação */}
      {feedbackMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage('')} className="text-emerald-400 hover:text-white cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Seletor de Abas de Contrato (Separação por Contrato) */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedContractFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            selectedContractFilter === 'ALL'
              ? 'bg-[#580766] text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Todos os Contratos ({contracts.length})</span>
        </button>

        {contracts.map(c => {
          const cServices = allServices.filter(s => s.contractId === c.id);
          const isSelected = selectedContractFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedContractFilter(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono">{c.highway}</span>
              <span>{c.number}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {cServices.length}
              </span>
            </button>
          );
        })}

        {generalServices.length > 0 && (
          <button
            onClick={() => setSelectedContractFilter('CATALOG')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
              selectedContractFilter === 'CATALOG'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Catálogo Geral ({generalServices.length})</span>
          </button>
        )}
      </div>

      {/* Exibição dos Blocos Separados por Contrato */}
      <div className="space-y-8">
        {selectedContractFilter !== 'CATALOG' && displayedContracts.map(contract => {
          const contractServices = filterServicesBySearch(
            allServices.filter(s => s.contractId === contract.id)
          );

          return (
            <div
              key={contract.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden"
            >
              {/* Cabeçalho do Contrato */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-black tracking-wider uppercase">
                      {contract.highway}
                    </span>
                    <h3 className="text-base font-black text-white">
                      Contrato {contract.number}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      (KM {contract.kmInitial.toFixed(1)} ao {contract.kmFinal.toFixed(1)} • {contract.extensionKm} km)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      {contract.surfaceType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Executora:</span> {contract.executingCompany} •{' '}
                    <span className="font-semibold text-slate-300">Supervisora:</span> {contract.supervisingCompany}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
                    {contractServices.length} {contractServices.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}
                  </span>

                  <button
                    onClick={() => openCreateModal(contract.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Serviço</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Serviços deste Contrato */}
              {contractServices.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <Layers className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">Nenhum serviço cadastrado especificamente para este contrato.</p>
                  <button
                    onClick={() => openCreateModal(contract.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition inline-flex items-center space-x-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Primeiro Serviço para o Contrato {contract.number}</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3 text-center">Ordem</th>
                        <th className="p-3">Cor Linear</th>
                        <th className="p-3">Código</th>
                        <th className="p-3">Serviço / Camada</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Norma DNIT</th>
                        <th className="p-3 text-center">Espessura (cm)</th>
                        <th className="p-3 text-center">Largura (m)</th>
                        <th className="p-3">Superfície</th>
                        <th className="p-3">Descrição Técnica</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {contractServices.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 text-center font-bold text-white">
                            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 inline-flex items-center justify-center font-mono text-xs shadow-xs">
                              {s.executiveOrder}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-5 h-5 rounded border border-white/20 shadow-xs inline-block shrink-0"
                                style={{ backgroundColor: s.color }}
                              ></span>
                              <span className="font-mono text-[10px] text-slate-400">{s.color}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-400">{s.code}</td>
                          <td className="p-3 font-extrabold text-white text-sm whitespace-nowrap">
                            {s.name}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-semibold text-[10px] whitespace-nowrap">
                              {s.category}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {s.dnitStandard ? (
                              <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-800 text-blue-300 rounded font-mono font-bold text-[10px] flex items-center space-x-1 w-fit">
                                <ShieldCheck className="w-3 h-3 text-blue-400" />
                                <span>{s.dnitStandard}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                            {s.defaultThicknessCm !== undefined && s.defaultThicknessCm > 0 ? (
                              <span>{s.defaultThicknessCm.toFixed(1)} cm</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {s.defaultWidthMeters !== undefined && s.defaultWidthMeters > 0 ? (
                              <span>{s.defaultWidthMeters.toFixed(2)} m</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                              s.surfaceType === 'Pavimentado' 
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                                : s.surfaceType === 'Não Pavimentado'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-blue-950 text-blue-300 border-blue-800'
                            }`}>
                              {s.surfaceType || 'Pavimentado'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]" title={s.description}>
                            {s.description || 'Sem observações técnicas.'}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                                title="Editar Serviço"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-service-${s.id}`}
                                onClick={() => handleDeleteService(s.id, s.name)}
                                className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded border border-slate-700 hover:border-red-800/80 transition cursor-pointer active:scale-95"
                                title="Excluir Serviço"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* Catálogo Geral de Serviços (Sem contrato específico ou aplicável a todos) */}
        {(selectedContractFilter === 'ALL' || selectedContractFilter === 'CATALOG') && generalServices.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black tracking-wider uppercase">
                    Catálogo Padrão
                  </span>
                  <h3 className="text-base font-black text-white">Serviços Gerais / Multicontrato</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Serviços padrão DNIT compartilhados entre todos os contratos ou ainda não vinculados.
                </p>
              </div>

              <button
                onClick={() => openCreateModal('ALL')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow self-start md:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Serviço Geral</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3 text-center">Ordem</th>
                    <th className="p-3">Cor Linear</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Serviço / Camada</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Norma DNIT</th>
                    <th className="p-3 text-center">Espessura (cm)</th>
                    <th className="p-3 text-center">Largura (m)</th>
                    <th className="p-3">Superfície</th>
                    <th className="p-3">Descrição Técnica</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filterServicesBySearch(generalServices).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-center font-bold text-white">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 inline-flex items-center justify-center font-mono text-xs">
                          {s.executiveOrder}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-5 h-5 rounded border border-white/20 shadow-xs inline-block shrink-0"
                            style={{ backgroundColor: s.color }}
                          ></span>
                          <span className="font-mono text-[10px] text-slate-400">{s.color}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-400">{s.code}</td>
                      <td className="p-3 font-extrabold text-white text-sm whitespace-nowrap">{s.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-semibold text-[10px]">
                          {s.category}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {s.dnitStandard ? (
                          <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-800 text-blue-300 rounded font-mono font-bold text-[10px]">
                            {s.dnitStandard}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                        {s.defaultThicknessCm !== undefined && s.defaultThicknessCm > 0 ? (
                          <span>{s.defaultThicknessCm.toFixed(1)} cm</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {s.defaultWidthMeters !== undefined && s.defaultWidthMeters > 0 ? (
                          <span>{s.defaultWidthMeters.toFixed(2)} m</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] border bg-slate-800 text-slate-300 border-slate-700">
                          {s.surfaceType || 'Ambos'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]">{s.description}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                            title="Editar Serviço"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-gen-service-${s.id}`}
                            onClick={() => handleDeleteService(s.id, s.name)}
                            className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded border border-slate-700 hover:border-red-800/80 transition cursor-pointer active:scale-95"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Serviço */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">
                  {editingService ? 'Editar Serviço Rodoviário' : 'Novo Serviço por Contrato'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Vinculação de Contrato */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Vincular ao Contrato <span className="text-purple-400">*</span>
                </label>
                <select
                  value={serviceContractId}
                  onChange={(e) => setServiceContractId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">🌐 Todos os Contratos (Catálogo Geral)</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.highway} — Contrato {c.number} ({c.kmInitial} a {c.kmFinal} km)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  O serviço ficará segregado e listado exclusivamente sob a aba deste contrato.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código do Serviço</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ordem Executiva (Hierarquia)</label>
                  <input
                    type="number"
                    value={executiveOrder}
                    onChange={(e) => setExecutiveOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Serviço / Camada</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: CBUQ - Concreto Asfáltico Faixa C"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="Terraplenagem">Terraplenagem</option>
                    <option value="Pavimentação">Pavimentação</option>
                    <option value="Drenagem">Drenagem</option>
                    <option value="Sinalização">Sinalização</option>
                    <option value="Conservação">Conservação</option>
                    <option value="Obras de Arte">Obras de Arte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superfície</label>
                  <select
                    value={surfaceType}
                    onChange={(e) => setSurfaceType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-none"
                  >
                    <option value="Pavimentado">Pavimentado (Asfalto/Concreto)</option>
                    <option value="Não Pavimentado">Não Pavimentado (Terra/Cascalho)</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>
              </div>

              {/* Seção DNIT: Norma, Espessura e Largura */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Especificações Técnicas e Dimensionamento DNIT</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Norma Oficial DNIT</label>
                  <input
                    type="text"
                    value={dnitStandard}
                    onChange={(e) => setDnitStandard(e.target.value)}
                    placeholder="Ex: DNIT 031/2006-ES, DNIT 141/2010-ES..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Espessura Padrão (cm)
                    </label>
                    <input
                      type="text"
                      value={defaultThicknessCm}
                      onChange={(e) => setDefaultThicknessCm(e.target.value)}
                      placeholder="Ex: 5.0 (CBUQ) ou 15.0 (BGS)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Largura Padrão (m)
                    </label>
                    <input
                      type="text"
                      value={defaultWidthMeters}
                      onChange={(e) => setDefaultWidthMeters(e.target.value)}
                      placeholder="Ex: 7.20 (pista total) ou 3.60"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cor no Motor Linear</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-9 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição Técnica / Observações</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Especificação de usinagem, taxas de ligante, grau de compactação..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <div>
                  {editingService && (
                    <button
                      type="button"
                      onClick={() => handleDeleteService(editingService.id, editingService.name)}
                      className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-semibold border border-red-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#580766] hover:bg-[#43054f] text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer"
                  >
                    Salvar Serviço
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão de Serviço (Substituto seguro do window.confirm) */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white text-base">Excluir Serviço Rodoviário?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tem certeza que deseja remover este serviço do catálogo do SCLAF?
                </p>
                <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                      {serviceToDelete.code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {serviceToDelete.category}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {serviceToDelete.name}
                  </div>
                  {serviceToDelete.dnitStandard && (
                    <div className="text-[11px] text-blue-300 font-mono flex items-center space-x-1.5 pt-0.5">
                      <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>Norma: {serviceToDelete.dnitStandard}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
              Esta ação removerá o serviço imediatamente das tabelas e atualizará a base de dados com persistência.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-service"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-900/40 flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

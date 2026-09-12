/**
 * SCLAF — Módulo Operacional de Lançamento de Execuções Físicas
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { Contract, RoadService, TrackDirection, ExecutionRecord } from '../types';
import {
  Activity,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';

interface ExecutionsViewProps {
  activeContractId: string;
  onRefresh?: () => void;
}

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({ activeContractId, onRefresh }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const contracts = db.getContracts();
  const services = db.getServices();
  const currentUser = db.getCurrentUser();

  const [editingExecution, setEditingExecution] = useState<ExecutionRecord | null>(null);
  const [executionToDelete, setExecutionToDelete] = useState<ExecutionRecord | null>(null);

  const [selectedContractId, setSelectedContractId] = useState<string>(
    activeContractId !== 'ALL' ? activeContractId : contracts[0]?.id || ''
  );
  const [serviceId, setServiceId] = useState<string>(services[8]?.id || services[0]?.id || ''); // Default CBUQ
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [kmInitial, setKmInitial] = useState<string>('105.000');
  const [kmFinal, setKmFinal] = useState<string>('107.500');
  const [direction, setDirection] = useState<TrackDirection>('Crescente');
  const [thicknessCm, setThicknessCm] = useState<string>('5.0');
  const [widthMeters, setWidthMeters] = useState<string>('7.2');
  const [rdoNumber, setRdoNumber] = useState<string>('');
  const [teamLeader, setTeamLeader] = useState<string>('Enc. Antônio Carlos');
  const [observations, setObservations] = useState<string>('');

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const activeContract = contracts.find(c => c.id === selectedContractId) || contracts[0];
  const allExecutions = db.getExecutions(activeContractId === 'ALL' ? undefined : activeContractId);

  const startEditExecution = (exec: ExecutionRecord) => {
    setEditingExecution(exec);
    setSelectedContractId(exec.contractId);
    setServiceId(exec.serviceId);
    setDate(exec.date);
    setKmInitial(exec.kmInitial.toString());
    setKmFinal(exec.kmFinal.toString());
    setDirection(exec.direction);
    setThicknessCm(exec.thicknessCm ? exec.thicknessCm.toString() : '');
    setWidthMeters(exec.widthMeters ? exec.widthMeters.toString() : '');
    setRdoNumber(exec.rdoNumber || '');
    setTeamLeader(exec.teamLeader || '');
    setObservations(exec.observations || '');
    setFormSuccess('');
    setFormError('');
  };

  const cancelEditExecution = () => {
    setEditingExecution(null);
    setKmInitial('105.000');
    setKmFinal('107.500');
    setRdoNumber('');
    setFormSuccess('');
    setFormError('');
  };

  // Filtro de buscas
  const filteredExecutions = allExecutions.filter(e => {
    const s = services.find(srv => srv.id === e.serviceId);
    const searchLower = searchTerm.toLowerCase();
    return (
      (s && s.name.toLowerCase().includes(searchLower)) ||
      (e.rdoNumber && e.rdoNumber.toLowerCase().includes(searchLower)) ||
      e.kmInitial.toString().includes(searchLower) ||
      e.kmFinal.toString().includes(searchLower)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const kInit = parseFloat(kmInitial.replace(',', '.'));
    const kFin = parseFloat(kmFinal.replace(',', '.'));

    if (isNaN(kInit) || isNaN(kFin)) {
      setFormError('Informe valores numéricos válidos para Quilometragem Inicial e Final.');
      return;
    }

    if (kInit >= kFin) {
      setFormError('A Quilometragem Final deve ser estritamente maior que a Inicial.');
      return;
    }

    if (activeContract) {
      const minContractKm = Math.min(activeContract.kmInitial, activeContract.kmFinal);
      const maxContractKm = Math.max(activeContract.kmInitial, activeContract.kmFinal);
      if (kInit < minContractKm || kFin > maxContractKm) {
        setFormError(
          `Fora do trecho do contrato! O contrato abrange do KM ${minContractKm} ao KM ${maxContractKm}.`
        );
        return;
      }
    }

    if (editingExecution) {
      db.updateExecution(editingExecution.id, {
        contractId: selectedContractId,
        serviceId,
        date,
        kmInitial: kInit,
        kmFinal: kFin,
        direction,
        thicknessCm: parseFloat(thicknessCm) || undefined,
        widthMeters: parseFloat(widthMeters) || undefined,
        rdoNumber,
        teamLeader,
        observations,
      });
      setFormSuccess(`Lançamento de ${Math.round((kFin - kInit) * 1000)}m atualizado com sucesso!`);
      setEditingExecution(null);
    } else {
      // Salvar execução no motor SCLAF
      db.addExecution({
        contractId: selectedContractId,
        serviceId,
        date,
        kmInitial: kInit,
        kmFinal: kFin,
        direction,
        thicknessCm: parseFloat(thicknessCm) || undefined,
        widthMeters: parseFloat(widthMeters) || undefined,
        rdoNumber,
        teamLeader,
        observations,
        status: 'Aprovado',
      });

      const extensionM = Math.round((kFin - kInit) * 1000);
      setFormSuccess(`Lançamento de ${extensionM}m salvo com sucesso! O Motor Linear foi atualizado.`);

      // Resetar campos para próximo lançamento
      setKmInitial(kFin.toFixed(3));
      setKmFinal((kFin + 1.0).toFixed(3));
      setRdoNumber('');
    }

    setRefreshKey(prev => prev + 1);
    if (onRefresh) onRefresh();
  };

  const requestDelete = (exec: ExecutionRecord) => {
    setExecutionToDelete(exec);
  };

  const confirmDelete = () => {
    if (executionToDelete) {
      db.deleteExecution(executionToDelete.id);
      if (editingExecution?.id === executionToDelete.id) {
        cancelEditExecution();
      }
      setExecutionToDelete(null);
      setFormSuccess('Registro removido do banco do SCLAF com sucesso.');
      setRefreshKey(prev => prev + 1);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Banner Titular */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Módulo Operacional do SCLAF</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Lançamento de Avanço Físico Diário</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre os serviços executados em campo. O sistema atualizará automaticamente o Diagrama Linear de 20 metros.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Operacional */}
        <div className="lg:col-span-1 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              {editingExecution ? (
                <Edit className="w-5 h-5 text-purple-400" />
              ) : (
                <Plus className="w-5 h-5 text-emerald-400" />
              )}
              <h3 className="font-bold text-white text-sm">
                {editingExecution ? 'Editar Lançamento' : 'Novo Lançamento Operacional'}
              </h3>
            </div>
            {editingExecution && (
              <button
                type="button"
                onClick={cancelEditExecution}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar Edição</span>
              </button>
            )}
          </div>

          {formSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contrato</label>
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.number} — {c.highway} ({c.kmInitial} a {c.kmFinal} km)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Serviço / Camada Executada</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    Ord {s.executiveOrder}. {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Data Execução</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lado / Sentido da Pista</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TrackDirection)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none font-semibold"
                >
                  <option value="Eixo Central">Ambos os Lados / Pista Toda (Eixo)</option>
                  <option value="Decrescente">Lado Esquerdo (LE)</option>
                  <option value="Crescente">Lado Direito (LD)</option>
                  <option value="Pista Dupla Esq">Pista Dupla - Lado Esquerdo (LE)</option>
                  <option value="Pista Dupla Dir">Pista Dupla - Lado Direito (LD)</option>
                </select>
              </div>
            </div>

            {/* Início da Indicação de Destino no Diagrama Linear */}
            {(() => {
              const selectedSrv = services.find(s => s.id === serviceId);
              if (!selectedSrv) return null;
              
              const isFaixaDominio = (selectedSrv.category === 'Conservação' || selectedSrv.category === 'Drenagem' || selectedSrv.name.toLowerCase().includes('limpeza') || selectedSrv.name.toLowerCase().includes('roçada') || selectedSrv.name.toLowerCase().includes('drenagem')) && !selectedSrv.name.includes('Revestimento Primário') && !selectedSrv.name.includes('Cascalhamento');
              
              const sideLabel = direction === 'Decrescente' || direction === 'Pista Dupla Esq' || direction === 'Lado Esquerdo'
                ? 'Lado Esquerdo (LE)'
                : direction === 'Crescente' || direction === 'Pista Dupla Dir' || direction === 'Lado Direito'
                ? 'Lado Direito (LD)'
                : 'Ambos os Lados (LE, LD e Eixo)';

              return (
                <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 text-[11px] text-slate-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold">
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: selectedSrv.color }}></span>
                    <span className="text-white">{selectedSrv.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded font-mono">
                      {selectedSrv.surfaceType || 'PAV / NPAV'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400">
                    {isFaixaDominio ? (
                      <span className="text-emerald-400 font-semibold">
                        📌 Exibido na <strong>Faixa de Domínio</strong> ({sideLabel}).
                      </span>
                    ) : (
                      <span className="text-amber-300 font-semibold">
                        🛣️ Exibido no <strong>Eixo da Pista e Acostamentos</strong> ({sideLabel}).
                      </span>
                    )}
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">KM Inicial (ex: 100.000)</label>
                <input
                  type="text"
                  value={kmInitial}
                  onChange={(e) => setKmInitial(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">KM Final (ex: 105.400)</label>
                <input
                  type="text"
                  value={kmFinal}
                  onChange={(e) => setKmFinal(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Espessura (cm)</label>
                <input
                  type="text"
                  value={thicknessCm}
                  onChange={(e) => setThicknessCm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Largura (m)</label>
                <input
                  type="text"
                  value={widthMeters}
                  onChange={(e) => setWidthMeters(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">N° RDO (Opcional)</label>
                <input
                  type="text"
                  value={rdoNumber}
                  onChange={(e) => setRdoNumber(e.target.value)}
                  placeholder="Ex: RDO-2026/0145 (Opcional)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Encarregado / Equipe</label>
                <input
                  type="text"
                  value={teamLeader}
                  onChange={(e) => setTeamLeader(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Observações Técnicas</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                placeholder="Ex: Equipamentos utilizados, temperatura da massa, condições climáticas..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none text-xs"
              ></textarea>
            </div>

            <div className="flex space-x-2">
              {editingExecution && (
                <button
                  type="button"
                  onClick={() => requestDelete(editingExecution)}
                  className="px-3 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              )}
              <button
                type="submit"
                className="w-full bg-[#580766] hover:bg-[#43054f] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{editingExecution ? 'Atualizar Lançamento' : 'Salvar Execução e Atualizar Motor Linear'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Execuções Cadastradas */}
        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Histórico de Lançamentos Físicos</h3>
                <p className="text-xs text-slate-400">Total de {filteredExecutions.length} registros cadastrados</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por RDO ou Serviço..."
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-2.5">Data / RDO</th>
                    <th className="p-2.5">Serviço</th>
                    <th className="p-2.5">Quilometragem (KM)</th>
                    <th className="p-2.5">Extensão</th>
                    <th className="p-2.5">Sentido</th>
                    <th className="p-2.5">Lançado por</th>
                    <th className="p-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExecutions.map(exec => {
                    const s = services.find(srv => srv.id === exec.serviceId);
                    return (
                      <tr key={exec.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-2.5">
                          <div className="font-mono text-slate-200">{exec.date}</div>
                          {exec.rdoNumber ? (
                            <div className="text-[10px] text-blue-400 font-mono">{exec.rdoNumber}</div>
                          ) : (
                            <div className="text-[10px] text-slate-500 font-mono italic">Sem RDO</div>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-white">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s?.color || '#94a3b8' }}></span>
                            <span>{s?.name || 'Serviço'}</span>
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-blue-300">
                          KM {exec.kmInitial.toFixed(3)} - {exec.kmFinal.toFixed(3)}
                        </td>
                        <td className="p-2.5 font-bold text-white">{exec.extensionMeters} m</td>
                        <td className="p-2.5 text-slate-400">{exec.direction}</td>
                        <td className="p-2.5 text-slate-400">{exec.createdBy}</td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => startEditExecution(exec)}
                              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
                              title="Editar Lançamento"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requestDelete(exec)}
                              className="p-1 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded transition"
                              title="Excluir Lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {executionToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400 border-b border-slate-800 pb-3">
              <div className="p-2 bg-red-950/80 border border-red-800/80 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Excluir Lançamento Físico</h3>
                <p className="text-xs text-slate-400">Esta ação atualizará imediatamente o Motor Linear</p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">RDO:</span>
                <span className="font-mono text-blue-300 font-bold">{executionToDelete.rdoNumber || 'Sem RDO'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trecho:</span>
                <span className="font-mono text-white font-bold">KM {executionToDelete.kmInitial.toFixed(3)} ao {executionToDelete.kmFinal.toFixed(3)} ({executionToDelete.extensionMeters} m)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data:</span>
                <span className="text-slate-200">{executionToDelete.date}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja excluir este lançamento do sistema? Esta ação é irreversível.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExecutionToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Lançamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

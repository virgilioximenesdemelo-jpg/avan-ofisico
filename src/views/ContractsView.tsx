/**
 * SCLAF — Módulo de Gestão de Contratos DNIT
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { Contract, ContractStatus } from '../types';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  X,
  Building
} from 'lucide-react';

interface ContractsViewProps {
  onRefresh: () => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({ onRefresh }) => {
  const contracts = db.getContracts();
  const currentUser = db.getCurrentUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [number, setNumber] = useState('');
  const [highway, setHighway] = useState('');
  const [lot, setLot] = useState('');
  const [executingCompany, setExecutingCompany] = useState('');
  const [supervisingCompany, setSupervisingCompany] = useState('');
  const [dnitFiscal, setDnitFiscal] = useState('');
  const [residentEngineer, setResidentEngineer] = useState('');
  const [kmInitial, setKmInitial] = useState('100.0');
  const [kmFinal, setKmFinal] = useState('130.0');
  const [surfaceType, setSurfaceType] = useState<Contract['surfaceType']>('CBUQ');
  const [modal, setModal] = useState<Contract['modal']>('Restauração (CREMA)');
  const [vigenciaExecutor, setVigenciaExecutor] = useState('2026-12-31');
  const [vigenciaSupervisor, setVigenciaSupervisor] = useState('2027-03-31');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState<ContractStatus>('Ativo');
  const [conug, setConug] = useState('393021/DNIT');

  const openCreateModal = () => {
    setEditingContract(null);
    setNumber(`04 00${Math.floor(100 + Math.random() * 900)}/2026`);
    setHighway('BR-101/SC');
    setLot('Lote 03');
    setExecutingCompany('Construtora Pavimentação S.A.');
    setSupervisingCompany('Consórcio Supervisor SCLAF');
    setDnitFiscal('Dr. Roberto Silveira');
    setResidentEngineer(currentUser.name);
    setKmInitial('100.0');
    setKmFinal('125.0');
    setSurfaceType('CBUQ');
    setModal('Pavimentação');
    setVigenciaExecutor('2027-12-31');
    setVigenciaSupervisor('2028-03-31');
    setObservations('');
    setStatus('Ativo');
    setConug('393021/DNIT');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Contract) => {
    setEditingContract(c);
    setNumber(c.number);
    setHighway(c.highway);
    setLot(c.lot);
    setExecutingCompany(c.executingCompany);
    setSupervisingCompany(c.supervisingCompany);
    setDnitFiscal(c.dnitFiscal);
    setResidentEngineer(c.residentEngineer);
    setKmInitial(c.kmInitial.toString());
    setKmFinal(c.kmFinal.toString());
    setSurfaceType(c.surfaceType);
    setModal(c.modal);
    setVigenciaExecutor(c.vigenciaExecutor);
    setVigenciaSupervisor(c.vigenciaSupervisor);
    setObservations(c.observations || '');
    setStatus(c.status);
    setConug(c.conug);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kInit = parseFloat(kmInitial) || 0;
    const kFin = parseFloat(kmFinal) || 0;

    if (editingContract) {
      db.updateContract(editingContract.id, {
        number,
        highway,
        lot,
        executingCompany,
        supervisingCompany,
        dnitFiscal,
        residentEngineer,
        kmInitial: kInit,
        kmFinal: kFin,
        surfaceType,
        modal,
        vigenciaExecutor,
        vigenciaSupervisor,
        observations,
        status,
        conug,
      });
    } else {
      db.addContract({
        number,
        highway,
        lot,
        executingCompany,
        supervisingCompany,
        dnitFiscal,
        residentEngineer,
        kmInitial: kInit,
        kmFinal: kFin,
        surfaceType,
        modal,
        vigenciaExecutor,
        vigenciaSupervisor,
        observations,
        status,
        conug,
      });
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    db.deleteContract(id);
    if (isModalOpen) setIsModalOpen(false);
    onRefresh();
  };

  const filteredContracts = contracts.filter(c => {
    const s = searchTerm.toLowerCase();
    return (
      c.number.toLowerCase().includes(s) ||
      c.highway.toLowerCase().includes(s) ||
      c.executingCompany.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Módulo de Gestão de Contratos</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Cadastro de Contratos DNIT</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerenciamento de contratos de supervisão e execução de obras rodoviárias estaduais e federais.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#580766] hover:bg-[#43054f] text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contrato</span>
          </button>
        )}
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por rodovia, número ou empresa..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Exibindo {filteredContracts.length} contratos
        </span>
      </div>

      {/* Lista de Contratos em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map(c => {
          const extension = Math.abs(c.kmFinal - c.kmInitial);
          return (
            <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    {c.number}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                    c.status === 'Ativo' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <h3 className="font-black text-lg text-white mt-2">{c.highway}</h3>
                <p className="text-xs text-slate-400 font-medium">{c.lot}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Trecho:</span>
                    <span className="font-mono font-bold text-white">KM {c.kmInitial} - KM {c.kmFinal} ({extension} km)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Superfície:</span>
                    <span className="font-semibold text-blue-300">{c.surfaceType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Executora:</span>
                    <span className="font-semibold truncate max-w-[160px]">{c.executingCompany}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Supervisora:</span>
                    <span className="font-semibold truncate max-w-[160px]">{c.supervisingCompany}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fiscal DNIT:</span>
                    <span className="text-slate-200">{c.dnitFiscal}</span>
                  </div>
                </div>

                {c.observations && (
                  <p className="text-[11px] text-slate-400 italic mt-2">
                    "{c.observations}"
                  </p>
                )}
              </div>

              {/* Card Footer com Ações */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-500">UG: {c.conug}</span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                    title="Editar Contrato"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 rounded-lg border border-slate-700 transition"
                    title="Excluir Contrato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE CONTRATO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {editingContract ? 'Editar Contrato DNIT' : 'Novo Contrato DNIT'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° do Contrato</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rodovia (Ex: BR-101/SC)</label>
                  <input
                    type="text"
                    value={highway}
                    onChange={(e) => setHighway(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Lote</label>
                  <input
                    type="text"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código UG / CONUG</label>
                  <input
                    type="text"
                    value={conug}
                    onChange={(e) => setConug(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Empresa Executora</label>
                  <input
                    type="text"
                    value={executingCompany}
                    onChange={(e) => setExecutingCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Empresa Supervisora</label>
                  <input
                    type="text"
                    value={supervisingCompany}
                    onChange={(e) => setSupervisingCompany(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">DNIT Fiscal</label>
                  <input
                    type="text"
                    value={dnitFiscal}
                    onChange={(e) => setDnitFiscal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Engenheiro Residente</label>
                  <input
                    type="text"
                    value={residentEngineer}
                    onChange={(e) => setResidentEngineer(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">KM Inicial</label>
                  <input
                    type="text"
                    value={kmInitial}
                    onChange={(e) => setKmInitial(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">KM Final</label>
                  <input
                    type="text"
                    value={kmFinal}
                    onChange={(e) => setKmFinal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superfície</label>
                  <select
                    value={surfaceType}
                    onChange={(e) => setSurfaceType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="CBUQ">CBUQ</option>
                    <option value="Concreto Rígido">Concreto Rígido</option>
                    <option value="TSU/TSD">TSU/TSD</option>
                    <option value="Cascalho">Cascalho</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vigência Executora</label>
                  <input
                    type="date"
                    value={vigenciaExecutor}
                    onChange={(e) => setVigenciaExecutor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vigência Supervisora</label>
                  <input
                    type="date"
                    value={vigenciaSupervisor}
                    onChange={(e) => setVigenciaSupervisor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observações do Contrato</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <div>
                  {editingContract && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingContract.id)}
                      className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-semibold border border-red-800 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Contrato</span>
                    </button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#580766] hover:bg-[#43054f] text-white font-bold rounded-xl text-xs"
                  >
                    Salvar Contrato
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

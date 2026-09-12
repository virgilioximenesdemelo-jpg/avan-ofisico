/**
 * SCLAF — Tabela Mestre de Serviços Rodoviários
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { RoadService } from '../types';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Palette,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ServicesViewProps {
  onRefresh: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onRefresh }) => {
  const services = db.getServices();
  const currentUser = db.getCurrentUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<RoadService | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RoadService['category']>('Pavimentação');
  const [surfaceType, setSurfaceType] = useState<RoadService['surfaceType']>('Pavimentado');
  const [executiveOrder, setExecutiveOrder] = useState<number>(10);
  const [color, setColor] = useState('#2563eb');
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingService(null);
    setCode(`SER-0${services.length + 1}`);
    setName('');
    setCategory('Pavimentação');
    setSurfaceType('Pavimentado');
    setExecutiveOrder(services.length + 1);
    setColor('#3b82f6');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: RoadService) => {
    setEditingService(s);
    setCode(s.code);
    setName(s.name);
    setCategory(s.category);
    setSurfaceType(s.surfaceType || 'Pavimentado');
    setExecutiveOrder(s.executiveOrder);
    setColor(s.color);
    setDescription(s.description);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      db.updateService(editingService.id, {
        code,
        name,
        category,
        surfaceType,
        executiveOrder,
        color,
        description,
      });
    } else {
      db.addService({
        code,
        name,
        category,
        surfaceType,
        executiveOrder,
        color,
        iconName: 'Layers',
        description,
        active: true,
      });
    }
    setIsModalOpen(false);
    onRefresh();
  };

  const handleDeleteService = (id: string, name: string) => {
    db.deleteService(id);
    setIsModalOpen(false);
    onRefresh();
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Tabela Mestre de Engenharia</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Catálogo de Serviços e Camadas Executivas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Definição da hierarquia de pavimentação. A Ordem Executiva determina qual serviço se sobrepõe no Motor Linear.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#580766] hover:bg-[#43054f] text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Serviço</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3 text-center">Ordem Executiva</th>
              <th className="p-3">Cor no Motor Linear</th>
              <th className="p-3">Código</th>
              <th className="p-3">Nome do Serviço</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Superfície</th>
              <th className="p-3">Descrição Técnica</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/50 transition">
                <td className="p-3 text-center font-bold text-white">
                  <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 inline-flex items-center justify-center font-mono text-xs">
                    {s.executiveOrder}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-5 h-5 rounded border border-white/20 shadow inline-block shrink-0"
                      style={{ backgroundColor: s.color }}
                    ></span>
                    <span className="font-mono text-[11px] text-slate-400">{s.color}</span>
                  </div>
                </td>
                <td className="p-3 font-mono font-bold text-blue-400">{s.code}</td>
                <td className="p-3 font-extrabold text-white text-sm">{s.name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-semibold text-[10px]">
                    {s.category}
                  </span>
                </td>
                <td className="p-3">
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
                <td className="p-3 text-slate-400 max-w-xs truncate">{s.description}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                      title="Editar Serviço"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id, s.name)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded border border-slate-700 transition"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ordem Executiva</label>
                  <input
                    type="number"
                    value={executiveOrder}
                    onChange={(e) => setExecutiveOrder(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Terraplenagem">Terraplenagem</option>
                    <option value="Pavimentação">Pavimentação</option>
                    <option value="Drenagem">Drenagem</option>
                    <option value="Sinalização">Sinalização</option>
                    <option value="Conservação">Conservação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superfície Indicada</label>
                  <select
                    value={surfaceType}
                    onChange={(e) => setSurfaceType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="Pavimentado">Pavimentado (Asfalto/Concreto)</option>
                    <option value="Não Pavimentado">Não Pavimentado (Terra/Cascalho)</option>
                    <option value="Ambos">Ambos (Todos os Tipos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição do Serviço</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <div>
                  {editingService && (
                    <button
                      type="button"
                      onClick={() => handleDeleteService(editingService.id, editingService.name)}
                      className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-semibold border border-red-800 flex items-center space-x-1"
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
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#580766] hover:bg-[#43054f] text-white font-bold rounded-xl text-xs"
                  >
                    Salvar Serviço
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

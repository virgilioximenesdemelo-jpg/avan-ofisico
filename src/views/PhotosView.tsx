/**
 * SCLAF — Módulo de Galeria Fotográfica de Obras
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { Camera, Plus, MapPin, Calendar, Filter, X } from 'lucide-react';

interface PhotosViewProps {
  activeContractId: string;
}

export const PhotosView: React.FC<PhotosViewProps> = ({ activeContractId }) => {
  const photos = db.getPhotos();
  const contracts = db.getContracts();
  const [phaseFilter, setPhaseFilter] = useState<'Todos' | 'Antes' | 'Durante' | 'Depois'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [km, setKm] = useState('105.2');
  const [phase, setPhase] = useState<'Antes' | 'Durante' | 'Depois'>('Durante');
  const [caption, setCaption] = useState('');
  const [url, setUrl] = useState('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80');

  const filteredPhotos = photos.filter(p => phaseFilter === 'Todos' || p.phase === phaseFilter);

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    db.addPhoto({
      contractId: contracts[0]?.id || 'ctr-101',
      km: parseFloat(km) || 100,
      estaca: `Estaca ${Math.floor((parseFloat(km) || 100) * 50)}`,
      phase,
      url,
      title,
      date: new Date().toISOString().split('T')[0],
      caption,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Camera className="w-4 h-4" />
            <span>Módulo de Evidências Fotográficas</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Galeria de Fotografias por Estaca e Estágio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro visual dos trechos em fases: Antes, Durante e Depois da intervenção de pavimentação.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Foto</span>
        </button>
      </div>

      {/* Filtros por Fase */}
      <div className="flex items-center space-x-2 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
        <span className="font-bold text-slate-400 mr-2">Filtrar por Estágio:</span>
        {['Todos', 'Antes', 'Durante', 'Depois'].map((f) => (
          <button
            key={f}
            onClick={() => setPhaseFilter(f as any)}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              phaseFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid de Fotografias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map(p => (
          <div key={p.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="relative">
              <img src={p.url} alt="" className="w-full h-48 object-cover" />
              <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] rounded-full font-bold uppercase shadow ${
                p.phase === 'Antes' ? 'bg-amber-900 text-amber-300 border border-amber-700' :
                p.phase === 'Durante' ? 'bg-blue-900 text-blue-300 border border-blue-700' :
                'bg-emerald-900 text-emerald-300 border border-emerald-700'
              }`}>
                Fase {p.phase}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-400">KM {p.km.toFixed(3)}</span>
                <span className="text-[10px] text-slate-400">{p.date}</span>
              </div>
              <h3 className="font-bold text-white text-sm">{p.title}</h3>
              <p className="text-xs text-slate-400">{p.caption}</p>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>{p.estaca}</span>
              <span>Vinculado ao Motor SCLAF</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Adicionar Evidência Fotográfica</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título da Foto</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  placeholder="Ex: CBUQ Concluído"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quilometragem (KM)</label>
                  <input
                    type="text"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estágio / Fase</label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Antes">Antes</option>
                    <option value="Durante">Durante</option>
                    <option value="Depois">Depois</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Legenda Técnica</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
                >
                  Salvar Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

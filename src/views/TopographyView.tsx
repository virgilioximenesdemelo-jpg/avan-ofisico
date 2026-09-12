/**
 * SCLAF — Módulo de Topografia & RTK
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { Compass, Plus, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface TopographyViewProps {
  activeContractId: string;
}

export const TopographyView: React.FC<TopographyViewProps> = () => {
  const points = db.getTopography();

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Topografia e Geodesia de Precisão</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Levantamentos Topográficos e RTK / Drones</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conferência de cotas de projeto x cotas executadas, tolerância de espessura de sub-base e greide rodoviário.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg overflow-x-auto">
        <h3 className="font-bold text-white text-sm mb-3">Estacamento & Cotas Geodésicas do Trecho</h3>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Estaca / KM</th>
              <th className="p-3 font-mono">Cota Projeto (m)</th>
              <th className="p-3 font-mono">Cota Terreno (m)</th>
              <th className="p-3 font-mono">Cota Executada (m)</th>
              <th className="p-3 font-mono">Desvio (mm)</th>
              <th className="p-3">Operador RTK</th>
              <th className="p-3 text-right">Status Conformidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {points.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition">
                <td className="p-3 font-bold text-white">{p.estaca}</td>
                <td className="p-3 font-mono text-blue-300">{p.cotaProjeto.toFixed(3)}</td>
                <td className="p-3 font-mono text-slate-400">{p.cotaTerreno.toFixed(3)}</td>
                <td className="p-3 font-mono font-bold text-emerald-400">{p.cotaExecutada.toFixed(3)}</td>
                <td className="p-3 font-mono font-bold text-amber-400">{p.desvioMm} mm</td>
                <td className="p-3 text-slate-300">{p.rtkOperator}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                    p.status === 'Conforme' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

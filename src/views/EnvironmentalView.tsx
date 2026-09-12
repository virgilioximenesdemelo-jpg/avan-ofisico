/**
 * SCLAF — Módulo de Gestão Ambiental e Licenciamento
 */

import React from 'react';
import { db } from '../services/db';
import { Leaf, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EnvironmentalViewProps {
  activeContractId: string;
}

export const EnvironmentalView: React.FC<EnvironmentalViewProps> = () => {
  const records = db.getEnvironmental();

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Leaf className="w-4 h-4" />
            <span>Meio Ambiente e Licenciamento DNIT</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Gestão de Passivos e Licenças Ambientais (LO/LI)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhamento de condicionantes ambientais, jazidas de empréstimo, RAC e fiscalização ambiental do Ibama.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.map(rec => (
          <div key={rec.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                {rec.type}
              </span>
              <span className="text-xs font-mono text-slate-400">
                KM {rec.kmInitial} - KM {rec.kmFinal}
              </span>
            </div>

            <p className="text-xs font-semibold text-white leading-relaxed">{rec.description}</p>

            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Responsável:</span>
                <strong className="text-white">{rec.responsible}</strong>
              </div>
              {rec.licenseNumber && (
                <div className="flex justify-between text-slate-300">
                  <span>Licença N°:</span>
                  <strong className="font-mono text-blue-400">{rec.licenseNumber}</strong>
                </div>
              )}
              {rec.dueDate && (
                <div className="flex justify-between text-slate-300">
                  <span>Validade:</span>
                  <strong className="font-mono text-amber-400">{rec.dueDate}</strong>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Severidade: <strong className="text-amber-400">{rec.severity}</strong></span>
              <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded font-semibold text-[10px]">
                {rec.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

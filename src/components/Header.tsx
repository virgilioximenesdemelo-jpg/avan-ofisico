/**
 * SCLAF — Cabeçalho Superior Corporativo com Status de Sincronização em Tempo Real
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db, DEFAULT_MATUPIRI_LOGO } from '../services/db';
import { MatupiriLogo } from './MatupiriLogo';
import {
  Clock,
  Building2,
  Filter,
  Cloud,
  CloudCheck,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  activeContractId: string;
  onSelectContract: (contractId: string) => void;
  onOpenLoginModal: () => void;
  onNavigateToSettings: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeContractId,
  onSelectContract,
  onOpenLoginModal,
  onNavigateToSettings,
  onRefresh
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const contracts = db.getContracts();
  const settings = db.getSettings();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualPushSync = async () => {
    setIsSyncing(true);
    await db.pushAllLocalDataToCloud();
    setTimeout(() => {
      setIsSyncing(false);
      onRefresh();
    }, 800);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-full mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Lado Esquerdo: Identidade do Sistema & Empresa */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-bold text-white tracking-wider text-sm shadow shrink-0"
              style={{ backgroundColor: settings.primaryColor || '#580766' }}
            >
              SCLAF
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-tight text-white">SCLAF</span>
                <span
                  className="text-[10px] text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/50 font-mono"
                  style={{ backgroundColor: `${settings.primaryColor || '#580766'}80` }}
                >
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Controle Linear de Avanço Físico</p>
            </div>
          </div>

          {/* Logo da Empresa / Consórcio */}
          {settings.companyLogoUrl ? (
            <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-700">
              {settings.companyLogoUrl === DEFAULT_MATUPIRI_LOGO || settings.companyLogoUrl.includes('Matupiri') ? (
                <MatupiriLogo className="h-10 sm:h-12 w-auto" />
              ) : (
                <div className="bg-white p-1 rounded-xl border border-slate-700 shadow-md flex items-center justify-center max-h-14">
                  <img
                    src={settings.companyLogoUrl}
                    alt={settings.companyName}
                    className="h-10 sm:h-12 w-auto object-contain max-w-[260px]"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-700">
              <MatupiriLogo className="h-10 sm:h-12 w-auto" />
            </div>
          )}

          <div className="hidden xl:flex items-center space-x-2 pl-3 border-l border-slate-700 text-slate-300 text-xs">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="font-semibold max-w-xs truncate text-purple-200">{settings.companyName}</span>
          </div>
        </div>

        {/* Centro: Filtro Global de Contrato */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
          <Filter className="w-4 h-4 text-slate-400 ml-1.5" />
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">Contrato Ativo:</span>
          <select
            value={activeContractId}
            onChange={(e) => onSelectContract(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          >
            <option value="ALL">TODOS OS CONTRATOS (Visão Global)</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number} — {c.highway} ({c.extensionKm} km)
              </option>
            ))}
          </select>
        </div>

        {/* Lado Direito: Status de Nuvem & Relógio */}
        <div className="flex items-center space-x-4">
          {/* Badge de Sincronização em Tempo Real na Nuvem */}
          <div 
            onClick={handleManualPushSync}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg text-emerald-300 text-[11px] font-medium cursor-pointer transition shadow-xs"
            title="Sincronização em Tempo Real Ativa com Firestore. Clique para sincronizar agora."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nuvem em Tempo Real</span>
            {isSyncing && <RefreshCw className="w-3 h-3 text-emerald-300 animate-spin ml-1" />}
          </div>

          <div className="flex items-center space-x-2 text-right font-mono text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <div className="text-white font-bold">{currentTime}</div>
              <div className="text-[10px] text-slate-400 uppercase">{currentDate}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

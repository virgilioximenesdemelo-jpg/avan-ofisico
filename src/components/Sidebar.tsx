/**
 * SCLAF — Menu Lateral de Navegação
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Activity,
  GitCommitHorizontal,
  FileSpreadsheet,
  Camera,
  Settings,
  HelpCircle,
  Info
} from 'lucide-react';

export type ViewTab =
  | 'painel'
  | 'contratos'
  | 'servicos'
  | 'execucoes'
  | 'linear'
  | 'mapa'
  | 'relatorios'
  | 'fotografias'
  | 'topografia'
  | 'ambiental'
  | 'configuracoes'
  | 'ajuda'
  | 'sobre';

interface SidebarProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onLogout }) => {
  const menuItems = [
    { id: 'painel' as ViewTab, label: 'Painel Executivo', icon: LayoutDashboard },
    { id: 'linear' as ViewTab, label: 'Linear de Avanço Físico', icon: GitCommitHorizontal, highlight: true },
    { id: 'execucoes' as ViewTab, label: 'Lançamento Execuções', icon: Activity },
    { id: 'contratos' as ViewTab, label: 'Contratos DNIT', icon: FileText },
    { id: 'servicos' as ViewTab, label: 'Tabela de Serviços', icon: Layers },
    { id: 'relatorios' as ViewTab, label: 'Relatórios RDO / PDF', icon: FileSpreadsheet },
    { id: 'fotografias' as ViewTab, label: 'Fotografias e Mídia', icon: Camera },
  ];

  const systemItems = [
    { id: 'configuracoes' as ViewTab, label: 'Configurações', icon: Settings },
    { id: 'ajuda' as ViewTab, label: 'Ajuda & Normas DNIT', icon: HelpCircle },
    { id: 'sobre' as ViewTab, label: 'Sobre o SCLAF', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4">
        <div className="px-4 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Menu Operacional
        </div>

        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#580766] text-white font-semibold shadow-lg shadow-purple-950/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${item.highlight && !isActive ? 'border border-purple-500/40 text-purple-300 bg-purple-950/20' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-6 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Sistema & Suporte
        </div>

        <nav className="space-y-1 px-2">
          {systemItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#580766] text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer corporativo */}
      <div className="p-3 border-t border-slate-800 text-[10px] text-center text-slate-500 font-mono">
        SCLAF Enterprise v1.0 — 2026
      </div>
    </aside>
  );
};

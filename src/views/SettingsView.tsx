/**
 * SCLAF — Configurações e Logs do Sistema com Sincronização em Nuvem
 */

import React, { useState, useRef } from 'react';
import { db, DEFAULT_MATUPIRI_LOGO } from '../services/db';
import { MatupiriLogo } from '../components/MatupiriLogo';
import {
  Settings,
  Shield,
  Download,
  RotateCcw,
  Save,
  CheckCircle2,
  ListFilter,
  Upload,
  Image,
  Palette,
  RefreshCw,
  Cloud,
  CloudUpload
} from 'lucide-react';

interface SettingsViewProps {
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefresh }) => {
  const settings = db.getSettings();
  const auditLogs = db.getAuditLogs();
  const currentUser = db.getCurrentUser();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(settings.companyLogoUrl || DEFAULT_MATUPIRI_LOGO);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#580766');
  const [savedMsg, setSavedMsg] = useState('');
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCompanyLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreDefaultLogo = () => {
    setCompanyLogoUrl(DEFAULT_MATUPIRI_LOGO);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.updateSettings({
      companyName,
      companyLogoUrl,
      primaryColor,
    });
    setSavedMsg('Configurações e marca corporativa salvas com sucesso!');
    setTimeout(() => setSavedMsg(''), 3000);
    onRefresh();
  };

  const handleExportBackup = () => {
    const jsonStr = db.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCLAF_Backup_Oficial_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handlePushCloud = async () => {
    setIsPushingCloud(true);
    await db.pushAllLocalDataToCloud();
    setTimeout(() => {
      setIsPushingCloud(false);
      setSavedMsg('Todos os contratos, serviços e execuções foram sincronizados com a Nuvem Firestore!');
      setTimeout(() => setSavedMsg(''), 4000);
      onRefresh();
    }, 1000);
  };

  const handleReset = async () => {
    if (confirm('Atenção: Esta ação restaurará todos os contratos e dados do SCLAF para o padrão inicial do DNIT e sincronizará com a nuvem. Confirmar?')) {
      await db.resetToFactoryDefault();
      onRefresh();
      alert('Dados restaurados para o padrão de fábrica e sincronizados.');
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-100">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Administração do Sistema Corporativo</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Configurações e Trilha de Auditoria (Audit Log)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalização da empresa, sincronização em nuvem e registro de auditoria do sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Configurações */}
        <div className="lg:col-span-1 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">
            Identidade Corporativa
          </h3>

          {savedMsg && (
            <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{savedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nome da Empresa / Consórcio</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>

            {/* Logo da Empresa */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold flex items-center justify-between">
                <span>Logo da Empresa / Consórcio</span>
                <span className="text-[10px] text-purple-400 font-normal">Sugerido PNG/SVG</span>
              </label>

              {/* Preview do Logo */}
              <div className="bg-white p-3 rounded-xl border border-slate-700 flex items-center justify-center min-h-[70px] shadow-inner relative group">
                {companyLogoUrl ? (
                  companyLogoUrl === DEFAULT_MATUPIRI_LOGO || companyLogoUrl.includes('Matupiri') ? (
                    <MatupiriLogo className="max-h-16 w-auto" />
                  ) : (
                    <img src={companyLogoUrl} alt="Logo Preview" className="max-h-16 max-w-full object-contain" />
                  )
                ) : (
                  <div className="text-slate-400 text-xs flex items-center space-x-1">
                    <Image className="w-4 h-4" />
                    <span>Nenhum logo carregado</span>
                  </div>
                )}
              </div>

              {/* Botão de Upload e Ações */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carregar Logo</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreDefaultLogo}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Logo Matupiri</span>
                </button>
              </div>
            </div>

            {/* Tema de Cor do Sistema */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Cor Principal do Tema (HEX)</span>
                <span className="text-[10px] font-mono text-purple-300">{primaryColor}</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-9 bg-slate-800 border border-slate-700 rounded cursor-pointer p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#580766"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => setPrimaryColor('#580766')}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold shrink-0"
                  title="Usar Roxo Padrão #580766"
                >
                  #580766
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações e Logo</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-300 text-xs">Banco de Dados em Nuvem (Multi-Usuário)</h4>

            <button
              onClick={handlePushCloud}
              disabled={isPushingCloud}
              className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold py-2.5 px-3 rounded-xl text-xs border border-emerald-700 transition flex items-center justify-center space-x-2"
            >
              {isPushingCloud ? (
                <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isPushingCloud ? 'Sincronizando...' : 'Forçar Sincronização em Nuvem'}</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-xl text-xs border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Backup Completo (JSON)</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={handleReset}
                className="w-full bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 font-bold py-2 px-3 rounded-xl text-xs border border-slate-700 transition flex items-center justify-center space-x-2 mt-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Dados Padrão DNIT</span>
              </button>
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Log de Auditoria e Atividades (Audit Log)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{auditLogs.length} registros</span>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-2.5">Data/Hora</th>
                  <th className="p-2.5">Usuário</th>
                  <th className="p-2.5">Ação</th>
                  <th className="p-2.5">Módulo</th>
                  <th className="p-2.5">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-2.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-2.5 font-bold text-white whitespace-nowrap">{log.user}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${
                        log.action === 'CADASTRO' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        log.action === 'EXCLUSÃO' ? 'bg-red-950 text-red-400 border border-red-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 font-semibold text-slate-300">{log.module}</td>
                    <td className="p-2.5 text-slate-400 text-[11px]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

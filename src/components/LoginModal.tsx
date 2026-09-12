/**
 * SCLAF — Tela de Autenticação Corporativa (Login)
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import { Lock, User as UserIcon, Building2, Key, CheckCircle2, ShieldAlert } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('carlos.viana@dnit.gov.br');
  const [password, setPassword] = useState('dnit2026');
  const [company, setCompany] = useState('DNIT - Sede SC');
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState('usr-1');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const users = db.getUsers();

  const handleSelectPreset = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedPresetId(userId);
      setUsername(user.email);
      setCompany(user.company);
      setErrorMsg('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Informe o nome de usuário ou e-mail corporativo.');
      return;
    }

    db.setCurrentUser(selectedPresetId);
    db.logAction('LOGIN', 'Autenticação', `Acesso autenticado para ${username}.`);
    onLoginSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        {/* Banner Superior */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 border-b border-slate-800 text-center relative">
          <div className="w-14 h-14 mx-auto mb-3 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-2xl text-white shadow-lg border border-blue-400">
            SCLAF
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">SCLAF</h2>
          <p className="text-xs text-blue-300 mt-0.5">Sistema de Controle Linear de Avanço Físico</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 bg-blue-950 text-blue-400 text-[10px] font-mono rounded-full border border-blue-800">
            Plataforma Corporativa DNIT v1.0
          </span>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-300 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Perfil de Acesso Rápidos
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleSelectPreset(u.id)}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedPresetId === u.id
                      ? 'bg-blue-900/40 border-blue-500 text-white font-semibold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-medium">{u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{u.role}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Usuário / E-mail Corporativo
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="usuario@dnit.gov.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Empresa / Órgão
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: DNIT / Consórcio Supervisor"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span>Lembrar usuário</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Para redefinir a senha do SCLAF, contate o Administrador de TI do DNIT.')}
              className="text-blue-400 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Entrar no Sistema SCLAF</span>
          </button>
        </form>

        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-center text-slate-500 font-mono">
          Acesso Restrito e Auditado. Lei de Segurança de Dados e Normas DNIT.
        </div>
      </div>
    </div>
  );
};

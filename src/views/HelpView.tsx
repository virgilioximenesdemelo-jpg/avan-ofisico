/**
 * SCLAF — Módulo de Ajuda, Normas DNIT e Sobre
 */

import React from 'react';
import { HelpCircle, BookOpen, ShieldCheck, CheckCircle2, GitCommitHorizontal } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Manual de Operação e Suporte Técnico</span>
        </div>
        <h2 className="text-2xl font-black text-white">SCLAF — Sistema de Controle Linear de Avanço Físico</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Plataforma corporativa de alto desempenho destinada ao gerenciamento e acompanhamento gráfico em estacamento de 20m para contratos de obras rodoviárias do DNIT.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2">
            <GitCommitHorizontal className="w-4 h-4 text-blue-400" />
            <span>Conceito do Motor Linear (20m)</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            O SCLAF divide cada quilômetro de rodovia em exatas 50 estacas de 20 metros. Cada sub-segmento armazena o histórico completo de intervenções (Limpeza, Sub-base, Base, CBUQ, Drenagem).
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            <li>Em cada estaca de 20m, a camada mais avançada (ex: CBUQ) se sobrepõe no gráfico.</li>
            <li>Ao clicar sobre o bloco no diagrama, você abre a Ficha do Trecho com fotos e ensaios.</li>
            <li>Você pode usar a busca rápida por KM para se deslocar instantaneamente ao trecho.</li>
          </ul>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Principais Normas Técnicas DNIT</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="font-bold text-white block">DNIT 108/2009 — ES</span>
              <span className="text-slate-400 text-[11px]">Terraplenagem e Aterros — Compactação e GC ≥ 100% PN.</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="font-bold text-white block">DNIT 031/2006 — ES</span>
              <span className="text-slate-400 text-[11px]">Pavimentação — Concreto Asfáltico CBUQ Faixa C.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-2 text-xs text-slate-400">
        <h3 className="font-bold text-white text-sm">Arquitetura Corporativa e Segurança</h3>
        <p>
          O SCLAF opera inteiramente através de uma interface web/desktop profissional, isolando a complexidade dos dados de campo com criptografia, permissões por nível de acesso e trilha completa de auditoria de auditoria externa.
        </p>
      </div>
    </div>
  );
};

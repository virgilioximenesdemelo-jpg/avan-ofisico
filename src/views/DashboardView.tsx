/**
 * SCLAF — Painel Executivo (Dashboard)
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  GitCommitHorizontal,
  PlusCircle,
  Building,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';

interface DashboardViewProps {
  activeContractId: string;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ activeContractId, onNavigate }) => {
  const metrics = db.getDashboardMetrics(activeContractId === 'ALL' ? undefined : activeContractId);
  const contracts = db.getContracts();
  const services = db.getServices();
  const executions = db.getExecutions(activeContractId === 'ALL' ? undefined : activeContractId);

  // Serviço e Contrato selecionados para o gráfico
  const defaultCbuq = services.find(s => s.code === 'SER-009') || services[0];
  const [selectedServiceId, setSelectedServiceId] = useState<string>(defaultCbuq?.id || 'ALL_SERVICES');
  const [selectedContractFilter, setSelectedContractFilter] = useState<string>('ALL_CONTRACTS');

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedContractObj = contracts.find(c => c.id === selectedContractFilter);

  // Filtragem dos contratos para exibição no gráfico
  const displayedContracts = selectedContractFilter === 'ALL_CONTRACTS'
    ? contracts
    : contracts.filter(c => c.id === selectedContractFilter);

  // Dados para Gráfico por Contrato filtrado por Serviço e Contrato
  const contractChartData = displayedContracts.map(c => {
    const cExecutions = db.getExecutions(c.id);
    let serviceKm = 0;

    if (selectedServiceId === 'ALL_SERVICES') {
      const totalMeters = cExecutions.reduce((acc, e) => acc + e.extensionMeters, 0);
      serviceKm = Number((totalMeters / 1000).toFixed(2));
    } else {
      const filtered = cExecutions.filter(e => e.serviceId === selectedServiceId);
      const totalMeters = filtered.reduce((acc, e) => acc + e.extensionMeters, 0);
      serviceKm = Number((totalMeters / 1000).toFixed(2));
    }

    const progressPct = c.extensionKm > 0 ? Math.min(100, Number(((serviceKm / c.extensionKm) * 100).toFixed(1))) : 0;

    return {
      contractNumber: c.number,
      highway: c.highway,
      extension: c.extensionKm,
      executedKm: serviceKm,
      progressPct,
    };
  });

  // Dados para Gráfico de Distribuição por Serviço
  const serviceChartData = services.map(s => {
    const meterCount = metrics.serviceProgress[s.name]?.meters || 0;
    return {
      name: s.name,
      km: Number((meterCount / 1000).toFixed(1)),
      color: s.color,
    };
  }).filter(s => s.km > 0);

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Banner de Boas-Vindas & Status */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Painel de Controle de Engenharia Rodoviária</span>
          </div>
          <h1 className="text-xl font-black text-white mt-1">
            Sistema de Controle Linear de Avanço Físico — SCLAF
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Monitoramento técnico em tempo real de trechos rodoviários do DNIT. Mapeamento de serviços executados em segmentos contínuos de 20 metros.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigate('linear')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center space-x-2"
          >
            <GitCommitHorizontal className="w-4 h-4" />
            <span>Abrir Motor Linear (20m)</span>
          </button>
          <button
            onClick={() => onNavigate('execucoes')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Lançar Execução</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Extensão Sob Gestão */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Extensão Sob Gestão</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {metrics.totalExtensionKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-blue-400">{metrics.totalContracts}</span>
            <span>contratos ativos sob supervisão</span>
          </div>
        </div>

        {/* KPI 2: Avanço em CBUQ / Capa */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Capa Final Concluída (CBUQ)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {metrics.cbuqExecutedKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avanço Físico Global: <span className="font-bold text-white">{metrics.globalProgressPct}%</span>
          </div>
        </div>

        {/* KPI 3: Lançamentos de Execuções */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Registros de Execução</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {metrics.totalExecutionsCount} <span className="text-xs font-normal text-slate-400">RDOs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Segmentos mapeados: <span className="font-bold text-amber-400">{(metrics.totalExtensionKm * 50).toLocaleString()} estacas</span>
          </div>
        </div>

        {/* KPI 4: Status do Contrato & Alertas */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Situação dos Contratos</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            100% <span className="text-xs font-semibold text-emerald-400">Regulares</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Vigência de contratos: <span className="text-slate-300">Todas ativas em 2026</span>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos Executivos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Avanço Físico por Contrato e Serviço Selecionável */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="font-bold text-white text-sm flex flex-wrap items-center gap-2">
                <span>Avanço Físico por Contrato</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  {selectedContractFilter === 'ALL_CONTRACTS' ? 'Todos os Contratos' : selectedContractObj?.number}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                  {selectedServiceId === 'ALL_SERVICES' ? 'Todos os Serviços' : selectedService?.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Comparativo da extensão contratada x extensão executada ({selectedServiceId === 'ALL_SERVICES' ? 'Soma Total de Serviços' : selectedService?.name})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Filtro de Contrato */}
              <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-300 font-medium">Contrato:</span>
                <select
                  value={selectedContractFilter}
                  onChange={(e) => setSelectedContractFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-blue-200 font-bold text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="ALL_CONTRACTS">Todos os Contratos</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.number} ({c.highway})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de Serviço */}
              <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                <Filter className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-300 font-medium">Serviço:</span>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-purple-200 font-bold text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="ALL_SERVICES">Todos os Serviços</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractChartData}>
                <XAxis dataKey="contractNumber" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="km" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                  labelFormatter={(label, items) => {
                    const payload = items?.[0]?.payload;
                    return payload ? `Contrato: ${label} (${payload.highway})` : `Contrato: ${label}`;
                  }}
                  formatter={(value: any, name: string) => [`${value} km`, name]}
                />
                <Legend />
                <Bar dataKey="extension" name="Extensão Total (km)" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="executedKm"
                  name={selectedServiceId === 'ALL_SERVICES' ? 'Execução Acumulada (km)' : `${selectedService?.name || 'Serviço'} (km)`}
                  fill={selectedService?.color || '#580766'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Serviço Executado */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-1">Avanço por Serviço (km)</h3>
            <p className="text-xs text-slate-400 mb-4">Volume total executado por tipo de intervenção</p>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="km"
                  >
                    {serviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            {serviceChartData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                  <span className="text-slate-300 truncate max-w-[150px]">{s.name}</span>
                </div>
                <span className="font-bold text-white font-mono">{s.km} km</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed de Execuções Recentes (RDOs) */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-sm">Últimos Lançamentos Operacionais (Histórico de RDOs)</h3>
            <p className="text-xs text-slate-400">Registros físicos cadastrados pelas equipes de campo e supervisão</p>
          </div>
          <button
            onClick={() => onNavigate('execucoes')}
            className="text-xs text-blue-400 hover:underline font-semibold"
          >
            Gerenciar Lançamentos →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Serviço Executado</th>
                <th className="p-3">Trecho (KM)</th>
                <th className="p-3">Extensão</th>
                <th className="p-3">Pista</th>
                <th className="p-3">RDO</th>
                <th className="p-3">Lançado por</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {executions.slice(0, 5).map(exec => {
                const s = services.find(srv => srv.id === exec.serviceId);
                return (
                  <tr key={exec.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono text-slate-400">{exec.date}</td>
                    <td className="p-3 font-semibold text-white flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s?.color || '#94a3b8' }}></span>
                      <span>{s?.name || 'Serviço'}</span>
                    </td>
                    <td className="p-3 font-mono text-blue-300">
                      KM {exec.kmInitial.toFixed(3)} - {exec.kmFinal.toFixed(3)}
                    </td>
                    <td className="p-3 font-bold text-white">{exec.extensionMeters} m</td>
                    <td className="p-3">{exec.direction}</td>
                    <td className="p-3 font-mono text-xs">{exec.rdoNumber || 'RDO-2026/01'}</td>
                    <td className="p-3 text-slate-400">{exec.createdBy}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] rounded font-semibold">
                        Aprovado
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

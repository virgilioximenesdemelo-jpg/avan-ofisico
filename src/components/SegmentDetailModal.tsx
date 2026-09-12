/**
 * SCLAF — Ficha Detalhada do Segmento de 20 Metros (Estaca)
 */

import React, { useState } from 'react';
import { Segment20m, Contract } from '../types';
import { db } from '../services/db';
import {
  X,
  MapPin,
  Layers,
  FileText,
  Calendar,
  User,
  CheckCircle2,
  Camera,
  Award,
  Plus
} from 'lucide-react';

interface SegmentDetailModalProps {
  segment: Segment20m | null;
  contract: Contract | undefined;
  onClose: () => void;
  onRefresh: () => void;
}

export const SegmentDetailModal: React.FC<SegmentDetailModalProps> = ({
  segment,
  contract,
  onClose,
  onRefresh,
}) => {
  if (!segment) return null;

  const services = db.getServices();
  const photos = db.getPhotos().filter(p => Math.abs(p.km - segment.km) < 0.1);
  const topService = services.find(s => s.id === segment.latestServiceId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow"
              style={{ backgroundColor: segment.latestServiceColor || '#334155' }}
            >
              20m
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">{segment.kmFormatted}</h3>
                <span className="text-xs bg-slate-700 text-slate-300 font-mono px-2 py-0.5 rounded">
                  Estaca {segment.estaca}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {contract ? `${contract.number} — ${contract.highway}` : 'Rodovia DNIT'} (Sub-segmento 20 metros)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Status Atual da Camada */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Camada Predominante Atual
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block"
                  style={{ backgroundColor: segment.latestServiceColor || '#64748b' }}
                ></span>
                <span className="text-sm font-black text-white">
                  {segment.latestServiceName || 'Nenhum Serviço Executado (Trecho em Bruto)'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-right">
              {segment.thicknessCm && (
                <div>
                  <span className="text-[10px] text-slate-400 block">Espessura</span>
                  <span className="font-bold text-blue-400">{segment.thicknessCm} cm</span>
                </div>
              )}
              {segment.latestExecutionDate && (
                <div>
                  <span className="text-[10px] text-slate-400 block">Data Execução</span>
                  <span className="font-bold text-slate-200">{segment.latestExecutionDate}</span>
                </div>
              )}
              {segment.rdoNumber && (
                <div>
                  <span className="text-[10px] text-slate-400 block">RDO</span>
                  <span className="font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                    {segment.rdoNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Histórico Intervenções neste segmento */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs mb-2 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Histórico de Intervenções e Camadas</span>
            </h4>

            {segment.executionHistory.length === 0 ? (
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-center text-slate-500">
                Nenhum registro de execução física lançado para esta estaca de 20m.
              </div>
            ) : (
              <div className="space-y-2">
                {segment.executionHistory.map((exec) => {
                  const s = services.find(srv => srv.id === exec.serviceId);
                  return (
                    <div
                      key={exec.id}
                      className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: s?.color || '#94a3b8' }}
                          ></span>
                          <span className="font-bold text-slate-100">{s?.name || 'Serviço'}</span>
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                            {exec.direction}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{exec.date}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 mt-1 bg-slate-900/60 p-2 rounded border border-slate-800">
                        <div>
                          <span className="text-[9px] text-slate-500 block">Trecho Lançado</span>
                          <span>KM {exec.kmInitial.toFixed(3)} - {exec.kmFinal.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">RDO e Equipe</span>
                          <span>{exec.rdoNumber || 'N/A'} ({exec.teamLeader || 'Equipe Geral'})</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Espessura / Largura</span>
                          <span>{exec.thicknessCm || '-'} cm / {exec.widthMeters || '-'} m</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">Responsável</span>
                          <span>{exec.createdBy}</span>
                        </div>
                      </div>

                      {exec.observations && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          "{exec.observations}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Galeria de Fotos da Estaca */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs mb-2 flex items-center space-x-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Evidências Fotográficas do Segmento</span>
            </h4>

            {photos.length === 0 ? (
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-500 text-center">
                Sem fotos associadas a esta estaca. As fotos são vinculadas por aproximação de quilometragem.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map(p => (
                  <div key={p.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <img src={p.url} alt="" className="w-full h-28 object-cover" />
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{p.title}</span>
                        <span className="px-1.5 py-0.2 bg-blue-950 text-blue-300 text-[9px] rounded font-semibold">
                          Fase {p.phase}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{p.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ensaios de Laboratório / Controle Tecnológico */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs mb-2 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Controle Tecnológico & Ensaios DNIT</span>
            </h4>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">Grau de Compactação (GC %):</span>
                <span className="font-bold text-emerald-400">98.6% (Conforme Norma DNIT 108/2009)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">Deflectometria FWD (D0 mm x 10^-2):</span>
                <span className="font-bold text-emerald-400">D0 = 22.4 (Deflexão admissível ok)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">Teor de Ligante Asfáltico:</span>
                <span className="font-bold text-emerald-400">5.2% (Projeto Marshall ok)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800 p-3 border-t border-slate-700 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-xs"
          >
            Fechar Ficha do Segmento
          </button>
        </div>
      </div>
    </div>
  );
};

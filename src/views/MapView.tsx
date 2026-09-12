/**
 * SCLAF — Módulo de Visualização Cartográfica e GIS
 */

import React, { useState } from 'react';
import { db } from '../services/db';
import {
  MapPin,
  Globe,
  Download,
  Layers,
  CheckCircle2,
  FileCode2,
  Compass,
  Eye
} from 'lucide-react';

interface MapViewProps {
  activeContractId: string;
}

export const MapView: React.FC<MapViewProps> = ({ activeContractId }) => {
  const contracts = db.getContracts();
  const services = db.getServices();
  const selectedContract = activeContractId !== 'ALL'
    ? contracts.find(c => c.id === activeContractId) || contracts[0]
    : contracts[0];

  const [contractId, setContractId] = useState(selectedContract?.id || contracts[0]?.id || '');
  const activeContract = contracts.find(c => c.id === contractId) || contracts[0];
  const segments = db.generateSegmentsForContract(activeContract?.id || '');

  // Exportar GeoJSON
  const handleExportGeoJson = () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      name: `SCLAF_${activeContract?.number.replace(/\//g, '_')}_GIS`,
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
      },
      features: segments.map((seg, i) => ({
        type: 'Feature',
        properties: {
          id: seg.id,
          estaca: seg.estaca,
          km: seg.km,
          kmFormatted: seg.kmFormatted,
          service: seg.latestServiceName || 'Não Executado',
          rdo: seg.rdoNumber || 'N/A',
          thicknessCm: seg.thicknessCm || 0,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-48.6700 + (seg.km * 0.001), -27.5900 + (seg.km * 0.0008)],
            [-48.6700 + ((seg.km + 0.02) * 0.001), -27.5900 + ((seg.km + 0.02) * 0.0008)]
          ]
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCLAF_${activeContract?.highway}_GeoJSON.geojson`;
    a.click();
  };

  // Exportar KML para Google Earth
  const handleExportKml = () => {
    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>SCLAF DNIT — ${activeContract?.highway}</name>
    <description>Mapeamento de Segmentos de 20m do Contrato ${activeContract?.number}</description>`;

    segments.forEach((seg) => {
      const lon1 = -48.6700 + (seg.km * 0.001);
      const lat1 = -27.5900 + (seg.km * 0.0008);
      kmlContent += `
    <Placemark>
      <name>${seg.kmFormatted}</name>
      <description>Serviço: ${seg.latestServiceName || 'Pendente'} | RDO: ${seg.rdoNumber || 'N/A'}</description>
      <LineString>
        <coordinates>${lon1},${lat1},0 ${lon1 + 0.00002},${lat1 + 0.00002},0</coordinates>
      </LineString>
    </Placemark>`;
    });

    kmlContent += `
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCLAF_${activeContract?.highway}_GoogleEarth.kml`;
    a.click();
  };

  return (
    <div className="p-6 space-y-5 text-slate-100 flex flex-col h-full">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Módulo de Geoprocessamento e Cartografia</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Mapa Rodoviário GIS e Vetorial</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeamento cartográfico do alinhamento da rodovia com exportação para QGIS e Google Earth.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportGeoJson}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar GeoJSON (QGIS)</span>
          </button>
          <button
            onClick={handleExportKml}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar KML (Google Earth)</span>
          </button>
        </div>
      </div>

      {/* Visualizador de Mapa Simulado Interativo */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex-1 flex flex-col justify-between overflow-hidden min-h-[400px]">
        {/* Top Controls on Map */}
        <div className="flex items-center justify-between z-10 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-300">Selecione o Trecho:</span>
            <select
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              className="bg-slate-800 text-white text-xs font-mono rounded px-2 py-1 border border-slate-700 focus:outline-none"
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.highway} — {c.number}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-300 font-mono">
            <span>Datum: <strong className="text-blue-400">SIRGAS 2000 / UTM Zone 22S</strong></span>
            <span>Estacas Mapeadas: <strong className="text-emerald-400">{segments.length}</strong></span>
          </div>
        </div>

        {/* Trace do Tronco Rodoviário no Canvas Simulado */}
        <div className="my-8 relative flex items-center justify-center">
          {/* Fundo do Mapa de Satélite / Topográfico */}
          <div className="w-full h-64 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center p-6">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Linha Curva da Rodovia Mapeada */}
            <div className="relative w-full max-w-4xl flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 h-4 bg-slate-800 rounded-full border border-slate-700 -translate-y-1/2"></div>

              {/* Segmentos coloridos no mapa */}
              <div className="relative w-full flex items-center justify-between px-2">
                {segments.filter((_, idx) => idx % Math.max(1, Math.floor(segments.length / 40)) === 0).map((seg) => (
                  <div
                    key={seg.id}
                    className="group relative flex flex-col items-center cursor-pointer"
                  >
                    <div
                      className="w-4 h-8 rounded-sm shadow-md transition transform group-hover:scale-125"
                      style={{ backgroundColor: seg.latestServiceColor || '#334155' }}
                    ></div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-slate-950 px-1 rounded border border-slate-800">
                      {seg.kmFormatted}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo Cartográfico */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Coordenadas Iniciais: <strong>27°35'24"S 48°40'12"W</strong> (BR-101)</span>
          </div>
          <div className="text-slate-400">
            Compatível com QGIS 3.x, ArcGIS Pro e Google Earth Desktop / Web.
          </div>
        </div>
      </div>
    </div>
  );
};

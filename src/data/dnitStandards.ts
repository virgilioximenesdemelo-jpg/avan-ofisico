/**
 * SCLAF — Especificações e Normas Técnicas do DNIT
 * Referência Oficial de Dimensionamento Geométrico e Estrutural
 */

import { TrackDirection } from '../types';

export interface DnitServiceSpec {
  keywords: string[];
  normCode: string;
  normTitle: string;
  defaultThicknessCm: number;
  fullWidthMeters: number;    // Pista inteira (ambos os lados / eixo)
  laneWidthMeters: number;    // Uma faixa (crescente / decrescente)
  shoulderWidthMeters?: number;
  category: string;
}

export const DNIT_SERVICE_SPECS: DnitServiceSpec[] = [
  {
    keywords: ['cbuq', 'concreto asfaltico', 'capa de rolamento', 'massa asfaltica', 'binder'],
    normCode: 'DNIT 031/2006-ES',
    normTitle: 'Pavimentos flexíveis - Concreto asfáltico',
    defaultThicknessCm: 5.0,
    fullWidthMeters: 7.20,
    laneWidthMeters: 3.60,
    shoulderWidthMeters: 2.50,
    category: 'Pavimentação'
  },
  {
    keywords: ['bgs', 'brita graduada', 'base granular'],
    normCode: 'DNIT 141/2010-ES',
    normTitle: 'Pavimentação - Base de brita graduada simples',
    defaultThicknessCm: 15.0,
    fullWidthMeters: 7.60,
    laneWidthMeters: 3.80,
    category: 'Pavimentação'
  },
  {
    keywords: ['sub-base', 'subbase', 'solo-brita', 'brita corrida', 'macadame'],
    normCode: 'DNIT 139/2010-ES',
    normTitle: 'Pavimentação - Sub-base estabilizada granulometricamente',
    defaultThicknessCm: 20.0,
    fullWidthMeters: 8.00,
    laneWidthMeters: 4.00,
    category: 'Pavimentação'
  },
  {
    keywords: ['regularizacao', 'subleito', 'regularização do subleito'],
    normCode: 'DNIT 137/2010-ES',
    normTitle: 'Pavimentação - Regularização do subleito',
    defaultThicknessCm: 20.0,
    fullWidthMeters: 8.40,
    laneWidthMeters: 4.20,
    category: 'Terraplenagem'
  },
  {
    keywords: ['terraplenagem', 'bota-fora', 'corte', 'aterro', 'escavacao'],
    normCode: 'DNIT 108/2009-ES',
    normTitle: 'Terraplenagem - Aterros e cortes',
    defaultThicknessCm: 30.0,
    fullWidthMeters: 12.00,
    laneWidthMeters: 6.00,
    category: 'Terraplenagem'
  },
  {
    keywords: ['imprimacao', 'imprimação', 'eai', 'cm-30'],
    normCode: 'DNIT 144/2014-ES',
    normTitle: 'Pavimentação - Imprimação com ligante asfáltico',
    defaultThicknessCm: 0.1,
    fullWidthMeters: 7.60,
    laneWidthMeters: 3.80,
    category: 'Pavimentação'
  },
  {
    keywords: ['pintura de ligacao', 'pintura de ligação', 'rr-1c', 'adesao'],
    normCode: 'DNIT 145/2014-ES',
    normTitle: 'Pavimentação - Pintura de ligação',
    defaultThicknessCm: 0.1,
    fullWidthMeters: 7.20,
    laneWidthMeters: 3.60,
    category: 'Pavimentação'
  },
  {
    keywords: ['microrrevestimento', 'maf', 'micro revestimento'],
    normCode: 'DNIT 035/2006-ES',
    normTitle: 'Pavimentos flexíveis - Microrrevestimento asfáltico a frio',
    defaultThicknessCm: 1.2,
    fullWidthMeters: 7.20,
    laneWidthMeters: 3.60,
    category: 'Pavimentação'
  },
  {
    keywords: ['cascalhamento', 'revestimento primario', 'revestimento primário', 'leito natural'],
    normCode: 'DNIT 140/2010-ES',
    normTitle: 'Pavimentação - Revestimento primário',
    defaultThicknessCm: 15.0,
    fullWidthMeters: 7.00,
    laneWidthMeters: 3.50,
    category: 'Conservação'
  },
  {
    keywords: ['solo-cimento', 'adicao de cimento', 'adição de cimento', 'cimento'],
    normCode: 'DNIT 143/2010-ES',
    normTitle: 'Pavimentação - Revestimento estabilizado com cimento',
    defaultThicknessCm: 15.0,
    fullWidthMeters: 7.00,
    laneWidthMeters: 3.50,
    category: 'Conservação'
  },
  {
    keywords: ['patrolamento', 'conformacao', 'conformação de plataforma'],
    normCode: 'DNIT 115/2009-ES',
    normTitle: 'Conservação - Patrolamento e conformação de plataforma',
    defaultThicknessCm: 0.0,
    fullWidthMeters: 8.00,
    laneWidthMeters: 4.00,
    category: 'Conservação'
  },
  {
    keywords: ['escarificacao', 'escarificação', 'recomposicao de leito', 'recomposição'],
    normCode: 'DNIT 106/2009-ES',
    normTitle: 'Terraplenagem - Escarificação e recomposição',
    defaultThicknessCm: 20.0,
    fullWidthMeters: 8.00,
    laneWidthMeters: 4.00,
    category: 'Terraplenagem'
  },
  {
    keywords: ['drenagem', 'sarjeta', 'meio-fio', 'bueiro', 'descida'],
    normCode: 'DNIT 018/2006-ES',
    normTitle: 'Drenagem - Sarjetas e valetas de proteção',
    defaultThicknessCm: 10.0,
    fullWidthMeters: 1.20,
    laneWidthMeters: 1.20,
    category: 'Drenagem'
  },
  {
    keywords: ['sinalizacao', 'sinalização', 'pintura de faixas', 'termoplastico', 'tacha'],
    normCode: 'DNIT 101/2009-ES',
    normTitle: 'Sinalização rodoviária - Demarcação horizontal',
    defaultThicknessCm: 0.15,
    fullWidthMeters: 0.15,
    laneWidthMeters: 0.15,
    category: 'Sinalização'
  },
  {
    keywords: ['limpeza', 'desmatamento', 'destocamento'],
    normCode: 'DNIT 104/2009-ES',
    normTitle: 'Terraplenagem - Desmatamento, destocamento e limpeza',
    defaultThicknessCm: 0.0,
    fullWidthMeters: 20.00,
    laneWidthMeters: 10.00,
    category: 'Conservação'
  },
  {
    keywords: ['rocada', 'roçada', 'capina'],
    normCode: 'DNIT 112/2009-ES',
    normTitle: 'Conservação - Roçada manual e mecânica',
    defaultThicknessCm: 0.0,
    fullWidthMeters: 3.00,
    laneWidthMeters: 3.00,
    category: 'Conservação'
  }
];

export function getDnitStandardForService(
  serviceName?: string,
  category?: string,
  direction?: TrackDirection,
  explicitThickness?: number,
  explicitWidth?: number,
  explicitNorm?: string
): {
  normCode: string;
  normTitle: string;
  thicknessCm: number;
  widthMeters: number;
  isMatched: boolean;
} {
  const isSingleLane = direction === 'Crescente' || direction === 'Decrescente' || direction === 'Pista Dupla Dir' || direction === 'Pista Dupla Esq' || direction === 'Lado Esquerdo' || direction === 'Lado Direito';

  // Se já houver espessura ou largura explícita cadastrada no serviço, prioriza
  if (explicitThickness !== undefined && explicitThickness > 0 && explicitWidth !== undefined && explicitWidth > 0) {
    const calculatedWidth = isSingleLane && explicitWidth > 4.0 ? +(explicitWidth / 2).toFixed(2) : explicitWidth;
    return {
      normCode: explicitNorm || 'Norma DNIT',
      normTitle: 'Especificação técnica do contrato',
      thicknessCm: explicitThickness,
      widthMeters: calculatedWidth,
      isMatched: true
    };
  }

  const sName = (serviceName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sCat = (category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const spec of DNIT_SERVICE_SPECS) {
    const matched = spec.keywords.some(kw => {
      const cleanKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return sName.includes(cleanKw) || sCat.includes(cleanKw);
    });

    if (matched) {
      const width = isSingleLane ? spec.laneWidthMeters : spec.fullWidthMeters;
      return {
        normCode: explicitNorm || spec.normCode,
        normTitle: spec.normTitle,
        thicknessCm: explicitThickness !== undefined ? explicitThickness : spec.defaultThicknessCm,
        widthMeters: explicitWidth !== undefined ? explicitWidth : width,
        isMatched: true
      };
    }
  }

  // Padrão genérico de engenharia rodoviária caso não haja match específico
  return {
    normCode: explicitNorm || 'Norma DNIT Geral',
    normTitle: 'Manual de Pavimentação e Restauração DNIT',
    thicknessCm: explicitThickness !== undefined ? explicitThickness : 5.0,
    widthMeters: explicitWidth !== undefined ? explicitWidth : (isSingleLane ? 3.60 : 7.20),
    isMatched: false
  };
}

/**
 * SCLAF — Sistema de Controle Linear de Avanço Físico
 * Definção de Tipos e Interfaces do Sistema
 */

export type UserRole = 'admin' | 'engenheiro' | 'fiscal_dnit' | 'tecnico' | 'visitante';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  avatar?: string;
}

export type ContractStatus = 'Ativo' | 'Inativo' | 'Suspenso' | 'Concluído';

export interface Contract {
  id: string;
  number: string; // Ex: 04 00523/2024
  highway: string; // Ex: BR-101/SC
  lot: string; // Ex: Lote 02
  executingCompany: string; // Empresa Executora
  supervisingCompany: string; // Empresa Supervisora
  dnitFiscal: string; // Fiscal DNIT
  residentEngineer: string; // Engenheiro Residente
  kmInitial: number; // Ex: 100.0
  kmFinal: number; // Ex: 135.0
  extensionKm: number; // Calculado (kmFinal - kmInitial)
  surfaceType: 'CBUQ' | 'Concreto Rígido' | 'TSU/TSD' | 'Cascalho' | 'Terraplanado';
  modal: 'Pavimentação' | 'Restauração (CREMA)' | 'Adequação de Capacidade' | 'Manutenção/Conservação';
  vigenciaExecutor: string; // Data AAAA-MM-DD
  vigenciaSupervisor: string; // Data AAAA-MM-DD
  observations?: string;
  status: ContractStatus;
  conug: string; // Código UG / CONUG DNIT
}

export interface RoadService {
  id: string;
  code: string; // Ex: PAV-001
  name: string; // Ex: CBUQ Faixa de Rolamento
  category: 'Terraplenagem' | 'Pavimentação' | 'Drenagem' | 'Sinalização' | 'Conservação' | 'Obras de Arte';
  surfaceType?: 'Pavimentado' | 'Não Pavimentado' | 'Ambos';
  executiveOrder: number; // 1 = primeiro (ex: Limpeza), 12 = último (ex: CBUQ)
  color: string; // Hex color para o Diagrama Linear
  iconName: string;
  description: string;
  active: boolean;
}

export type TrackDirection = 
  | 'Crescente' 
  | 'Decrescente' 
  | 'Pista Dupla Dir' 
  | 'Pista Dupla Esq' 
  | 'Eixo Central'
  | 'Lado Esquerdo'
  | 'Lado Direito'
  | 'Ambos os Lados';

export interface ExecutionRecord {
  id: string;
  contractId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  kmInitial: number;
  kmFinal: number;
  extensionMeters: number;
  direction: TrackDirection;
  thicknessCm?: number;
  widthMeters?: number;
  textureType?: string;
  rdoNumber?: string; // Número do RDO
  teamLeader?: string;
  observations?: string;
  status: 'Aprovado' | 'Pendente' | 'Com Restrição';
  createdAt: string;
  createdBy: string;
  photos?: string[]; // URLs de fotos
}

// Representa uma Estaca de 20 metros no Motor Linear
export interface Segment20m {
  id: string; // Ex: "BR101-KM100+020"
  contractId: string;
  km: number; // Ex: 100.02
  estaca: number; // Ex: 5001 (+20m cada estaca)
  kmFormatted: string; // Ex: "KM 100+020"
  latestServiceId?: string;
  latestServiceName?: string;
  latestServiceColor?: string;
  latestExecutionDate?: string;
  thicknessCm?: number;
  rdoNumber?: string;
  hasPhotos: boolean;
  hasTests: boolean;
  hasEnvironmentalNotice: boolean;
  executionHistory: ExecutionRecord[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'LOGIN' | 'LOGOUT' | 'CADASTRO' | 'ALTERACAO' | 'EXCLUSÃO' | 'EXPORTACAO' | 'ERRO';
  module: string;
  details: string;
  ip: string;
}

export interface PhotoRecord {
  id: string;
  contractId: string;
  km: number;
  estaca: string;
  phase: 'Antes' | 'Durante' | 'Depois';
  url: string;
  title: string;
  date: string;
  caption: string;
}

export interface TopographyPoint {
  id: string;
  contractId: string;
  estaca: string;
  km: number;
  cotaProjeto: number;
  cotaTerreno: number;
  cotaExecutada: number;
  desvioMm: number;
  status: 'Conforme' | 'Ajustar Sub-base' | 'Fora de Tolerância';
  rtkOperator: string;
  date: string;
}

export interface EnvironmentalRecord {
  id: string;
  contractId: string;
  kmInitial: number;
  kmFinal: number;
  type: 'Passivo Ambiental' | 'Licenciamento LO/LI' | 'Condicionante' | 'RAC / Construtora' | 'Área de Jazida';
  description: string;
  severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status: 'Regularizado' | 'Em Andamento' | 'Pendente Fiscalização';
  responsible: string;
  licenseNumber?: string;
  dueDate?: string;
}

export interface SystemSettings {
  companyName: string;
  companyLogoUrl: string;
  primaryColor: string;
  autoBackup: boolean;
  requireRdoOnExecution: boolean;
}

export interface EquipmentItem {
  type: string;
  quantity: number;
}

export interface ActivityItem {
  activity: string;
  kmInitial: number;
  kmFinal: number;
  extensionKm: number;
}

export interface FichaDeCampoRecord {
  id: string;
  contractId: string;
  contractNumber: string;
  executingCompany: string;
  supervisingCompany: string;
  date: string; // YYYY-MM-DD
  weatherCondition: string; // Bom, Chuvoso, etc.
  responsibleTech: string; // Eng. Civil Patrick Diniz, Téc. Virgílio Ximenes
  equipments: EquipmentItem[];
  activities: ActivityItem[];
  occurrences: string;
  observations: string;
  uploadedFileUrl?: string; // Base64 or object URL if uploaded
  fileName?: string;
  fileType?: string;
  generatedAt?: string;
  kmReference?: string;
  pageInfo?: string;
}

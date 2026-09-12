/**
 * SCLAF — Motor de Banco de Dados com Sincronização em Tempo Real (Firebase Firestore)
 */

import {
  Contract,
  RoadService,
  ExecutionRecord,
  Segment20m,
  User,
  AuditLog,
  PhotoRecord,
  TopographyPoint,
  EnvironmentalRecord,
  SystemSettings,
  FichaDeCampoRecord
} from '../types';

import {
  INITIAL_CONTRACTS,
  INITIAL_SERVICES,
  INITIAL_EXECUTION_RECORDS,
  INITIAL_USERS,
  INITIAL_PHOTOS,
  INITIAL_TOPOGRAPHY,
  INITIAL_ENVIRONMENTAL,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';

import { db as firestoreDb } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

/**
 * Sanitiza recursivamente qualquer payload antes de enviar ao Firestore,
 * removendo campos 'undefined' que causam erro fatal no setDoc / writeBatch / updateDoc.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

export const DEFAULT_MATUPIRI_LOGO = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgMjAwIiB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZmZmZmYiIHJ4PSIxMiIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LCAxNikiPjx0ZXh0IHg9IjYiIHk9IjM4IiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iODAwIiBmb250LXNpemU9IjMwIiBmaWxsPSIjNTgwNzY2IiBsZXR0ZXItc3BhY2luZz0iMyI+Q09OU8OTUkNJTzwvdGV4dD48dGV4dCB4PSIyIiB5PSIxMTgiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZvbnQtc2l6ZT0iODgiIGZpbGw9IiM1ODA3NjYiIGxldHRlci1zcGFjaW5nPSItMiI+TWF0dXBpcmk8L3RleHQ+PGxpbmUgeDE9IjQiIHkxPSIxMzgiIHgyPSI1NDYiIHkyPSIxMzgiIHN0cm9rZT0iIzU4MDc2NiIgc3Ryb2tlLXdpZHRoPSIxMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTM4IiB4Mj0iNTM4IiB5Mj0iMTM4IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWRhc2hhcnJheT0iMTIgMTAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjx0ZXh0IHg9IjYiIHk9IjE2OCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjgwMCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzU4MDc2NiIgbGV0dGVyLXNwYWNpbmc9IjEiPk1PREVSQSBFTkdFTkhBUklBIOKAoiBTQ0IgQklNICZhbXA7IEdJUzwvdGV4dD48L2c+PC9zdmc+`;

export const INITIAL_FICHAS: FichaDeCampoRecord[] = [
  {
    id: 'f-101',
    contractId: 'c1',
    contractNumber: 'SR-400/2023',
    executingCompany: 'CONSTRUTORA MEIRELLES MASCARENHAS - CMM',
    supervisingCompany: 'Consórcio Matupiri',
    date: '2026-07-23',
    weatherCondition: 'Bom',
    responsibleTech: 'Eng. Civil Patrick Diniz, Téc. Virgílio Ximenes',
    equipments: [
      { type: 'Caminhão Comboio', quantity: 1 },
      { type: 'Caminhão Pipa', quantity: 2 },
      { type: 'Caminhão Basculante', quantity: 2 },
      { type: 'Espargidor', quantity: 1 },
      { type: 'Motoniveladora', quantity: 2 },
      { type: 'Rolo Compactador', quantity: 2 },
      { type: 'Trator Agrícola com Grade', quantity: 1 },
      { type: 'Caminhão Silo (Cebolão)', quantity: 1 },
      { type: 'Carro de Apoio', quantity: 1 },
    ],
    activities: [
      {
        activity: 'Revestimento Primário Com Adição de 3,5% de Cimento',
        kmInitial: 386.96,
        kmFinal: 386.20,
        extensionKm: 0.760,
      }
    ],
    occurrences: 'Nenhuma ocorrência registrada',
    observations: 'Foi registrado que, no período matutino, a equipe da empresa executora deu continuidade aos serviços de execução do revestimento primário com adição de 3,5% de cimento, no segmento compreendido entre os quilômetros 386,96 e 386,20, perfazendo uma extensão total de 760 metros. As atividades foram realizadas em conformidade com o planejamento operacional, atendendo às especificações técnicas e aos procedimentos executivos estabelecidos para a obra.',
    generatedAt: '23/07/2026 12:04',
    kmReference: 'KM 386.92',
    pageInfo: 'Consórcio Matupiri - DNIT/AM'
  }
];

const STORAGE_KEY_PREFIX = 'sclaf_v1_';

type ListenerCallback = () => void;

class DatabaseEngine {
  private contracts: Contract[] = [];
  private services: RoadService[] = [];
  private executionRecords: ExecutionRecord[] = [];
  private users: User[] = [];
  private currentUser: User | null = null;
  private photos: PhotoRecord[] = [];
  private topography: TopographyPoint[] = [];
  private environmental: EnvironmentalRecord[] = [];
  private auditLogs: AuditLog[] = [];
  private fichasDeCampo: FichaDeCampoRecord[] = [];
  private settings: SystemSettings = {
    companyName: 'CONSÓRCIO MATUPIRI (MODERA • SCB BIM & GIS)',
    companyLogoUrl: DEFAULT_MATUPIRI_LOGO,
    primaryColor: '#580766',
    autoBackup: true,
    requireRdoOnExecution: true,
  };

  private listeners: Set<ListenerCallback> = new Set();
  private isFirebaseSyncReady: boolean = false;
  private isSeeding: boolean = false;
  public syncStatus: 'conectando' | 'sincronizado' | 'offline' = 'conectando';

  constructor() {
    this.loadFromLocalStorage();
    this.initFirebaseRealtimeSync();
  }

  // --- SUBSCRIÇÃO EM TEMPO REAL ---
  public subscribe(callback: ListenerCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Erro ao notificar subscriber:', e);
      }
    });
  }

  // --- SINCRONIZAÇÃO EM TEMPO REAL COM FIREBASE FIRESTORE ---
  private async initFirebaseRealtimeSync() {
    if (!firestoreDb) {
      this.syncStatus = 'offline';
      return;
    }

    try {
      // 1. Escuta em tempo real da coleção de Contratos
      onSnapshot(collection(firestoreDb, 'contracts'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Contract[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as Contract);
          });
          this.contracts = list;
          this.saveToLocalStorage();
          this.syncStatus = 'sincronizado';
          this.notifyListeners();
        } else if (!this.isSeeding) {
          this.seedInitialContracts();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar contratos em tempo real:', err);
      });

      // 2. Escuta em tempo real da coleção de Serviços
      onSnapshot(collection(firestoreDb, 'services'), (snapshot) => {
        if (!snapshot.empty) {
          const list: RoadService[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as RoadService);
          });
          this.services = list.sort((a, b) => a.executiveOrder - b.executiveOrder);
          this.saveToLocalStorage();
          this.syncStatus = 'sincronizado';
          this.notifyListeners();
        } else if (!this.isSeeding) {
          this.seedInitialServices();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar serviços em tempo real:', err);
      });

      // 3. Escuta em tempo real da coleção de Execuções
      onSnapshot(collection(firestoreDb, 'executions'), (snapshot) => {
        if (!snapshot.empty) {
          const list: ExecutionRecord[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as ExecutionRecord);
          });
          this.executionRecords = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.saveToLocalStorage();
          this.syncStatus = 'sincronizado';
          this.notifyListeners();
        } else if (!this.isSeeding) {
          this.seedInitialExecutions();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar execuções em tempo real:', err);
      });

      // 4. Escuta em tempo real das Fichas de Campo
      onSnapshot(collection(firestoreDb, 'fichasDeCampo'), (snapshot) => {
        if (!snapshot.empty) {
          const list: FichaDeCampoRecord[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as FichaDeCampoRecord);
          });
          this.fichasDeCampo = list;
          this.saveToLocalStorage();
          this.notifyListeners();
        } else if (!this.isSeeding) {
          this.seedInitialFichas();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar fichas em tempo real:', err);
      });

      // 5. Escuta em tempo real das Fotos
      onSnapshot(collection(firestoreDb, 'photos'), (snapshot) => {
        if (!snapshot.empty) {
          const list: PhotoRecord[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as PhotoRecord);
          });
          this.photos = list;
          this.saveToLocalStorage();
          this.notifyListeners();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar fotos:', err);
      });

      // 6. Escuta em tempo real de Topografia
      onSnapshot(collection(firestoreDb, 'topography'), (snapshot) => {
        if (!snapshot.empty) {
          const list: TopographyPoint[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as TopographyPoint);
          });
          this.topography = list;
          this.saveToLocalStorage();
          this.notifyListeners();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar topografia:', err);
      });

      // 7. Escuta em tempo real de Registros Ambientais
      onSnapshot(collection(firestoreDb, 'environmental'), (snapshot) => {
        if (!snapshot.empty) {
          const list: EnvironmentalRecord[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as EnvironmentalRecord);
          });
          this.environmental = list;
          this.saveToLocalStorage();
          this.notifyListeners();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar dados ambientais:', err);
      });

      // 8. Escuta em tempo real de Configurações
      onSnapshot(doc(firestoreDb, 'system', 'settings'), (docSnap) => {
        if (docSnap.exists()) {
          const cloudSettings = docSnap.data() as SystemSettings;
          if (!cloudSettings.companyLogoUrl || cloudSettings.companyLogoUrl.includes('utf8,<svg') || cloudSettings.companyLogoUrl.trim() === '') {
            cloudSettings.companyLogoUrl = DEFAULT_MATUPIRI_LOGO;
          }
          this.settings = cloudSettings;
          this.saveToLocalStorage();
          this.notifyListeners();
        } else {
          this.syncSettingsToCloud();
        }
      }, (err) => {
        console.warn('SCLAF: Erro ao escutar configurações:', err);
      });

      this.isFirebaseSyncReady = true;
      this.syncStatus = 'sincronizado';
    } catch (e) {
      console.error('SCLAF: Falha ao inicializar listeners Firebase:', e);
      this.syncStatus = 'offline';
    }
  }

  // Popula os dados iniciais do projeto na nuvem para que qualquer novo usuário acesse instantaneamente
  private async seedInitialContracts() {
    if (!firestoreDb || this.isSeeding) return;
    this.isSeeding = true;
    try {
      const batch = writeBatch(firestoreDb);
      const toSeed = this.contracts.length > 0 ? this.contracts : INITIAL_CONTRACTS;
      toSeed.forEach(c => {
        const ref = doc(firestoreDb, 'contracts', c.id);
        batch.set(ref, sanitizeForFirestore(c), { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Erro ao semear contratos:', e);
    } finally {
      this.isSeeding = false;
    }
  }

  private async seedInitialServices() {
    if (!firestoreDb || this.isSeeding) return;
    try {
      const batch = writeBatch(firestoreDb);
      const toSeed = this.services.length > 0 ? this.services : INITIAL_SERVICES;
      toSeed.forEach(s => {
        const ref = doc(firestoreDb, 'services', s.id);
        batch.set(ref, sanitizeForFirestore(s), { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Erro ao semear serviços:', e);
    }
  }

  private async seedInitialExecutions() {
    if (!firestoreDb || this.isSeeding) return;
    try {
      const batch = writeBatch(firestoreDb);
      const toSeed = this.executionRecords.length > 0 ? this.executionRecords : INITIAL_EXECUTION_RECORDS;
      toSeed.forEach(e => {
        const ref = doc(firestoreDb, 'executions', e.id);
        batch.set(ref, sanitizeForFirestore(e), { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Erro ao semear execuções:', e);
    }
  }

  private async seedInitialFichas() {
    if (!firestoreDb || this.isSeeding) return;
    try {
      const batch = writeBatch(firestoreDb);
      const toSeed = this.fichasDeCampo.length > 0 ? this.fichasDeCampo : INITIAL_FICHAS;
      toSeed.forEach(f => {
        const ref = doc(firestoreDb, 'fichasDeCampo', f.id);
        batch.set(ref, sanitizeForFirestore(f), { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Erro ao semear fichas de campo:', e);
    }
  }

  private async syncSettingsToCloud() {
    if (!firestoreDb) return;
    try {
      await setDoc(doc(firestoreDb, 'system', 'settings'), sanitizeForFirestore(this.settings), { merge: true });
    } catch (e) {
      console.error('Erro ao sincronizar configurações corporativas com a nuvem:', e);
    }
  }

  // Forçar envio de todo o estado local para a Nuvem Firestore
  public async pushAllLocalDataToCloud() {
    if (!firestoreDb) return;
    try {
      // Contratos
      for (const c of this.contracts) {
        await setDoc(doc(firestoreDb, 'contracts', c.id), sanitizeForFirestore(c), { merge: true });
      }
      // Serviços
      for (const s of this.services) {
        await setDoc(doc(firestoreDb, 'services', s.id), sanitizeForFirestore(s), { merge: true });
      }
      // Execuções
      for (const e of this.executionRecords) {
        await setDoc(doc(firestoreDb, 'executions', e.id), sanitizeForFirestore(e), { merge: true });
      }
      // Fichas
      for (const f of this.fichasDeCampo) {
        await setDoc(doc(firestoreDb, 'fichasDeCampo', f.id), sanitizeForFirestore(f), { merge: true });
      }
      // Configurações
      await setDoc(doc(firestoreDb, 'system', 'settings'), sanitizeForFirestore(this.settings), { merge: true });
      console.log('SCLAF: Todos os dados foram sincronizados com a Nuvem Firestore com sucesso.');
    } catch (e) {
      console.error('SCLAF: Erro ao enviar dados locais para a nuvem:', e);
    }
  }

  // --- CARGA E PERSISTÊNCIA LOCAL (OFFLINE FIRST) ---
  private loadFromLocalStorage() {
    try {
      const storedContracts = localStorage.getItem(STORAGE_KEY_PREFIX + 'contracts');
      this.contracts = storedContracts ? JSON.parse(storedContracts) : INITIAL_CONTRACTS;

      const storedServices = localStorage.getItem(STORAGE_KEY_PREFIX + 'services');
      if (storedServices) {
        const parsed: RoadService[] = JSON.parse(storedServices);
        INITIAL_SERVICES.forEach(initSrv => {
          const idx = parsed.findIndex(s => s.id === initSrv.id);
          if (idx === -1) {
            parsed.push(initSrv);
          } else if (!parsed[idx].surfaceType) {
            parsed[idx].surfaceType = initSrv.surfaceType;
          }
        });
        this.services = parsed;
      } else {
        this.services = INITIAL_SERVICES;
      }

      const storedExecutions = localStorage.getItem(STORAGE_KEY_PREFIX + 'executions');
      this.executionRecords = storedExecutions ? JSON.parse(storedExecutions) : INITIAL_EXECUTION_RECORDS;

      const storedUsers = localStorage.getItem(STORAGE_KEY_PREFIX + 'users');
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      const storedPhotos = localStorage.getItem(STORAGE_KEY_PREFIX + 'photos');
      this.photos = storedPhotos ? JSON.parse(storedPhotos) : INITIAL_PHOTOS;

      const storedTopography = localStorage.getItem(STORAGE_KEY_PREFIX + 'topography');
      this.topography = storedTopography ? JSON.parse(storedTopography) : INITIAL_TOPOGRAPHY;

      const storedEnvironmental = localStorage.getItem(STORAGE_KEY_PREFIX + 'environmental');
      this.environmental = storedEnvironmental ? JSON.parse(storedEnvironmental) : INITIAL_ENVIRONMENTAL;

      const storedLogs = localStorage.getItem(STORAGE_KEY_PREFIX + 'logs');
      this.auditLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_AUDIT_LOGS;

      const storedFichas = localStorage.getItem(STORAGE_KEY_PREFIX + 'fichas');
      this.fichasDeCampo = storedFichas ? JSON.parse(storedFichas) : INITIAL_FICHAS;

      const storedUser = localStorage.getItem(STORAGE_KEY_PREFIX + 'currentUser');
      this.currentUser = storedUser ? JSON.parse(storedUser) : this.users[0];

      const storedSettings = localStorage.getItem(STORAGE_KEY_PREFIX + 'settings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (!parsedSettings.companyLogoUrl || parsedSettings.companyLogoUrl.includes('utf8,<svg') || parsedSettings.companyLogoUrl.trim() === '') {
          parsedSettings.companyLogoUrl = DEFAULT_MATUPIRI_LOGO;
        }
        this.settings = parsedSettings;
      } else {
        this.settings.companyLogoUrl = DEFAULT_MATUPIRI_LOGO;
      }
    } catch (e) {
      console.error('SCLAF: Erro ao carregar dados do localStorage, restaurando iniciais.', e);
      this.contracts = INITIAL_CONTRACTS;
      this.services = INITIAL_SERVICES;
      this.executionRecords = INITIAL_EXECUTION_RECORDS;
      this.users = INITIAL_USERS;
      this.currentUser = INITIAL_USERS[0];
      this.photos = INITIAL_PHOTOS;
      this.topography = INITIAL_TOPOGRAPHY;
      this.environmental = INITIAL_ENVIRONMENTAL;
      this.auditLogs = INITIAL_AUDIT_LOGS;
      this.fichasDeCampo = INITIAL_FICHAS;
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'contracts', JSON.stringify(this.contracts));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'services', JSON.stringify(this.services));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'executions', JSON.stringify(this.executionRecords));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'photos', JSON.stringify(this.photos));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'topography', JSON.stringify(this.topography));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'environmental', JSON.stringify(this.environmental));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'logs', JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'fichas', JSON.stringify(this.fichasDeCampo));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'currentUser', JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('SCLAF: Erro ao salvar dados no localStorage.', e);
    }
  }

  // --- LOG DE AUDITORIA ---
  public logAction(action: AuditLog['action'], module: string, details: string) {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleString('pt-BR'),
      user: this.currentUser ? this.currentUser.name : 'Sistema',
      role: this.currentUser ? this.currentUser.role : 'sistema',
      action,
      module,
      details,
      ip: '192.168.1.100 (SCLAF Cloud Realtime)'
    };
    this.auditLogs.unshift(newLog);
    this.saveToLocalStorage();
  }

  // --- USUÁRIOS & SESSÃO ---
  public getCurrentUser(): User {
    if (!this.currentUser) {
      this.currentUser = this.users[0];
    }
    return this.currentUser;
  }

  public setCurrentUser(userId: string) {
    const found = this.users.find(u => u.id === userId);
    if (found) {
      this.currentUser = found;
      this.logAction('LOGIN', 'Autenticação', `Alternou para o usuário ${found.name} (${found.role}).`);
      this.saveToLocalStorage();
      this.notifyListeners();
    }
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  // --- CONTRATOS ---
  public getContracts(): Contract[] {
    return [...this.contracts];
  }

  public getContractById(id: string): Contract | undefined {
    return this.contracts.find(c => c.id === id);
  }

  public async addContract(contract: Omit<Contract, 'id' | 'extensionKm'>): Promise<Contract> {
    const extensionKm = Math.max(0, contract.kmFinal - contract.kmInitial);
    const newContract: Contract = {
      ...contract,
      id: 'ctr-' + Date.now(),
      extensionKm,
    };
    this.contracts.push(newContract);
    this.logAction('CADASTRO', 'Contratos', `Novo contrato cadastrado: ${newContract.number} (${newContract.highway}).`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'contracts', newContract.id), sanitizeForFirestore(newContract));
      } catch (e) {
        console.error('Erro ao salvar contrato no Firestore:', e);
      }
    }

    return newContract;
  }

  public async updateContract(id: string, updated: Partial<Contract>) {
    const index = this.contracts.findIndex(c => c.id === id);
    if (index !== -1) {
      const existing = this.contracts[index];
      const kmInitial = updated.kmInitial !== undefined ? updated.kmInitial : existing.kmInitial;
      const kmFinal = updated.kmFinal !== undefined ? updated.kmFinal : existing.kmFinal;
      const extensionKm = Math.max(0, kmFinal - kmInitial);

      const updatedContract: Contract = {
        ...existing,
        ...updated,
        kmInitial,
        kmFinal,
        extensionKm,
      };

      this.contracts[index] = updatedContract;
      this.logAction('ALTERACAO', 'Contratos', `Contrato atualizado: ${this.contracts[index].number}.`);
      this.saveToLocalStorage();
      this.notifyListeners();

      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'contracts', id), sanitizeForFirestore(updatedContract), { merge: true });
        } catch (e) {
          console.error('Erro ao atualizar contrato no Firestore:', e);
        }
      }
    }
  }

  public async deleteContract(id: string) {
    const contract = this.getContractById(id);
    if (contract) {
      this.contracts = this.contracts.filter(c => c.id !== id);
      this.executionRecords = this.executionRecords.filter(e => e.contractId !== id);
      this.logAction('EXCLUSÃO', 'Contratos', `Contrato removido: ${contract.number}.`);
      this.saveToLocalStorage();
      this.notifyListeners();

      if (firestoreDb) {
        try {
          await deleteDoc(doc(firestoreDb, 'contracts', id));
        } catch (e) {
          console.error('Erro ao deletar contrato no Firestore:', e);
        }
      }
    }
  }

  // --- SERVIÇOS ---
  public getServices(): RoadService[] {
    return [...this.services].sort((a, b) => a.executiveOrder - b.executiveOrder);
  }

  public async addService(service: Omit<RoadService, 'id'>): Promise<RoadService> {
    const newService: RoadService = {
      ...service,
      id: 'srv-' + Date.now(),
    };
    this.services.push(newService);
    this.logAction('CADASTRO', 'Serviços', `Novo serviço cadastrado: ${newService.name}.`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'services', newService.id), sanitizeForFirestore(newService));
      } catch (e) {
        console.error('Erro ao salvar serviço no Firestore:', e);
      }
    }

    return newService;
  }

  public async updateService(id: string, updated: Partial<RoadService>) {
    const index = this.services.findIndex(s => s.id === id);
    if (index !== -1) {
      const updatedSrv = { ...this.services[index], ...updated };
      this.services[index] = updatedSrv;
      this.logAction('ALTERACAO', 'Serviços', `Serviço modificado: ${this.services[index].name}.`);
      this.saveToLocalStorage();
      this.notifyListeners();

      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'services', id), sanitizeForFirestore(updatedSrv), { merge: true });
        } catch (e) {
          console.error('Erro ao atualizar serviço no Firestore:', e);
        }
      }
    }
  }

  public async deleteService(id: string) {
    const service = this.services.find(s => s.id === id);
    if (service) {
      this.services = this.services.filter(s => s.id !== id);
      this.logAction('EXCLUSÃO', 'Serviços', `Serviço removido: ${service.name}.`);
      this.saveToLocalStorage();
      this.notifyListeners();

      if (firestoreDb) {
        try {
          await deleteDoc(doc(firestoreDb, 'services', id));
        } catch (e) {
          console.error('Erro ao remover serviço no Firestore:', e);
        }
      }
    }
  }

  // --- EXECUÇÕES DE OBRA ---
  public getExecutions(contractId?: string): ExecutionRecord[] {
    if (contractId) {
      return this.executionRecords.filter(e => e.contractId === contractId);
    }
    return [...this.executionRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async addExecution(record: Omit<ExecutionRecord, 'id' | 'extensionMeters' | 'createdAt' | 'createdBy'>): Promise<ExecutionRecord> {
    const extensionMeters = Math.round(Math.abs(record.kmFinal - record.kmInitial) * 1000);
    const newRecord: ExecutionRecord = {
      ...record,
      id: 'exec-' + Date.now(),
      extensionMeters,
      createdAt: new Date().toLocaleString('pt-BR'),
      createdBy: this.currentUser ? this.currentUser.name : 'Operador',
    };
    this.executionRecords.unshift(newRecord);

    const contract = this.getContractById(record.contractId);
    const service = this.services.find(s => s.id === record.serviceId);
    this.logAction(
      'CADASTRO',
      'Execuções',
      `Lançado ${service?.name || 'Serviço'} do KM ${record.kmInitial.toFixed(3)} ao ${record.kmFinal.toFixed(3)} (${extensionMeters}m) no Contrato ${contract?.number || ''}.`
    );
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'executions', newRecord.id), sanitizeForFirestore(newRecord));
      } catch (e) {
        console.error('Erro ao sincronizar execução com Firestore:', e);
      }
    }

    return newRecord;
  }

  public async updateExecution(id: string, updated: Partial<ExecutionRecord>) {
    const index = this.executionRecords.findIndex(e => e.id === id);
    if (index !== -1) {
      const existing = this.executionRecords[index];
      const kInit = updated.kmInitial !== undefined ? updated.kmInitial : existing.kmInitial;
      const kFin = updated.kmFinal !== undefined ? updated.kmFinal : existing.kmFinal;
      const extensionMeters = Math.round(Math.abs(kFin - kInit) * 1000);

      const updatedRecord: ExecutionRecord = {
        ...existing,
        ...updated,
        kmInitial: kInit,
        kmFinal: kFin,
        extensionMeters,
      };

      this.executionRecords[index] = updatedRecord;
      this.logAction('ALTERACAO', 'Execuções', `Execução alterada do KM ${kInit} ao KM ${kFin}.`);
      this.saveToLocalStorage();
      this.notifyListeners();

      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'executions', id), sanitizeForFirestore(updatedRecord), { merge: true });
        } catch (e) {
          console.error('Erro ao atualizar execução no Firestore:', e);
        }
      }
    }
  }

  public async deleteExecution(id: string) {
    const record = this.executionRecords.find(e => e.id === id);
    if (record) {
      this.executionRecords = this.executionRecords.filter(e => e.id !== id);
      this.logAction('EXCLUSÃO', 'Execuções', `Execução removida do KM ${record.kmInitial} ao KM ${record.kmFinal}.`);
      this.saveToLocalStorage();
      this.notifyListeners();

      if (firestoreDb) {
        try {
          await deleteDoc(doc(firestoreDb, 'executions', id));
        } catch (e) {
          console.error('Erro ao excluir execução no Firestore:', e);
        }
      }
    }
  }

  // --- MOTOR LINEAR (20 METROS POR SEGMENTO) ---
  public generateSegmentsForContract(contractId: string): Segment20m[] {
    const contract = this.getContractById(contractId);
    if (!contract) return [];

    const startKm = Math.min(contract.kmInitial, contract.kmFinal);
    const endKm = Math.max(contract.kmInitial, contract.kmFinal);
    const totalMeters = Math.round((endKm - startKm) * 1000);
    
    // Cada segmento é 20m (0.02 km)
    const segmentCount = Math.ceil(totalMeters / 20);
    const contractExecutions = this.getExecutions(contractId);
    const contractPhotos = this.photos.filter(p => p.contractId === contractId);

    const segments: Segment20m[] = [];

    for (let i = 0; i < segmentCount; i++) {
      const segStartKm = startKm + (i * 0.02);
      const segEndKm = segStartKm + 0.02;
      const segMidKm = segStartKm + 0.01;
      const estacaNumber = Math.floor(segStartKm * 50); // 1 km = 50 estacas de 20m

      // Encontra todas as execuções que cobrem este segmento de 20m
      const overlappingExecs = contractExecutions.filter(exec => {
        const eMin = Math.min(exec.kmInitial, exec.kmFinal);
        const eMax = Math.max(exec.kmInitial, exec.kmFinal);
        return segStartKm < eMax && segEndKm > eMin;
      });

      // Pega o último serviço lançado/executado para este segmento (sobreposto)
      let topService: RoadService | undefined = undefined;
      let topExec: ExecutionRecord | undefined = undefined;

      if (overlappingExecs.length > 0) {
        const sortedExecs = [...overlappingExecs].sort((a, b) => {
          const timeA = new Date(a.createdAt || a.date).getTime() || 0;
          const timeB = new Date(b.createdAt || b.date).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return b.id.localeCompare(a.id);
        });
        topExec = sortedExecs[0];
        if (topExec) {
          topService = this.services.find(srv => srv.id === topExec.serviceId);
        }
      }

      // Fotos no entorno
      const hasPhotos = contractPhotos.some(p => Math.abs(p.km - segMidKm) < 0.1);
      const hasTests = topExec ? topExec.status === 'Aprovado' : false;

      // Formatação no padrão estacamento DNIT (ex: KM 100+020 ou Estaca 5001)
      const kmBase = Math.floor(segStartKm);
      const metersOffset = Math.round((segStartKm - kmBase) * 1000);
      const kmFormatted = `KM ${kmBase}+${metersOffset.toString().padStart(3, '0')}`;

      segments.push({
        id: `seg-${contractId}-${i}`,
        contractId,
        km: Number(segStartKm.toFixed(3)),
        estaca: estacaNumber,
        kmFormatted,
        latestServiceId: topService ? topService.id : undefined,
        latestServiceName: topService ? topService.name : undefined,
        latestServiceColor: topService ? topService.color : undefined,
        latestExecutionDate: topExec ? topExec.date : undefined,
        thicknessCm: topExec?.thicknessCm,
        rdoNumber: topExec?.rdoNumber,
        hasPhotos,
        hasTests,
        hasEnvironmentalNotice: false,
        executionHistory: overlappingExecs,
      });
    }

    return segments;
  }

  // --- DASHBOARD E MÉTRICAS EXECUTIVAS ---
  public getDashboardMetrics(contractId?: string) {
    const activeContracts = contractId && contractId !== 'ALL'
      ? this.contracts.filter(c => c.id === contractId)
      : this.contracts;

    let totalExtensionKm = 0;
    activeContracts.forEach(c => totalExtensionKm += c.extensionKm);

    // Calcular percentual executado por tipo de serviço
    const executions = contractId && contractId !== 'ALL'
      ? this.executionRecords.filter(e => e.contractId === contractId)
      : this.executionRecords;

    let totalExecMeters = 0;
    executions.forEach(e => totalExecMeters += e.extensionMeters);

    // Avanço por serviço
    const serviceProgress: { [serviceName: string]: { meters: number; color: string } } = {};
    this.services.forEach(s => {
      serviceProgress[s.name] = { meters: 0, color: s.color };
    });

    executions.forEach(exec => {
      const s = this.services.find(srv => srv.id === exec.serviceId);
      if (s) {
        serviceProgress[s.name].meters += exec.extensionMeters;
      }
    });

    const cbuqService = this.services.find(s => s.code === 'SER-009');
    let cbuqMeters = 0;
    if (cbuqService) {
      cbuqMeters = serviceProgress[cbuqService.name]?.meters || 0;
    }

    const cbuqKm = cbuqMeters / 1000;
    const globalProgressPct = totalExtensionKm > 0 ? Math.min(100, Number(((cbuqKm / totalExtensionKm) * 100).toFixed(1))) : 0;

    return {
      totalContracts: activeContracts.length,
      totalExtensionKm: Number(totalExtensionKm.toFixed(1)),
      totalExecutionsCount: executions.length,
      cbuqExecutedKm: Number(cbuqKm.toFixed(1)),
      globalProgressPct,
      serviceProgress,
    };
  }

  // --- OUTROS MÓDULOS ---
  public getPhotos(): PhotoRecord[] {
    return [...this.photos];
  }

  public async addPhoto(photo: Omit<PhotoRecord, 'id'>) {
    const newPhoto: PhotoRecord = { ...photo, id: 'ft-' + Date.now() };
    this.photos.unshift(newPhoto);
    this.logAction('CADASTRO', 'Fotografias', `Foto adicionada no KM ${photo.km}.`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'photos', newPhoto.id), sanitizeForFirestore(newPhoto));
      } catch (e) {}
    }
    return newPhoto;
  }

  public getTopography(): TopographyPoint[] {
    return [...this.topography];
  }

  public async addTopographyPoint(point: Omit<TopographyPoint, 'id'>) {
    const newPoint: TopographyPoint = { ...point, id: 'topo-' + Date.now() };
    this.topography.unshift(newPoint);
    this.logAction('CADASTRO', 'Topografia', `Ponto RTK cadastrado na ${point.estaca}.`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'topography', newPoint.id), sanitizeForFirestore(newPoint));
      } catch (e) {}
    }
    return newPoint;
  }

  public getEnvironmental(): EnvironmentalRecord[] {
    return [...this.environmental];
  }

  public async addEnvironmentalRecord(record: Omit<EnvironmentalRecord, 'id'>) {
    const newRecord: EnvironmentalRecord = { ...record, id: 'env-' + Date.now() };
    this.environmental.unshift(newRecord);
    this.logAction('CADASTRO', 'Ambiental', `Registro ambiental inserido: ${record.description}.`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'environmental', newRecord.id), sanitizeForFirestore(newRecord));
      } catch (e) {}
    }
    return newRecord;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  // --- FICHAS DE CAMPO & RDO EXTERNO ---
  public getFichasDeCampo(contractId?: string): FichaDeCampoRecord[] {
    if (!contractId || contractId === 'ALL') {
      return [...this.fichasDeCampo];
    }
    return this.fichasDeCampo.filter(f => f.contractId === contractId);
  }

  public async addFichaDeCampo(ficha: Omit<FichaDeCampoRecord, 'id'>): Promise<FichaDeCampoRecord> {
    const newFicha: FichaDeCampoRecord = {
      ...ficha,
      id: 'f-' + Date.now(),
    };
    this.fichasDeCampo.unshift(newFicha);
    this.logAction('CADASTRO', 'RDO Ficha de Campo', `Ficha de Campo cadastrada para o contrato ${ficha.contractNumber}.`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'fichasDeCampo', newFicha.id), sanitizeForFirestore(newFicha));
      } catch (e) {
        console.error('Erro ao salvar ficha de campo no Firestore:', e);
      }
    }

    return newFicha;
  }

  public async deleteFichaDeCampo(id: string) {
    this.fichasDeCampo = this.fichasDeCampo.filter(f => f.id !== id);
    this.logAction('EXCLUSÃO', 'RDO Ficha de Campo', `Ficha de Campo ${id} excluída.`);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'fichasDeCampo', id));
      } catch (e) {
        console.error('Erro ao deletar ficha de campo no Firestore:', e);
      }
    }
  }

  public async updateSettings(newSettings: Partial<SystemSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.logAction('ALTERACAO', 'Configurações', 'Configurações corporativas atualizadas.');
    this.saveToLocalStorage();
    this.notifyListeners();

    if (firestoreDb) {
      await this.syncSettingsToCloud();
    }
  }

  // Restauração de dados para padrão de fábrica
  public async resetToFactoryDefault() {
    localStorage.clear();
    this.contracts = INITIAL_CONTRACTS;
    this.services = INITIAL_SERVICES;
    this.executionRecords = INITIAL_EXECUTION_RECORDS;
    this.users = INITIAL_USERS;
    this.currentUser = INITIAL_USERS[0];
    this.photos = INITIAL_PHOTOS;
    this.topography = INITIAL_TOPOGRAPHY;
    this.environmental = INITIAL_ENVIRONMENTAL;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.fichasDeCampo = INITIAL_FICHAS;
    this.saveToLocalStorage();
    this.notifyListeners();
    this.logAction('ALTERACAO', 'Sistema', 'Banco de dados restaurado para os valores padrão do DNIT.');
    await this.pushAllLocalDataToCloud();
  }

  // Exportar backup completo do banco de dados em formato JSON
  public exportBackupJson(): string {
    const backupData = {
      contracts: this.contracts,
      services: this.services,
      executionRecords: this.executionRecords,
      photos: this.photos,
      topography: this.topography,
      environmental: this.environmental,
      auditLogs: this.auditLogs,
      exportedAt: new Date().toISOString(),
      version: 'SCLAF 1.0 Realtime',
    };
    return JSON.stringify(backupData, null, 2);
  }
}

export const db = new DatabaseEngine();

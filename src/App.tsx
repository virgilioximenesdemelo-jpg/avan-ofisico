/**
 * SCLAF — Componente Principal com Sincronização em Tempo Real Reativa
 */

import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Header } from './components/Header';
import { Sidebar, ViewTab } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './views/DashboardView';
import { ContractsView } from './views/ContractsView';
import { ServicesView } from './views/ServicesView';
import { ExecutionsView } from './views/ExecutionsView';
import { LinearView } from './views/LinearView';
import { MapView } from './views/MapView';
import { ReportsView } from './views/ReportsView';
import { PhotosView } from './views/PhotosView';
import { TopographyView } from './views/TopographyView';
import { EnvironmentalView } from './views/EnvironmentalView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('painel');
  const [activeContractId, setActiveContractId] = useState<string>('ALL');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [, setRefreshTrigger] = useState(0);

  // Escutar eventos de sincronização em tempo real do banco de dados (Firebase Firestore)
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const currentUser = db.getCurrentUser();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'painel':
        return <DashboardView activeContractId={activeContractId} onNavigate={setActiveTab} />;
      case 'linear':
        return <LinearView activeContractId={activeContractId} />;
      case 'execucoes':
        return <ExecutionsView activeContractId={activeContractId} onRefresh={handleRefresh} />;
      case 'contratos':
        return <ContractsView onRefresh={handleRefresh} />;
      case 'servicos':
        return <ServicesView onRefresh={handleRefresh} />;
      case 'mapa':
        return <MapView activeContractId={activeContractId} />;
      case 'relatorios':
        return <ReportsView activeContractId={activeContractId} />;
      case 'fotografias':
        return <PhotosView activeContractId={activeContractId} />;
      case 'topografia':
        return <TopographyView activeContractId={activeContractId} />;
      case 'ambiental':
        return <EnvironmentalView activeContractId={activeContractId} />;
      case 'configuracoes':
        return <SettingsView onRefresh={handleRefresh} />;
      case 'ajuda':
      case 'sobre':
        return <HelpView />;
      default:
        return <DashboardView activeContractId={activeContractId} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Cabeçalho Superior */}
      <Header
        currentUser={currentUser}
        activeContractId={activeContractId}
        onSelectContract={setActiveContractId}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onNavigateToSettings={() => setActiveTab('configuracoes')}
        onRefresh={handleRefresh}
      />

      {/* Corpo com Sidebar + Área de Conteúdo */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={() => {}}
        />

        {/* Área da View Ativa */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Leaf, Loader2, LogIn } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { QuickActionsModal } from './components/layout/QuickActionsModal';

import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { OwnerDailyBriefModal } from './components/dashboard/OwnerDailyBriefModal';

import { LivestockDatabaseView } from './components/livestock/LivestockDatabaseView';
import { LivestockFormModal } from './components/livestock/LivestockFormModal';
import { LivestockDetailModal } from './components/livestock/LivestockDetailModal';
import { LivestockImportModal } from './components/livestock/LivestockImportModal';

import { WeightMonitoringView } from './components/weight/WeightMonitoringView';
import { HealthManagementView } from './components/health/HealthManagementView';
import { BreedingReproductionView } from './components/breeding/BreedingReproductionView';
import { BirthsDeathsView } from './components/births-deaths/BirthsDeathsView';
import { PurchasesSalesView } from './components/transactions/PurchasesSalesView';
import { FeedManagementView } from './components/feed/FeedManagementView';
import { FinanceView } from './components/finance/FinanceView';
import { DailyReportsView } from './components/daily-reports/DailyReportsView';
import { ReportsExportView } from './components/reports/ReportsExportView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { UserManagementView } from './components/users/UserManagementView';
import { SalesCatalogView } from './components/catalog/SalesCatalogView';

import { storeService } from './services/storeService';
import { authAPI, authSession } from './services/api';
import { LivestockItem, UserProfile } from './types';

type AuthState = 'checking' | 'authenticated' | 'guest';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState(storeService.currentUser);
  const [globalSearch, setGlobalSearch] = useState('');
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [showPublicCatalog, setShowPublicCatalog] = useState(false);

  // Modals
  const [isOwnerBriefOpen, setIsOwnerBriefOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  
  const [isAddLivestockOpen, setIsAddLivestockOpen] = useState(false);
  const [editLivestockItem, setEditLivestockItem] = useState<LivestockItem | null>(null);
  const [detailLivestockItem, setDetailLivestockItem] = useState<LivestockItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      setCurrentUser(storeService.currentUser);
    });
    const handleUnauthorized = () => setAuthState('guest');
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const restoreSession = async () => {
      if (!authSession.getToken()) {
        setAuthState('guest');
        return;
      }
      try {
        const response = await authAPI.getProfile();
        storeService.setCurrentUser(response.data.data as UserProfile);
        setAuthState('authenticated');
      } catch {
        authSession.clear();
        setAuthState('guest');
      }
    };
    void restoreSession();

    return () => {
      unsubscribe();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (currentUser.role === 'USER' && activeTab !== 'catalog') {
      setActiveTab('catalog');
    } else if (currentUser.role !== 'USER' && activeTab === 'catalog') {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser.role]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data.data as { token: string; user: UserProfile };
      authSession.setToken(token);
      storeService.setCurrentUser(user);
      setActiveTab(user.role === 'USER' ? 'catalog' : 'dashboard');
      setAuthState('authenticated');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba kembali.';
      throw new Error(message);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Local session must still be cleared when the server cannot be reached.
    } finally {
      authSession.clear();
      setActiveTab('dashboard');
      setAuthState('guest');
    }
  };

  const handleSelectQuickAction = (actionKey: string) => {
    if (actionKey === 'add-daily-report') {
      setActiveTab('daily-reports');
    } else if (actionKey === 'add-weight') {
      setActiveTab('weight');
    } else if (actionKey === 'add-health') {
      setActiveTab('health');
    } else if (actionKey === 'add-birth') {
      setActiveTab('births-deaths');
    } else if (actionKey === 'add-death') {
      setActiveTab('births-deaths');
    } else if (actionKey === 'add-finance') {
      setActiveTab('finance');
    } else if (actionKey === 'add-livestock') {
      setEditLivestockItem(null);
      setIsAddLivestockOpen(true);
    }
  };

  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-emerald-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-3 text-xs font-bold">Memeriksa sesi pengguna...</p>
        </div>
      </div>
    );
  }

  if (authState === 'guest') {
    if (showPublicCatalog) {
      return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-2xs">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1b4332] text-white">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-slate-950 sm:text-base">SAPI PAPI FARM</p>
                  <p className="text-[10px] font-bold text-emerald-800">Katalog Publik Penjualan Sapi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicCatalog(false)}
                className="flex items-center gap-2 rounded-xl bg-[#1b4332] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#245b43]"
              >
                <LogIn className="h-4 w-4" /> Login Pengelola
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <SalesCatalogView />
          </main>
        </div>
      );
    }
    return <LoginPage onLogin={handleLogin} onOpenCatalog={() => setShowPublicCatalog(true)} />;
  }

  if (currentUser.role === 'USER') {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased">
        <Navbar
          onOpenOwnerBrief={() => undefined}
          onOpenQuickAction={() => undefined}
          onSearchChange={query => setGlobalSearch(query)}
          onOpenNotifications={() => undefined}
          onOpenUsers={() => undefined}
          onLogout={handleLogout}
        />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <SalesCatalogView globalSearchQuery={globalSearch} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen font-sans text-slate-800 antialiased flex flex-col selection:bg-emerald-900 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        onOpenOwnerBrief={() => setIsOwnerBriefOpen(true)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onSearchChange={query => setGlobalSearch(query)}
        onOpenNotifications={() => setActiveTab('notifications')}
        onOpenUsers={() => setActiveTab('users')}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={currentUser.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onOpenOwnerBrief={() => setIsOwnerBriefOpen(true)}
              onOpenQuickAction={() => setIsQuickActionOpen(true)}
              onNavigateTab={tab => setActiveTab(tab)}
            />
          )}

          {activeTab === 'livestock' && (
            <LivestockDatabaseView
              onOpenAddModal={() => {
                setEditLivestockItem(null);
                setIsAddLivestockOpen(true);
              }}
              onOpenEditModal={item => {
                setEditLivestockItem(item);
                setIsAddLivestockOpen(true);
              }}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenDetailModal={item => setDetailLivestockItem(item)}
              globalSearchQuery={globalSearch}
            />
          )}

          {activeTab === 'weight' && <WeightMonitoringView />}
          {activeTab === 'health' && <HealthManagementView />}
          {activeTab === 'breeding' && <BreedingReproductionView />}
          {activeTab === 'births-deaths' && <BirthsDeathsView />}
          {activeTab === 'transactions' && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
            <PurchasesSalesView
              onOpenAddLivestock={() => {
                setEditLivestockItem(null);
                setIsAddLivestockOpen(true);
              }}
            />
          )}
          {activeTab === 'feed' && <FeedManagementView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'daily-reports' && <DailyReportsView />}
          {activeTab === 'reports' && <ReportsExportView />}
          {activeTab === 'notifications' && <NotificationsView />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'users' && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && <UserManagementView />}

        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      {/* MODALS */}
      <OwnerDailyBriefModal
        isOpen={isOwnerBriefOpen}
        onClose={() => setIsOwnerBriefOpen(false)}
      />

      <QuickActionsModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />

      <LivestockFormModal
        isOpen={isAddLivestockOpen}
        onClose={() => setIsAddLivestockOpen(false)}
        editItem={editLivestockItem}
      />

      <LivestockDetailModal
        isOpen={Boolean(detailLivestockItem)}
        onClose={() => setDetailLivestockItem(null)}
        livestock={detailLivestockItem}
      />

      <LivestockImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

    </div>
  );
}

export default App;

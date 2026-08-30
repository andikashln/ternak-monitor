import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { MobileNavigationDrawer } from './components/layout/MobileNavigationDrawer';
import { getNavigationLabel } from './components/layout/Sidebar';
import { SapiPapiLogo } from './components/brand/SapiPapiLogo';
import { SalesCatalogView } from './components/catalog/SalesCatalogView';

import { storeService } from './services/storeService';
import { authAPI, authSession } from './services/api';
import { getOneClickDemoSession, getStaticDemoSession, shouldUseStaticDemoFallback } from './services/demoAuth';
import { LivestockItem, UserProfile } from './types';

const DashboardOverview = lazy(() => import('./components/dashboard/DashboardOverview').then(module => ({ default: module.DashboardOverview })));
const LivestockDatabaseView = lazy(() => import('./components/livestock/LivestockDatabaseView').then(module => ({ default: module.LivestockDatabaseView })));
const LivestockFormModal = lazy(() => import('./components/livestock/LivestockFormModal').then(module => ({ default: module.LivestockFormModal })));
const LivestockDetailModal = lazy(() => import('./components/livestock/LivestockDetailModal').then(module => ({ default: module.LivestockDetailModal })));
const LivestockImportModal = lazy(() => import('./components/livestock/LivestockImportModal').then(module => ({ default: module.LivestockImportModal })));
const HealthManagementView = lazy(() => import('./components/health/HealthManagementView').then(module => ({ default: module.HealthManagementView })));
const BirthsDeathsView = lazy(() => import('./components/births-deaths/BirthsDeathsView').then(module => ({ default: module.BirthsDeathsView })));
const PurchasesSalesView = lazy(() => import('./components/transactions/PurchasesSalesView').then(module => ({ default: module.PurchasesSalesView })));
const SalesResultsView = lazy(() => import('./components/sales-results/SalesResultsView').then(module => ({ default: module.SalesResultsView })));
const ExpenseManagementView = lazy(() => import('./components/expenses/ExpenseManagementView').then(module => ({ default: module.ExpenseManagementView })));
const FinanceView = lazy(() => import('./components/finance/FinanceView').then(module => ({ default: module.FinanceView })));
const DailyReportsView = lazy(() => import('./components/daily-reports/DailyReportsView').then(module => ({ default: module.DailyReportsView })));
const ReportsExportView = lazy(() => import('./components/reports/ReportsExportView').then(module => ({ default: module.ReportsExportView })));
const UserManagementView = lazy(() => import('./components/users/UserManagementView').then(module => ({ default: module.UserManagementView })));
const QuickActionsModal = lazy(() => import('./components/layout/QuickActionsModal').then(module => ({ default: module.QuickActionsModal })));

const PageLoader = () => (
  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white/70 text-emerald-900">
    <div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><p className="mt-2 text-xs font-bold text-slate-500">Memuat modul...</p></div>
  </div>
);

type AuthState = 'checking' | 'authenticated' | 'guest';

export function App() {
  const workspaceMainRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState(storeService.currentUser);
  const [globalSearch, setGlobalSearch] = useState('');
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [showPublicCatalog, setShowPublicCatalog] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  useEffect(() => {
    workspaceMainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data.data as { token: string; user: UserProfile };
      authSession.setToken(token);
      storeService.setCurrentUser(user);
      setActiveTab(user.role === 'USER' ? 'catalog' : 'dashboard');
      setAuthState('authenticated');
    } catch (error: any) {
      if (shouldUseStaticDemoFallback(error.response?.status)) {
        const demoSession = getStaticDemoSession(email, password);
        if (demoSession) {
          authSession.setToken(demoSession.token);
          storeService.setCurrentUser(demoSession.user);
          setActiveTab('dashboard');
          setAuthState('authenticated');
          return;
        }
      }
      const message = error.response?.data?.error || 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba kembali.';
      throw new Error(message);
    }
  };

  const handleDemoLogin = async () => {
    const demoSession = getOneClickDemoSession();
    authSession.setToken(demoSession.token);
    storeService.setCurrentUser(demoSession.user);
    setActiveTab('dashboard');
    setAuthState('authenticated');
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Local session must still be cleared when the server cannot be reached.
    } finally {
      authSession.clear();
      setActiveTab('dashboard');
      setIsMobileMenuOpen(false);
      setAuthState('guest');
    }
  };

  const handleSelectQuickAction = (actionKey: string) => {
    if (actionKey === 'add-daily-report') {
      setActiveTab('daily-reports');
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
        <div className="app-surface min-h-screen font-sans text-slate-800 antialiased">
          <header className="sticky top-0 z-30 border-b border-emerald-950/8 bg-white/92 shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex h-[4.5rem] max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <SapiPapiLogo />
              <button
                type="button"
                onClick={() => setShowPublicCatalog(false)}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-900 px-3.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 sm:px-4"
              >
                <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Login Pengelola</span><span className="sm:hidden">Login</span>
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
            <SalesCatalogView />
          </main>
        </div>
      );
    }
    return <LoginPage onLogin={handleLogin} onDemoLogin={handleDemoLogin} onOpenCatalog={() => setShowPublicCatalog(true)} />;
  }

  if (currentUser.role === 'USER') {
    return (
      <div className="app-surface min-h-screen font-sans text-slate-800 antialiased">
        <Navbar
          pageTitle="Katalog Penjualan"
          onOpenQuickAction={() => undefined}
          onSearchChange={query => setGlobalSearch(query)}
        onOpenUsers={() => undefined}
          onLogout={handleLogout}
        />
        <main className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
          <SalesCatalogView globalSearchQuery={globalSearch} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-surface flex h-dvh min-h-screen flex-col overflow-hidden font-sans text-slate-800 antialiased selection:bg-emerald-900 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        pageTitle={getNavigationLabel(activeTab)}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onSearchChange={query => setGlobalSearch(query)}
        onOpenUsers={() => setActiveTab('users')}
        onLogout={handleLogout}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={currentUser.role}
        />

        {/* Main Content Area */}
        <main ref={workspaceMainRef} className="workspace-main scrollbar-subtle min-w-0 flex-1 overflow-y-auto px-3 py-4 pb-28 sm:px-5 sm:py-5 lg:px-7 lg:py-6 lg:pb-8 2xl:px-10">
          <div className="mx-auto w-full max-w-[94rem]">
          <Suspense fallback={<PageLoader />}>
          
          {activeTab === 'dashboard' && (
            <DashboardOverview
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

          {activeTab === 'health' && <HealthManagementView />}
          {activeTab === 'births-deaths' && <BirthsDeathsView />}
          {activeTab === 'transactions' && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
            <PurchasesSalesView
              onOpenAddLivestock={() => {
                setEditLivestockItem(null);
                setIsAddLivestockOpen(true);
              }}
            />
          )}
          {activeTab === 'sales-results' && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && <SalesResultsView />}
          {activeTab === 'feed' && <ExpenseManagementView onOpenFinance={() => setActiveTab('finance')} />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'daily-reports' && <DailyReportsView />}
          {activeTab === 'reports' && <ReportsExportView />}
          {activeTab === 'users' && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && <UserManagementView />}
          </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
      />

      <MobileNavigationDrawer
        isOpen={isMobileMenuOpen}
        activeTab={activeTab}
        currentUser={currentUser}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={setActiveTab}
        onSearchChange={setGlobalSearch}
        onLogout={handleLogout}
      />

      {/* MODALS */}
      <Suspense fallback={null}>
        {isQuickActionOpen && <QuickActionsModal isOpen onClose={() => setIsQuickActionOpen(false)} onSelectAction={handleSelectQuickAction} />}
        {isAddLivestockOpen && <LivestockFormModal isOpen onClose={() => setIsAddLivestockOpen(false)} editItem={editLivestockItem} />}
        {detailLivestockItem && <LivestockDetailModal isOpen onClose={() => setDetailLivestockItem(null)} livestock={detailLivestockItem} />}
        {isImportModalOpen && <LivestockImportModal isOpen onClose={() => setIsImportModalOpen(false)} />}
      </Suspense>

    </div>
  );
}

export default App;

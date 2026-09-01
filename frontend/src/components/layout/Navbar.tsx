import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { SapiPapiLogo } from '../brand/SapiPapiLogo';
import { ROLE_LABELS } from '../../services/permissions';

interface NavbarProps {
  pageTitle?: string;
  onOpenMenu?: () => void;
  onOpenQuickAction: () => void;
  onSearchChange: (query: string) => void;
  onOpenUsers: () => void;
  onLogout: () => void | Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  pageTitle = 'Dashboard', onOpenMenu, onOpenQuickAction, onSearchChange,
  onOpenUsers, onLogout,
}) => {
  const [currentUser, setCurrentUser] = useState(storeService.currentUser);
  const [searchVal, setSearchVal] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => storeService.subscribe(() => {
    setCurrentUser(storeService.currentUser);
  }), []);

  useEffect(() => {
    if (!showProfileDropdown) return undefined;
    const closeMenu = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileDropdown(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setShowProfileDropdown(false);
    document.addEventListener('mousedown', closeMenu);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showProfileDropdown]);

  const initials = currentUser.displayName.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="app-navbar z-40 shrink-0 border-b bg-white/92 backdrop-blur-xl">
      <div className="flex h-[4.5rem] items-center gap-3 px-3 sm:px-5 lg:px-6">
        <button type="button" onClick={onOpenMenu} className="icon-button lg:hidden" aria-label="Buka menu navigasi">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden w-[15.75rem] shrink-0 lg:block"><SapiPapiLogo /></div>
        <div className="min-w-0 flex-1 lg:hidden">
          <p className="ranch-label truncate">Ternak Monitor</p>
          <h1 className="ranch-heading truncate text-base font-black">{pageTitle}</h1>
        </div>

        <div className="mx-auto hidden w-full max-w-xl flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Cari data peternakan</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchVal}
              onChange={event => { setSearchVal(event.target.value); onSearchChange(event.target.value); }}
              placeholder="Cari ear tag, pembeli, transaksi..."
              className="ranch-input h-10 w-full pl-10 pr-4 text-xs outline-none transition focus:bg-white"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {currentUser.role !== 'USER' && (
            <button type="button" onClick={onOpenQuickAction} className="ranch-action-primary hidden px-3.5 text-xs shadow-md sm:inline-flex">
              <Plus className="h-4 w-4" /> Catat Data
            </button>
          )}
          <div ref={profileRef} className="relative">
            <button type="button" onClick={() => setShowProfileDropdown(value => !value)} className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 transition hover:border-emerald-200 hover:bg-emerald-50" aria-expanded={showProfileDropdown} aria-label="Menu profil">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-black text-emerald-900">{initials}</span>
              <span className="hidden max-w-28 text-left xl:block">
                <span className="block truncate text-[11px] font-black text-slate-800">{currentUser.displayName}</span>
                <span className="block text-[9px] font-bold text-slate-400">{ROLE_LABELS[currentUser.role]}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="text-xs font-black text-slate-950">{currentUser.displayName}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{currentUser.email}</p>
                </div>
                <div className="m-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[10px] font-bold text-emerald-900"><ShieldCheck className="h-4 w-4" /> Hak akses {ROLE_LABELS[currentUser.role]}</div>
                {(currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
                  <button type="button" onClick={() => { setShowProfileDropdown(false); onOpenUsers(); }} className="mx-2 flex min-h-10 w-[calc(100%-1rem)] items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"><Users className="h-4 w-4" /> Kelola pengguna</button>
                )}
                <div className="mt-2 border-t border-slate-100 p-2">
                  <button type="button" onClick={() => { setShowProfileDropdown(false); void onLogout(); }} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Keluar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

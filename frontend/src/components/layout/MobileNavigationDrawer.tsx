import React, { useEffect, useState } from 'react';
import { ChevronRight, LogOut, Search, X } from 'lucide-react';
import { UserProfile } from '../../types';
import { SapiPapiLogo } from '../brand/SapiPapiLogo';
import { navigationSections } from './Sidebar';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  activeTab: string;
  currentUser: UserProfile;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSearchChange: (query: string) => void;
  onLogout: () => void | Promise<void>;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isOpen, activeTab, currentUser, onClose, onNavigate, onSearchChange, onLogout,
}) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (tab: string) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <button type="button" aria-label="Tutup menu" onClick={onClose} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
      <aside className="drawer-enter absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col bg-[#fbfdfb] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <SapiPapiLogo />
          <button type="button" onClick={onClose} className="icon-button" aria-label="Tutup menu navigasi"><X className="h-5 w-5" /></button>
        </div>

        <div className="border-b border-slate-100 px-4 py-3">
          <label className="relative block">
            <span className="sr-only">Cari data peternakan</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={event => { setSearch(event.target.value); onSearchChange(event.target.value); }}
              placeholder="Cari data peternakan..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#a8462d] focus:ring-4 focus:ring-[#a8462d]/10"
            />
          </label>
        </div>

        <nav className="scrollbar-subtle flex-1 overflow-y-auto px-3 py-4" aria-label="Menu lengkap">
          {navigationSections.map(section => {
            const visibleItems = section.items.filter(item => item.allowedRoles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label} className="mb-5">
                <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{section.label}</p>
                <div className="space-y-1">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button key={item.id} type="button" onClick={() => handleNavigate(item.id)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${isActive ? 'bg-[#5a2d1f] text-white shadow-sm' : 'text-slate-700 hover:bg-[#f9ebcc]'}`}>
                        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#f3ddb0]' : 'text-[#5a2d1f]'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold">{item.label}</span>
                          <span className={`block text-[11px] ${isActive ? 'text-[#f3ddb0]/75' : 'text-slate-400'}`}>{item.description}</span>
                        </span>
                        <ChevronRight className={`h-4 w-4 ${isActive ? 'text-emerald-200' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ead0a0] text-xs font-black text-[#5a2d1f]">{currentUser.displayName.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-900">{currentUser.displayName}</span>
              <span className="block truncate text-[11px] text-slate-500">{currentUser.role} · {currentUser.email}</span>
            </span>
          </div>
          <button type="button" onClick={() => void onLogout()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-black text-rose-700"><LogOut className="h-4 w-4" /> Keluar dari akun</button>
        </div>
      </aside>
    </div>
  );
};

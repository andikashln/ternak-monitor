import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown, LogOut, PlusCircle, Search, ShieldCheck, Users } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { SapiPapiLogo } from '../brand/SapiPapiLogo';

interface NavbarProps {
  onOpenQuickAction: () => void;
  onSearchChange: (query: string) => void;
  onOpenNotifications: () => void;
  onOpenUsers: () => void;
  onLogout: () => void | Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickAction, onSearchChange, onOpenNotifications, onOpenUsers, onLogout }) => {
  const [currentUser, setCurrentUser] = useState(storeService.currentUser);
  const [notifications, setNotifications] = useState(storeService.notifications);
  const [searchVal, setSearchVal] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => storeService.subscribe(() => {
    setCurrentUser(storeService.currentUser);
    setNotifications(storeService.notifications);
  }), []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 border-b border-[#d7eadc] bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <SapiPapiLogo className="min-w-0" />
        <div className="hidden max-w-md flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Cari data peternakan</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchVal} onChange={event => { setSearchVal(event.target.value); onSearchChange(event.target.value); }} placeholder="Cari ear tag, pembeli, atau transaksi..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none transition focus:border-[#174a3a] focus:ring-2 focus:ring-[#d7eadc]" />
          </label>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser.role !== 'USER' && <button onClick={onOpenQuickAction} className="inline-flex items-center gap-1.5 rounded-xl bg-[#174a3a] px-2.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#123d30] sm:px-3" aria-label="Tambah aksi kandang"><PlusCircle className="h-4 w-4" /><span className="hidden sm:inline">Tambah</span></button>}
          {currentUser.role !== 'USER' && <button onClick={onOpenNotifications} aria-label="Pemberitahuan" className="relative rounded-xl p-2 text-slate-600 transition hover:bg-[#e7f5eb] hover:text-[#174a3a]"><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{unreadCount}</span>}</button>}
          <div className="relative">
            <button onClick={() => setShowProfileDropdown(value => !value)} className="flex items-center gap-1 rounded-xl border border-slate-200 p-1.5 transition hover:bg-slate-50" aria-label="Menu profil">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e7f5eb] text-[10px] font-black text-[#174a3a]">{currentUser.displayName.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase()}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
            </button>
            {showProfileDropdown && <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
              <div className="border-b border-slate-100 px-4 py-2"><p className="text-xs font-black text-slate-900">{currentUser.displayName}</p><p className="mt-0.5 text-[10px] text-slate-500">{currentUser.email}</p></div>
              <div className="mx-3 my-2 flex items-center gap-2 rounded-xl bg-[#e7f5eb] px-3 py-2 text-[10px] font-bold text-[#174a3a]"><ShieldCheck className="h-4 w-4" />Hak akses: {currentUser.role}</div>
              {(currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && <button onClick={() => { setShowProfileDropdown(false); onOpenUsers(); }} className="mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"><Users className="h-4 w-4" />Pengaturan pengguna</button>}
              <div className="mt-1 border-t border-slate-100 px-2 pt-1"><button onClick={() => { setShowProfileDropdown(false); void onLogout(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" />Keluar</button></div>
            </div>}
          </div>
        </div>
      </div>
    </header>
  );
};

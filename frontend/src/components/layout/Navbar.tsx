import React, { useState, useEffect } from 'react';
import { Building2, Bell, Search, Sparkles, ChevronDown, LogOut, PlusCircle, ShieldCheck, Users } from 'lucide-react';
import { storeService } from '../../services/storeService';

interface NavbarProps {
  onOpenOwnerBrief: () => void;
  onOpenQuickAction: () => void;
  onSearchChange: (query: string) => void;
  onOpenNotifications: () => void;
  onOpenUsers: () => void;
  onLogout: () => void | Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOwnerBrief,
  onOpenQuickAction,
  onSearchChange,
  onOpenNotifications,
  onOpenUsers,
  onLogout
}) => {
  const [currentUser, setCurrentUser] = useState(storeService.currentUser);
  const [locations, setLocations] = useState(storeService.locations);
  const [activeLocId, setActiveLocId] = useState(storeService.activeLocationId);
  const [notifications, setNotifications] = useState(storeService.notifications);
  const [searchVal, setSearchVal] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      setCurrentUser(storeService.currentUser);
      setLocations(storeService.locations);
      setActiveLocId(storeService.activeLocationId);
      setNotifications(storeService.notifications);
    });
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value;
    storeService.setActiveLocation(locId);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e2e8f0] shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: App Identity & Active Location Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1b4332] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              TM
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                SAPI PAPI FARM
              </h1>
              <p className="text-[11px] text-[#1b4332] font-semibold">
                Sistem Peternakan Terpadu
              </p>
            </div>
          </div>

          {/* Location Picker with Professional Polish Pill Style */}
          {currentUser.role !== 'USER' && <div className="relative flex items-center ml-2 sm:ml-4">
            <Building2 className="w-3.5 h-3.5 text-[#1b4332] absolute left-3 pointer-events-none" />
            <select
              value={activeLocId}
              onChange={handleLocationChange}
              aria-label="Pilih Lokasi Peternakan"
              className="pl-8 pr-7 py-1 bg-[#d8f3dc] hover:bg-[#c7f0cc] text-[#1b4332] rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1b4332] transition cursor-pointer appearance-none border border-[#b7e4c7]"
            >
              <option value="ALL">📍 SEMUA LOKASI ({locations.length})</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  📍 {loc.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>}
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchInput}
              placeholder={currentUser.role === 'USER' ? 'Cari sapi, ras, Ear Tag, atau lokasi...' : 'Cari Ear Tag, Pembeli, No. Transaksi, Lokasi...'}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4332] transition"
            />
          </div>
        </div>

        {/* Right: Actions, AI Brief, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Quick Action (+ Button) */}
          {currentUser.role !== 'USER' && <button
            onClick={onOpenQuickAction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#d8f3dc]" />
            <span className="hidden sm:inline">+ Aksi Kandang</span>
          </button>}

          {/* Owner Daily Brief Gemini Button */}
          {currentUser.role === 'OWNER' && (
            <button
              onClick={onOpenOwnerBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d8f3dc] hover:bg-[#c7f0cc] text-[#1b4332] border border-[#b7e4c7] rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Owner Daily Brief Powered by Gemini AI"
            >
              <Sparkles className="w-4 h-4 text-[#1b4332] animate-pulse" />
              <span className="hidden md:inline">AI Daily Brief</span>
            </button>
          )}

          {/* Notification Center Bell */}
          {currentUser.role !== 'USER' && <button
            onClick={onOpenNotifications}
            aria-label="Pemberitahuan"
            className="relative p-2 text-slate-600 hover:text-[#1b4332] hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>}

          {/* Authenticated user profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#e2e8f0] text-slate-700 flex items-center justify-center text-xs font-bold">
                {currentUser.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.displayName}
                </p>
                <p className="text-[10px] font-bold text-[#1b4332] uppercase tracking-wider">
                  Role: {currentUser.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser.displayName}</p>
                  <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                </div>

                <div className="mx-3 my-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Hak akses: {currentUser.role}</span>
                </div>

                {(currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
                  <button
                    onClick={() => { setShowProfileDropdown(false); onOpenUsers(); }}
                    className="mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Users className="h-4 w-4" /> Manajemen Pengguna
                  </button>
                )}

                <div className="border-t border-slate-100 mt-2 pt-1 px-2">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      void onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar dari aplikasi
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

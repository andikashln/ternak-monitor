import React from 'react';
import {
  LayoutDashboard, Database, Scale, HeartPulse, Dna, Baby,
  ShoppingCart, Wheat, Wallet,
  FileSpreadsheet, FileText, History, Bell, Settings, ShieldCheck, Users
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

interface NavMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const menuItems: NavMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Owner',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'livestock',
      label: 'Database Ternak',
      icon: <Database className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'weight',
      label: 'Monitoring Bobot',
      icon: <Scale className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'health',
      label: 'Kesehatan & Obat',
      icon: <HeartPulse className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'breeding',
      label: 'Breeding & Reproduksi',
      icon: <Dna className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'births-deaths',
      label: 'Kelahiran & Kematian',
      icon: <Baby className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'transactions',
      label: 'POS & Katalog Ternak',
      icon: <ShoppingCart className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'feed',
      label: 'Manajemen Pakan',
      icon: <Wheat className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'finance',
      label: 'Keuangan & Laba Rugi',
      icon: <Wallet className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'daily-reports',
      label: 'Laporan Harian',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: 'UTAMA',
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'reports',
      label: 'Laporan & Export',
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'notifications',
      label: 'Notifikasi & Alert',
      icon: <Bell className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'users',
      label: 'Manajemen Pengguna',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'audit',
      label: 'Audit Log Sistem',
      icon: <History className="w-4 h-4" />,
      allowedRoles: ['OWNER']
    },
    {
      id: 'settings',
      label: 'Pengaturan Usaha',
      icon: <Settings className="w-4 h-4" />,
      allowedRoles: ['OWNER']
    }
  ];

  const filteredMenu = menuItems.filter(item => item.allowedRoles.includes(role));

  return (
    <aside className="w-60 bg-[#1b4332] text-white min-h-[calc(100vh-4rem)] hidden md:flex flex-col border-r border-white/10 shrink-0">
      
      {/* Brand Logo Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#1b4332] font-bold text-sm shadow-sm shrink-0">
          TM
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white block leading-none">
            SAPI PAPI FARM
          </span>
          <span className="text-[10px] text-[#d8f3dc] font-medium tracking-wide">
            Ternak Monitor
          </span>
        </div>
      </div>

      {/* Role Access Bar */}
      <div className="px-4 py-2.5 bg-black/15 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-1.5 text-white/80">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d8f3dc]" />
          <span className="text-[11px] font-medium">Akses Terotorisasi</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#d8f3dc]/20 text-[#d8f3dc] text-[10px] font-bold border border-[#d8f3dc]/30 uppercase">
          {role}
        </span>
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {filteredMenu.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-5 py-2.5 text-xs transition cursor-pointer text-left border-l-4 ${
                isActive
                  ? 'bg-white/10 border-[#d8f3dc] text-white font-semibold opacity-100'
                  : 'border-transparent text-white/75 hover:opacity-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#d8f3dc]' : 'text-white/60'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#f59e0b]/20 text-amber-300 border border-amber-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-white/10 text-[11px] text-white/50">
        <p className="font-semibold text-white/80">Role: {role}</p>
        <p className="text-[10px] text-[#d8f3dc]/70 mt-0.5">SAPI PAPI FARM v2.5</p>
      </div>

    </aside>
  );
};

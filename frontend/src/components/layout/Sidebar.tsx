import React from 'react';
import {
  LayoutDashboard, Database, HeartPulse, Dna, ShoppingCart, Wheat, FileText,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../../types';
import { SapiPapiLogo } from '../brand/SapiPapiLogo';

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
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const menuItems: NavMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
    { id: 'livestock', label: 'Ternak', icon: <Database className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
    { id: 'health', label: 'Kesehatan', icon: <HeartPulse className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
    { id: 'breeding', label: 'Reproduksi', icon: <Dna className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
    { id: 'transactions', label: 'Keuangan & Penjualan', icon: <ShoppingCart className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
    { id: 'feed', label: 'Pakan', icon: <Wheat className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
    { id: 'daily-reports', label: 'Laporan', icon: <FileText className="h-4 w-4" />, allowedRoles: ['OWNER', 'ADMIN'] },
  ];

  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-[#d7eadc] bg-[#f7fcf8] md:flex">
      <div className="border-b border-[#d7eadc] p-5">
        <SapiPapiLogo />
        <p className="mt-3 text-[11px] font-medium leading-relaxed text-slate-500">Pencatatan yang sederhana untuk operasional kandang setiap hari.</p>
      </div>
      <div className="mx-3 mt-4 flex items-center gap-2 rounded-xl bg-[#e7f5eb] px-3 py-2 text-[10px] font-bold text-[#174a3a]">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Akses {role}</span>
      </div>
      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 px-3 py-4">
        {menuItems.filter(item => item.allowedRoles.includes(role)).map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                isActive ? 'bg-[#174a3a] text-white shadow-sm' : 'text-slate-600 hover:bg-[#e7f5eb] hover:text-[#174a3a]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <p className="border-t border-[#d7eadc] px-5 py-4 text-[10px] font-medium text-slate-400">Sapi Papi Farm · v2.5</p>
    </aside>
  );
};

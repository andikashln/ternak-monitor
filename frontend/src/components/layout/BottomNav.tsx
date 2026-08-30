import React from 'react';
import { Database, LayoutDashboard, Plus, ReceiptText, Wallet } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: () => void;
}

const items = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'livestock', label: 'Ternak', icon: Database },
  { id: 'daily-reports', label: 'Laporan', icon: ReceiptText },
  { id: 'finance', label: 'Laba Rugi', icon: Wallet },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenQuickAction }) => (
  <nav aria-label="Navigasi cepat" className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 px-2 pt-1.5 shadow-[0_-12px_30px_rgba(15,50,38,0.1)] backdrop-blur-xl lg:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
      {items.slice(0, 2).map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-current={isActive ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition ${isActive ? 'text-emerald-900' : 'text-slate-400'}`}><span className={`rounded-lg p-1 ${isActive ? 'bg-emerald-100' : ''}`}><Icon className="h-5 w-5" /></span><span>{item.label}</span></button>;
      })}

      <button type="button" onClick={onOpenQuickAction} className="group flex min-h-14 flex-col items-center justify-end gap-1 text-[10px] font-black text-emerald-900" aria-label="Tambah catatan baru">
        <span className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-950/20 ring-4 ring-[#f5f8f5] transition active:scale-95"><Plus className="h-6 w-6" /></span>
        <span className="-mt-2">Tambah</span>
      </button>

      {items.slice(2).map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-current={isActive ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition ${isActive ? 'text-emerald-900' : 'text-slate-400'}`}><span className={`rounded-lg p-1 ${isActive ? 'bg-emerald-100' : ''}`}><Icon className="h-5 w-5" /></span><span>{item.label}</span></button>;
      })}
    </div>
  </nav>
);

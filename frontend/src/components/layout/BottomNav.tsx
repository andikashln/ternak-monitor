import React from 'react';
import {
  LayoutDashboard, Database, PlusCircle, Wallet, FileSpreadsheet
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-400 z-40 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around text-[10px] font-medium">
        
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('livestock')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'livestock' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span>Ternak</span>
        </button>

        {/* Center Big Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex flex-col items-center -mt-5 bg-emerald-700 text-white p-3 rounded-full shadow-lg border-2 border-slate-900 hover:bg-emerald-600 transition"
          aria-label="Aksi Kandang Cepat"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('daily-reports')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'daily-reports' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 mb-0.5" />
          <span>Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'finance' ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Keuangan</span>
        </button>

      </div>
    </div>
  );
};

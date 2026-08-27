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
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#d7eadc] bg-white text-slate-500 z-40 px-2 py-1.5 shadow-[0_-8px_24px_rgba(23,74,58,0.08)]">
      <div className="flex items-center justify-around text-[10px] font-medium">
        
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'dashboard' ? 'bg-[#e7f5eb] text-[#174a3a] font-bold' : 'hover:text-[#174a3a]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('livestock')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'livestock' ? 'bg-[#e7f5eb] text-[#174a3a] font-bold' : 'hover:text-[#174a3a]'
          }`}
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span>Ternak</span>
        </button>

        {/* Center Big Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex flex-col items-center -mt-5 bg-[#174a3a] text-white p-3 rounded-full shadow-lg border-4 border-[#f5fbf7] hover:bg-[#123d30] transition"
          aria-label="Aksi Kandang Cepat"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('daily-reports')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'daily-reports' ? 'bg-[#e7f5eb] text-[#174a3a] font-bold' : 'hover:text-[#174a3a]'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 mb-0.5" />
          <span>Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'finance' ? 'bg-[#e7f5eb] text-[#174a3a] font-bold' : 'hover:text-[#174a3a]'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Keuangan</span>
        </button>

      </div>
    </div>
  );
};

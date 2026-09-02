import React from 'react';
import {
  X, FileSpreadsheet, Scale, HeartPulse, Baby, Skull,
  PlusCircle, Wallet
} from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'add-daily-report',
      label: '+ LAPORAN HARIAN',
      desc: 'Input laporan populasi, aktivitas, & biaya harian kandang',
      color: 'bg-#4A2C1D text-white border-#5A2D1F hover:bg-#5A2D1F',
      icon: <FileSpreadsheet className="w-6 h-6 text-amber-400" />
    },
    {
      id: 'add-weight',
      label: '+ TIMBANG BOBOT',
      desc: 'Catat timbangan bobot ternak rutin',
      color: 'bg-#FBF8F2 text-#4A2C1D border-#EFE5D5 hover:bg-#F5EFE6',
      icon: <Scale className="w-6 h-6 text-#5A2D1F" />
    },
    {
      id: 'add-health',
      label: '+ LAPOR KESEHATAN',
      desc: 'Catat ternak sakit, obat, & penanganan medis',
      color: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100',
      icon: <HeartPulse className="w-6 h-6 text-rose-600" />
    },
    {
      id: 'add-birth',
      label: '+ LAPOR KELAHIRAN',
      desc: 'Catat anak ternak baru lahir & hubungkan ke induk',
      color: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
      icon: <Baby className="w-6 h-6 text-amber-600" />
    },
    {
      id: 'add-death',
      label: '+ LAPOR KEMATIAN',
      desc: 'Dokumentasikan kematian ternak secara resmi',
      color: 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200',
      icon: <Skull className="w-6 h-6 text-slate-700" />
    },
    {
      id: 'add-finance',
      label: '+ TRANSAKSI BIAYA/PEMASUKAN',
      desc: 'Catat pemasukan atau pengeluaran operasional',
      color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
      icon: <Wallet className="w-6 h-6 text-blue-600" />
    },
    {
      id: 'add-livestock',
      label: '+ TERNAK BARU',
      desc: 'Daftarkan ternak baru masuk kandang',
      color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100',
      icon: <PlusCircle className="w-6 h-6 text-purple-600" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-#4A2C1D text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Aksi Cepat Petugas Kandang</h3>
            <p className="text-xs text-#EFE5D5">Pilih tindakan operasional untuk diinput</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-#EFE5D5 hover:text-white hover:bg-#5A2D1F rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-4 space-y-2.5 overflow-y-auto">
          {actions.map(act => (
            <button
              key={act.id}
              onClick={() => {
                onSelectAction(act.id);
                onClose();
              }}
              className={`w-full p-3.5 rounded-xl border flex items-center gap-3.5 text-left transition transform active:scale-[0.99] cursor-pointer ${act.color}`}
            >
              <div className="p-2 rounded-lg bg-white/80 shadow-2xs shrink-0">
                {act.icon}
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight">{act.label}</p>
                <p className="text-[11px] opacity-80 leading-tight">{act.desc}</p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

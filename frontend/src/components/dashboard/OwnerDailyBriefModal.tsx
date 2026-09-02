import React, { useState, useEffect } from 'react';
import { Sparkles, X, RefreshCw, Copy, Check, FileText } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { aiAPI } from '../../services/api';

interface OwnerDailyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerDailyBriefModal: React.FC<OwnerDailyBriefModalProps> = ({ isOpen, onClose }) => {
  const [briefText, setBriefText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDailyBrief = async () => {
    setLoading(true);
    setErrorMsg(null);

    const metrics = storeService.getDashboardMetrics();
    const activeLocId = storeService.activeLocationId;
    const loc = storeService.locations.find(l => l.id === activeLocId);
    const locationName = activeLocId === 'ALL' ? 'Semua Lokasi Peternakan' : (loc ? loc.name : 'Lokasi Peternakan');
    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    try {
      const response = await aiAPI.createOwnerDailyBrief({ metrics, locationName, dateStr });
      setBriefText(response.data.summary);
    } catch (err: any) {
      console.error("Gemini API Brief Error:", err);
      setErrorMsg(err.response?.data?.error || err.message || 'Gagal terhubung ke Gemini AI Brief Server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !briefText) {
      fetchDailyBrief();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (briefText) {
      navigator.clipboard.writeText(briefText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#5A2D1F] to-[#2d6a4f] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-[#95d5b2]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="ai-title-polish mb-0.5">
                <span>Owner Daily Brief (AI)</span>
              </div>
              <h3 className="text-base font-bold leading-tight">Ringkasan Eksekutif Peternakan</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#EFE5D5] hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm leading-relaxed">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-#5A2D1F animate-spin mx-auto" />
              <p className="font-semibold text-slate-700">Menghasilkan Ringkasan Eksekutif Gemini AI...</p>
              <p className="text-xs text-slate-400">Menganalisis data populasi, kesehatan, dan transaksi keuangan saat ini.</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <p className="font-bold text-xs uppercase tracking-wide">Pemberitahuan Sistem AI:</p>
              <p className="text-xs">{errorMsg}</p>
              <button
                onClick={fetchDailyBrief}
                className="mt-2 px-3 py-1.5 bg-amber-800 text-white text-xs font-semibold rounded-lg hover:bg-amber-900 transition cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  📅 Tanggal Ringkasan: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-[10px] bg-#F5EFE6 text-#5A2D1F px-2 py-0.5 rounded font-bold">
                  VERIFIED AI BRIEF
                </span>
              </div>

              <div className="bg-#FBF8F2/40 p-4 rounded-xl border border-#F5EFE6 text-slate-800 whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                {briefText}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={fetchDailyBrief}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate AI Brief</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!briefText || loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-#7A4A30" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Text'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-#4A2C1D rounded-lg hover:bg-#5A2D1F transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

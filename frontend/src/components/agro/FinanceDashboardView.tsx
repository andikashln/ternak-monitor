import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Scale, TrendingUp, Wallet } from 'lucide-react';
import { agroStore } from '../../services/agroStore';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { AgroHeader, AgroCard, AgroStat, StatusBadge } from './AgroUI';

// Dashboard keuangan: ringkasan arus kas + transaksi & approval terbaru.
export const FinanceDashboardView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const txs = state.cashTransactions;
  const totalMasuk = txs.filter(t => t.type === 'Masuk').reduce((s, t) => s + t.amount, 0);
  const totalKeluar = txs.filter(t => t.type === 'Keluar').reduce((s, t) => s + t.amount, 0);
  const saldo = totalMasuk - totalKeluar;

  const recentTxs = [...txs].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 6);
  const recentApprovals = [...state.approvals].sort((a, b) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? '')).slice(0, 5);

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Finance Control"
        title="Dashboard Keuangan"
        subtitle="Ringkasan arus kas, saldo, dan aktivitas persetujuan terkini Sapi Papi Farm."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AgroStat label="Total Kas Masuk" value={formatRupiah(totalMasuk)} hint={`${txs.filter(t => t.type === 'Masuk').length} transaksi`} />
        <AgroStat label="Total Kas Keluar" value={formatRupiah(totalKeluar)} hint={`${txs.filter(t => t.type === 'Keluar').length} transaksi`} />
        <AgroStat label="Saldo Kas" value={formatRupiah(saldo)} accent />
        <AgroStat label="Laba Bersih" value={formatRupiah(saldo)} hint="Pendapatan - Pengeluaran" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AgroCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Transaksi Kas Terbaru</h3>
            <Wallet className="h-4 w-4 text-[#5a2d1f]" />
          </div>
          <div className="space-y-2">
            {recentTxs.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {t.type === 'Masuk'
                    ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                    : <ArrowUpCircle className="h-4 w-4 text-rose-600" />}
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t.description}</p>
                    <p className="text-[10px] text-slate-500">{t.referenceNo} · {formatDateTime(t.createdAt)}</p>
                  </div>
                </div>
                <p className={`text-sm font-black ${t.type === 'Masuk' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {t.type === 'Masuk' ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
              </div>
            ))}
            {recentTxs.length === 0 && <p className="text-xs text-slate-400">Belum ada transaksi.</p>}
          </div>
        </AgroCard>

        <AgroCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Persetujuan Terbaru</h3>
            <Scale className="h-4 w-4 text-[#5a2d1f]" />
          </div>
          <div className="space-y-2">
            {recentApprovals.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-800">{a.title}</p>
                  <p className="text-[10px] text-slate-500">{a.type} · {a.requester}</p>
                </div>
                <StatusBadge value={a.status} tone={a.status === 'Disetujui' ? 'green' : a.status === 'Ditolak' ? 'red' : 'amber'} />
              </div>
            ))}
            {recentApprovals.length === 0 && <p className="text-xs text-slate-400">Belum ada pengajuan.</p>}
          </div>
        </AgroCard>
      </div>

      <AgroCard>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#5a2d1f]" />
          <h3 className="text-sm font-black text-slate-900">Ringkasan Per Divisi</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from(new Set(txs.map(t => t.sourceDivision))).map(div => {
            const divTxs = txs.filter(t => t.sourceDivision === div);
            const masuk = divTxs.filter(t => t.type === 'Masuk').reduce((s, t) => s + t.amount, 0);
            const keluar = divTxs.filter(t => t.type === 'Keluar').reduce((s, t) => s + t.amount, 0);
            return (
              <div key={div} className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-black text-[#5a2d1f]">{div}</p>
                <p className="mt-1 text-sm font-bold text-emerald-700">+{formatRupiah(masuk)}</p>
                <p className="text-sm font-bold text-rose-700">-{formatRupiah(keluar)}</p>
              </div>
            );
          })}
          {txs.length === 0 && <p className="text-xs text-slate-400">Belum ada data.</p>}
        </div>
      </AgroCard>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { BadgeDollarSign, CalendarDays, ReceiptText, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { SalesRecord } from '../../types';
import { formatDate, formatRupiah } from '../../utils/formatters';

export const SalesResultsView: React.FC = () => {
  const [salesRecords, setSalesRecords] = useState(storeService.salesRecords);
  const [financialTransactions, setFinancialTransactions] = useState(storeService.financialTransactions);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => storeService.subscribe(() => {
    setSalesRecords(storeService.salesRecords);
    setFinancialTransactions(storeService.financialTransactions);
  }), []);

  const acquisitionCostFor = (sale: SalesRecord) => sale.acquisitionCostTotal
    ?? financialTransactions.find(transaction =>
      transaction.invoiceNo === sale.invoiceNo
      && transaction.type === 'expense'
      && transaction.category === 'Pembelian Ternak'
      && transaction.description.startsWith('Harga beli/HPP ternak terjual')
    )?.amount
    ?? 0;

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const periodSales = salesRecords
    .filter(sale => sale.date.startsWith(selectedPeriod))
    .filter(sale => !normalizedSearch
      || sale.invoiceNo.toLowerCase().includes(normalizedSearch)
      || sale.buyerName.toLowerCase().includes(normalizedSearch))
    .sort((a, b) => b.date.localeCompare(a.date));

  const summary = periodSales.reduce((result, sale) => {
    const hpp = acquisitionCostFor(sale);
    result.soldCount += sale.livestockIds.length;
    result.revenue += sale.priceTotal;
    result.hpp += hpp;
    result.netProfit += sale.priceTotal - hpp;
    return result;
  }, { soldCount: 0, revenue: 0, hpp: 0, netProfit: 0 });

  const periodLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${selectedPeriod}-01T00:00:00Z`));

  return (
    <div className="space-y-4 pb-24 animate-fade-in md:pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><BadgeDollarSign className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-black tracking-tight text-slate-950">Hasil Penjualan</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Pantau omzet, HPP, dan laba bersih setiap invoice ternak.</p></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(13rem,1fr)_auto]">
            <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Cari invoice atau pembeli..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" /></label>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><CalendarDays className="h-4 w-4 text-emerald-700" /><input type="month" value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value || new Date().toISOString().slice(0, 7))} className="bg-transparent text-xs font-bold text-slate-800 outline-none" aria-label="Pilih periode hasil penjualan" /></label>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Ternak Terjual', value: summary.soldCount, displayValue: `${summary.soldCount} ekor`, icon: BadgeDollarSign, tone: 'bg-violet-50 text-violet-800' },
          { label: 'Total Penjualan', value: summary.revenue, icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-800' },
          { label: 'Total HPP', value: summary.hpp, icon: ReceiptText, tone: 'bg-amber-50 text-amber-800' },
          { label: 'Laba Bersih', value: summary.netProfit, icon: summary.netProfit >= 0 ? TrendingUp : TrendingDown, tone: summary.netProfit >= 0 ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-700' },
        ].map(metric => {
          const Icon = metric.icon;
          return <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:p-4"><div className="flex items-start justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">{metric.label}</span><span className={`rounded-lg p-1.5 ${metric.tone}`}><Icon className="h-4 w-4" /></span></div><strong className={`mt-3 block break-all font-mono text-sm font-black sm:text-lg ${metric.label === 'Laba Bersih' && metric.value < 0 ? 'text-rose-700' : 'text-slate-950'}`}>{metric.displayValue ?? formatRupiah(metric.value)}</strong></article>;
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Rincian per invoice</p><h3 className="mt-1 text-sm font-black capitalize text-slate-950">Periode {periodLabel}</h3></div><span className="text-[10px] font-bold text-slate-500">{periodSales.length} transaksi</span></div>
        {periodSales.map(sale => {
          const hpp = acquisitionCostFor(sale);
          const netProfit = sale.priceTotal - hpp;
          const margin = sale.priceTotal > 0 ? (netProfit / sale.priceTotal) * 100 : 0;
          return (
            <article key={sale.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <div className="border-b border-slate-100 bg-slate-50/70 p-4"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-black text-slate-950">{sale.invoiceNo}</span><span className={`rounded-full px-2 py-1 text-[9px] font-black ${sale.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : sale.paymentStatus === 'DP' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>{sale.paymentStatus}</span></div><p className="mt-1 text-[10px] text-slate-500">{formatDate(sale.date)} · {sale.buyerName} · {sale.livestockIds.length} ekor</p></div>
              <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3">
                {[
                  ['Penjualan', sale.priceTotal, 'text-emerald-800'],
                  ['HPP', hpp, 'text-amber-800'],
                  ['Laba Bersih', netProfit, netProfit >= 0 ? 'text-emerald-900' : 'text-rose-700'],
                ].map(([label, value, color]) => <div key={String(label)} className="bg-white p-3.5"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className={`mt-1.5 block font-mono text-xs font-black ${color}`}>{formatRupiah(Number(value))}</strong>{label === 'Laba Bersih' && <span className="mt-1 block text-[9px] font-bold text-slate-400">Margin {margin.toFixed(1)}%</span>}</div>)}
              </div>
            </article>
          );
        })}
        {periodSales.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><BadgeDollarSign className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">Belum ada hasil penjualan</p><p className="mt-1 text-xs text-slate-400">Tidak ada invoice yang sesuai dengan periode atau pencarian ini.</p></div>}
      </section>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { DailyReport, DailyReportExpense } from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

interface Draft {
  date: string; locationId: string; locationName: string;
  popInitial: string; popPurchase: string; popBirth: string; popTransferIn: string;
  popSales: string; popDeath: string; popTransferOut: string;
  healthyCount: string; sickCount: string; isolationCount: string; inTreatmentCount: string;
  activitiesText: string; expenseCategory: string; expenseAmount: string; expenseDesc: string;
}

const emptyDraft = (): Draft => ({
  date: new Date().toISOString().slice(0, 10), locationId: '', locationName: '',
  popInitial: '', popPurchase: '0', popBirth: '0', popTransferIn: '0',
  popSales: '0', popDeath: '0', popTransferOut: '0',
  healthyCount: '', sickCount: '0', isolationCount: '0', inTreatmentCount: '0',
  activitiesText: '', expenseCategory: 'Pakan', expenseAmount: '', expenseDesc: '',
});

export const DailyReportView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const reports = useMemo(() => storeService.dailyReports, [version]);
  useEffect(() => storeService.subscribe(() => setVersion(v => v + 1)), []);

  const locations = storeService.locations;
  const currentUser = storeService.currentUser;
  const setField = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));

  const filtered = reports.filter(r =>
    !r.archivedAt &&
    (statusFilter === 'Semua' || r.reportStatus === statusFilter) &&
    (r.locationName + r.createdBy + r.date).toLowerCase().includes(search.toLowerCase()));

  const toneFor = (status: string) => status === 'Disetujui' ? 'green' : status === 'Dikirim' ? 'blue' : status === 'Revisi' ? 'red' : status === 'Diperiksa' ? 'violet' : 'slate';

  const openAdd = () => {
    const loc = locations[0];
    setDraft({ ...emptyDraft(), locationId: loc?.id ?? '', locationName: loc?.name ?? '' });
    setShowForm(true);
  };

  const save = () => {
    const expensesList: DailyReportExpense[] = draft.expenseAmount && Number(draft.expenseAmount) > 0
      ? [{ category: draft.expenseCategory, amount: Number(draft.expenseAmount) || 0, description: draft.expenseDesc || '-', hasProof: false }]
      : [];
    storeService.addDailyReport({
      date: draft.date, locationId: draft.locationId, locationName: draft.locationName,
      popInitial: Number(draft.popInitial) || 0, popPurchase: Number(draft.popPurchase) || 0,
      popBirth: Number(draft.popBirth) || 0, popTransferIn: Number(draft.popTransferIn) || 0,
      popSales: Number(draft.popSales) || 0, popDeath: Number(draft.popDeath) || 0,
      popTransferOut: Number(draft.popTransferOut) || 0,
      healthyCount: Number(draft.healthyCount) || 0, sickCount: Number(draft.sickCount) || 0,
      isolationCount: Number(draft.isolationCount) || 0, inTreatmentCount: Number(draft.inTreatmentCount) || 0,
      activitiesText: draft.activitiesText, expensesList, photos: [],
      reportStatus: 'Draft', createdBy: currentUser.displayName,
    });
    setShowForm(false);
  };

  const rows = filtered.map(r => {
    const totalExpense = r.expensesList.reduce((s, e) => s + e.amount, 0);
    return (
      <tr key={r.id}>
        <td className="px-4 py-3 font-semibold text-slate-800">{formatDate(r.date).split(',')[0]}</td>
        <td className="px-4 py-3 text-slate-600">{r.locationName}</td>
        <td className="px-4 py-3 font-semibold">{r.popInitial} → {r.popFinal}</td>
        <td className="px-4 py-3 text-slate-600">{r.healthyCount} / {r.sickCount} sakit</td>
        <td className="px-4 py-3 text-slate-600">{formatRupiah(totalExpense)}</td>
        <td className="px-4 py-3 text-slate-600">{r.createdBy}</td>
        <td className="px-4 py-3"><StatusBadge value={r.reportStatus} tone={toneFor(r.reportStatus)} /></td>
      </tr>
    );
  });

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Report & System"
        title="Laporan Harian"
        subtitle="Rekap populasi ternak, kesehatan, aktivitas, dan pengeluaran harian per lokasi."
        actions={<AddButton onClick={openAdd} label="Buat Laporan" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Total Laporan" value={String(reports.filter(r => !r.archivedAt).length)} hint="Aktif" />
        <AgroStat label="Dikirim" value={String(reports.filter(r => r.reportStatus === 'Dikirim').length)} hint="Menunggu review" accent />
        <AgroStat label="Disetujui" value={String(reports.filter(r => r.reportStatus === 'Disetujui').length)} hint="Terverifikasi" />
        <AgroStat label="Revisi" value={String(reports.filter(r => r.reportStatus === 'Revisi').length)} hint="Perlu perbaikan" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari lokasi / pembuat / tanggal..." /></div>
        <AgroSelect label="" value={statusFilter} onChange={setStatusFilter} options={['Semua', 'Draft', 'Dikirim', 'Diperiksa', 'Disetujui', 'Revisi']} />
      </div>

      {filtered.length === 0 ? <AgroEmpty text="Belum ada laporan harian." /> : (
        <AgroTable headers={['Tanggal', 'Lokasi', 'Populasi', 'Kesehatan', 'Pengeluaran', 'Pembuat', 'Status']}>{rows}</AgroTable>
      )}

      {showForm && (
        <AgroModal title="Buat Laporan Harian" onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setField({ date: v })} />
            <AgroSelect label="Lokasi" value={draft.locationName} onChange={v => { const loc = locations.find(l => l.name === v); setField({ locationName: v, locationId: loc?.id ?? '' }); }} options={locations.map(l => l.name)} />
          </div>
          <AgroCard className="border-[#d2ad76]/50 bg-[#f9ebcc]/40">
            <p className="text-xs font-black text-[#5a2d1f]">Saldo Populasi</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <AgroField label="Populasi Awal" type="number" value={draft.popInitial} onChange={v => setField({ popInitial: v })} />
              <AgroField label="Pembelian" type="number" value={draft.popPurchase} onChange={v => setField({ popPurchase: v })} />
              <AgroField label="Kelahiran" type="number" value={draft.popBirth} onChange={v => setField({ popBirth: v })} />
              <AgroField label="Transfer Masuk" type="number" value={draft.popTransferIn} onChange={v => setField({ popTransferIn: v })} />
              <AgroField label="Penjualan" type="number" value={draft.popSales} onChange={v => setField({ popSales: v })} />
              <AgroField label="Kematian" type="number" value={draft.popDeath} onChange={v => setField({ popDeath: v })} />
              <AgroField label="Transfer Keluar" type="number" value={draft.popTransferOut} onChange={v => setField({ popTransferOut: v })} />
            </div>
          </AgroCard>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Sehat" type="number" value={draft.healthyCount} onChange={v => setField({ healthyCount: v })} />
            <AgroField label="Sakit" type="number" value={draft.sickCount} onChange={v => setField({ sickCount: v })} />
            <AgroField label="Isolasi" type="number" value={draft.isolationCount} onChange={v => setField({ isolationCount: v })} />
            <AgroField label="Dalam Perawatan" type="number" value={draft.inTreatmentCount} onChange={v => setField({ inTreatmentCount: v })} />
          </div>
          <AgroField label="Catatan Aktivitas" value={draft.activitiesText} onChange={v => setField({ activitiesText: v })} placeholder="Ringkasan kegiatan harian..." />
          <AgroCard className="border-slate-200">
            <p className="text-xs font-black text-slate-600">Pengeluaran (opsional)</p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <AgroSelect label="Kategori" value={draft.expenseCategory} onChange={v => setField({ expenseCategory: v })} options={storeService.settings.expenseCategories} />
              <AgroField label="Nominal" type="number" value={draft.expenseAmount} onChange={v => setField({ expenseAmount: v })} />
              <AgroField label="Keterangan" value={draft.expenseDesc} onChange={v => setField({ expenseDesc: v })} />
            </div>
          </AgroCard>
          <AgroButton onClick={save} className="w-full justify-center">Simpan Laporan</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

export default DailyReportView;

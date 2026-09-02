import React, { useEffect, useMemo, useState } from 'react';
import { Fish, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { FishHarvestRecord } from '../../types';
import { formatDate, formatRupiah } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton, ExportButtons,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

interface HarvestDraft {
  pondId: string;
  pondName: string;
  harvestDate: string;
  totalWeightKg: string;
  totalFishCount: string;
  averageWeightKg: string;
  buyerName: string;
  pricePerKg: string;
  totalRevenue: string;
  notes: string;
}

const emptyDraft = (pondName = ''): HarvestDraft => ({
  pondId: '', pondName, harvestDate: today(), totalWeightKg: '', totalFishCount: '',
  averageWeightKg: '', buyerName: '', pricePerKg: '', totalRevenue: '', notes: '',
});

export const FishHarvestView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HarvestDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const ponds = state.ponds;
  const harvests = state.fishHarvests;
  const filtered = harvests.filter(h =>
    (h.pondName + ' ' + h.buyerName).toLowerCase().includes(search.toLowerCase()),
  );

  const totalRevenue = harvests.reduce((sum, h) => sum + h.totalRevenue, 0);
  const totalWeight = harvests.reduce((sum, h) => sum + h.totalWeightKg, 0);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft(ponds[0]?.name ?? ''));
    setShowForm(true);
  };
  const openEdit = (h: FishHarvestRecord) => {
    setEditingId(h.id);
    setDraft({
      pondId: h.pondId, pondName: h.pondName, harvestDate: h.harvestDate,
      totalWeightKg: String(h.totalWeightKg), totalFishCount: String(h.totalFishCount),
      averageWeightKg: String(h.averageWeightKg), buyerName: h.buyerName,
      pricePerKg: String(h.pricePerKg), totalRevenue: String(h.totalRevenue), notes: h.notes ?? '',
    });
    setShowForm(true);
  };

  const pickPond = (name: string) => {
    const pond = ponds.find(p => p.name === name);
    setDraft({ ...draft, pondName: name, pondId: pond?.id ?? '' });
  };

  const onWeightCountChange = (field: 'totalWeightKg' | 'totalFishCount' | 'pricePerKg', value: string) => {
    const next = { ...draft, [field]: value };
    const weight = Number(next.totalWeightKg) || 0;
    const count = Number(next.totalFishCount) || 0;
    next.averageWeightKg = count > 0 ? (weight / count).toFixed(3) : '';
    next.totalRevenue = String(Math.round(weight * (Number(next.pricePerKg) || 0)));
    setDraft(next);
  };

  const save = () => {
    if (!draft.pondName.trim()) return;
    const now = new Date().toISOString();
    const base = {
      pondId: draft.pondId,
      pondName: draft.pondName,
      harvestDate: draft.harvestDate,
      totalWeightKg: Number(draft.totalWeightKg) || 0,
      totalFishCount: Number(draft.totalFishCount) || 0,
      averageWeightKg: Number(draft.averageWeightKg) || 0,
      buyerName: draft.buyerName.trim(),
      pricePerKg: Number(draft.pricePerKg) || 0,
      totalRevenue: Number(draft.totalRevenue) || 0,
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('fishHarvests', editingId, base);
    } else {
      agroStore.add('fishHarvests', { ...base, id: makeId('fh'), createdAt: now } as FishHarvestRecord);
    }
    setShowForm(false);
  };

  const exportData = filtered.map(h => ({
    Kolam: h.pondName, 'Tanggal Panen': h.harvestDate, 'Berat (kg)': h.totalWeightKg,
    'Jumlah Ekor': h.totalFishCount, 'Berat Rata-rata (kg)': h.averageWeightKg,
    Pembeli: h.buyerName, 'Harga/kg': h.pricePerKg, 'Total Pendapatan': h.totalRevenue,
  }));
  const exportRows = filtered.map(h => [
    h.pondName, h.harvestDate, String(h.totalWeightKg), String(h.totalFishCount),
    String(h.averageWeightKg), h.buyerName, formatRupiah(h.pricePerKg), formatRupiah(h.totalRevenue),
  ]);

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Perikanan & Bioflok"
        title="Panen & Penjualan Ikan"
        subtitle="Rekap hasil panen, pembeli, dan total pendapatan per kolam."
        actions={<AddButton onClick={openCreate} label="Catat Panen" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Total Pendapatan" value={formatRupiah(totalRevenue)} hint="Akumulasi seluruh panen" accent />
        <AgroStat label="Total Berat Panen" value={`${totalWeight.toLocaleString('id-ID')} kg`} hint="Berat total ikan terjual" />
        <AgroStat label="Jumlah Panen" value={String(harvests.length)} hint="Transaksi panen tercatat" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari kolam / pembeli..." /></div>
        <ExportButtons title="Panen & Penjualan Ikan" headers={['Kolam', 'Tanggal', 'Berat (kg)', 'Ekor', 'Rata-rata (kg)', 'Pembeli', 'Harga/kg', 'Pendapatan']} rows={exportRows} data={exportData} filename="panen-ikan" />
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada data panen." />
      ) : (
        <AgroTable headers={['Kolam', 'Tanggal', 'Berat (kg)', 'Jumlah Ekor', 'Rata-rata (kg)', 'Pembeli', 'Harga/kg', 'Total Pendapatan', 'Aksi']}>
          {filtered.map(h => (
            <tr key={h.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black text-slate-800">{h.pondName}</td>
              <td className="px-4 py-3 text-xs">{formatDate(h.harvestDate)}</td>
              <td className="px-4 py-3 text-xs">{h.totalWeightKg.toLocaleString('id-ID')}</td>
              <td className="px-4 py-3 text-xs">{h.totalFishCount.toLocaleString('id-ID')}</td>
              <td className="px-4 py-3 text-xs">{h.averageWeightKg}</td>
              <td className="px-4 py-3 text-xs">{h.buyerName}</td>
              <td className="px-4 py-3 text-xs">{formatRupiah(h.pricePerKg)}</td>
              <td className="px-4 py-3 font-black text-#5A2D1F">{formatRupiah(h.totalRevenue)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => agroStore.remove('fishHarvests', h.id)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}
    </div>
  );
};

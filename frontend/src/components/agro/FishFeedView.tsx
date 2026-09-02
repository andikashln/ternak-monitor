import React, { useEffect, useMemo, useState } from 'react';
import { FishSymbol, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { FishFeedLog } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

interface FeedDraft {
  pondId: string;
  pondName: string;
  date: string;
  feedType: string;
  feedAmountKg: string;
  biomassKg: string;
  fcr: string;
  officerName: string;
  notes: string;
}

const emptyDraft = (pondName = ''): FeedDraft => ({
  pondId: '', pondName, date: today(), feedType: 'Pelet Apung', feedAmountKg: '',
  biomassKg: '', fcr: '', officerName: '', notes: '',
});

const hitungFcr = (feedKg: number, biomassKg: number): string =>
  biomassKg > 0 ? (feedKg / biomassKg).toFixed(2) : '';

export const FishFeedView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FeedDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const ponds = state.ponds;
  const feeds = state.fishFeeds;
  const filtered = feeds.filter(f =>
    (f.pondName + ' ' + f.feedType + ' ' + f.officerName).toLowerCase().includes(search.toLowerCase()),
  );

  const totalPakan = feeds.reduce((sum, f) => sum + f.feedAmountKg, 0);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft(ponds[0]?.name ?? ''));
    setShowForm(true);
  };
  const openEdit = (f: FishFeedLog) => {
    setEditingId(f.id);
    setDraft({
      pondId: f.pondId, pondName: f.pondName, date: f.date, feedType: f.feedType,
      feedAmountKg: String(f.feedAmountKg), biomassKg: String(f.biomassKg),
      fcr: f.fcr != null ? String(f.fcr) : '', officerName: f.officerName, notes: f.notes ?? '',
    });
    setShowForm(true);
  };

  const pickPond = (name: string) => {
    const pond = ponds.find(p => p.name === name);
    setDraft({ ...draft, pondName: name, pondId: pond?.id ?? '' });
  };

  // Auto-hitung FCR bila kolom pakan/biomassa berubah dan FCR belum diedit manual.
  const onAmountChange = (field: 'feedAmountKg' | 'biomassKg', value: string) => {
    const next = { ...draft, [field]: value };
    next.fcr = hitungFcr(Number(next.feedAmountKg) || 0, Number(next.biomassKg) || 0);
    setDraft(next);
  };

  const save = () => {
    if (!draft.pondName.trim()) return;
    const now = new Date().toISOString();
    const base = {
      pondId: draft.pondId,
      pondName: draft.pondName,
      date: draft.date,
      feedType: draft.feedType.trim(),
      feedAmountKg: Number(draft.feedAmountKg) || 0,
      biomassKg: Number(draft.biomassKg) || 0,
      fcr: draft.fcr !== '' ? Number(draft.fcr) : undefined,
      officerName: draft.officerName.trim(),
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('fishFeeds', editingId, base);
    } else {
      agroStore.add('fishFeeds', { ...base, id: makeId('ff'), createdAt: now } as FishFeedLog);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Perikanan & Bioflok"
        title="Log Pakan & FCR"
        subtitle="Catat pemberian pakan dan pantau efisiensi pakan (FCR) per kolam."
        actions={<AddButton onClick={openCreate} label="Catat Pakan" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Total Catatan Pakan" value={String(feeds.length)} hint="Seluruh log pemberian pakan" accent />
        <AgroStat label="Total Pakan Terpakai" value={`${totalPakan.toLocaleString('id-ID')} kg`} hint="Akumulasi pakan diberikan" />
        <AgroStat label="Rata-rata FCR" value={feeds.length ? (feeds.reduce((s, f) => s + (f.fcr ?? 0), 0) / feeds.length).toFixed(2) : '-'} hint="Lebih rendah lebih baik" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari kolam / jenis pakan..." /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada data pakan." />
      ) : (
        <AgroTable headers={['Kolam', 'Tanggal', 'Jenis Pakan', 'Pakan (kg)', 'Biomassa (kg)', 'FCR', 'Petugas', 'Aksi']}>
          {filtered.map(f => (
            <tr key={f.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black text-slate-800">{f.pondName}</td>
              <td className="px-4 py-3 text-xs">{formatDate(f.date)}</td>
              <td className="px-4 py-3 text-xs">{f.feedType}</td>
              <td className="px-4 py-3 text-xs">{f.feedAmountKg.toLocaleString('id-ID')} kg</td>
              <td className="px-4 py-3 text-xs">{f.biomassKg.toLocaleString('id-ID')} kg</td>
              <td className="px-4 py-3">
                <StatusBadge value={f.fcr != null ? f.fcr.toFixed(2) : '-'} tone={f.fcr != null && f.fcr <= 1.8 ? 'green' : f.fcr != null && f.fcr <= 2.2 ? 'amber' : 'red'} />
              </td>
              <td className="px-4 py-3 text-xs">{f.officerName}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => agroStore.remove('fishFeeds', f.id)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Log Pakan' : 'Catat Pakan Baru'} onClose={() => setShowForm(false)}>
          <AgroSelect label="Kolam" value={draft.pondName} onChange={pickPond} options={ponds.map(p => p.name)} />
          <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} />
          <AgroField label="Jenis Pakan" value={draft.feedType} onChange={v => setDraft({ ...draft, feedType: v })} placeholder="cth. Pelet Apung" />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Pakan (kg)" type="number" value={draft.feedAmountKg} onChange={v => onAmountChange('feedAmountKg', v)} />
            <AgroField label="Biomassa (kg)" type="number" value={draft.biomassKg} onChange={v => onAmountChange('biomassKg', v)} />
          </div>
          <AgroField label="FCR (otomatis)" value={draft.fcr} onChange={v => setDraft({ ...draft, fcr: v })} placeholder="Terhitung otomatis, bisa diedit" />
          <AgroField label="Petugas" value={draft.officerName} onChange={v => setDraft({ ...draft, officerName: v })} placeholder="Nama petugas" />
          <AgroField label="Catatan" value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Opsional" />
          <AgroButton onClick={save} className="w-full justify-center"><FishSymbol className="h-4 w-4" />Simpan</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

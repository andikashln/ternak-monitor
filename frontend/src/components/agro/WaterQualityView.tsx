import React, { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { WaterQualityRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

interface WQDraft {
  pondId: string;
  pondName: string;
  date: string;
  ph: string;
  dissolvedOxygen: string;
  temperature: string;
  ammonia: string;
  nitrite: string;
  officerName: string;
  notes: string;
}

const emptyDraft = (pondName = ''): WQDraft => ({
  pondId: '', pondName, date: today(), ph: '', dissolvedOxygen: '', temperature: '',
  ammonia: '', nitrite: '', officerName: '', notes: '',
});

const isPhSafe = (ph: number) => ph >= 6.5 && ph <= 8.5;

export const WaterQualityView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WQDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const ponds = state.ponds;
  const records = state.waterQuality;
  const filtered = records.filter(r =>
    (r.pondName + ' ' + r.officerName).toLowerCase().includes(search.toLowerCase()),
  );

  const doRendah = records.filter(r => (r.dissolvedOxygen ?? 0) < 5).length;
  const phTidakAman = records.filter(r => !isPhSafe(r.ph)).length;

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft(ponds[0]?.name ?? ''));
    setShowForm(true);
  };
  const openEdit = (r: WaterQualityRecord) => {
    setEditingId(r.id);
    setDraft({
      pondId: r.pondId, pondName: r.pondName, date: r.date, ph: String(r.ph),
      dissolvedOxygen: String(r.dissolvedOxygen), temperature: String(r.temperature),
      ammonia: r.ammonia != null ? String(r.ammonia) : '', nitrite: r.nitrite != null ? String(r.nitrite) : '',
      officerName: r.officerName, notes: r.notes ?? '',
    });
    setShowForm(true);
  };

  const pickPond = (name: string) => {
    const pond = ponds.find(p => p.name === name);
    setDraft({ ...draft, pondName: name, pondId: pond?.id ?? '' });
  };

  const save = () => {
    if (!draft.pondName.trim()) return;
    const now = new Date().toISOString();
    const base = {
      pondId: draft.pondId,
      pondName: draft.pondName,
      date: draft.date,
      ph: Number(draft.ph) || 0,
      dissolvedOxygen: Number(draft.dissolvedOxygen) || 0,
      temperature: Number(draft.temperature) || 0,
      ammonia: draft.ammonia !== '' ? Number(draft.ammonia) : undefined,
      nitrite: draft.nitrite !== '' ? Number(draft.nitrite) : undefined,
      officerName: draft.officerName.trim(),
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('waterQuality', editingId, base);
    } else {
      agroStore.add('waterQuality', { ...base, id: makeId('wq'), createdAt: now } as WaterQualityRecord);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Perikanan & Bioflok"
        title="Kualitas Air"
        subtitle="Pantau pH, oksigen terlarut, suhu, amonia, dan nitrit per kolam."
        actions={<AddButton onClick={openCreate} label="Catat Pengukuran" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Total Pengukuran" value={String(records.length)} hint="Seluruh catatan kualitas air" accent />
        <AgroStat label="DO Rendah" value={String(doRendah)} hint="Oksigen < 5 mg/L" />
        <AgroStat label="pH Tidak Aman" value={String(phTidakAman)} hint="Di luar 6.5 – 8.5" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari kolam / petugas..." /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada data kualitas air." />
      ) : (
        <AgroTable headers={['Kolam', 'Tanggal', 'pH', 'DO (mg/L)', 'Suhu (°C)', 'Amonia', 'Nitrit', 'Petugas', 'Status', 'Aksi']}>
          {filtered.map(r => {
            const phBad = !isPhSafe(r.ph);
            const doBad = (r.dissolvedOxygen ?? 0) < 5;
            const amoniaBad = (r.ammonia ?? 0) > 1;
            const danger = phBad || doBad || amoniaBad;
            return (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-black text-slate-800">{r.pondName}</td>
                <td className="px-4 py-3 text-xs">{formatDate(r.date)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={r.ph.toFixed(1)} tone={phBad ? 'red' : 'green'} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={r.dissolvedOxygen.toFixed(1)} tone={doBad ? 'red' : 'green'} />
                </td>
                <td className="px-4 py-3 text-xs">{r.temperature}°C</td>
                <td className="px-4 py-3 text-xs">{r.ammonia != null ? r.ammonia.toFixed(1) : '-'}</td>
                <td className="px-4 py-3 text-xs">{r.nitrite != null ? r.nitrite.toFixed(1) : '-'}</td>
                <td className="px-4 py-3 text-xs">{r.officerName}</td>
                <td className="px-4 py-3">
                  {danger
                    ? <StatusBadge value="Perlu Perhatian" tone="red" />
                    : <StatusBadge value="Aman" tone="green" />}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <AgroButton variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></AgroButton>
                    <AgroButton variant="ghost" onClick={() => agroStore.remove('waterQuality', r.id)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Pengukuran' : 'Catat Pengukuran Baru'} onClose={() => setShowForm(false)}>
          <AgroSelect label="Kolam" value={draft.pondName} onChange={pickPond} options={ponds.map(p => p.name)} />
          <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} />
          <div className="grid grid-cols-3 gap-3">
            <AgroField label="pH" type="number" value={draft.ph} onChange={v => setDraft({ ...draft, ph: v })} />
            <AgroField label="DO (mg/L)" type="number" value={draft.dissolvedOxygen} onChange={v => setDraft({ ...draft, dissolvedOxygen: v })} />
            <AgroField label="Suhu (°C)" type="number" value={draft.temperature} onChange={v => setDraft({ ...draft, temperature: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Amonia (mg/L)" type="number" value={draft.ammonia} onChange={v => setDraft({ ...draft, ammonia: v })} />
            <AgroField label="Nitrit (mg/L)" type="number" value={draft.nitrite} onChange={v => setDraft({ ...draft, nitrite: v })} />
          </div>
          <AgroField label="Petugas" value={draft.officerName} onChange={v => setDraft({ ...draft, officerName: v })} placeholder="Nama petugas" />
          <AgroField label="Catatan" value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Opsional" />
          <AgroButton onClick={save} className="w-full justify-center"><FlaskConical className="h-4 w-4" />Simpan</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

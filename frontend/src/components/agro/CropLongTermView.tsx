import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { CropRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import { AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton, AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton } from './AgroUI';

const emptyDraft = (): Omit<CropRecord, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '', division: 'Tanaman Jangka Panjang', variety: '', locationId: '', locationName: '',
  plotAreaM2: 0, plantedDate: new Date().toISOString().slice(0, 10), estimatedHarvestDate: '', status: 'Tanam', notes: '',
});

// Tanaman jangka panjang (sawit, karet, buah tahunan, dll).
export const CropLongTermView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const crops = state.crops.filter(c => c.division === 'Tanaman Jangka Panjang');
  const totalArea = crops.reduce((s, c) => s + c.plotAreaM2, 0);

  const filtered = crops.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.variety.toLowerCase().includes(q) || c.locationName.toLowerCase().includes(q);
  });

  const openCreate = () => { setDraft(emptyDraft()); setEditingId(null); setShowForm(true); };
  const openEdit = (c: CropRecord) => {
    setDraft({
      name: c.name, division: c.division, variety: c.variety, locationId: c.locationId, locationName: c.locationName,
      plotAreaM2: c.plotAreaM2, plantedDate: c.plantedDate, estimatedHarvestDate: c.estimatedHarvestDate, status: c.status, notes: c.notes,
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    const now = new Date().toISOString();
    const payload: CropRecord = {
      ...draft,
      id: editingId ?? makeId('crop'),
      createdAt: editingId ? crops.find(c => c.id === editingId)?.createdAt ?? now : now,
      updatedAt: now,
    };
    if (editingId) agroStore.update('crops', editingId, { ...payload } as Record<string, unknown>);
    else agroStore.add('crops', payload);
    setShowForm(false);
  };

  const toneOf = (s: string) => (s === 'Tumbuh' || s === 'Panen' ? 'green' : s === 'Gagal' ? 'red' : s === 'Tanam' ? 'blue' : 'amber') as 'green' | 'amber' | 'red' | 'blue';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Kebun & Pertanian"
        title="Tanaman Jangka Panjang"
        subtitle="Kelola tanaman tahunan seperti kelapa sawit, karet, dan buah-buahan."
      />

      <div className="grid grid-cols-3 gap-3">
        <AgroStat label="Total Tanaman" value={String(crops.length)} />
        <AgroStat label="Total Luas Lahan" value={`${totalArea.toLocaleString('id-ID')} m²`} />
        <AgroStat label="Status Tumbuh" value={String(crops.filter(c => c.status === 'Tumbuh').length)} accent />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-72"><AgroSearch value={search} onChange={setSearch} placeholder="Cari nama, varietas, lokasi..." /></div>
        <div className="ml-auto"><AddButton onClick={openCreate} label="Tambah Tanaman" /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada tanaman jangka panjang." />
      ) : (
        <AgroTable headers={['Nama', 'Varietas', 'Lokasi', 'Luas (m²)', 'Tanggal Tanam', 'Estimasi Panen', 'Status', 'Aksi']}>
          {filtered.map(c => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-[#5a2d1f]">{c.name}</td>
              <td className="px-4 py-3 text-slate-700">{c.variety}</td>
              <td className="px-4 py-3 text-slate-500">{c.locationName}</td>
              <td className="px-4 py-3 text-slate-700">{c.plotAreaM2.toLocaleString('id-ID')}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(c.plantedDate)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(c.estimatedHarvestDate)}</td>
              <td className="px-4 py-3"><StatusBadge value={c.status} tone={toneOf(c.status)} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => { if (confirm('Hapus tanaman ini?')) agroStore.remove('crops', c.id); }}><Trash2 className="h-4 w-4" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Tanaman' : 'Tambah Tanaman'} onClose={() => setShowForm(false)}>
          <AgroField label="Nama Tanaman" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="Kelapa Sawit" />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Varietas" value={draft.variety} onChange={v => setDraft({ ...draft, variety: v })} placeholder="Tenera" />
            <AgroField label="Nama Lokasi" value={draft.locationName} onChange={v => setDraft({ ...draft, locationName: v })} placeholder="Kulim" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Luas Lahan (m²)" type="number" value={draft.plotAreaM2 === 0 ? '' : String(draft.plotAreaM2)} onChange={v => setDraft({ ...draft, plotAreaM2: Number(v) })} />
            <AgroSelect label="Status" value={draft.status} onChange={v => setDraft({ ...draft, status: v as CropRecord['status'] })} options={['Persiapan', 'Tanam', 'Tumbuh', 'Panen', 'Gagal']} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Tanggal Tanam" type="date" value={draft.plantedDate} onChange={v => setDraft({ ...draft, plantedDate: v })} />
            <AgroField label="Estimasi Panen" type="date" value={draft.estimatedHarvestDate} onChange={v => setDraft({ ...draft, estimatedHarvestDate: v })} />
          </div>
          <AgroField label="Catatan" value={draft.notes ?? ''} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Catatan opsional" />
          <div className="flex gap-2 pt-1">
            <AgroButton onClick={save} className="flex-1 justify-center">Simpan</AgroButton>
            <AgroButton variant="outline" onClick={() => setShowForm(false)}>Batal</AgroButton>
          </div>
        </AgroModal>
      )}
    </div>
  );
};

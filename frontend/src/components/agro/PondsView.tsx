import React, { useEffect, useMemo, useState } from 'react';
import { Droplets, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { PondRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

interface PondDraft {
  name: string;
  locationName: string;
  type: PondRecord['type'];
  species: string;
  areaM2: string;
  volumeM3: string;
  stockingDate: string;
  stockingCount: string;
  estimatedHarvestDate: string;
  status: PondRecord['status'];
  notes: string;
}

const emptyDraft = (): PondDraft => ({
  name: '', locationName: 'RAS', type: 'Bioflok', species: '', areaM2: '',
  volumeM3: '', stockingDate: today(), stockingCount: '', estimatedHarvestDate: '', status: 'Aktif', notes: '',
});

export const PondsView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PondDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const ponds = state.ponds;
  const filtered = ponds.filter(p =>
    (p.name + ' ' + p.species + ' ' + p.locationName).toLowerCase().includes(search.toLowerCase()),
  );
  const totalPopulasi = ponds.reduce((sum, p) => sum + (p.stockingCount || 0), 0);
  const aktif = ponds.filter(p => p.status === 'Aktif').length;

  const openCreate = () => { setEditingId(null); setDraft(emptyDraft()); setShowForm(true); };
  const openEdit = (p: PondRecord) => {
    setEditingId(p.id);
    setDraft({
      name: p.name, locationName: p.locationName, type: p.type, species: p.species,
      areaM2: String(p.areaM2), volumeM3: String(p.volumeM3), stockingDate: p.stockingDate,
      stockingCount: String(p.stockingCount), estimatedHarvestDate: p.estimatedHarvestDate,
      status: p.status, notes: p.notes ?? '',
    });
    setShowForm(true);
  };

  const save = () => {
    if (!draft.name.trim() || !draft.species.trim()) return;
    const now = new Date().toISOString();
    const base = {
      name: draft.name.trim(),
      locationId: draft.locationName.toLowerCase().replace(/\s+/g, '-'),
      locationName: draft.locationName,
      type: draft.type,
      species: draft.species.trim(),
      areaM2: Number(draft.areaM2) || 0,
      volumeM3: Number(draft.volumeM3) || 0,
      stockingDate: draft.stockingDate,
      stockingCount: Number(draft.stockingCount) || 0,
      estimatedHarvestDate: draft.estimatedHarvestDate,
      status: draft.status,
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('ponds', editingId, { ...base, updatedAt: now });
    } else {
      agroStore.add('ponds', { ...base, id: makeId('pond'), createdAt: now, updatedAt: now } as PondRecord);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Perikanan & Bioflok"
        title="Kolam & Bioflok"
        subtitle="Kelola seluruh kolam budidaya, tebar benih, dan siklus panen."
        actions={<AddButton onClick={openCreate} label="Tambah Kolam" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Total Kolam" value={String(ponds.length)} hint="Seluruh kolam terdaftar" accent />
        <AgroStat label="Kolam Aktif" value={String(aktif)} hint="Sedang berisi tebar" />
        <AgroStat label="Total Populasi" value={totalPopulasi.toLocaleString('id-ID')} hint="Ekor total tebar" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari kolam / spesies / lokasi..." /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada data kolam." />
      ) : (
        <AgroTable headers={['Nama Kolam', 'Jenis', 'Spesies', 'Populasi', 'Luas/Volume', 'Tebar', 'Panen', 'Status', 'Aksi']}>
          {filtered.map(p => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black text-slate-800">{p.name}</td>
              <td className="px-4 py-3 text-xs">{p.type}</td>
              <td className="px-4 py-3 text-xs">{p.species}</td>
              <td className="px-4 py-3 text-xs">{p.stockingCount.toLocaleString('id-ID')} ekor</td>
              <td className="px-4 py-3 text-xs">{p.areaM2} m² / {p.volumeM3} m³</td>
              <td className="px-4 py-3 text-xs">{formatDate(p.stockingDate)}</td>
              <td className="px-4 py-3 text-xs">{formatDate(p.estimatedHarvestDate)}</td>
              <td className="px-4 py-3"><StatusBadge value={p.status} tone={p.status === 'Aktif' ? 'green' : p.status === 'Panen' ? 'amber' : 'slate'} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => agroStore.remove('ponds', p.id)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Kolam' : 'Kolam Baru'} onClose={() => setShowForm(false)}>
          <AgroField label="Nama Kolam" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="cth. Kolam Bioflok A3" />
          <AgroSelect label="Jenis Kolam" value={draft.type} onChange={v => setDraft({ ...draft, type: v as PondRecord['type'] })} options={['Bioflok', 'Kolam Tanah', 'Kolam Terpal', 'Keramba']} />
          <AgroField label="Spesies" value={draft.species} onChange={v => setDraft({ ...draft, species: v })} placeholder="cth. Nila, Lele" />
          <AgroField label="Lokasi" value={draft.locationName} onChange={v => setDraft({ ...draft, locationName: v })} />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Luas (m²)" type="number" value={draft.areaM2} onChange={v => setDraft({ ...draft, areaM2: v })} />
            <AgroField label="Volume (m³)" type="number" value={draft.volumeM3} onChange={v => setDraft({ ...draft, volumeM3: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Tanggal Tebar" type="date" value={draft.stockingDate} onChange={v => setDraft({ ...draft, stockingDate: v })} />
            <AgroField label="Estimasi Panen" type="date" value={draft.estimatedHarvestDate} onChange={v => setDraft({ ...draft, estimatedHarvestDate: v })} />
          </div>
          <AgroField label="Jumlah Tebar (ekor)" type="number" value={draft.stockingCount} onChange={v => setDraft({ ...draft, stockingCount: v })} />
          <AgroSelect label="Status" value={draft.status} onChange={v => setDraft({ ...draft, status: v as PondRecord['status'] })} options={['Persiapan', 'Aktif', 'Panen', 'Kosong']} />
          <AgroField label="Catatan" value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Opsional" />
          <AgroButton onClick={save} className="w-full justify-center"><Droplets className="h-4 w-4" />Simpan Kolam</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

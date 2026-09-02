import React, { useEffect, useMemo, useState } from 'react';
import { Bird, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { WildlifeRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

interface WildlifeDraft {
  name: string;
  category: WildlifeRecord['category'];
  species: string;
  count: string;
  locationName: string;
  acquisitionDate: string;
  healthStatus: WildlifeRecord['healthStatus'];
  notes: string;
}

const emptyDraft = (): WildlifeDraft => ({
  name: '', category: 'Aviari (Burung)', species: '', count: '', locationName: 'RAS',
  acquisitionDate: today(), healthStatus: 'Sehat', notes: '',
});

export const WildlifeView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WildlifeDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const wildlife = state.wildlife;
  const filtered = wildlife.filter(w =>
    (w.name + ' ' + w.species + ' ' + w.category).toLowerCase().includes(search.toLowerCase()),
  );

  const totalSatwa = wildlife.reduce((sum, w) => sum + w.count, 0);
  const sehat = wildlife.filter(w => w.healthStatus === 'Sehat').length;

  const openCreate = () => { setEditingId(null); setDraft(emptyDraft()); setShowForm(true); };
  const openEdit = (w: WildlifeRecord) => {
    setEditingId(w.id);
    setDraft({
      name: w.name, category: w.category, species: w.species, count: String(w.count),
      locationName: w.locationName, acquisitionDate: w.acquisitionDate,
      healthStatus: w.healthStatus, notes: w.notes ?? '',
    });
    setShowForm(true);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    const now = new Date().toISOString();
    const base = {
      name: draft.name.trim(),
      category: draft.category,
      species: draft.species.trim(),
      count: Number(draft.count) || 0,
      locationId: draft.locationName.toLowerCase().replace(/\s+/g, '-'),
      locationName: draft.locationName,
      acquisitionDate: draft.acquisitionDate,
      healthStatus: draft.healthStatus,
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('wildlife', editingId, base);
    } else {
      agroStore.add('wildlife', { ...base, id: makeId('wl'), createdAt: now } as WildlifeRecord);
    }
    setShowForm(false);
  };

  const healthTone = (s: WildlifeRecord['healthStatus']): 'green' | 'amber' | 'red' =>
    s === 'Sehat' ? 'green' : s === 'Dalam Perawatan' ? 'amber' : 'red';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Satwa & Aviari"
        title="Koleksi Satwa & Aviari"
        subtitle="Inventaris koleksi satwa agrowisata beserta status kesehatannya."
        actions={<AddButton onClick={openCreate} label="Tambah Satwa" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Total Koleksi" value={String(wildlife.length)} hint="Jenis satwa terdaftar" accent />
        <AgroStat label="Total Individu" value={totalSatwa.toLocaleString('id-ID')} hint="Ekor seluruh satwa" />
        <AgroStat label="Satwa Sehat" value={String(sehat)} hint="Berstatus sehat" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari nama / spesies..." /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada data satwa." />
      ) : (
        <AgroTable headers={['Nama', 'Kategori', 'Spesies', 'Jumlah', 'Lokasi', 'Tanggal Perolehan', 'Kesehatan', 'Aksi']}>
          {filtered.map(w => (
            <tr key={w.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black text-slate-800">{w.name}</td>
              <td className="px-4 py-3 text-xs">{w.category}</td>
              <td className="px-4 py-3 text-xs italic">{w.species}</td>
              <td className="px-4 py-3 text-xs">{w.count.toLocaleString('id-ID')} ekor</td>
              <td className="px-4 py-3 text-xs">{w.locationName}</td>
              <td className="px-4 py-3 text-xs">{formatDate(w.acquisitionDate)}</td>
              <td className="px-4 py-3"><StatusBadge value={w.healthStatus} tone={healthTone(w.healthStatus)} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => agroStore.remove('wildlife', w.id)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Satwa' : 'Satwa Baru'} onClose={() => setShowForm(false)}>
          <AgroField label="Nama" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="cth. Burung Merak" />
          <AgroSelect label="Kategori" value={draft.category} onChange={v => setDraft({ ...draft, category: v as WildlifeRecord['category'] })} options={['Aviari (Burung)', 'Mamalia', 'Reptil', 'Lainnya']} />
          <AgroField label="Spesies (Nama Ilmiah)" value={draft.species} onChange={v => setDraft({ ...draft, species: v })} placeholder="cth. Pavo muticus" />
          <AgroField label="Jumlah (ekor)" type="number" value={draft.count} onChange={v => setDraft({ ...draft, count: v })} />
          <AgroField label="Lokasi" value={draft.locationName} onChange={v => setDraft({ ...draft, locationName: v })} />
          <AgroField label="Tanggal Perolehan" type="date" value={draft.acquisitionDate} onChange={v => setDraft({ ...draft, acquisitionDate: v })} />
          <AgroSelect label="Status Kesehatan" value={draft.healthStatus} onChange={v => setDraft({ ...draft, healthStatus: v as WildlifeRecord['healthStatus'] })} options={['Sehat', 'Sakit', 'Dalam Perawatan']} />
          <AgroField label="Catatan" value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Opsional" />
          <AgroButton onClick={save} className="w-full justify-center"><Bird className="h-4 w-4" />Simpan Satwa</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

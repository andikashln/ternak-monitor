import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { CropActivityRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import { AgroHeader, AgroCard, AgroTable, StatusBadge, AgroButton, AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton } from './AgroUI';

const emptyDraft = (): Omit<CropActivityRecord, 'id' | 'createdAt'> => ({
  cropId: '', cropName: '', activityType: 'Pemupukan', date: new Date().toISOString().slice(0, 10),
  officerName: '', materialUsed: '', quantity: undefined, unit: '', notes: '',
});

// Aktivitas & pemupukan tanaman (terhubung ke data crops).
export const CropActivityView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Semua' | CropActivityRecord['activityType']>('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const crops = state.crops;
  const activities = state.cropActivities;

  const filtered = activities
    .filter(a => typeFilter === 'Semua' || a.activityType === typeFilter)
    .filter(a => {
      const q = search.toLowerCase();
      return a.cropName.toLowerCase().includes(q) || a.activityType.toLowerCase().includes(q) || a.officerName.toLowerCase().includes(q);
    });

  const openCreate = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (a: CropActivityRecord) => {
    setDraft({
      cropId: a.cropId, cropName: a.cropName, activityType: a.activityType, date: a.date, officerName: a.officerName,
      materialUsed: a.materialUsed, quantity: a.quantity, unit: a.unit, notes: a.notes,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const pickCrop = (cropId: string) => {
    const c = crops.find(x => x.id === cropId);
    setDraft(d => ({ ...d, cropId, cropName: c ? c.name : d.cropName }));
  };

  const save = () => {
    if (!draft.cropName.trim() || !draft.officerName.trim()) return;
    const payload: CropActivityRecord = {
      ...draft,
      id: editingId ?? makeId('ca'),
      createdAt: editingId ? activities.find(a => a.id === editingId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };
    if (editingId) agroStore.update('cropActivities', editingId, { ...payload } as Record<string, unknown>);
    else agroStore.add('cropActivities', payload);
    setShowForm(false);
  };

  const toneOf = (t: string) => (t === 'Pemanenan' ? 'green' : t === 'Pemupukan' ? 'violet' : t === 'Penyemprotan' ? 'amber' : 'blue') as 'green' | 'amber' | 'blue' | 'violet';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Kebun & Pertanian"
        title="Aktivitas & Pemupukan"
        subtitle="Catat kegiatan harian kebun: pemupukan, penyiraman, penyiangan, dan panen."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-72"><AgroSearch value={search} onChange={setSearch} placeholder="Cari tanaman, aktivitas, petugas..." /></div>
        <AgroSelect label="" value={typeFilter} onChange={v => setTypeFilter(v as typeof typeFilter)} options={['Semua', 'Pemupukan', 'Penyiraman', 'Penyiangan', 'Penyemprotan', 'Pemanenan', 'Lainnya']} />
        <div className="ml-auto"><AddButton onClick={openCreate} label="Catat Aktivitas" /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada aktivitas yang cocok." />
      ) : (
        <AgroTable headers={['Tanggal', 'Tanaman', 'Aktivitas', 'Material', 'Jumlah', 'Petugas', 'Catatan', 'Aksi']}>
          {filtered.map(a => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-600">{formatDate(a.date)}</td>
              <td className="px-4 py-3 font-bold text-[#5a2d1f]">{a.cropName}</td>
              <td className="px-4 py-3"><StatusBadge value={a.activityType} tone={toneOf(a.activityType)} /></td>
              <td className="px-4 py-3 text-slate-700">{a.materialUsed ?? '-'}</td>
              <td className="px-4 py-3 text-slate-700">{a.quantity ? `${a.quantity} ${a.unit ?? ''}` : '-'}</td>
              <td className="px-4 py-3 text-slate-600">{a.officerName}</td>
              <td className="px-4 py-3 text-slate-500">{a.notes ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => { if (confirm('Hapus aktivitas ini?')) agroStore.remove('cropActivities', a.id); }}><Trash2 className="h-4 w-4" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Aktivitas' : 'Catat Aktivitas Baru'} onClose={() => setShowForm(false)}>
          <AgroSelect
            label="Tanaman"
            value={draft.cropId}
            onChange={v => pickCrop(v)}
            options={crops.map(c => c.id)}
          />
          <AgroField label="Nama Tanaman" value={draft.cropName} onChange={v => setDraft({ ...draft, cropName: v })} placeholder="Nama tanaman" />
          <div className="grid grid-cols-2 gap-3">
            <AgroSelect label="Jenis Aktivitas" value={draft.activityType} onChange={v => setDraft({ ...draft, activityType: v as CropActivityRecord['activityType'] })} options={['Pemupukan', 'Penyiraman', 'Penyiangan', 'Penyemprotan', 'Pemanenan', 'Lainnya']} />
            <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <AgroField label="Material" value={draft.materialUsed ?? ''} onChange={v => setDraft({ ...draft, materialUsed: v })} placeholder="NPK..." />
            <AgroField label="Jumlah" type="number" value={draft.quantity === undefined ? '' : String(draft.quantity)} onChange={v => setDraft({ ...draft, quantity: Number(v) })} />
            <AgroField label="Satuan" value={draft.unit ?? ''} onChange={v => setDraft({ ...draft, unit: v })} placeholder="kg, liter..." />
          </div>
          <AgroField label="Petugas" value={draft.officerName} onChange={v => setDraft({ ...draft, officerName: v })} placeholder="Nama petugas" />
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

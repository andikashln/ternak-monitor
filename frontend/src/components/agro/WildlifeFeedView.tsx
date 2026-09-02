import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { WildlifeFeedSchedule } from '../../types';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

interface FeedDraft {
  wildlifeId: string;
  wildlifeName: string;
  scheduleTime: string;
  feedType: string;
  feedAmount: string;
  status: WildlifeFeedSchedule['status'];
  officerName: string;
  notes: string;
}

const emptyDraft = (wildlifeName = ''): FeedDraft => ({
  wildlifeId: '', wildlifeName, scheduleTime: '07:00', feedType: '', feedAmount: '',
  status: 'Terjadwal', officerName: '', notes: '',
});

export const WildlifeFeedView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FeedDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const wildlife = state.wildlife;
  const feeds = state.wildlifeFeeds;
  const filtered = feeds.filter(f =>
    (f.wildlifeName + ' ' + f.feedType + ' ' + f.officerName).toLowerCase().includes(search.toLowerCase()),
  );

  const terjadwal = feeds.filter(f => f.status === 'Terjadwal').length;
  const selesai = feeds.filter(f => f.status === 'Selesai').length;
  const terlewat = feeds.filter(f => f.status === 'Terlewat').length;

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft(wildlife[0]?.name ?? ''));
    setShowForm(true);
  };
  const openEdit = (f: WildlifeFeedSchedule) => {
    setEditingId(f.id);
    setDraft({
      wildlifeId: f.wildlifeId, wildlifeName: f.wildlifeName, scheduleTime: f.scheduleTime,
      feedType: f.feedType, feedAmount: f.feedAmount, status: f.status,
      officerName: f.officerName, notes: f.notes ?? '',
    });
    setShowForm(true);
  };

  const pickWildlife = (name: string) => {
    const w = wildlife.find(x => x.name === name);
    setDraft({ ...draft, wildlifeName: name, wildlifeId: w?.id ?? '' });
  };

  const save = () => {
    if (!draft.wildlifeName.trim()) return;
    const now = new Date().toISOString();
    const base = {
      wildlifeId: draft.wildlifeId,
      wildlifeName: draft.wildlifeName,
      scheduleTime: draft.scheduleTime,
      feedType: draft.feedType.trim(),
      feedAmount: draft.feedAmount.trim(),
      status: draft.status,
      officerName: draft.officerName.trim(),
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('wildlifeFeeds', editingId, base);
    } else {
      agroStore.add('wildlifeFeeds', { ...base, id: makeId('wf'), createdAt: now } as WildlifeFeedSchedule);
    }
    setShowForm(false);
  };

  const markDone = (f: WildlifeFeedSchedule) => {
    agroStore.update('wildlifeFeeds', f.id, { status: 'Selesai', lastFedAt: new Date().toISOString() });
  };

  const statusTone = (s: WildlifeFeedSchedule['status']): 'green' | 'amber' | 'red' =>
    s === 'Selesai' ? 'green' : s === 'Terjadwal' ? 'amber' : 'red';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Satwa & Aviari"
        title="Jadwal & Checklist Pakan"
        subtitle="Atur jadwal pemberian pakan satwa dan tandai saat selesai."
        actions={<AddButton onClick={openCreate} label="Tambah Jadwal" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Terjadwal" value={String(terjadwal)} hint="Menunggu pemberian pakan" accent />
        <AgroStat label="Selesai" value={String(selesai)} hint="Pakan telah diberikan" />
        <AgroStat label="Terlewat" value={String(terlewat)} hint="Perlu tindak lanjut" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari satwa / jenis pakan..." /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada jadwal pakan." />
      ) : (
        <AgroTable headers={['Satwa', 'Waktu', 'Jenis Pakan', 'Jumlah', 'Status', 'Petugas', 'Aksi']}>
          {filtered.map(f => (
            <tr key={f.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-black text-slate-800">{f.wildlifeName}</td>
              <td className="px-4 py-3 text-xs">{f.scheduleTime}</td>
              <td className="px-4 py-3 text-xs">{f.feedType}</td>
              <td className="px-4 py-3 text-xs">{f.feedAmount}</td>
              <td className="px-4 py-3"><StatusBadge value={f.status} tone={statusTone(f.status)} /></td>
              <td className="px-4 py-3 text-xs">{f.officerName}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {f.status !== 'Selesai' && (
                    <AgroButton variant="outline" onClick={() => markDone(f)} className="px-2 py-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Selesai</AgroButton>
                  )}
                  <AgroButton variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => agroStore.remove('wildlifeFeeds', f.id)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Jadwal Pakan' : 'Jadwal Pakan Baru'} onClose={() => setShowForm(false)}>
          <AgroSelect label="Satwa" value={draft.wildlifeName} onChange={pickWildlife} options={wildlife.map(w => w.name)} />
          <AgroField label="Waktu" type="time" value={draft.scheduleTime} onChange={v => setDraft({ ...draft, scheduleTime: v })} />
          <AgroField label="Jenis Pakan" value={draft.feedType} onChange={v => setDraft({ ...draft, feedType: v })} placeholder="cth. Biji-bijian campur" />
          <AgroField label="Jumlah" value={draft.feedAmount} onChange={v => setDraft({ ...draft, feedAmount: v })} placeholder="cth. 500 g" />
          <AgroSelect label="Status" value={draft.status} onChange={v => setDraft({ ...draft, status: v as WildlifeFeedSchedule['status'] })} options={['Terjadwal', 'Selesai', 'Terlewat']} />
          <AgroField label="Petugas" value={draft.officerName} onChange={v => setDraft({ ...draft, officerName: v })} placeholder="Nama petugas" />
          <AgroField label="Catatan" value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Opsional" />
          <AgroButton onClick={save} className="w-full justify-center"><Clock className="h-4 w-4" />Simpan Jadwal</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

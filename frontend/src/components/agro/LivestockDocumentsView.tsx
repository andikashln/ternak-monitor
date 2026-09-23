import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { GardenDocumentRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const today = () => new Date().toISOString().slice(0, 10);

const DOC_TYPES: GardenDocumentRecord['docType'][] = ['Invoice Sapi', 'Surat Jalan', 'SOP', 'Foto Dokumentasi'];

interface DocDraft {
  docType: GardenDocumentRecord['docType'];
  title: string;
  date: string;
  partyName: string;
  fileName: string;
  notes: string;
}

const emptyDraft = (): DocDraft => ({
  docType: 'Invoice Sapi', title: '', date: today(), partyName: '', fileName: '', notes: '',
});

// Dokumen dianggap milik Peternakan Sapi bila judul/catatan/pihak mengandung kata kunci ini,
// ATAU docType-nya memang 'Invoice Sapi'.
const KEYWORDS = ['sapi', 'ternak', 'limousin', 'simental', 'brahman', 'penggemukan', 'kandang', 'daging'];

const isLivestockDoc = (d: GardenDocumentRecord): boolean => {
  if (d.docType === 'Invoice Sapi') return true;
  const hay = `${d.title} ${d.notes ?? ''} ${d.partyName}`.toLowerCase();
  return KEYWORDS.some(k => hay.includes(k));
};

export const LivestockDocumentsView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'peternakan' | 'semua'>('peternakan');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DocDraft>(emptyDraft());

  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const allDocs = state.gardenDocuments;
  const livestockDocs = allDocs.filter(isLivestockDoc);
  const visible = (tab === 'peternakan' ? livestockDocs : allDocs).filter(d =>
    (d.title + ' ' + d.partyName).toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => { setEditingId(null); setDraft(emptyDraft()); setShowForm(true); };
  const openEdit = (d: GardenDocumentRecord) => {
    setEditingId(d.id);
    setDraft({
      docType: d.docType, title: d.title, date: d.date, partyName: d.partyName,
      fileName: d.fileName ?? '', notes: d.notes ?? '',
    });
    setShowForm(true);
  };

  const save = () => {
    if (!draft.title.trim()) return;
    const now = new Date().toISOString();
    const base = {
      docType: draft.docType,
      title: draft.title.trim(),
      date: draft.date,
      partyName: draft.partyName.trim(),
      fileName: draft.fileName.trim() || undefined,
      notes: draft.notes.trim() || undefined,
    };
    if (editingId) {
      agroStore.update('gardenDocuments', editingId, base);
    } else {
      agroStore.add('gardenDocuments', { ...base, id: makeId('gd'), createdAt: now } as GardenDocumentRecord);
    }
    setShowForm(false);
  };

  const toneFor = (t: GardenDocumentRecord['docType']): 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate' =>
    t === 'Invoice Sapi' || t === 'Invoice Kebun' || t === 'Invoice Ikan' ? 'blue' : t === 'Surat Jalan' ? 'amber' : t === 'SOP' ? 'green' : 'violet';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Peternakan Sapi"
        title="Invoice, Surat Jalan & Dokumentasi"
        subtitle="Kelola invoice penjualan sapi, surat jalan, SOP, dan foto dokumentasi divisi Peternakan Sapi."
        actions={<AddButton onClick={openCreate} label="Tambah Dokumen" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AgroStat label="Dokumen Peternakan" value={String(livestockDocs.length)} hint="Terkait sapi/ternak" accent />
        <AgroStat label="Total Dokumen" value={String(allDocs.length)} hint="Seluruh divisi" />
        <AgroStat label="Invoice Sapi" value={String(livestockDocs.filter(d => d.docType === 'Invoice Sapi').length)} hint="Invoice penjualan sapi" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 rounded-2xl border bg-white p-1">
          <button onClick={() => setTab('peternakan')} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === 'peternakan' ? 'bg-[#0F5132] text-white' : 'text-slate-500'}`}>Peternakan Sapi</button>
          <button onClick={() => setTab('semua')} className={`rounded-xl px-4 py-2 text-xs font-black ${tab === 'semua' ? 'bg-[#0F5132] text-white' : 'text-slate-500'}`}>Semua Divisi</button>
        </div>
        <div className="min-w-[240px] flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari judul / pihak..." /></div>
      </div>

      {visible.length === 0 ? (
        <AgroEmpty text="Belum ada dokumen yang cocok." />
      ) : (
        <AgroTable headers={['Jenis', 'Judul', 'Tanggal', 'Pihak', 'Berkas', 'Catatan', 'Aksi']}>
          {visible.map(d => (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge value={d.docType} tone={toneFor(d.docType)} /></td>
              <td className="px-4 py-3 font-black text-slate-800">{d.title}</td>
              <td className="px-4 py-3 text-xs">{formatDate(d.date)}</td>
              <td className="px-4 py-3 text-xs">{d.partyName || '-'}</td>
              <td className="px-4 py-3 text-xs">{d.fileName || '-'}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{d.notes || '-'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => { if (confirm('Hapus dokumen ini?')) agroStore.remove('gardenDocuments', d.id); }}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                </div>
              </td>
            </tr>
          ))}
        </AgroTable>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Dokumen' : 'Dokumen Baru'} onClose={() => setShowForm(false)}>
          <AgroSelect label="Jenis Dokumen" value={draft.docType} onChange={v => setDraft({ ...draft, docType: v as GardenDocumentRecord['docType'] })} options={DOC_TYPES} />
          <AgroField label="Judul" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} placeholder="cth. Invoice Penjualan Sapi Limousin" />
          <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} />
          <AgroField label="Pihak / Pembeli" value={draft.partyName} onChange={v => setDraft({ ...draft, partyName: v })} placeholder="cth. H. Abdul Rahman" />
          <AgroField label="Nama Berkas" value={draft.fileName} onChange={v => setDraft({ ...draft, fileName: v })} placeholder="Opsional" />
          <AgroField label="Catatan" value={draft.notes} onChange={v => setDraft({ ...draft, notes: v })} placeholder="Tambahkan kata kunci 'sapi'/'ternak' agar masuk divisi Peternakan" />
          <AgroButton onClick={save} className="w-full justify-center"><FileText className="h-4 w-4" />Simpan Dokumen</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

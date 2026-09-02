import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import type { GardenDocumentRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import { AgroHeader, AgroCard, AgroButton, AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton } from './AgroUI';

const docTypes: GardenDocumentRecord['docType'][] = ['Invoice Kebun', 'Surat Jalan', 'SOP', 'Foto Dokumentasi'];

const emptyDraft = (): Omit<GardenDocumentRecord, 'id' | 'createdAt'> => ({
  docType: 'Invoice Kebun', title: '', date: new Date().toISOString().slice(0, 10), partyName: '', fileName: '', notes: '',
});

// Invoice & surat jalan kebun, SOP, dan dokumentasi kebun.
export const GardenDocumentsView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState<'Semua' | GardenDocumentRecord['docType']>('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const docs = state.gardenDocuments;
  const filtered = docs
    .filter(d => docType === 'Semua' || d.docType === docType)
    .filter(d => {
      const q = search.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.partyName.toLowerCase().includes(q) || d.fileName?.toLowerCase().includes(q);
    });

  const openCreate = () => { setDraft(emptyDraft()); setEditingId(null); setShowForm(true); };
  const openEdit = (d: GardenDocumentRecord) => {
    setDraft({ docType: d.docType, title: d.title, date: d.date, partyName: d.partyName, fileName: d.fileName, notes: d.notes });
    setEditingId(d.id);
    setShowForm(true);
  };

  const save = () => {
    if (!draft.title.trim()) return;
    const payload: GardenDocumentRecord = {
      ...draft,
      id: editingId ?? makeId('gd'),
      createdAt: editingId ? docs.find(d => d.id === editingId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };
    if (editingId) agroStore.update('gardenDocuments', editingId, { ...payload } as Record<string, unknown>);
    else agroStore.add('gardenDocuments', payload);
    setShowForm(false);
  };

  const badgeTone = (t: GardenDocumentRecord['docType']) =>
    (t === 'Invoice Kebun' ? 'green' : t === 'Surat Jalan' ? 'blue' : t === 'SOP' ? 'violet' : 'amber') as 'green' | 'blue' | 'violet' | 'amber';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Kebun & Pertanian"
        title="Invoice, Surat Jalan & Dokumentasi"
        subtitle="Kelola invoice kebun, surat jalan, SOP, dan foto dokumentasi dalam satu tempat."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-72"><AgroSearch value={search} onChange={setSearch} placeholder="Cari judul, pihak, nama file..." /></div>
        <AgroSelect label="" value={docType} onChange={v => setDocType(v as typeof docType)} options={['Semua', ...docTypes]} />
        <div className="ml-auto"><AddButton onClick={openCreate} label="Tambah Dokumen" /></div>
      </div>

      {filtered.length === 0 ? (
        <AgroEmpty text="Belum ada dokumen." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(d => (
            <AgroCard key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#f9ebcc] p-2 text-[#5a2d1f]"><FileText className="h-5 w-5" /></div>
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{d.docType}</span>
                    <h4 className="mt-1 font-black text-slate-900">{d.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">{d.partyName} · {formatDate(d.date)}</p>
                    {d.fileName && <p className="mt-0.5 text-[11px] text-slate-400">File: {d.fileName}</p>}
                    {d.notes && <p className="mt-1 text-xs text-slate-600">{d.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <AgroButton variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></AgroButton>
                  <AgroButton variant="ghost" onClick={() => { if (confirm('Hapus dokumen ini?')) agroStore.remove('gardenDocuments', d.id); }}><Trash2 className="h-4 w-4" /></AgroButton>
                </div>
              </div>
            </AgroCard>
          ))}
        </div>
      )}

      {showForm && (
        <AgroModal title={editingId ? 'Edit Dokumen' : 'Tambah Dokumen'} onClose={() => setShowForm(false)}>
          <AgroSelect label="Jenis Dokumen" value={draft.docType} onChange={v => setDraft({ ...draft, docType: v as GardenDocumentRecord['docType'] })} options={docTypes} />
          <AgroField label="Judul" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} placeholder="Surat Jalan Pengiriman Sawit" />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} />
            <AgroField label="Nama Pihak" value={draft.partyName} onChange={v => setDraft({ ...draft, partyName: v })} placeholder="PT Sinar Sawit" />
          </div>
          <AgroField label="Nama File" value={draft.fileName ?? ''} onChange={v => setDraft({ ...draft, fileName: v })} placeholder="sj-sawit-0818.pdf" />
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

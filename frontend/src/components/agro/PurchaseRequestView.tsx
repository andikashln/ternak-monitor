import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, Plus, ShoppingCart, Trash2, XCircle } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import { storeService } from '../../services/storeService';
import { PurchaseRequest, InventoryCategory } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const CATEGORIES: InventoryCategory[] = ['Pakan', 'Obat & Vitamin', 'Peralatan', 'Bibit/Benih', 'Pupuk', 'Bahan Bakar', 'Lainnya'];

interface Draft {
  requestNo: string; itemName: string; category: string; quantity: string;
  unit: string; reason: string; requestedBy: string;
}

const emptyDraft = (): Draft => ({ requestNo: '', itemName: '', category: 'Pakan', quantity: '', unit: 'sak', reason: '', requestedBy: '' });
const nextRequestNo = (count: number) => `PR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

export const PurchaseRequestView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [editing, setEditing] = useState<PurchaseRequest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const requests = state.purchaseRequests;
  const currentUser = storeService.currentUser;

  const setField = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const toneFor = (status: string) => status === 'Disetujui' ? 'green' : status === 'Ditolak' ? 'red' : status === 'Diajukan' ? 'blue' : 'slate';

  const filtered = requests.filter(r =>
    (statusFilter === 'Semua' || r.status === statusFilter) &&
    (r.itemName + r.requestNo + r.requestedBy).toLowerCase().includes(search.toLowerCase()));

  const pending = requests.filter(r => r.status === 'Diajukan').length;
  const approved = requests.filter(r => r.status === 'Disetujui').length;

  const openAdd = () => { setEditing(null); setDraft({ ...emptyDraft(), requestNo: nextRequestNo(requests.length), requestedBy: currentUser.displayName }); setShowForm(true); };
  const openEdit = (item: PurchaseRequest) => {
    setEditing(item);
    setDraft({ requestNo: item.requestNo, itemName: item.itemName, category: item.category, quantity: String(item.quantity), unit: item.unit, reason: item.reason, requestedBy: item.requestedBy });
    setShowForm(true);
  };

  const save = () => {
    const payload = {
      requestNo: draft.requestNo, itemName: draft.itemName, category: draft.category as InventoryCategory,
      quantity: Number(draft.quantity) || 0, unit: draft.unit, reason: draft.reason,
      requestedBy: draft.requestedBy, requestDate: new Date().toISOString().slice(0, 10),
      status: 'Draft' as const, createdAt: new Date().toISOString(),
    };
    if (editing) {
      agroStore.update('purchaseRequests', editing.id, payload);
      storeService.addAuditLog('Purchase Request', 'Edit PR', editing.id, payload.requestNo);
    } else {
      agroStore.add('purchaseRequests', { ...payload, id: makeId('pr') });
      storeService.addAuditLog('Purchase Request', 'Buat PR', payload.requestNo, payload.itemName);
    }
    setShowForm(false);
  };

  const remove = (item: PurchaseRequest) => {
    if (!window.confirm(`Hapus permintaan "${item.requestNo}"?`)) return;
    agroStore.remove('purchaseRequests', item.id);
    storeService.addAuditLog('Purchase Request', 'Hapus PR', item.id, item.requestNo);
  };

  const setStatus = (item: PurchaseRequest, status: PurchaseRequest['status']) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'Disetujui' || status === 'Ditolak') {
      patch.approvedBy = currentUser.displayName;
      patch.approvedAt = new Date().toISOString();
    }
    agroStore.update('purchaseRequests', item.id, patch);
    storeService.addAuditLog('Purchase Request', `Status PR: ${status}`, item.id, item.requestNo, item.status, status);
  };

  const rows = filtered.map(r => (
    <tr key={r.id}>
      <td className="px-4 py-3 font-semibold text-slate-800">{r.requestNo}</td>
      <td className="px-4 py-3 font-semibold text-slate-800">{r.itemName}</td>
      <td className="px-4 py-3 text-slate-600">{r.category}</td>
      <td className="px-4 py-3 font-semibold">{r.quantity} {r.unit}</td>
      <td className="px-4 py-3 text-slate-600">{r.requestedBy}</td>
      <td className="px-4 py-3"><StatusBadge value={r.status} tone={toneFor(r.status)} /></td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {r.status === 'Diajukan' && (
            <>
              <AgroButton variant="ghost" onClick={() => setStatus(r, 'Disetujui')}><CheckCircle2 className="h-4 w-4 text-#7A4A30" />Setujui</AgroButton>
              <AgroButton variant="ghost" onClick={() => setStatus(r, 'Ditolak')}><XCircle className="h-4 w-4 text-rose-500" />Tolak</AgroButton>
            </>
          )}
          {r.status === 'Draft' && <AgroButton variant="ghost" onClick={() => setStatus(r, 'Diajukan')}><ShoppingCart className="h-4 w-4 text-blue-600" />Ajukan</AgroButton>}
          {r.status !== 'Disetujui' && r.status !== 'Ditolak' && (
            <>
              <AgroButton variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></AgroButton>
              <AgroButton variant="ghost" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
            </>
          )}
        </div>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Inventory & Purchasing"
        title="Purchase Request & PO"
        subtitle="Ajukan kebutuhan barang, lalu setujui atau tolak melalui alur kerja."
        actions={<AddButton onClick={openAdd} label="Buat Permintaan" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Total Permintaan" value={String(requests.length)} hint="Semua status" />
        <AgroStat label="Menunggu" value={String(pending)} hint="Status Diajukan" accent />
        <AgroStat label="Disetujui" value={String(approved)} hint="Siap diproses" />
        <AgroStat label="Ditolak" value={String(requests.filter(r => r.status === 'Ditolak').length)} hint="Perlu revisi" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari nomor / barang / pemohon..." /></div>
        <AgroSelect label="" value={statusFilter} onChange={setStatusFilter} options={['Semua', 'Draft', 'Diajukan', 'Disetujui', 'Ditolak']} />
      </div>

      {filtered.length === 0 ? <AgroEmpty text="Belum ada permintaan pembelian." /> : (
        <AgroTable headers={['No. PR', 'Barang', 'Kategori', 'Jumlah', 'Pemohon', 'Status', 'Aksi']}>{rows}</AgroTable>
      )}

      {showForm && (
        <AgroModal title={editing ? 'Edit Permintaan' : 'Buat Permintaan Baru'} onClose={() => setShowForm(false)}>
          <AgroField label="Nomor PR" value={draft.requestNo} onChange={v => setField({ requestNo: v })} />
          <AgroField label="Nama Barang" value={draft.itemName} onChange={v => setField({ itemName: v })} />
          <AgroSelect label="Kategori" value={draft.category} onChange={v => setField({ category: v })} options={CATEGORIES} />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Jumlah" type="number" value={draft.quantity} onChange={v => setField({ quantity: v })} />
            <AgroField label="Satuan" value={draft.unit} onChange={v => setField({ unit: v })} />
          </div>
          <AgroField label="Pemohon" value={draft.requestedBy} onChange={v => setField({ requestedBy: v })} />
          <AgroField label="Alasan" value={draft.reason} onChange={v => setField({ reason: v })} placeholder="Kenapa barang ini dibutuhkan..." />
          <AgroButton onClick={save} className="w-full justify-center">{editing ? 'Simpan Perubahan' : 'Simpan Permintaan'}</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

export default PurchaseRequestView;

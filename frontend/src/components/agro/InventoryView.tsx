import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, Plus, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import { storeService } from '../../services/storeService';
import { InventoryItem, StockMutation, InventoryCategory } from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroCard, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

const CATEGORIES: InventoryCategory[] = ['Pakan', 'Obat & Vitamin', 'Peralatan', 'Bibit/Benih', 'Pupuk', 'Bahan Bakar', 'Lainnya'];

interface InventoryDraft {
  sku: string; name: string; category: string; unit: string;
  stockQty: string; minStock: string; unitPrice: string;
  locationId: string; locationName: string; supplier: string;
}

interface MutationDraft {
  itemId: string; itemName: string; type: 'Masuk' | 'Keluar';
  quantity: string; date: string; reason: string;
}

const emptyDraft = (): InventoryDraft => ({ sku: '', name: '', category: 'Pakan', unit: 'sak', stockQty: '0', minStock: '0', unitPrice: '0', locationId: '', locationName: '', supplier: '' });
const emptyMutation = (): MutationDraft => ({ itemId: '', itemName: '', type: 'Masuk', quantity: '', date: new Date().toISOString().slice(0, 10), reason: '' });

export const InventoryView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<'inventory' | 'mutasi'>('inventory');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMutation, setShowMutation] = useState(false);
  const [draft, setDraft] = useState<InventoryDraft>(emptyDraft());
  const [mutation, setMutation] = useState<MutationDraft>(emptyMutation());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const inventory = state.inventory;
  const mutations = state.stockMutations;
  const locations = storeService.locations;
  const currentUser = storeService.currentUser;

  const lowStock = inventory.filter(i => i.stockQty <= i.minStock);
  const totalValue = inventory.reduce((s, i) => s + i.stockQty * i.unitPrice, 0);
  const filtered = inventory.filter(i =>
    (i.name + i.sku + i.category + (i.supplier ?? '')).toLowerCase().includes(search.toLowerCase()));

  const setField = (patch: Partial<InventoryDraft>) => setDraft(d => ({ ...d, ...patch }));
  const setMutField = (patch: Partial<MutationDraft>) => setMutation(m => ({ ...m, ...patch }));

  const openAdd = () => { setEditing(null); setDraft(emptyDraft()); setShowForm(true); };
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setDraft({
      sku: item.sku, name: item.name, category: item.category, unit: item.unit,
      stockQty: String(item.stockQty), minStock: String(item.minStock), unitPrice: String(item.unitPrice),
      locationId: item.locationId, locationName: item.locationName, supplier: item.supplier ?? '',
    });
    setShowForm(true);
  };

  const saveInventory = () => {
    const payload = {
      sku: draft.sku, name: draft.name, category: draft.category as InventoryCategory,
      unit: draft.unit, stockQty: Number(draft.stockQty) || 0, minStock: Number(draft.minStock) || 0,
      unitPrice: Number(draft.unitPrice) || 0, locationId: draft.locationId,
      locationName: draft.locationName, supplier: draft.supplier || undefined,
      updatedAt: new Date().toISOString(),
    };
    if (editing) {
      agroStore.update('inventory', editing.id, payload);
      storeService.addAuditLog('Inventory', 'Edit Barang', editing.id, payload.name);
    } else {
      agroStore.add('inventory', { ...payload, id: makeId('inv') });
      storeService.addAuditLog('Inventory', 'Tambah Barang', payload.sku, payload.name);
    }
    setShowForm(false);
  };

  const removeInventory = (item: InventoryItem) => {
    if (!window.confirm(`Hapus barang "${item.name}"?`)) return;
    agroStore.remove('inventory', item.id);
    storeService.addAuditLog('Inventory', 'Hapus Barang', item.id, item.name);
  };

  const openMutation = (item?: InventoryItem) => {
    setMutation(emptyMutation());
    if (item) setMutation(m => ({ ...m, itemId: item.id, itemName: item.name }));
    setShowMutation(true);
  };

  const saveMutation = () => {
    const item = inventory.find(i => i.id === mutation.itemId);
    const qty = Number(mutation.quantity) || 0;
    if (!item) return;
    if (qty <= 0) { window.alert('Jumlah harus lebih dari 0.'); return; }
    const delta = mutation.type === 'Masuk' ? qty : -qty;
    const newQty = item.stockQty + delta;
    if (newQty < 0) { window.alert('Stok tidak cukup untuk mutasi keluar.'); return; }
    agroStore.add('stockMutations', {
      id: makeId('sm'), itemId: item.id, itemName: item.name,
      type: mutation.type, quantity: qty, date: mutation.date, reason: mutation.reason,
      officerName: currentUser.displayName, createdAt: new Date().toISOString(),
    });
    agroStore.update('inventory', item.id, { stockQty: newQty, updatedAt: new Date().toISOString() });
    storeService.addAuditLog('Inventory', `Mutasi ${mutation.type}`, item.id, item.name, `Stok: ${item.stockQty}`, `Stok: ${newQty} (${mutation.type} ${qty})`);
    setShowMutation(false);
  };

  const mutationRows = mutations.map(m => (
    <tr key={m.id}>
      <td className="px-4 py-3 font-semibold text-slate-800">{m.itemName}</td>
      <td className="px-4 py-3"><StatusBadge value={m.type} tone={m.type === 'Masuk' ? 'green' : 'red'} /></td>
      <td className="px-4 py-3 font-semibold">{m.quantity}</td>
      <td className="px-4 py-3 text-slate-600">{m.date}</td>
      <td className="px-4 py-3 text-slate-600">{m.reason}</td>
      <td className="px-4 py-3 text-slate-600">{m.officerName}</td>
    </tr>
  ));

  const inventoryRows = filtered.map(item => {
    const low = item.stockQty <= item.minStock;
    return (
      <tr key={item.id} className={low ? 'bg-rose-50/50' : ''}>
        <td className="px-4 py-3 font-semibold text-slate-800">{item.sku}</td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-2 font-semibold text-slate-800">
            {item.name} {low && <AlertTriangle className="h-4 w-4 text-rose-500" />}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-600">{item.category}</td>
        <td className="px-4 py-3 font-semibold">{item.stockQty} {item.unit}</td>
        <td className="px-4 py-3 text-slate-600">{item.minStock}</td>
        <td className="px-4 py-3 text-slate-600">{formatRupiah(item.unitPrice)}</td>
        <td className="px-4 py-3 text-slate-600">{item.locationName}</td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <AgroButton variant="ghost" onClick={() => openMutation(item)}><ArrowUpCircle className="h-4 w-4" />Mutasi</AgroButton>
            <AgroButton variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></AgroButton>
            <AgroButton variant="ghost" onClick={() => removeInventory(item)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
          </div>
        </td>
      </tr>
    );
  });

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Inventory & Purchasing"
        title="Stok & Mutasi Barang"
        subtitle="Pantau stok, harga, lokasi penyimpanan, dan catat mutasi masuk/keluar barang."
        actions={<AddButton onClick={openAdd} label="Tambah Barang" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Total Barang" value={String(inventory.length)} hint="SKU terdaftar" />
        <AgroStat label="Total Nilai Stok" value={formatRupiah(totalValue)} hint="Qty × Harga Satuan" accent />
        <AgroStat label="Stok Menipis" value={String(lowStock.length)} hint="Di bawah minimum" accent />
        <AgroStat label="Total Mutasi" value={String(mutations.length)} hint="Masuk & keluar" />
      </div>

      {lowStock.length > 0 && (
        <AgroCard className="border-rose-200 bg-rose-50/60">
          <p className="flex items-center gap-2 text-sm font-black text-rose-700"><AlertTriangle className="h-4 w-4" />Peringatan Stok Menipis</p>
          <ul className="mt-2 grid gap-1 text-sm text-rose-800">
            {lowStock.map(i => <li key={i.id}>• {i.name} — sisa {i.stockQty} {i.unit} (min. {i.minStock})</li>)}
          </ul>
        </AgroCard>
      )}

      <div className="flex gap-2 rounded-2xl border bg-white p-2">
        <button onClick={() => setTab('inventory')} className={`flex-1 rounded-xl px-4 py-3 text-xs font-black ${tab === 'inventory' ? 'bg-[#5a2d1f] text-white' : 'text-slate-500'}`}><Package className="mr-2 inline h-4 w-4" />Daftar Barang</button>
        <button onClick={() => setTab('mutasi')} className={`flex-1 rounded-xl px-4 py-3 text-xs font-black ${tab === 'mutasi' ? 'bg-[#5a2d1f] text-white' : 'text-slate-500'}`}><ArrowUpCircle className="mr-2 inline h-4 w-4" />Riwayat Mutasi</button>
      </div>

      {tab === 'inventory' && (
        <>
          <AgroSearch value={search} onChange={setSearch} placeholder="Cari barang / SKU / supplier..." />
          {filtered.length === 0 ? <AgroEmpty text="Belum ada barang yang cocok." /> : (
            <AgroTable headers={['SKU', 'Nama', 'Kategori', 'Stok', 'Min.', 'Harga', 'Lokasi', 'Aksi']}>{inventoryRows}</AgroTable>
          )}
        </>
      )}

      {tab === 'mutasi' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Catat mutasi stok; otomatis menyesuaikan jumlah stok.</p>
            <AgroButton variant="outline" onClick={() => openMutation()}><Plus className="h-4 w-4" />Catat Mutasi</AgroButton>
          </div>
          {mutations.length === 0 ? <AgroEmpty text="Belum ada riwayat mutasi." /> : (
            <AgroTable headers={['Barang', 'Jenis', 'Jumlah', 'Tanggal', 'Alasan', 'Petugas']}>{mutationRows}</AgroTable>
          )}
        </>
      )}

      {showForm && (
        <AgroModal title={editing ? 'Edit Barang' : 'Tambah Barang'} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="SKU" value={draft.sku} onChange={v => setField({ sku: v })} />
            <AgroField label="Nama Barang" value={draft.name} onChange={v => setField({ name: v })} />
          </div>
          <AgroSelect label="Kategori" value={draft.category} onChange={v => setField({ category: v })} options={CATEGORIES} />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Satuan" value={draft.unit} onChange={v => setField({ unit: v })} />
            <AgroSelect label="Lokasi" value={draft.locationName} onChange={v => { const loc = locations.find(l => l.name === v); setField({ locationName: v, locationId: loc?.id ?? '' }); }} options={locations.map(l => l.name)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <AgroField label="Stok" type="number" value={draft.stockQty} onChange={v => setField({ stockQty: v })} />
            <AgroField label="Stok Min." type="number" value={draft.minStock} onChange={v => setField({ minStock: v })} />
            <AgroField label="Harga Satuan" type="number" value={draft.unitPrice} onChange={v => setField({ unitPrice: v })} />
          </div>
          <AgroField label="Supplier" value={draft.supplier} onChange={v => setField({ supplier: v })} />
          <AgroButton onClick={saveInventory} className="w-full justify-center">{editing ? 'Simpan Perubahan' : 'Simpan Barang'}</AgroButton>
        </AgroModal>
      )}

      {showMutation && (
        <AgroModal title="Catat Mutasi Stok" onClose={() => setShowMutation(false)}>
          <AgroSelect label="Barang" value={mutation.itemName} onChange={v => { const item = inventory.find(i => i.name === v); setMutField({ itemName: v, itemId: item?.id ?? '' }); }} options={inventory.map(i => i.name)} />
          <AgroSelect label="Jenis Mutasi" value={mutation.type} onChange={v => setMutField({ type: v as MutationDraft['type'] })} options={['Masuk', 'Keluar']} />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Jumlah" type="number" value={mutation.quantity} onChange={v => setMutField({ quantity: v })} />
            <AgroField label="Tanggal" type="date" value={mutation.date} onChange={v => setMutField({ date: v })} />
          </div>
          <AgroField label="Alasan" value={mutation.reason} onChange={v => setMutField({ reason: v })} placeholder="Pembelian / pemakaian / penyesuaian..." />
          <AgroButton onClick={saveMutation} className="w-full justify-center">Simpan Mutasi</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

export default InventoryView;

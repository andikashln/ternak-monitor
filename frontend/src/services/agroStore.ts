import {
  CropRecord, CropActivityRecord, GardenDocumentRecord,
  PondRecord, WaterQualityRecord, FishFeedLog, FishHarvestRecord,
  WildlifeRecord, WildlifeFeedSchedule,
  InventoryItem, StockMutation, PurchaseRequest, PurchaseOrder,
  TaskItem, AttendanceRecord, KpiScore,
  CashTransaction, LpjReport, ApprovalRequest, MasterDataItem,
} from '../types';

// ============================================================================
// Satu store terpadu untuk semua divisi baru (agro multi-divisi).
// Pola: snapshot() + subscribe(listener) — konsisten dengan financialDocumentsStore.
// Data disimpan ke localStorage; ada demo seed.
// ============================================================================

const KEY = 'ternak_agro_v1';

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export interface AgroState {
  crops: CropRecord[];
  cropActivities: CropActivityRecord[];
  gardenDocuments: GardenDocumentRecord[];
  ponds: PondRecord[];
  waterQuality: WaterQualityRecord[];
  fishFeeds: FishFeedLog[];
  fishHarvests: FishHarvestRecord[];
  wildlife: WildlifeRecord[];
  wildlifeFeeds: WildlifeFeedSchedule[];
  inventory: InventoryItem[];
  stockMutations: StockMutation[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  tasks: TaskItem[];
  attendance: AttendanceRecord[];
  kpis: KpiScore[];
  cashTransactions: CashTransaction[];
  lpjReports: LpjReport[];
  approvals: ApprovalRequest[];
  masterData: MasterDataItem[];
}

const INITIAL: AgroState = {
  crops: [
    { id: 'crop-1', name: 'Kelapa Sawit', division: 'Tanaman Jangka Panjang', variety: 'Tenera', locationId: 'loc-kulim', locationName: 'Kulim', plotAreaM2: 25000, plantedDate: '2023-05-10', estimatedHarvestDate: '2026-12-01', status: 'Tumbuh', notes: 'Blok A, umur 3 tahun, produksi stabil.', createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
    { id: 'crop-2', name: 'Kangkung', division: 'Sayuran Jangka Pendek', variety: 'Kangkung Bangkok', locationId: 'loc-sontang', locationName: 'Sontang', plotAreaM2: 800, plantedDate: '2026-08-20', estimatedHarvestDate: '2026-09-15', status: 'Tumbuh', notes: 'Siklus 25 hari.', createdAt: '2026-08-20T08:00:00Z', updatedAt: '2026-08-20T08:00:00Z' },
    { id: 'crop-3', name: 'Bayam', division: 'Sayuran Jangka Pendek', variety: 'Bayam Hijau', locationId: 'loc-sontang', locationName: 'Sontang', plotAreaM2: 500, plantedDate: '2026-08-22', estimatedHarvestDate: '2026-09-12', status: 'Tumbuh', createdAt: '2026-08-22T08:00:00Z', updatedAt: '2026-08-22T08:00:00Z' },
  ],
  cropActivities: [
    { id: 'ca-1', cropId: 'crop-1', cropName: 'Kelapa Sawit', activityType: 'Pemupukan', date: '2026-08-15', officerName: 'Budi Santoso', materialUsed: 'NPK 15-15-15', quantity: 250, unit: 'kg', notes: 'Pemupukan rutin blok A.', createdAt: '2026-08-15T08:00:00Z' },
    { id: 'ca-2', cropId: 'crop-2', cropName: 'Kangkung', activityType: 'Penyiraman', date: '2026-08-25', officerName: 'Rahmat Hidayat', notes: 'Penyiraman pagi & sore.', createdAt: '2026-08-25T08:00:00Z' },
  ],
  gardenDocuments: [
    { id: 'gd-1', docType: 'Surat Jalan', title: 'Surat Jalan Pengiriman Sawit', date: '2026-08-18', partyName: 'PT Sinar Sawit', fileName: 'sj-sawit-0818.pdf', notes: '10 ton TBS.', createdAt: '2026-08-18T08:00:00Z' },
    { id: 'gd-2', docType: 'SOP', title: 'SOP Pemupukan Kelapa Sawit', date: '2026-07-01', partyName: 'Internal', notes: 'Standar dosis per hektar.', createdAt: '2026-07-01T08:00:00Z' },
  ],
  ponds: [
    { id: 'pond-1', name: 'Kolam Bioflok A1', locationId: 'loc-ras', locationName: 'RAS', type: 'Bioflok', species: 'Nila', areaM2: 50, volumeM3: 60, stockingDate: '2026-06-01', stockingCount: 2000, estimatedHarvestDate: '2026-10-01', status: 'Aktif', notes: 'Padat tebar 40 ekor/m3.', createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
    { id: 'pond-2', name: 'Kolam Bioflok A2', locationId: 'loc-ras', locationName: 'RAS', type: 'Bioflok', species: 'Lele', areaM2: 40, volumeM3: 48, stockingDate: '2026-07-01', stockingCount: 3000, estimatedHarvestDate: '2026-09-20', status: 'Aktif', createdAt: '2026-07-01T08:00:00Z', updatedAt: '2026-07-01T08:00:00Z' },
  ],
  waterQuality: [
    { id: 'wq-1', pondId: 'pond-1', pondName: 'Kolam Bioflok A1', date: '2026-08-30', ph: 7.2, dissolvedOxygen: 5.8, temperature: 28, ammonia: 0.5, officerName: 'Hendra Wijaya', notes: 'Normal.', createdAt: '2026-08-30T08:00:00Z' },
    { id: 'wq-2', pondId: 'pond-2', pondName: 'Kolam Bioflok A2', date: '2026-08-30', ph: 6.9, dissolvedOxygen: 4.5, temperature: 29, ammonia: 1.2, officerName: 'Hendra Wijaya', notes: 'DO agak rendah, perlu aerasi.', createdAt: '2026-08-30T08:00:00Z' },
  ],
  fishFeeds: [
    { id: 'ff-1', pondId: 'pond-1', pondName: 'Kolam Bioflok A1', date: '2026-08-30', feedType: 'Pelet Apung', feedAmountKg: 8, biomassKg: 150, fcr: 1.6, officerName: 'Hendra Wijaya', createdAt: '2026-08-30T08:00:00Z' },
  ],
  fishHarvests: [
    { id: 'fh-1', pondId: 'pond-2', pondName: 'Kolam Bioflok A2', harvestDate: '2026-08-10', totalWeightKg: 300, totalFishCount: 1500, averageWeightKg: 0.2, buyerName: 'Pasar Sore', pricePerKg: 22000, totalRevenue: 6600000, notes: 'Panen parsial.', createdAt: '2026-08-10T08:00:00Z' },
  ],
  wildlife: [
    { id: 'wl-1', name: 'Burung Merak', category: 'Aviari (Burung)', species: 'Pavo muticus', count: 4, locationId: 'loc-ras', locationName: 'RAS', acquisitionDate: '2025-03-01', healthStatus: 'Sehat', notes: 'Koleksi agrowisata.', createdAt: '2025-03-01T08:00:00Z' },
    { id: 'wl-2', name: 'Kambing Etawa', category: 'Mamalia', species: 'Capra aegagrus hircus', count: 6, locationId: 'loc-sontang', locationName: 'Sontang', acquisitionDate: '2025-06-01', healthStatus: 'Sehat', createdAt: '2025-06-01T08:00:00Z' },
  ],
  wildlifeFeeds: [
    { id: 'wf-1', wildlifeId: 'wl-1', wildlifeName: 'Burung Merak', scheduleTime: '07:00', feedType: 'Biji-bijian campur', feedAmount: '500 g', status: 'Terjadwal', officerName: 'Rahmat Hidayat', createdAt: '2026-08-01T08:00:00Z' },
  ],
  inventory: [
    { id: 'inv-1', sku: 'PKN-001', name: 'Pelet Apung Nila', category: 'Pakan', unit: 'sak', stockQty: 25, minStock: 10, unitPrice: 350000, locationId: 'loc-ras', locationName: 'RAS', supplier: 'PT Pakan Nusantara', updatedAt: '2026-08-30T08:00:00Z' },
    { id: 'inv-2', sku: 'PUP-001', name: 'NPK 15-15-15', category: 'Pupuk', unit: 'sak', stockQty: 40, minStock: 20, unitPrice: 480000, locationId: 'loc-kulim', locationName: 'Kulim', supplier: 'CV Tani Jaya', updatedAt: '2026-08-28T08:00:00Z' },
    { id: 'inv-3', sku: 'OBT-001', name: 'Vitamin B Kompleks', category: 'Obat & Vitamin', unit: 'botol', stockQty: 12, minStock: 5, unitPrice: 85000, locationId: 'loc-kulim', locationName: 'Kulim', supplier: 'Toko Ternak Sehat', updatedAt: '2026-08-25T08:00:00Z' },
  ],
  stockMutations: [
    { id: 'sm-1', itemId: 'inv-1', itemName: 'Pelet Apung Nila', type: 'Masuk', quantity: 20, date: '2026-08-29', reason: 'Pembelian', officerName: 'Hendra Wijaya', createdAt: '2026-08-29T08:00:00Z' },
  ],
  purchaseRequests: [
    { id: 'pr-1', requestNo: 'PR-2026-001', itemName: 'Pelet Apung Lele', category: 'Pakan', quantity: 50, unit: 'sak', reason: 'Stok menipis untuk siklus berikutnya', requestedBy: 'Hendra Wijaya', requestDate: '2026-08-28', status: 'Diajukan', createdAt: '2026-08-28T08:00:00Z' },
  ],
  purchaseOrders: [
    { id: 'po-1', poNo: 'PO-2026-001', supplierName: 'PT Pakan Nusantara', itemName: 'Pelet Apung Nila', quantity: 20, unit: 'sak', unitPrice: 350000, totalAmount: 7000000, orderDate: '2026-08-29', expectedDeliveryDate: '2026-09-03', status: 'Dipesan', createdAt: '2026-08-29T08:00:00Z' },
  ],
  tasks: [
    { id: 'tsk-1', title: 'Pemupukan blok sawit A', description: 'Lengkapi pemupukan NPK blok A', assignee: 'Budi Santoso', dueDate: '2026-09-03', priority: 'Tinggi', status: 'Berjalan', relatedModule: 'Kebun', createdAt: '2026-08-30T08:00:00Z' },
    { id: 'tsk-2', title: 'Cek kualitas air kolam A2', assignee: 'Hendra Wijaya', dueDate: '2026-09-01', priority: 'Sedang', status: 'Belum Dimulai', relatedModule: 'Perikanan', createdAt: '2026-08-30T08:00:00Z' },
  ],
  attendance: [
    { id: 'att-1', workerName: 'Budi Santoso', division: 'Peternakan', date: '2026-08-30', checkInTime: '07:05', checkOutTime: '16:30', status: 'Hadir', createdAt: '2026-08-30T08:00:00Z' },
    { id: 'att-2', workerName: 'Hendra Wijaya', division: 'Perikanan', date: '2026-08-30', checkInTime: '06:55', checkOutTime: '16:10', status: 'Hadir', createdAt: '2026-08-30T08:00:00Z' },
    { id: 'att-3', workerName: 'Rahmat Hidayat', division: 'Kebun', date: '2026-08-30', checkInTime: '07:20', checkOutTime: '16:40', status: 'Hadir', createdAt: '2026-08-30T08:00:00Z' },
  ],
  kpis: [
    { id: 'kpi-1', workerName: 'Budi Santoso', division: 'Peternakan', period: '2026-08', attendanceScore: 90, productivityScore: 85, disciplineScore: 95, totalScore: 90, createdAt: '2026-08-30T08:00:00Z' },
  ],
  cashTransactions: [
    { id: 'cash-1', referenceNo: 'KAS-2026-001', date: '2026-08-30', type: 'Masuk', category: 'Penjualan Ikan', description: 'Panen lele kolam A2', amount: 6600000, sourceDivision: 'Perikanan', paymentMethod: 'Transfer Bank', officerName: 'Sari Keuangan', createdAt: '2026-08-30T08:00:00Z' },
    { id: 'cash-2', referenceNo: 'KAS-2026-002', date: '2026-08-30', type: 'Keluar', category: 'Pembelian Pakan', description: 'Pembelian pelet apung', amount: 7000000, sourceDivision: 'Inventory', paymentMethod: 'Transfer Bank', officerName: 'Sari Keuangan', createdAt: '2026-08-30T08:00:00Z' },
  ],
  lpjReports: [
    { id: 'lpj-1', referenceNo: 'LPJ-2026-001', title: 'LPJ Operasional Agustus', division: 'Perikanan', periodStart: '2026-08-01', periodEnd: '2026-08-31', totalAllocated: 15000000, totalSpent: 12200000, remaining: 2800000, status: 'Diverifikasi', items: [
      { id: 'lpj-i1', description: 'Pembelian pelet', category: 'Pakan', amount: 7000000 },
      { id: 'lpj-i2', description: 'Listrik & aerasi', category: 'Operasional', amount: 5200000 },
    ], submittedBy: 'Hendra Wijaya', createdAt: '2026-08-30T08:00:00Z' },
  ],
  approvals: [
    { id: 'appr-1', referenceNo: 'PR-2026-001', type: 'Purchase Order', title: 'Pembelian Pelet Apung Lele', requester: 'Hendra Wijaya', requestedAt: '2026-08-28T08:00:00Z', status: 'Menunggu', notes: '50 sak untuk siklus berikutnya.' },
    { id: 'appr-2', referenceNo: 'LPJ-2026-001', type: 'LPJ', title: 'LPJ Operasional Agustus', requester: 'Hendra Wijaya', requestedAt: '2026-08-30T08:00:00Z', status: 'Menunggu' },
  ],
  masterData: [
    { id: 'md-1', category: 'Divisi', name: 'Peternakan Sapi', value: 'peternakan', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'md-2', category: 'Divisi', name: 'Kebun & Pertanian', value: 'kebun', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'md-3', category: 'Divisi', name: 'Perikanan & Bioflok', value: 'perikanan', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'md-4', category: 'Divisi', name: 'Satwa & Aviari', value: 'satwa', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'md-5', category: 'Satuan', name: 'Kilogram', value: 'kg', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'md-6', category: 'Satuan', name: 'Sak', value: 'sak', isActive: true, createdAt: '2026-01-01T08:00:00Z' },
  ],
};

function load(): AgroState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...INITIAL, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return INITIAL;
}

class AgroStore {
  private state: AgroState = load();
  private listeners = new Set<() => void>();

  snapshot(): AgroState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private commit() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { console.error(e); }
    this.listeners.forEach(l => l());
  }

  // ---- Generic helpers ----
  add<K extends keyof AgroState>(key: K, item: AgroState[K] extends (infer T)[] ? T : never) {
    (this.state[key] as unknown[]) = [item, ...(this.state[key] as unknown[])];
    this.commit();
  }

  update<K extends keyof AgroState>(key: K, id: string, patch: Record<string, unknown>) {
    const list = this.state[key] as Array<{ id: string }>;
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
      this.commit();
    }
  }

  remove<K extends keyof AgroState>(key: K, id: string) {
    (this.state[key] as unknown[]) = (this.state[key] as unknown as Array<{ id: string }>).filter(x => x.id !== id);
    this.commit();
  }
}

export const agroStore = new AgroStore();

export function makeId(prefix: string): string {
  return uid(prefix);
}

/**
 * dataSync — sinkronisasi data terpusat localStorage -> Supabase Postgres.
 *
 * Model:
 *  - PULL (saat login/restore): tabel DB yang berisi data MENANG, menggantikan
 *    array lokal per-key. Tabel DB kosong -> data lokal dipertahankan di memori.
 *  - PUSH (event-driven): setiap `saveStorage(STORAGE_KEYS.X, ...)` memicu push
 *    debounced per-key. Push = diff vs snapshot terakhir: upsert row baru/berubah,
 *    delete row yang hilang (kecuali livestock: soft-delete via deleted_at).
 *
 * RLS database menegakkan peran (lihat supabase/schema.sql). Push memakai JWT
 * user yang sedang login, jadi insert/update/delete otomatis mengikuti policy.
 *
 * Key yang TIDAK disinkron: USERS, SETTINGS, CURRENT_USER (masih lokal).
 */

import { supabase, hasSupabase } from './supabase';
import { storeService, STORAGE_KEYS, syncState } from './storeService';
import type {
  LocationItem, PenItem, LivestockItem, WeightRecord, HealthRecord,
  BreedingRecord, BirthRecord, DeathRecord, TransferRecord, SalesRecord,
  FeedInventory, FinancialTransaction, DailyReport, NotificationItem, AuditLogItem,
} from '../types';

// ---------------------------------------------------------------------------
// Definisi tabel: key localStorage -> tabel DB + kolom whitelist (snake_case).
// ---------------------------------------------------------------------------

type TableDef<T> = {
  table: string;
  columns: string[]; // kolom DB (snake_case) yang dikirim/diterima
  toRow: (item: T) => Record<string, unknown>;
  fromRow: (row: Record<string, unknown>) => T;
};

const DATE_NULL = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

// Helper generik: kamelCase -> snake_case untuk objek datar.
function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    out[key] = v === undefined ? null : v;
  }
  return out;
}

// Helper generik: snake_case -> camelCase.
function snakeToCamel<T>(row: Record<string, unknown>, map: Record<string, keyof T>): T {
  const out = {} as T;
  for (const [snake, camel] of Object.entries(map)) {
    const v = row[snake];
    (out[camel] as unknown) = v === null ? undefined : v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// LOCATIONS
// ---------------------------------------------------------------------------
const LOCATIONS_DEF: TableDef<LocationItem> = {
  table: 'locations',
  columns: ['id', 'name', 'address', 'pic_name', 'pic_phone', 'livestock_types', 'pen_count', 'status', 'notes', 'created_at'],
  toRow: (x) => camelToSnake({
    id: x.id, name: x.name, address: x.address, picName: x.picName, picPhone: x.picPhone,
    livestockTypes: x.livestockTypes ?? [], penCount: x.penCount ?? 0, status: x.status,
    notes: x.notes, createdAt: x.createdAt,
  }),
  fromRow: (r) => ({
    id: String(r.id), name: String(r.name ?? ''), address: String(r.address ?? ''),
    picName: String(r.pic_name ?? ''), picPhone: String(r.pic_phone ?? ''),
    livestockTypes: Array.isArray(r.livestock_types) ? (r.livestock_types as string[]) : [],
    penCount: Number(r.pen_count ?? 0), status: (r.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif'),
    notes: (r.notes as string) ?? undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()),
  }),
};

// ---------------------------------------------------------------------------
// PENS
// ---------------------------------------------------------------------------
const PENS_DEF: TableDef<PenItem> = {
  table: 'pens',
  columns: ['id', 'location_id', 'name', 'capacity', 'current_count', 'notes'],
  toRow: (x) => ({ id: x.id, location_id: x.locationId, name: x.name, capacity: x.capacity, current_count: x.currentCount ?? null, notes: x.notes ?? null }),
  fromRow: (r) => ({
    id: String(r.id), locationId: String(r.location_id ?? ''), name: String(r.name ?? ''),
    capacity: Number(r.capacity ?? 0), currentCount: r.current_count == null ? undefined : Number(r.current_count),
    notes: (r.notes as string) ?? undefined,
  }),
};

// ---------------------------------------------------------------------------
// LIVESTOCK
// ---------------------------------------------------------------------------
const LIVESTOCK_DEF: TableDef<LivestockItem> = {
  table: 'livestock',
  columns: [
    'id', 'tag_id', 'qr_code', 'photo_url', 'type', 'breed', 'gender', 'dob',
    'estimated_age_months', 'color_traits', 'location_id', 'pen_id',
    'ownership_status', 'source', 'entry_date', 'acquisition_price', 'selling_price',
    'price_history', 'initial_weight_kg', 'current_weight_kg', 'health_status',
    'breeding_status', 'mother_id', 'mother_tag', 'father_id', 'father_tag',
    'condition_category', 'status', 'notes', 'location_history', 'created_at',
    'updated_at', 'deleted_at', 'deleted_by',
  ],
  toRow: (x) => camelToSnake({
    id: x.id, tagId: x.tagId, qrCode: x.qrCode, photoUrl: x.photoUrl, type: x.type,
    breed: x.breed, gender: x.gender, dob: DATE_NULL(x.dob), estimatedAgeMonths: x.estimatedAgeMonths,
    colorTraits: x.colorTraits, locationId: x.locationId, penId: x.penId,
    ownershipStatus: x.ownershipStatus, source: x.source, entryDate: DATE_NULL(x.entryDate),
    acquisitionPrice: x.acquisitionPrice ?? 0, sellingPrice: x.sellingPrice ?? null,
    priceHistory: x.priceHistory ?? [], initialWeightKg: x.initialWeightKg ?? 0,
    currentWeightKg: x.currentWeightKg ?? 0, healthStatus: x.healthStatus,
    breedingStatus: x.breedingStatus, motherId: x.motherId ?? null, motherTag: x.motherTag ?? null,
    fatherId: x.fatherId ?? null, fatherTag: x.fatherTag ?? null,
    conditionCategory: x.conditionCategory, status: x.status, notes: x.notes ?? null,
    locationHistory: x.locationHistory ?? [], createdAt: x.createdAt, updatedAt: x.updatedAt,
    deletedAt: x.deletedAt ?? null, deletedBy: x.deletedBy ?? null,
  }),
  fromRow: (r) => ({
    id: String(r.id), tagId: String(r.tag_id ?? ''), qrCode: String(r.qr_code ?? ''),
    photoUrl: (r.photo_url as string) ?? undefined, type: r.type as LivestockItem['type'],
    breed: String(r.breed ?? ''), gender: r.gender as LivestockItem['gender'],
    dob: (r.dob as string) ?? '', estimatedAgeMonths: Number(r.estimated_age_months ?? 0),
    colorTraits: String(r.color_traits ?? ''), locationId: String(r.location_id ?? ''),
    penId: (r.pen_id as string) ?? undefined,
    ownershipStatus: r.ownership_status as LivestockItem['ownershipStatus'],
    source: r.source as LivestockItem['source'],
    entryDate: (r.entry_date as string) ?? '',
    acquisitionPrice: Number(r.acquisition_price ?? 0),
    sellingPrice: r.selling_price == null ? undefined : Number(r.selling_price),
    priceHistory: Array.isArray(r.price_history) ? (r.price_history as LivestockItem['priceHistory']) : [],
    initialWeightKg: Number(r.initial_weight_kg ?? 0),
    currentWeightKg: Number(r.current_weight_kg ?? 0),
    healthStatus: r.health_status as LivestockItem['healthStatus'],
    breedingStatus: r.breeding_status as LivestockItem['breedingStatus'],
    motherId: (r.mother_id as string) ?? undefined, motherTag: (r.mother_tag as string) ?? undefined,
    fatherId: (r.father_id as string) ?? undefined, fatherTag: (r.father_tag as string) ?? undefined,
    conditionCategory: r.condition_category as LivestockItem['conditionCategory'],
    status: r.status as LivestockItem['status'],
    notes: (r.notes as string) ?? undefined,
    locationHistory: Array.isArray(r.location_history) ? (r.location_history as LivestockItem['locationHistory']) : [],
    createdAt: String(r.created_at ?? ''), updatedAt: String(r.updated_at ?? ''),
    deletedAt: (r.deleted_at as string) ?? undefined, deletedBy: (r.deleted_by as string) ?? undefined,
  }),
};

// ---------------------------------------------------------------------------
// WEIGHT / HEALTH / BREEDING / BIRTH / DEATH / TRANSFER
// ---------------------------------------------------------------------------
const WEIGHT_DEF: TableDef<WeightRecord> = {
  table: 'weight_records',
  columns: ['id', 'livestock_id', 'tag_id', 'weigh_date', 'weight_kg', 'previous_weight_kg', 'gain_kg', 'officer_name', 'photo_url', 'notes', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<WeightRecord>(r, {
    id: 'id', livestockId: 'livestockId', tagId: 'tagId', weighDate: 'weighDate',
    weightKg: 'weightKg', previousWeightKg: 'previousWeightKg', gainKg: 'gainKg',
    officerName: 'officerName', photoUrl: 'photoUrl', notes: 'notes', createdAt: 'createdAt',
  }),
};

const HEALTH_DEF: TableDef<HealthRecord> = {
  table: 'health_records',
  columns: ['id', 'livestock_id', 'tag_id', 'record_date', 'condition', 'symptoms', 'action_taken', 'medicine_name', 'dosage', 'officer_name', 'vet_name', 'follow_up_date', 'photo_url', 'status', 'notes', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<HealthRecord>(r, {
    id: 'id', livestockId: 'livestockId', tagId: 'tagId', recordDate: 'recordDate',
    condition: 'condition', symptoms: 'symptoms', actionTaken: 'actionTaken',
    medicineName: 'medicineName', dosage: 'dosage', officerName: 'officerName',
    vetName: 'vetName', followUpDate: 'followUpDate', photoUrl: 'photoUrl',
    status: 'status', notes: 'notes', createdAt: 'createdAt',
  }),
};

const BREEDING_DEF: TableDef<BreedingRecord> = {
  table: 'breeding_records',
  columns: ['id', 'mother_id', 'mother_tag', 'father_id', 'father_tag', 'mating_date', 'method', 'preg_check_date', 'preg_check_result', 'preg_status', 'est_birth_date', 'actual_birth_date', 'offspring_count', 'notes', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<BreedingRecord>(r, {
    id: 'id', motherId: 'motherId', motherTag: 'motherTag', fatherId: 'fatherId',
    fatherTag: 'fatherTag', matingDate: 'matingDate', method: 'method',
    pregCheckDate: 'pregCheckDate', pregCheckResult: 'pregCheckResult', pregStatus: 'pregStatus',
    estBirthDate: 'estBirthDate', actualBirthDate: 'actualBirthDate',
    offspringCount: 'offspringCount', notes: 'notes', createdAt: 'createdAt',
  }),
};

const BIRTHS_DEF: TableDef<BirthRecord> = {
  table: 'birth_records',
  columns: ['id', 'mother_id', 'mother_tag', 'offspring_id', 'offspring_tag', 'location_id', 'birth_date', 'gender', 'birth_weight_kg', 'condition', 'photo_url', 'voided_at', 'voided_by', 'void_reason', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<BirthRecord>(r, {
    id: 'id', motherId: 'motherId', motherTag: 'motherTag', offspringId: 'offspringId',
    offspringTag: 'offspringTag', locationId: 'locationId', birthDate: 'birthDate',
    gender: 'gender', birthWeightKg: 'birthWeightKg', condition: 'condition',
    photoUrl: 'photoUrl', voidedAt: 'voidedAt', voidedBy: 'voidedBy', voidReason: 'voidReason',
    createdAt: 'createdAt',
  }),
};

const DEATHS_DEF: TableDef<DeathRecord> = {
  table: 'death_records',
  columns: ['id', 'livestock_id', 'tag_id', 'death_date', 'death_time', 'location_id', 'suspected_cause', 'symptoms_before', 'handling_note', 'chronology', 'last_condition', 'officer_name', 'vet_name', 'photo_url', 'doc_url', 'confirmed_by', 'previous_livestock_state', 'voided_at', 'voided_by', 'void_reason', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<DeathRecord>(r, {
    id: 'id', livestockId: 'livestockId', tagId: 'tagId', deathDate: 'deathDate',
    deathTime: 'deathTime', locationId: 'locationId', suspectedCause: 'suspectedCause',
    symptomsBefore: 'symptomsBefore', handlingNote: 'handlingNote', chronology: 'chronology',
    lastCondition: 'lastCondition', officerName: 'officerName', vetName: 'vetName',
    photoUrl: 'photoUrl', docUrl: 'docUrl', confirmedBy: 'confirmedBy',
    previousLivestockState: 'previousLivestockState', voidedAt: 'voidedAt', voidedBy: 'voidedBy',
    voidReason: 'voidReason', createdAt: 'createdAt',
  }),
};

const TRANSFERS_DEF: TableDef<TransferRecord> = {
  table: 'transfer_records',
  columns: ['id', 'livestock_id', 'tag_id', 'origin_location_id', 'dest_location_id', 'transfer_date', 'reason', 'officer_name', 'transport', 'notes', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<TransferRecord>(r, {
    id: 'id', livestockId: 'livestockId', tagId: 'tagId', originLocationId: 'originLocationId',
    destLocationId: 'destLocationId', transferDate: 'transferDate', reason: 'reason',
    officerName: 'officerName', transport: 'transport', notes: 'notes', createdAt: 'createdAt',
  }),
};

// ---------------------------------------------------------------------------
// SALES / FEED / FINANCE
// ---------------------------------------------------------------------------
const SALES_DEF: TableDef<SalesRecord> = {
  table: 'sales_records',
  columns: ['id', 'invoice_no', 'date', 'buyer_name', 'buyer_phone', 'livestock_ids', 'weight_total_kg', 'price_total', 'acquisition_cost_total', 'payment_method', 'payment_status', 'location_id', 'proof_url', 'doc_url', 'sales_rep', 'transaction_status', 'linked_finance_transaction_ids', 'pre_sale_livestock_snapshots', 'voided_at', 'voided_by', 'void_reason', 'notes', 'created_by', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<SalesRecord>(r, {
    id: 'id', invoiceNo: 'invoiceNo', date: 'date', buyerName: 'buyerName',
    buyerPhone: 'buyerPhone', livestockIds: 'livestockIds', weightTotalKg: 'weightTotalKg',
    priceTotal: 'priceTotal', acquisitionCostTotal: 'acquisitionCostTotal',
    paymentMethod: 'paymentMethod', paymentStatus: 'paymentStatus', locationId: 'locationId',
    proofUrl: 'proofUrl', docUrl: 'docUrl', salesRep: 'salesRep',
    transactionStatus: 'transactionStatus', linkedFinanceTransactionIds: 'linkedFinanceTransactionIds',
    preSaleLivestockSnapshots: 'preSaleLivestockSnapshots', voidedAt: 'voidedAt',
    voidedBy: 'voidedBy', voidReason: 'voidReason', notes: 'notes', createdBy: 'createdBy',
    createdAt: 'createdAt',
  }),
};

const FEED_DEF: TableDef<FeedInventory> = {
  table: 'feed_inventory',
  columns: ['id', 'location_id', 'feed_type', 'stock_qty', 'stock_in', 'stock_out', 'unit', 'min_stock', 'unit_price', 'supplier', 'archived_at', 'archived_by', 'updated_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<FeedInventory>(r, {
    id: 'id', locationId: 'locationId', feedType: 'feedType', stockQty: 'stockQty',
    stockIn: 'stockIn', stockOut: 'stockOut', unit: 'unit', minStock: 'minStock',
    unitPrice: 'unitPrice', supplier: 'supplier', archivedAt: 'archivedAt',
    archivedBy: 'archivedBy', updatedAt: 'updatedAt',
  }),
};

const FINANCE_DEF: TableDef<FinancialTransaction> = {
  table: 'financial_transactions',
  columns: ['id', 'invoice_no', 'date', 'type', 'category', 'description', 'location_id', 'amount', 'payment_method', 'payee_payer', 'proof_url', 'created_by', 'notes', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<FinancialTransaction>(r, {
    id: 'id', invoiceNo: 'invoiceNo', date: 'date', type: 'type', category: 'category',
    description: 'description', locationId: 'locationId', amount: 'amount',
    paymentMethod: 'paymentMethod', payeePayer: 'payeePayer', proofUrl: 'proofUrl',
    createdBy: 'createdBy', notes: 'notes', createdAt: 'createdAt',
  }),
};

// ---------------------------------------------------------------------------
// DAILY REPORTS / NOTIFICATIONS / AUDIT
// ---------------------------------------------------------------------------
const REPORTS_DEF: TableDef<DailyReport> = {
  table: 'daily_reports',
  columns: ['id', 'date', 'location_id', 'pop_initial', 'pop_purchase', 'pop_birth', 'pop_transfer_in', 'pop_sales', 'pop_death', 'pop_transfer_out', 'pop_final', 'healthy_count', 'sick_count', 'isolation_count', 'in_treatment_count', 'activities_text', 'expenses_list', 'photos', 'officer_notes', 'report_status', 'created_by', 'submitted_at', 'reviewed_by', 'reviewed_at', 'archived_at', 'archived_by', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<DailyReport>(r, {
    id: 'id', date: 'date', locationId: 'locationId', popInitial: 'popInitial',
    popPurchase: 'popPurchase', popBirth: 'popBirth', popTransferIn: 'popTransferIn',
    popSales: 'popSales', popDeath: 'popDeath', popTransferOut: 'popTransferOut',
    popFinal: 'popFinal', healthyCount: 'healthyCount', sickCount: 'sickCount',
    isolationCount: 'isolationCount', inTreatmentCount: 'inTreatmentCount',
    activitiesText: 'activitiesText', expensesList: 'expensesList', photos: 'photos',
    officerNotes: 'officerNotes', reportStatus: 'reportStatus', createdBy: 'createdBy',
    submittedAt: 'submittedAt', reviewedBy: 'reviewedBy', reviewedAt: 'reviewedAt',
    archivedAt: 'archivedAt', archivedBy: 'archivedBy', createdAt: 'createdAt',
  }),
};

const NOTIFICATIONS_DEF: TableDef<NotificationItem> = {
  table: 'notifications',
  columns: ['id', 'title', 'message', 'severity', 'category', 'location_id', 'is_read', 'created_at'],
  toRow: (x) => camelToSnake({ ...x }),
  fromRow: (r) => snakeToCamel<NotificationItem>(r, {
    id: 'id', title: 'title', message: 'message', severity: 'severity',
    category: 'category', locationId: 'locationId', isRead: 'isRead', createdAt: 'createdAt',
  }),
};

const AUDIT_DEF: TableDef<AuditLogItem> = {
  table: 'audit_logs',
  columns: ['id', 'user_id', 'user_name', 'user_role', 'module', 'action', 'target_id', 'target_name', 'before_value', 'after_value', 'created_at'],
  toRow: (x) => camelToSnake({ ...x, timestamp: undefined }),
  fromRow: (r) => {
    const base = snakeToCamel<AuditLogItem>(r, {
      id: 'id', userId: 'userId', userName: 'userName', userRole: 'userRole',
      module: 'module', action: 'action', targetId: 'targetId', targetName: 'targetName',
      beforeValue: 'beforeValue', afterValue: 'afterValue',
    });
    return { ...base, timestamp: String(r.created_at ?? new Date().toISOString()) };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

type StoreKeyGetter = () => Record<string, unknown[]>;

interface SyncMapping {
  key: string;
  def: TableDef<never>;
  get: () => unknown[];
  set: (items: unknown[]) => void;
  /** Pull hanya mengganti lokal jika DB berisi data. */
}

const MAPPINGS: SyncMapping[] = [
  { key: STORAGE_KEYS.LOCATIONS, def: LOCATIONS_DEF as unknown as TableDef<never>, get: () => storeService.locations, set: (v) => { storeService.locations = v as never; } },
  { key: STORAGE_KEYS.PENS, def: PENS_DEF as unknown as TableDef<never>, get: () => storeService.pens, set: (v) => { storeService.pens = v as never; } },
  { key: STORAGE_KEYS.LIVESTOCK, def: LIVESTOCK_DEF as unknown as TableDef<never>, get: () => storeService.livestock, set: (v) => { storeService.livestock = v as never; } },
  { key: STORAGE_KEYS.WEIGHT, def: WEIGHT_DEF as unknown as TableDef<never>, get: () => storeService.weightRecords, set: (v) => { storeService.weightRecords = v as never; } },
  { key: STORAGE_KEYS.HEALTH, def: HEALTH_DEF as unknown as TableDef<never>, get: () => storeService.healthRecords, set: (v) => { storeService.healthRecords = v as never; } },
  { key: STORAGE_KEYS.BREEDING, def: BREEDING_DEF as unknown as TableDef<never>, get: () => storeService.breedingRecords, set: (v) => { storeService.breedingRecords = v as never; } },
  { key: STORAGE_KEYS.BIRTHS, def: BIRTHS_DEF as unknown as TableDef<never>, get: () => storeService.birthRecords, set: (v) => { storeService.birthRecords = v as never; } },
  { key: STORAGE_KEYS.DEATHS, def: DEATHS_DEF as unknown as TableDef<never>, get: () => storeService.deathRecords, set: (v) => { storeService.deathRecords = v as never; } },
  { key: STORAGE_KEYS.TRANSFERS, def: TRANSFERS_DEF as unknown as TableDef<never>, get: () => storeService.transferRecords, set: (v) => { storeService.transferRecords = v as never; } },
  { key: STORAGE_KEYS.SALES, def: SALES_DEF as unknown as TableDef<never>, get: () => storeService.salesRecords, set: (v) => { storeService.salesRecords = v as never; } },
  { key: STORAGE_KEYS.FEED, def: FEED_DEF as unknown as TableDef<never>, get: () => storeService.feedInventory, set: (v) => { storeService.feedInventory = v as never; } },
  { key: STORAGE_KEYS.FINANCE, def: FINANCE_DEF as unknown as TableDef<never>, get: () => storeService.financialTransactions, set: (v) => { storeService.financialTransactions = v as never; } },
  { key: STORAGE_KEYS.DAILY_REPORTS, def: REPORTS_DEF as unknown as TableDef<never>, get: () => storeService.dailyReports, set: (v) => { storeService.dailyReports = v as never; } },
  { key: STORAGE_KEYS.NOTIFICATIONS, def: NOTIFICATIONS_DEF as unknown as TableDef<never>, get: () => storeService.notifications, set: (v) => { storeService.notifications = v as never; } },
  { key: STORAGE_KEYS.AUDIT_LOGS, def: AUDIT_DEF as unknown as TableDef<never>, get: () => storeService.auditLogs, set: (v) => { storeService.auditLogs = v as never; } },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const PUSH_DEBOUNCE_MS = 400;

/** Snapshot terakhir yang diketahui tersinkron, per storage key. */
const lastSynced = new Map<string, string>(); // key -> JSON array tersinkron

function serialize<T>(items: T[], def: TableDef<T>): string {
  return JSON.stringify(items.map((x) => def.toRow(x)));
}

class DataSync {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private pulling = false;
  public enabled = false;

  /** Aktifkan sync setelah login Supabase sukses. */
  async enable(): Promise<void> {
    if (!hasSupabase() || this.enabled) return;
    this.enabled = true;
    await this.pullAll();
  }

  disable(): void {
    this.enabled = false;
    lastSynced.clear();
  }

  /** PULL: tabel DB berisi data -> menang; tabel kosong -> biarkan lokal. */
  async pullAll(): Promise<void> {
    const client = supabase();
    if (!client || this.pulling) return;
    this.pulling = true;
    syncState.paused = true; // set/filter saat pull tidak boleh memicu push
    try {
      let changed = false;
      for (const m of MAPPINGS) {
        try {
          const { data, error } = await client.from(m.def.table).select('*');
          if (error) { console.warn(`[dataSync] pull ${m.def.table}:`, error.message); continue; }
          if (!data || data.length === 0) {
            // DB kosong. Bedakan seed demo vs data tersimpan asli:
            // - localStorage belum pernah di-save (null) -> in-memory murni seed
            //   demo -> bersihkan (produksi mulai dari nol, dummy tidak ikut push).
            // - ada data tersimpan -> pertahankan (kemungkinan data asli user,
            //   akan ter-push pada mutasi berikutnya / pushAll).
            const raw = localStorage.getItem(m.key);
            if (raw === null) {
              m.set([] as never[]);
              lastSynced.set(m.key, '[]');
              changed = true;
            } else {
              lastSynced.set(m.key, serialize(m.get() as never[], m.def as never));
            }
            continue;
          }
          const rows = data as Record<string, unknown>[];
          const items = rows.map((r) => (m.def as TableDef<never>).fromRow(r));
          m.set(items as never[]);
          lastSynced.set(m.key, JSON.stringify(rows));
          changed = true;
        } catch (e) {
          console.warn(`[dataSync] pull ${m.def.table} exception:`, e);
        }
      }
      if (changed) storeService.notifyListeners();
    } finally {
      syncState.paused = false;
      this.pulling = false;
    }
  }

  /** Dipanggil dari saveStorage (storeService) setiap kali array disimpan. */
  onStoreSaved(key: string): void {
    if (!this.enabled || !supabase() || syncState.paused) return;
    const m = MAPPINGS.find((x) => x.key === key);
    if (!m) return;
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);
    this.timers.set(key, setTimeout(() => {
      this.timers.delete(key);
      void this.pushKey(m);
    }, PUSH_DEBOUNCE_MS));
  }

  private async pushKey(m: SyncMapping): Promise<void> {
    const client = supabase();
    if (!client) return;
    const def = m.def as TableDef<never>;
    const items = m.get();
    const currentRows = items.map((x) => def.toRow(x as never));
    const currentJson = JSON.stringify(currentRows);
    const prevJson = lastSynced.get(m.key);

    // Tidak ada perubahan sejak sinkron terakhir -> skip.
    if (prevJson !== undefined) {
      if (prevJson === currentJson) return;
    }

    const prevRows: Record<string, unknown>[] = prevJson ? JSON.parse(prevJson) : [];
    const prevById = new Map(prevRows.map((r) => [String(r.id), r]));
    const currentIds = new Set(currentRows.map((r) => String(r.id)));

    // 1) Upsert row baru / berubah
    const changed = currentRows.filter((r) => {
      const prev = prevById.get(String(r.id));
      return !prev || JSON.stringify(prev) !== JSON.stringify(r);
    });
    // 2) Delete row yang hilang (livestock pakai soft-delete, tidak pernah hard delete)
    const removedIds = prevRows
      .map((r) => String(r.id))
      .filter((id) => !currentIds.has(id))
      .filter((id) => def.table !== 'livestock');

    try {
      if (changed.length > 0) {
        const payload = changed.map((r) => {
          const row: Record<string, unknown> = {};
          for (const col of def.columns) row[col] = r[col] === undefined ? null : r[col];
          return row;
        });
        const { error } = await client.from(def.table).upsert(payload, { onConflict: 'id' });
        if (error) { console.warn(`[dataSync] upsert ${def.table}:`, error.message); return; }
      }
      if (removedIds.length > 0) {
        const { error } = await client.from(def.table).delete().in('id', removedIds);
        if (error) { console.warn(`[dataSync] delete ${def.table}:`, error.message); return; }
      }
      lastSynced.set(m.key, currentJson);
    } catch (e) {
      console.warn(`[dataSync] push ${def.table} exception:`, e);
    }
  }

  /** Force-push semua key (dipakai tombol import manual Owner). */
  async pushAll(): Promise<void> {
    for (const m of MAPPINGS) {
      lastSynced.delete(m.key); // paksa diff terhadap undefined => push penuh
      await this.pushKey(m);
    }
  }
}

export const dataSync = new DataSync();

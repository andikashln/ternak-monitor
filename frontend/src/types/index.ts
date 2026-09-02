export type UserRole = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'MITRA' | 'ADMIN' | 'USER' | 'DEVELOPER';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  locationIds: string[]; // empty means all locations
  phone?: string;
  status: 'Aktif' | 'Nonaktif';
  avatarUrl?: string;
}

export interface ManagedUser extends UserProfile {
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationItem {
  id: string;
  name: string;
  address: string;
  picName: string;
  picPhone: string;
  livestockTypes: string[];
  penCount: number;
  status: 'Aktif' | 'Nonaktif';
  notes?: string;
  createdAt: string;
}

export interface PenItem {
  id: string;
  locationId: string;
  name: string;
  capacity: number;
  currentCount?: number;
  notes?: string;
}

export type LivestockType = 'Sapi' | 'Kerbau' | 'Kambing' | 'Domba';
export type GenderType = 'Jantan' | 'Betina';
export type HealthStatusType = 'Sehat' | 'Perlu Pemantauan' | 'Sakit' | 'Isolasi' | 'Kritis' | 'Selesai Perawatan';
export type BreedingStatusType = 'Belum Dikawinkan' | 'Dikawinkan' | 'Menunggu Pemeriksaan' | 'Bunting' | 'Tidak Bunting' | 'Melahirkan';
export type ConditionCategoryType = 'Baik' | 'Standar' | 'Kurang Baik';
export type LivestockStatusType = 'Aktif' | 'Sakit' | 'Isolasi' | 'Dijual' | 'Mati' | 'Keluar' | 'Dipindahkan';

export interface LocationHistoryItem {
  date: string;
  fromLocationName: string;
  toLocationName: string;
  reason: string;
  officerName: string;
}

export interface PriceHistoryItem {
  id: string;
  changedAt: string;
  oldPurchasePrice?: number;
  newPurchasePrice: number;
  oldSellingPrice?: number;
  newSellingPrice: number;
  changedBy: string;
  note: string;
}

export interface LivestockItem {
  id: string;
  tagId: string; // Ear Tag / ID Ternak
  qrCode: string;
  photoUrl?: string;
  type: LivestockType;
  breed: string; // Ras (e.g. Simmental, Limosin, Brahman, PO, Toraya)
  gender: GenderType;
  dob: string;
  estimatedAgeMonths: number;
  colorTraits: string;
  locationId: string;
  locationName?: string;
  penId?: string;
  penName?: string;
  ownershipStatus: 'Milik Mandiri' | 'Mitra' | 'Bagi Hasil' | 'Titipan';
  source: 'Pembelian' | 'Kelahiran Kandang' | 'Hibah/Bantuan';
  entryDate: string;
  acquisitionPrice: number;
  sellingPrice?: number;
  priceHistory?: PriceHistoryItem[];
  initialWeightKg: number;
  currentWeightKg: number;
  healthStatus: HealthStatusType;
  breedingStatus: BreedingStatusType;
  motherId?: string;
  motherTag?: string;
  fatherId?: string;
  fatherTag?: string;
  conditionCategory: ConditionCategoryType;
  status: LivestockStatusType;
  notes?: string;
  locationHistory?: LocationHistoryItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface WeightRecord {
  id: string;
  livestockId: string;
  tagId: string;
  weighDate: string;
  weightKg: number;
  previousWeightKg: number;
  gainKg: number;
  officerName: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  livestockId: string;
  tagId: string;
  recordDate: string;
  condition: string;
  symptoms: string;
  actionTaken: string;
  medicineName?: string;
  dosage?: string;
  officerName: string;
  vetName?: string;
  followUpDate?: string;
  photoUrl?: string;
  status: HealthStatusType;
  notes?: string;
  createdAt: string;
}

export interface BreedingRecord {
  id: string;
  motherId: string;
  motherTag: string;
  fatherId?: string;
  fatherTag?: string;
  matingDate: string;
  method: 'Alami' | 'Inseminasi Buatan (IB)';
  pregCheckDate?: string;
  pregCheckResult?: string;
  pregStatus: 'Belum' | 'Positif' | 'Negatif';
  estBirthDate?: string;
  actualBirthDate?: string;
  offspringCount?: number;
  notes?: string;
  createdAt: string;
}

export interface BirthRecord {
  id: string; motherId: string; motherTag: string; offspringId: string; offspringTag: string;
  locationId: string; birthDate: string; gender: GenderType; birthWeightKg: number; condition: string;
  photoUrl?: string; voidedAt?: string; voidedBy?: string; voidReason?: string; createdAt: string;
}

export type FinancialCategoryType = 'Pakan' | 'Obat & Vitamin' | 'Pembelian Ternak' | 'Penjualan Ternak' | 'Tenaga Kerja' | 'Transportasi' | 'Operasional Lainnya';

export interface DeathRecord {
  id: string;
  livestockId: string;
  tagId: string;
  deathDate: string;
  deathTime?: string;
  locationId: string;
  locationName?: string;
  suspectedCause: string;
  symptomsBefore?: string;
  handlingNote?: string;
  chronology?: string;
  lastCondition?: string;
  officerName: string;
  vetName?: string;
  photoUrl?: string; // Required documentation photo
  docUrl?: string;
  confirmedBy?: string;
  previousLivestockState?: LivestockStateSnapshot;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
}

/** State that must be restored when a death record is voided. */
export interface LivestockStateSnapshot {
  status: LivestockStatusType;
  healthStatus: HealthStatusType;
  notes?: string;
}

export interface TransferRecord {
  id: string;
  livestockId: string;
  tagId: string;
  originLocationId: string;
  originLocationName: string;
  destLocationId: string;
  destLocationName: string;
  transferDate: string;
  reason: string;
  officerName: string;
  transport?: string;
  notes?: string;
  createdAt: string;
}

export interface SalesRecord {
  id: string;
  invoiceNo: string;
  date: string;
  buyerName: string;
  buyerPhone: string;
  livestockIds: string[];
  weightTotalKg: number;
  priceTotal: number;
  acquisitionCostTotal?: number;
  paymentMethod: string;
  paymentStatus: 'Belum Bayar' | 'DP' | 'Lunas';
  locationId: string;
  locationName: string;
  proofUrl?: string;
  docUrl?: string;
  salesRep: string;
  transactionStatus: 'Draft' | 'Diproses' | 'Selesai' | 'Batal';
  linkedFinanceTransactionIds?: string[];
  preSaleLivestockSnapshots?: Array<{ livestockId: string; status: LivestockStatusType; notes?: string }>;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface FeedInventory {
  id: string;
  locationId: string;
  locationName: string;
  feedType: string; // e.g. Konsentrat, Rumput Gajah, Silase, Vanda, Mineral Block
  stockQty: number;
  stockIn?: number;
  stockOut?: number;
  unit: string; // kg, sak, ton
  minStock: number;
  unitPrice: number;
  supplier: string;
  archivedAt?: string;
  archivedBy?: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  invoiceNo: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  locationId: string;
  locationName: string;
  amount: number;
  paymentMethod: string;
  payeePayer: string;
  proofUrl?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
}

export interface DailyReportExpense {
  category: string;
  amount: number;
  description: string;
  hasProof: boolean;
}

export interface DailyReport {
  id: string;
  date: string;
  locationId: string;
  locationName: string;
  // Population balance math
  popInitial: number;
  popPurchase: number;
  popBirth: number;
  popTransferIn: number;
  popSales: number;
  popDeath: number;
  popTransferOut: number;
  popFinal: number; // Formula: Initial + Purchase + Birth + TransferIn - Sales - Death - TransferOut
  // Health
  healthyCount: number;
  sickCount: number;
  isolationCount: number;
  inTreatmentCount: number;
  // Daily activity notes
  activitiesText: string;
  expensesList: DailyReportExpense[];
  photos: string[];
  officerNotes?: string;
  reportStatus: 'Draft' | 'Dikirim' | 'Diperiksa' | 'Disetujui' | 'Revisi';
  createdBy: string;
  createdAt: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  locationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  module: string;
  action: string;
  targetId: string;
  targetName: string;
  beforeValue?: string;
  afterValue?: string;
}

export interface BusinessSettings {
  companyName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  phone: string;
  ownerName: string;
  currency: string;
  timezone: string;
  expenseCategories: string[];
  incomeCategories: string[];
}

// ============================================================================
// DIVISI BARU — KEBUN & PERTANIAN
// ============================================================================

export type CropDivision = 'Tanaman Jangka Panjang' | 'Sayuran Jangka Pendek';

export interface CropRecord {
  id: string;
  name: string;
  division: CropDivision;
  variety: string;
  locationId: string;
  locationName: string;
  plotAreaM2: number;
  plantedDate: string;
  estimatedHarvestDate: string;
  status: 'Persiapan' | 'Tanam' | 'Tumbuh' | 'Panen' | 'Gagal';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropActivityRecord {
  id: string;
  cropId: string;
  cropName: string;
  activityType: 'Pemupukan' | 'Penyiraman' | 'Penyiangan' | 'Penyemprotan' | 'Pemanenan' | 'Lainnya';
  date: string;
  officerName: string;
  materialUsed?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  createdAt: string;
}

export interface GardenDocumentRecord {
  id: string;
  docType: 'Invoice Kebun' | 'Surat Jalan' | 'SOP' | 'Foto Dokumentasi';
  title: string;
  date: string;
  partyName: string;
  fileName?: string;
  notes?: string;
  createdAt: string;
}

// ============================================================================
// DIVISI BARU — PERIKANAN & BIOFLOK
// ============================================================================

export interface PondRecord {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  type: 'Bioflok' | 'Kolam Tanah' | 'Kolam Terpal' | 'Keramba';
  species: string;
  areaM2: number;
  volumeM3: number;
  stockingDate: string;
  stockingCount: number;
  estimatedHarvestDate: string;
  status: 'Persiapan' | 'Aktif' | 'Panen' | 'Kosong';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaterQualityRecord {
  id: string;
  pondId: string;
  pondName: string;
  date: string;
  ph: number;
  dissolvedOxygen: number; // mg/L
  temperature: number; // °C
  ammonia?: number;
  nitrite?: number;
  officerName: string;
  notes?: string;
  createdAt: string;
}

export interface FishFeedLog {
  id: string;
  pondId: string;
  pondName: string;
  date: string;
  feedType: string;
  feedAmountKg: number;
  biomassKg: number;
  fcr?: number;
  officerName: string;
  notes?: string;
  createdAt: string;
}

export interface FishHarvestRecord {
  id: string;
  pondId: string;
  pondName: string;
  harvestDate: string;
  totalWeightKg: number;
  totalFishCount: number;
  averageWeightKg: number;
  buyerName: string;
  pricePerKg: number;
  totalRevenue: number;
  notes?: string;
  createdAt: string;
}

// ============================================================================
// DIVISI BARU — SATWA & AVIARI
// ============================================================================

export interface WildlifeRecord {
  id: string;
  name: string;
  category: 'Aviari (Burung)' | 'Mamalia' | 'Reptil' | 'Lainnya';
  species: string;
  count: number;
  locationId: string;
  locationName: string;
  acquisitionDate: string;
  healthStatus: 'Sehat' | 'Sakit' | 'Dalam Perawatan';
  notes?: string;
  createdAt: string;
}

export interface WildlifeFeedSchedule {
  id: string;
  wildlifeId: string;
  wildlifeName: string;
  scheduleTime: string;
  feedType: string;
  feedAmount: string;
  status: 'Terjadwal' | 'Selesai' | 'Terlewat';
  lastFedAt?: string;
  officerName: string;
  notes?: string;
  createdAt: string;
}

// ============================================================================
// DIVISI BARU — INVENTORY & PURCHASING
// ============================================================================

export type InventoryCategory = 'Pakan' | 'Obat & Vitamin' | 'Peralatan' | 'Bibit/Benih' | 'Pupuk' | 'Bahan Bakar' | 'Lainnya';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  stockQty: number;
  minStock: number;
  unitPrice: number;
  locationId: string;
  locationName: string;
  supplier?: string;
  updatedAt: string;
}

export interface StockMutation {
  id: string;
  itemId: string;
  itemName: string;
  type: 'Masuk' | 'Keluar';
  quantity: number;
  date: string;
  reason: string;
  officerName: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  requestNo: string;
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  reason: string;
  requestedBy: string;
  requestDate: string;
  status: 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'Draft' | 'Dipesan' | 'Diterima' | 'Batal';
  notes?: string;
  createdAt: string;
}

// ============================================================================
// DIVISI BARU — OPERASIONAL
// ============================================================================

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  assigneeRole?: UserRole;
  dueDate: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  status: 'Belum Dimulai' | 'Berjalan' | 'Selesai' | 'Tertunda';
  relatedModule?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  workerName: string;
  division: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  notes?: string;
  createdAt: string;
}

export interface KpiScore {
  id: string;
  workerName: string;
  division: string;
  period: string; // YYYY-MM
  attendanceScore: number;
  productivityScore: number;
  disciplineScore: number;
  totalScore: number; // weighted
  notes?: string;
  createdAt: string;
}

// ============================================================================
// DIVISI BARU — KEUANGAN (KAS & LPJ & APPROVAL)
// ============================================================================

export interface CashTransaction {
  id: string;
  referenceNo: string;
  date: string;
  type: 'Masuk' | 'Keluar';
  category: string;
  description: string;
  amount: number;
  sourceDivision: string;
  paymentMethod: string;
  officerName: string;
  notes?: string;
  createdAt: string;
}

export interface LpjReport {
  id: string;
  referenceNo: string;
  fundRequestId?: string;
  title: string;
  division: string;
  periodStart: string;
  periodEnd: string;
  totalAllocated: number;
  totalSpent: number;
  remaining: number;
  status: 'Draft' | 'Diajukan' | 'Diverifikasi' | 'Disetujui' | 'Revisi';
  items: LpjItem[];
  submittedBy: string;
  createdAt: string;
}

export interface LpjItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  proofUrl?: string;
}

export interface ApprovalRequest {
  id: string;
  referenceNo: string;
  type: 'Pengajuan Dana' | 'Purchase Order' | 'LPJ' | 'Invoice';
  title: string;
  requester: string;
  requestedAt: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface MasterDataItem {
  id: string;
  category: 'Role' | 'Lokasi' | 'Kategori Biaya' | 'Satuan' | 'Divisi';
  name: string;
  value: string;
  isActive: boolean;
  createdAt: string;
}

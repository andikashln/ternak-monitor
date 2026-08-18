// User & Authentication Types
export type UserRole = 'OWNER' | 'ADMIN' | 'USER';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  locationIds: string[];
  phone?: string;
  status: 'Aktif' | 'Nonaktif';
  avatarUrl?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface JWTPayload {
  uid: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Livestock Types
export type LivestockType = 'Sapi' | 'Kerbau' | 'Kambing' | 'Domba';
export type GenderType = 'Jantan' | 'Betina';
export type HealthStatusType = 'Sehat' | 'Perlu Pemantauan' | 'Sakit' | 'Isolasi' | 'Kritis' | 'Selesai Perawatan';
export type BreedingStatusType = 'Belum Dikawinkan' | 'Dikawinkan' | 'Menunggu Pemeriksaan' | 'Bunting' | 'Tidak Bunting' | 'Melahirkan';
export type ConditionCategoryType = 'Baik' | 'Standar' | 'Kurang Baik';
export type LivestockStatusType = 'Aktif' | 'Sakit' | 'Isolasi' | 'Dijual' | 'Mati' | 'Keluar' | 'Dipindahkan';

export interface LivestockItem {
  id: string;
  tagId: string;
  qrCode: string;
  type: LivestockType;
  breed: string;
  gender: GenderType;
  dob: string;
  estimatedAgeMonths: number;
  colorTraits: string;
  locationId: string;
  locationName: string;
  penId: string;
  penName: string;
  ownershipStatus: string;
  source: string;
  entryDate: string;
  acquisitionPrice: number;
  initialWeightKg: number;
  currentWeightKg: number;
  healthStatus: HealthStatusType;
  breedingStatus: BreedingStatusType;
  conditionCategory: ConditionCategoryType;
  status: LivestockStatusType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Location Types
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

// Weight Record
export interface WeightRecord {
  id: string;
  livestockId: string;
  tagId: string;
  weighDate: string;
  weightKg: number;
  previousWeightKg: number;
  gainKg: number;
  officerName: string;
  notes?: string;
  createdAt: string;
}

// Health Record
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
  status: HealthStatusType;
  notes?: string;
  createdAt: string;
}

// Breeding Record
export interface BreedingRecord {
  id: string;
  motherId: string;
  motherTag: string;
  fatherTag: string;
  matingDate: string;
  method: string;
  pregCheckDate?: string;
  pregCheckResult?: string;
  pregStatus?: string;
  estBirthDate?: string;
  offspringCount?: number;
  notes?: string;
  createdAt: string;
}

// Financial Transaction
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
  createdBy: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

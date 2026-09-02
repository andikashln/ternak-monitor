import type { UserRole } from '../types';

export type WorkspaceModule =
  | 'dashboard' | 'livestock' | 'health' | 'births-deaths' | 'transactions'
  | 'sales-results' | 'finance' | 'expenses' | 'feed' | 'daily-reports'
  | 'reports' | 'funding-docs' | 'invoices' | 'users' | 'settings'
  // FINANCE CONTROL
  | 'finance-dashboard' | 'approval-center' | 'cash-flow' | 'lpj'
  // KEBUN & PERTANIAN
  | 'crop-longterm' | 'crop-shortterm' | 'crop-activity' | 'garden-docs'
  // PERIKANAN & BIOFLOK
  | 'ponds' | 'water-quality' | 'fish-feed' | 'fish-harvest' | 'fish-docs'
  // SATWA & AVIARI
  | 'wildlife' | 'wildlife-feed'
  // INVENTORY & PURCHASING
  | 'inventory' | 'purchase-request' | 'purchase-order'
  // OPERASIONAL
  | 'daily-report' | 'task-management' | 'attendance' | 'kpi'
  // REPORT & SYSTEM
  | 'master-data' | 'audit-trail';

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Akuntan',
  MITRA: 'Mitra',
  ADMIN: 'Administrator',
  USER: 'Customer',
  DEVELOPER: 'Developer',
};

const FULL_ACCESS: WorkspaceModule[] = [
  'dashboard', 'livestock', 'health', 'births-deaths', 'transactions',
  'sales-results', 'finance', 'expenses', 'feed', 'daily-reports', 'reports',
  'funding-docs', 'invoices', 'users', 'settings',
  'finance-dashboard', 'approval-center', 'cash-flow', 'lpj',
  'crop-longterm', 'crop-shortterm', 'crop-activity', 'garden-docs',
  'ponds', 'water-quality', 'fish-feed', 'fish-harvest', 'fish-docs',
  'wildlife', 'wildlife-feed',
  'inventory', 'purchase-request', 'purchase-order',
  'daily-report', 'task-management', 'attendance', 'kpi',
  'master-data', 'audit-trail',
];

// Manager: semua kecuali manajemen pengguna, pengaturan, master data, audit trail (Developer/Owner only)
const MANAGER_ACCESS: WorkspaceModule[] = FULL_ACCESS.filter(
  module => !['users', 'settings', 'master-data', 'audit-trail'].includes(module)
);

// Akuntan: fokus keuangan & laporan
const ACCOUNTANT_ACCESS: WorkspaceModule[] = [
  'dashboard', 'transactions', 'sales-results', 'finance', 'expenses', 'reports',
  'funding-docs', 'invoices',
  'finance-dashboard', 'approval-center', 'cash-flow', 'lpj',
  'inventory', 'purchase-request', 'purchase-order',
];

// Mitra: akses terbatas operasional divisi yang dikelola
const MITRA_ACCESS: WorkspaceModule[] = [
  'livestock', 'feed', 'funding-docs',
  'crop-longterm', 'crop-shortterm', 'crop-activity',
  'ponds', 'water-quality', 'fish-feed', 'fish-harvest',
  'wildlife', 'wildlife-feed',
  'daily-report', 'task-management',
];

const ROLE_ACCESS: Record<UserRole, WorkspaceModule[]> = {
  OWNER: FULL_ACCESS,
  MANAGER: MANAGER_ACCESS,
  ACCOUNTANT: ACCOUNTANT_ACCESS,
  MITRA: MITRA_ACCESS,
  ADMIN: FULL_ACCESS,
  USER: [],
  // Developer: akses penuh + fokus master data & audit & integrasi
  DEVELOPER: FULL_ACCESS,
};

export function canAccess(role: UserRole, module: WorkspaceModule): boolean {
  return ROLE_ACCESS[role]?.includes(module) ?? false;
}

export function canResetDemoData(role: UserRole): boolean {
  return role === 'OWNER' || role === 'DEVELOPER';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'OWNER' || role === 'DEVELOPER';
}

export function canManageMasterData(role: UserRole): boolean {
  return role === 'OWNER' || role === 'DEVELOPER';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

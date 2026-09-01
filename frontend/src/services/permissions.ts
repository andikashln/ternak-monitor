import type { UserRole } from '../types';

export type WorkspaceModule =
  | 'dashboard' | 'livestock' | 'health' | 'births-deaths' | 'transactions'
  | 'sales-results' | 'finance' | 'expenses' | 'feed' | 'daily-reports'
  | 'reports' | 'funding-docs' | 'invoices' | 'users' | 'settings';

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Akuntan',
  MITRA: 'Mitra',
  ADMIN: 'Administrator',
  USER: 'Customer',
};

const FULL_ACCESS: WorkspaceModule[] = [
  'dashboard', 'livestock', 'health', 'births-deaths', 'transactions',
  'sales-results', 'finance', 'expenses', 'feed', 'daily-reports', 'reports', 'funding-docs', 'invoices', 'users', 'settings',
];

const ROLE_ACCESS: Record<UserRole, WorkspaceModule[]> = {
  OWNER: FULL_ACCESS,
  MANAGER: FULL_ACCESS.filter(module => module !== 'users' && module !== 'settings'),
  ACCOUNTANT: ['dashboard', 'transactions', 'sales-results', 'finance', 'expenses', 'reports', 'funding-docs', 'invoices'],
  MITRA: ['livestock', 'feed', 'funding-docs'],
  ADMIN: FULL_ACCESS,
  USER: [],
};

export function canAccess(role: UserRole, module: WorkspaceModule): boolean {
  return ROLE_ACCESS[role]?.includes(module) ?? false;
}

export function canResetDemoData(role: UserRole): boolean {
  return role === 'OWNER';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'OWNER';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

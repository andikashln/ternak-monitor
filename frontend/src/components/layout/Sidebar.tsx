import React from 'react';
import {
  Activity, BadgeDollarSign, Baby, ChevronRight, ClipboardList, Database, FileBarChart,
  HeartPulse, LayoutDashboard, ReceiptText, ShoppingCart,
  Users, Wallet, Wheat, Settings, WalletCards, FileText,
  // Divisi baru
  Landmark, Scale, ShieldCheck, Banknote, Sprout, Leaf, Tractor, Trees,
  Fish, Droplets, Waves, Anchor, Bird, PawPrint, Package, PackagePlus,
  ClipboardCheck, UserCheck, Gauge, BookOpenCheck, FolderCog, ScrollText,
} from 'lucide-react';
import { UserRole } from '../../types';
import { canAccess } from '../../services/permissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

export interface NavMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  allowedRoles: UserRole[];
}

export interface NavSection {
  label: string;
  items: NavMenuItem[];
}

export const navigationSections: NavSection[] = [
  {
    label: 'Ringkasan',
    items: [
      { id: 'dashboard', label: 'Dashboard', description: 'Kondisi farm hari ini', icon: LayoutDashboard, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Finance control',
    items: [
      { id: 'finance-dashboard', label: 'Dashboard Finance', description: 'Kas & laba ringkas', icon: Landmark, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'approval-center', label: 'Approval Center', description: 'Persetujuan terpusat', icon: ShieldCheck, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'cash-flow', label: 'Kas Masuk & Keluar', description: 'Arus kas harian', icon: Banknote, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'lpj', label: 'LPJ Pertanggungjawaban', description: 'Laporan pertanggungjawaban', icon: Scale, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'funding-docs', label: 'Pengajuan Dana', description: 'Verifikasi & persetujuan', icon: WalletCards, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT', 'MITRA'] },
      { id: 'invoices', label: 'Invoice & Bukti Bayar', description: 'Tagihan, DP & bukti bayar', icon: FileText, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Peternakan sapi',
    items: [
      { id: 'livestock', label: 'Data Sapi & Mutasi', description: 'Identitas, populasi & mutasi', icon: Database, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'feed', label: 'Pakan & Timbangan', description: 'Stok pakan & penimbangan', icon: Wheat, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'health', label: 'Kesehatan', description: 'Rekam medis & obat', icon: HeartPulse, allowedRoles: ['OWNER', 'MANAGER'] },
      { id: 'births-deaths', label: 'Kelahiran & Kematian', description: 'Perubahan populasi', icon: Baby, allowedRoles: ['OWNER', 'MANAGER'] },
    ],
  },
  {
    label: 'Kebun & pertanian',
    items: [
      { id: 'crop-longterm', label: 'Tanaman Jangka Panjang', description: 'Sawit & tanaman tahunan', icon: Trees, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'crop-shortterm', label: 'Sayuran Jangka Pendek', description: 'Hortikultura musiman', icon: Sprout, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'crop-activity', label: 'Aktivitas & Pemupukan', description: 'Perawatan & pemupukan', icon: Tractor, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'garden-docs', label: 'Invoice & Surat Jalan Kebun', description: 'Dokumen & SOP kebun', icon: Leaf, allowedRoles: ['OWNER', 'MANAGER'] },
    ],
  },
  {
    label: 'Perikanan & bioflok',
    items: [
      { id: 'ponds', label: 'Semua Kolam & Bioflok', description: 'Kolam & populasi ikan', icon: Waves, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'water-quality', label: 'Kualitas Air (pH/DO/Suhu)', description: 'Monitoring parameter air', icon: Droplets, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'fish-feed', label: 'Log Pakan & FCR Kolam', description: 'Pakan & konversi', icon: Fish, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'fish-harvest', label: 'Panen & Penjualan Ikan', description: 'Hasil panen & penjualan', icon: Anchor, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'fish-docs', label: 'Invoice & Surat Jalan Ikan', description: 'Dokumen & SOP kolam', icon: FileText, allowedRoles: ['OWNER', 'MANAGER'] },
    ],
  },
  {
    label: 'Satwa & aviari',
    items: [
      { id: 'wildlife', label: 'Koleksi Satwa & Aviari', description: 'Satwa & burung koleksi', icon: Bird, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'wildlife-feed', label: 'Jadwal & Checklist Pakan', description: 'Jadwal pakan satwa', icon: PawPrint, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
    ],
  },
  {
    label: 'Bisnis & keuangan',
    items: [
      { id: 'transactions', label: 'Jual & Beli', description: 'Transaksi ternak', icon: ShoppingCart, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'sales-results', label: 'Hasil Penjualan', description: 'HPP, biaya & laba bersih', icon: BadgeDollarSign, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'finance', label: 'Laporan Laba Rugi', description: 'Pemasukan, biaya & laba', icon: Wallet, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'expenses', label: 'Pengeluaran', description: 'Biaya operasional', icon: ReceiptText, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Inventory & purchasing',
    items: [
      { id: 'inventory', label: 'Stok & Mutasi Barang', description: 'Inventori & mutasi stok', icon: Package, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
      { id: 'purchase-request', label: 'Purchase Request & PO', description: 'Permintaan & pesanan', icon: PackagePlus, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { id: 'daily-report', label: 'Daily Report', description: 'Laporan harian divisi', icon: ClipboardCheck, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'task-management', label: 'Task Management', description: 'Penugasan & progres', icon: ClipboardList, allowedRoles: ['OWNER', 'MANAGER', 'MITRA'] },
      { id: 'attendance', label: 'Absensi Pekerja', description: 'Kehadiran harian', icon: UserCheck, allowedRoles: ['OWNER', 'MANAGER'] },
      { id: 'kpi', label: 'KPI Score', description: 'Penilaian kinerja', icon: Gauge, allowedRoles: ['OWNER', 'MANAGER'] },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { id: 'daily-reports', label: 'Laporan Kandang', description: 'Aktivitas harian', icon: ClipboardList, allowedRoles: ['OWNER', 'MANAGER'] },
      { id: 'reports', label: 'Laporan & Google Sheets', description: 'Dokumen PDF & Excel', icon: FileBarChart, allowedRoles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Report & system',
    items: [
      { id: 'master-data', label: 'Master Data & Role', description: 'Data master & peran', icon: FolderCog, allowedRoles: ['OWNER', 'DEVELOPER'] },
      { id: 'audit-trail', label: 'Audit Trail Log', description: 'Riwayat aktivitas', icon: ScrollText, allowedRoles: ['OWNER', 'DEVELOPER'] },
      { id: 'users', label: 'Pengguna', description: 'Akun & hak akses', icon: Users, allowedRoles: ['OWNER', 'DEVELOPER'] },
      { id: 'settings', label: 'Pengaturan', description: 'Profil farm & reset demo', icon: Settings, allowedRoles: ['OWNER', 'DEVELOPER'] },
    ],
  },
];

export const getNavigationLabel = (tabId: string) => (
  navigationSections.flatMap(section => section.items).find(item => item.id === tabId)?.label ?? 'Dashboard'
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => (
  <aside className="app-sidebar hidden w-[17.5rem] shrink-0 flex-col border-r bg-white/90 lg:flex">
    <div className="mx-4 mt-5 rounded-xl border border-[#d2ad76]/70 bg-[#f9ebcc]/65 p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white shadow-sm">
          <Activity className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block ranch-label">Status sistem</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
            <span className="h-2 w-2 rounded-full bg-[#69704a] ring-4 ring-[#ead0a0]" /> Operasional aktif
          </span>
        </span>
      </div>
    </div>

    <nav aria-label="Navigasi utama" className="scrollbar-subtle flex-1 overflow-y-auto px-3 py-4">
      {navigationSections.map(section => {
        const visibleItems = section.items.filter(item => item.allowedRoles.includes(role) || (role === 'ADMIN' && canAccess('ADMIN', item.id as never)));
        if (visibleItems.length === 0) return null;
        return (
          <div key={section.label} className="mb-5 last:mb-2">
            <p className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{section.label}</p>
            <div className="space-y-1">
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all ${
                      isActive
                        ? 'bg-[#5a2d1f] text-white shadow-md shadow-[#5a2d1f]/15'
                        : 'text-slate-600 hover:bg-[#f9ebcc] hover:text-[#5a2d1f]'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? 'bg-white/12 text-white' : 'bg-[#f4ead3] text-slate-500 group-hover:bg-white group-hover:text-[#5a2d1f]'
                    }`}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold">{item.label}</span>
                      <span className={`mt-0.5 block truncate text-[9px] font-medium ${isActive ? 'text-emerald-100/80' : 'text-slate-400'}`}>
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-200' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>

    <div className="border-t border-slate-100 px-5 py-4">
      <p className="text-[10px] font-bold text-slate-500">Sapi Papi Farm</p>
      <p className="mt-0.5 text-[9px] text-slate-400">Ternak Monitor · v2.5</p>
    </div>
  </aside>
);

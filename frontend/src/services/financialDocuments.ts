import type { UserRole } from '../types';

export type Actor = { uid: string; name: string; role: UserRole };
export type FundStatus = 'Draft' | 'Diajukan' | 'Diverifikasi Akuntan' | 'Disetujui Owner' | 'Dicairkan' | 'Selesai' | 'Perlu Revisi' | 'Ditolak' | 'Dibatalkan';
export type PaymentStatus = 'Belum Dibayar' | 'Menunggu Verifikasi' | 'Sebagian' | 'Lunas' | 'Ditolak';
export type LineItem = { description: string; quantity: number; unit: string; unitPrice: number };

export interface FundRequestDraft {
  category: string; location: string; purpose: string; neededDate: string; paymentMethod: string; notes: string; items: LineItem[];
}
export interface FundRequest extends FundRequestDraft {
  id: string; requestNo: string; requesterId: string; requesterName: string; requesterRole: UserRole; total: number;
  status: FundStatus; createdAt: string; verifiedBy?: string; approvedBy?: string; cancelledReason?: string;
}
export interface InvoiceDraft {
  kind: 'JUAL' | 'BELI' | 'DANA' | 'OPERASIONAL'; partyName: string; partyContact: string; issueDate: string; dueDate: string;
  taxPercent: number; discount: number; extraCost: number; notes: string; items: LineItem[];
}
export interface PaymentRecord {
  id: string; amount: number; method: string; paidAt: string; status: 'Menunggu Verifikasi' | 'Terverifikasi' | 'Ditolak';
  submittedBy: string; verifiedBy?: string; attachmentIds: string[]; rejectionReason?: string;
}
export interface Invoice extends InvoiceDraft {
  id: string; invoiceNo: string; subtotal: number; taxAmount: number; total: number; paidAmount: number; remainingAmount: number;
  paymentStatus: PaymentStatus; status: 'Aktif' | 'Dibatalkan'; payments: PaymentRecord[]; createdBy: string; createdAt: string; cancelledReason?: string;
}
export interface WorkflowAudit { id: string; at: string; actor: string; role: UserRole; action: string; targetId: string; detail?: string }
export interface WorkflowAlert { id: string; at: string; title: string; message: string; targetId: string }
interface WorkflowState { fundRequests: FundRequest[]; invoices: Invoice[]; audits: WorkflowAudit[]; alerts: WorkflowAlert[] }

const STORAGE_KEY = 'duta_agro_financial_documents_v1';
const emptyState = (): WorkflowState => ({ fundRequests: [], invoices: [], audits: [], alerts: [] });
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const sumItems = (items: LineItem[]) => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

// Seed data demo: dipakai hanya saat localStorage kosong (belum pernah ada data),
// supaya halaman Invoice & Pengajuan Dana langsung terlihat "hidup".
const seedState = (): WorkflowState => {
  const demoDate = '2026-08-30';
  const inv1Items: LineItem[] = [
    { description: 'Sapi Limousin jantan siap potong', quantity: 2, unit: 'ekor', unitPrice: 15_000_000 },
    { description: 'Sapi Simental betina', quantity: 1, unit: 'ekor', unitPrice: 13_500_000 },
  ];
  const inv1Subtotal = sumItems(inv1Items); // 43.500.000
  const inv1: Invoice = {
    kind: 'JUAL', partyName: 'H. Abdul Rahman', partyContact: '0812-3456-7890', issueDate: demoDate, dueDate: '2026-09-07',
    taxPercent: 0, discount: 0, extraCost: 0, notes: 'Penjualan ternak potong lokasi Kulim.',
    items: inv1Items, id: 'invoice-demo-1', invoiceNo: 'INV-JUAL/2026/08/0001',
    subtotal: inv1Subtotal, taxAmount: 0, total: inv1Subtotal, paidAmount: 15_000_000, remainingAmount: inv1Subtotal - 15_000_000,
    paymentStatus: 'Sebagian', status: 'Aktif',
    payments: [{ id: 'payment-demo-1', amount: 15_000_000, method: 'Transfer Bank', paidAt: '2026-08-31T09:00:00.000Z', status: 'Terverifikasi', submittedBy: 'Owner PT.Duta Agro Nusantara', attachmentIds: [] }],
    createdBy: 'Owner PT.Duta Agro Nusantara', createdAt: '2026-08-30T10:00:00.000Z',
  };

  const inv2Items: LineItem[] = [
    { description: 'Konsentrat Gemuk (50 kg/karung)', quantity: 20, unit: 'karung', unitPrice: 190_000 },
    { description: 'Mineral block', quantity: 10, unit: 'unit', unitPrice: 45_000 },
  ];
  const inv2Subtotal = sumItems(inv2Items); // 3.800.000 + 450.000 = 4.250.000
  const inv2: Invoice = {
    kind: 'BELI', partyName: 'PT Feedmill Nusantara', partyContact: '021-555-1234', issueDate: '2026-08-28', dueDate: '2026-09-05',
    taxPercent: 0, discount: 0, extraCost: 0, notes: 'Pembelian pakan ternak bulan Agustus.',
    items: inv2Items, id: 'invoice-demo-2', invoiceNo: 'INV-BELI/2026/08/0001',
    subtotal: inv2Subtotal, taxAmount: 0, total: inv2Subtotal, paidAmount: 0, remainingAmount: inv2Subtotal,
    paymentStatus: 'Belum Dibayar', status: 'Aktif', payments: [],
    createdBy: 'Manager PT.Duta Agro Nusantara', createdAt: '2026-08-28T08:30:00.000Z',
  };

  const fundItems: LineItem[] = [
    { description: 'Pembelian pakan konsentrat 1 ton', quantity: 1, unit: 'ton', unitPrice: 3_800_000 },
  ];
  const fundTotal = sumItems(fundItems);
  const fundRequest: FundRequest = {
    category: 'Pakan', location: 'Kulim', purpose: 'Pembelian pakan konsentrat bulan September', neededDate: '2026-09-10',
    paymentMethod: 'Transfer Bank', notes: 'Untuk kebutuhan pakan 2 minggu ke depan.',
    items: fundItems, id: 'fund-demo-1', requestNo: 'REQ-DANA/2026/09/0001',
    requesterId: 'u-manager-1', requesterName: 'Andika Shalihin', requesterRole: 'MANAGER', total: fundTotal,
    status: 'Diverifikasi Akuntan', createdAt: '2026-09-01T08:00:00.000Z', verifiedBy: 'Sari Keuangan',
  };

  // Pengajuan dana milik Mitra demo (uid = 'demo-mitra-local') agar role MITRA
  // melihat minimal satu pengajuan di daftarnya.
  const mitraFundItems: LineItem[] = [
    { description: 'Pembelian bibit lele 1000 ekor', quantity: 1000, unit: 'ekor', unitPrice: 350 },
  ];
  const mitraFundRequest: FundRequest = {
    category: 'Pembelian Ternak', location: 'Sontang', purpose: 'Pembelian bibit lele untuk kolam baru', neededDate: '2026-09-05',
    paymentMethod: 'Transfer Bank', notes: 'Restocking kolam bioflok.',
    items: mitraFundItems, id: 'fund-demo-2', requestNo: 'REQ-DANA/2026/09/0002',
    requesterId: 'demo-mitra-local', requesterName: 'Mitra PT.Duta Agro Nusantara', requesterRole: 'MITRA', total: sumItems(mitraFundItems),
    status: 'Diajukan', createdAt: '2026-09-02T08:00:00.000Z',
  };

  return {
    fundRequests: [fundRequest, mitraFundRequest],
    invoices: [inv1, inv2],
    audits: [
      { id: 'audit-demo-1', at: '2026-08-30T10:05:00.000Z', actor: 'Owner PT.Duta Agro Nusantara', role: 'OWNER', action: 'Buat Invoice', targetId: 'invoice-demo-1', detail: 'INV-JUAL/2026/08/0001' },
      { id: 'audit-demo-2', at: '2026-09-01T08:05:00.000Z', actor: 'Sari Keuangan', role: 'ACCOUNTANT', action: 'Verifikasi Pengajuan', targetId: 'fund-demo-1', detail: 'REQ-DANA/2026/09/0001' },
      { id: 'audit-demo-3', at: '2026-09-02T08:05:00.000Z', actor: 'Mitra PT.Duta Agro Nusantara', role: 'MITRA', action: 'Ajukan Dana', targetId: 'fund-demo-2', detail: 'REQ-DANA/2026/09/0002' },
    ],
    alerts: [
      { id: 'alert-demo-1', at: '2026-09-01T08:05:00.000Z', title: 'Verifikasi Pengajuan', message: 'Sari Keuangan: REQ-DANA/2026/09/0001', targetId: 'fund-demo-1' },
      { id: 'alert-demo-2', at: '2026-08-31T09:00:00.000Z', title: 'Verifikasi Pembayaran', message: 'Pembayaran INV-JUAL/2026/08/0001 telah terverifikasi.', targetId: 'invoice-demo-1' },
      { id: 'alert-demo-3', at: '2026-09-02T08:05:00.000Z', title: 'Ajukan Dana', message: 'Mitra PT.Duta Agro Nusantara: REQ-DANA/2026/09/0002', targetId: 'fund-demo-2' },
    ],
  };
};

const memoryFallback = new Map<string, string>();
const fallbackStorage: Storage = {
  get length() { return memoryFallback.size; },
  clear: () => memoryFallback.clear(),
  getItem: key => memoryFallback.get(key) ?? null,
  key: index => [...memoryFallback.keys()][index] ?? null,
  removeItem: key => memoryFallback.delete(key),
  setItem: (key, value) => { memoryFallback.set(key, String(value)); },
};
const defaultStorage = typeof localStorage === 'undefined' ? fallbackStorage : localStorage;

export class FinancialDocumentsStore {
  private state: WorkflowState;
  private listeners = new Set<() => void>();
  constructor(private storage: Storage = defaultStorage) {
    try {
      const stored = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      // Jika belum pernah ada data, ATAU data lama yang tersimpan kosong total
      // (hasil emptyState versi lama), pakai seed demo supaya halaman tidak kosong.
      const isEmpty = !stored ||
        (!(stored.fundRequests?.length) && !(stored.invoices?.length) && !(stored.audits?.length) && !(stored.alerts?.length));
      this.state = isEmpty ? seedState() : { ...emptyState(), ...stored };
    }
    catch { this.state = seedState(); }
  }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  snapshot(): WorkflowState { return structuredClone(this.state); }
  getInvoice(invoiceId: string) { return this.state.invoices.find(item => item.id === invoiceId); }
  private save() { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state)); this.listeners.forEach(listener => listener()); }
  private audit(actor: Actor, action: string, targetId: string, detail?: string) {
    this.state.audits.unshift({ id: id('audit'), at: now(), actor: actor.name, role: actor.role, action, targetId, detail });
    this.state.alerts.unshift({ id: id('alert'), at: now(), title: action, message: detail ? `${actor.name}: ${detail}` : `Diproses oleh ${actor.name}`, targetId });
    this.state.alerts = this.state.alerts.slice(0, 50);
  }
  private requireRole(actor: Actor, roles: UserRole[], message: string) { if (!roles.includes(actor.role)) throw new Error(message); }

  createFundRequest(draft: FundRequestDraft, actor: Actor): FundRequest {
    this.requireRole(actor, ['OWNER', 'MANAGER', 'ACCOUNTANT', 'MITRA'], 'Role tidak boleh membuat pengajuan dana.');
    if (!draft.purpose.trim() || !draft.items.length) throw new Error('Keperluan dan rincian pengajuan wajib diisi.');
    const sequence = this.state.fundRequests.length + 1;
    const created: FundRequest = { ...draft, id: id('fund'), requestNo: `REQ-DANA/${draft.neededDate.slice(0, 4)}/${draft.neededDate.slice(5, 7)}/${String(sequence).padStart(4, '0')}`, requesterId: actor.uid, requesterName: actor.name, requesterRole: actor.role, total: sumItems(draft.items), status: 'Diajukan', createdAt: now() };
    this.state.fundRequests.unshift(created); this.audit(actor, 'Ajukan Dana', created.id, created.requestNo); this.save(); return created;
  }
  verifyFundRequest(requestId: string, actor: Actor) {
    this.requireRole(actor, ['ACCOUNTANT'], 'Hanya Akuntan yang dapat memverifikasi pengajuan.');
    const request = this.mustRequest(requestId); if (request.status !== 'Diajukan' && request.status !== 'Perlu Revisi') throw new Error('Pengajuan tidak dapat diverifikasi pada status ini.');
    request.status = 'Diverifikasi Akuntan'; request.verifiedBy = actor.name; this.audit(actor, 'Verifikasi Pengajuan', request.id); this.save(); return request;
  }
  approveFundRequest(requestId: string, actor: Actor) {
    this.requireRole(actor, ['OWNER'], 'Hanya Owner yang dapat memberikan persetujuan akhir.');
    const request = this.mustRequest(requestId); if (request.status !== 'Diverifikasi Akuntan') throw new Error('Pengajuan harus melalui verifikasi Akuntan.');
    request.status = 'Disetujui Owner'; request.approvedBy = actor.name; this.audit(actor, 'Setujui Pengajuan', request.id); this.save(); return request;
  }
  updateFundStatus(requestId: string, status: FundStatus, reason: string, actor: Actor) {
    const request = this.mustRequest(requestId);
    if (['Ditolak', 'Dibatalkan', 'Perlu Revisi'].includes(status) && !reason.trim()) throw new Error('Alasan wajib diisi.');
    if (status === 'Dicairkan') this.requireRole(actor, ['ACCOUNTANT'], 'Hanya Akuntan yang dapat mencatat pencairan.');
    else this.requireRole(actor, ['OWNER', 'ACCOUNTANT'], 'Role tidak berwenang mengubah status ini.');
    request.status = status; if (status === 'Dibatalkan') request.cancelledReason = reason; this.audit(actor, `Status Pengajuan: ${status}`, request.id, reason); this.save(); return request;
  }
  private mustRequest(requestId: string) { const request = this.state.fundRequests.find(item => item.id === requestId); if (!request) throw new Error('Pengajuan tidak ditemukan.'); return request; }

  createInvoice(draft: InvoiceDraft, actor: Actor): Invoice {
    this.requireRole(actor, ['OWNER', 'MANAGER', 'ACCOUNTANT'], 'Role tidak boleh membuat invoice.');
    const subtotal = sumItems(draft.items); const taxAmount = subtotal * Math.max(0, draft.taxPercent) / 100; const total = Math.max(0, subtotal + taxAmount + draft.extraCost - draft.discount);
    const sequence = this.state.invoices.filter(item => item.kind === draft.kind).length + 1;
    const invoice: Invoice = { ...draft, id: id('invoice'), invoiceNo: `INV-${draft.kind}/${draft.issueDate.slice(0, 4)}/${draft.issueDate.slice(5, 7)}/${String(sequence).padStart(4, '0')}`, subtotal, taxAmount, total, paidAmount: 0, remainingAmount: total, paymentStatus: 'Belum Dibayar', status: 'Aktif', payments: [], createdBy: actor.name, createdAt: now() };
    this.state.invoices.unshift(invoice); this.audit(actor, 'Buat Invoice', invoice.id, invoice.invoiceNo); this.save(); return invoice;
  }
  addPayment(invoiceId: string, amount: number, method: string, actor: Actor, attachmentIds: string[] = []) {
    const invoice = this.mustInvoice(invoiceId); if (invoice.status !== 'Aktif') throw new Error('Invoice sudah dibatalkan.');
    if (amount <= 0 || amount > invoice.remainingAmount) throw new Error('Nominal pembayaran tidak valid.');
    invoice.payments.push({ id: id('payment'), amount, method, paidAt: now(), status: 'Menunggu Verifikasi', submittedBy: actor.name, attachmentIds });
    invoice.paymentStatus = 'Menunggu Verifikasi'; this.audit(actor, 'Unggah Pembayaran', invoice.id, String(amount)); this.save(); return invoice;
  }
  verifyPayment(invoiceId: string, paymentId: string, actor: Actor) {
    this.requireRole(actor, ['ACCOUNTANT'], 'Hanya Akuntan yang dapat memverifikasi pembayaran.');
    const invoice = this.mustInvoice(invoiceId); const payment = invoice.payments.find(item => item.id === paymentId); if (!payment || payment.status !== 'Menunggu Verifikasi') throw new Error('Pembayaran tidak menunggu verifikasi.');
    payment.status = 'Terverifikasi'; payment.verifiedBy = actor.name; this.recalculatePayment(invoice); this.audit(actor, 'Verifikasi Pembayaran', invoice.id, payment.id); this.save(); return invoice;
  }
  rejectPayment(invoiceId: string, paymentId: string, reason: string, actor: Actor) {
    this.requireRole(actor, ['ACCOUNTANT'], 'Hanya Akuntan yang dapat menolak pembayaran.'); if (!reason.trim()) throw new Error('Alasan penolakan wajib diisi.');
    const invoice = this.mustInvoice(invoiceId); const payment = invoice.payments.find(item => item.id === paymentId); if (!payment) throw new Error('Pembayaran tidak ditemukan.');
    payment.status = 'Ditolak'; payment.rejectionReason = reason; this.recalculatePayment(invoice); this.audit(actor, 'Tolak Pembayaran', invoice.id, reason); this.save(); return invoice;
  }
  cancelInvoice(invoiceId: string, reason: string, actor: Actor) {
    this.requireRole(actor, ['OWNER'], 'Hanya Owner yang dapat membatalkan invoice.'); if (!reason.trim()) throw new Error('Alasan pembatalan wajib diisi.');
    const invoice = this.mustInvoice(invoiceId); invoice.status = 'Dibatalkan'; invoice.cancelledReason = reason; this.audit(actor, 'Batalkan Invoice', invoice.id, reason); this.save(); return invoice;
  }
  private mustInvoice(invoiceId: string) { const invoice = this.state.invoices.find(item => item.id === invoiceId); if (!invoice) throw new Error('Invoice tidak ditemukan.'); return invoice; }
  private recalculatePayment(invoice: Invoice) { invoice.paidAmount = invoice.payments.filter(item => item.status === 'Terverifikasi').reduce((sum, item) => sum + item.amount, 0); invoice.remainingAmount = Math.max(0, invoice.total - invoice.paidAmount); invoice.paymentStatus = invoice.remainingAmount === 0 ? 'Lunas' : invoice.paidAmount > 0 ? 'Sebagian' : invoice.payments.some(item => item.status === 'Menunggu Verifikasi') ? 'Menunggu Verifikasi' : 'Belum Dibayar'; }
  resetAll(actor: Actor) { this.requireRole(actor, ['OWNER'], 'Hanya Owner yang dapat mereset data demo.'); this.state = seedState(); this.storage.removeItem(STORAGE_KEY); this.listeners.forEach(listener => listener()); }
}

export const financialDocumentsStore = new FinancialDocumentsStore();

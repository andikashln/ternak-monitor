import { beforeEach, describe, expect, it } from 'vitest';
import { FinancialDocumentsStore, type FundRequestDraft, type InvoiceDraft } from './financialDocuments';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const fundDraft: FundRequestDraft = {
  category: 'Pakan', location: 'Kulim', purpose: 'Pembelian konsentrat', neededDate: '2026-09-05',
  paymentMethod: 'Transfer Bank', notes: '', items: [{ description: 'Konsentrat', quantity: 10, unit: 'sak', unitPrice: 250000 }],
};

const invoiceDraft: InvoiceDraft = {
  kind: 'JUAL', partyName: 'Pembeli Demo', partyContact: '0812', issueDate: '2026-08-31', dueDate: '2026-09-07',
  taxPercent: 0, discount: 0, extraCost: 0, notes: '', items: [{ description: 'Sapi SP-0023', quantity: 1, unit: 'ekor', unitPrice: 25000000 }],
};

describe('financial workflow', () => {
  let store: FinancialDocumentsStore;
  beforeEach(() => { store = new FinancialDocumentsStore(new MemoryStorage()); });

  it('requires accountant verification before owner approval', () => {
    const request = store.createFundRequest(fundDraft, { uid: 'mitra', name: 'Mitra', role: 'MITRA' });
    expect(request.status).toBe('Diajukan');
    expect(() => store.approveFundRequest(request.id, { uid: 'owner', name: 'Owner', role: 'OWNER' })).toThrow(/verifikasi/i);
    store.verifyFundRequest(request.id, { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    expect(store.approveFundRequest(request.id, { uid: 'owner', name: 'Owner', role: 'OWNER' }).status).toBe('Disetujui Owner');
  });

  it('supports installment payments and calculates remaining balance', () => {
    const invoice = store.createInvoice(invoiceDraft, { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    store.addPayment(invoice.id, 5000000, 'Transfer Bank', { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    expect(store.getInvoice(invoice.id)?.paymentStatus).toBe('Menunggu Verifikasi');
    store.verifyPayment(invoice.id, store.getInvoice(invoice.id)!.payments[0].id, { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    expect(store.getInvoice(invoice.id)).toMatchObject({ paymentStatus: 'Sebagian', paidAmount: 5000000, remainingAmount: 20000000 });
  });

  it('prevents paid invoices from being deleted and only allows owner cancellation', () => {
    const invoice = store.createInvoice(invoiceDraft, { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    store.addPayment(invoice.id, 25000000, 'Transfer Bank', { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    const paymentId = store.getInvoice(invoice.id)!.payments[0].id;
    store.verifyPayment(invoice.id, paymentId, { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    expect(() => store.cancelInvoice(invoice.id, 'Salah input', { uid: 'manager', name: 'Manager', role: 'MANAGER' })).toThrow(/Owner/i);
    expect(store.cancelInvoice(invoice.id, 'Transaksi dibatalkan', { uid: 'owner', name: 'Owner', role: 'OWNER' }).status).toBe('Dibatalkan');
  });

  it('clears all workflow demo data on owner reset', () => {
    store.createFundRequest(fundDraft, { uid: 'mitra', name: 'Mitra', role: 'MITRA' });
    store.createInvoice(invoiceDraft, { uid: 'acc', name: 'Akuntan', role: 'ACCOUNTANT' });
    store.resetAll({ uid: 'owner', name: 'Owner', role: 'OWNER' });
    expect(store.snapshot()).toMatchObject({ fundRequests: [], invoices: [], audits: [] });
  });
});

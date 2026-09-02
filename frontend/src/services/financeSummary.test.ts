import { describe, expect, it } from 'vitest';
import { FinancialTransaction, SalesRecord } from '../types';
import { summarizeFinancePeriod } from './financeSummary';

const transactions: FinancialTransaction[] = [
  {
    id: 'income-aug', invoiceNo: 'INV-08', date: '2026-08-12', type: 'income', category: 'Penjualan Ternak',
    description: 'Penjualan', locationId: 'loc-main', locationName: 'Sapi Papi Farm', amount: 30_000_000,
    paymentMethod: 'Tunai', payeePayer: 'Pembeli', createdBy: 'Owner', createdAt: '2026-08-12T00:00:00.000Z',
  },
  {
    id: 'hpp-aug', invoiceNo: 'INV-08', date: '2026-08-12', type: 'expense', category: 'Pembelian Ternak',
    description: 'Harga beli/HPP ternak terjual (INV-08)', locationId: 'loc-main', locationName: 'Sapi Papi Farm', amount: 20_000_000,
    paymentMethod: 'Harga Perolehan', payeePayer: 'Persediaan', createdBy: 'Owner', createdAt: '2026-08-12T00:00:00.000Z',
  },
  {
    id: 'feed-sep', invoiceNo: 'EXP-09', date: '2026-09-04', type: 'expense', category: 'Pakan',
    description: 'Pakan', locationId: 'loc-main', locationName: 'Sapi Papi Farm', amount: 2_000_000,
    paymentMethod: 'Tunai', payeePayer: 'Supplier', createdBy: 'Owner', createdAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'income-prior', invoiceNo: 'INV-25', date: '2025-12-12', type: 'income', category: 'Penjualan Ternak',
    description: 'Penjualan lama', locationId: 'loc-main', locationName: 'Sapi Papi Farm', amount: 10_000_000,
    paymentMethod: 'Tunai', payeePayer: 'Pembeli', createdBy: 'Owner', createdAt: '2025-12-12T00:00:00.000Z',
  },
];

const sales: SalesRecord[] = [
  {
    id: 'sale-aug', invoiceNo: 'INV-08', date: '2026-08-12', buyerName: 'Pembeli A', buyerPhone: '-', livestockIds: ['cow-1'],
    weightTotalKg: 400, priceTotal: 30_000_000, acquisitionCostTotal: 20_000_000, paymentMethod: 'Tunai', paymentStatus: 'Lunas',
    locationId: 'loc-main', locationName: 'Sapi Papi Farm', salesRep: 'Owner', transactionStatus: 'Selesai', createdBy: 'Owner', createdAt: '2026-08-12T00:00:00.000Z',
  },
];

describe('summarizeFinancePeriod', () => {
  it('meringkas bulan terpilih tanpa mencampur transaksi di luar bulan', () => {
    expect(summarizeFinancePeriod({ transactions, sales, period: '2026-08', granularity: 'month' })).toMatchObject({
      income: 30_000_000,
      expenses: 20_000_000,
      operatingExpenses: 0,
      grossProfit: 10_000_000,
      netProfit: 10_000_000,
      salesCount: 1,
    });
  });

  it('menggunakan buku kas sebagai fallback bila detail SalesRecord belum tersedia', () => {
    expect(summarizeFinancePeriod({ transactions, sales: [], period: '2026-08', granularity: 'month' })).toMatchObject({
      grossProfit: 10_000_000,
      netProfit: 10_000_000,
      salesCount: 0,
    });
  });
  it('meringkas satu tahun penuh ketika mode tahunan dipilih', () => {
    expect(summarizeFinancePeriod({ transactions, sales, period: '2026', granularity: 'year' })).toMatchObject({
      income: 30_000_000,
      expenses: 22_000_000,
      operatingExpenses: 2_000_000,
      grossProfit: 10_000_000,
      netProfit: 8_000_000,
      salesCount: 1,
    });
  });
});

import { FinancialTransaction, SalesRecord } from '../types';

export type FinancePeriodGranularity = 'month' | 'year';

export interface FinancePeriodSummary {
  income: number;
  expenses: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  salesCount: number;
}

interface FinancePeriodInput {
  transactions: FinancialTransaction[];
  sales: SalesRecord[];
  period: string;
  granularity: FinancePeriodGranularity;
}

const belongsToPeriod = (date: string, period: string, granularity: FinancePeriodGranularity) =>
  granularity === 'year' ? date.startsWith(period) : date.startsWith(period);

export function summarizeFinancePeriod({
  transactions,
  sales,
  period,
  granularity,
}: FinancePeriodInput): FinancePeriodSummary {
  const periodTransactions = transactions.filter(transaction =>
    belongsToPeriod(transaction.date, period, granularity),
  );
  const periodSales = sales.filter(sale =>
    sale.transactionStatus === 'Selesai'
    && belongsToPeriod(sale.date, period, granularity),
  );

  const income = periodTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = periodTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const operatingExpenses = periodTransactions
    .filter(transaction => transaction.type === 'expense' && transaction.category !== 'Pembelian Ternak')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const grossProfit = periodSales.length > 0
    ? periodSales.reduce((sum, sale) => sum + sale.priceTotal - (sale.acquisitionCostTotal ?? 0), 0)
    : periodTransactions
      .filter(transaction => transaction.type === 'income' && transaction.category === 'Penjualan Ternak')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
      - periodTransactions
        .filter(transaction => transaction.type === 'expense' && transaction.category === 'Pembelian Ternak')
        .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    income,
    expenses,
    operatingExpenses,
    grossProfit,
    netProfit: grossProfit - operatingExpenses,
    salesCount: periodSales.length,
  };
}

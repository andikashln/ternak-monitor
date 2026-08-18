import React, { useState, useEffect } from 'react';
import { Wallet, Plus, BarChart3, Pencil, Trash2, X } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { FinancialTransaction, FinancialCategoryType } from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';

export const FinanceView: React.FC = () => {
  const [transactions, setTransactions] = useState(storeService.financialTransactions);
  const [salesRecords, setSalesRecords] = useState(storeService.salesRecords);
  const [locations, setLocations] = useState(storeService.locations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Form
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [invoiceNo, setInvoiceNo] = useState(`TRX-${Date.now().toString().slice(-6)}`);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<FinancialCategoryType>('Pakan');
  const [description, setDescription] = useState('Pembelian konsentrat pakan sapi');
  const [amount, setAmount] = useState('5000000');
  const [locationId, setLocationId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [payeePayer, setPayeePayer] = useState('PT Feedmill Nusantara');

  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      setTransactions(storeService.financialTransactions);
      setSalesRecords(storeService.salesRecords);
      setLocations(storeService.locations);
    });
    return unsubscribe;
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const completedSales = salesRecords.filter(sale => sale.transactionStatus === 'Selesai');
  const salesRevenue = completedSales.reduce((sum, sale) => sum + sale.priceTotal, 0);
  const livestockCost = completedSales.reduce((sum, sale) => {
    if (sale.acquisitionCostTotal !== undefined) return sum + sale.acquisitionCostTotal;
    return sum + sale.livestockIds.reduce((cost, id) => {
      const item = storeService.livestock.find(livestock => livestock.id === id);
      return cost + (item?.acquisitionPrice ?? 0);
    }, 0);
  }, 0);
  const grossProfit = salesRevenue - livestockCost;
  const operatingExpenses = transactions
    .filter(transaction => transaction.type === 'expense' && transaction.category !== 'Pembelian Ternak')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const salesNetProfit = grossProfit - operatingExpenses;

  const handleOpenModal = () => {
    setEditingTransactionId(null);
    setInvoiceNo(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setCategory('Pakan');
    setDescription('');
    setAmount('0');
    setPaymentMethod('Transfer Bank');
    setPayeePayer('');
    if (locations.length > 0) setLocationId(locations[0].id);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransactionId(transaction.id);
    setType(transaction.type);
    setInvoiceNo(transaction.invoiceNo);
    setTransactionDate(transaction.date);
    setCategory(transaction.category as FinancialCategoryType);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
    setLocationId(transaction.locationId);
    setPaymentMethod(transaction.paymentMethod);
    setPayeePayer(transaction.payeePayer);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: FinancialTransaction) => {
    const linkedSalesNote = transaction.category === 'Penjualan Ternak'
      ? '\n\nCatatan: invoice pada POS penjualan tidak ikut dihapus.'
      : '';
    const confirmed = window.confirm(
      `Hapus transaksi ${transaction.invoiceNo} sebesar ${formatRupiah(transaction.amount)}?${linkedSalesNote}\n\nData buku kas yang dihapus tidak dapat dikembalikan.`
    );
    if (confirmed) storeService.deleteFinancialTransaction(transaction.id);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = locations.find(l => l.id === locationId) || locations[0];
    if (!loc) return;

    const transactionData = {
      invoiceNo,
      date: transactionDate,
      type,
      category,
      description,
      locationId: loc.id,
      locationName: loc.name,
      amount: parseFloat(amount) || 0,
      paymentMethod,
      payeePayer,
      createdBy: storeService.currentUser.displayName
    };

    if (editingTransactionId) {
      storeService.updateFinancialTransaction(editingTransactionId, transactionData);
    } else {
      storeService.addFinancialTransaction(transactionData);
    }

    setIsModalOpen(false);
    setEditingTransactionId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-800" />
            <span>Keuangan & Buku Kas Operasional</span>
          </h2>
          <p className="text-xs text-slate-500">
            Catat arus kas pemasukan, pengeluaran pakan/obat/operasional, invoice, dan neraca laba rugi peternakan
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Pemasukan / Biaya</span>
        </button>
      </div>

      {/* Profit and Loss Report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-800" /> Laporan Laba Rugi Penjualan Ternak
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Pendapatan penjualan dikurangi harga beli ternak dan biaya operasional.</p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${salesNetProfit >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
            {salesNetProfit >= 0 ? 'LABA' : 'RUGI'} {formatRupiah(Math.abs(salesNetProfit))}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
          {[
            ['Pendapatan Penjualan', salesRevenue, 'text-emerald-800'],
            ['Harga Pokok Ternak', livestockCost, 'text-rose-600'],
            ['Laba Kotor', grossProfit, grossProfit >= 0 ? 'text-emerald-800' : 'text-rose-600'],
            ['Biaya Operasional', operatingExpenses, 'text-rose-600']
          ].map(([label, value, color]) => (
            <div key={String(label)} className="bg-white p-4">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">{label}</span>
              <span className={`text-base font-black font-mono mt-1 block ${color}`}>{formatRupiah(Number(value))}</span>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Invoice</th>
                <th className="p-3.5">Pembeli</th>
                <th className="p-3.5 text-right">Penjualan</th>
                <th className="p-3.5 text-right">Harga Beli</th>
                <th className="p-3.5 text-right">Laba Kotor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedSales.map(sale => {
                const cost = sale.acquisitionCostTotal ?? sale.livestockIds.reduce((sum, id) => {
                  const item = storeService.livestock.find(livestock => livestock.id === id);
                  return sum + (item?.acquisitionPrice ?? 0);
                }, 0);
                const profit = sale.priceTotal - cost;
                return (
                  <tr key={sale.id}>
                    <td className="p-3.5 font-mono font-bold">{sale.invoiceNo}</td>
                    <td className="p-3.5">{sale.buyerName}</td>
                    <td className="p-3.5 text-right font-mono">{formatRupiah(sale.priceTotal)}</td>
                    <td className="p-3.5 text-right font-mono">{formatRupiah(cost)}</td>
                    <td className={`p-3.5 text-right font-mono font-black ${profit >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>{formatRupiah(profit)}</td>
                  </tr>
                );
              })}
              {completedSales.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada penjualan selesai untuk dihitung.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Pemasukan</span>
          <span className="text-2xl font-black font-mono text-emerald-800 mt-1 block">{formatRupiah(totalIncome)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Pengeluaran</span>
          <span className="text-2xl font-black font-mono text-rose-600 mt-1 block">{formatRupiah(totalExpense)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Laba Bersih Operasional</span>
          <span className={`text-2xl font-black font-mono mt-1 block ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
            {formatRupiah(netProfit)}
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Buku Kas Transaksi Keuangan</h3>
          <span className="text-xs font-bold text-slate-500">Total {transactions.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Invoice / Ref</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Keterangan</th>
                <th className="p-3.5">Lokasi</th>
                <th className="p-3.5 text-right">Jumlah (Rp)</th>
                <th className="p-3.5">Metode</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 text-slate-600">{formatDate(t.date)}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">{t.invoiceNo}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-800 font-semibold">{t.description}</td>
                  <td className="p-3.5 text-slate-600">{t.locationName}</td>
                  <td className={`p-3.5 text-right font-mono font-black text-sm ${
                    t.type === 'income' ? 'text-emerald-800' : 'text-rose-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </td>
                  <td className="p-3.5 text-slate-500">{t.paymentMethod}</td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditTransaction(t)}
                        title="Edit transaksi"
                        aria-label={`Edit transaksi ${t.invoiceNo}`}
                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(t)}
                        title="Hapus transaksi"
                        aria-label={`Hapus transaksi ${t.invoiceNo}`}
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between font-bold">
              <h3>{editingTransactionId ? 'Edit Transaksi Buku Kas' : 'Catat Transaksi Kas Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-emerald-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as 'income' | 'expense')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  >
                    <option value="expense">Pengeluaran (Expense)</option>
                    <option value="income">Pemasukan (Income)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Invoice</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={category}
                    onChange={e => {
                      const nextCategory = e.target.value as FinancialCategoryType;
                      setCategory(nextCategory);
                      setType(nextCategory === 'Penjualan Ternak' ? 'income' : 'expense');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  >
                    <option value="Pakan">Pakan</option>
                    <option value="Obat & Vitamin">Obat & Vitamin</option>
                    <option value="Pembelian Ternak">Pembelian Ternak</option>
                    <option value="Penjualan Ternak">Penjualan Ternak</option>
                    <option value="Tenaga Kerja">Tenaga Kerja</option>
                    <option value="Transportasi">Transportasi</option>
                    <option value="Operasional Lainnya">Operasional Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Kandang *</label>
                  <select
                    value={locationId}
                    onChange={e => setLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  >
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Transaksi *</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal Rp *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penerima / Pembayar</label>
                <input
                  type="text"
                  value={payeePayer}
                  onChange={e => setPayeePayer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 text-white font-bold rounded-lg hover:bg-emerald-800"
                >
                  {editingTransactionId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

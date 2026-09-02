import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Building2, Calendar } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { exportToExcel, exportToPDF } from '../../utils/formatters';

export const ReportsExportView: React.FC = () => {
  const [reportType, setReportType] = useState<'livestock' | 'finance' | 'daily' | 'health' | 'deaths'>('livestock');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExportExcel = () => {
    if (reportType === 'livestock') {
      const data = storeService.getActiveLivestock().map(l => ({
        'Ear Tag': l.tagId,
        'Jenis/Ras': `${l.type} (${l.breed})`,
        'Kelamin': l.gender,
        'Lokasi': l.locationName,
        'Bobot (kg)': l.currentWeightKg,
        'Kondisi': l.conditionCategory,
        'Health': l.healthStatus
      }));
      exportToExcel(data, `Laporan_Master_Ternak_${endDate}`);
    } else if (reportType === 'finance') {
      const data = storeService.financialTransactions.map(t => ({
        'No Invoice': t.invoiceNo,
        'Tanggal': t.date,
        'Tipe': t.type.toUpperCase(),
        'Kategori': t.category,
        'Keterangan': t.description,
        'Lokasi': t.locationName,
        'Jumlah (Rp)': t.amount
      }));
      exportToExcel(data, `Laporan_Keuangan_${endDate}`);
    } else if (reportType === 'daily') {
      const data = storeService.dailyReports.map(r => ({
        'Tanggal': r.date,
        'Lokasi': r.locationName,
        'Awal': r.popInitial,
        'Masuk': r.popPurchase + r.popBirth + r.popTransferIn,
        'Keluar': r.popSales + r.popDeath + r.popTransferOut,
        'Populasi Akhir': r.popFinal,
        'Status': r.reportStatus
      }));
      exportToExcel(data, `Laporan_Harian_Kandang_${endDate}`);
    }
  };

  const handleExportPDF = () => {
    if (reportType === 'livestock') {
      const headers = ['Ear Tag', 'Jenis/Ras', 'Kelamin', 'Lokasi', 'Bobot (kg)', 'Status Kesehatan'];
      const rows = storeService.getActiveLivestock().map(l => [
        l.tagId, `${l.type} (${l.breed})`, l.gender, l.locationName, `${l.currentWeightKg} kg`, l.healthStatus
      ]);
      exportToPDF('Laporan Master Populasi Ternak', headers, rows, `Master_Populasi_${endDate}`);
    } else if (reportType === 'finance') {
      const headers = ['Invoice No', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Jumlah (Rp)'];
      const rows = storeService.financialTransactions.map(t => [
        t.invoiceNo, t.date, t.type.toUpperCase(), t.category, t.description, `Rp ${t.amount.toLocaleString('id-ID')}`
      ]);
      exportToPDF('Laporan Keuangan & Kas Peternakan', headers, rows, `Laporan_Keuangan_${endDate}`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-#5A2D1F" />
          <span>Pusat Laporan & Ekspor Data (PDF & Excel)</span>
        </h2>
        <p className="text-xs text-slate-500">
          Cetak dokumen resmi, rekapitulasi bulanan, dan file spreadsheet Excel untuk arsip Owner/Mitra
        </p>
      </div>

      {/* Export Config Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Jenis Laporan *</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-#5A2D1F focus:outline-none cursor-pointer"
          >
            <option value="livestock">🐄 Master Database Populasi Ternak</option>
            <option value="finance">💵 Laporan Keuangan & Buku Kas</option>
            <option value="daily">📋 Laporan Harian Kandang (Daily Reports)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-#5A2D1F focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-#5A2D1F focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-#5A2D1F hover:bg-#4A2C1D text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel (.XLSX)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Cetak Dokumen PDF</span>
          </button>
        </div>
      </div>

    </div>
  );
};

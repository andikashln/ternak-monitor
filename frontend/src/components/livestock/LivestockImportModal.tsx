import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, Check, AlertTriangle } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { LivestockType, GenderType } from '../../types';

interface ImportRow {
  tagId: string;
  type: LivestockType;
  breed: string;
  gender: GenderType;
  dob: string;
  locationName: string;
  initialWeightKg: number;
  acquisitionPrice: number;
  notes?: string;
  isValid: boolean;
  errorMsg?: string;
}

interface LivestockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LivestockImportModal: React.FC<LivestockImportModalProps> = ({ isOpen, onClose }) => {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setSuccessCount(null);

    try {
      let data: Record<string, string>[] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
        const headers = lines.shift()?.split(',').map(value => value.trim()) ?? [];
        data = lines.map(line => {
          const values = line.split(',').map(value => value.trim());
          return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
        });
      } else {
        const { default: readXlsxFile } = await import('read-excel-file');
        const spreadsheetRows = await readXlsxFile(file);
        const headers = (spreadsheetRows.shift() ?? []).map(value => String(value ?? '').trim());
        data = spreadsheetRows.map(row => Object.fromEntries(
          headers.map((header, index) => [header, String(row[index] ?? '').trim()])
        ));
      }

        const existingTags = new Set(
          storeService.livestock.filter(l => !l.deletedAt).map(l => l.tagId.toUpperCase())
        );

        const parsedRows: ImportRow[] = data.map((item, idx) => {
          const tagId = String(item.tagId || item['ID Ternak'] || item['Ear Tag'] || '').trim();
          const typeVal = String(item.type || item['Jenis'] || 'Sapi').trim();
          const type: LivestockType = ['Kerbau', 'Kambing', 'Domba'].includes(typeVal) ? (typeVal as any) : 'Sapi';
          const breed = String(item.breed || item['Ras'] || 'Lokal').trim();
          const genderVal = String(item.gender || item['Kelamin'] || 'Jantan').trim();
          const gender: GenderType = genderVal.toLowerCase().includes('betina') ? 'Betina' : 'Jantan';
          const dob = String(item.dob || item['Tanggal Lahir'] || '2024-01-01').trim();
          const locationName = String(item.location || item['Lokasi'] || 'Kulim').trim();
          const initialWeightKg = parseFloat(item.weight || item['Bobot'] || item['Bobot (kg)'] || '300') || 0;
          const acquisitionPrice = parseFloat(item.price || item['Harga'] || '15000000') || 0;

          let isValid = true;
          let error = '';

          if (!tagId) {
            isValid = false;
            error = 'Ear Tag / ID kosong';
          } else if (existingTags.has(tagId.toUpperCase())) {
            isValid = false;
            error = `Ear Tag "${tagId}" sudah terdaftar di sistem`;
          } else if (initialWeightKg <= 0) {
            isValid = false;
            error = 'Bobot <= 0 kg';
          }

          if (isValid) {
            existingTags.add(tagId.toUpperCase()); // prevent duplicate within file
          }

          return {
            tagId, type, breed, gender, dob, locationName,
            initialWeightKg, acquisitionPrice, isValid, errorMsg: error
          };
        });

      setRows(parsedRows);
    } catch (err: any) {
      setErrorMsg(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
    }
  };

  const handleExecuteImport = () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada data valid yang dapat diimpor.');
      return;
    }

    let count = 0;
    const locations = storeService.locations;

    validRows.forEach(row => {
      // match or fallback location
      const matchedLoc = locations.find(l => l.name.toLowerCase().includes(row.locationName.toLowerCase())) || locations[0];

      storeService.addLivestock({
        tagId: row.tagId,
        qrCode: `QR-${row.tagId}`,
        type: row.type,
        breed: row.breed,
        gender: row.gender,
        dob: row.dob,
        estimatedAgeMonths: 24,
        colorTraits: 'Hasil Impor Excel/CSV',
        locationId: matchedLoc.id,
        locationName: matchedLoc.name,
        ownershipStatus: 'Milik Mandiri',
        source: 'Pembelian',
        entryDate: new Date().toISOString().split('T')[0],
        acquisitionPrice: row.acquisitionPrice,
        initialWeightKg: row.initialWeightKg,
        currentWeightKg: row.initialWeightKg,
        healthStatus: 'Sehat',
        breedingStatus: 'Belum Dikawinkan',
        conditionCategory: 'Baik',
        status: 'Aktif'
      });
      count++;
    });

    setSuccessCount(count);
    setRows([]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold">Import Data Ternak (CSV / Excel)</h3>
              <p className="text-xs text-emerald-200">Upload file Excel (.xlsx) atau CSV dengan header data ternak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {successCount !== null ? (
            <div className="py-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h4 className="text-base font-bold text-emerald-900">Impor Berhasil!</h4>
              <p className="text-slate-600">
                Sebanyak <span className="font-bold text-emerald-900 text-sm">{successCount} ekor ternak</span> berhasil ditambahkan ke database.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-emerald-900 text-white font-bold rounded-lg hover:bg-emerald-800 transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          ) : (
            <>
              {/* File Upload Box */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/80 transition relative cursor-pointer">
                <Upload className="w-8 h-8 text-emerald-800 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-xs">
                  {fileName ? `File terpilih: ${fileName}` : 'Pilih file CSV atau Excel (.xlsx)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kolom yang didukung: tagId, type, breed, gender, dob, location, weight, price
                </p>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded-lg">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Preview Table */}
              {rows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span>Preview Data File ({rows.length} Baris)</span>
                    <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {rows.filter(r => r.isValid).length} Baris Valid Siap Impor
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 font-bold text-[10px] text-slate-600 uppercase">
                        <tr>
                          <th className="p-2">Status</th>
                          <th className="p-2">Ear Tag</th>
                          <th className="p-2">Jenis/Ras</th>
                          <th className="p-2">Kelamin</th>
                          <th className="p-2">Lokasi</th>
                          <th className="p-2">Bobot</th>
                          <th className="p-2">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {rows.map((r, i) => (
                          <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="p-2 font-bold">
                              {r.isValid ? (
                                <span className="text-emerald-700">✓ Valid</span>
                              ) : (
                                <span className="text-rose-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono font-bold">{r.tagId || '-'}</td>
                            <td className="p-2">{r.type} ({r.breed})</td>
                            <td className="p-2">{r.gender}</td>
                            <td className="p-2">{r.locationName}</td>
                            <td className="p-2 font-bold">{r.initialWeightKg} kg</td>
                            <td className="p-2 text-slate-500">{r.isValid ? 'Siap disimpan' : r.errorMsg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        {rows.length > 0 && successCount === null && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Baris bermasalah akan otomatis dilewati saat impor.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteImport}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan {rows.filter(r => r.isValid).length} Data Valid</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

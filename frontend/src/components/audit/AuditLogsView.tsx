import React, { useState, useEffect } from 'react';
import { History, Shield, Search } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogsView: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState(storeService.auditLogs);

  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      setAuditLogs(storeService.auditLogs);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-800" />
          <span>Audit Log Keamanan & Jejak Aktivitas Pengguna</span>
        </h2>
        <p className="text-xs text-slate-500">
          Catatan riwayat perubahan data sensitif, user, timestamp, dan modul untuk akuntabilitas total
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Jejak Aktivitas Terrekam</h3>
          <span className="text-xs font-bold text-slate-500">{auditLogs.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Waktu</th>
                <th className="p-3.5">User / Role</th>
                <th className="p-3.5">Modul</th>
                <th className="p-3.5">Tindakan</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Keterangan / Nilai Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">{formatDateTime(log.timestamp)}</td>
                  <td className="p-3.5 font-bold text-slate-900">
                    <div>{log.userName}</div>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">{log.userRole}</span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{log.module}</td>
                  <td className="p-3.5 text-emerald-800 font-semibold">{log.action}</td>
                  <td className="p-3.5 font-mono text-slate-700">{log.targetName}</td>
                  <td className="p-3.5 text-slate-600">
                    {log.afterValue || log.beforeValue || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

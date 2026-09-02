import React, { useEffect, useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { AuditLogItem } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import {
  AgroHeader, AgroStat, AgroTable, StatusBadge,
  AgroSearch, AgroSelect, AgroEmpty,
} from './AgroUI';

export const AuditTrailView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('Semua');
  const logs = useMemo(() => storeService.auditLogs, [version]);
  useEffect(() => storeService.subscribe(() => setVersion(v => v + 1)), []);

  const modules = Array.from(new Set(logs.map(l => l.module))).sort();

  const filtered = logs.filter(l =>
    (moduleFilter === 'Semua' || l.module === moduleFilter) &&
    (l.userName + l.action + l.targetName + l.module).toLowerCase().includes(search.toLowerCase()));

  const uniqueUsers = new Set(logs.map(l => l.userName)).size;
  const lastActivity = logs[0]?.timestamp ?? null;
  const roleTone = (role: string) => role === 'DEVELOPER' ? 'violet' : role === 'OWNER' ? 'green' : role === 'ADMIN' ? 'blue' : role === 'MANAGER' ? 'amber' : 'slate';

  const rows = filtered.map(l => (
    <tr key={l.id}>
      <td className="px-4 py-3 text-slate-600">{formatDateTime(l.timestamp)}</td>
      <td className="px-4 py-3 font-semibold text-slate-800">{l.userName}</td>
      <td className="px-4 py-3"><StatusBadge value={l.userRole} tone={roleTone(l.userRole)} /></td>
      <td className="px-4 py-3 font-semibold text-slate-800">{l.module}</td>
      <td className="px-4 py-3 text-slate-600">{l.action}</td>
      <td className="px-4 py-3 text-slate-600">{l.targetName}</td>
      <td className="px-4 py-3 text-[11px] text-slate-500">{(l.beforeValue || l.afterValue) ? `${l.beforeValue ?? '-'} → ${l.afterValue ?? '-'}` : '-'}</td>
    </tr>
  ));

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Report & System"
        title="Audit Trail Log"
        subtitle="Jejak aktivitas seluruh pengguna untuk transparansi dan akuntabilitas (hanya baca)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Total Aktivitas" value={String(logs.length)} hint="Semua log" />
        <AgroStat label="Pengguna Aktif" value={String(uniqueUsers)} hint="Tercatat" accent />
        <AgroStat label="Modul" value={String(modules.length)} hint="Terlacak" />
        <AgroStat label="Aktivitas Terakhir" value={lastActivity ? formatDateTime(lastActivity).slice(0, 10) : '-'} hint="Waktu terbaru" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari pengguna / aksi / target..." /></div>
        <AgroSelect label="" value={moduleFilter} onChange={setModuleFilter} options={['Semua', ...modules]} />
      </div>

      {filtered.length === 0 ? <AgroEmpty text="Belum ada aktivitas yang tercatat." /> : (
        <AgroTable headers={['Waktu', 'Pengguna', 'Peran', 'Modul', 'Aksi', 'Target', 'Perubahan']}>{rows}</AgroTable>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ScrollText className="h-4 w-4" />Log audit bersifat read-only dan tidak dapat diubah untuk menjaga integritas data.
      </div>
    </div>
  );
};

export default AuditTrailView;

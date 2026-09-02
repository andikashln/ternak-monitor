import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import { storeService } from '../../services/storeService';
import { AttendanceRecord } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

interface Draft {
  workerName: string; division: string; date: string;
  checkInTime: string; checkOutTime: string; status: string;
}

const emptyDraft = (): Draft => ({ workerName: '', division: 'Peternakan', date: new Date().toISOString().slice(0, 10), checkInTime: '', checkOutTime: '', status: 'Hadir' });
const DIVISIONS = ['Peternakan', 'Kebun', 'Perikanan', 'Inventory', 'Administrasi'];

export const AttendanceView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [divisionFilter, setDivisionFilter] = useState('Semua');
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const attendance = state.attendance;
  const setField = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));

  const filtered = attendance.filter(a =>
    (statusFilter === 'Semua' || a.status === statusFilter) &&
    (divisionFilter === 'Semua' || a.division === divisionFilter) &&
    (a.workerName + a.division).toLowerCase().includes(search.toLowerCase()));

  const countBy = (status: string) => attendance.filter(a => a.status === status).length;
  const toneFor = (status: string) => status === 'Hadir' ? 'green' : status === 'Izin' ? 'amber' : status === 'Sakit' ? 'violet' : 'red';

  const openAdd = () => { setEditing(null); setDraft(emptyDraft()); setShowForm(true); };
  const openEdit = (item: AttendanceRecord) => {
    setEditing(item);
    setDraft({ workerName: item.workerName, division: item.division, date: item.date, checkInTime: item.checkInTime, checkOutTime: item.checkOutTime ?? '', status: item.status });
    setShowForm(true);
  };

  const save = () => {
    const payload = {
      workerName: draft.workerName, division: draft.division, date: draft.date,
      checkInTime: draft.checkInTime, checkOutTime: draft.checkOutTime || undefined,
      status: draft.status as AttendanceRecord['status'], createdAt: new Date().toISOString(),
    };
    if (editing) {
      agroStore.update('attendance', editing.id, payload);
      storeService.addAuditLog('Absensi', 'Edit Absensi', editing.id, payload.workerName);
    } else {
      agroStore.add('attendance', { ...payload, id: makeId('att') });
      storeService.addAuditLog('Absensi', 'Input Absensi', payload.workerName, payload.status);
    }
    setShowForm(false);
  };

  const remove = (item: AttendanceRecord) => {
    if (!window.confirm(`Hapus absensi "${item.workerName}"?`)) return;
    agroStore.remove('attendance', item.id);
    storeService.addAuditLog('Absensi', 'Hapus Absensi', item.id, item.workerName);
  };

  const rows = filtered.map(a => (
    <tr key={a.id}>
      <td className="px-4 py-3 font-semibold text-slate-800">{a.workerName}</td>
      <td className="px-4 py-3 text-slate-600">{a.division}</td>
      <td className="px-4 py-3 text-slate-600">{formatDate(a.date).split(',')[0]}</td>
      <td className="px-4 py-3 font-semibold">{a.checkInTime}</td>
      <td className="px-4 py-3 font-semibold">{a.checkOutTime ?? '-'}</td>
      <td className="px-4 py-3"><StatusBadge value={a.status} tone={toneFor(a.status)} /></td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <AgroButton variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></AgroButton>
          <AgroButton variant="ghost" onClick={() => remove(a)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
        </div>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Operasional"
        title="Absensi Pekerja"
        subtitle="Rekap kehadiran pekerja per divisi dengan ringkasan status harian."
        actions={<AddButton onClick={openAdd} label="Catat Absensi" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Hadir" value={String(countBy('Hadir'))} hint="Masuk kerja" accent />
        <AgroStat label="Izin" value={String(countBy('Izin'))} hint="Keterangan izin" />
        <AgroStat label="Sakit" value={String(countBy('Sakit'))} hint="Surat sakit" />
        <AgroStat label="Alpha" value={String(countBy('Alpha'))} hint="Tanpa keterangan" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari nama pekerja..." /></div>
        <AgroSelect label="" value={divisionFilter} onChange={setDivisionFilter} options={['Semua', ...DIVISIONS]} />
        <AgroSelect label="" value={statusFilter} onChange={setStatusFilter} options={['Semua', 'Hadir', 'Izin', 'Sakit', 'Alpha']} />
      </div>

      {filtered.length === 0 ? <AgroEmpty text="Belum ada data absensi." /> : (
        <AgroTable headers={['Pekerja', 'Divisi', 'Tanggal', 'Masuk', 'Keluar', 'Status', 'Aksi']}>{rows}</AgroTable>
      )}

      {showForm && (
        <AgroModal title={editing ? 'Edit Absensi' : 'Catat Absensi'} onClose={() => setShowForm(false)}>
          <AgroField label="Nama Pekerja" value={draft.workerName} onChange={v => setField({ workerName: v })} />
          <div className="grid grid-cols-2 gap-3">
            <AgroSelect label="Divisi" value={draft.division} onChange={v => setField({ division: v })} options={DIVISIONS} />
            <AgroField label="Tanggal" type="date" value={draft.date} onChange={v => setField({ date: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Jam Masuk" type="time" value={draft.checkInTime} onChange={v => setField({ checkInTime: v })} />
            <AgroField label="Jam Keluar" type="time" value={draft.checkOutTime} onChange={v => setField({ checkOutTime: v })} />
          </div>
          <AgroSelect label="Status" value={draft.status} onChange={v => setField({ status: v })} options={['Hadir', 'Izin', 'Sakit', 'Alpha']} />
          <AgroButton onClick={save} className="w-full justify-center">{editing ? 'Simpan Perubahan' : 'Simpan Absensi'}</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

export default AttendanceView;

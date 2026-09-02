import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import { storeService } from '../../services/storeService';
import { TaskItem } from '../../types';
import { formatDate } from '../../utils/formatters';
import {
  AgroHeader, AgroStat, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

interface Draft {
  title: string; description: string; assignee: string;
  dueDate: string; priority: string; status: string; relatedModule: string;
}

const emptyDraft = (): Draft => ({ title: '', description: '', assignee: '', dueDate: new Date().toISOString().slice(0, 10), priority: 'Sedang', status: 'Belum Dimulai', relatedModule: '' });
const STATUS_COLUMNS: Array<{ status: TaskItem['status']; label: string }> = [
  { status: 'Belum Dimulai', label: 'Belum Dimulai' },
  { status: 'Berjalan', label: 'Berjalan' },
  { status: 'Selesai', label: 'Selesai' },
  { status: 'Tertunda', label: 'Tertunda' },
];

export const TaskManagementView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Semua');
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const tasks = state.tasks;
  const setField = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));

  const filtered = tasks.filter(t =>
    (priorityFilter === 'Semua' || t.priority === priorityFilter) &&
    (t.title + (t.assignee ?? '') + (t.relatedModule ?? '')).toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditing(null); setDraft({ ...emptyDraft(), assignee: storeService.currentUser.displayName }); setShowForm(true); };
  const openEdit = (item: TaskItem) => {
    setEditing(item);
    setDraft({ title: item.title, description: item.description ?? '', assignee: item.assignee, dueDate: item.dueDate, priority: item.priority, status: item.status, relatedModule: item.relatedModule ?? '' });
    setShowForm(true);
  };

  const save = () => {
    const payload = {
      title: draft.title, description: draft.description || undefined, assignee: draft.assignee,
      dueDate: draft.dueDate, priority: draft.priority as TaskItem['priority'],
      status: draft.status as TaskItem['status'], relatedModule: draft.relatedModule || undefined,
      createdAt: new Date().toISOString(),
    };
    if (editing) {
      agroStore.update('tasks', editing.id, payload);
      storeService.addAuditLog('Task Management', 'Edit Tugas', editing.id, payload.title);
    } else {
      agroStore.add('tasks', { ...payload, id: makeId('tsk') });
      storeService.addAuditLog('Task Management', 'Buat Tugas', payload.title, payload.assignee);
    }
    setShowForm(false);
  };

  const remove = (item: TaskItem) => {
    if (!window.confirm(`Hapus tugas "${item.title}"?`)) return;
    agroStore.remove('tasks', item.id);
    storeService.addAuditLog('Task Management', 'Hapus Tugas', item.id, item.title);
  };

  const setStatus = (item: TaskItem, status: TaskItem['status']) => {
    agroStore.update('tasks', item.id, { status });
    storeService.addAuditLog('Task Management', `Status Tugas: ${status}`, item.id, item.title, item.status, status);
  };

  const priorityTone = (p: string) => p === 'Tinggi' ? 'red' : p === 'Sedang' ? 'amber' : 'green';

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Operasional"
        title="Task Management"
        subtitle="Kelola tugas harian tim secara papan kanban dengan filter prioritas."
        actions={<AddButton onClick={openAdd} label="Buat Tugas" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Total Tugas" value={String(tasks.length)} hint="Semua status" />
        <AgroStat label="Berjalan" value={String(tasks.filter(t => t.status === 'Berjalan').length)} hint="Sedang dikerjakan" accent />
        <AgroStat label="Selesai" value={String(tasks.filter(t => t.status === 'Selesai').length)} hint="Tuntas" />
        <AgroStat label="Tertunda" value={String(tasks.filter(t => t.status === 'Tertunda').length)} hint="Perlu perhatian" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari judul / petugas / modul..." /></div>
        <AgroSelect label="" value={priorityFilter} onChange={setPriorityFilter} options={['Semua', 'Rendah', 'Sedang', 'Tinggi']} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.status);
          return (
            <div key={col.status} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="mb-2 flex items-center justify-between text-xs font-black text-slate-600">
                {col.label}
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500">{colTasks.length}</span>
              </p>
              <div className="space-y-2">
                {colTasks.map(t => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black text-slate-800">{t.title}</p>
                      <StatusBadge value={t.priority} tone={priorityTone(t.priority)} />
                    </div>
                    {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}
                    <p className="mt-2 text-[11px] text-slate-500">👤 {t.assignee}{t.relatedModule ? ` · ${t.relatedModule}` : ''}</p>
                    <p className="text-[11px] text-slate-500">📅 {formatDate(t.dueDate).split(',')[0]}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {col.status !== 'Selesai' && <AgroButton variant="ghost" onClick={() => setStatus(t, 'Selesai')}><CheckCircle2 className="h-4 w-4 text-emerald-600" /></AgroButton>}
                      <AgroButton variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></AgroButton>
                      <AgroButton variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Kosong</p>}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <AgroModal title={editing ? 'Edit Tugas' : 'Buat Tugas Baru'} onClose={() => setShowForm(false)}>
          <AgroField label="Judul Tugas" value={draft.title} onChange={v => setField({ title: v })} />
          <AgroField label="Deskripsi" value={draft.description} onChange={v => setField({ description: v })} placeholder="Detail pekerjaan (opsional)..." />
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Petugas" value={draft.assignee} onChange={v => setField({ assignee: v })} />
            <AgroField label="Tenggat" type="date" value={draft.dueDate} onChange={v => setField({ dueDate: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgroSelect label="Prioritas" value={draft.priority} onChange={v => setField({ priority: v })} options={['Rendah', 'Sedang', 'Tinggi']} />
            <AgroSelect label="Status" value={draft.status} onChange={v => setField({ status: v })} options={['Belum Dimulai', 'Berjalan', 'Selesai', 'Tertunda']} />
          </div>
          <AgroField label="Modul Terkait" value={draft.relatedModule} onChange={v => setField({ relatedModule: v })} placeholder="Kebun / Perikanan / Peternakan..." />
          <AgroButton onClick={save} className="w-full justify-center">{editing ? 'Simpan Perubahan' : 'Simpan Tugas'}</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

export default TaskManagementView;

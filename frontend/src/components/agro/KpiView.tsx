import React, { useEffect, useMemo, useState } from 'react';
import { Award, Pencil, Plus, Trash2 } from 'lucide-react';
import { agroStore, makeId } from '../../services/agroStore';
import { storeService } from '../../services/storeService';
import { KpiScore } from '../../types';
import {
  AgroHeader, AgroStat, AgroTable, StatusBadge, AgroButton,
  AgroSearch, AgroModal, AgroField, AgroSelect, AgroEmpty, AddButton,
} from './AgroUI';

interface Draft {
  workerName: string; division: string; period: string;
  attendanceScore: string; productivityScore: string; disciplineScore: string;
}

const emptyDraft = (): Draft => ({
  workerName: '', division: 'Peternakan', period: new Date().toISOString().slice(0, 7),
  attendanceScore: '', productivityScore: '', disciplineScore: '',
});
const DIVISIONS = ['Peternakan', 'Kebun', 'Perikanan', 'Inventory', 'Administrasi'];
const WEIGHTS = { attendance: 0.3, productivity: 0.4, discipline: 0.3 };

export const KpiView: React.FC = () => {
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Semua');
  const [editing, setEditing] = useState<KpiScore | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const state = useMemo(() => agroStore.snapshot(), [version]);
  useEffect(() => agroStore.subscribe(() => setVersion(v => v + 1)), []);

  const kpis = state.kpis;
  const setField = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const periods = Array.from(new Set(kpis.map(k => k.period))).sort().reverse();

  const totalScore = Math.round(
    (Number(draft.attendanceScore) || 0) * WEIGHTS.attendance +
    (Number(draft.productivityScore) || 0) * WEIGHTS.productivity +
    (Number(draft.disciplineScore) || 0) * WEIGHTS.discipline
  );

  const filtered = kpis
    .filter(k => (periodFilter === 'Semua' || k.period === periodFilter) && (k.workerName + k.division).toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => b.totalScore - a.totalScore);

  const avgScore = kpis.length ? Math.round(kpis.reduce((s, k) => s + k.totalScore, 0) / kpis.length) : 0;
  const topWorker = filtered[0];
  const gradeFor = (score: number) => score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
  const toneFor = (score: number) => score >= 80 ? 'green' : score >= 70 ? 'amber' : 'red';

  const openAdd = () => { setEditing(null); setDraft(emptyDraft()); setShowForm(true); };
  const openEdit = (item: KpiScore) => {
    setEditing(item);
    setDraft({ workerName: item.workerName, division: item.division, period: item.period, attendanceScore: String(item.attendanceScore), productivityScore: String(item.productivityScore), disciplineScore: String(item.disciplineScore) });
    setShowForm(true);
  };

  const save = () => {
    const payload = {
      workerName: draft.workerName, division: draft.division, period: draft.period,
      attendanceScore: Number(draft.attendanceScore) || 0,
      productivityScore: Number(draft.productivityScore) || 0,
      disciplineScore: Number(draft.disciplineScore) || 0,
      totalScore, createdAt: new Date().toISOString(),
    };
    if (editing) {
      agroStore.update('kpis', editing.id, payload);
      storeService.addAuditLog('KPI', 'Edit KPI', editing.id, payload.workerName);
    } else {
      agroStore.add('kpis', { ...payload, id: makeId('kpi') });
      storeService.addAuditLog('KPI', 'Input KPI', payload.workerName, `${payload.period} · ${totalScore}`);
    }
    setShowForm(false);
  };

  const remove = (item: KpiScore) => {
    if (!window.confirm(`Hapus KPI "${item.workerName}"?`)) return;
    agroStore.remove('kpis', item.id);
    storeService.addAuditLog('KPI', 'Hapus KPI', item.id, item.workerName);
  };

  const rows = filtered.map((k, idx) => (
    <tr key={k.id} className={idx === 0 ? 'bg-[#f9ebcc]/40' : ''}>
      <td className="px-4 py-3 font-black text-slate-800">{idx + 1}</td>
      <td className="px-4 py-3 font-semibold text-slate-800">{k.workerName}{idx === 0 && <Award className="ml-2 inline h-4 w-4 text-[#d2ad76]" />}</td>
      <td className="px-4 py-3 text-slate-600">{k.division}</td>
      <td className="px-4 py-3 text-slate-600">{k.period}</td>
      <td className="px-4 py-3 text-slate-600">{k.attendanceScore}</td>
      <td className="px-4 py-3 text-slate-600">{k.productivityScore}</td>
      <td className="px-4 py-3 text-slate-600">{k.disciplineScore}</td>
      <td className="px-4 py-3 font-black">{k.totalScore}</td>
      <td className="px-4 py-3"><StatusBadge value={gradeFor(k.totalScore)} tone={toneFor(k.totalScore)} /></td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <AgroButton variant="ghost" onClick={() => openEdit(k)}><Pencil className="h-4 w-4" /></AgroButton>
          <AgroButton variant="ghost" onClick={() => remove(k)}><Trash2 className="h-4 w-4 text-rose-500" /></AgroButton>
        </div>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-5 pb-16">
      <AgroHeader
        kicker="Operasional"
        title="KPI Score"
        subtitle="Penilaian kinerja pekerja dengan skor total terbobot (kehadiran 30%, produktivitas 40%, disiplin 30%)."
        actions={<AddButton onClick={openAdd} label="Input KPI" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AgroStat label="Total Penilaian" value={String(kpis.length)} hint="Periode berjalan" />
        <AgroStat label="Rata-rata Skor" value={String(avgScore)} hint="Keseluruhan" accent />
        <AgroStat label="Peringkat Tertinggi" value={topWorker ? topWorker.workerName : '-'} hint={topWorker ? `Skor ${topWorker.totalScore}` : 'Belum ada'} accent />
        <AgroStat label="Peringkat A (≥90)" value={String(kpis.filter(k => k.totalScore >= 90).length)} hint="Kinerja unggul" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><AgroSearch value={search} onChange={setSearch} placeholder="Cari pekerja / divisi..." /></div>
        <AgroSelect label="" value={periodFilter} onChange={setPeriodFilter} options={['Semua', ...periods]} />
      </div>

      {filtered.length === 0 ? <AgroEmpty text="Belum ada data KPI." /> : (
        <AgroTable headers={['#', 'Pekerja', 'Divisi', 'Periode', 'Kehadiran', 'Produktivitas', 'Disiplin', 'Total', 'Grade', 'Aksi']}>{rows}</AgroTable>
      )}

      {showForm && (
        <AgroModal title={editing ? 'Edit KPI' : 'Input KPI Baru'} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <AgroField label="Nama Pekerja" value={draft.workerName} onChange={v => setField({ workerName: v })} />
            <AgroSelect label="Divisi" value={draft.division} onChange={v => setField({ division: v })} options={DIVISIONS} />
          </div>
          <AgroField label="Periode (YYYY-MM)" type="month" value={draft.period} onChange={v => setField({ period: v })} />
          <div className="grid grid-cols-3 gap-3">
            <AgroField label="Kehadiran" type="number" value={draft.attendanceScore} onChange={v => setField({ attendanceScore: v })} />
            <AgroField label="Produktivitas" type="number" value={draft.productivityScore} onChange={v => setField({ productivityScore: v })} />
            <AgroField label="Disiplin" type="number" value={draft.disciplineScore} onChange={v => setField({ disciplineScore: v })} />
          </div>
          <div className="rounded-xl bg-[#f9ebcc]/60 p-3 text-sm font-black text-[#5a2d1f]">
            Skor Total Otomatis: {totalScore} <span className="ml-2">Grade: {gradeFor(totalScore)}</span>
          </div>
          <AgroButton onClick={save} className="w-full justify-center">{editing ? 'Simpan Perubahan' : 'Simpan KPI'}</AgroButton>
        </AgroModal>
      )}
    </div>
  );
};

export default KpiView;

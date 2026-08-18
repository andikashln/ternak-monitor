import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Plus, Search, ShieldCheck, UserCheck, UserX, Users, X } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { storeService } from '../../services/storeService';
import { ManagedUser, UserRole } from '../../types';

const ALL_ROLES: UserRole[] = ['OWNER', 'ADMIN', 'USER'];
const roleLabels: Record<UserRole, string> = {
  OWNER: 'Owner', ADMIN: 'Administrator', USER: 'User (Katalog Sapi)',
};

const emptyForm = {
  displayName: '', email: '', password: '', role: 'USER' as UserRole,
  phone: '', status: 'Aktif' as const, locationIds: [] as string[],
};

export const UserManagementView: React.FC = () => {
  const currentUser = storeService.currentUser;
  const locations = storeService.locations;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const allowedCreateRoles = currentUser.role === 'OWNER' ? ALL_ROLES : ALL_ROLES.filter(role => role !== 'OWNER');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal memuat daftar pengguna.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter(user => `${user.displayName} ${user.email} ${user.role}`.toLowerCase().includes(query));
  }, [users, search]);

  const canManage = (user: ManagedUser) => {
    if (user.uid === currentUser.uid) return false;
    return currentUser.role === 'OWNER' || user.role !== 'OWNER';
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await usersAPI.create(form);
      setForm(emptyForm);
      setIsCreateOpen(false);
      setMessage({ type: 'success', text: 'Akun pengguna berhasil dibuat.' });
      await loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal membuat akun.' });
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user: ManagedUser, updates: Partial<ManagedUser>) => {
    setMessage(null);
    try {
      const response = await usersAPI.update(user.uid, updates);
      setUsers(items => items.map(item => item.uid === user.uid ? response.data.data : item));
      setMessage({ type: 'success', text: `Akun ${user.displayName} berhasil diperbarui.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal memperbarui akun.' });
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetTarget) return;
    setSaving(true);
    try {
      await usersAPI.resetPassword(resetTarget.uid, newPassword);
      setMessage({ type: 'success', text: `Password ${resetTarget.displayName} berhasil direset.` });
      setResetTarget(null);
      setNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal mereset password.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setForm(value => ({
      ...value,
      locationIds: value.locationIds.includes(locationId)
        ? value.locationIds.filter(id => id !== locationId)
        : [...value.locationIds, locationId],
    }));
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Users className="h-5 w-5 text-emerald-800" /> Manajemen Pengguna
          </h2>
          <p className="text-xs text-slate-500">Kelola akun, role, lokasi akses, status, dan password pengguna.</p>
        </div>
        <button onClick={() => { setMessage(null); setIsCreateOpen(true); }} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">
          <Plus className="h-4 w-4" /> Buat Akun
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari nama, email, atau role..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-emerald-800" />
          </div>
          <p className="text-xs font-semibold text-slate-500">{users.length} akun terdaftar</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-xs font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Memuat pengguna...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr><th className="p-4">Pengguna</th><th className="p-4">Role</th><th className="p-4">Akses Lokasi</th><th className="p-4">Status</th><th className="p-4 text-right">Tindakan</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50/70">
                    <td className="p-4"><div className="font-bold text-slate-900">{user.displayName}{user.uid === currentUser.uid && <span className="ml-2 text-[9px] text-emerald-700">ANDA</span>}</div><div className="text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ''}</div></td>
                    <td className="p-4">
                      {canManage(user) ? (
                        <select value={user.role} onChange={event => void updateUser(user, { role: event.target.value as UserRole })} className="rounded-lg border border-slate-300 px-2 py-1.5 font-bold text-slate-700">
                          {allowedCreateRoles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
                        </select>
                      ) : <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-900">{roleLabels[user.role]}</span>}
                    </td>
                    <td className="p-4 text-slate-600">{user.locationIds.length === 0 ? 'Semua lokasi' : user.locationIds.map(id => locations.find(location => location.id === id)?.name || id).join(', ')}</td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 font-bold ${user.status === 'Aktif' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>{user.status}</span></td>
                    <td className="p-4"><div className="flex justify-end gap-2">
                      <button disabled={!canManage(user)} onClick={() => void updateUser(user, { status: user.status === 'Aktif' ? 'Nonaktif' : 'Aktif' })} title={user.status === 'Aktif' ? 'Nonaktifkan akun' : 'Aktifkan akun'} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30">
                        {user.status === 'Aktif' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button disabled={!canManage(user)} onClick={() => { setResetTarget(user); setNewPassword(''); setMessage(null); }} title="Reset password" className="rounded-lg border border-slate-200 p-2 text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"><KeyRound className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-emerald-900 p-4 text-white"><h3 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5" /> Buat Akun Pengguna</h3><button onClick={() => setIsCreateOpen(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4 p-5 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="font-bold text-slate-700">Nama Lengkap *<input required value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-800" /></label>
                <label className="font-bold text-slate-700">Nomor Telepon<input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-800" /></label>
              </div>
              <label className="block font-bold text-slate-700">Email *<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-800" /></label>
              <label className="block font-bold text-slate-700">Password Sementara *<input type="password" minLength={8} required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-800" /><span className="mt-1 block font-normal text-slate-400">Minimal 8 karakter. Sampaikan secara aman kepada pengguna.</span></label>
              <label className="block font-bold text-slate-700">Role *<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value as UserRole })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-800">{allowedCreateRoles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
              <fieldset><legend className="font-bold text-slate-700">Akses Lokasi</legend><p className="mt-1 text-slate-400">Tidak memilih lokasi berarti akses ke semua lokasi.</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{locations.map(location => <label key={location.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 font-semibold text-slate-700"><input type="checkbox" checked={form.locationIds.includes(location.id)} onChange={() => toggleLocation(location.id)} className="accent-emerald-800" />{location.name}</label>)}</div></fieldset>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-600">Batal</button><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-emerald-900 px-5 py-2 font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Simpan Akun</button></div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleResetPassword} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Reset Password</h3><button type="button" onClick={() => setResetTarget(null)}><X className="h-5 w-5 text-slate-500" /></button></div>
            <p className="mt-2 text-xs text-slate-500">Buat password sementara baru untuk <strong>{resetTarget.displayName}</strong>.</p>
            <input type="password" minLength={8} required autoFocus value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="Minimal 8 karakter" className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-800" />
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setResetTarget(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">Batal</button><button disabled={saving} className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">Reset Password</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

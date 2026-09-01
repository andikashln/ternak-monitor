import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Leaf, Loader2, LockKeyhole, Mail, ShieldCheck, Store } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onDemoLogin: () => Promise<void>;
  onOpenCatalog: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onDemoLogin, onOpenCatalog }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Tidak dapat masuk. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await onDemoLogin();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login demo belum dapat dibuka. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDevelopmentAccount = () => {
    setEmail('owner@sapipapi.farm');
    setPassword('Demo123!');
    setErrorMessage('');
  };

  return (
    <main className="min-h-screen bg-[#F3DDB0] text-[#24150F] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#5A2D1F] px-12 py-14 text-[#FFF8E8] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#C66C3C]/20" />
        <div className="absolute -bottom-44 -left-24 h-[34rem] w-[34rem] rounded-full border border-[#F3DDB0]/15" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Leaf className="h-6 w-6 text-[#f3ddb0]" />
          </div>
          <div>
            <p className="text-xl font-black tracking-tight">SAPI PAPI FARM</p>
            <p className="text-xs font-semibold tracking-wide text-[#f3ddb0]">Sistem Peternakan Terpadu</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="mb-5 inline-flex rounded-full border border-emerald-200/20 bg-white/5 px-3 py-1 text-xs font-bold text-[#f3ddb0]">
            TERNAK MONITOR
          </span>
          <h1 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            Keputusan peternakan yang lebih cepat, berbasis data yang rapi.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#fff8e8]/75">
            Pantau populasi, kesehatan, dan arus keuangan seluruh lokasi dari satu ruang kerja.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-[#f3ddb0]/70">
          <ShieldCheck className="h-4 w-4" />
          <span>Akses dilindungi dan disesuaikan dengan peran pengguna.</span>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5a2d1f] text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black tracking-tight">SAPI PAPI FARM</p>
              <p className="text-[11px] font-semibold text-[#5a2d1f]">Sistem Peternakan Terpadu</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5a2d1f]">Selamat datang</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Masuk ke dashboard</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan akun yang telah diberikan oleh administrator.</p>
            </div>

            {errorMessage && (
              <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#a8462d] focus:ring-4 focus:ring-[#a8462d]/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#a8462d] focus:ring-4 focus:ring-[#a8462d]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5a2d1f] px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#245b43] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950 transition hover:bg-[#f3ddb0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Membuka Demo...' : 'Login Demo Sekali Klik'}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">Masuk ke data contoh Sapi Papi Farm tanpa mengisi akun.</p>

            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={onOpenCatalog}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d2ad76] bg-[#f9ebcc] px-4 py-3 text-sm font-black text-[#5a2d1f] transition hover:bg-[#f3ddb0]"
            >
              <Store className="h-4 w-4" />
              Lihat Katalog Sapi Tanpa Login
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">Akses khusus customer untuk melihat sapi yang tersedia.</p>

            {import.meta.env.DEV && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold">Mode development</p>
                <p className="mt-1 text-amber-800">Akun demo: owner/manager/akuntan/mitra@sapipapi.farm · password `Demo123!`.</p>
                <button type="button" onClick={fillDevelopmentAccount} className="mt-2 font-black text-[#5a2d1f] hover:underline">
                  Isi akun development
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">© 2026 Sapi Papi Farm · Ternak Monitor</p>
        </div>
      </section>
    </main>
  );
};

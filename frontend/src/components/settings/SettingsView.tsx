import React, { useEffect, useState } from 'react';
import { Settings, Pencil, Ban, Save } from 'lucide-react';
import { storeService } from '../../services/storeService';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState(storeService.settings);
  const [locations, setLocations] = useState(storeService.locations);
  const [saved, setSaved] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => storeService.subscribe(() => setLocations([...storeService.locations])), []);

  // New location form
  const [newLocName, setNewLocName] = useState('');
  const [newLocPic, setNewLocPic] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storeService.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEditLocation = (id: string) => {
    const location = locations.find(item => item.id === id);
    if (!location) return;
    const name = window.prompt('Nama lokasi:', location.name);
    if (name === null || !name.trim()) return;
    const address = window.prompt('Alamat lokasi:', location.address);
    if (address === null) return;
    const picName = window.prompt('Nama PIC:', location.picName);
    if (picName === null) return;
    const picPhone = window.prompt('Telepon PIC:', location.picPhone);
    if (picPhone === null) return;
    storeService.updateLocation(id, { name: name.trim(), address, picName, picPhone });
    setLocationMessage('Lokasi berhasil diperbarui.');
  };

  const handleDeactivateLocation = (id: string) => {
    if (!window.confirm('Nonaktifkan lokasi ini? Data historis tetap disimpan.')) return;
    const result = storeService.deactivateLocation(id);
    setLocationMessage(result.ok ? 'Lokasi berhasil dinonaktifkan.' : result.reason ?? 'Lokasi tidak dapat dinonaktifkan.');
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    storeService.addLocation({
      name: newLocName,
      address: newLocAddress,
      picName: newLocPic,
      picPhone: newLocPhone,
      livestockTypes: ['Sapi', 'Kerbau'],
      penCount: 4,
      status: 'Aktif'
    });

    setLocations([...storeService.locations]);
    setNewLocName('');
    setNewLocPic('');
    setNewLocPhone('');
    setNewLocAddress('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-800" />
          <span>Pengaturan Perusahaan & Master Lokasi Kandang</span>
        </h2>
        <p className="text-xs text-slate-500">
          Atur profil usaha peternakan, daftar cabang/kandang, kategori transaksi, dan reset database
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Company Settings Form */}
        <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Profil Usaha Peternakan</h3>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Usaha *</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Owner / Pemilik</label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={e => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. Kontak Utama</label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Kantor Pusat</label>
            <textarea
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {saved && <span className="text-emerald-700 font-bold">✓ Berhasil disimpan!</span>}
            <button
              type="submit"
              className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-emerald-900 text-white font-bold rounded-lg hover:bg-emerald-800 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>

        {/* Master Locations Management */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Master Lokasi Peternakan ({locations.length})</h3>
          {locationMessage && <div role="status" className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 font-semibold">{locationMessage}</div>}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {locations.map(loc => (
              <div key={loc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">📍 {loc.name}</h4>
                  <p className="text-[11px] text-slate-500">PIC: {loc.picName} ({loc.picPhone})</p>
                </div>
                <div className="flex items-center gap-1"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loc.status === 'Aktif' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>{loc.status}</span>
                  <button type="button" onClick={() => handleEditLocation(loc.id)} aria-label={`Edit lokasi ${loc.name}`} className="p-1 text-blue-700 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                  {loc.status === 'Aktif' && <button type="button" onClick={() => handleDeactivateLocation(loc.id)} aria-label={`Nonaktifkan lokasi ${loc.name}`} className="p-1 text-rose-700 hover:bg-rose-50 rounded"><Ban className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddLocation} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-[11px]">Tambah Lokasi Kandang Baru:</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Lokasi (e.g. Kandang 4 Siak)"
                value={newLocName}
                onChange={e => setNewLocName(e.target.value)}
                required
                className="p-1.5 border border-slate-300 rounded bg-white text-xs"
              />
              <input
                type="text"
                placeholder="Nama PIC Kandang"
                value={newLocPic}
                onChange={e => setNewLocPic(e.target.value)}
                className="p-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs transition cursor-pointer"
            >
              + Tambah Lokasi Baru
            </button>
          </form>

          {/* Reset Demo Data */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset seluruh data ke Seed Demo Awal?')) {
                  storeService.resetToSeed();
                  setLocations([...storeService.locations]);
                  setSettings(storeService.settings);
                }
              }}
              className="text-rose-600 font-bold hover:underline cursor-pointer"
            >
              🔄 Reset Data ke Seed Demo
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

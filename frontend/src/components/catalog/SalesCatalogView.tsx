import React, { useEffect, useMemo, useState } from 'react';
import { Beef, MapPin, Scale, Search, ShieldCheck, Store } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { formatRupiah } from '../../utils/formatters';

interface SalesCatalogViewProps {
  globalSearchQuery?: string;
}

export const SalesCatalogView: React.FC<SalesCatalogViewProps> = ({ globalSearchQuery = '' }) => {
  const [livestock, setLivestock] = useState(
    storeService.livestock.filter(item => item.status === 'Aktif' && item.type === 'Sapi')
  );
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => storeService.subscribe(() => {
    setLivestock(storeService.livestock.filter(item => item.status === 'Aktif' && item.type === 'Sapi'));
  }), []);

  const query = (globalSearchQuery || localSearch).trim().toLowerCase();
  const filteredLivestock = useMemo(() => livestock.filter(item => {
    if (!query) return true;
    return [item.tagId, item.breed, item.gender, item.locationName, item.colorTraits]
      .some(value => String(value || '').toLowerCase().includes(query));
  }), [livestock, query]);

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      <section className="overflow-hidden rounded-3xl bg-[#123b2b] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-#EFE5D5">
              <Store className="h-4 w-4" /> Katalog Penjualan
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Temukan sapi pilihan dari SAPI PAPI FARM</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-#FBF8F2/75">
              Lihat informasi sapi yang tersedia, bobot terkini, lokasi, kondisi kesehatan, dan harga jual.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-#F5EFE6">
            <ShieldCheck className="h-5 w-5" /> Informasi katalog hanya dapat dilihat
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
              <Beef className="h-5 w-5 text-#5A2D1F" /> Sapi Tersedia
            </h2>
            <p className="mt-1 text-xs text-slate-500">{filteredLivestock.length} ekor sesuai pencarian</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={localSearch}
              onChange={event => setLocalSearch(event.target.value)}
              placeholder="Cari ras, Ear Tag, atau lokasi..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-#5A2D1F focus:ring-4 focus:ring-#5A2D1F/10"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredLivestock.map(item => {
            const sellingPrice = item.sellingPrice ?? Math.round(item.acquisitionPrice * 1.2);
            const years = Math.floor(item.estimatedAgeMonths / 12);
            const months = item.estimatedAgeMonths % 12;
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative h-52 bg-gradient-to-br from-#FBF8F2 to-slate-100">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={`Sapi ${item.tagId}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-#4A2C1D/45">
                      <Beef className="h-14 w-14" />
                      <span className="mt-2 text-xs font-bold">Foto sapi belum tersedia</span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-#4A2C1D shadow">
                    {item.healthStatus}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-lg font-black text-slate-950">{item.tagId}</p>
                      <p className="text-xs font-semibold text-slate-500">Sapi {item.breed} · {item.gender}</p>
                    </div>
                    <span className="rounded-lg bg-#FBF8F2 px-2 py-1 text-[10px] font-bold text-#5A2D1F">TERSEDIA</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5 text-#5A2D1F" /> {item.currentWeightKg} kg</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-#5A2D1F" /> {item.locationName}</span>
                    <span>Umur: {years > 0 ? `${years} th ` : ''}{months} bln</span>
                    <span>Kondisi: {item.conditionCategory}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Harga jual</p>
                    <p className="mt-0.5 font-mono text-xl font-black text-#5A2D1F">{formatRupiah(sellingPrice)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredLivestock.length === 0 && (
          <div className="py-14 text-center text-sm text-slate-500">
            <Beef className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            Tidak ada sapi yang sesuai dengan pencarian.
          </div>
        )}
      </section>
    </div>
  );
};

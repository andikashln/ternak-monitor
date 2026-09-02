import React, { useState, useEffect } from 'react';
import { Bell, Check, AlertTriangle, Info, HeartPulse } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { formatDate } from '../../utils/formatters';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState(storeService.notifications);

  useEffect(() => {
    const unsubscribe = storeService.subscribe(() => {
      setNotifications(storeService.notifications);
    });
    return unsubscribe;
  }, []);

  const handleMarkRead = (id: string) => {
    storeService.markNotificationRead(id);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-#5A2D1F" />
            <span>Pusat Notifikasi & Peringatan Dini Sistem</span>
          </h2>
          <p className="text-xs text-slate-500">
            Alert otomatis untuk ternak sakit, stok pakan habis, kebuntingan jatuh tempo, dan perubahan kritis
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
              n.isRead ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-200 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                n.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                n.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-400 block mt-1">{formatDate(n.createdAt)}</span>
              </div>
            </div>

            {!n.isRead && (
              <button
                onClick={() => handleMarkRead(n.id)}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Tandai Dibaca
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

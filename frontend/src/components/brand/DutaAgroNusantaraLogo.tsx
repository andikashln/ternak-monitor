import React from 'react';

interface DutaAgroNusantaraLogoProps {
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * Logo PT Duta Agri Nusantara (line-art agro, hijau + emas).
 * - 'mark'   : icon saja (sidebar / favicon konteks kecil)
 * - 'lockup' : icon + teks "PT DUTA AGRI — NUSANTARA"
 */
export const DutaAgroNusantaraLogo: React.FC<DutaAgroNusantaraLogoProps> = ({
  variant = 'lockup',
  className = '',
}) => {
  if (variant === 'mark') {
    return (
      <img
        src="/icons/icon-64x64.png"
        alt="Logo PT Duta Agri Nusantara"
        className={`shrink-0 ${className}`}
        style={{ height: 36, width: 36, borderRadius: 8 }}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/icons/icon-64x64.png"
        alt="Logo PT Duta Agri Nusantara"
        className="h-9 w-9 shrink-0"
        style={{ borderRadius: 9 }}
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-extrabold tracking-tight text-[#0B1F17]">
          PT DUTA AGRI
        </span>
        <span className="block text-[10px] font-bold tracking-[0.18em] text-[#C9971C]">
          NUSANTARA
        </span>
      </span>
    </div>
  );
};

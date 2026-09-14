import React from 'react';

interface DutaAgroNusantaraLogoProps {
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * Logo PT.Duta Agro Nusantara (line-art cow + barn, monokrom coklat).
 * - 'mark'   : icon saja (untuk sidebar / favicon konteks kecil)
 * - 'lockup' : icon + teks "PT.DUTA AGRO — NUSANTARA"
 */
export const DutaAgroNusantaraLogo: React.FC<DutaAgroNusantaraLogoProps> = ({
  variant = 'lockup',
  className = '',
}) => {
  if (variant === 'mark') {
    return (
      <img
        src="/icons/icon-64x64.png"
        alt="Logo PT.Duta Agro Nusantara"
        className={`shrink-0 ${className}`}
        style={{ height: 36, width: 36 }}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/icons/icon-64x64.png"
        alt="Logo PT.Duta Agro Nusantara"
        className="h-9 w-9 shrink-0"
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-extrabold tracking-tight text-[#24150F]">
          PT.DUTA AGRO
        </span>
        <span className="block text-[10px] font-bold tracking-[0.18em] text-[#937A65]">
          NUSANTARA
        </span>
      </span>
    </div>
  );
};

import React from 'react';

interface PapiFarmRiauLogoProps {
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * Logo asli Papi Farm Riau (line-art cow + barn, monokrom coklat).
 * - 'mark'   : icon saja (untuk sidebar / favicon konteks kecil)
 * - 'lockup' : icon + teks "PAPI FARM — FARM"
 */
export const PapiFarmRiauLogo: React.FC<PapiFarmRiauLogoProps> = ({
  variant = 'lockup',
  className = '',
}) => {
  if (variant === 'mark') {
    return (
      <img
        src="/icons/icon-64x64.png"
        alt="Logo Papi Farm Riau"
        className={`shrink-0 ${className}`}
        style={{ height: 36, width: 36 }}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/icons/icon-64x64.png"
        alt="Logo Papi Farm Riau"
        className="h-9 w-9 shrink-0"
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-extrabold tracking-tight text-[#24150F]">
          PAPI FARM
        </span>
        <span className="block text-[10px] font-bold tracking-[0.18em] text-[#937A65]">
          RIAU
        </span>
      </span>
    </div>
  );
};

import React from 'react';

interface SapiPapiLogoProps {
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * Logo asli Sapi Papi Farm (line-art cow + barn, monokrom coklat).
 * - 'mark'   : icon saja (untuk sidebar / favicon konteks kecil)
 * - 'lockup' : icon + teks "SAPI PAPI — FARM"
 */
export const SapiPapiLogo: React.FC<SapiPapiLogoProps> = ({
  variant = 'lockup',
  className = '',
}) => {
  if (variant === 'mark') {
    return (
      <img
        src="/icons/icon-64x64.png"
        alt="Logo Sapi Papi Farm"
        className={`shrink-0 ${className}`}
        style={{ height: 36, width: 36 }}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/icons/icon-64x64.png"
        alt="Logo Sapi Papi Farm"
        className="h-9 w-9 shrink-0"
      />
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-extrabold tracking-tight text-[#24150F]">
          SAPI PAPI
        </span>
        <span className="block text-[10px] font-bold tracking-[0.18em] text-[#937A65]">
          FARM
        </span>
      </span>
    </div>
  );
};

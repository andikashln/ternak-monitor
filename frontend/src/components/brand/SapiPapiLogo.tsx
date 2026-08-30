import React from 'react';

interface SapiPapiLogoProps {
  variant?: 'mark' | 'lockup';
  className?: string;
}

export const SapiPapiLogo: React.FC<SapiPapiLogoProps> = ({
  variant = 'lockup',
  className = '',
}) => (
  <div className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg
      aria-label="Logo Sapi Papi Farm"
      className="h-9 w-9 shrink-0"
      viewBox="0 0 48 48"
      fill="none"
      role="img"
    >
      <rect width="48" height="48" rx="12" fill="#5A2D1F" />
      <path d="M12 20.5 24 12l12 8.5v13A6.5 6.5 0 0 1 29.5 40h-11A6.5 6.5 0 0 1 12 33.5v-13Z" fill="#F3DDB0" />
      <path d="M16 21.5c2.5-2.5 5.2-3.7 8-3.7s5.5 1.2 8 3.7v7.8c0 4.1-3.6 7.5-8 7.5s-8-3.4-8-7.5v-7.8Z" fill="#5A2D1F" />
      <path d="M16.2 24.2 12.5 21l.7-5.2 5 2.2M31.8 24.2l3.7-3.2-.7-5.2-5 2.2" stroke="#5A2D1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20.3" cy="27.2" r="1.45" fill="#F3DDB0" />
      <circle cx="27.7" cy="27.2" r="1.45" fill="#F3DDB0" />
      <path d="M21 32.2c1.8 1.3 4.2 1.3 6 0" stroke="#F3DDB0" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 14.7h8" stroke="#F3DDB0" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
    {variant === 'lockup' && (
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-black tracking-tight text-[#5A2D1F]">SAPI PAPI</span>
        <span className="block text-[10px] font-bold tracking-[0.16em] text-[#A8462D]">FARM</span>
      </span>
    )}
  </div>
);

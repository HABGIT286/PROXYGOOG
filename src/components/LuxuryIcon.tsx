import React from 'react';

export type LuxuryIconVariant =
  | 'shield'
  | 'proxy'
  | 'zap'
  | 'globe'
  | 'qr'
  | 'nfc'
  | 'crown'
  | 'storage'
  | 'bell'
  | 'users'
  | 'studio'
  | 'contact'
  | 'speed'
  | 'clock'
  | 'send';

interface LuxuryIconProps {
  variant: LuxuryIconVariant;
  tone?: 'gold' | 'glass' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LuxuryIcon: React.FC<LuxuryIconProps> = ({
  variant,
  tone = 'glass',
  size = 'md',
  className = '',
}) => {
  const sizeBox =
    size === 'sm'
      ? 'h-8 w-8 rounded-xl'
      : size === 'lg'
      ? 'h-12 w-12 rounded-2xl'
      : 'h-10 w-10 rounded-xl';

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  const medallionClass =
    tone === 'gold'
      ? 'el-medallion-gold text-[#181108]'
      : tone === 'emerald'
      ? 'el-medallion-emerald text-emerald-300'
      : 'el-medallion-glass text-[#fae7be]';

  const renderGlyph = () => {
    switch (variant) {
      case 'shield':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <defs>
              <linearGradient id="lxShield" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5L4.5 5.6V11.4C4.5 16.3 7.7 20.6 12 21.8C16.3 20.6 19.5 16.3 19.5 11.4V5.6L12 2.5Z"
              fill="url(#lxShield)"
              fillOpacity="0.22"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M9.2 12.1L11.2 14.1L15.1 9.9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'proxy':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <circle cx="12" cy="12" r="2.6" fill="currentColor" />
            <path
              d="M8.1 15.9A5.5 5.5 0 0 1 8.1 8.1M15.9 8.1A5.5 5.5 0 0 1 15.9 15.9"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <path
              d="M5.2 18.8A9.6 9.6 0 0 1 5.2 5.2M18.8 5.2A9.6 9.6 0 0 1 18.8 18.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeOpacity="0.7"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'zap':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <path
              d="M13.2 2.5L5.5 13H11.5L10.3 21.5L18.5 10.6H12.3L13.2 2.5Z"
              fill="currentColor"
              fillOpacity="0.25"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'globe':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.14" />
            <ellipse cx="12" cy="12" rx="4.2" ry="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 9.5H20.5M3.5 14.5H20.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
          </svg>
        );
      case 'qr':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.18" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.18" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.18" />
            <rect x="5.8" y="5.8" width="2.4" height="2.4" rx="0.5" fill="currentColor" />
            <rect x="15.8" y="5.8" width="2.4" height="2.4" rx="0.5" fill="currentColor" />
            <rect x="5.8" y="15.8" width="2.4" height="2.4" rx="0.5" fill="currentColor" />
            <path d="M14 14H17V17H14V14ZM18.5 14V20.5M14 20.5H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'nfc':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <rect x="3" y="4" width="18" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.12" />
            <path d="M8.5 15.5V8.5L13.5 15.5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.5 9.8C17.6 11 17.6 13 16.5 14.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case 'crown':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <path
              d="M3.5 18.5L5.2 7.8L9.6 11.8L12 5.5L14.4 11.8L18.8 7.8L20.5 18.5H3.5Z"
              fill="currentColor"
              fillOpacity="0.26"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M4.5 20.5H19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case 'storage':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <rect x="3.5" y="4" width="17" height="6.5" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.7" />
            <rect x="3.5" y="13.5" width="17" height="6.5" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="7.2" cy="7.2" r="1" fill="currentColor" />
            <circle cx="7.2" cy="16.7" r="1" fill="currentColor" />
            <path d="M11 7.2H17M11 16.7H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );
      case 'bell':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <path
              d="M12 3.5C8.7 3.5 6.5 6 6.5 9.3V13.8L4.8 16.6H19.2L17.5 13.8V9.3C17.5 6 15.3 3.5 12 3.5Z"
              fill="currentColor"
              fillOpacity="0.22"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M10 19.2C10.5 20.1 11.2 20.5 12 20.5C12.8 20.5 13.5 20.1 14 19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case 'users':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <circle cx="9.5" cy="8.5" r="3.2" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 19.2C4 16 6.4 14 9.5 14C12.6 14 15 16 15 19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16.5" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.75" />
            <path d="M16.5 14.3C18.7 14.7 20 16.4 20 18.8" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.75" strokeLinecap="round" />
          </svg>
        );
      case 'studio':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8.8" cy="9.8" r="1.6" fill="currentColor" />
            <path d="M5 17.2L9.8 12.6L13.5 15.8L16.4 13.2L19.5 17.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'contact':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <path
              d="M4.5 5.5H19.5C20.3 5.5 21 6.2 21 7V16.5C21 17.3 20.3 18 19.5 18H8L4 21V7C4 6.2 4.2 5.5 4.5 5.5Z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M8.5 10.5H16.5M8.5 13.8H13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        );
      case 'speed':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <path
              d="M4.5 15.5A8.5 8.5 0 1 1 19.5 15.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M12 14L16.2 8.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="14.5" r="1.8" fill="currentColor" />
          </svg>
        );
      case 'clock':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7.5V12.2L15.2 14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'send':
        return (
          <svg viewBox="0 0 24 24" className={iconSize} fill="none">
            <path
              d="M20.5 4.2L3.5 11.1L10.2 13.6L13 20.3L20.5 4.2Z"
              fill="currentColor"
              fillOpacity="0.26"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M10.2 13.6L20.2 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center ${sizeBox} ${medallionClass} ${className}`}
    >
      {renderGlyph()}
    </div>
  );
};

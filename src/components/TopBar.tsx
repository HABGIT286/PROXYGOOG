import React, { useEffect, useState } from 'react';
import { Bell, Monitor, Smartphone, Tablet } from 'lucide-react';
import { DisplayMode } from '../types';
import { LuxuryIcon } from './LuxuryIcon';

interface TopBarProps {
  isOnline: boolean;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onOpenStudioPicker: () => void;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  isAdminLoggedIn: boolean;
  unreadNotifications: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  isOnline,
  displayMode,
  onDisplayModeChange,
  onOpenStudioPicker,
  onOpenAdmin,
  onOpenNotifications,
  isAdminLoggedIn,
  unreadNotifications,
}) => {
  const [clock, setClock] = useState('--:--:--');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour12: false }));
      setDateStr(
        now.toLocaleDateString('ar-IQ', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-2.5 z-40 mx-auto w-full px-3 sm:px-5">
      <div className="el-nav-glass flex items-center justify-between gap-2 sm:gap-3 rounded-2xl px-3 py-2.5 sm:px-5">
        {/* Brand Lockup with Glossy Gold Shield Medallion */}
        <div className="flex items-center gap-3 min-w-0">
          <LuxuryIcon variant="shield" tone="gold" size="md" />
          <div className="min-w-0">
            <div className="el-gold-text font-display text-sm sm:text-base font-extrabold tracking-wider truncate ltr">
              ONIXTETL PRO
            </div>
            <div className="font-mono-tech text-[9px] sm:text-[10px] tracking-[0.18em] text-[#c7b8a3] truncate ltr">
              ONX44 · APP PROXY
            </div>
          </div>
        </div>

        {/* Center Luxury Golden Clock + Live Network */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-black/55 px-3 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-400 active-proxy-lamp' : 'bg-rose-400'
              }`}
            />
            <span className="font-mono-tech text-[11px] font-bold tracking-wider text-emerald-300 whitespace-nowrap">
              {isOnline ? 'LIVE NET' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-black/45 px-2.5 sm:px-3.5 py-1.5 border border-[var(--accent)]/30">
            <LuxuryIcon variant="clock" tone="glass" size="sm" className="hidden sm:inline-flex" />
            <div className="text-center leading-tight">
              <div className="el-gold-text font-display text-xs sm:text-sm font-extrabold tracking-[0.14em] ltr tabular-nums">
                {clock}
              </div>
              {dateStr && (
                <div className="hidden sm:block text-[9px] text-[#cbbca7]">{dateStr}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Display Mode Selector */}
          <div
            className="hidden md:flex items-center gap-1 rounded-xl border border-[var(--accent)]/20 bg-black/45 p-1"
            role="group"
            aria-label="وضع العرض"
          >
            <button
              type="button"
              onClick={() => onDisplayModeChange('desktop')}
              title="DESKTOP"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-display font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                displayMode === 'desktop'
                  ? 'el-gold-btn'
                  : 'text-[#bfb09b] hover:text-[#fff6e3]'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">DESKTOP</span>
            </button>
            <button
              type="button"
              onClick={() => onDisplayModeChange('ipad')}
              title="IPAD"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-display font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                displayMode === 'ipad'
                  ? 'el-gold-btn'
                  : 'text-[#bfb09b] hover:text-[#fff6e3]'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">IPAD</span>
            </button>
            <button
              type="button"
              onClick={() => onDisplayModeChange('phone')}
              title="PHONE"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-display font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                displayMode === 'phone'
                  ? 'el-gold-btn'
                  : 'text-[#bfb09b] hover:text-[#fff6e3]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">PHONE</span>
            </button>
          </div>

          {/* Studio Wallpapers Quick Picker */}
          <button
            type="button"
            onClick={onOpenStudioPicker}
            title="تغيير الخلفية — صور الاستوديو"
            className="el-card-subtle flex h-9 sm:h-10 items-center gap-2 rounded-xl px-2.5 sm:px-3 text-xs font-bold text-[#fae7be] hover:border-[var(--accent)]/60 transition-all cursor-pointer"
          >
            <LuxuryIcon variant="studio" tone="glass" size="sm" />
            <span className="hidden sm:inline">الخلفية</span>
          </button>

          {/* Notifications Bell */}
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={onOpenNotifications}
              title="مركز الإشعارات"
              className="el-card-subtle relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-[#fae7be] hover:border-[var(--accent)]/60 transition-all cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -left-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 font-mono-tech text-[10px] font-bold text-black shadow-lg">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Admin Login / Command Center Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            title={isAdminLoggedIn ? 'فتح لوحة تحكم المسؤول' : 'تسجيل دخول المسؤول'}
            className={`flex h-9 sm:h-10 items-center gap-2 rounded-xl px-3 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isAdminLoggedIn
                ? 'el-gold-btn'
                : 'el-card-subtle border-[var(--accent)]/40 text-[#fae7be] hover:border-[var(--accent)]'
            }`}
          >
            <LuxuryIcon
              variant="crown"
              tone={isAdminLoggedIn ? 'glass' : 'gold'}
              size="sm"
              className="h-6 w-6 rounded-lg"
            />
            <span className="hidden sm:inline">
              {isAdminLoggedIn ? 'الإدارة' : 'دخول الإدارة'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

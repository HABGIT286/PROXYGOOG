import React from 'react';
import { Crown, MessageSquare, Palette, RadioTower, ShieldCheck } from 'lucide-react';
import { PublicTab } from '../types';

interface BottomDockProps {
  activeTab: PublicTab | 'admin';
  onSelectTab: (tab: PublicTab | 'admin') => void;
  isAdminLoggedIn: boolean;
  unreadNotifications: number;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  onSelectTab,
  isAdminLoggedIn,
  unreadNotifications,
}) => {
  const items: Array<{
    id: PublicTab | 'admin';
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'proxies', label: 'البروكسيات', icon: <RadioTower className="h-4 w-4 shrink-0" /> },
    { id: 'themes', label: 'الثيمات', icon: <Palette className="h-4 w-4 shrink-0" /> },
    { id: 'contact', label: 'التواصل', icon: <MessageSquare className="h-4 w-4 shrink-0" /> },
    { id: 'profile', label: 'ملفي شخصي', icon: <Crown className="h-4 w-4 shrink-0" /> },
  ];

  if (isAdminLoggedIn) {
    items.push({
      id: 'admin',
      label: 'الإدارة',
      icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    });
  }

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-3.5 left-1/2 z-40 -translate-x-1/2 w-[min(95vw,600px)]"
    >
      <div className="el-nav-glass flex items-stretch justify-between gap-1 rounded-2xl p-1.5">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-1 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl px-2 py-2.5 text-[11px] sm:text-xs font-bold transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'el-gold-btn shadow-lg'
                  : 'text-[#d9cbb7] hover:text-[#fff6e3] hover:bg-white/[0.06]'
              }`}
            >
              {item.icon}
              <span className="leading-none">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 font-mono-tech text-[9px] font-bold text-black shadow">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

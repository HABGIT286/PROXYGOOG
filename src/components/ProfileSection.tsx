import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, Cpu, RotateCcw, Sparkles } from 'lucide-react';
import {
  PROFILE_CARD_NAME,
  STUDIO_BACKGROUNDS,
  TELEGRAM_DEV_LABEL,
  TELEGRAM_DEV_URL,
  TELEGRAM_HANDLE,
} from '../constants';
import { LuxuryIcon } from './LuxuryIcon';

interface ProfileSectionProps {
  totalProxies: number;
  activeProxies: number;
  visitorId: string;
  onToast: (msg: string) => void;
}

const AVATAR_KEY = 'onx44_profile_avatar';

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  totalProxies,
  activeProxies,
  visitorId,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return (
      localStorage.getItem(AVATAR_KEY) ||
      '/src/assets/images/studio_champagne_carbon_1795152258247.jpg'
    );
  });
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onToast('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        localStorage.setItem(AVATAR_KEY, reader.result);
        onToast('تم تحديث الصورة الشخصية بنجاح');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (img: string) => {
    setAvatarUrl(img);
    localStorage.setItem(AVATAR_KEY, img);
    setShowPresetAvatars(false);
    onToast('تم تغيير الصورة المصغرة إلى تصميم الاستوديو');
  };

  const handleResetAvatar = () => {
    const def = '/src/assets/images/studio_champagne_carbon_1795152258247.jpg';
    setAvatarUrl(def);
    localStorage.setItem(AVATAR_KEY, def);
    onToast('تم استعادة الصورة الافتراضية');
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {/* Luxury VIP Metallic Card (Earthlink Pro Screenshot 3 Subscriber Card) */}
      <div className="el-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        {/* 4 Subtle Golden Corner Screws like Earthlink Pro VIP Card */}
        <span className="pointer-events-none absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-[var(--accent)]/60 shadow-[0_0_6px_var(--accent)]" />
        <span className="pointer-events-none absolute top-3.5 left-3.5 h-2 w-2 rounded-full bg-[var(--accent)]/60 shadow-[0_0_6px_var(--accent)]" />
        <span className="pointer-events-none absolute bottom-3.5 right-3.5 h-2 w-2 rounded-full bg-[var(--accent)]/60 shadow-[0_0_6px_var(--accent)]" />
        <span className="pointer-events-none absolute bottom-3.5 left-3.5 h-2 w-2 rounded-full bg-[var(--accent)]/60 shadow-[0_0_6px_var(--accent)]" />

        <div className="relative z-10">
          {/* Card Top Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.22em] text-[#b9a997] ltr">
                EARTHLINK PRO ARCHITECTURE · VIP CARD
              </div>
              <div className="el-gold-text text-sm sm:text-base font-extrabold mt-0.5">
                كادر البطاقة الملكية المعتمدة
              </div>
            </div>
            <LuxuryIcon variant="crown" tone="gold" size="lg" />
          </div>

          {/* Avatar Thumbnail with Live Active Badge + Smart Chip + Card Title */}
          <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Changeable Avatar with Live Verified Indicator */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-2 border-[var(--accent)]/80 bg-black/60 shadow-[0_0_28px_var(--accent-glow)]">
                  <img
                    src={avatarUrl}
                    alt="الصورة الشخصية"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Active Live Status Indicator Badge on Avatar */}
                <span
                  title="حساب نشط ومفعل"
                  className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#120b0a] bg-emerald-400 shadow-[0_0_16px_#34d399]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-stone-950" />
                </span>

                {/* Glossy Camera Change Avatar Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="تغيير الصورة المصغرة"
                  className="el-gold-btn absolute -bottom-2 -left-2 flex h-8 w-8 items-center justify-center rounded-xl shadow-lg transition-transform active:scale-90 cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 active-proxy-lamp" />
                  <span className="font-mono-tech tracking-wider">VERIFIED ACTIVE · ELITE</span>
                </div>
                <div className="el-gold-text mt-1 font-display text-xl sm:text-2xl font-extrabold tracking-tight ltr">
                  {PROFILE_CARD_NAME}
                </div>
                <div className="font-mono-tech text-[11px] text-[#cbbca7] mt-0.5 ltr">
                  HANDLE: {TELEGRAM_HANDLE} · ID: {visitorId}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="el-card-subtle rounded-lg border-[var(--accent)]/35 px-3 py-1 text-[11px] font-bold text-[#fae7be] hover:border-[var(--accent)] cursor-pointer"
                  >
                    رفع صورة من الجهاز
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPresetAvatars(!showPresetAvatars)}
                    className="el-card-subtle flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-bold text-[#e7d8c5] hover:border-[var(--accent)]/50 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-[var(--accent-light)]" />
                    <span>صور استوديو جاهزة</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    title="استعادة الافتراضي"
                    className="el-card-subtle rounded-lg p-1.5 text-[#b9a997] hover:text-[#fff6e3] cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Golden Metallic Smart Chip */}
            <div className="hidden sm:flex h-12 w-16 shrink-0 items-center justify-center rounded-xl el-medallion-gold shadow-xl">
              <Cpu className="h-6 w-6 text-[#1a1208]" />
            </div>
          </div>

          {showPresetAvatars && (
            <div className="el-card-subtle mt-5 rounded-2xl p-3.5">
              <div className="text-xs font-bold text-[#fae7be] mb-2.5">
                اختر صورة مصغرة من استوديو ONIXTETL:
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {STUDIO_BACKGROUNDS.filter((b) => b.imageUrl).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => b.imageUrl && handleSelectPreset(b.imageUrl)}
                    className="group overflow-hidden rounded-xl border border-white/15 hover:border-[var(--accent)] transition-all cursor-pointer"
                  >
                    <img
                      src={b.imageUrl!}
                      alt={b.nameAr}
                      referrerPolicy="no-referrer"
                      className="h-14 w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hairline Divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/45 to-transparent" />

          {/* Bottom 4 Spec Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="el-card-subtle rounded-xl p-3">
              <span className="block text-[10px] text-[#b9a997]">حالة الخدمة</span>
              <span className="mt-1 block font-mono-tech text-xs font-bold text-emerald-300">
                Green · Active
              </span>
            </div>
            <div className="el-card-subtle rounded-xl p-3">
              <span className="block text-[10px] text-[#b9a997]">العقد الفعالة</span>
              <span className="mt-1 block font-mono-tech text-xs font-bold text-[#fae7be] tabular-nums">
                {activeProxies} / {totalProxies}
              </span>
            </div>
            <div className="el-card-subtle rounded-xl p-3">
              <span className="block text-[10px] text-[#b9a997]">البروتوكول</span>
              <span className="mt-1 block font-mono-tech text-xs font-bold text-[#fff6e3]">
                MTProto TLS
              </span>
            </div>
            <div className="el-card-subtle rounded-xl p-3">
              <span className="block text-[10px] text-[#b9a997]">المطور الرسمي</span>
              <span className="mt-1 block font-mono-tech text-xs font-bold text-[#fae7be] ltr">
                {TELEGRAM_HANDLE}
              </span>
            </div>
          </div>

          {/* Official Telegram Developer Action */}
          <div className="el-card-subtle mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <LuxuryIcon variant="proxy" tone="glass" size="md" />
              <div>
                <div className="text-xs font-bold text-[#fff6e3]">حساب المطور الرسمي على تيليجرام</div>
                <div className="text-[11px] text-[#b9a997]">
                  انقر للانتقال المباشر إلى حساب المطور الرسمي
                </div>
              </div>
            </div>

            <a
              href={TELEGRAM_DEV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="el-gold-btn flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-xs font-extrabold tracking-wider transition-transform active:scale-95 ltr"
            >
              <LuxuryIcon variant="send" tone="glass" size="sm" className="h-6 w-6 rounded-lg bg-black/20 border-black/15" />
              <span>{TELEGRAM_DEV_LABEL}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="el-card-subtle flex items-center gap-3 rounded-2xl p-4 text-xs text-[#e3d4c1]">
        <LuxuryIcon variant="shield" tone="gold" size="sm" />
        <span>
          بطاقة {PROFILE_CARD_NAME} متصلة بشكل مباشر بمزود البروكسيات الفوري لضمان أعلى سرعة اتصال وأمان كامل.
        </span>
      </div>
    </section>
  );
};

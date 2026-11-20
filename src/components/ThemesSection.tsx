import React, { useRef, useState } from 'react';
import {
  Check,
  Droplets,
  Eye,
  ImagePlus,
  Layers,
  Monitor,
  Smartphone,
  Sun,
  Tablet,
} from 'lucide-react';
import {
  GLASS_CARD_STYLES,
  STUDIO_BACKGROUNDS,
  STUDIO_THEMES,
} from '../constants';
import { CardGlassStyle, CustomWallpaper, DisplayMode } from '../types';
import { compressPhoneImageFile } from '../utils/imageResize';
import { LuxuryIcon } from './LuxuryIcon';

interface ThemesSectionProps {
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  activeBgId: string;
  customBgDataUrl: string | null;
  customWallpapers: CustomWallpaper[];
  onSelectBg: (bgId: string) => void;
  onSelectCustomWallpaper: (wp: CustomWallpaper) => void;
  backdropBlur: boolean;
  onToggleBackdropBlur: (blur: boolean) => void;
  cardStyle: CardGlassStyle;
  onSelectCardStyle: (style: CardGlassStyle) => void;
  luminanceLevel: number;
  onChangeLuminance: (level: number) => void;
  displayMode: DisplayMode;
  onSelectDisplayMode: (mode: DisplayMode) => void;
  onToast: (msg: string) => void;
}

export const ThemesSection: React.FC<ThemesSectionProps> = ({
  activeThemeId,
  onSelectTheme,
  activeBgId,
  customBgDataUrl,
  customWallpapers,
  onSelectBg,
  onSelectCustomWallpaper,
  backdropBlur,
  onToggleBackdropBlur,
  cardStyle,
  onSelectCardStyle,
  luminanceLevel,
  onChangeLuminance,
  displayMode,
  onSelectDisplayMode,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onToast('يرجى اختيار صورة صالحة من الهاتف');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressPhoneImageFile(file, 1920, 0.86);
      const wp: CustomWallpaper = {
        id: `wp_${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'صورة من الهاتف',
        dataUrl,
        createdAt: new Date().toISOString(),
      };
      onSelectCustomWallpaper(wp);
      onToast('تم تطبيق صورتك من الهاتف كخلفية للموقع');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'تعذر قراءة الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* 1. Framed 10 Luxury Color Themes Header */}
      <div className="el-card rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--accent)]/15">
          <div className="flex items-center gap-3.5">
            <LuxuryIcon variant="crown" tone="gold" size="lg" />
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                10 SOVEREIGN STUDIO THEMES
              </div>
              <h2 className="el-gold-text font-arabic-display text-base sm:text-xl font-extrabold">
                إطار الثيمات الملكية الفاخرة (10 ثيمات)
              </h2>
              <p className="text-xs text-[#cbbca7] mt-0.5">
                اختر الهوية اللونية المتناغمة مع البطاقات الزجاجية في كافة أقسام البوابة
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STUDIO_THEMES.map((t) => {
            const active = activeThemeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTheme(t.id)}
                className={`group relative overflow-hidden rounded-2xl p-3.5 text-right transition-all cursor-pointer ${
                  active
                    ? 'el-card-subtle border-[var(--accent)] ring-2 ring-[var(--accent)]/60'
                    : 'el-card-subtle hover:border-[var(--accent)]/45'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="relative h-9 w-9 shrink-0 rounded-xl border border-white/40 shadow-xl overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${t.accentLight} 0%, ${t.accent} 52%, ${t.accent2} 100%)`,
                      boxShadow: `0 8px 20px ${t.glow}, inset 0 1px 1px rgba(255,255,255,0.75)`,
                    }}
                  />
                  {active && (
                    <span className="el-gold-btn flex h-6 w-6 items-center justify-center rounded-full">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="font-arabic-display text-xs sm:text-sm font-bold text-[#fff6e3] truncate">
                    {t.nameAr}
                  </div>
                  <div className="font-display text-[10px] font-medium text-[#cbbca7] mt-0.5 ltr text-right truncate">
                    {t.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 5 Glass Card Templates */}
      <div className="el-card rounded-3xl p-5 sm:p-7">
        <div className="flex items-center gap-3.5 pb-5 border-b border-[var(--accent)]/15">
          <LuxuryIcon variant="proxy" tone="gold" size="lg" />
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
              5 GLASS CARD ARCHITECTURES
            </div>
            <h2 className="el-gold-text font-arabic-display text-base sm:text-xl font-extrabold">
              قوالب الكاردات الزجاجية (5 أصناف)
            </h2>
            <p className="text-xs text-[#cbbca7] mt-0.5">
              تبديل فوري بين الضبابي اللامع، الكلاسس المصقول، الزجاجي الملون، الأوبسيديان، والمنشوري السائل
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {GLASS_CARD_STYLES.map((preset) => {
            const active = cardStyle === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectCardStyle(preset.id)}
                className={`rounded-2xl p-3.5 text-right transition-all cursor-pointer border ${
                  active
                    ? 'el-card-subtle border-[var(--accent)] ring-2 ring-[var(--accent)]/55'
                    : 'el-card-subtle border-white/10 hover:border-[var(--accent)]/45'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Layers className="h-4 w-4 text-[var(--accent-light)]" />
                  {active && (
                    <span className="el-gold-btn flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="mt-2.5 font-arabic-display text-xs font-bold text-[#fff6e3]">
                  {preset.nameAr}
                </div>
                <div className="font-display text-[10px] text-[var(--accent)] ltr text-right">
                  {preset.nameEn}
                </div>
                <p className="mt-1 text-[10px] text-[#cbbca7] leading-relaxed">{preset.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2B. 900,000 Candlepower Luminance & Crystal Gloss Control */}
      <div className="el-card rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--accent)]/15">
          <div className="flex items-center gap-3.5">
            <div className="el-medallion-gold flex h-12 w-12 items-center justify-center rounded-2xl text-[#181108]">
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                900,000 CANDLEPOWER RADIANCE &amp; GLOSS
              </div>
              <h2 className="el-gold-text font-arabic-display text-base sm:text-xl font-extrabold">
                سطوع الإضاءة الفائق ولمعان الكرستال (حتى 900,000 شمعة)
              </h2>
              <p className="text-xs text-[#cbbca7] mt-0.5">
                تحكم بدرجة الإضاءة الكاشفة وبريق الزجاج المصقول وإضاءة مشهد الـ 3D
              </p>
            </div>
          </div>

          <div className="el-card-subtle rounded-2xl px-4 py-2 text-center border border-[var(--accent)]/40">
            <span className="font-mono-tech text-[10px] text-[#cbbca7] block ltr">LUMINANCE</span>
            <strong className="el-gold-text font-display text-base sm:text-lg font-extrabold tabular-nums">
              {(luminanceLevel * 9000).toLocaleString()} شمعة
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono-tech text-[11px] text-[#cbbca7] ltr">90k cd</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={luminanceLevel}
            onChange={(e) => onChangeLuminance(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <span className="font-mono-tech text-[11px] text-[var(--accent-light)] font-bold ltr">
            900k cd
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { level: 25, label: 'هادئة', cd: '225,000 cd' },
            { level: 55, label: 'متوازنة', cd: '495,000 cd' },
            { level: 85, label: 'ملكية ساطعة', cd: '765,000 cd' },
            { level: 100, label: '900,000 شمعة', cd: '900,000 cd' },
          ].map((preset) => {
            const active = luminanceLevel === preset.level;
            return (
              <button
                key={preset.level}
                type="button"
                onClick={() => onChangeLuminance(preset.level)}
                className={`rounded-xl p-2.5 text-right border transition-all cursor-pointer ${
                  active
                    ? 'el-gold-btn border-transparent'
                    : 'el-card-subtle border-white/10 hover:border-[var(--accent)]/45'
                }`}
              >
                <div className="text-xs font-extrabold">{preset.label}</div>
                <div
                  className={`font-mono-tech text-[10px] ltr text-right ${
                    active ? 'text-stone-900/90 font-bold' : 'text-[var(--accent-light)]'
                  }`}
                >
                  {preset.cd}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Studio Wallpapers + Phone Gallery Picker + Clarity Toggle */}
      <div className="el-card rounded-3xl p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--accent)]/15">
          <div className="flex items-center gap-3.5">
            <LuxuryIcon variant="studio" tone="gold" size="lg" />
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                STUDIO & DEVICE WALLPAPER GALLERY
              </div>
              <h2 className="el-gold-text font-arabic-display text-base sm:text-xl font-extrabold">
                خلفيات الهاتف والاستوديو
              </h2>
              <p className="text-xs text-[#cbbca7] mt-0.5">
                افتح صور هاتفك مباشرة أو اختر من استوديو الموقع وتحكم بوضوح الخلفية أو ضبابيتها
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFromDevice}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="el-gold-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4" />
              <span>{uploading ? 'جاري التحميل...' : 'صورة من هاتفي'}</span>
            </button>

            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/55 p-1">
              <button
                type="button"
                onClick={() => onToggleBackdropBlur(false)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  !backdropBlur ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>خلفية ظاهرة</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleBackdropBlur(true)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  backdropBlur ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
                }`}
              >
                <Droplets className="h-3.5 w-3.5" />
                <span>خلفية ضبابية</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customWallpapers.map((wp) => {
            const active = activeBgId === wp.id || customBgDataUrl === wp.dataUrl;
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => onSelectCustomWallpaper(wp)}
                className={`group relative overflow-hidden rounded-2xl border text-right transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 shadow-[0_16px_40px_var(--accent-glow)]'
                    : 'border-white/15 hover:border-[var(--accent)]/55'
                }`}
              >
                <div className="relative h-44 w-full overflow-hidden bg-[#0b0707]">
                  <img
                    src={wp.dataUrl}
                    alt={wp.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  {active && (
                    <div className="el-gold-btn absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full shadow-xl">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-black/45 border-t border-white/10">
                    <div className="font-arabic-display text-sm font-bold text-[#fff6e3] truncate">
                      {wp.name}
                    </div>
                    <div className="text-[11px] text-[#cbbca7] mt-0.5">صورة مخصصة من الجهاز</div>
                  </div>
                </div>
              </button>
            );
          })}

          {STUDIO_BACKGROUNDS.map((bg) => {
            const active = activeBgId === bg.id && !customBgDataUrl;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onSelectBg(bg.id)}
                className={`group relative overflow-hidden rounded-2xl border text-right transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/50 shadow-[0_16px_40px_var(--accent-glow)]'
                    : 'border-white/15 hover:border-[var(--accent)]/55'
                }`}
              >
                <div className="relative h-44 w-full overflow-hidden bg-[#0b0707]">
                  {bg.imageUrl ? (
                    <img
                      src={bg.imageUrl}
                      alt={bg.nameAr}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: bg.gradient }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {active && (
                    <div className="el-gold-btn absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full shadow-xl">
                      <Check className="h-4 w-4" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-4 bg-black/45 border-t border-white/10">
                    <div className="font-arabic-display text-sm font-bold text-[#fff6e3]">
                      {bg.nameAr}
                    </div>
                    <div className="text-[11px] text-[#cbbca7] mt-0.5 line-clamp-1">
                      {bg.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Display Viewport Mode Switcher */}
      <div className="el-card rounded-3xl p-5 sm:p-7">
        <div className="flex items-center gap-3.5 pb-5 border-b border-[var(--accent)]/15">
          <LuxuryIcon variant="globe" tone="glass" size="lg" />
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
              VIEWPORT ARCHITECTURE
            </div>
            <h2 className="el-gold-text font-arabic-display text-base sm:text-xl font-extrabold">
              أوضاع العرض الهندسية
            </h2>
            <p className="text-xs text-[#cbbca7] mt-0.5">
              تبديل فوري بين العرض الأفقي الواسع لسطح المكتب، الآيباد، والهاتف
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[
            {
              id: 'desktop' as DisplayMode,
              title: 'DESKTOP',
              desc: 'عرض أفقي واسع متكامل بمساحات عريضة',
              icon: <Monitor className="h-5 w-5" />,
            },
            {
              id: 'ipad' as DisplayMode,
              title: 'IPAD',
              desc: 'تخطيط شبكي متوازن للأجهزة اللوحية',
              icon: <Tablet className="h-5 w-5" />,
            },
            {
              id: 'phone' as DisplayMode,
              title: 'PHONE',
              desc: 'عرض طولي مدمج انسيابي للهواتف',
              icon: <Smartphone className="h-5 w-5" />,
            },
          ].map((item) => {
            const active = displayMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectDisplayMode(item.id)}
                className={`flex items-center gap-3.5 rounded-2xl p-4 text-right transition-all cursor-pointer ${
                  active
                    ? 'el-gold-btn'
                    : 'el-card-subtle text-[#e6d7c3] hover:border-[var(--accent)]/45'
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-black/20 text-[#161008]'
                      : 'el-medallion-glass text-[var(--accent-light)]'
                  }`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-extrabold tracking-wider ltr">
                    {item.title}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      active ? 'text-stone-900/85 font-bold' : 'text-[#cbbca7]'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

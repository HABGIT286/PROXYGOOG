import React, { useRef, useState } from 'react';
import {
  Check,
  Droplets,
  Eye,
  ImagePlus,
  Layers,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Type,
} from 'lucide-react';
import {
  ARABIC_FONTS,
  DEFAULT_APPEARANCE,
  ENGLISH_FONTS,
  FONT_COLOR_PRESETS,
  GLASS_CARD_STYLES,
  STUDIO_BACKGROUNDS,
  STUDIO_THEMES,
} from '../constants';
import { CardGlassStyle, SiteAppearance } from '../types';
import { compressPhoneImageFile } from '../utils/imageResize';
import { LuxuryIcon } from './LuxuryIcon';

interface AdminAppearanceStudioProps {
  token: string;
  appearance: SiteAppearance;
  onUpdateAppearance: (next: SiteAppearance) => void;
  onToast: (msg: string) => void;
}

export const AdminAppearanceStudio: React.FC<AdminAppearanceStudioProps> = ({
  token,
  appearance,
  onUpdateAppearance,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const persistAppearance = async (
    next: SiteAppearance,
    extraPayload: Record<string, unknown> = {},
    successMsg?: string
  ) => {
    onUpdateAppearance(next);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...next,
          ...extraPayload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appearance) {
          onUpdateAppearance(data.appearance);
        }
        if (successMsg) onToast(successMsg);
      } else {
        onToast('تم التطبيق محلياً (تعذر الحفظ على الخادم)');
      }
    } catch {
      onToast('تم التطبيق محلياً بنجاح');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onToast('يرجى اختيار ملف صورة صالح من الهاتف');
      return;
    }

    setUploading(true);
    try {
      const compressedDataUrl = await compressPhoneImageFile(file, 1920, 0.86);
      const wpId = `wp_${Date.now()}`;
      const cleanName = file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'صورة من الهاتف';
      const newWp = {
        id: wpId,
        name: cleanName,
        dataUrl: compressedDataUrl,
        createdAt: new Date().toISOString(),
      };

      const next: SiteAppearance = {
        ...appearance,
        bgId: wpId,
        customBgDataUrl: compressedDataUrl,
        customWallpapers: [newWp, ...appearance.customWallpapers].slice(0, 12),
      };

      await persistAppearance(
        next,
        { newWallpaper: newWp },
        'تم رفع صورة الهاتف وتعيينها كخلفية للموقع بنجاح'
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'تعذر تحميل الصورة من الجهاز');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteWallpaper = async (wpId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = appearance.customWallpapers.find((w) => w.id === wpId);
    const remaining = appearance.customWallpapers.filter((w) => w.id !== wpId);
    const isUsingDeleted = target && appearance.customBgDataUrl === target.dataUrl;

    const next: SiteAppearance = {
      ...appearance,
      bgId: isUsingDeleted ? 'abyss-default' : appearance.bgId,
      customBgDataUrl: isUsingDeleted ? null : appearance.customBgDataUrl,
      customWallpapers: remaining,
    };
    onUpdateAppearance(next);

    try {
      await fetch(`/api/admin/appearance/wallpaper/${encodeURIComponent(wpId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onToast('تم حذف الخلفية المخصصة');
    } catch {
      onToast('تمت إزالة الصورة');
    }
  };

  const handleResetAll = () => {
    const next: SiteAppearance = {
      ...DEFAULT_APPEARANCE,
      customWallpapers: appearance.customWallpapers,
    };
    persistAppearance(next, {}, 'تمت استعادة الإعدادات الافتراضية الملكية');
  };

  return (
    <div className="space-y-6">
      {/* TOP BAR: 10 LUXURY THEMES RIBBON FRAME */}
      <div className="el-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <LuxuryIcon variant="crown" tone="gold" size="md" />
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                10 SOVEREIGN COLOR THEMES
              </div>
              <h3 className="el-gold-text font-arabic-display text-base sm:text-lg font-extrabold">
                إطار الثيمات الفاخرة (10 ثيمات ملكية)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#e6dac6] hover:bg-white/10 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>افتراضي</span>
            </button>
            <button
              type="button"
              onClick={() => persistAppearance(appearance, {}, 'تم حفظ ونشر تصميم الموقع لجميع الزوار')}
              disabled={saving}
              className="el-gold-btn flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ ونشر للجميع'}</span>
            </button>
          </div>
        </div>

        {/* 10 Themes Grid Inside Top Frame */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STUDIO_THEMES.map((theme) => {
            const active = appearance.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() =>
                  persistAppearance(
                    { ...appearance, themeId: theme.id },
                    {},
                    `تم تفعيل ثيم: ${theme.nameAr}`
                  )
                }
                className={`group relative rounded-2xl p-3 text-right transition-all cursor-pointer ${
                  active
                    ? 'el-card-subtle border-[var(--accent)] ring-2 ring-[var(--accent)]/60'
                    : 'el-card-subtle hover:border-[var(--accent)]/45'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="h-8 w-8 shrink-0 rounded-xl border border-white/40 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accentLight} 0%, ${theme.accent} 52%, ${theme.accent2} 100%)`,
                      boxShadow: `0 6px 18px ${theme.glow}`,
                    }}
                  />
                  {active && (
                    <span className="el-gold-btn flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="mt-2.5 font-arabic-display text-xs font-bold text-[#fff6e3] truncate">
                  {theme.nameAr}
                </div>
                <div className="font-display text-[10px] text-[#cbbca7] truncate ltr text-right">
                  {theme.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PHONE GALLERY WALLPAPER + CLEAR / BLURRED TOGGLE */}
      <div className="el-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <LuxuryIcon variant="studio" tone="gold" size="md" />
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                CUSTOM DEVICE WALLPAPER & CLARITY
              </div>
              <h3 className="el-gold-text font-arabic-display text-base sm:text-lg font-extrabold">
                خلفيات الهاتف والاستوديو والتحكم بالضبابية
              </h3>
              <p className="text-xs text-[#cbbca7] mt-0.5">
                اختر أي صورة من معرض هاتفك أو الاستوديو، وتحكم بجعل الخلفية ظاهرة بوضوح أو ضبابية
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hidden Phone Gallery File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhoneImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="el-gold-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4" />
              <span>{uploading ? 'جاري معالجة الصورة...' : 'اختيار صورة من هاتفي'}</span>
            </button>

            {/* Backdrop Visibility Toggle: Clear vs Blurred */}
            <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/55 p-1">
              <button
                type="button"
                onClick={() =>
                  persistAppearance(
                    { ...appearance, backdropBlur: false },
                    {},
                    'تم تفعيل وضع الخلفية الظاهرة بوضوح'
                  )
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  !appearance.backdropBlur
                    ? 'el-gold-btn'
                    : 'text-[#cbbca7] hover:text-[#fff6e3]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>خلفية ظاهرة</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  persistAppearance(
                    { ...appearance, backdropBlur: true },
                    {},
                    'تم تفعيل وضع الخلفية الضبابية الناعمة'
                  )
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  appearance.backdropBlur
                    ? 'el-gold-btn'
                    : 'text-[#cbbca7] hover:text-[#fff6e3]'
                }`}
              >
                <Droplets className="h-3.5 w-3.5" />
                <span>خلفية ضبابية</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Uploaded Device Wallpapers */}
        {appearance.customWallpapers.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--accent-light)]">
              <span>صورك المرفوعة من الجهاز ({appearance.customWallpapers.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {appearance.customWallpapers.map((wp) => {
                const active =
                  appearance.bgId === wp.id || appearance.customBgDataUrl === wp.dataUrl;
                return (
                  <div
                    key={wp.id}
                    onClick={() =>
                      persistAppearance(
                        {
                          ...appearance,
                          bgId: wp.id,
                          customBgDataUrl: wp.dataUrl,
                        },
                        {},
                        `تم تعيين الخلفية: ${wp.name}`
                      )
                    }
                    className={`group relative h-32 overflow-hidden rounded-2xl border cursor-pointer transition-all ${
                      active
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/60'
                        : 'border-white/15 hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <img
                      src={wp.dataUrl}
                      alt={wp.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <button
                      type="button"
                      onClick={(e) => handleDeleteWallpaper(wp.id, e)}
                      title="حذف الصورة"
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {active && (
                      <div className="el-gold-btn absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 text-[11px] font-bold text-[#fff6e3] truncate">
                      {wp.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Built-in Studio Backgrounds */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STUDIO_BACKGROUNDS.map((bg) => {
            const active = appearance.bgId === bg.id && !appearance.customBgDataUrl;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() =>
                  persistAppearance(
                    {
                      ...appearance,
                      bgId: bg.id,
                      customBgDataUrl: null,
                    },
                    {},
                    `تم تفعيل خلفية الاستوديو: ${bg.nameAr}`
                  )
                }
                className={`group relative h-32 overflow-hidden rounded-2xl border text-right transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/60'
                    : 'border-white/15 hover:border-[var(--accent)]/50'
                }`}
              >
                {bg.imageUrl ? (
                  <img
                    src={bg.imageUrl}
                    alt={bg.nameAr}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: bg.gradient }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                {active && (
                  <div className="el-gold-btn absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <div className="text-xs font-bold text-[#fff6e3] truncate">{bg.nameAr}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2B: 900,000 CANDLEPOWER RADIANCE & GLOSS CONTROL */}
      <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="el-medallion-gold flex h-10 w-10 items-center justify-center rounded-xl text-[#181108]">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                900,000 CANDLEPOWER SITE RADIANCE
              </div>
              <h3 className="el-gold-text font-arabic-display text-base sm:text-lg font-extrabold">
                إضاءة الموقع الساطعة ولمعان الكرستال (حتى 900,000 شمعة)
              </h3>
              <p className="text-xs text-[#cbbca7] mt-0.5">
                تحكم مباشر بشدة الإضاءة الكاشفة وبريق الزجاج المصقول وإضاءة مسارات الـ 3D
              </p>
            </div>
          </div>

          <div className="el-card-subtle rounded-2xl px-4 py-2 text-center border border-[var(--accent)]/40">
            <span className="font-mono-tech text-[10px] text-[#cbbca7] block ltr">
              CURRENT LUMINANCE
            </span>
            <strong className="el-gold-text font-display text-base sm:text-lg font-extrabold tabular-nums">
              {((appearance.luminanceLevel ?? 85) * 9000).toLocaleString()} شمعة (cd)
            </strong>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-mono-tech text-[11px] text-[#cbbca7] shrink-0 ltr">90k cd</span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={appearance.luminanceLevel ?? 85}
              onChange={(e) => {
                const level = Number(e.target.value);
                onUpdateAppearance({ ...appearance, luminanceLevel: level });
              }}
              onMouseUp={(e) => {
                const level = Number((e.target as HTMLInputElement).value);
                persistAppearance(
                  { ...appearance, luminanceLevel: level },
                  {},
                  `تم ضبط إضاءة الموقع على ${(level * 9000).toLocaleString()} شمعة`
                );
              }}
              onTouchEnd={(e) => {
                const level = Number((e.target as HTMLInputElement).value);
                persistAppearance(
                  { ...appearance, luminanceLevel: level },
                  {},
                  `تم ضبط إضاءة الموقع على ${(level * 9000).toLocaleString()} شمعة`
                );
              }}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <span className="font-mono-tech text-[11px] text-[var(--accent-light)] font-bold shrink-0 ltr">
              900k cd
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { level: 25, label: 'إضاءة هادئة', cd: '225,000 cd' },
              { level: 55, label: 'توازن زجاجي', cd: '495,000 cd' },
              { level: 85, label: 'سطوع ملكي', cd: '765,000 cd' },
              { level: 100, label: 'أقصى سطوع كاشف', cd: '900,000 cd' },
            ].map((preset) => {
              const active = (appearance.luminanceLevel ?? 85) === preset.level;
              return (
                <button
                  key={preset.level}
                  type="button"
                  onClick={() =>
                    persistAppearance(
                      { ...appearance, luminanceLevel: preset.level },
                      {},
                      `تم ضبط الإضاءة على ${preset.cd}`
                    )
                  }
                  className={`rounded-xl p-3 text-right border transition-all cursor-pointer ${
                    active
                      ? 'el-gold-btn border-transparent'
                      : 'el-card-subtle border-white/10 hover:border-[var(--accent)]/45'
                  }`}
                >
                  <div className="text-xs font-extrabold">{preset.label}</div>
                  <div
                    className={`font-mono-tech text-[10px] mt-0.5 ltr text-right ${
                      active ? 'text-stone-900/90 font-bold' : 'text-[var(--accent-light)]'
                    }`}
                  >
                    {preset.cd} ({preset.level}%)
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: 5 GLASS CARD TEMPLATES */}
      <div className="el-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <LuxuryIcon variant="proxy" tone="gold" size="md" />
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
              5 GLASSMORPHISM CARD ARCHITECTURES
            </div>
            <h3 className="el-gold-text font-arabic-display text-base sm:text-lg font-extrabold">
              قوالب الكاردات الزجاجية (5 أصناف فاخرة)
            </h3>
            <p className="text-xs text-[#cbbca7] mt-0.5">
              اختر نمط الزجاج والشفافية والانعكاس لجميع بطاقات الموقع فوراً
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {GLASS_CARD_STYLES.map((preset) => {
            const active = appearance.cardStyle === preset.id;
            const previewStyleMap: Record<CardGlassStyle, string> = {
              'frosted-gloss':
                'bg-[rgba(22,16,16,0.68)] border-[rgba(235,199,134,0.35)] shadow-xl',
              'crystal-polished':
                'bg-[rgba(255,255,255,0.10)] border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]',
              'tinted-glass':
                'bg-[var(--accent)]/18 border-[var(--accent)]/55 shadow-[0_0_24px_var(--accent-glow)]',
              'obsidian-matte':
                'bg-[#0a0808]/92 border-[rgba(224,190,120,0.2)] shadow-2xl',
              'liquid-prism':
                'bg-gradient-to-br from-white/12 via-black/45 to-[var(--accent)]/20 border-[var(--accent-light)]/45',
            };
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  persistAppearance(
                    { ...appearance, cardStyle: preset.id },
                    {},
                    `تم تفعيل قالب الكارد: ${preset.nameAr}`
                  )
                }
                className={`rounded-2xl p-4 text-right transition-all cursor-pointer border ${
                  active
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/55 bg-black/50'
                    : 'border-white/10 bg-black/30 hover:border-[var(--accent)]/45'
                }`}
              >
                <div
                  className={`h-14 w-full rounded-xl border p-2.5 flex items-center justify-between ${
                    previewStyleMap[preset.id]
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[var(--accent-light)]" />
                    <span className="font-mono-tech text-[10px] text-[#fff6e3]">GLASS</span>
                  </div>
                  {active && (
                    <span className="el-gold-btn flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>

                <div className="mt-3 font-arabic-display text-xs font-bold text-[#fff6e3]">
                  {preset.nameAr}
                </div>
                <div className="font-display text-[10px] text-[var(--accent)] ltr text-right mt-0.5">
                  {preset.nameEn}
                </div>
                <p className="text-[10px] text-[#cbbca7] mt-1.5 leading-relaxed">
                  {preset.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: UNIFIED ROYAL FONT COLOR */}
      <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <LuxuryIcon variant="zap" tone="gold" size="md" />
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
              UNIFIED LUXURY FONT COLOR
            </div>
            <h3 className="el-gold-text font-arabic-display text-base sm:text-lg font-extrabold">
              لون الخط الملكي الموحد (بدون تدرج لونين)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {FONT_COLOR_PRESETS.map((fc) => {
            const active = appearance.fontColorId === fc.id;
            return (
              <button
                key={fc.id}
                type="button"
                onClick={() =>
                  persistAppearance(
                    { ...appearance, fontColorId: fc.id },
                    {},
                    `تم تغيير لون الخط إلى: ${fc.nameAr}`
                  )
                }
                className={`rounded-2xl p-3.5 text-right transition-all cursor-pointer border ${
                  active
                    ? 'el-card-subtle border-[var(--accent)] ring-2 ring-[var(--accent)]/55'
                    : 'el-card-subtle border-white/10 hover:border-[var(--accent)]/45'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="h-7 w-7 rounded-full border border-white/30"
                    style={{
                      backgroundColor: fc.titleColor,
                      boxShadow: `0 0 14px ${fc.glowColor}`,
                    }}
                  />
                  {active && (
                    <span className="el-gold-btn flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div
                  className="mt-2.5 text-xs font-extrabold"
                  style={{ color: fc.titleColor }}
                >
                  {fc.nameAr}
                </div>
                <div className="font-display text-[10px] text-[#cbbca7] ltr text-right">
                  {fc.nameEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: 10 LUXURY ENGLISH FONTS & 10 LUXURY ARABIC FONTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 10 English Fonts */}
        <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <LuxuryIcon variant="speed" tone="gold" size="md" />
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                10 AVANT-GARDE ENGLISH FONTS
              </div>
              <h3 className="el-gold-text font-arabic-display text-base font-extrabold">
                10 خطوط إنجليزية متطورة غير اعتيادية
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ENGLISH_FONTS.map((font) => {
              const active = appearance.englishFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() =>
                    persistAppearance(
                      { ...appearance, englishFont: font.id },
                      {},
                      `تم تفعيل الخط الإنجليزي: ${font.name}`
                    )
                  }
                  className={`rounded-2xl p-3.5 text-left ltr transition-all cursor-pointer border ${
                    active
                      ? 'el-card-subtle border-[var(--accent)] ring-2 ring-[var(--accent)]/55'
                      : 'el-card-subtle border-white/10 hover:border-[var(--accent)]/45'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tech text-[10px] text-[var(--accent)]">
                      {font.styleTag}
                    </span>
                    {active && (
                      <span className="el-gold-btn flex h-5 w-5 items-center justify-center rounded-full">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div
                    className="mt-1.5 text-base font-extrabold text-[#fff6e3] truncate"
                    style={{ fontFamily: font.family }}
                  >
                    {font.sample}
                  </div>
                  <div className="mt-1 text-[11px] text-[#cbbca7] flex items-center justify-between">
                    <span>{font.name}</span>
                    <span className="font-arabic-display">{font.labelAr}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 10 Arabic Fonts */}
        <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="el-medallion-gold flex h-10 w-10 items-center justify-center rounded-xl text-[#181108]">
              <Type className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
                10 CALLIGRAPHIC ARABIC FONTS
              </div>
              <h3 className="el-gold-text font-arabic-display text-base font-extrabold">
                10 خطوط عربية فاخرة (ديواني · ثلث · رقعة · كوفي)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ARABIC_FONTS.map((font) => {
              const active = appearance.arabicFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() =>
                    persistAppearance(
                      { ...appearance, arabicFont: font.id },
                      {},
                      `تم تفعيل الخط العربي: ${font.labelAr}`
                    )
                  }
                  className={`rounded-2xl p-3.5 text-right transition-all cursor-pointer border ${
                    active
                      ? 'el-card-subtle border-[var(--accent)] ring-2 ring-[var(--accent)]/55'
                      : 'el-card-subtle border-white/10 hover:border-[var(--accent)]/45'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[var(--accent)] flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {font.styleTag}
                    </span>
                    {active && (
                      <span className="el-gold-btn flex h-5 w-5 items-center justify-center rounded-full">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div
                    className="mt-1.5 text-base font-extrabold text-[#fff6e3] truncate"
                    style={{ fontFamily: font.family }}
                  >
                    {font.sample}
                  </div>
                  <div className="mt-1 text-[11px] text-[#cbbca7] flex items-center justify-between">
                    <span>{font.labelAr}</span>
                    <span className="font-mono-tech text-[10px] ltr">{font.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

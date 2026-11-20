import React, { useRef, useState } from 'react';
import { Check, Droplets, Eye, ImagePlus, X } from 'lucide-react';
import { STUDIO_BACKGROUNDS } from '../constants';
import { CustomWallpaper } from '../types';
import { compressPhoneImageFile } from '../utils/imageResize';
import { LuxuryIcon } from './LuxuryIcon';

interface StudioBackdropModalProps {
  open: boolean;
  onClose: () => void;
  activeBgId: string;
  customBgDataUrl: string | null;
  customWallpapers: CustomWallpaper[];
  backdropBlur: boolean;
  onToggleBackdropBlur: (blur: boolean) => void;
  onSelectBg: (bgId: string) => void;
  onSelectCustomWallpaper: (wp: CustomWallpaper) => void;
  onToast: (msg: string) => void;
}

export const StudioBackdropModal: React.FC<StudioBackdropModalProps> = ({
  open,
  onClose,
  activeBgId,
  customBgDataUrl,
  customWallpapers,
  backdropBlur,
  onToggleBackdropBlur,
  onSelectBg,
  onSelectCustomWallpaper,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

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
      onToast(err instanceof Error ? err.message : 'تعذر تحميل الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-lg"
      onClick={onClose}
    >
      <div
        className="el-card relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--accent)]/15">
          <div className="flex items-center gap-3">
            <LuxuryIcon variant="studio" tone="gold" size="md" />
            <div>
              <h3 className="el-gold-text font-arabic-display text-base font-extrabold">
                استوديو الخلفيات وصور الهاتف
              </h3>
              <p className="text-xs text-[#cbbca7]">
                ارفع صورة من معرض هاتفك أو اختر من الاستوديو وتحكم بالوضوح والضبابية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="el-card-subtle flex h-9 w-9 items-center justify-center rounded-xl text-[#cbbca7] hover:text-[#fff6e3] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Device Picker + Clear/Blurred Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
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
            <span>{uploading ? 'جاري التحميل...' : 'اختيار صورة من هاتفي'}</span>
          </button>

          <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/55 p-1">
            <button
              type="button"
              onClick={() => {
                onToggleBackdropBlur(false);
                onToast('الخلفية ظاهرة بوضوح');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                !backdropBlur ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>خلفية ظاهرة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleBackdropBlur(true);
                onToast('الخلفية ضبابية ناعمة');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                backdropBlur ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
              }`}
            >
              <Droplets className="h-3.5 w-3.5" />
              <span>خلفية ضبابية</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customWallpapers.map((wp) => {
            const active = activeBgId === wp.id || customBgDataUrl === wp.dataUrl;
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => {
                  onSelectCustomWallpaper(wp);
                  onToast(`تم تفعيل: ${wp.name}`);
                }}
                className={`group relative overflow-hidden rounded-2xl border text-right transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/55 shadow-[0_14px_35px_var(--accent-glow)]'
                    : 'border-white/15 hover:border-[var(--accent)]/55'
                }`}
              >
                <div className="relative h-36 w-full overflow-hidden bg-[#0c0808]">
                  <img
                    src={wp.dataUrl}
                    alt={wp.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  {active && (
                    <div className="el-gold-btn absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full shadow-lg">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3.5 bg-black/45 border-t border-white/10">
                    <div className="font-arabic-display text-sm font-bold text-[#fff6e3] truncate">
                      {wp.name}
                    </div>
                    <div className="text-[11px] text-[#cbbca7] mt-0.5">صورة من جهازك</div>
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
                onClick={() => {
                  onSelectBg(bg.id);
                  onToast(`تم تفعيل خلفية: ${bg.nameAr}`);
                }}
                className={`group relative overflow-hidden rounded-2xl border text-right transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/55 shadow-[0_14px_35px_var(--accent-glow)]'
                    : 'border-white/15 hover:border-[var(--accent)]/55'
                }`}
              >
                <div className="relative h-36 w-full overflow-hidden bg-[#0c0808]">
                  {bg.imageUrl ? (
                    <img
                      src={bg.imageUrl}
                      alt={bg.nameAr}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ background: bg.gradient }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {active && (
                    <div className="el-gold-btn absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full shadow-lg">
                      <Check className="h-4 w-4" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3.5 bg-black/45 border-t border-white/10">
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
    </div>
  );
};

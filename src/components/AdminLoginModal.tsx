import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, X } from 'lucide-react';
import { LuxuryIcon } from './LuxuryIcon';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة سر المسؤول');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'كلمة المرور غير صحيحة أو تعذر التحقق من الخادم');
      }
      setPassword('');
      onSuccess(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-lg"
      onClick={onClose}
    >
      <div
        className="el-card relative w-full max-w-md rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="el-card-subtle absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl text-[#cbbca7] hover:text-[#fff6e3] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Earthlink Pro Screenshot 2 Style Emblem + Title */}
        <div className="flex flex-col items-center text-center">
          <LuxuryIcon variant="crown" tone="gold" size="lg" className="h-14 w-14 rounded-2xl" />

          <h2 className="el-gold-text mt-4 font-display text-xl font-extrabold tracking-wide ltr">
            ONX44 COMMAND CENTER
          </h2>
          <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[#fae7be] mt-1 ltr">
            CLOUDFLARE WORKER AUTHENTICATION
          </div>
          <p className="mt-2 text-xs text-[#cbbca7] leading-relaxed">
            تسجيل الدخول المباشر عبر متغير PASSWORD المحمي في إعدادات Cloudflare Worker
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#e7d8c5] mb-2">
              <span>كلمة المرور الإدارية</span>
              <span className="font-mono-tech text-[10px] text-[#fae7be] ltr">
                SECRET / PASSWORD
              </span>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b9a997]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full rounded-xl border border-[var(--accent)]/30 bg-black/55 pr-10 pl-11 py-3.5 text-sm text-[#fff6e3] placeholder:text-stone-500 focus:border-[var(--accent)] focus:outline-none ltr text-center font-mono-tech tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b9a997] hover:text-[#fff6e3] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/12 p-3 text-center text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="el-gold-btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <Lock className="h-4 w-4" />
            <span>{loading ? 'جاري التحقق من الخادم...' : 'تسجيل الدخول إلى لوحة التحكم'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

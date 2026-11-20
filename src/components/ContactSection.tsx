import React, { useState } from 'react';
import { CheckCircle2, Send, User } from 'lucide-react';
import { TELEGRAM_DEV_DEEP_URL, TELEGRAM_DEV_LABEL, TELEGRAM_DEV_URL, TELEGRAM_HANDLE } from '../constants';
import { LuxuryIcon } from './LuxuryIcon';

interface ContactSectionProps {
  visitorId: string;
  onToast: (msg: string) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ visitorId, onToast }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      onToast('يرجى إدخال اسمك ورسالتك قبل الإرسال');
      return;
    }
    setSending(true);
    setSentSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          visitorId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر إرسال الرسالة');
      }
      setSentSuccess(true);
      setName('');
      setMessage('');
      onToast('تم إرسال رسالتك إلى المطور عبر بوت ديسكورد بنجاح');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className="el-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3.5 pb-5 border-b border-[var(--accent)]/15">
          <LuxuryIcon variant="contact" tone="gold" size="lg" />
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
              DIRECT DISCORD DISPATCHER
            </div>
            <h2 className="el-gold-text font-arabic-display text-lg sm:text-xl font-extrabold">
              قسم التواصل المباشر
            </h2>
            <p className="text-xs text-[#c7b8a3] mt-0.5">
              تصل رسالتك فورياً إلى المطور عبر بوت ديسكورد المخصص
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-bold text-[#fae7be] mb-2">
              الاسم الكامل أو المعرّف
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b9a997]" />
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                maxLength={80}
                required
                className="w-full rounded-xl border border-[var(--accent)]/25 bg-black/50 pr-10 pl-4 py-3 text-sm text-[#fff6e3] placeholder:text-stone-500 focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-bold text-[#fae7be] mb-2">
              محتوى الرسالة
            </label>
            <textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك أو استفسارك للمطور..."
              maxLength={1500}
              required
              className="w-full rounded-xl border border-[var(--accent)]/25 bg-black/50 p-4 text-sm text-[#fff6e3] placeholder:text-stone-500 focus:border-[var(--accent)] focus:outline-none resize-none"
            />
          </div>

          {sentSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>تم استلام رسالتك وإرسالها عبر بوت ديسكورد بنجاح.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="el-gold-btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{sending ? 'جاري الإرسال...' : 'إرسال الرسالة الآن'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[var(--accent)]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LuxuryIcon variant="shield" tone="glass" size="md" />
            <div>
              <div className="text-xs font-bold text-[#fff6e3]">التواصل المباشر عبر تيليجرام</div>
              <div className="font-mono-tech text-[11px] text-[#cbbca7] ltr">{TELEGRAM_HANDLE}</div>
            </div>
          </div>

          <a
            href={TELEGRAM_DEV_DEEP_URL}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = TELEGRAM_DEV_URL;
            }}
            className="el-gold-btn flex items-center gap-2 rounded-xl px-5 py-2.5 font-display text-xs font-extrabold ltr"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{TELEGRAM_DEV_LABEL}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

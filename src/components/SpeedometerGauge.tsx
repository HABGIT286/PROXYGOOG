import React, { useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Zap } from 'lucide-react';
import { LuxuryIcon } from './LuxuryIcon';

interface SpeedometerGaugeProps {
  onToast: (msg: string) => void;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({ onToast }) => {
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: 24 }, (_, i) => 22 + ((i * 17) % 58))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) =>
        prev.map((val, idx) => {
          const base = running ? 45 + Math.random() * 50 : 20 + ((idx * 13) % 55);
          return Math.round(val * 0.45 + base * 0.55);
        })
      );
    }, 450);
    return () => clearInterval(id);
  }, [running]);

  const runTest = async () => {
    if (running) return;
    setRunning(true);
    setProgress(8);

    try {
      const samples: number[] = [];
      for (let i = 0; i < 4; i++) {
        const t0 = performance.now();
        const res = await fetch(`https://speed.cloudflare.com/__down?bytes=0&t=${Date.now()}-${i}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          await res.arrayBuffer();
          samples.push(performance.now() - t0);
        }
      }
      if (samples.length > 0) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const diffs = samples.slice(1).map((v, idx) => Math.abs(v - samples[idx]));
        const jit = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 1;
        setPing(Math.round(avg));
        setJitter(Math.max(1, Math.round(jit)));
      }
      setProgress(32);

      const bytes = 2_000_000;
      const tDown = performance.now();
      const downRes = await fetch(
        `https://speed.cloudflare.com/__down?bytes=${bytes}&t=${Date.now()}`,
        { cache: 'no-store', signal: AbortSignal.timeout(20000) }
      );
      if (downRes.ok) {
        const buf = await downRes.arrayBuffer();
        const sec = (performance.now() - tDown) / 1000;
        if (sec > 0 && buf.byteLength > 0) {
          const mbps = (buf.byteLength * 8) / sec / 1_000_000;
          setDownload(Number(mbps.toFixed(1)));
        }
      }
      setProgress(75);

      const upBytes = 262_144;
      const payload = new Uint8Array(upBytes);
      const tUp = performance.now();
      const upRes = await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: payload,
        signal: AbortSignal.timeout(20000),
      });
      if (upRes.ok) {
        const secUp = (performance.now() - tUp) / 1000;
        if (secUp > 0) {
          const mbpsUp = (upBytes * 8) / secUp / 1_000_000;
          setUpload(Number(mbpsUp.toFixed(1)));
        }
      }
      setProgress(100);
      onToast('اكتمل فحص سرعة الشبكة بنجاح');
    } catch {
      onToast('تعذر الوصول لخادم قياس السرعة، تحقق من اتصالك');
    } finally {
      setTimeout(() => {
        setRunning(false);
        setProgress(0);
      }, 350);
    }
  };

  useEffect(() => {
    if (navigator.onLine) {
      runTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speedRatio = Math.min(1, (download ?? 0) / 100);
  const needleAngle = -115 + speedRatio * 230;

  return (
    <div className="space-y-4">
      <div className="el-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <LuxuryIcon variant="speed" tone="emerald" size="md" />
            <div>
              <h3 className="el-gold-text font-arabic-display text-sm sm:text-base font-extrabold">
                فحص سرعة وقوة اتصال الشبكة (Speedometer)
              </h3>
              <p className="text-[11px] text-[#c7b8a3]">
                مقياس حي يقيس سرعة التنزيل والرفع وزمن الاستجابة والتذبذب بدقة فائقة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runTest}
            disabled={running}
            className="el-gold-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'جاري الفحص...' : 'بدء فحص السرعة الآن'}</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-56 h-36 flex items-end justify-center">
            <svg viewBox="0 0 220 130" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="55%" stopColor="#e0be78" />
                  <stop offset="100%" stopColor="#fae7be" />
                </linearGradient>
              </defs>
              <path
                d="M 24 114 A 86 86 0 1 1 196 114"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 24 114 A 86 86 0 1 1 196 114"
                fill="none"
                stroke="url(#gaugeArcGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="385"
                strokeDashoffset={385 - speedRatio * 385}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <g
                transform={`translate(110, 110) rotate(${needleAngle})`}
                style={{ transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-68"
                  stroke="#fae7be"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="0" r="6" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <div className="mt-1 flex items-baseline gap-2 ltr">
            <span className="el-gold-text font-display text-4xl font-extrabold tabular-nums">
              {download !== null ? download.toFixed(1) : '--.-'}
            </span>
            <span className="font-mono-tech text-xs text-[#cbbca7]">Mbps</span>
          </div>
          <span className="text-[11px] text-[#b9a997] mt-1">سرعة التنزيل المباشرة</span>

          {running && (
            <div className="mt-3 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[var(--accent)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* 2x2 Bento Metrics */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="el-card-subtle rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-300">
              <ArrowDownToLine className="h-4 w-4" />
              <span className="font-display font-bold">DOWNLOAD</span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-[#fff6e3] ltr tabular-nums">
              {download !== null ? download.toFixed(1) : '--.-'}{' '}
              <span className="text-xs font-normal text-[#b9a997]">Mbps</span>
            </div>
          </div>

          <div className="el-card-subtle rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-[11px] text-[#fae7be]">
              <ArrowUpFromLine className="h-4 w-4" />
              <span className="font-display font-bold">UPLOAD</span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-[#fff6e3] ltr tabular-nums">
              {upload !== null ? upload.toFixed(1) : '--.-'}{' '}
              <span className="text-xs font-normal text-[#b9a997]">Mbps</span>
            </div>
          </div>

          <div className="el-card-subtle rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-300">
              <Activity className="h-4 w-4" />
              <span className="font-display font-bold">PING LATENCY</span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-[#fff6e3] ltr tabular-nums">
              {ping !== null ? ping : '---'}{' '}
              <span className="text-xs font-normal text-[#b9a997]">ms</span>
            </div>
          </div>

          <div className="el-card-subtle rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-[11px] text-amber-300">
              <Zap className="h-4 w-4" />
              <span className="font-display font-bold">JITTER</span>
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold text-[#fff6e3] ltr tabular-nums">
              {jitter !== null ? jitter : '--'}{' '}
              <span className="text-xs font-normal text-[#b9a997]">ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="el-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#fff6e3]">مخطط تردد الإشارة والنبضات الحية</span>
          <span className="font-mono-tech text-[10px] text-[#fae7be] border border-[var(--accent)]/30 bg-[var(--accent)]/12 rounded-lg px-2.5 py-1">
            HZ STREAM 60
          </span>
        </div>
        <div className="flex items-end justify-between gap-1 h-16 px-1">
          {bars.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t-sm transition-all duration-300"
              style={{
                height: `${Math.max(15, val)}%`,
                background:
                  idx % 3 === 0
                    ? 'linear-gradient(to top, #10b981, #a7f3d0)'
                    : 'linear-gradient(to top, var(--accent-2), var(--accent-light))',
                opacity: 0.88,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Cpu,
  Globe,
  Maximize2,
  Minimize2,
  Nfc,
  QrCode,
  Radio,
  Server,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { ProxyItem } from '../types';
import { LuxuryIcon } from './LuxuryIcon';
import { NetworkFlow3D } from './NetworkFlow3D';
import { formatDateTime } from '../utils/proxyHelpers';

interface ProxyFlowWindowProps {
  proxies: ProxyItem[];
  activeProxies: number;
  totalProxies: number;
  accentHex: string;
  luminanceFactor: number;
  onConnectProxy?: (proxy: ProxyItem) => void;
  onInspectProxy?: (proxy: ProxyItem) => void;
  title?: string;
  subtitle?: string;
}

export const ProxyFlowWindow: React.FC<ProxyFlowWindowProps> = ({
  proxies,
  activeProxies,
  totalProxies,
  accentHex,
  luminanceFactor,
  onConnectProxy,
  onInspectProxy,
  title = 'نافذة التدفقات الشاملة ومسار البيانات الحي',
  subtitle = 'مراقبة واقعية لتدفق الحزم وتشفير MTProto وحالة كل دولة وعقدة بروكسي الآن',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedProxyId, setSelectedProxyId] = useState<string | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Subtle live tick to compute realistic packet telemetry without heavy re-renders
  useEffect(() => {
    const id = window.setInterval(() => {
      setPulsePhase((p) => (p + 1) % 1000);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // Lock page scroll when fullscreen telemetry modal is open
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const sortedNodes = useMemo(() => {
    if (!proxies.length) return [];
    const active = proxies.filter((p) => p.status === 'active');
    const inactive = proxies.filter((p) => p.status !== 'active');
    return [...active, ...inactive].slice(0, 14);
  }, [proxies]);

  const selectedProxy = useMemo(() => {
    if (!sortedNodes.length) return null;
    return sortedNodes.find((p) => p.id === selectedProxyId) || sortedNodes[0];
  }, [sortedNodes, selectedProxyId]);

  useEffect(() => {
    if (!selectedProxyId && sortedNodes.length > 0) {
      setSelectedProxyId(sortedNodes[0].id);
    }
  }, [sortedNodes, selectedProxyId]);

  // Group countries to show "what is happening right now in which country"
  const countryTelemetry = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        countryName: string;
        countryCode: string;
        activeCount: number;
        totalCount: number;
        bestPing: number | null;
        totalUses: number;
        leadProxy: ProxyItem;
      }
    >();

    for (const p of proxies) {
      const code = (p.country_code || 'GL').toUpperCase();
      const name = p.country_name || p.country || 'شبكة عالمية';
      const existing = map.get(code);
      const uses = p.usage?.usesCount ?? 0;
      const isUp = p.status === 'active';

      if (!existing) {
        map.set(code, {
          key: code,
          countryName: name,
          countryCode: code,
          activeCount: isUp ? 1 : 0,
          totalCount: 1,
          bestPing: p.ping,
          totalUses: uses,
          leadProxy: p,
        });
      } else {
        existing.totalCount += 1;
        if (isUp) existing.activeCount += 1;
        existing.totalUses += uses;
        if (
          p.ping !== null &&
          (existing.bestPing === null || p.ping < existing.bestPing)
        ) {
          existing.bestPing = p.ping;
          existing.leadProxy = p;
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
        return (a.bestPing ?? 9999) - (b.bestPing ?? 9999);
      })
      .slice(0, 10);
  }, [proxies]);

  const telemetryMetrics = useMemo(() => {
    const ping = selectedProxy?.ping ?? 36;
    const isUp = selectedProxy?.status === 'active';
    const basePps = isUp ? Math.round(Math.max(180, 1650 - ping * 4.2)) : 0;
    const jitterWave = isUp ? ((pulsePhase * 17) % 46) - 23 : 0;
    const packetsPerSec = Math.max(0, basePps + jitterWave);
    const throughputMbps = isUp
      ? Number(Math.max(8.4, (packetsPerSec * 0.048)).toFixed(1))
      : 0;
    const jitterMs = isUp ? Math.max(1, Math.round(ping * 0.06) + (pulsePhase % 3)) : 0;
    const dcRegion =
      selectedProxy?.country_code === 'DE' ||
      selectedProxy?.country_code === 'NL' ||
      selectedProxy?.country_code === 'FR' ||
      selectedProxy?.country_code === 'GB'
        ? 'Telegram DC2 · Amsterdam'
        : selectedProxy?.country_code === 'US' || selectedProxy?.country_code === 'CA'
        ? 'Telegram DC1 · Miami Edge'
        : selectedProxy?.country_code === 'SG' || selectedProxy?.country_code === 'JP'
        ? 'Telegram DC5 · Singapore'
        : 'Telegram DC4 · Europe Core';

    return {
      packetsPerSec,
      throughputMbps,
      jitterMs,
      dcRegion,
      isUp,
    };
  }, [selectedProxy, pulsePhase]);

  const renderWindowBody = (isModalView: boolean) => (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <LuxuryIcon variant="globe" tone="gold" size={isModalView ? 'lg' : 'md'} />
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.2em] text-[var(--accent)] ltr">
              <span className="h-2 w-2 rounded-full bg-emerald-400 active-proxy-lamp" />
              <span>REALTIME PACKET &amp; MTProto TELEMETRY STREAM</span>
            </div>
            <h2 className="el-gold-text font-arabic-display text-base sm:text-xl font-extrabold mt-0.5">
              {title}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#cbbca7] mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 font-mono-tech text-[11px] text-emerald-300">
            <Radio className="h-3.5 w-3.5" />
            <span>
              {activeProxies} / {totalProxies} LIVE
            </span>
          </div>

          {!isModalView ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="el-gold-btn flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold cursor-pointer transition-transform active:scale-95"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>معاينة موسعة</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#f4efe4] hover:bg-white/10 cursor-pointer"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>تصغير</span>
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#cbbca7] hover:text-white cursor-pointer"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split: 3D Live Topology + Real Hop-by-Hop Data Pipeline */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Interactive 3D Topology Canvas */}
        <div className="xl:col-span-6 space-y-3">
          <NetworkFlow3D
            proxies={sortedNodes}
            selectedProxyId={selectedProxy?.id ?? null}
            onSelectProxy={(p) => setSelectedProxyId(p.id)}
            activeProxies={activeProxies}
            totalProxies={totalProxies}
            accentHex={accentHex}
            luminanceFactor={luminanceFactor}
            heightClass={isModalView ? 'h-80 sm:h-[420px]' : 'h-72 sm:h-80'}
            interactiveHint={true}
          />

          {/* Interactive Country / Node Selector Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#cbbca7]">
              <span>انقر لاختيار عقدة ومسار بروكسي معين:</span>
              <span className="font-mono-tech text-[10px] text-[var(--accent-light)] ltr">
                {sortedNodes.length} TRACKED NODES
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
              {sortedNodes.map((node) => {
                const isSel = selectedProxy?.id === node.id;
                const isUp = node.status === 'active';
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedProxyId(node.id)}
                    className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                      isSel
                        ? 'el-gold-btn border-transparent'
                        : 'el-card-subtle border-white/10 text-[#e8dcc8] hover:border-[var(--accent)]/45'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isUp
                          ? isSel
                            ? 'bg-emerald-900'
                            : 'bg-emerald-400 active-proxy-lamp'
                          : 'bg-rose-400'
                      }`}
                    />
                    <span className="font-mono-tech text-[10px] uppercase ltr">
                      {node.country_code || 'GL'}
                    </span>
                    <span className="truncate max-w-[110px]">
                      {node.country_name || node.city || node.server}
                    </span>
                    <span
                      className={`font-mono-tech text-[10px] ltr ${
                        isSel ? 'text-stone-900/90 font-extrabold' : 'text-[var(--accent-light)]'
                      }`}
                    >
                      {node.ping !== null ? `${node.ping}ms` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Realistic Hop-by-Hop Data Flow Structure & Selected Node Inspector */}
        <div className="xl:col-span-6 flex flex-col justify-between gap-4">
          {/* Selected Node Header Strip */}
          <div className="el-card-subtle rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    telemetryMetrics.isUp
                      ? 'bg-emerald-400 active-proxy-lamp'
                      : 'bg-rose-400'
                  }`}
                />
                <div>
                  <div className="font-arabic-display text-sm sm:text-base font-extrabold text-[#fff6e3]">
                    {selectedProxy
                      ? `${selectedProxy.country_name || 'خادم دولي'} · ${
                          selectedProxy.city || 'Core POP'
                        }`
                      : 'جاري تحميل العقد...'}
                  </div>
                  <div className="font-mono-tech text-[11px] text-[#cbbca7] ltr text-right">
                    {selectedProxy
                      ? `${selectedProxy.server}:${selectedProxy.port} · ${
                          selectedProxy.type || 'MTProto TLS'
                        }`
                      : '—'}
                  </div>
                </div>
              </div>

              <span
                className={`rounded-xl px-2.5 py-1 font-mono-tech text-[10px] font-bold border ${
                  telemetryMetrics.isUp
                    ? 'border-emerald-400/35 bg-emerald-500/12 text-emerald-300'
                    : 'border-rose-400/35 bg-rose-500/12 text-rose-300'
                }`}
              >
                {telemetryMetrics.isUp ? 'STREAM ACTIVE' : 'NODE STANDBY'}
              </span>
            </div>

            {/* 4-Stage Realistic Packet Flow Architecture */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--accent-light)]">
                <span>هيكل مسار وسيلان البيانات الفعلي (End-to-End Routing):</span>
                <span className="font-mono-tech text-[10px] text-emerald-300 ltr">
                  {telemetryMetrics.packetsPerSec} pkt/s · {telemetryMetrics.throughputMbps} Mbps
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-stretch">
                {/* Hop 1 */}
                <div className="rounded-xl border border-white/10 bg-black/45 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-[#cbbca7]">
                    <span className="font-mono-tech ltr">HOP 01</span>
                    <Cpu className="h-3.5 w-3.5 text-[var(--accent-light)]" />
                  </div>
                  <div className="mt-2 font-arabic-display text-xs font-bold text-[#fff6e3]">
                    جهاز المستخدم
                  </div>
                  <div className="text-[10px] text-[#cbbca7] mt-0.5">
                    توليد الجلسة وتغليف الحزم محلياً
                  </div>
                </div>

                {/* Hop 2 */}
                <div className="rounded-xl border border-[var(--accent)]/30 bg-black/45 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-[var(--accent-light)]">
                    <span className="font-mono-tech ltr">HOP 02</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                  <div className="mt-2 font-arabic-display text-xs font-bold text-[#fff6e3]">
                    نفق التشفير MTProto
                  </div>
                  <div className="font-mono-tech text-[10px] text-emerald-300 mt-0.5 ltr text-right">
                    TLS-Fake · Secret Verified
                  </div>
                </div>

                {/* Hop 3: Real Selected Proxy Country Node */}
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/25 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-emerald-300">
                    <span className="font-mono-tech ltr">
                      HOP 03 · {selectedProxy?.country_code || 'GL'}
                    </span>
                    <Server className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                  <div className="mt-2 font-arabic-display text-xs font-bold text-[#fff6e3] truncate">
                    {selectedProxy?.country_name || 'عقدة البروكسي'}
                  </div>
                  <div className="font-mono-tech text-[10px] text-[var(--accent-light)] mt-0.5 ltr text-right truncate">
                    {selectedProxy?.ping ?? '—'} ms · Port {selectedProxy?.port ?? 443}
                  </div>
                </div>

                {/* Hop 4: Telegram DC */}
                <div className="rounded-xl border border-white/10 bg-black/45 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-[#cbbca7]">
                    <span className="font-mono-tech ltr">HOP 04 · DC</span>
                    <Globe className="h-3.5 w-3.5 text-[var(--accent-light)]" />
                  </div>
                  <div className="mt-2 font-arabic-display text-xs font-bold text-[#fff6e3]">
                    مجمع تيليجرام
                  </div>
                  <div className="font-mono-tech text-[10px] text-[#cbbca7] mt-0.5 ltr text-right truncate">
                    {telemetryMetrics.dcRegion}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Metrics Row Driven by Selected Proxy */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-xl bg-black/45 border border-white/8 p-2.5">
                <span className="text-[10px] text-[#cbbca7] block">سرعة الاستجابة</span>
                <strong className="font-mono-tech text-xs text-[var(--accent-light)] ltr tabular-nums mt-0.5 block">
                  {selectedProxy?.ping !== null && selectedProxy?.ping !== undefined
                    ? `${selectedProxy.ping} ms`
                    : '—'}
                </strong>
              </div>
              <div className="rounded-xl bg-black/45 border border-white/8 p-2.5">
                <span className="text-[10px] text-[#cbbca7] block">التذبذب (Jitter)</span>
                <strong className="font-mono-tech text-xs text-emerald-300 ltr tabular-nums mt-0.5 block">
                  {telemetryMetrics.jitterMs} ms
                </strong>
              </div>
              <div className="rounded-xl bg-black/45 border border-white/8 p-2.5">
                <span className="text-[10px] text-[#cbbca7] block">نسبة الثبات</span>
                <strong className="font-mono-tech text-xs text-[#fff6e3] ltr tabular-nums mt-0.5 block">
                  {selectedProxy?.uptime !== null && selectedProxy?.uptime !== undefined
                    ? `${selectedProxy.uptime}%`
                    : '99%'}
                </strong>
              </div>
              <div className="rounded-xl bg-black/45 border border-white/8 p-2.5">
                <span className="text-[10px] text-[#cbbca7] block">مستخدمو المسار</span>
                <strong className="font-mono-tech text-xs text-[var(--accent-light)] ltr tabular-nums mt-0.5 block">
                  {selectedProxy?.usage?.usesCount ?? 0} اتصال
                </strong>
              </div>
            </div>

            {/* Coordinates & Direct Action Buttons */}
            {selectedProxy && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/8">
                <div className="text-[11px] text-[#cbbca7] flex flex-wrap items-center gap-3">
                  <span className="font-mono-tech text-[10px] ltr">
                    GEO:{' '}
                    {selectedProxy.latitude != null && selectedProxy.longitude != null
                      ? `${Number(selectedProxy.latitude).toFixed(2)}, ${Number(
                          selectedProxy.longitude
                        ).toFixed(2)}`
                      : 'Global Anycast'}
                  </span>
                  {selectedProxy.usage?.lastUsedAt && (
                    <span>آخر نشاط: {formatDateTime(selectedProxy.usage.lastUsedAt)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onInspectProxy && (
                    <button
                      type="button"
                      onClick={() => onInspectProxy(selectedProxy)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#f4efe4] hover:border-[var(--accent)]/45 cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5 text-[var(--accent-light)]" />
                      <Nfc className="h-3.5 w-3.5 text-emerald-300" />
                      <span>QR / NFC</span>
                    </button>
                  )}

                  {onConnectProxy && (
                    <button
                      type="button"
                      onClick={() => onConnectProxy(selectedProxy)}
                      disabled={
                        selectedProxy.blockedForCurrentVisitor || selectedProxy.status === 'paused'
                      }
                      className="el-gold-btn flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer disabled:opacity-45"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>اتصال بهذا المسار</span>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live "What is Happening Now by Country" Activity Grid */}
          <div className="el-card-subtle rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-300" />
                <span className="font-arabic-display text-xs sm:text-sm font-bold text-[#fff6e3]">
                  ماذا يحدث الآن في كل دولة (توزيع التدفقات الحية)
                </span>
              </div>
              <span className="font-mono-tech text-[10px] text-[#cbbca7] ltr">
                {countryTelemetry.length} COUNTRIES
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pl-1">
              {countryTelemetry.map((c) => {
                const isFocused = selectedProxy?.id === c.leadProxy.id;
                const ppsEst = c.activeCount > 0 ? Math.round(900 / Math.max(18, c.bestPing ?? 40) * 32) : 0;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedProxyId(c.leadProxy.id)}
                    className={`rounded-xl border p-2.5 text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isFocused
                        ? 'border-[var(--accent)] bg-[var(--accent)]/12'
                        : 'border-white/8 bg-black/40 hover:border-[var(--accent)]/35'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            c.activeCount > 0
                              ? 'bg-emerald-400 active-proxy-lamp'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-mono-tech text-[10px] font-bold text-[var(--accent-light)] ltr">
                          {c.countryCode}
                        </span>
                        <span className="text-xs font-bold text-[#fff6e3] truncate">
                          {c.countryName}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#cbbca7] mt-1">
                        {c.activeCount > 0
                          ? `تدفق نشط · ${c.activeCount}/${c.totalCount} خادم · ${c.totalUses} جلسة`
                          : `متوقف مؤقتاً · ${c.totalCount} عقدة`}
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="font-mono-tech text-[11px] font-bold text-emerald-300 ltr">
                        {c.bestPing !== null ? `${c.bestPing} ms` : '—'}
                      </div>
                      <div className="font-mono-tech text-[9px] text-[#cbbca7] ltr">
                        {ppsEst} pkt/s
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="el-card rounded-3xl p-5 sm:p-6">{renderWindowBody(false)}</div>

      {/* Expandable Full-Screen Smoked Crystal Telemetry Window */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-2 sm:p-5"
          onClick={() => setExpanded(false)}
        >
          <div
            className="el-card w-full max-w-7xl max-h-[94vh] overflow-y-auto rounded-3xl p-4 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {renderWindowBody(true)}
          </div>
        </div>
      )}
    </>
  );
};

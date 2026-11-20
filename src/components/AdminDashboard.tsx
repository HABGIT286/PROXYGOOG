import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Activity,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
  HardDrive,
  History,
  LogOut,
  MapPin,
  MonitorSmartphone,
  Nfc,
  PauseCircle,
  PlayCircle,
  Palette,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { LuxuryIcon } from './LuxuryIcon';
import {
  AdminOverviewData,
  AdminSubTab,
  DisplayMode,
  ProxyItem,
  SiteAppearance,
  VisitorRecord,
} from '../types';
import { ProxyFlowWindow } from './ProxyFlowWindow';
import { AdminAppearanceStudio } from './AdminAppearanceStudio';
import { downloadTextFile, formatDateTime, formatDuration } from '../utils/proxyHelpers';

interface AdminDashboardProps {
  token: string;
  overview: AdminOverviewData | null;
  loading: boolean;
  activeSubTab: AdminSubTab;
  onSelectSubTab: (tab: AdminSubTab) => void;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onToast: (msg: string) => void;
  accentHex: string;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onOpenThemes: () => void;
  appearance: SiteAppearance;
  onUpdateAppearance: (next: SiteAppearance) => void;
  onConnectProxy?: (proxy: ProxyItem) => void;
  onInspectProxy?: (proxy: ProxyItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  overview,
  loading,
  activeSubTab,
  onSelectSubTab,
  onRefresh,
  onLogout,
  onToast,
  accentHex,
  displayMode,
  onDisplayModeChange,
  onOpenThemes,
  appearance,
  onUpdateAppearance,
  onConnectProxy,
  onInspectProxy,
}) => {
  const [selectedProxy, setSelectedProxy] = useState<ProxyItem | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [proxyFilter, setProxyFilter] = useState<'all' | 'active' | 'inactive' | 'paused'>('all');
  const [blockTargetProxy, setBlockTargetProxy] = useState<Record<string, string>>({});
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (activeSubTab === 'notifications' && overview && overview.stats.unread_notifications > 0) {
      fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(() => onRefresh())
        .catch(() => {});
    }
  }, [activeSubTab, overview, token, onRefresh]);

  useEffect(() => {
    if (activeSubTab !== 'notifications' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([28, 42], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap',
      }).addTo(mapInstanceRef.current);
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const proxies = overview?.proxies || [];
    proxies.forEach((p) => {
      const lat = Number(p.latitude ?? p.lat);
      const lon = Number(p.longitude ?? p.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return;
      }
      const isUp = p.status === 'active';
      const marker = L.circleMarker([lat, lon], {
        radius: 8,
        color: isUp ? '#34d399' : '#f87171',
        fillColor: isUp ? '#34d399' : '#f87171',
        fillOpacity: 0.75,
        weight: 2,
      }).addTo(mapInstanceRef.current!);

      marker.bindPopup(
        `<div style="direction:rtl;text-align:right">
          <b>${p.country_name || p.server}</b><br/>
          <span style="font-family:monospace">${p.server}:${p.port}</span><br/>
          السرعة: ${p.ping ?? '—'} ms · الاستخدامات: ${p.usage?.usesCount ?? 0}
        </div>`
      );
      markersRef.current.push(marker);
    });

    if (selectedProxy && selectedProxy.latitude && selectedProxy.longitude) {
      mapInstanceRef.current.setView(
        [Number(selectedProxy.latitude), Number(selectedProxy.longitude)],
        5
      );
    }

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
  }, [activeSubTab, overview, selectedProxy]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Keep selectedVisitor synced on refresh
  useEffect(() => {
    if (selectedVisitor && overview?.visitors) {
      const updated = overview.visitors.find((v) => v.visitorId === selectedVisitor.visitorId);
      if (updated) setSelectedVisitor(updated);
    }
  }, [overview, selectedVisitor]);

  const handleToggleProxy = async (proxy: ProxyItem) => {
    const nextPaused = !(proxy.usage?.pausedByAdmin);
    try {
      const res = await fetch('/api/admin/proxy/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ proxyId: proxy.id, paused: nextPaused }),
      });
      if (!res.ok) throw new Error('فشل تعديل حالة البروكسي');
      onToast(nextPaused ? `تم إيقاف البروكسي ${proxy.server}` : `تم إعادة تفعيل ${proxy.server}`);
      await onRefresh();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

  const handleBlockVisitor = async (visitor: VisitorRecord, proxyId: string, blocked: boolean) => {
    try {
      const res = await fetch('/api/admin/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitorId: visitor.visitorId,
          proxyId,
          blocked,
        }),
      });
      if (!res.ok) throw new Error('تعذر تنفيذ الحظر');
      onToast(
        blocked
          ? `تم منع المستخدم ${visitor.visitorId.slice(0, 10)} بنجاح`
          : `تم رفع الحظر عن ${visitor.visitorId.slice(0, 10)}`
      );
      await onRefresh();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'حدث خطأ');
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    try {
      const res = await fetch(`/api/admin/visitors/${encodeURIComponent(visitorId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('تعذر حذف المستخدم من السجل');
      setConfirmDeleteId(null);
      if (selectedVisitor?.visitorId === visitorId) {
        setSelectedVisitor(null);
      }
      onToast(`تم حذف سجل المستخدم ${visitorId} نهائياً`);
      await onRefresh();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const handleExportJson = () => {
    if (!overview) return;
    downloadTextFile(
      `ONX44-FULL-REPORT-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(overview, null, 2),
      'application/json;charset=utf-8'
    );
    onToast('تم تنزيل التقرير الشامل بصيغة JSON');
  };

  const handleExportCsv = () => {
    if (!overview) return;
    const header = [
      'ID',
      'Server',
      'Port',
      'Country',
      'City',
      'Status',
      'Ping_ms',
      'Uptime_%',
      'Uses_Count',
      'Unique_Users',
      'QR_Scans',
      'NFC_Count',
      'Active_Seconds',
      'First_Used',
      'Last_Used',
      'Stopped_At',
      'Latitude',
      'Longitude',
    ].join(',');
    const rows = overview.proxies.map((p) =>
      [
        `"${p.id}"`,
        `"${p.server}"`,
        p.port,
        `"${p.country_name || ''}"`,
        `"${p.city || ''}"`,
        `"${p.status}"`,
        p.ping ?? '',
        p.uptime ?? '',
        p.usage?.usesCount ?? 0,
        p.usage?.uniqueVisitors.length ?? 0,
        p.usage?.qrCount ?? 0,
        p.usage?.nfcCount ?? 0,
        p.usage?.totalActiveSeconds ?? 0,
        `"${p.usage?.firstUsedAt ?? ''}"`,
        `"${p.usage?.lastUsedAt ?? ''}"`,
        `"${p.usage?.stoppedAt ?? ''}"`,
        p.latitude ?? '',
        p.longitude ?? '',
      ].join(',')
    );
    downloadTextFile(
      `ONX44-PROXIES-MAP-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows].join('\n'),
      'text/csv;charset=utf-8'
    );
    onToast('تم تنزيل بيانات البروكسيات والخريطة بصيغة CSV');
  };

  const stats = overview?.stats || {
    total_proxies: 0,
    active_proxies: 0,
    inactive_proxies: 0,
    total_users: 0,
    total_connections: 0,
    qr_scans: 0,
    nfc_triggers: 0,
    unread_notifications: 0,
  };

  const filteredProxies = (overview?.proxies || []).filter((p) => {
    if (proxyFilter === 'active') return p.status === 'active';
    if (proxyFilter === 'paused') return p.status === 'paused' || p.usage?.pausedByAdmin;
    if (proxyFilter === 'inactive') return p.status !== 'active';
    return true;
  });

  return (
    <section className="space-y-6">
      {/* Command Center Top Header */}
      <div className="el-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <LuxuryIcon variant="shield" tone="gold" size="lg" />
            <div>
              <h2 className="el-gold-text font-display text-lg sm:text-xl font-extrabold tracking-wide ltr">
                ONX44 · ADMIN COMMAND CENTER
              </h2>
              <p className="text-xs text-[#cbbca7] mt-0.5">
                إدارة شاملة للبروكسيات، التخزين، مراقبة وحذف المستخدمين، الحظر، الخريطة والإشعارات
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3.5 py-2 text-xs font-bold text-[var(--accent-light)] hover:bg-[var(--accent)]/20 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-[#e8dcc8] hover:bg-white/10 cursor-pointer"
            >
              <FileJson className="h-3.5 w-3.5 text-[var(--accent-light)]" />
              <span>تنزيل JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-[#e8dcc8] hover:bg-white/10 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
              <span>تنزيل CSV + الخريطة</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Bar (5 Luxury Admin Sections) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 rounded-2xl border border-white/10 bg-black/50 p-1.5">
          <button
            type="button"
            onClick={() => onSelectSubTab('overview')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'overview' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>البيانات والـ 3D</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSubTab('proxies')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'proxies' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>البروكسيات والتخزين</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSubTab('users')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'users' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>المستخدمون ({overview?.visitors.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSubTab('notifications')}
            className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'notifications' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>الإشعارات والخريطة</span>
            {stats.unread_notifications > 0 && activeSubTab !== 'notifications' && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 font-mono-tech text-[10px] font-bold text-black">
                {stats.unread_notifications}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectSubTab('appearance')}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'appearance' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>المظهر والخطوط</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 5: APPEARANCE, 10 THEMES, 20 FONTS, 5 CARD STYLES & PHONE GALLERY */}
      {activeSubTab === 'appearance' && (
        <div className="tab-panel-enter">
          <AdminAppearanceStudio
            token={token}
            appearance={appearance}
            onUpdateAppearance={onUpdateAppearance}
            onToast={onToast}
          />
        </div>
      )}

      {/* SUB-TAB 1: OVERVIEW & 3D FLOW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="el-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs text-[#cbbca7]">
                <span>إجمالي البروكسيات</span>
                <LuxuryIcon variant="storage" tone="glass" size="sm" />
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold text-[#fff6e3] tabular-nums">
                {stats.total_proxies}
              </div>
              <div className="mt-1 text-[11px] text-emerald-300">
                {stats.active_proxies} فعالة · {stats.inactive_proxies} متوقفة
              </div>
            </div>

            <div className="el-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs text-[#cbbca7]">
                <span>المستخدمون المسجلون</span>
                <LuxuryIcon variant="users" tone="glass" size="sm" />
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold text-[#fff6e3] tabular-nums">
                {stats.total_users}
              </div>
              <div className="mt-1 text-[11px] text-[#cbbca7]">
                تتبع الجلسات والأجهزة الفريدة
              </div>
            </div>

            <div className="el-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs text-[#cbbca7]">
                <span>إجمالي الاتصالات</span>
                <LuxuryIcon variant="zap" tone="emerald" size="sm" />
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold text-emerald-300 tabular-nums">
                {stats.total_connections}
              </div>
              <div className="mt-1 text-[11px] text-[#cbbca7]">
                اتصالات Telegram و QR و NFC
              </div>
            </div>

            <div className="el-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs text-[#cbbca7]">
                <span>QR & NFC</span>
                <LuxuryIcon variant="qr" tone="gold" size="sm" />
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold text-[var(--accent-light)] tabular-nums">
                {stats.qr_scans + stats.nfc_triggers}
              </div>
              <div className="mt-1 text-[11px] text-[#cbbca7]">
                {stats.qr_scans} مسح QR · {stats.nfc_triggers} نقل NFC
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="el-card rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#cbbca7]">
                تحكم سريع بوضع العرض وهندسة المظهر قبل استعراض تدفق الحزم الحي:
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenThemes}
                  className="rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-2 text-xs font-bold text-[var(--accent-light)] hover:bg-[var(--accent)]/20 cursor-pointer"
                >
                  تغيير الخلفية والسطوع والخطوط
                </button>
                <select
                  value={displayMode}
                  onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
                  className="rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-display font-bold text-[#f4efe4] focus:outline-none cursor-pointer"
                >
                  <option value="desktop">DESKTOP</option>
                  <option value="ipad">IPAD</option>
                  <option value="phone">PHONE</option>
                </select>
              </div>
            </div>

            <ProxyFlowWindow
              proxies={overview?.proxies || []}
              activeProxies={stats.active_proxies}
              totalProxies={stats.total_proxies}
              accentHex={accentHex}
              luminanceFactor={(appearance.luminanceLevel ?? 85) / 100}
              onConnectProxy={onConnectProxy}
              onInspectProxy={onInspectProxy}
              title="مركز مراقبة التدفقات الشامل (Admin Live Routing Telemetry)"
              subtitle="انقر على أي دولة أو عقدة بروكسي لمعاينة سيلان الحزم، عدد الاستخدامات، والمسار الفعلي الآن"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PROXIES & STORAGE CONTROL */}
      {activeSubTab === 'proxies' && (
        <div className="el-card rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-arabic-display text-base font-bold text-[#f4efe4]">
                التحكم بالبروكسيات وسجل التخزين والاستخدام
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                مراقبة وقت البدء، وقت الإيقاف، مدة التشغيل، وعدد المستخدمين لكل بروكسي
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-black/45 p-1 border border-white/10">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'active', label: 'الفعالة' },
                  { id: 'paused', label: 'الموقوفة إدارياً' },
                  { id: 'inactive', label: 'المتوقفة' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setProxyFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    proxyFilter === f.id ? 'el-gold-btn' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProxies.map((p) => {
              const isUp = p.status === 'active';
              const isPaused = Boolean(p.usage?.pausedByAdmin);
              return (
                <div
                  key={p.id}
                  className={`el-card-subtle rounded-2xl p-4 space-y-3 border ${
                    isPaused ? 'border-amber-500/40' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isUp ? 'bg-emerald-400 active-proxy-lamp' : 'bg-rose-400'
                          }`}
                        />
                        <h4 className="font-arabic-display text-sm font-bold text-[#f4efe4]">
                          {p.country_name || p.server}
                        </h4>
                      </div>
                      <div className="mt-1 font-mono-tech text-[11px] text-stone-400 ltr">
                        {p.server}:{p.port} · {p.ping !== null ? `${p.ping} ms` : '—'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleProxy(p)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold cursor-pointer ${
                        isPaused
                          ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                          : 'border border-amber-400/40 bg-amber-500/10 text-amber-200'
                      }`}
                    >
                      {isPaused ? (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>تشغيل البروكسي</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="h-3.5 w-3.5" />
                          <span>إيقاف مؤقت</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-xl bg-black/40 p-2.5">
                      <span className="text-stone-400 block">عدد المستخدمين</span>
                      <strong className="font-mono-tech text-[var(--accent-light)] mt-0.5 block">
                        {p.usage?.uniqueVisitors.length ?? 0} ({p.usage?.usesCount ?? 0} نقرة)
                      </strong>
                    </div>
                    <div className="rounded-xl bg-black/40 p-2.5">
                      <span className="text-stone-400 block">QR / NFC</span>
                      <strong className="font-mono-tech text-stone-200 mt-0.5 block">
                        {p.usage?.qrCount ?? 0} QR · {p.usage?.nfcCount ?? 0} NFC
                      </strong>
                    </div>
                    <div className="rounded-xl bg-black/40 p-2.5">
                      <span className="text-stone-400 block">مدة التخزين/العمل</span>
                      <strong className="text-emerald-300 mt-0.5 block">
                        {formatDuration(p.usage?.totalActiveSeconds ?? 0)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-black/40 p-2.5">
                      <span className="text-stone-400 block flex items-center gap-1">
                        <Clock className="h-3 w-3" /> وقت البدء
                      </span>
                      <strong className="text-stone-200 mt-0.5 block">
                        {formatDateTime(p.usage?.firstUsedAt)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-black/40 p-2.5">
                      <span className="text-stone-400 block">آخر استخدام</span>
                      <strong className="text-stone-200 mt-0.5 block">
                        {formatDateTime(p.usage?.lastUsedAt)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-black/40 p-2.5">
                      <span className="text-stone-400 block">وقت التوقف</span>
                      <strong className="text-rose-300 mt-0.5 block">
                        {formatDateTime(p.usage?.stoppedAt)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono-tech text-[10px] text-stone-500 ltr">
                      ID: {p.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProxy(p);
                        onSelectSubTab('notifications');
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent-light)] hover:underline cursor-pointer"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>تحديد على الخريطة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: USERS, HISTORY DOSSIER, BLOCKING & DELETE */}
      {activeSubTab === 'users' && (
        <div className="el-card rounded-3xl p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="font-arabic-display text-base font-bold text-[#f4efe4]">
              سجل المستخدمين — المراقبة، الحظر، والحذف النهائي
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              انقر على أي مستخدم لعرض ملفه الكامل وسجل البروكسيات والأوقات والمكان داخل بطاقة فخمة، مع إمكانية الحظر أو الحذف النهائي
            </p>
          </div>

          {!overview?.visitors.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-xs text-stone-400">
              لا توجد زيارات أو تفاعلات مسجلة بعد. سيظهر كل مستخدم هنا فور تصفحه أو استخدامه لأي بروكسي.
            </div>
          ) : (
            <div className="space-y-3">
              {overview.visitors.map((v) => {
                const chosenProxy = blockTargetProxy[v.visitorId] || v.lastProxyId || 'ALL';
                const isProxyBlocked =
                  chosenProxy === 'ALL'
                    ? v.blockedAll
                    : v.blockedProxies.includes(chosenProxy);
                const confirmingDelete = confirmDeleteId === v.visitorId;

                return (
                  <div
                    key={v.visitorId}
                    onClick={() => setSelectedVisitor(v)}
                    className={`el-card-subtle rounded-2xl p-4 border transition-all hover:border-[var(--accent)]/50 cursor-pointer ${
                      v.blockedAll ? 'border-rose-500/40' : 'border-white/10'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 active-proxy-lamp" />
                          <span className="font-mono-tech text-xs font-bold text-[var(--accent-light)] ltr">
                            {v.visitorId}
                          </span>
                          <span className="font-mono-tech text-[11px] text-stone-400 ltr">
                            IP: {v.ip}
                          </span>
                          {v.locationLabel && (
                            <span className="text-[11px] text-stone-300 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[var(--accent-light)]" />
                              {v.locationLabel}
                            </span>
                          )}
                          {v.blockedAll && (
                            <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                              <ShieldAlert className="h-3.5 w-3.5" /> محظور بالكامل
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          الأحداث: {v.totalEvents} · البروكسيات: {v.proxiesUsed.length} · الدخول الأول:{' '}
                          {formatDateTime(v.firstSeenAt)} · آخر ظهور: {formatDateTime(v.lastSeenAt)}
                        </div>
                      </div>

                      <div
                        className="flex flex-wrap items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedVisitor(v)}
                          className="flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-2 text-xs font-bold text-[var(--accent-light)] hover:bg-[var(--accent)]/20 cursor-pointer"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>عرض السجل</span>
                        </button>

                        <select
                          value={chosenProxy}
                          onChange={(e) =>
                            setBlockTargetProxy((prev) => ({
                              ...prev,
                              [v.visitorId]: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-white/15 bg-black/55 px-2.5 py-2 text-xs text-[#f4efe4] focus:outline-none max-w-[170px]"
                        >
                          <option value="ALL">جميع البروكسيات</option>
                          {(overview.proxies || []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.server} ({p.country_code || 'GL'})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleBlockVisitor(v, chosenProxy, !isProxyBlocked)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer ${
                            isProxyBlocked
                              ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                              : 'border border-amber-500/40 bg-amber-500/15 text-amber-200'
                          }`}
                        >
                          {isProxyBlocked ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>رفع المنع</span>
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" />
                              <span>منع</span>
                            </>
                          )}
                        </button>

                        {/* Delete Visitor Control (Luxury Glass Confirmation, no browser alert) */}
                        {confirmingDelete ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteVisitor(v.visitorId)}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-xs text-stone-300 cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(v.visitorId)}
                            title="حذف المستخدم نهائياً"
                            className="flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: NOTIFICATIONS & WORLD MAP */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6">
          <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LuxuryIcon variant="globe" tone="gold" size="md" />
                <div>
                  <h3 className="el-gold-text font-arabic-display text-base font-extrabold">
                    الخريطة الجغرافية الكاملة للبروكسيات
                  </h3>
                  <p className="text-xs text-[#cbbca7]">
                    عرض مواقع الخوادم الحية وإحداثياتها مع إمكانية تنزيل البيانات
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                className="el-gold-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تنزيل الخريطة والبيانات</span>
              </button>
            </div>

            <div
              ref={mapContainerRef}
              className="h-80 w-full overflow-hidden rounded-2xl border border-[var(--accent)]/30"
            />
          </div>

          <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LuxuryIcon variant="bell" tone="gold" size="md" />
                <div>
                  <h3 className="el-gold-text font-arabic-display text-base font-extrabold">
                    سجل الإشعارات الفوري
                  </h3>
                  <p className="text-xs text-[#cbbca7]">
                    تظهر هنا جميع عمليات الدخول والاتصال ومسح QR وتفعيل NFC ورسائل التواصل مع الوقت الكامل
                  </p>
                </div>
              </div>
              <span className="font-mono-tech text-xs text-[#cbbca7]">
                {overview?.notifications.length ?? 0} إشعار
              </span>
            </div>

            {!overview?.notifications.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-stone-400">
                لا توجد إشعارات مسجلة حتى الآن.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {overview.notifications.map((ntf) => (
                  <div
                    key={ntf.id}
                    className="el-card-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent-light)]">
                        {ntf.type === 'qr' ? (
                          <QrCode className="h-4 w-4" />
                        ) : ntf.type === 'nfc' ? (
                          <Nfc className="h-4 w-4" />
                        ) : ntf.type === 'block' ? (
                          <Ban className="h-4 w-4 text-rose-300" />
                        ) : (
                          <Database className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#f4efe4]">{ntf.title}</div>
                        <div className="text-[11px] text-stone-300 mt-0.5">{ntf.message}</div>
                        <div className="font-mono-tech text-[10px] text-stone-500 mt-1 ltr text-right">
                          IP: {ntf.visitorIp} · ID: {ntf.visitorId}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono-tech text-[11px] text-[var(--accent-light)] shrink-0">
                      {formatDateTime(ntf.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LUXURY GLASS USER DOSSIER MODAL (NO BROWSER ALERTS) */}
      {selectedVisitor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-lg"
          onClick={() => setSelectedVisitor(null)}
        >
          <div
            className="el-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dossier Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <LuxuryIcon variant="users" tone="gold" size="lg" />
                <div>
                  <div className="font-mono-tech text-[10px] tracking-widest text-[var(--accent)] ltr">
                    USER TELEMETRY DOSSIER
                  </div>
                  <h3 className="el-gold-text font-display text-lg font-extrabold ltr">
                    {selectedVisitor.visitorId}
                  </h3>
                  <div className="text-xs text-[#cbbca7] mt-0.5">
                    {selectedVisitor.locationLabel || 'موقع غير محدد'} ·{' '}
                    <span className="font-mono-tech ltr">{selectedVisitor.ip}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVisitor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#cbbca7] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Key User Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="el-card-subtle rounded-2xl p-3">
                <span className="text-[10px] text-[#cbbca7] block">أول دخول</span>
                <strong className="text-xs text-[#fff6e3] mt-1 block">
                  {formatDateTime(selectedVisitor.firstSeenAt)}
                </strong>
              </div>
              <div className="el-card-subtle rounded-2xl p-3">
                <span className="text-[10px] text-[#cbbca7] block">آخر نشاط</span>
                <strong className="text-xs text-emerald-300 mt-1 block">
                  {formatDateTime(selectedVisitor.lastSeenAt)}
                </strong>
              </div>
              <div className="el-card-subtle rounded-2xl p-3">
                <span className="text-[10px] text-[#cbbca7] block">عدد التفاعلات</span>
                <strong className="font-display text-lg font-bold text-[var(--accent-light)] mt-0.5 block">
                  {selectedVisitor.totalEvents}
                </strong>
              </div>
              <div className="el-card-subtle rounded-2xl p-3">
                <span className="text-[10px] text-[#cbbca7] block">البروكسيات المستخدمة</span>
                <strong className="font-display text-lg font-bold text-[#fff6e3] mt-0.5 block">
                  {selectedVisitor.proxiesUsed.length}
                </strong>
              </div>
            </div>

            {/* Device & Location Details */}
            <div className="el-card-subtle rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-light)]">
                <MonitorSmartphone className="h-4 w-4" />
                <span>بيانات الجهاز والمتصفح والموقع</span>
              </div>
              <div className="text-xs text-[#e8dcc8]">
                المكان: {selectedVisitor.locationLabel || 'غير محدد'} ({selectedVisitor.ip})
              </div>
              <div className="font-mono-tech text-[11px] text-[#cbbca7] break-all ltr bg-black/45 p-2.5 rounded-xl border border-white/5">
                {selectedVisitor.userAgent}
              </div>
            </div>

            {/* Chronological Proxy Usage History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#f4efe4]">
                  <History className="h-4 w-4 text-[var(--accent-light)]" />
                  <span>سجل البروكسيات والأوقات المستعملة</span>
                </div>
                <span className="font-mono-tech text-[11px] text-stone-400">
                  {selectedVisitor.history?.length ?? 0} سجل
                </span>
              </div>

              {!selectedVisitor.history?.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center text-xs text-stone-400">
                  لم يتم تسجيل استخدامات تفصيلية لهذا المستخدم بعد.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedVisitor.history.map((h) => (
                    <div
                      key={h.id}
                      className="el-card-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl p-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[var(--accent-light)]">{h.action}</span>
                        {h.proxyLabel && (
                          <div className="text-[11px] text-stone-300 mt-0.5">{h.proxyLabel}</div>
                        )}
                      </div>
                      <span className="font-mono-tech text-[11px] text-stone-400 shrink-0">
                        {formatDateTime(h.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dossier Footer Actions: Block All or Delete Permanently */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() =>
                  handleBlockVisitor(selectedVisitor, 'ALL', !selectedVisitor.blockedAll)
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer ${
                  selectedVisitor.blockedAll
                    ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    : 'border border-amber-500/40 bg-amber-500/15 text-amber-200'
                }`}
              >
                <Ban className="h-4 w-4" />
                <span>
                  {selectedVisitor.blockedAll ? 'إلغاء حظر المستخدم بالكامل' : 'حظر من جميع البروكسيات'}
                </span>
              </button>

              {confirmDeleteId === selectedVisitor.visitorId ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteVisitor(selectedVisitor.visitorId)}
                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
                  >
                    نعم، احذف نهائياً
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-stone-300 cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedVisitor.visitorId)}
                  className="flex items-center gap-2 rounded-xl border border-rose-500/45 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف المستخدم نهائياً</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

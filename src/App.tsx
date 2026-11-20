import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpLeft,
  Clock,
  ExternalLink,
  Nfc,
  QrCode,
  RefreshCw,
  Send,
  X,
  Zap,
} from 'lucide-react';
import { LuxuryIcon } from './components/LuxuryIcon';
import {
  ARABIC_FONTS,
  DEFAULT_APPEARANCE,
  ENGLISH_FONTS,
  FIXED_PROXY_ITEM,
  FONT_COLOR_PRESETS,
  STUDIO_BACKGROUNDS,
  STUDIO_THEMES,
  TELEGRAM_DEV_LABEL,
  TELEGRAM_DEV_URL,
  TELEGRAM_HANDLE,
} from './constants';
import {
  AdminOverviewData,
  AdminSubTab,
  DisplayMode,
  ProxyItem,
  ProxyStats,
  PublicTab,
  SiteAppearance,
} from './types';
import {
  buildProxyTgLink,
  buildProxyWebLink,
  getVisitorId,
  launchTelegramUrl,
} from './utils/proxyHelpers';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { ProxyFlowWindow } from './components/ProxyFlowWindow';
import { SpeedometerGauge } from './components/SpeedometerGauge';
import { ProxyCardModal } from './components/ProxyCardModal';
import { ContactSection } from './components/ContactSection';
import { ProfileSection } from './components/ProfileSection';
import { ThemesSection } from './components/ThemesSection';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { StudioBackdropModal } from './components/StudioBackdropModal';

export default function App() {
  const visitorId = useMemo(() => getVisitorId(), []);

  const [activeTab, setActiveTab] = useState<PublicTab | 'admin'>('proxies');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('overview');
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem('onx44_display_mode');
    if (saved === 'desktop' || saved === 'ipad' || saved === 'phone') return saved;
    return window.innerWidth < 640 ? 'phone' : window.innerWidth < 1024 ? 'ipad' : 'desktop';
  });

  const [appearance, setAppearance] = useState<SiteAppearance>(() => {
    try {
      const saved = localStorage.getItem('onx44_appearance_v2');
      if (saved) {
        return { ...DEFAULT_APPEARANCE, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return { ...DEFAULT_APPEARANCE };
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [proxies, setProxies] = useState<ProxyItem[]>([FIXED_PROXY_ITEM]);
  const [stats, setStats] = useState<ProxyStats>({
    online: 1,
    dead: 0,
    total: 1,
    trackedUsers: 1,
    totalConnections: 0,
  });
  const [loadingProxies, setLoadingProxies] = useState<boolean>(true);
  const [proxyFilter, setProxyFilter] = useState<'all' | 'active'>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedProxy, setSelectedProxy] = useState<ProxyItem | null>(null);
  const [studioPickerOpen, setStudioPickerOpen] = useState<boolean>(false);

  // NFC Handshake Glass Overlay when ?nfc=random is opened or triggered
  const [nfcOverlayProxy, setNfcOverlayProxy] = useState<ProxyItem | null>(null);

  // Admin auth & overview state
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    sessionStorage.getItem('onx44_admin_token')
  );
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewData | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);
  const nfcTriggeredRef = useRef<boolean>(false);
  const sessionStartRef = useRef<number>(Date.now());
  const activeProxyRef = useRef<ProxyItem | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 3600);
  }, []);

  const currentTheme = useMemo(
    () => STUDIO_THEMES.find((t) => t.id === appearance.themeId) || STUDIO_THEMES[0],
    [appearance.themeId]
  );

  const currentBg = useMemo(
    () => STUDIO_BACKGROUNDS.find((b) => b.id === appearance.bgId) || STUDIO_BACKGROUNDS[0],
    [appearance.bgId]
  );

  const currentEnFont = useMemo(
    () => ENGLISH_FONTS.find((f) => f.id === appearance.englishFont) || ENGLISH_FONTS[0],
    [appearance.englishFont]
  );

  const currentArFont = useMemo(
    () => ARABIC_FONTS.find((f) => f.id === appearance.arabicFont) || ARABIC_FONTS[0],
    [appearance.arabicFont]
  );

  const currentFontColor = useMemo(
    () => FONT_COLOR_PRESETS.find((c) => c.id === appearance.fontColorId) || FONT_COLOR_PRESETS[0],
    [appearance.fontColorId]
  );

  // Fetch global admin-published appearance on load
  useEffect(() => {
    fetch('/api/appearance', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.appearance) {
          setAppearance((prev) => ({
            ...DEFAULT_APPEARANCE,
            ...prev,
            ...data.appearance,
            customWallpapers: Array.isArray(data.appearance.customWallpapers)
              ? data.appearance.customWallpapers
              : prev.customWallpapers,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Apply all visual tokens live to :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', currentTheme.accent);
    root.style.setProperty('--accent-2', currentTheme.accent2);
    root.style.setProperty('--accent-light', currentTheme.accentLight);
    root.style.setProperty('--accent-glow', currentTheme.glow);
    root.style.setProperty('--font-en', currentEnFont.family);
    root.style.setProperty('--font-ar', currentArFont.family);
    root.style.setProperty('--font-title-color', currentFontColor.titleColor);
    root.style.setProperty('--font-body-color', currentFontColor.bodyColor);
    root.style.setProperty('--font-muted-color', currentFontColor.mutedColor);
    root.style.setProperty('--font-glow-color', currentFontColor.glowColor);
    root.style.setProperty(
      '--site-luminance',
      String(Math.max(0.1, Math.min(1, (appearance.luminanceLevel ?? 85) / 100)))
    );
    root.setAttribute('data-card-style', appearance.cardStyle || 'frosted-gloss');
    try {
      localStorage.setItem('onx44_appearance_v2', JSON.stringify(appearance));
    } catch {
      // ignore quota when huge custom image is already persisted server-side
    }
  }, [currentTheme, currentEnFont, currentArFont, currentFontColor, appearance]);

  useEffect(() => {
    localStorage.setItem('onx44_display_mode', displayMode);
  }, [displayMode]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      showToast('تمت استعادة الاتصال بالإنترنت');
    };
    const onOffline = () => {
      setIsOnline(false);
      showToast('انقطع الاتصال بالإنترنت');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [showToast]);

  const trackEvent = useCallback(
    async (
      action: 'visit' | 'inspect' | 'connect' | 'qr' | 'nfc_share' | 'nfc_connect' | 'session_end',
      proxy?: ProxyItem,
      durationSeconds?: number
    ): Promise<boolean> => {
      try {
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            action,
            proxyId: proxy?.id,
            proxyLabel: proxy ? `${proxy.country_name || proxy.server} (${proxy.server}:${proxy.port})` : undefined,
            durationSeconds,
          }),
        });
        const data = await res.json();
        if (res.status === 403 || data.blocked) {
          showToast(data.reason || 'تم منع استخدام هذا البروكسي لحسابك');
          return false;
        }
        return true;
      } catch {
        return true;
      }
    },
    [visitorId, showToast]
  );

  useEffect(() => {
    trackEvent('visit');
    const handleUnload = () => {
      if (activeProxyRef.current) {
        const secs = Math.round((Date.now() - sessionStartRef.current) / 1000);
        navigator.sendBeacon(
          '/api/track',
          new Blob(
            [
              JSON.stringify({
                visitorId,
                action: 'session_end',
                proxyId: activeProxyRef.current.id,
                durationSeconds: secs,
              }),
            ],
            { type: 'application/json' }
          )
        );
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [visitorId, trackEvent]);

  const loadPublicData = useCallback(async () => {
    setLoadingProxies(true);
    try {
      const [pxRes, stRes] = await Promise.all([
        fetch(`/api/proxies?per=60&sort=ping&visitorId=${encodeURIComponent(visitorId)}`, {
          cache: 'no-store',
        }),
        fetch('/api/stats', { cache: 'no-store' }),
      ]);
      if (pxRes.ok) {
        const pxData = await pxRes.json();
        if (Array.isArray(pxData.proxies) && pxData.proxies.length > 0) {
          setProxies(pxData.proxies);
        }
      }
      if (stRes.ok) {
        const stData = await stRes.json();
        if (stData.stats) {
          setStats(stData.stats);
        }
      }
      setLastUpdated(new Date().toLocaleTimeString('ar-IQ', { hour12: false }));
    } catch {
      showToast('تعذر تحديث قائمة البروكسيات الآن');
    } finally {
      setLoadingProxies(false);
    }
  }, [visitorId, showToast]);

  useEffect(() => {
    loadPublicData();
    const id = setInterval(() => {
      if (!document.hidden) loadPublicData();
    }, 45000);
    return () => clearInterval(id);
  }, [loadPublicData]);

  const refreshAdminOverview = useCallback(async () => {
    if (!adminToken) return;
    setLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${adminToken}` },
        cache: 'no-store',
      });
      if (res.status === 401) {
        setAdminToken(null);
        sessionStorage.removeItem('onx44_admin_token');
        setActiveTab('proxies');
        showToast('انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAdminOverview(data);
      }
    } catch {
      showToast('تعذر مزامنة بيانات لوحة التحكم');
    } finally {
      setLoadingAdmin(false);
    }
  }, [adminToken, showToast]);

  useEffect(() => {
    if (adminToken) {
      refreshAdminOverview();
      const id = setInterval(() => {
        if (!document.hidden) refreshAdminOverview();
      }, 30000);
      return () => clearInterval(id);
    }
  }, [adminToken, refreshAdminOverview]);

  // Random valid proxy selector for NFC mode (with instant Glass Handshake Overlay + Telegram launch)
  const triggerRandomNfcConnect = useCallback(
    (fromDirectClick = false) => {
      const validCandidates = proxies.filter(
        (p) => p.status === 'active' && !p.blockedForCurrentVisitor && buildProxyTgLink(p)
      );
      const pool = validCandidates.length > 0 ? validCandidates : [FIXED_PROXY_ITEM];
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      activeProxyRef.current = chosen;
      sessionStartRef.current = Date.now();
      setNfcOverlayProxy(chosen);

      const link = buildProxyTgLink(chosen);
      if (fromDirectClick && link) {
        // Immediate synchronous launch within user tap so mobile browsers never block tg://
        launchTelegramUrl(link);
      } else if (link) {
        try {
          window.location.href = link;
        } catch {
          // Glass overlay stays open with 1-tap connect button
        }
      }

      trackEvent('nfc_connect', chosen);
      showToast(
        `تم اختيار بروكسي عشوائي صالح عبر NFC: ${chosen.country_name || chosen.server}`
      );
    },
    [proxies, trackEvent, showToast]
  );

  // Auto-run NFC random connection when opened via ?nfc=random
  useEffect(() => {
    if (nfcTriggeredRef.current || loadingProxies || proxies.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('nfc') === 'random') {
      nfcTriggeredRef.current = true;
      triggerRandomNfcConnect(false);
    }
  }, [loadingProxies, proxies, triggerRandomNfcConnect]);

  const handleOpenProxyDetails = async (proxy: ProxyItem) => {
    const allowed = await trackEvent('inspect', proxy);
    if (!allowed) return;
    activeProxyRef.current = proxy;
    sessionStartRef.current = Date.now();
    setSelectedProxy(proxy);
  };

  const handleDirectConnect = (proxy: ProxyItem) => {
    if (proxy.blockedForCurrentVisitor) {
      showToast('تم تقييد استخدام هذا البروكسي لحسابك من قبل الإدارة');
      return;
    }
    if (proxy.status === 'paused') {
      showToast('تم إيقاف هذا البروكسي مؤقتاً من قبل المسؤول');
      return;
    }
    activeProxyRef.current = proxy;
    sessionStartRef.current = Date.now();
    const link = buildProxyTgLink(proxy);
    if (link) {
      launchTelegramUrl(link);
      showToast(`جاري فتح ${proxy.server} داخل تيليجرام`);
    }
    trackEvent('connect', proxy);
  };

  const fastestProxy = useMemo(() => {
    const activeOnes = proxies.filter((p) => p.status === 'active' && !p.isFixed);
    return activeOnes[0] || proxies[0] || FIXED_PROXY_ITEM;
  }, [proxies]);

  const displayedProxies = useMemo(() => {
    if (proxyFilter === 'active') {
      return proxies.filter((p) => p.status === 'active');
    }
    return proxies;
  }, [proxies, proxyFilter]);

  const containerWidthClass =
    displayMode === 'phone'
      ? 'max-w-[440px]'
      : displayMode === 'ipad'
      ? 'max-w-[820px]'
      : 'max-w-[1360px]';

  const unreadCount = adminOverview?.stats.unread_notifications ?? 0;

  return (
    <div
      className="relative min-h-screen pb-28 text-[#f4efe4]"
      onContextMenu={(e) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('.allow-copy-link, input, textarea')) {
          e.preventDefault();
        }
      }}
      onCopy={(e) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('.allow-copy-link, input, textarea')) {
          e.preventDefault();
        }
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Fixed Studio / Phone Gallery Backdrop Layer at z-0 */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#080505]">
        {appearance.customBgDataUrl || currentBg.imageUrl ? (
          <>
            <img
              key={appearance.customBgDataUrl ? appearance.bgId : currentBg.id}
              src={appearance.customBgDataUrl || currentBg.imageUrl || ''}
              alt={currentBg.nameAr}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-all duration-500"
              style={{
                opacity: appearance.backdropBlur ? 0.68 : 0.88,
                filter: appearance.backdropBlur ? 'blur(16px)' : 'blur(0px)',
                transform: appearance.backdropBlur ? 'scale(1.06)' : 'scale(1)',
              }}
            />
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background: appearance.backdropBlur
                  ? 'linear-gradient(180deg, rgba(8,5,5,0.48), rgba(8,5,5,0.75))'
                  : 'linear-gradient(180deg, rgba(8,5,5,0.18), rgba(8,5,5,0.46))',
              }}
            />
          </>
        ) : (
          <div
            className="h-full w-full transition-all duration-500"
            style={{
              background: currentBg.gradient,
              filter: appearance.backdropBlur ? 'blur(14px)' : 'none',
            }}
          />
        )}
      </div>

      {/* 900,000 Candlepower Radial Spotlight Radiance Layer */}
      <div className="el-radiance-stage" />

      {/* Main Content Layer above backdrop (z-10) */}
      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <div className={`mx-auto w-full transition-all duration-300 ${containerWidthClass}`}>
          <TopBar
            isOnline={isOnline}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onOpenStudioPicker={() => setStudioPickerOpen(true)}
            onOpenAdmin={() => {
              if (adminToken) {
                setActiveTab('admin');
                refreshAdminOverview();
              } else {
                setLoginModalOpen(true);
              }
            }}
            onOpenNotifications={() => {
              setActiveTab('admin');
              setAdminSubTab('notifications');
            }}
            isAdminLoggedIn={Boolean(adminToken)}
            unreadNotifications={unreadCount}
          />
        </div>

        {/* Main Content Area */}
        <main
          className={`mx-auto w-full px-3 sm:px-5 pt-5 transition-all duration-300 ${containerWidthClass}`}
        >
          {/* SECTION 1: PROXIES */}
          {activeTab === 'proxies' && (
            <div key="tab-proxies" className="tab-panel-enter space-y-6">
              {/* Top Quick Summary Strip */}
              <div
                className={`grid gap-3.5 ${
                  displayMode === 'phone'
                    ? 'grid-cols-2'
                    : 'grid-cols-2 lg:grid-cols-4'
                }`}
              >
                <div className="el-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-display text-[10px] tracking-[0.14em] text-[#cbbca7] block uppercase ltr">
                      PROXIES TOTAL
                    </span>
                    <span className="text-[11px] font-bold text-[#cbbca7] block mt-0.5">عدد البروكسيات</span>
                    <strong className="font-display text-2xl font-extrabold text-[#fff6e3] tabular-nums">
                      {proxies.length}
                    </strong>
                  </div>
                  <LuxuryIcon variant="storage" tone="glass" size="md" />
                </div>

                <div className="el-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-display text-[10px] tracking-[0.14em] text-emerald-300/80 block uppercase ltr">
                      ONLINE NOW
                    </span>
                    <span className="text-[11px] font-bold text-[#cbbca7] block mt-0.5">الفعالة الآن</span>
                    <strong className="font-display text-2xl font-extrabold text-emerald-300 tabular-nums">
                      {stats.online || proxies.filter((p) => p.status === 'active').length}
                    </strong>
                  </div>
                  <LuxuryIcon variant="proxy" tone="emerald" size="md" />
                </div>

                <div className="el-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-display text-[10px] tracking-[0.14em] text-[var(--accent)] block uppercase ltr">
                      FASTEST PING
                    </span>
                    <span className="text-[11px] font-bold text-[#cbbca7] block mt-0.5">أسرع استجابة</span>
                    <strong className="el-gold-text font-display text-2xl font-extrabold ltr tabular-nums">
                      {fastestProxy?.ping != null ? `${fastestProxy.ping} ms` : '24 ms'}
                    </strong>
                  </div>
                  <LuxuryIcon variant="speed" tone="glass" size="md" />
                </div>

                <a
                  href={TELEGRAM_DEV_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="el-card rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent)]/60 transition-all"
                >
                  <div className="min-w-0">
                    <span className="font-display text-[10px] tracking-[0.14em] text-[var(--accent)] block uppercase ltr">
                      DEVELOPER
                    </span>
                    <span className="text-[11px] font-bold text-[#cbbca7] block mt-0.5">حساب المطور</span>
                    <strong className="el-gold-text font-display text-sm font-extrabold truncate block ltr mt-1">
                      {TELEGRAM_DEV_LABEL}
                    </strong>
                  </div>
                  <LuxuryIcon variant="send" tone="gold" size="md" />
                </a>
              </div>

              {/* Hero Network Command Card */}
              <div className="el-card rounded-3xl p-5 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[#cbbca7]">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 active-proxy-lamp" />
                      <span className="font-mono-tech text-[11px] text-emerald-300 tracking-wider">
                        ACTIVE MTProto GATEWAY
                      </span>
                    </div>
                    <span className="font-mono-tech text-[11px] text-[var(--accent-light)] border border-[var(--accent)]/35 bg-[var(--accent)]/12 px-3 py-1 rounded-xl ltr">
                      NODE: ONIXTETL-01 · {((appearance.luminanceLevel ?? 85) * 9000).toLocaleString()} cd
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="el-gold-text font-arabic-display text-2xl sm:text-3xl font-extrabold leading-tight">
                        بوابة ONIXTETL للبروكسيات
                      </h1>
                      <p className="mt-2.5 text-xs sm:text-sm text-[#e8dcc8] leading-relaxed max-w-2xl">
                        قائمة بروكسيات حية مرتبة تلقائياً من الأسرع إلى الأقل، مع دعم الاتصال المباشر عبر تيليجرام، مسح QR، ومشاركة NFC الفورية.
                      </p>
                    </div>

                    <div className="el-card-subtle shrink-0 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <div className="flex items-end gap-1 h-7">
                        {[40, 60, 75, 90, 100].map((h, i) => (
                          <span
                            key={i}
                            className="w-1.5 rounded-t bg-gradient-to-t from-emerald-500 to-amber-200"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#cbbca7]">جودة المسار</span>
                        <strong className="font-mono-tech text-xs text-emerald-300">OPTIMAL</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDirectConnect(fastestProxy)}
                    className="el-gold-btn flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-extrabold transition-transform active:scale-95 cursor-pointer"
                  >
                    <Zap className="h-4 w-4" />
                    <span>اتصال بأسرع بروكسي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenProxyDetails(fastestProxy)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent)]/10 py-3.5 px-4 text-xs font-bold text-[var(--accent-light)] hover:bg-[var(--accent)]/20 cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>QR & وضع NFC</span>
                  </button>

                  <a
                    href={TELEGRAM_DEV_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3.5 px-4 font-display text-xs font-bold text-[#f4efe4] hover:border-[var(--accent)]/45 hover:text-[var(--accent-light)] ltr"
                  >
                    <Send className="h-3.5 w-3.5 text-[var(--accent-light)]" />
                    <span>{TELEGRAM_DEV_LABEL}</span>
                    <ArrowUpLeft className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* COMPREHENSIVE INTERACTIVE REAL-PROXY 3D FLOW WINDOW */}
              <ProxyFlowWindow
                proxies={proxies}
                activeProxies={stats.online || proxies.filter((p) => p.status === 'active').length}
                totalProxies={proxies.length}
                accentHex={currentTheme.accent}
                luminanceFactor={(appearance.luminanceLevel ?? 85) / 100}
                onConnectProxy={handleDirectConnect}
                onInspectProxy={handleOpenProxyDetails}
              />

              {/* LIVE PROXY DIRECTORY */}
              <div className="el-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <LuxuryIcon variant="proxy" tone="gold" size="md" />
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="el-gold-text font-arabic-display text-base sm:text-lg font-extrabold">
                          قائمة البروكسيات الحية
                        </h2>
                        <span className="font-mono-tech text-xs font-bold text-[var(--accent-light)]">
                          ({displayedProxies.length})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#cbbca7]">
                        مرتبة من الأسرع استجابة إلى الأقل · {lastUpdated ? `آخر تحديث ${lastUpdated}` : 'جاري المزامنة'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl bg-black/45 p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setProxyFilter('all')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                          proxyFilter === 'all' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setProxyFilter('active')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                          proxyFilter === 'active' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
                        }`}
                      >
                        الفعالة فقط
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={loadPublicData}
                      disabled={loadingProxies}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#e8dcc8] hover:border-[var(--accent)]/45 cursor-pointer"
                      title="تحديث القائمة"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingProxies ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid gap-3.5 max-h-[600px] overflow-y-auto pl-1 ${
                    displayMode === 'phone'
                      ? 'grid-cols-1'
                      : displayMode === 'ipad'
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  }`}
                >
                  {displayedProxies.map((proxy, index) => {
                    const isActive = proxy.status === 'active';
                    const isFixed = Boolean(proxy.isFixed);

                    return (
                      <article
                        key={proxy.id}
                        onClick={() => handleOpenProxyDetails(proxy)}
                        className={`el-card-subtle group relative rounded-2xl p-4 transition-all hover:border-[var(--accent)]/50 cursor-pointer ${
                          isFixed ? 'border-[var(--accent)]/45' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                  isActive
                                    ? 'bg-emerald-400 active-proxy-lamp'
                                    : 'bg-rose-400'
                                }`}
                              />
                              <h3 className="font-arabic-display text-sm font-bold text-[#fff6e3] truncate">
                                {proxy.country_name || proxy.country || 'خادم بروكسي'}
                              </h3>
                            </div>
                            <div className="mt-1 font-mono-tech text-[11px] text-[#cbbca7] truncate ltr text-right">
                              {proxy.city || 'Global'} · {proxy.server}
                            </div>
                          </div>

                          <span
                            className={`font-mono-tech text-[11px] font-bold shrink-0 ${
                              isFixed
                                ? 'text-[var(--accent-light)]'
                                : isActive
                                ? 'text-emerald-300'
                                : 'text-rose-300'
                            }`}
                          >
                            {isFixed ? 'FIXED' : index === 0 && isActive ? 'FASTEST' : isActive ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>

                        <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-black/40 p-2 border border-white/5">
                            <span className="block text-[9px] text-[#cbbca7]">السرعة</span>
                            <strong className="font-mono-tech text-xs font-bold text-[var(--accent-light)] ltr tabular-nums">
                              {proxy.ping !== null ? `${proxy.ping} ms` : '—'}
                            </strong>
                          </div>
                          <div className="rounded-xl bg-black/40 p-2 border border-white/5">
                            <span className="block text-[9px] text-[#cbbca7]">الثبات</span>
                            <strong className="font-mono-tech text-xs font-bold text-emerald-300 ltr tabular-nums">
                              {proxy.uptime !== null ? `${proxy.uptime}%` : '99%'}
                            </strong>
                          </div>
                          <div className="rounded-xl bg-black/40 p-2 border border-white/5">
                            <span className="block text-[9px] text-[#cbbca7]">المنفذ</span>
                            <strong className="font-mono-tech text-xs font-bold text-[#fff6e3] ltr tabular-nums">
                              {proxy.port}
                            </strong>
                          </div>
                        </div>

                        <div
                          className="mt-3.5 flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleDirectConnect(proxy)}
                            disabled={proxy.blockedForCurrentVisitor || proxy.status === 'paused'}
                            className="el-gold-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition-transform active:scale-95 disabled:opacity-45 cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5" />
                            <span>اتصال تيليجرام</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenProxyDetails(proxy)}
                            title="تفاصيل و QR و NFC"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#e8dcc8] hover:border-[var(--accent)]/45 hover:text-[var(--accent-light)] cursor-pointer"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenProxyDetails(proxy)}
                            title="وضع NFC"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#e8dcc8] hover:border-[var(--accent)]/45 hover:text-[var(--accent-light)] cursor-pointer"
                          >
                            <Nfc className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Fixed Proxy Highlight Banner */}
                <div className="el-card-subtle rounded-2xl border border-[var(--accent)]/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <LuxuryIcon variant="shield" tone="gold" size="sm" />
                    <div>
                      <div className="text-xs font-bold text-[#fff6e3]">
                        البروكسي الثابت الرسمي متاح دائماً في نهاية القائمة
                      </div>
                      <div className="allow-copy-link font-mono-tech text-[10px] text-[#cbbca7] break-all ltr mt-0.5">
                        {FIXED_PROXY_ITEM.url}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDirectConnect(FIXED_PROXY_ITEM)}
                    className="el-gold-btn shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>تفعيل الثابت</span>
                  </button>
                </div>
              </div>

              {/* Speedometer & Live Signal Equalizer */}
              <SpeedometerGauge onToast={showToast} />

              {/* Official Developer Bar */}
              <div className="el-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LuxuryIcon variant="crown" tone="gold" size="md" />
                  <div>
                    <div className="el-gold-text font-display text-sm font-extrabold ltr">
                      {TELEGRAM_DEV_LABEL}
                    </div>
                    <div className="text-xs text-[#cbbca7]">
                      الحساب الرسمي للمطور على تيليجرام ({TELEGRAM_HANDLE})
                    </div>
                  </div>
                </div>

                <a
                  href={TELEGRAM_DEV_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="el-gold-btn flex items-center gap-2 rounded-xl px-5 py-2.5 font-display text-xs font-extrabold ltr"
                >
                  <span>فتح حساب {TELEGRAM_HANDLE}</span>
                  <ArrowUpLeft className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* SECTION 2: THEMES & STUDIO BACKDROPS */}
          {activeTab === 'themes' && (
            <div key="tab-themes" className="tab-panel-enter">
              <ThemesSection
                activeThemeId={appearance.themeId}
                onSelectTheme={(id) => {
                  setAppearance((prev) => ({ ...prev, themeId: id }));
                  showToast('تم تغيير سمة الألوان الفاخرة');
                }}
                activeBgId={appearance.bgId}
                customBgDataUrl={appearance.customBgDataUrl}
                customWallpapers={appearance.customWallpapers}
                onSelectBg={(id) => {
                  setAppearance((prev) => ({ ...prev, bgId: id, customBgDataUrl: null }));
                  showToast('تم تغيير خلفية الاستوديو بنجاح');
                }}
                onSelectCustomWallpaper={(wp) => {
                  setAppearance((prev) => ({
                    ...prev,
                    bgId: wp.id,
                    customBgDataUrl: wp.dataUrl,
                    customWallpapers: [
                      wp,
                      ...prev.customWallpapers.filter((item) => item.id !== wp.id),
                    ].slice(0, 12),
                  }));
                }}
                backdropBlur={appearance.backdropBlur}
                onToggleBackdropBlur={(blur) => {
                  setAppearance((prev) => ({ ...prev, backdropBlur: blur }));
                  showToast(blur ? 'تم تفعيل الخلفية الضبابية' : 'تم تفعيل الخلفية الظاهرة');
                }}
                cardStyle={appearance.cardStyle}
                onSelectCardStyle={(style) => {
                  setAppearance((prev) => ({ ...prev, cardStyle: style }));
                  showToast('تم تغيير قالب البطاقات الزجاجية');
                }}
                luminanceLevel={appearance.luminanceLevel ?? 85}
                onChangeLuminance={(level) => {
                  setAppearance((prev) => ({ ...prev, luminanceLevel: level }));
                }}
                displayMode={displayMode}
                onSelectDisplayMode={setDisplayMode}
                onToast={showToast}
              />
            </div>
          )}

          {/* SECTION 3: CONTACT (DISCORD WEBHOOK) */}
          {activeTab === 'contact' && (
            <div key="tab-contact" className="tab-panel-enter">
              <ContactSection visitorId={visitorId} onToast={showToast} />
            </div>
          )}

          {/* SECTION 4: MY PROFILE */}
          {activeTab === 'profile' && (
            <div key="tab-profile" className="tab-panel-enter">
              <ProfileSection
                totalProxies={proxies.length}
                activeProxies={stats.online || proxies.filter((p) => p.status === 'active').length}
                visitorId={visitorId}
                onToast={showToast}
              />
            </div>
          )}

          {/* SECTION 5: ADMIN COMMAND CENTER */}
          {activeTab === 'admin' && adminToken && (
            <div key="tab-admin" className="tab-panel-enter">
              <AdminDashboard
                token={adminToken}
                overview={adminOverview}
                loading={loadingAdmin}
                activeSubTab={adminSubTab}
                onSelectSubTab={setAdminSubTab}
                onRefresh={refreshAdminOverview}
                onLogout={() => {
                  setAdminToken(null);
                  sessionStorage.removeItem('onx44_admin_token');
                  setAdminOverview(null);
                  setActiveTab('proxies');
                  showToast('تم تسجيل الخروج من لوحة التحكم');
                }}
                onToast={showToast}
                accentHex={currentTheme.accent}
                displayMode={displayMode}
                onDisplayModeChange={setDisplayMode}
                onOpenThemes={() => setAdminSubTab('appearance')}
                appearance={appearance}
                onUpdateAppearance={setAppearance}
                onConnectProxy={handleDirectConnect}
                onInspectProxy={handleOpenProxyDetails}
              />
            </div>
          )}

          <footer className="mt-8 pb-6 text-center text-[11px] text-[#cbbca7]">
            <div className="el-gold-text font-luxury font-bold tracking-widest ltr">
              ONIXTETL · ONX44 APP PROXY
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Clock className="h-3 w-3" />
              <span className="font-display tracking-wider">PRIVATE MTProto NETWORK · 2026</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Bottom Dock */}
      <BottomDock
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'auto' });
        }}
        isAdminLoggedIn={Boolean(adminToken)}
        unreadNotifications={unreadCount}
      />

      {/* Quick Studio Backdrop Modal (when clicking Background button in TopBar) */}
      <StudioBackdropModal
        open={studioPickerOpen}
        onClose={() => setStudioPickerOpen(false)}
        activeBgId={appearance.bgId}
        customBgDataUrl={appearance.customBgDataUrl}
        customWallpapers={appearance.customWallpapers}
        backdropBlur={appearance.backdropBlur}
        onToggleBackdropBlur={(blur) =>
          setAppearance((prev) => ({ ...prev, backdropBlur: blur }))
        }
        onSelectBg={(id) =>
          setAppearance((prev) => ({ ...prev, bgId: id, customBgDataUrl: null }))
        }
        onSelectCustomWallpaper={(wp) =>
          setAppearance((prev) => ({
            ...prev,
            bgId: wp.id,
            customBgDataUrl: wp.dataUrl,
            customWallpapers: [
              wp,
              ...prev.customWallpapers.filter((item) => item.id !== wp.id),
            ].slice(0, 12),
          }))
        }
        onToast={showToast}
      />

      {/* Proxy Details / QR / NFC Modal */}
      <ProxyCardModal
        proxy={selectedProxy}
        onClose={() => setSelectedProxy(null)}
        onTrack={(action, proxy) => trackEvent(action, proxy)}
        onToast={showToast}
        onSimulateNfcReceive={() => triggerRandomNfcConnect(true)}
      />

      {/* NFC Auto-Connect Handshake Glass Modal (when ?nfc=random or NFC signal received) */}
      {nfcOverlayProxy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-lg"
          onClick={() => setNfcOverlayProxy(null)}
        >
          <div
            className="el-card relative w-full max-w-md rounded-3xl p-6 text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setNfcOverlayProxy(null)}
              className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#cbbca7] hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex justify-center">
              <LuxuryIcon variant="nfc" tone="gold" size="lg" />
            </div>

            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.2em] text-emerald-300 ltr">
                NFC RANDOM PROXY HANDSHAKE
              </div>
              <h3 className="el-gold-text mt-1 font-arabic-display text-lg font-extrabold">
                تم اختيار بروكسي سريع وصالح لك
              </h3>
              <p className="mt-1 text-xs text-[#e8dcc8]">
                {nfcOverlayProxy.country_name || nfcOverlayProxy.server} ·{' '}
                <span className="font-mono-tech ltr">
                  {nfcOverlayProxy.server}:{nfcOverlayProxy.port}
                </span>{' '}
                ({nfcOverlayProxy.ping ?? 24} ms)
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href={buildProxyTgLink(nfcOverlayProxy)}
                onClick={() => setTimeout(() => setNfcOverlayProxy(null), 600)}
                className="el-gold-btn flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold"
              >
                <Zap className="h-4 w-4" />
                <span>اتصال وتفعيل في تيليجرام الآن</span>
              </a>

              <a
                href={buildProxyWebLink(nfcOverlayProxy)}
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-bold text-stone-200 hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
                <span>فتح عبر رابط تيليجرام البديل</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(token) => {
          setAdminToken(token);
          sessionStorage.setItem('onx44_admin_token', token);
          setLoginModalOpen(false);
          setActiveTab('admin');
          showToast('تم التحقق من كلمة السر وفتح لوحة التحكم');
        }}
      />

      {/* Luxury Glass Toast Notification (never browser alert) */}
      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 w-[min(92vw,440px)] el-card rounded-2xl px-4 py-3 text-center text-xs font-bold text-[var(--accent-light)] shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

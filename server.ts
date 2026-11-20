import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const WORKER_BASE = 'https://prox.geg736yebj.workers.dev';
const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1543603322563330200/6iJFpnPCOsYGDeArxVpWVhrErAzd9UmuHWOL_-5CO0nXsNoLdj3rnBWRf2W7Gq6DJwCF';

const FIXED_PROXY = {
  id: 'onx-fixed-utkapay',
  server: 'utkapay.life',
  port: 443,
  secret: 'eec0ab2dc91cd75da14bf8bde752ca8222766473696e612e7275',
  url: 'tg://proxy?server=utkapay.life&port=443&secret=eec0ab2dc91cd75da14bf8bde752ca8222766473696e612e7275',
  country_name: 'البروكسي الثابت الرسمي — ONX44',
  country_code: 'ONX',
  city: 'Private Dedicated Gateway',
  ping: 24,
  uptime: 99.9,
  status: 'active',
  type: 'MTProto TLS',
  isFixed: true,
};

interface ProxyUsageState {
  proxyId: string;
  usesCount: number;
  qrCount: number;
  nfcCount: number;
  uniqueVisitors: string[];
  firstUsedAt: string | null;
  lastUsedAt: string | null;
  stoppedAt: string | null;
  totalActiveSeconds: number;
  pausedByAdmin: boolean;
}

interface VisitorHistoryEntry {
  id: string;
  action: string;
  proxyId?: string;
  proxyLabel?: string;
  timestamp: string;
}

interface VisitorState {
  visitorId: string;
  ip: string;
  locationLabel?: string;
  country?: string;
  city?: string;
  userAgent: string;
  firstSeenAt: string;
  lastSeenAt: string;
  totalEvents: number;
  proxiesUsed: string[];
  lastProxyId: string | null;
  blockedAll: boolean;
  blockedProxies: string[];
  history: VisitorHistoryEntry[];
}

interface NotificationState {
  id: string;
  type: 'connect' | 'inspect' | 'qr' | 'nfc' | 'contact' | 'block' | 'system';
  title: string;
  message: string;
  visitorId: string;
  visitorIp: string;
  proxyId?: string;
  proxyLabel?: string;
  deviceInfo?: string;
  createdAt: string;
  read: boolean;
}

interface CustomWallpaperState {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

interface AppearanceState {
  themeId: string;
  bgId: string;
  customBgDataUrl: string | null;
  backdropBlur: boolean;
  luminanceLevel: number;
  cardStyle: string;
  englishFont: string;
  arabicFont: string;
  fontColorId: string;
  customWallpapers: CustomWallpaperState[];
}

const DEFAULT_APPEARANCE_STATE: AppearanceState = {
  themeId: 'champagne',
  bgId: 'abyss-default',
  customBgDataUrl: null,
  backdropBlur: false,
  luminanceLevel: 85,
  cardStyle: 'frosted-gloss',
  englishFont: 'Syne',
  arabicFont: 'Alexandria',
  fontColorId: 'royal-ivory',
  customWallpapers: [],
};

interface StoreData {
  proxyUsage: Record<string, ProxyUsageState>;
  visitors: Record<string, VisitorState>;
  notifications: NotificationState[];
  totalConnections: number;
  qrScans: number;
  nfcTriggers: number;
  appearance: AppearanceState;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');
const ipGeoCache = new Map<string, { country: string; city: string; label: string }>();

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const visitors: Record<string, VisitorState> = parsed.visitors || {};
      for (const key of Object.keys(visitors)) {
        if (!Array.isArray(visitors[key].history)) {
          visitors[key].history = [];
        }
      }
      return {
        proxyUsage: parsed.proxyUsage || {},
        visitors,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        totalConnections: Number(parsed.totalConnections || 0),
        qrScans: Number(parsed.qrScans || 0),
        nfcTriggers: Number(parsed.nfcTriggers || 0),
        appearance: {
          ...DEFAULT_APPEARANCE_STATE,
          ...(parsed.appearance || {}),
          customWallpapers: Array.isArray(parsed.appearance?.customWallpapers)
            ? parsed.appearance.customWallpapers
            : [],
        },
      };
    }
  } catch (err) {
    console.error('Failed to load analytics store:', err);
  }
  return {
    proxyUsage: {},
    visitors: {},
    notifications: [],
    totalConnections: 0,
    qrScans: 0,
    nfcTriggers: 0,
    appearance: { ...DEFAULT_APPEARANCE_STATE },
  };
}

let store: StoreData = loadStore();

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save analytics store:', err);
  }
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

async function resolveGeoForIp(ip: string) {
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'شبكة محلية', city: 'Localhost', label: 'شبكة محلية / Local' };
  }
  const cached = ipGeoCache.get(ip);
  if (cached) return cached;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const geo = (await res.json()) as Record<string, unknown>;
      if (geo.success) {
        const country = String(geo.country || 'غير محدد');
        const city = String(geo.city || geo.region || '');
        const label = [country, city].filter(Boolean).join(' · ');
        const val = { country, city, label };
        ipGeoCache.set(ip, val);
        return val;
      }
    }
  } catch {
    // fallback quietly
  }
  return { country: 'غير محدد', city: '', label: 'موقع الشبكة العامة' };
}

function ensureProxyUsage(proxyId: string): ProxyUsageState {
  if (!store.proxyUsage[proxyId]) {
    store.proxyUsage[proxyId] = {
      proxyId,
      usesCount: 0,
      qrCount: 0,
      nfcCount: 0,
      uniqueVisitors: [],
      firstUsedAt: null,
      lastUsedAt: null,
      stoppedAt: null,
      totalActiveSeconds: 0,
      pausedByAdmin: false,
    };
  }
  return store.proxyUsage[proxyId];
}

function ensureVisitor(visitorId: string, ip: string, userAgent: string): VisitorState {
  const now = new Date().toISOString();
  if (!store.visitors[visitorId]) {
    store.visitors[visitorId] = {
      visitorId,
      ip,
      locationLabel: 'جاري تحديد الموقع...',
      userAgent,
      firstSeenAt: now,
      lastSeenAt: now,
      totalEvents: 0,
      proxiesUsed: [],
      lastProxyId: null,
      blockedAll: false,
      blockedProxies: [],
      history: [],
    };
  } else {
    store.visitors[visitorId].ip = ip;
    store.visitors[visitorId].userAgent = userAgent;
    store.visitors[visitorId].lastSeenAt = now;
    if (!Array.isArray(store.visitors[visitorId].history)) {
      store.visitors[visitorId].history = [];
    }
  }
  return store.visitors[visitorId];
}

function addNotification(entry: Omit<NotificationState, 'id' | 'createdAt' | 'read'>) {
  const item: NotificationState = {
    ...entry,
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  store.notifications.unshift(item);
  if (store.notifications.length > 200) {
    store.notifications = store.notifications.slice(0, 200);
  }
  return item;
}

function unwrapProxyArray(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    const candidate = obj.proxies ?? obj.data ?? obj.results ?? obj.items ?? obj.nodes;
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
    if (candidate && typeof candidate === 'object') {
      return Object.values(candidate as Record<string, unknown>).filter(
        (v): v is Record<string, unknown> => Boolean(v && typeof v === 'object')
      );
    }
  }
  return [];
}

function buildProxyLink(p: Record<string, unknown>): string {
  const rawUrl = typeof p.url === 'string' ? p.url : typeof p.link === 'string' ? p.link : '';
  if (rawUrl && /^tg:\/\/proxy\?/i.test(rawUrl)) return rawUrl;
  if (p.server && p.port && p.secret) {
    const params = new URLSearchParams({
      server: String(p.server),
      port: String(p.port),
      secret: String(p.secret),
    });
    return `tg://proxy?${params.toString()}`;
  }
  return '';
}

function normalizeProxy(p: Record<string, unknown>, visitorId?: string) {
  const id = String(p.id ?? `${p.server ?? 'proxy'}:${p.port ?? 443}`);
  const usage = ensureProxyUsage(id);
  const visitor = visitorId ? store.visitors[visitorId] : undefined;
  const blockedForCurrentVisitor = Boolean(
    visitor && (visitor.blockedAll || visitor.blockedProxies.includes(id))
  );
  const rawStatus = String(p.status ?? p.state ?? 'unknown').toLowerCase();
  const isUp =
    !usage.pausedByAdmin &&
    p.active !== false &&
    ['active', 'online', 'working', 'up', 'alive', 'ok'].includes(rawStatus);

  const pingNum = p.ping != null && Number.isFinite(Number(p.ping)) ? Number(p.ping) : null;
  const uptimeNum = p.uptime != null && Number.isFinite(Number(p.uptime)) ? Number(p.uptime) : null;

  return {
    id,
    server: String(p.server ?? ''),
    port: Number(p.port ?? 443),
    secret: p.secret ? String(p.secret) : undefined,
    url: buildProxyLink(p),
    country: p.country ? String(p.country) : undefined,
    country_name: p.country_name
      ? String(p.country_name)
      : p.country
      ? String(p.country)
      : p.country_code
      ? String(p.country_code)
      : 'خادم عالمي',
    country_code: p.country_code ? String(p.country_code) : undefined,
    city: p.city ? String(p.city) : undefined,
    flag: p.flag ? String(p.flag) : undefined,
    ping: pingNum,
    uptime: uptimeNum,
    status: usage.pausedByAdmin ? 'paused' : isUp ? 'active' : rawStatus,
    type: p.type ? String(p.type) : 'MTProto',
    latitude: p.latitude != null ? Number(p.latitude) : p.lat != null ? Number(p.lat) : null,
    longitude: p.longitude != null ? Number(p.longitude) : p.lon != null ? Number(p.lon) : null,
    isFixed: Boolean(p.isFixed),
    usage,
    blockedForCurrentVisitor,
  };
}

async function fetchWorkerJson(pathname: string, options: RequestInit = {}) {
  const response = await fetch(`${WORKER_BASE}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: response.ok, status: response.status, json };
}

async function verifyAdminToken(req: express.Request): Promise<{ valid: boolean; overview?: Record<string, unknown> }> {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return { valid: false };
  }
  try {
    const res = await fetchWorkerJson('/admin/overview', {
      method: 'GET',
      headers: { Authorization: auth },
    });
    if (!res.ok) return { valid: false };
    return { valid: true, overview: res.json };
  } catch {
    return { valid: false };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/appearance', (_req, res) => {
    res.json({ success: true, appearance: store.appearance });
  });

  app.get('/api/proxies', async (req, res) => {
    try {
      const visitorId = typeof req.query.visitorId === 'string' ? req.query.visitorId : undefined;
      const page = req.query.page || '1';
      const per = req.query.per || '60';
      const sort = req.query.sort || 'ping';
      const status = req.query.status || 'all';
      const targetFor = req.query.for || 'IQ';

      const qs = new URLSearchParams({
        page: String(page),
        per: String(per),
        sort: String(sort),
        for: String(targetFor),
      });
      if (status && status !== 'all') {
        qs.set('status', String(status));
      }

      const workerRes = await fetchWorkerJson(`/proxies?${qs.toString()}`);
      const rawList = workerRes.ok ? unwrapProxyArray(workerRes.json) : [];
      const map = new Map<string, ReturnType<typeof normalizeProxy>>();

      for (const item of rawList) {
        const normalized = normalizeProxy(item, visitorId);
        map.set(normalized.id, normalized);
      }

      const dynamicSorted = [...map.values()].sort((a, b) => {
        const aActive = a.status === 'active' ? 1 : 0;
        const bActive = b.status === 'active' ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        const ap = a.ping != null ? a.ping : 999999;
        const bp = b.ping != null ? b.ping : 999999;
        return ap - bp;
      });

      const fixedNormalized = normalizeProxy(FIXED_PROXY, visitorId);
      const combined = [...dynamicSorted.filter((p) => p.id !== fixedNormalized.id), fixedNormalized];

      const workerPages = Number(
        (workerRes.json as Record<string, unknown>).pages ||
          ((workerRes.json as Record<string, unknown>).pagination as Record<string, unknown> | undefined)?.pages ||
          1
      );

      res.json({
        success: true,
        proxies: combined,
        pages: workerPages,
        workerConnected: workerRes.ok,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const visitorId = typeof req.query.visitorId === 'string' ? req.query.visitorId : undefined;
      res.status(200).json({
        success: true,
        proxies: [normalizeProxy(FIXED_PROXY, visitorId)],
        pages: 1,
        workerConnected: false,
        error: String(error),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  app.get('/api/stats', async (_req, res) => {
    try {
      const workerRes = await fetchWorkerJson('/stats');
      const raw = (workerRes.json.stats || workerRes.json.data || workerRes.json) as Record<string, unknown>;
      const online = Number(raw.online ?? raw.active ?? 0);
      const dead = Number(raw.dead ?? raw.inactive ?? 0);
      const total = Number(raw.total ?? online + dead);

      res.json({
        success: true,
        stats: {
          online,
          dead,
          total,
          trackedUsers: Object.keys(store.visitors).length,
          totalConnections: store.totalConnections,
        },
        workerConnected: workerRes.ok,
      });
    } catch {
      res.json({
        success: true,
        stats: {
          online: 1,
          dead: 0,
          total: 1,
          trackedUsers: Object.keys(store.visitors).length,
          totalConnections: store.totalConnections,
        },
        workerConnected: false,
      });
    }
  });

  app.post('/api/track', async (req, res) => {
    const ip = getClientIp(req);
    const userAgent = String(req.headers['user-agent'] || 'Unknown Device');
    const {
      visitorId = 'anon',
      action = 'inspect',
      proxyId,
      proxyLabel,
      durationSeconds,
    } = req.body || {};

    const vId = String(visitorId).slice(0, 80);
    const isNewVisitor = !store.visitors[vId];
    const visitor = ensureVisitor(vId, ip, userAgent);
    visitor.totalEvents += 1;

    // Resolve IP location asynchronously/quickly
    if (!visitor.country || visitor.locationLabel === 'جاري تحديد الموقع...') {
      const geo = await resolveGeoForIp(ip);
      visitor.country = geo.country;
      visitor.city = geo.city;
      visitor.locationLabel = geo.label;
    }

    const now = new Date().toISOString();

    if (isNewVisitor) {
      visitor.history.unshift({
        id: `hst_${Date.now()}_visit`,
        action: 'دخول جديد للموقع',
        timestamp: now,
      });
      addNotification({
        type: 'system',
        title: 'دخول مستخدم جديد',
        message: `دخل زائر جديد (${vId}) من ${visitor.locationLabel || ip}`,
        visitorId: vId,
        visitorIp: ip,
        deviceInfo: userAgent.slice(0, 90),
      });
    }

    if (proxyId) {
      const pId = String(proxyId);
      const usage = ensureProxyUsage(pId);

      if (action !== 'visit' && action !== 'session_end') {
        if (usage.pausedByAdmin) {
          res.status(403).json({
            success: false,
            blocked: true,
            reason: 'تم إيقاف هذا البروكسي مؤقتاً من قبل المسؤول.',
          });
          return;
        }
        if (visitor.blockedAll || visitor.blockedProxies.includes(pId)) {
          res.status(403).json({
            success: false,
            blocked: true,
            reason: 'تم تقييد وصولك لهذا البروكسي من قبل إدارة الشبكة.',
          });
          return;
        }
      }

      if (!usage.firstUsedAt) usage.firstUsedAt = now;
      usage.lastUsedAt = now;
      if (!usage.uniqueVisitors.includes(vId)) {
        usage.uniqueVisitors.push(vId);
      }
      if (!visitor.proxiesUsed.includes(pId)) {
        visitor.proxiesUsed.push(pId);
      }
      visitor.lastProxyId = pId;

      const label = proxyLabel ? String(proxyLabel) : pId;
      const actionLabels: Record<string, string> = {
        inspect: 'استعراض تفاصيل البروكسي',
        connect: 'اتصال مباشر بتيليجرام',
        qr: 'عرض رمز QR',
        nfc_share: 'مشاركة عبر NFC',
        nfc_connect: 'استلام واتصال عبر NFC',
        session_end: 'إنهاء الجلسة',
      };

      visitor.history.unshift({
        id: `hst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        action: actionLabels[String(action)] || String(action),
        proxyId: pId,
        proxyLabel: label,
        timestamp: now,
      });
      if (visitor.history.length > 60) {
        visitor.history = visitor.history.slice(0, 60);
      }

      if (action === 'connect' || action === 'nfc_connect') {
        usage.usesCount += 1;
        store.totalConnections += 1;
      }
      if (action === 'qr') {
        usage.qrCount += 1;
        usage.usesCount += 1;
        store.qrScans += 1;
        store.totalConnections += 1;
      }
      if (action === 'nfc_share' || action === 'nfc_connect') {
        usage.nfcCount += 1;
        store.nfcTriggers += 1;
      }
      if (action === 'session_end') {
        usage.stoppedAt = now;
        const addSec = Number(durationSeconds || 0);
        if (Number.isFinite(addSec) && addSec > 0 && addSec < 86400) {
          usage.totalActiveSeconds += Math.round(addSec);
        }
      }

      const actionMap: Record<string, { type: NotificationState['type']; title: string; msg: string }> = {
        inspect: {
          type: 'inspect',
          title: 'استعراض تفاصيل بروكسي',
          msg: `قام المستخدم ${vId.slice(0, 12)} بفتح تفاصيل ${label}`,
        },
        connect: {
          type: 'connect',
          title: 'اتصال مباشر عبر Telegram',
          msg: `بدأ المستخدم ${vId.slice(0, 12)} الاتصال بالبروكسي ${label}`,
        },
        qr: {
          type: 'qr',
          title: 'عرض / مسح رمز QR',
          msg: `تم توليد رمز QR للبروكسي ${label} بواسطة ${vId.slice(0, 12)}`,
        },
        nfc_share: {
          type: 'nfc',
          title: 'تفعيل وضع نقل NFC',
          msg: `قام ${vId.slice(0, 12)} بتفعيل مشاركة NFC عبر ${label}`,
        },
        nfc_connect: {
          type: 'nfc',
          title: 'اتصال تلقائي عبر NFC',
          msg: `توجه هاتف جديد عبر NFC وتم اختيار ${label} تلقائياً`,
        },
      };

      if (actionMap[action]) {
        const meta = actionMap[action];
        addNotification({
          type: meta.type,
          title: meta.title,
          message: meta.msg,
          visitorId: vId,
          visitorIp: ip,
          proxyId: pId,
          proxyLabel: label,
          deviceInfo: userAgent.slice(0, 90),
        });
      }
    }

    saveStore();
    res.json({ success: true, allowed: true });
  });

  app.post('/api/contact', async (req, res) => {
    const ip = getClientIp(req);
    const userAgent = String(req.headers['user-agent'] || 'Unknown');
    const name = String(req.body?.name || '').trim();
    const message = String(req.body?.message || '').trim();
    const visitorId = String(req.body?.visitorId || 'guest').slice(0, 80);

    if (!name || name.length < 2 || !message || message.length < 2) {
      res.status(400).json({
        success: false,
        error: 'يرجى كتابة الاسم والرسالة بشكل صحيح.',
      });
      return;
    }

    try {
      const embedPayload = {
        username: 'ONIXTETL · ONX44 PROXY BOT',
        embeds: [
          {
            title: 'رسالة تواصل جديدة من بوابة ONX44 PROXY',
            color: 0xd8b878,
            fields: [
              { name: 'الاسم', value: name.slice(0, 120), inline: true },
              { name: 'معرّف الزائر', value: visitorId, inline: true },
              { name: 'الرسالة', value: message.slice(0, 1800), inline: false },
              { name: 'العنوان / الجهاز', value: `${ip} · ${userAgent.slice(0, 80)}`, inline: false },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'ONIXTETL-ONX44APP-PROXY' },
          },
        ],
      };

      const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedPayload),
        signal: AbortSignal.timeout(12000),
      });

      if (!discordRes.ok) {
        const errText = await discordRes.text().catch(() => '');
        res.status(502).json({
          success: false,
          error: `تعذر إرسال الرسالة إلى بوت ديسكورد (${discordRes.status}). ${errText.slice(0, 100)}`,
        });
        return;
      }

      addNotification({
        type: 'contact',
        title: 'رسالة تواصل جديدة (Discord)',
        message: `أرسل "${name}" رسالة: ${message.slice(0, 90)}${message.length > 90 ? '...' : ''}`,
        visitorId,
        visitorIp: ip,
        deviceInfo: userAgent.slice(0, 80),
      });
      saveStore();

      res.json({ success: true, message: 'تم إرسال رسالتك إلى المطور عبر ديسكورد بنجاح.' });
    } catch (error) {
      res.status(502).json({
        success: false,
        error: 'حدث خطأ أثناء الاتصال بخادم ديسكورد.',
        details: String(error),
      });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const password = String(req.body?.password || '');
      const workerRes = await fetchWorkerJson('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      res.status(workerRes.status).json(workerRes.json);
    } catch (error) {
      res.status(502).json({
        success: false,
        error: 'تعذر الاتصال بخادم التحقق Cloudflare Worker',
        details: String(error),
      });
    }
  });

  app.get('/api/admin/overview', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid || !authCheck.overview) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const workerData = authCheck.overview;
    const rawStats = (workerData.stats || workerData.overview || {}) as Record<string, unknown>;
    const rawProxies = unwrapProxyArray(workerData.proxies);
    const map = new Map<string, ReturnType<typeof normalizeProxy>>();
    for (const item of rawProxies) {
      const norm = normalizeProxy(item);
      map.set(norm.id, norm);
    }
    const fixedNorm = normalizeProxy(FIXED_PROXY);
    map.set(fixedNorm.id, fixedNorm);

    const allProxies = [...map.values()].sort((a, b) => {
      const aUp = a.status === 'active' ? 1 : 0;
      const bUp = b.status === 'active' ? 1 : 0;
      if (bUp !== aUp) return bUp - aUp;
      return (a.ping ?? 999999) - (b.ping ?? 999999);
    });

    const activeCount = allProxies.filter((p) => p.status === 'active').length;
    const totalCount = Number(rawStats.total ?? rawStats.total_proxies ?? allProxies.length);
    const inactiveCount = Math.max(0, totalCount - activeCount);
    const unreadNotifications = store.notifications.filter((n) => !n.read).length;

    res.json({
      success: true,
      stats: {
        total_proxies: totalCount,
        active_proxies: activeCount,
        inactive_proxies: inactiveCount,
        total_users: Object.keys(store.visitors).length,
        total_connections: store.totalConnections,
        qr_scans: store.qrScans,
        nfc_triggers: store.nfcTriggers,
        unread_notifications: unreadNotifications,
      },
      proxies: allProxies,
      visitors: Object.values(store.visitors).sort(
        (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
      ),
      notifications: store.notifications,
      updatedAt: new Date().toISOString(),
      workerSources: (workerData.data_sources as { stats: boolean; proxies: boolean }) || {
        stats: true,
        proxies: true,
      },
    });
  });

  app.post('/api/admin/proxy/toggle', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const proxyId = String(req.body?.proxyId || '');
    const paused = Boolean(req.body?.paused);
    if (!proxyId) {
      res.status(400).json({ success: false, error: 'proxyId required' });
      return;
    }
    const usage = ensureProxyUsage(proxyId);
    usage.pausedByAdmin = paused;
    if (paused) {
      usage.stoppedAt = new Date().toISOString();
    }
    addNotification({
      type: 'system',
      title: paused ? 'إيقاف بروكسي من الإدارة' : 'إعادة تشغيل بروكسي',
      message: `${paused ? 'تم إيقاف' : 'تم تفعيل'} البروكسي ${proxyId} من لوحة التحكم`,
      visitorId: 'ADMIN',
      visitorIp: getClientIp(req),
      proxyId,
      proxyLabel: proxyId,
    });
    saveStore();
    res.json({ success: true, usage });
  });

  app.post('/api/admin/block', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const visitorId = String(req.body?.visitorId || '');
    const proxyId = String(req.body?.proxyId || 'ALL');
    const blocked = Boolean(req.body?.blocked);
    if (!visitorId || !store.visitors[visitorId]) {
      res.status(404).json({ success: false, error: 'المستخدم غير موجود في السجل' });
      return;
    }
    const visitor = store.visitors[visitorId];
    if (proxyId === 'ALL') {
      visitor.blockedAll = blocked;
    } else {
      if (blocked && !visitor.blockedProxies.includes(proxyId)) {
        visitor.blockedProxies.push(proxyId);
      } else if (!blocked) {
        visitor.blockedProxies = visitor.blockedProxies.filter((id) => id !== proxyId);
      }
    }

    addNotification({
      type: 'block',
      title: blocked ? 'حظر مستخدم من بروكسي' : 'رفع الحظر عن مستخدم',
      message: `${blocked ? 'تم منع' : 'تم السماح لـ'} ${visitorId.slice(0, 12)} على ${proxyId === 'ALL' ? 'جميع البروكسيات' : proxyId}`,
      visitorId,
      visitorIp: visitor.ip,
      proxyId,
    });
    saveStore();
    res.json({ success: true, visitor });
  });

  // Delete a visitor/user record completely from the system
  app.delete('/api/admin/visitors/:visitorId', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const visitorId = decodeURIComponent(String(req.params.visitorId || ''));
    if (!visitorId || !store.visitors[visitorId]) {
      res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
      return;
    }
    const deleted = store.visitors[visitorId];
    delete store.visitors[visitorId];

    // Also remove visitorId from proxyUsage uniqueVisitors
    for (const usage of Object.values(store.proxyUsage)) {
      usage.uniqueVisitors = usage.uniqueVisitors.filter((id) => id !== visitorId);
    }

    addNotification({
      type: 'system',
      title: 'حذف مستخدم من السجل',
      message: `تم حذف سجل المستخدم ${visitorId} (${deleted.ip}) نهائياً بواسطة الإدارة`,
      visitorId: 'ADMIN',
      visitorIp: getClientIp(req),
    });
    saveStore();
    res.json({ success: true });
  });

  app.post('/api/admin/notifications/read', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    store.notifications.forEach((n) => {
      n.read = true;
    });
    saveStore();
    res.json({ success: true, unread: 0 });
  });

  app.post('/api/admin/appearance', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const incoming = req.body || {};
    const prev = store.appearance || { ...DEFAULT_APPEARANCE_STATE };

    let nextWallpapers = Array.isArray(incoming.customWallpapers)
      ? incoming.customWallpapers.slice(0, 12)
      : prev.customWallpapers;

    if (incoming.newWallpaper && typeof incoming.newWallpaper?.dataUrl === 'string') {
      const wp: CustomWallpaperState = {
        id: String(incoming.newWallpaper.id || `wp_${Date.now()}`),
        name: String(incoming.newWallpaper.name || 'خلفية مخصصة من الهاتف').slice(0, 80),
        dataUrl: incoming.newWallpaper.dataUrl,
        createdAt: new Date().toISOString(),
      };
      nextWallpapers = [wp, ...nextWallpapers.filter((item: CustomWallpaperState) => item.id !== wp.id)].slice(0, 12);
    }

    store.appearance = {
      themeId: String(incoming.themeId ?? prev.themeId),
      bgId: String(incoming.bgId ?? prev.bgId),
      customBgDataUrl:
        incoming.customBgDataUrl === null
          ? null
          : typeof incoming.customBgDataUrl === 'string'
          ? incoming.customBgDataUrl
          : prev.customBgDataUrl,
      backdropBlur:
        typeof incoming.backdropBlur === 'boolean' ? incoming.backdropBlur : prev.backdropBlur,
      luminanceLevel:
        typeof incoming.luminanceLevel === 'number' && Number.isFinite(incoming.luminanceLevel)
          ? Math.max(10, Math.min(100, Math.round(incoming.luminanceLevel)))
          : prev.luminanceLevel ?? 85,
      cardStyle: String(incoming.cardStyle ?? prev.cardStyle),
      englishFont: String(incoming.englishFont ?? prev.englishFont),
      arabicFont: String(incoming.arabicFont ?? prev.arabicFont),
      fontColorId: String(incoming.fontColorId ?? prev.fontColorId),
      customWallpapers: nextWallpapers,
    };

    saveStore();
    res.json({ success: true, appearance: store.appearance });
  });

  app.delete('/api/admin/appearance/wallpaper/:id', async (req, res) => {
    const authCheck = await verifyAdminToken(req);
    if (!authCheck.valid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const wpId = decodeURIComponent(String(req.params.id || ''));
    const removed = store.appearance.customWallpapers.find((w) => w.id === wpId);
    store.appearance.customWallpapers = store.appearance.customWallpapers.filter(
      (w) => w.id !== wpId
    );
    if (removed && store.appearance.customBgDataUrl === removed.dataUrl) {
      store.appearance.customBgDataUrl = null;
      store.appearance.bgId = 'abyss-default';
    }
    saveStore();
    res.json({ success: true, appearance: store.appearance });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ONIXTETL ONX44 PROXY Server listening on http://localhost:${PORT}`);
  });
}

startServer();

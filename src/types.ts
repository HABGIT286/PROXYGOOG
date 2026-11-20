export type PublicTab = 'proxies' | 'themes' | 'contact' | 'profile';
export type AdminSubTab = 'overview' | 'proxies' | 'users' | 'notifications' | 'appearance';
export type DisplayMode = 'desktop' | 'ipad' | 'phone';

export type CardGlassStyle =
  | 'frosted-gloss'
  | 'crystal-polished'
  | 'tinted-glass'
  | 'obsidian-matte'
  | 'liquid-prism';

export interface CustomWallpaper {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export interface SiteAppearance {
  themeId: string;
  bgId: string;
  customBgDataUrl: string | null;
  backdropBlur: boolean;
  luminanceLevel: number;
  cardStyle: CardGlassStyle;
  englishFont: string;
  arabicFont: string;
  fontColorId: string;
  customWallpapers: CustomWallpaper[];
}

export interface FontOption {
  id: string;
  name: string;
  labelAr: string;
  family: string;
  sample: string;
  styleTag: string;
}

export interface GlassCardPreset {
  id: CardGlassStyle;
  nameAr: string;
  nameEn: string;
  desc: string;
}

export interface FontColorPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  titleColor: string;
  bodyColor: string;
  mutedColor: string;
  glowColor: string;
}

export interface ProxyUsageRecord {
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

export interface ProxyItem {
  id: string;
  server: string;
  port: number;
  secret?: string;
  url?: string;
  country?: string;
  country_name?: string;
  country_code?: string;
  city?: string;
  flag?: string;
  ping: number | null;
  uptime: number | null;
  status: string;
  type?: string;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lon?: number | null;
  isFixed?: boolean;
  usage?: ProxyUsageRecord;
  blockedForCurrentVisitor?: boolean;
}

export interface ProxyStats {
  online: number;
  dead: number;
  total: number;
  trackedUsers: number;
  totalConnections: number;
}

export interface AdminNotification {
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

export interface VisitorHistoryEntry {
  id: string;
  action: string;
  proxyId?: string;
  proxyLabel?: string;
  timestamp: string;
}

export interface VisitorRecord {
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

export interface AdminOverviewData {
  stats: {
    total_proxies: number;
    active_proxies: number;
    inactive_proxies: number;
    total_users: number;
    total_connections: number;
    qr_scans: number;
    nfc_triggers: number;
    unread_notifications: number;
  };
  proxies: ProxyItem[];
  visitors: VisitorRecord[];
  notifications: AdminNotification[];
  updatedAt: string;
  workerSources: {
    stats: boolean;
    proxies: boolean;
  };
}

export interface StudioTheme {
  id: string;
  name: string;
  nameAr: string;
  accent: string;
  accent2: string;
  accentLight: string;
  glow: string;
}

export interface StudioBackground {
  id: string;
  name: string;
  nameAr: string;
  subtitle: string;
  imageUrl: string | null;
  gradient: string;
}

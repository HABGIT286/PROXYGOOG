import {
  FontColorPreset,
  FontOption,
  GlassCardPreset,
  ProxyItem,
  SiteAppearance,
  StudioBackground,
  StudioTheme,
} from './types';

export const WORKER_BASE_URL = 'https://prox.geg736yebj.workers.dev';
export const CLOUDFLARE_ACCOUNT_ID = '43c090c6cdd1011516c6d0f199f50901';

export const FIXED_PROXY_URL =
  'tg://proxy?server=utkapay.life&port=443&secret=eec0ab2dc91cd75da14bf8bde752ca8222766473696e612e7275';

export const FIXED_PROXY_WEB_URL =
  'https://t.me/proxy?server=utkapay.life&port=443&secret=eec0ab2dc91cd75da14bf8bde752ca8222766473696e612e7275';

export const FIXED_PROXY_ITEM: ProxyItem = {
  id: 'onx-fixed-utkapay',
  server: 'utkapay.life',
  port: 443,
  secret: 'eec0ab2dc91cd75da14bf8bde752ca8222766473696e612e7275',
  url: FIXED_PROXY_URL,
  country_name: 'البروكسي الثابت الرسمي — ONX44',
  country_code: 'ONX',
  city: 'Private Dedicated Gateway',
  ping: 24,
  uptime: 99.9,
  status: 'active',
  type: 'MTProto TLS',
  isFixed: true,
};

export const TELEGRAM_DEV_URL = 'https://t.me/ONX44';
export const TELEGRAM_DEV_DEEP_URL = 'tg://resolve?domain=ONX44';
export const TELEGRAM_DEV_LABEL = 'DEV-LELE-PROXY-';
export const TELEGRAM_HANDLE = '@ONX44';

export const PROFILE_CARD_NAME = 'ONIXTETL-ONX44APP-PROXY';

// 10 Luxury Metallic & Crystal Themes
export const STUDIO_THEMES: StudioTheme[] = [
  {
    id: 'champagne',
    name: 'Royal Champagne',
    nameAr: 'الشامبين الملكي',
    accent: '#e0be78',
    accent2: '#a87e3e',
    accentLight: '#fae7be',
    glow: 'rgba(224, 190, 120, 0.34)',
  },
  {
    id: 'obsidian-silver',
    name: 'Crystal Platinum',
    nameAr: 'البلاتين الكريستالي',
    accent: '#d6dee8',
    accent2: '#7a8799',
    accentLight: '#f8fafc',
    glow: 'rgba(214, 222, 232, 0.28)',
  },
  {
    id: 'emerald-pro',
    name: 'Emerald Fiber',
    nameAr: 'الزمرد السيبراني',
    accent: '#34d399',
    accent2: '#059669',
    accentLight: '#a7f3d0',
    glow: 'rgba(52, 211, 153, 0.28)',
  },
  {
    id: 'crimson-abyss',
    name: 'Abyss Crimson',
    nameAr: 'العنابي الإمبراطوري',
    accent: '#e88b76',
    accent2: '#9a3628',
    accentLight: '#fde0d4',
    glow: 'rgba(232, 139, 118, 0.3)',
  },
  {
    id: 'sapphire-noc',
    name: 'Imperial Sapphire',
    nameAr: 'الياقوت الأزرق',
    accent: '#7cc0ff',
    accent2: '#2e6bb2',
    accentLight: '#d3ebff',
    glow: 'rgba(124, 192, 255, 0.28)',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold Silk',
    nameAr: 'الذهب الوردي',
    accent: '#e8b4b8',
    accent2: '#a6626a',
    accentLight: '#fbe7e9',
    glow: 'rgba(232, 180, 184, 0.3)',
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    nameAr: 'الجمشت الملكي',
    accent: '#c09cff',
    accent2: '#7045ba',
    accentLight: '#eae0ff',
    glow: 'rgba(192, 156, 255, 0.28)',
  },
  {
    id: 'titanium-cyan',
    name: 'Titanium Cyan',
    nameAr: 'السيان التيتانيوم',
    accent: '#5eead4',
    accent2: '#0f766e',
    accentLight: '#ccfbf1',
    glow: 'rgba(94, 234, 212, 0.28)',
  },
  {
    id: 'velvet-bronze',
    name: 'Velvet Bronze',
    nameAr: 'البرونز المخملي',
    accent: '#dca16a',
    accent2: '#8c5124',
    accentLight: '#f9dfc2',
    glow: 'rgba(220, 161, 106, 0.3)',
  },
  {
    id: 'midnight-jade',
    name: 'Midnight Jade',
    nameAr: 'اليشم الداكن',
    accent: '#86efac',
    accent2: '#15803d',
    accentLight: '#dcfce7',
    glow: 'rgba(134, 239, 172, 0.26)',
  },
];

// 10 Avant-Garde, Sculpted & Haute-Luxury English Fonts (Distinctive Non-Generic)
export const ENGLISH_FONTS: FontOption[] = [
  {
    id: 'Cinzel Decorative',
    name: 'Cinzel Decorative',
    labelAr: 'سينزل الإمبراطوري',
    family: '"Cinzel Decorative", "Alexandria", serif',
    sample: 'ONIXTETL',
    styleTag: 'Imperial Sculpted',
  },
  {
    id: 'Syne',
    name: 'Syne',
    labelAr: 'ساين المعماري',
    family: '"Syne", "Alexandria", sans-serif',
    sample: 'ONX44 PRO',
    styleTag: 'Avant-Garde',
  },
  {
    id: 'Orbitron',
    name: 'Orbitron',
    labelAr: 'أوربيترون المستقبلي',
    family: '"Orbitron", "Alexandria", sans-serif',
    sample: 'CYBER NODE',
    styleTag: 'Sci-Fi Precision',
  },
  {
    id: 'Michroma',
    name: 'Michroma',
    labelAr: 'ميكروما العريض',
    family: '"Michroma", "Alexandria", sans-serif',
    sample: 'FIBER NOC',
    styleTag: 'Wide Telemetry',
  },
  {
    id: 'Cormorant SC',
    name: 'Cormorant SC',
    labelAr: 'كورمورانت الملكي',
    family: '"Cormorant SC", "Alexandria", serif',
    sample: 'SOVEREIGN',
    styleTag: 'Royal Engraving',
  },
  {
    id: 'Bodoni Moda',
    name: 'Bodoni Moda',
    labelAr: 'بودوني الراقي',
    family: '"Bodoni Moda", "Alexandria", serif',
    sample: 'Haute Luxury',
    styleTag: 'Editorial Vogue',
  },
  {
    id: 'Unbounded',
    name: 'Unbounded',
    labelAr: 'أنباوندد المنحوت',
    family: '"Unbounded", "Alexandria", sans-serif',
    sample: 'HYPER FLOW',
    styleTag: 'Sculpted Modern',
  },
  {
    id: 'Syncopate',
    name: 'Syncopate',
    labelAr: 'سينكوبيت الفضائي',
    family: '"Syncopate", "Alexandria", sans-serif',
    sample: 'GATEWAY 01',
    styleTag: 'Aerospace Wide',
  },
  {
    id: 'Italiana',
    name: 'Italiana',
    labelAr: 'إيطاليانا النحيف',
    family: '"Italiana", "Alexandria", serif',
    sample: 'MILANO VIP',
    styleTag: 'Architectural Thin',
  },
  {
    id: 'Marcellus',
    name: 'Marcellus',
    labelAr: 'مارسيلوس الكلاسيكي',
    family: '"Marcellus", "Alexandria", serif',
    sample: 'ELITE PROXY',
    styleTag: 'Roman Prestige',
  },
];

// 10 Authentic Calligraphic & Luxury Arabic Fonts (Diwani / Thuluth / Ruqaa / Kufi / Naskh)
export const ARABIC_FONTS: FontOption[] = [
  {
    id: 'Aref Ruqaa',
    name: 'Aref Ruqaa',
    labelAr: 'خط الرقعة والثلث',
    family: '"Aref Ruqaa", "Amiri", serif',
    sample: 'بوابة أونيكس الملكية',
    styleTag: 'رقعة وثلث أصيل',
  },
  {
    id: 'Gulzar',
    name: 'Gulzar',
    labelAr: 'خط الديواني المزخرف',
    family: '"Gulzar", "Amiri", serif',
    sample: 'شبكة النخبة الفاخرة',
    styleTag: 'ديواني / نستعليق',
  },
  {
    id: 'Rakkas',
    name: 'Rakkas',
    labelAr: 'خط الثلث الاستعراضي',
    family: '"Rakkas", "Amiri", serif',
    sample: 'تدفّق البيانات الحي',
    styleTag: 'ثلث عريض فخم',
  },
  {
    id: 'Reem Kufi',
    name: 'Reem Kufi',
    labelAr: 'خط ريم كوفي',
    family: '"Reem Kufi", "Alexandria", sans-serif',
    sample: 'بوابة الاتصال السريع',
    styleTag: 'كوفي فاطمي حديث',
  },
  {
    id: 'Amiri',
    name: 'Amiri',
    labelAr: 'الخط الأميري الكلاسيكي',
    family: '"Amiri", "Tajawal", serif',
    sample: 'خوادم القمة الموثوقة',
    styleTag: 'نسخ وثلث أميري',
  },
  {
    id: 'El Messiri',
    name: 'El Messiri',
    labelAr: 'خط المسيري الفني',
    family: '"El Messiri", "Tajawal", serif',
    sample: 'إصدار القمة الملكي',
    styleTag: 'فني راقٍ',
  },
  {
    id: 'Scheherazade New',
    name: 'Scheherazade New',
    labelAr: 'خط شهرزاد الملكي',
    family: '"Scheherazade New", "Amiri", serif',
    sample: 'ديوان البروكسي الذهبي',
    styleTag: 'نسخ ديواني ناعم',
  },
  {
    id: 'Mirza',
    name: 'Mirza',
    labelAr: 'خط ميرزا الزخرفي',
    family: '"Mirza", "Amiri", serif',
    sample: 'تحكم كامل بالإضاءة',
    styleTag: 'زخرفي كلاسيكي',
  },
  {
    id: 'Lalezar',
    name: 'Lalezar',
    labelAr: 'خط لاليزار الدرامي',
    family: '"Lalezar", "Alexandria", sans-serif',
    sample: 'أسرع خوادم تيليجرام',
    styleTag: 'عنوان عريض فخم',
  },
  {
    id: 'Alexandria',
    name: 'Alexandria',
    labelAr: 'الإسكندرية العصري',
    family: '"Alexandria", "Tajawal", sans-serif',
    sample: 'لوحة التحكم الشاملة',
    styleTag: 'هندسي مصقول',
  },
];

// 5 Glass Card Style Templates
export const GLASS_CARD_STYLES: GlassCardPreset[] = [
  {
    id: 'frosted-gloss',
    nameAr: 'ضبابي لامع',
    nameEn: 'Frosted Gloss',
    desc: 'زجاج مخملي بضبابية عميقة ولمعان قطري مصقول',
  },
  {
    id: 'crystal-polished',
    nameAr: 'كلاسس مصقول',
    nameEn: 'Polished Crystal',
    desc: 'شفافية كريستالية عالية مع حافة مضاعفة لامعة',
  },
  {
    id: 'tinted-glass',
    nameAr: 'زجاجي ملون',
    nameEn: 'Tinted Chromatic',
    desc: 'طبقة زجاجية ملونة متناغمة مع إضاءة الثيم المختار',
  },
  {
    id: 'obsidian-matte',
    nameAr: 'زجاج أوبسيديان داكن',
    nameEn: 'Obsidian Matte',
    desc: 'زجاج مدخّن غامق هادئ مع إطار برونزي نحيف',
  },
  {
    id: 'liquid-prism',
    nameAr: 'كريستال منشوري سائل',
    nameEn: 'Liquid Prism',
    desc: 'توهج داخلي سائل وانعكاسات محيطية فائقة الفخامة',
  },
];

// Unified Royal Solid Font Color Presets (Never jarring 2-color splits)
export const FONT_COLOR_PRESETS: FontColorPreset[] = [
  {
    id: 'royal-ivory',
    nameAr: 'اللؤلؤي الملكي الموحد',
    nameEn: 'Royal Champagne Ivory',
    titleColor: '#f7ebd2',
    bodyColor: '#f5efe4',
    mutedColor: '#cbbda9',
    glowColor: 'rgba(247, 235, 210, 0.22)',
  },
  {
    id: 'sovereign-gold',
    nameAr: 'الذهبي الملكي المصقول',
    nameEn: 'Solid Sovereign Gold',
    titleColor: '#edd08e',
    bodyColor: '#f4ead7',
    mutedColor: '#c7b597',
    glowColor: 'rgba(237, 208, 142, 0.26)',
  },
  {
    id: 'pure-alabaster',
    nameAr: 'الأبيض العاجي النقي',
    nameEn: 'Pure Alabaster Silk',
    titleColor: '#fcfaf5',
    bodyColor: '#f0ece3',
    mutedColor: '#bfb9ae',
    glowColor: 'rgba(255, 255, 255, 0.18)',
  },
  {
    id: 'platinum-frost',
    nameAr: 'البلاتيني الفضي',
    nameEn: 'Platinum Frost',
    titleColor: '#e6edf6',
    bodyColor: '#dde5ef',
    mutedColor: '#a8b5c6',
    glowColor: 'rgba(230, 237, 246, 0.2)',
  },
  {
    id: 'rose-silk',
    nameAr: 'الحرير الوردي الدافئ',
    nameEn: 'Warm Rose Silk',
    titleColor: '#f6dfe2',
    bodyColor: '#f3e7e9',
    mutedColor: '#c7aeb2',
    glowColor: 'rgba(246, 223, 226, 0.22)',
  },
];

export const DEFAULT_APPEARANCE: SiteAppearance = {
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

export const STUDIO_BACKGROUNDS: StudioBackground[] = [
  {
    id: 'abyss-default',
    name: 'Earthlink Abyss Crimson',
    nameAr: 'أبيس إيرث لنك الكلاسيكي',
    subtitle: 'خلفية أبيس القرمزية الداكنة المصقولة بلمعان عنبري',
    imageUrl: null,
    gradient:
      'radial-gradient(ellipse at 50% -5%, rgba(168, 42, 28, 0.38), transparent 52%), radial-gradient(ellipse at 85% 35%, rgba(196, 135, 62, 0.14), transparent 44%), radial-gradient(ellipse at 15% 85%, rgba(120, 28, 22, 0.24), transparent 45%), #090505',
  },
  {
    id: 'studio-obsidian',
    name: 'Studio Monolith',
    nameAr: 'استوديو المونوليث الفاخر',
    subtitle: 'إضاءة معمارية دافئة مع زجاج مدخن غامق',
    imageUrl: '/src/assets/images/studio_obsidian_abyss_1795152258061.jpg',
    gradient: 'linear-gradient(180deg, rgba(8,5,5,0.28), rgba(8,5,5,0.58))',
  },
  {
    id: 'studio-carbon',
    name: 'Carbon & Champagne',
    nameAr: 'استوديو الكاربون والذهب',
    subtitle: 'ألياف كاربون منسوجة مع انعكاسات ذهبية لامعة',
    imageUrl: '/src/assets/images/studio_champagne_carbon_1795152258247.jpg',
    gradient: 'linear-gradient(180deg, rgba(8,5,5,0.28), rgba(8,5,5,0.58))',
  },
  {
    id: 'studio-emerald',
    name: 'Emerald Glass Vault',
    nameAr: 'استوديو الزجاج الزمردي',
    subtitle: 'زجاج مدخن بإضاءة محيطية خضراء وذهبية',
    imageUrl: '/src/assets/images/studio_emerald_vault_1795152257888.jpg',
    gradient: 'linear-gradient(180deg, rgba(6,10,9,0.28), rgba(6,9,8,0.58))',
  },
  {
    id: 'studio-crimson',
    name: 'Crimson Noir Pillars',
    nameAr: 'استوديو النوار القرمزي',
    subtitle: 'أعمدة سوداء مصقولة بإضاءة قرمزية عنبرية فاخرة',
    imageUrl: '/src/assets/images/studio_crimson_noir_1795152258228.jpg',
    gradient: 'linear-gradient(180deg, rgba(12,5,5,0.28), rgba(8,5,5,0.58))',
  },
];

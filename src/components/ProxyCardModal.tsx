import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Nfc,
  QrCode,
  Radio,
  Server,
  Share2,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import { LuxuryIcon } from './LuxuryIcon';
import { ProxyItem } from '../types';
import {
  buildProxyTgLink,
  buildProxyWebLink,
  formatDateTime,
  launchTelegramUrl,
} from '../utils/proxyHelpers';

interface ProxyCardModalProps {
  proxy: ProxyItem | null;
  onClose: () => void;
  onTrack: (action: 'connect' | 'qr' | 'nfc_share' | 'nfc_connect', proxy: ProxyItem) => Promise<boolean>;
  onToast: (msg: string) => void;
  onSimulateNfcReceive: () => void;
}

export const ProxyCardModal: React.FC<ProxyCardModalProps> = ({
  proxy,
  onClose,
  onTrack,
  onToast,
  onSimulateNfcReceive,
}) => {
  const [mode, setMode] = useState<'details' | 'qr' | 'nfc'>('details');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [nfcQrUrl, setNfcQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [nfcState, setNfcState] = useState<'idle' | 'writing' | 'scanning' | 'success' | 'info'>('idle');
  const [nfcMessage, setNfcMessage] = useState('');

  const nfcTargetUrl = `${window.location.origin}/?nfc=random`;

  useEffect(() => {
    if (!proxy) return;
    setMode('details');
    setCopied(false);
    setNfcState('idle');
    setNfcMessage('');

    const tgLink = buildProxyTgLink(proxy);
    if (tgLink) {
      QRCode.toDataURL(tgLink, {
        width: 260,
        margin: 2,
        color: { dark: '#f3dfb1', light: '#120e0d' },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    }

    QRCode.toDataURL(nfcTargetUrl, {
      width: 180,
      margin: 2,
      color: { dark: '#34d399', light: '#120e0d' },
    })
      .then(setNfcQrUrl)
      .catch(() => setNfcQrUrl(''));
  }, [proxy, nfcTargetUrl]);

  if (!proxy) return null;

  const tgLink = buildProxyTgLink(proxy);
  const webLink = buildProxyWebLink(proxy);
  const isActive = proxy.status === 'active';

  const handleConnect = () => {
    if (tgLink) {
      // Launch synchronously in the user click gesture so Android/iOS never blocks tg://
      launchTelegramUrl(tgLink);
      onToast('تم إرسال إعدادات البروكسي إلى تطبيق تيليجرام');
    }
    onTrack('connect', proxy);
  };

  const handleOpenQr = async () => {
    const allowed = await onTrack('qr', proxy);
    if (!allowed) return;
    setMode('qr');
  };

  const handleCopyProxyLink = async () => {
    if (!tgLink) return;
    try {
      await navigator.clipboard.writeText(tgLink);
      setCopied(true);
      onToast('تم نسخ رابط البروكسي بنجاح');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('يمكنك تحديد رابط البروكسي ونسخه يدوياً');
    }
  };

  const handleActivateNfcWrite = async () => {
    const allowed = await onTrack('nfc_share', proxy);
    if (!allowed) return;
    setMode('nfc');

    const NdefConstructor = (
      window as unknown as {
        NDEFReader?: new () => {
          write: (msg: unknown) => Promise<void>;
          scan: () => Promise<void>;
          onreading?: ((ev: { message?: { records?: Array<{ recordType: string; data?: BufferSource }> } }) => void) | null;
        };
      }
    ).NDEFReader;

    if (NdefConstructor) {
      setNfcState('writing');
      setNfcMessage(
        'تم تفعيل بث NFC! قرّب الهاتف الآخر أو بطاقة NFC الآن لنقل رابط الاتصال التلقائي.'
      );
      try {
        const ndef = new NdefConstructor();
        await ndef.write({
          records: [
            { recordType: 'url', data: nfcTargetUrl },
            ...(tgLink ? [{ recordType: 'url', data: tgLink }] : []),
          ],
        });
        setNfcState('success');
        setNfcMessage(
          'تم إرسال بيانات التوجيه عبر NFC بنجاح! سيفتح الجهاز الآخر البوابة ويختار له بروكسي عشوائي صالح تلقائياً.'
        );
      } catch {
        setNfcState('info');
        setNfcMessage(
          'ملاحظة: متصفحات الهواتف الحديثة تمنع النقل المباشر بين هاتفين عبر الويب إلا ببطاقة NFC أو عبر وضع الاستقبال/المسح أو المشاركة الفورية أدناه.'
        );
      }
    } else {
      setNfcState('info');
      setNfcMessage(
        'هذا المتصفح لا يدعم Web NFC المباشر. استخدم زر "استقبال/اختبار NFC" أو امسح رمز التوجيه أو شارك الرابط للهاتف الآخر.'
      );
    }
  };

  const handleStartNfcScan = async () => {
    setMode('nfc');
    const NdefConstructor = (
      window as unknown as {
        NDEFReader?: new () => {
          scan: () => Promise<void>;
          onreading?: ((ev: { message?: { records?: Array<{ recordType: string; data?: BufferSource }> } }) => void) | null;
        };
      }
    ).NDEFReader;

    if (!NdefConstructor) {
      onToast('قارئ Web NFC متاح في متصفح Chrome على أندرويد — جاري تشغيل الاستقبال التلقائي');
      onClose();
      onSimulateNfcReceive();
      return;
    }

    try {
      setNfcState('scanning');
      setNfcMessage('وضع الاستقبال مفعل! قرّب الجهاز المرسل أو البطاقة الآن...');
      const ndef = new NdefConstructor();
      await ndef.scan();
      ndef.onreading = (event) => {
        const records = event?.message?.records || [];
        const decoder = new TextDecoder();
        for (const rec of records) {
          if (rec.data) {
            const text = decoder.decode(rec.data);
            if (text.includes('tg://proxy')) {
              launchTelegramUrl(text);
              onToast('تم استلام البروكسي عبر NFC وتوجيهك إلى تيليجرام');
              return;
            }
          }
        }
        onClose();
        onSimulateNfcReceive();
      };
    } catch {
      setNfcState('info');
      setNfcMessage('تعذر تشغيل ماسح NFC — تأكد من تفعيل NFC في إعدادات الهاتف ومنح الإذن.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ONIXTETL — ONX44 NFC Proxy',
          text: 'اتصال تلقائي بأسرع بروكسي تيليجرام عبر ONIXTETL',
          url: nfcTargetUrl,
        });
        onToast('تمت مشاركة رابط الاتصال التلقائي للهاتف الآخر');
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(nfcTargetUrl);
        onToast('تم نسخ رابط التوجيه التلقائي لفتحه على الهاتف الآخر');
      } catch {
        onToast('استخدم رمز QR السريع لفتح الرابط على الهاتف الآخر');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="el-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <LuxuryIcon variant="proxy" tone="gold" size="md" />
            <div>
              <h3 className="el-gold-text font-arabic-display text-base font-extrabold">
                {proxy.country_name || proxy.country || 'خادم بروكسي MTProto'}
              </h3>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-[#cbbca7]">
                <span>{proxy.city || 'Global Gateway'}</span>
                <span>·</span>
                <span className="font-mono-tech ltr">{proxy.server}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#cbbca7] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {proxy.blockedForCurrentVisitor && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
            <span>تم تقييد استخدام هذا البروكسي لحسابك من قبل الإدارة.</span>
          </div>
        )}

        {/* Mode Switch Tabs */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-black/45 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setMode('details')}
            className={`rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
              mode === 'details' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            التفاصيل
          </button>
          <button
            type="button"
            onClick={handleOpenQr}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
              mode === 'qr' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>رمز QR</span>
          </button>
          <button
            type="button"
            onClick={handleActivateNfcWrite}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer ${
              mode === 'nfc' ? 'el-gold-btn' : 'text-[#cbbca7] hover:text-[#fff6e3]'
            }`}
          >
            <Nfc className="h-3.5 w-3.5" />
            <span>وضع NFC</span>
          </button>
        </div>

        {/* Mode 1: Details */}
        {mode === 'details' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="el-card-subtle rounded-xl p-3">
                <span className="block text-[10px] text-[#cbbca7]">الحالة</span>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isActive ? 'bg-emerald-400 active-proxy-lamp' : 'bg-rose-400'
                    }`}
                  />
                  <span className={isActive ? 'text-emerald-300' : 'text-rose-300'}>
                    {isActive ? 'فعال ونشط' : proxy.status === 'paused' ? 'متوقف إدارياً' : 'غير متصل'}
                  </span>
                </div>
              </div>

              <div className="el-card-subtle rounded-xl p-3">
                <span className="block text-[10px] text-[#cbbca7]">السرعة / Ping</span>
                <span className="mt-1 block font-mono-tech text-sm font-bold text-[var(--accent-light)] ltr">
                  {proxy.ping !== null ? `${proxy.ping} ms` : '—'}
                </span>
              </div>

              <div className="el-card-subtle rounded-xl p-3">
                <span className="block text-[10px] text-[#cbbca7]">النوع والمنفذ</span>
                <span className="mt-1 block font-mono-tech text-xs font-bold text-[#fff6e3] ltr">
                  {proxy.type || 'MTProto'} · {proxy.port}
                </span>
              </div>

              <div className="el-card-subtle rounded-xl p-3">
                <span className="block text-[10px] text-[#cbbca7]">معدل الثبات</span>
                <span className="mt-1 block font-mono-tech text-xs font-bold text-emerald-300 ltr">
                  {proxy.uptime !== null ? `${proxy.uptime}%` : '99.0%'}
                </span>
              </div>

              <div className="el-card-subtle rounded-xl p-3">
                <span className="block text-[10px] text-[#cbbca7]">المستخدمون</span>
                <span className="mt-1 block font-mono-tech text-xs font-bold text-[#fff6e3] ltr">
                  {proxy.usage?.usesCount ?? 0} اتصال
                </span>
              </div>

              <div className="el-card-subtle rounded-xl p-3">
                <span className="block text-[10px] text-[#cbbca7]">آخر نشاط</span>
                <span className="mt-1 block text-[10px] font-semibold text-[#e8dcc8]">
                  {formatDateTime(proxy.usage?.lastUsedAt)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--accent)]/25 bg-black/50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[var(--accent-light)] flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" />
                  رابط البروكسي (قابل للنسخ فقط)
                </span>
                <button
                  type="button"
                  onClick={handleCopyProxyLink}
                  className="flex items-center gap-1 rounded-lg border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-light)] hover:bg-[var(--accent)]/20 cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
              </div>
              <div className="allow-copy-link font-mono-tech text-[11px] text-[#e8dcc8] break-all ltr rounded-lg bg-black/60 p-2 border border-white/5">
                {tgLink || 'غير متوفر'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleConnect}
                disabled={proxy.blockedForCurrentVisitor || proxy.status === 'paused'}
                className="el-gold-btn flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>اتصال تلقائي بتيليجرام</span>
              </button>
              {webLink && (
                <a
                  href={webLink}
                  onClick={() => onTrack('connect', proxy)}
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-xs font-bold text-[#e8dcc8] hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>فتح عبر المتصفح</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: QR Code */}
        {mode === 'qr' && (
          <div className="mt-4 flex flex-col items-center text-center space-y-4 py-2">
            <div className="rounded-3xl border border-[var(--accent)]/35 bg-[#120e0d] p-4 shadow-2xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="رمز QR للبروكسي"
                  className="h-56 w-56 rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-xs text-[#cbbca7]">
                  جاري توليد رمز QR...
                </div>
              )}
            </div>
            <p className="text-xs text-[#e8dcc8] max-w-xs leading-relaxed">
              وجّه كاميرا الهاتف أو قارئ QR نحو الرمز ليتم فتح تيليجرام وتفعيل البروكسي فوراً.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              className="el-gold-btn flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>تفعيل مباشر على هذا الجهاز</span>
            </button>
          </div>
        )}

        {/* Mode 3: Two-Way NFC Mode */}
        {mode === 'nfc' && (
          <div className="mt-4 space-y-4 text-center py-2">
            <div className="mx-auto flex justify-center">
              <div className={nfcState === 'writing' || nfcState === 'scanning' ? 'active-proxy-lamp rounded-2xl' : ''}>
                <LuxuryIcon variant="nfc" tone="gold" size="lg" />
              </div>
            </div>

            <div>
              <h4 className="el-gold-text font-arabic-display text-sm font-extrabold">
                {nfcState === 'success'
                  ? 'اكتمل النقل عبر NFC'
                  : nfcState === 'scanning'
                  ? 'جاري انتظار إشارة NFC من الهاتف الآخر...'
                  : 'نظام النقل الذكي عبر NFC'}
              </h4>
              <p className="mt-1.5 text-xs text-[#e8dcc8] leading-relaxed px-2">
                {nfcMessage ||
                  'فعّل وضع الإرسال في الهاتف الأول أو وضع الاستقبال في الهاتف الثاني. عند الفتح عبر NFC يتم تلقائياً اختيار بروكسي عشوائي صالح وتحويله إلى تيليجرام.'}
              </p>
            </div>

            {/* NFC Bridge QR + URL for instant Phone-to-Phone pairing */}
            <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-white/10 bg-black/50 p-3 text-right">
              {nfcQrUrl && (
                <img
                  src={nfcQrUrl}
                  alt="QR رابط التوجيه NFC"
                  className="h-20 w-20 shrink-0 rounded-xl border border-emerald-400/30"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <Globe className="h-3.5 w-3.5" />
                  <span>رابط التوجيه التلقائي للأجهزة القريبة</span>
                </div>
                <div className="allow-copy-link font-mono-tech text-[10px] text-[#e8dcc8] break-all ltr">
                  {nfcTargetUrl}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleActivateNfcWrite}
                className="el-gold-btn flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold cursor-pointer"
              >
                <Nfc className="h-4 w-4" />
                <span>بث / كتابة NFC</span>
              </button>

              <button
                type="button"
                onClick={handleStartNfcScan}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
              >
                <Radio className="h-4 w-4" />
                <span>استقبال إشارة NFC</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-stone-200 hover:bg-white/10 cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-[var(--accent-light)]" />
                <span>مشاركة فورية للهاتف الآخر</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSimulateNfcReceive();
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/10 py-2.5 text-xs font-bold text-[var(--accent-light)] hover:bg-[var(--accent)]/20 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>تشغيل اختيار عشوائي الآن</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

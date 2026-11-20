import { ProxyItem } from '../types';

const VISITOR_KEY = 'onx44_visitor_id';

export function getVisitorId(): string {
  try {
    let existing = localStorage.getItem(VISITOR_KEY);
    if (!existing || existing.length < 6) {
      existing = `ONX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      localStorage.setItem(VISITOR_KEY, existing);
    }
    return existing;
  } catch {
    return `ONX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
}

export function buildProxyTgLink(proxy: ProxyItem): string {
  if (proxy.url && /^tg:\/\/proxy\?/i.test(proxy.url)) {
    return proxy.url;
  }
  if (proxy.server && proxy.port && proxy.secret) {
    const params = new URLSearchParams({
      server: proxy.server,
      port: String(proxy.port),
      secret: proxy.secret,
    });
    return `tg://proxy?${params.toString()}`;
  }
  return '';
}

export function buildProxyWebLink(proxy: ProxyItem): string {
  const tg = buildProxyTgLink(proxy);
  if (!tg) return '';
  return tg.replace(/^tg:\/\/proxy\?/i, 'https://t.me/proxy?');
}

export function launchTelegramUrl(url: string) {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    window.location.href = url;
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 ثانية';
  if (seconds < 60) return `${seconds} ث`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (mins < 60) return `${mins} د ${remSec} ث`;
  const hrs = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hrs} س ${remMin} د`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'لم يُستخدم بعد';
  try {
    return new Date(iso).toLocaleString('ar-IQ', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

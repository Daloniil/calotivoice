import Constants from 'expo-constants';
import { i18n } from '@/i18n';
import type { Session } from '@/lib/auth/types';

const OTP_TTL_MS = 10 * 60 * 1000;
const DEV_OTP_CODE = '123456';

type PendingOtp = {
  code: string;
  expiresAt: number;
};

const pendingOtps = new Map<string, PendingOtp>();

export type RequestOtpResult = {
  /** Письмо ушло через SES (dev: Metro на Mac). */
  emailSent?: boolean;
  /** Только если SES не настроен — локальный fallback в __DEV__. */
  devCode?: string;
};

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function metroHost(): string {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  return '127.0.0.1';
}

/** Dev: POST на Metro → SES с ключами из .env на Mac. */
function getOtpSendUrl(): string | null {
  const override = process.env.EXPO_PUBLIC_OTP_SEND_URL?.trim();
  if (override) {
    return `${override.replace(/\/$/, '')}/auth/otp/send`;
  }
  if (__DEV__ && isExpoGo()) {
    return `http://${metroHost()}:8081/auth/otp/send`;
  }
  if (__DEV__) {
    return 'http://127.0.0.1:8081/auth/otp/send';
  }
  return null;
}

async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const url = getOtpSendUrl();
  if (!url) {
    return false;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  let detail = '';
  try {
    const body = (await res.json()) as { error?: string };
    detail = body.error ?? '';
  } catch {
    detail = await res.text().catch(() => '');
  }

  if (!res.ok) {
    throw new Error(detail || i18n.t('auth.sendCodeFailed'));
  }
  return true;
}

export async function requestEmailOtp(email: string): Promise<RequestOtpResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error(i18n.t('auth.api.invalidEmail'));
  }

  const code = generateOtpCode();
  pendingOtps.set(normalized, { code, expiresAt: Date.now() + OTP_TTL_MS });

  try {
    const sent = await sendOtpEmail(normalized, code);
    if (sent) {
      return { emailSent: true };
    }
  } catch (err) {
    pendingOtps.delete(normalized);
    throw err;
  }

  if (__DEV__) {
    pendingOtps.set(normalized, { code: DEV_OTP_CODE, expiresAt: Date.now() + OTP_TTL_MS });
    return { devCode: DEV_OTP_CODE };
  }

  pendingOtps.delete(normalized);
  throw new Error(i18n.t('auth.sendCodeFailed'));
}

export async function verifyEmailOtp(email: string, code: string): Promise<Session> {
  await delay(200);
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error(i18n.t('auth.api.invalidEmail'));
  }
  if (!/^\d{6}$/.test(code.trim())) {
    throw new Error(i18n.t('auth.api.invalidOtp'));
  }

  const pending = pendingOtps.get(normalized);
  if (!pending) {
    throw new Error(i18n.t('auth.api.requestCodeFirst'));
  }
  if (Date.now() > pending.expiresAt) {
    pendingOtps.delete(normalized);
    throw new Error(i18n.t('auth.api.codeExpired'));
  }
  if (pending.code !== code.trim()) {
    throw new Error(i18n.t('auth.wrongCode'));
  }

  pendingOtps.delete(normalized);

  return {
    userId: `email:${normalized}`,
    provider: 'email',
    email: normalized,
  };
}

export async function signInWithAppleCredential(appleUserId: string, email: string | null): Promise<Session> {
  return {
    userId: `apple:${appleUserId}`,
    provider: 'apple',
    email,
  };
}

function normalizeEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

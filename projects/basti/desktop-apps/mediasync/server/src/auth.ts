import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RuntimeConfig } from './config';

export const SESSION_COOKIE = 'mediasync_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(config: RuntimeConfig, issuedAt: number): string {
  return createHmac('sha256', config.sessionSecret)
    .update(`${issuedAt}:${config.authPassword}`)
    .digest('hex');
}

/** Create a signed session token bound to the configured password. */
export function createSessionToken(config: RuntimeConfig): string {
  const issuedAt = Date.now();
  return `${issuedAt}.${sign(config, issuedAt)}`;
}

export function isValidSession(config: RuntimeConfig, token: string | undefined): boolean {
  if (!config.authEnabled) {
    return true;
  }
  if (!token) {
    return false;
  }

  const [issuedRaw, signature] = token.split('.');
  const issuedAt = Number(issuedRaw);
  if (!Number.isFinite(issuedAt) || !signature) {
    return false;
  }
  if (Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) {
    return false;
  }

  const expected = sign(config, issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(config: RuntimeConfig, password: string): boolean {
  if (!config.authEnabled) {
    return true;
  }
  const a = Buffer.from(password ?? '');
  const b = Buffer.from(config.authPassword);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: MAX_AGE_SECONDS,
  secure: process.env.COOKIE_SECURE === 'true'
};

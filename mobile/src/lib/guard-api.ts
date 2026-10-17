import Constants from 'expo-constants';
import * as Device from 'expo-device';

export type GuardCheckResult = {
  check_id: string;
  status: 'pending' | 'done' | 'error';
  allowed: boolean;
  intake_queued?: boolean;
  injection_score?: number;
  in_scope?: string;
  reason?: string;
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

export function getGuardApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GUARD_API_URL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }

  if (__DEV__ && !Device.isDevice) {
    return 'http://127.0.0.1:8082';
  }

  if (__DEV__ && isExpoGo()) {
    return `http://${metroHost()}:8081/guard`;
  }

  return 'http://127.0.0.1:8082';
}

export async function fetchGuardCheck(checkId: string): Promise<GuardCheckResult | null> {
  const base = getGuardApiBaseUrl();
  const res = await fetch(`${base}/v1/check/${encodeURIComponent(checkId)}`, { method: 'GET' });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`guard ${res.status}`);
  }
  return (await res.json()) as GuardCheckResult;
}

export async function waitForGuardCheck(
  checkId: string,
  opts?: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number },
): Promise<GuardCheckResult> {
  const intervalMs = opts?.intervalMs ?? 400;
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (opts?.signal?.aborted) {
      throw new Error('aborted');
    }
    const row = await fetchGuardCheck(checkId);
    if (row && (row.status === 'done' || row.status === 'error')) {
      return row;
    }
    await sleep(intervalMs, opts?.signal);
  }
  throw new Error('timeout');
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new Error('aborted'));
      },
      { once: true },
    );
  });
}

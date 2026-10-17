import Constants from 'expo-constants';
import * as Device from 'expo-device';

export type IntakeResult = {
  check_id: string;
  status: 'pending' | 'done' | 'error';
  data?: unknown;
  error?: string;
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

/** Симулятор: напрямую :8083. Телефон: Metro /intake (после fix GET в metro.config.js). */
export function getIntakeApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_INTAKE_API_URL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }

  if (__DEV__ && !Device.isDevice) {
    return 'http://127.0.0.1:8083';
  }

  if (__DEV__ && isExpoGo()) {
    return `http://${metroHost()}:8081/intake`;
  }

  return 'http://127.0.0.1:8083';
}

export async function fetchIntake(checkId: string): Promise<IntakeResult | null> {
  const base = getIntakeApiBaseUrl();
  const res = await fetch(`${base}/v1/intake/${encodeURIComponent(checkId)}`, { method: 'GET' });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`intake ${res.status}`);
  }
  const raw = (await res.json()) as IntakeResult & { json?: unknown };
  return {
    check_id: raw.check_id,
    status: raw.status,
    data: raw.data ?? raw.json,
    error: raw.error,
  };
}

export async function waitForIntake(
  checkId: string,
  opts?: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number },
): Promise<IntakeResult> {
  const intervalMs = opts?.intervalMs ?? 500;
  const timeoutMs = opts?.timeoutMs ?? 180_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (opts?.signal?.aborted) {
      throw new Error('aborted');
    }
    const row = await fetchIntake(checkId);
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

export function formatIntakeJson(result: IntakeResult): string {
  if (result.status === 'error') {
    return JSON.stringify({ error: result.error ?? 'unknown' }, null, 2);
  }
  if (result.data === undefined || result.data === null) {
    return '{}';
  }
  return JSON.stringify(result.data, null, 2);
}

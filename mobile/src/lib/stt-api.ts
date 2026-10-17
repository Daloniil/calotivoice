import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { GuardCheckResult } from '@/lib/guard-api';
import type { IntakeResult } from '@/lib/intake-api';

export type TranscribeResult = {
  text: string;
  check_id?: string;
  language?: string;
  language_probability?: number;
  duration_sec?: number | null;
  model?: string;
  guard?: GuardCheckResult;
  intake?: IntakeResult;
};

export class SttNetworkError extends Error {
  readonly baseUrl: string;
  constructor(baseUrl: string, cause?: unknown) {
    super('network');
    this.name = 'SttNetworkError';
    this.baseUrl = baseUrl;
    if (cause instanceof Error && cause.message) {
      this.message = cause.message;
    }
  }
}

export class SttHttpError extends Error {
  readonly status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'SttHttpError';
    this.status = status;
  }
}

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** Same host as Metro (Expo Go already loads JS from here). */
function metroHost(): string {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  return '127.0.0.1';
}

export function getSttApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_STT_API_URL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }

  if (__DEV__ && isExpoGo()) {
    return `http://${metroHost()}:8081/stt`;
  }

  return 'http://127.0.0.1:8080';
}

export async function pingSttBackend(): Promise<boolean> {
  const base = getSttApiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Один POST: STT → SQS → Guard → Intake; ответ когда пайплайн готов. */
export async function transcribeRecording(localUri: string): Promise<TranscribeResult> {
  const base = getSttApiBaseUrl();
  const url = `${base}/v1/transcribe`;

  if (Platform.OS === 'web') {
    return transcribeWithFetch(url, localUri);
  }

  try {
    const result = await FileSystem.uploadAsync(url, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'audio',
      mimeType: 'audio/m4a',
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
    });

    let parsed: TranscribeResult & { error?: string };
    try {
      parsed = JSON.parse(result.body) as TranscribeResult & { error?: string };
    } catch {
      throw new SttHttpError(result.status, result.body || 'Invalid STT response');
    }

    if (result.status < 200 || result.status >= 300) {
      throw new SttHttpError(result.status, parsed.error ?? result.body);
    }

    return parsed;
  } catch (e) {
    if (e instanceof SttHttpError) {
      throw e;
    }
    throw new SttNetworkError(base, e);
  }
}

async function transcribeWithFetch(url: string, localUri: string): Promise<TranscribeResult> {
  const form = new FormData();
  form.append('audio', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: form });
  } catch (e) {
    throw new SttNetworkError(url, e);
  }

  const raw = await res.text();
  let parsed: TranscribeResult & { error?: string };
  try {
    parsed = JSON.parse(raw) as TranscribeResult & { error?: string };
  } catch {
    if (!res.ok) {
      throw new SttHttpError(res.status, raw || res.statusText);
    }
    throw new SttHttpError(500, 'Invalid STT response');
  }

  if (!res.ok) {
    throw new SttHttpError(res.status, parsed.error ?? (raw || res.statusText));
  }

  return parsed;
}

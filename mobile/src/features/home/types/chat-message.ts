import type { GuardCheckResult } from '@/lib/guard-api';
import type { IntakeResult } from '@/lib/intake-api';

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'guard'; result: GuardCheckResult }
  | { id: string; role: 'assistant'; kind: 'intake'; result: IntakeResult }
  | { id: string; role: 'assistant'; kind: 'status'; text: string }
  | { id: string; role: 'system'; kind: 'error'; text: string };

import { useEffect, useRef, useState } from 'react';

import { pickRandomIndex } from '@/shared/lib/pick-random-index';

export type RotatingTypewriterOptions = {
  phrases: readonly string[];
  /** When false, animation stops and text clears. */
  enabled?: boolean;
  /** Delay between typed characters (ms). */
  typeIntervalMs?: number;
  /** Delay between deleted characters (ms). */
  deleteIntervalMs?: number;
  /** Pause after phrase is fully typed (ms). */
  holdMinMs?: number;
  holdMaxMs?: number;
};

export type RotatingTypewriterState = {
  text: string;
  /** Blinking caret while typing or holding. */
  showCaret: boolean;
};

const DEFAULT_TYPE_MS = 42;
const DEFAULT_DELETE_MS = 22;
const DEFAULT_HOLD_MIN = 5000;
const DEFAULT_HOLD_MAX = 10000;

function randomHoldMs(min: number, max: number): number {
  if (max <= min) {
    return min;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function useRotatingTypewriter({
  phrases,
  enabled = true,
  typeIntervalMs = DEFAULT_TYPE_MS,
  deleteIntervalMs = DEFAULT_DELETE_MS,
  holdMinMs = DEFAULT_HOLD_MIN,
  holdMaxMs = DEFAULT_HOLD_MAX,
}: RotatingTypewriterOptions): RotatingTypewriterState {
  const [text, setText] = useState('');
  const [showCaret, setShowCaret] = useState(false);

  const phraseIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<'type' | 'hold' | 'delete'>('type');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled || phrases.length === 0) {
      setText('');
      setShowCaret(false);
      phraseIndexRef.current = pickRandomIndex(phrases.length, -1);
      charIndexRef.current = 0;
      phaseRef.current = 'type';
      return;
    }

    phraseIndexRef.current = pickRandomIndex(phrases.length, phraseIndexRef.current);
    charIndexRef.current = 0;
    phaseRef.current = 'type';
    setText('');
    setShowCaret(true);

    const schedule = (delayMs: number, fn: () => void) => {
      timerRef.current = setTimeout(fn, delayMs);
    };

    const currentPhrase = (): string => phrases[phraseIndexRef.current] ?? '';

    const tick = () => {
      const phrase = currentPhrase();

      if (phaseRef.current === 'type') {
        const nextLen = charIndexRef.current + 1;
        charIndexRef.current = nextLen;
        setText(phrase.slice(0, nextLen));
        setShowCaret(true);
        if (nextLen >= phrase.length) {
          phaseRef.current = 'hold';
          schedule(randomHoldMs(holdMinMs, holdMaxMs), tick);
          return;
        }
        schedule(typeIntervalMs, tick);
        return;
      }

      if (phaseRef.current === 'hold') {
        phaseRef.current = 'delete';
        schedule(deleteIntervalMs, tick);
        return;
      }

      const nextLen = charIndexRef.current - 1;
      charIndexRef.current = nextLen;
      setText(phrase.slice(0, Math.max(0, nextLen)));
      setShowCaret(true);
      if (nextLen <= 0) {
        phraseIndexRef.current = pickRandomIndex(phrases.length, phraseIndexRef.current);
        charIndexRef.current = 0;
        phaseRef.current = 'type';
        schedule(typeIntervalMs, tick);
        return;
      }
      schedule(deleteIntervalMs, tick);
    };

    schedule(typeIntervalMs, tick);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, phrases, typeIntervalMs, deleteIntervalMs, holdMinMs, holdMaxMs]);

  return { text, showCaret };
}

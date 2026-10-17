import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Один tick для date spinner и линеек роста/веса. */
let audioReady = false;
let player: ReturnType<typeof createAudioPlayer> | null = null;

async function ensureAudio() {
  if (audioReady || Platform.OS === 'web') {
    return;
  }
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    player = createAudioPlayer(require('@/assets/sounds/onboarding-wheel-tick.wav'));
    player.volume = 0.42;
    audioReady = true;
  } catch {
    audioReady = true;
  }
}

export function playOnboardingWheelTick() {
  if (Platform.OS !== 'web') {
    void Haptics.selectionAsync();
  }

  void (async () => {
    await ensureAudio();
    if (!player) {
      return;
    }
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // simulators / missing audio session
    }
  })();
}

/** @deprecated use playOnboardingWheelTick */
export const playRulerTick = playOnboardingWheelTick;

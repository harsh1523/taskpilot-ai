import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';
import { MAC_TRASH_WAV_BASE64 } from './trashSoundData';

let lastSpokenText = '';
let speechTimer: any = null;
let audioContext: any = null;
let cachedTechnaFemaleVoiceIdentifier: string | null = null;
let cachedWebTechnaFemaleVoice: any = null;

// Initialize Techna AI Female Voice discovery
async function initTechnaFemaleVoice() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadWebVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        // 1. Prioritize natural female voices (Samantha, Victoria, Karen, Zira, Google US Female)
        let femaleVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('samantha') ||
            v.voiceURI.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria')
        );

        if (!femaleVoice) {
          femaleVoice = voices.find(
            (v) =>
              (v.name.toLowerCase().includes('karen') ||
                v.name.toLowerCase().includes('moira') ||
                v.name.toLowerCase().includes('fiona') ||
                v.name.toLowerCase().includes('zira'))
          );
        }

        if (!femaleVoice) {
          femaleVoice = voices.find(
            (v) =>
              (v.lang === 'en-US' || v.lang.startsWith('en')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Online'))
          );
        }

        if (!femaleVoice) {
          femaleVoice = voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en'));
        }

        if (femaleVoice) {
          cachedWebTechnaFemaleVoice = femaleVoice;
        }
      };

      loadWebVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadWebVoices;
      }
    } else {
      // Native iOS / Android: discover Techna Female voice
      const voices = await Speech.getAvailableVoicesAsync();
      if (voices && voices.length > 0) {
        const femaleVoice = voices.find(
          (v) =>
            v.identifier.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria') ||
            ((v.identifier.toLowerCase().includes('female') || v.name.toLowerCase().includes('female')) &&
              (v.language === 'en-US' || v.language === 'en_US'))
        );

        if (femaleVoice) {
          cachedTechnaFemaleVoiceIdentifier = femaleVoice.identifier;
        } else {
          const fallback = voices.find((v) => v.language === 'en-US' || v.language === 'en_US');
          if (fallback) {
            cachedTechnaFemaleVoiceIdentifier = fallback.identifier;
          }
        }
      }
    }
  } catch (e) {
    // Ignore voice discovery error
  }
}

// Preload voice on startup
initTechnaFemaleVoice();

// Synthesize a subtle mechanical audio tick sound
export function playSpinnerTickSound(frequency: number = 800) {
  try {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContext || audioContext.state === 'suspended') {
          audioContext = new AudioCtx();
        }
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.04);

        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 0.04);
      }
    }
  } catch (e) {
    // Ignore audio errors
  }
}

// Speak with authentic Techna AI Female voice dynamics
export function speakWithTechna(text: string, force: boolean = false) {
  if (!text || (text === lastSpokenText && !force)) return;

  lastSpokenText = text;

  if (speechTimer) {
    clearTimeout(speechTimer);
  }

  speechTimer = setTimeout(async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        if (!cachedWebTechnaFemaleVoice) {
          const voices = window.speechSynthesis.getVoices();
          cachedWebTechnaFemaleVoice =
            voices.find(
              (v) =>
                v.name.toLowerCase().includes('samantha') ||
                v.voiceURI.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('victoria')
            ) || voices.find((v) => v.lang === 'en-US');
        }

        if (cachedWebTechnaFemaleVoice) {
          utterance.voice = cachedWebTechnaFemaleVoice;
        }

        // Techna Female voice tuning: crisp 1.02 cadence, 1.06 bright pitch
        utterance.rate = 1.02;
        utterance.pitch = 1.06;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } else {
        await Speech.stop();
        Speech.speak(text, {
          voice: cachedTechnaFemaleVoiceIdentifier || undefined,
          language: 'en-US',
          rate: 1.02,
          pitch: 1.06,
          volume: 1.0,
        });
      }
    } catch (e) {
      console.warn('Techna speech error:', e);
    }
  }, 100);
}

export const speakTimeSlot = speakWithTechna;

let lastTrashSoundTime = 0;
let nativeTrashPlayer: any = null;

/**
 * playMacTrashSound
 * Plays the authentic macOS Finder Trash / Move to Trash paper-swoosh crumple sound effect.
 * Uses pre-rendered 16-bit 44.1kHz PCM WAV on both Web and Native (iOS/Android)
 * plus synchronized haptic feedback and Web Audio acoustic resonance.
 */
export function playMacTrashSound() {
  const now = Date.now();
  if (now - lastTrashSoundTime < 280) return;
  lastTrashSoundTime = now;

  try {
    // 1. Physical haptic feedback on mobile devices
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    // 2. High-Fidelity Audio playback on Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const audio = new Audio(MAC_TRASH_WAV_BASE64);
        audio.volume = 1.0;
        audio.play().catch(() => {});
      } catch (e) {
        // Fallback to Web Audio API
      }

      // Also ensure AudioContext plays crisp synthesized paper crunch
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!audioContext || audioContext.state === 'suspended') {
            audioContext = new AudioCtx();
          }
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
          }

          const ctxTime = audioContext.currentTime;

          // Multi-layer paper crumple with rapid micro-bursts
          const bufferSize = Math.floor(audioContext.sampleRate * 0.28);
          const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            const spike = Math.random() < 0.2 ? (Math.random() * 2 - 1) * 2.2 : (Math.random() * 2 - 1);
            output[i] = spike * 0.85;
          }

          const whiteNoise = audioContext.createBufferSource();
          whiteNoise.buffer = noiseBuffer;

          const filter = audioContext.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(3400, ctxTime);
          filter.frequency.exponentialRampToValueAtTime(1100, ctxTime + 0.25);
          filter.Q.setValueAtTime(3.0, ctxTime);

          const noiseGain = audioContext.createGain();
          noiseGain.gain.setValueAtTime(0.001, ctxTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.42, ctxTime + 0.03);
          noiseGain.gain.exponentialRampToValueAtTime(0.12, ctxTime + 0.09);
          noiseGain.gain.exponentialRampToValueAtTime(0.35, ctxTime + 0.14);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctxTime + 0.27);

          whiteNoise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(audioContext.destination);

          // Wastebasket bottom impact thump
          const thudOsc = audioContext.createOscillator();
          const thudGain = audioContext.createGain();

          thudOsc.type = 'sine';
          thudOsc.frequency.setValueAtTime(145, ctxTime + 0.08);
          thudOsc.frequency.exponentialRampToValueAtTime(45, ctxTime + 0.24);

          thudGain.gain.setValueAtTime(0.001, ctxTime);
          thudGain.gain.setValueAtTime(0.25, ctxTime + 0.09);
          thudGain.gain.exponentialRampToValueAtTime(0.0001, ctxTime + 0.24);

          thudOsc.connect(thudGain);
          thudGain.connect(audioContext.destination);

          whiteNoise.start(ctxTime);
          whiteNoise.stop(ctxTime + 0.28);
          thudOsc.start(ctxTime + 0.08);
          thudOsc.stop(ctxTime + 0.24);
        }
      } catch (e) {}
    } else {
      // 3. Native iOS / Android playback using expo-audio with bundled WAV
      try {
        if (!nativeTrashPlayer) {
          nativeTrashPlayer = createAudioPlayer(require('../../assets/sounds/trash.wav'));
        }
        if (nativeTrashPlayer) {
          if (typeof nativeTrashPlayer.seekTo === 'function') {
            nativeTrashPlayer.seekTo(0).catch?.(() => {});
          }
          nativeTrashPlayer.play();
        }
      } catch (err) {
        try {
          const p = createAudioPlayer(require('../../assets/sounds/trash.wav'));
          p.play();
        } catch (e) {}
      }
    }
  } catch (e) {
    // Ignore audio errors
  }
}

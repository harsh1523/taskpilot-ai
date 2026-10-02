import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as Speech from 'expo-speech';

// Cached reference to native module or null
let cachedExpoSpeechModule: any = undefined;

// Safe dynamic loader to prevent Expo Go crashes when native binary is not compiled
function getExpoSpeechRecognitionModule(): any {
  if (Platform.OS === 'web') return null;
  if (cachedExpoSpeechModule !== undefined) return cachedExpoSpeechModule;

  try {
    // 1. Check if the native binary already registered ExpoSpeechRecognition
    let nativeMod =
      typeof requireOptionalNativeModule === 'function'
        ? requireOptionalNativeModule('ExpoSpeechRecognition')
        : (globalThis as any)?.expo?.modules?.ExpoSpeechRecognition || null;

    if (!nativeMod) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('expo-speech-recognition');
        nativeMod = mod?.ExpoSpeechRecognitionModule || null;
      } catch {
        // Native binary does not contain the module (e.g. Expo Go)
      }
    }

    cachedExpoSpeechModule = nativeMod || null;
    return cachedExpoSpeechModule;
  } catch {
    cachedExpoSpeechModule = null;
    return null;
  }
}

/** Stop any ongoing TTS playback so it does not interfere with microphone capture */
function stopAllAudioOutput(): void {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      Speech.stop().catch(() => {});
    }
  } catch {
    // Ignore audio interruption errors
  }
}

export interface VoiceRecognitionHandlers {
  onStart?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface EnvironmentStatus {
  isAvailable: boolean;
  runtime: 'native' | 'web' | 'expo_go';
  message?: string;
}

class VoiceRecognitionService {
  private activeRecognition: any = null;
  private isListeningActive = false;
  private silenceTimer: any = null;
  private restartTimer: any = null;
  private lastTranscript = '';
  private currentHandlers: VoiceRecognitionHandlers = {};
  private subscriptions: { remove: () => void }[] = [];

  private removeListeners() {
    this.subscriptions.forEach((sub) => {
      try {
        sub?.remove?.();
      } catch {}
    });
    this.subscriptions = [];
  }

  /**
   * Diagnostic to check runtime environment and speech capability
   */
  getEnvironmentStatus(): EnvironmentStatus {
    if (Platform.OS === 'web') {
      const hasWebSpeech =
        typeof window !== 'undefined' &&
        !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      return {
        isAvailable: hasWebSpeech,
        runtime: 'web',
        message: hasWebSpeech
          ? 'Web Speech API is available'
          : 'Browser does not support the Web SpeechRecognition API (Chrome, Safari, Edge recommended)',
      };
    }

    const nativeMod = getExpoSpeechRecognitionModule();
    if (nativeMod) {
      return {
        isAvailable: true,
        runtime: 'native',
        message: 'Native ExpoSpeechRecognitionModule is available',
      };
    }

    return {
      isAvailable: false,
      runtime: 'expo_go',
      message:
        'Voice recognition requires a Development Build (npx expo run:ios/android). In Expo Go, use keyboard dictation 🎙️ or text input.',
    };
  }

  /**
   * Check if speech recognition is available in current runtime
   */
  async isAvailable(): Promise<boolean> {
    const status = this.getEnvironmentStatus();
    if (!status.isAvailable) return false;

    if (Platform.OS === 'web') return true;

    try {
      const nativeMod = getExpoSpeechRecognitionModule();
      if (nativeMod && typeof nativeMod.isRecognitionAvailable === 'function') {
        return nativeMod.isRecognitionAvailable();
      }
    } catch {
      return false;
    }
    return true;
  }

  /**
   * Start listening for voice input across Native (iOS/Android) & Web
   */
  async start(handlers: VoiceRecognitionHandlers = {}): Promise<boolean> {
    this.stop();
    this.isListeningActive = true;
    this.lastTranscript = '';
    this.currentHandlers = handlers;

    // Prevent robot speech from bleeding into the microphone
    stopAllAudioOutput();

    // 1. Native Mobile Recognition (iOS & Android via ExpoSpeechRecognitionModule in custom dev builds)
    if (Platform.OS !== 'web') {
      try {
        const nativeMod = getExpoSpeechRecognitionModule();
        if (
          nativeMod &&
          typeof nativeMod.start === 'function' &&
          typeof nativeMod.addListener === 'function'
        ) {
          // Check permissions first, request if needed
          let hasPermission = false;
          try {
            if (typeof nativeMod.getPermissionsAsync === 'function') {
              const currentPerm = await nativeMod.getPermissionsAsync();
              hasPermission = !!currentPerm.granted;
            }
          } catch {}

          if (!hasPermission && typeof nativeMod.requestPermissionsAsync === 'function') {
            const requested = await nativeMod.requestPermissionsAsync();
            hasPermission = !!requested.granted;
          }

          if (!hasPermission) {
            handlers.onError?.(
              'Microphone & Speech Recognition permission is required. Please enable it in device settings.'
            );
            this.isListeningActive = false;
            handlers.onEnd?.();
            return false;
          }

          this.removeListeners();

          this.subscriptions.push(
            nativeMod.addListener('start', () => {
              this.isListeningActive = true;
              handlers.onStart?.();
            }),
            nativeMod.addListener('result', (event: any) => {
              const transcript =
                event.results?.[0]?.transcript ||
                event.results?.map?.((r: any) => r.transcript)?.join(' ') ||
                '';

              if (transcript) {
                this.lastTranscript = transcript;
                handlers.onTranscript?.(transcript, !!event.isFinal);

                if (this.silenceTimer) clearTimeout(this.silenceTimer);
                this.silenceTimer = setTimeout(() => {
                  if (this.isListeningActive && this.lastTranscript) {
                    handlers.onTranscript?.(this.lastTranscript, true);
                  }
                }, 1200);
              }
            }),
            nativeMod.addListener('error', (event: any) => {
              const errCode = event.error || event.message || '';
              // Non-fatal timeouts: silence or short pause from user
              const isSilenceTimeout =
                errCode === 'no-speech' ||
                errCode === 'speech-timeout' ||
                errCode === 7 || // ERROR_NO_MATCH
                errCode === 6; // ERROR_SPEECH_TIMEOUT

              if (isSilenceTimeout) {
                // If listening is still active, restart gracefully for silence pause
                if (this.isListeningActive) {
                  this.scheduleNativeRestart(nativeMod);
                }
                return;
              }

              // Fatal or configuration error: immediately cancel active listening and abort loop
              this.isListeningActive = false;
              if (this.restartTimer) {
                clearTimeout(this.restartTimer);
                this.restartTimer = null;
              }

              const rawMsg = event.message || event.error || '';
              const isInitOrAudioError =
                rawMsg.includes('initialize') ||
                rawMsg.includes('audio-capture') ||
                rawMsg.includes('kLSRErrorDomain');

              const friendlyMsg = isInitOrAudioError
                ? 'Speech recognition cannot initialize on iOS Simulator (Apple kLSRErrorDomain 300). Use the Voice Demo below, or test live mic in Web (http://localhost:8081) / physical device.'
                : `Speech recognition: ${rawMsg}`;

              console.warn('Native speech recognition event error:', event);
              handlers.onError?.(friendlyMsg);
              handlers.onEnd?.();
            }),
            nativeMod.addListener('end', () => {
              // End event fired: only notify if listening is no longer active
              if (!this.isListeningActive) {
                handlers.onEnd?.();
              }
            })
          );

          this.startNativeRecognition(nativeMod);
          return true;
        }
      } catch (err: any) {
        console.warn('Failed to start native speech recognition:', err);
      }
    }

    // 2. Web Speech Recognition API (Chrome, Safari, Edge, Mobile Web)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.maxAlternatives = 1;

          rec.onstart = () => {
            this.isListeningActive = true;
            handlers.onStart?.();
          };

          rec.onresult = (evt: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = evt.resultIndex; i < evt.results.length; ++i) {
              const item = evt.results[i];
              const text = item[0]?.transcript || '';
              if (item.isFinal) {
                finalTranscript += text + ' ';
              } else {
                interimTranscript += text + ' ';
              }
            }

            const combined = (finalTranscript + interimTranscript).trim();
            if (combined) {
              this.lastTranscript = combined;
              const hasFinal = finalTranscript.trim().length > 0;
              handlers.onTranscript?.(combined, hasFinal);

              if (this.silenceTimer) clearTimeout(this.silenceTimer);
              this.silenceTimer = setTimeout(() => {
                if (this.isListeningActive && this.lastTranscript) {
                  handlers.onTranscript?.(this.lastTranscript, true);
                }
              }, 1200);
            }
          };

          rec.onerror = (evt: any) => {
            if (evt.error === 'no-speech') {
              // Non-fatal silence pause, will restart onend if active
              return;
            }
            if (evt.error === 'not-allowed') {
              handlers.onError?.(
                'Microphone permission blocked. Please enable microphone permissions in your browser.'
              );
              this.stop();
            } else if (evt.error === 'network') {
              handlers.onError?.('Speech network error. You can also type or use keyboard dictation.');
            } else {
              handlers.onError?.(`Speech recognition notice: ${evt.error}`);
            }
          };

          rec.onend = () => {
            if (this.isListeningActive) {
              // Delay slightly to prevent rapid-fire restart exception in Chrome
              if (this.restartTimer) clearTimeout(this.restartTimer);
              this.restartTimer = setTimeout(() => {
                if (this.isListeningActive) {
                  try {
                    rec.start();
                  } catch {
                    this.isListeningActive = false;
                    handlers.onEnd?.();
                  }
                }
              }, 150);
            } else {
              handlers.onEnd?.();
            }
          };

          this.activeRecognition = rec;
          rec.start();
          return true;
        } catch (err: any) {
          console.warn('Failed to start web speech recognition:', err);
          handlers.onError?.('Could not initialize speech recognition. Use dictation or type below.');
          this.isListeningActive = false;
          handlers.onEnd?.();
          return false;
        }
      }
    }

    // 3. Fallback when Speech Recognition is unavailable in environment (e.g. Expo Go)
    const isMobile = Platform.OS !== 'web';
    handlers.onError?.(
      isMobile
        ? 'Voice recognition requires a Development Build (npx expo run:ios/android). In Expo Go, use keyboard dictation 🎙️ or enter details below.'
        : 'Speech recognition is not supported in this browser. Please type details or use keyboard dictation.'
    );
    this.isListeningActive = false;
    handlers.onEnd?.();
    return false;
  }

  /**
   * Internal helper to start or restart the native speech recognizer
   */
  private startNativeRecognition(nativeMod: any) {
    try {
      nativeMod.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
        iosTaskHint: 'dictation',
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'free_form',
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 3000,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2500,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2500,
        },
      });
    } catch (e) {
      console.warn('Error starting native speech recognition:', e);
    }
  }

  /**
   * Internal helper to schedule seamless restart on pause/silence timeout
   */
  private scheduleNativeRestart(nativeMod: any) {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      if (this.isListeningActive && nativeMod) {
        this.startNativeRecognition(nativeMod);
      }
    }, 180);
  }

  /**
   * Stop listening
   */
  stop(): void {
    this.isListeningActive = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.removeListeners();

    const nativeMod = getExpoSpeechRecognitionModule();
    if (Platform.OS !== 'web' && nativeMod) {
      try {
        if (typeof nativeMod.stop === 'function') {
          nativeMod.stop();
        } else if (typeof nativeMod.abort === 'function') {
          nativeMod.abort();
        }
      } catch {}
    }

    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {}
      this.activeRecognition = null;
    }
  }

  isListening(): boolean {
    return this.isListeningActive;
  }
}

export const voiceRecognition = new VoiceRecognitionService();

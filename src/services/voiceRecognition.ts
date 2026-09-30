import { Platform } from 'react-native';
// Safe dynamic loader to prevent Expo Go crashes when native binary is not compiled
function getExpoSpeechRecognitionModule(): any {
  if (Platform.OS === 'web') return null;
  try {
    // Avoid top-level unhandled requireNativeModule crash in Expo Go / environments without native binary
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-speech-recognition');
    return mod?.ExpoSpeechRecognitionModule || null;
  } catch {
    return null;
  }
}

export interface VoiceRecognitionHandlers {
  onStart?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class VoiceRecognitionService {
  private activeRecognition: any = null;
  private isListeningActive = false;
  private silenceTimer: any = null;
  private lastTranscript = '';
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
   * Check if speech recognition is available in current runtime
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return false;
      return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    }
    try {
      const nativeMod = getExpoSpeechRecognitionModule();
      if (nativeMod && typeof nativeMod.isRecognitionAvailable === 'function') {
        return nativeMod.isRecognitionAvailable();
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Start listening for voice input across Native (iOS/Android) & Web
   */
  async start(handlers: VoiceRecognitionHandlers = {}): Promise<boolean> {
    this.stop();
    this.isListeningActive = true;
    this.lastTranscript = '';

    // 1. Native Mobile Recognition (iOS & Android via ExpoSpeechRecognitionModule in custom dev builds)
    if (Platform.OS !== 'web') {
      try {
        const nativeMod = getExpoSpeechRecognitionModule();
        if (
          nativeMod &&
          typeof nativeMod.start === 'function' &&
          typeof nativeMod.addListener === 'function'
        ) {
          const perm = await nativeMod.requestPermissionsAsync();
          if (!perm.granted) {
            handlers.onError?.('Microphone & Speech Recognition permission is required. Please enable it in device settings.');
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
              const transcript = event.results?.[0]?.transcript || '';
              if (transcript) {
                this.lastTranscript = transcript;
                handlers.onTranscript?.(transcript, !!event.isFinal);

                if (this.silenceTimer) clearTimeout(this.silenceTimer);
                this.silenceTimer = setTimeout(() => {
                  if (this.isListeningActive && this.lastTranscript) {
                    handlers.onTranscript?.(this.lastTranscript, true);
                  }
                }, 1100);
              }
            }),
            nativeMod.addListener('error', (event: any) => {
              const errCode = event.error || event.message;
              if (errCode === 'no-speech' || errCode === 7) {
                // Typical silence timeout, keep listening
                return;
              }
              console.warn('Native speech recognition event error:', event);
              handlers.onError?.(`Speech recognition: ${event.message || errCode}`);
            }),
            nativeMod.addListener('end', () => {
              this.isListeningActive = false;
              handlers.onEnd?.();
            })
          );

          await nativeMod.start({
            lang: 'en-US',
            interimResults: true,
            continuous: true,
            addsPunctuation: true,
          });

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
              }, 1100);
            }
          };

          rec.onerror = (evt: any) => {
            if (evt.error === 'no-speech') return;
            if (evt.error === 'not-allowed') {
              handlers.onError?.('Microphone permission blocked. Please enable microphone permissions in browser settings.');
              this.stop();
            } else if (evt.error === 'network') {
              handlers.onError?.('Speech network error. You can also type or use keyboard dictation.');
            } else {
              handlers.onError?.(`Speech error: ${evt.error}`);
            }
          };

          rec.onend = () => {
            if (this.isListeningActive) {
              try {
                rec.start();
              } catch {
                this.isListeningActive = false;
                handlers.onEnd?.();
              }
            } else {
              handlers.onEnd?.();
            }
          };

          this.activeRecognition = rec;
          rec.start();
          return true;
        } catch (err: any) {
          console.warn('Failed to start web speech recognition:', err);
          handlers.onError?.('Could not initialize speech recognition. Use dictation or chips below.');
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
   * Stop listening
   */
  stop(): void {
    this.isListeningActive = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.removeListeners();
    const nativeMod = getExpoSpeechRecognitionModule();
    if (Platform.OS !== 'web' && nativeMod?.stop) {
      try {
        nativeMod.stop();
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

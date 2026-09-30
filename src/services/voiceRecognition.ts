import { Platform } from 'react-native';
import { requestRecordingPermissionsAsync } from 'expo-audio';

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

  /**
   * Request microphone permissions across Web & Native
   */
  async requestMicPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Release track after test
            stream.getTracks().forEach((track) => track.stop());
            return true;
          } catch (e: any) {
            console.warn('Web microphone permission denied:', e);
            return false;
          }
        }
        return true;
      } else {
        const { granted } = await requestRecordingPermissionsAsync();
        return granted;
      }
    } catch (e) {
      console.warn('Failed to request mic permissions:', e);
      return false;
    }
  }

  /**
   * Check if Web Speech Recognition is natively available
   */
  isWebSpeechAvailable(): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Start listening for voice input
   */
  async start(handlers: VoiceRecognitionHandlers = {}): Promise<boolean> {
    this.stop();
    this.isListeningActive = true;
    this.lastTranscript = '';

    const hasPermission = await this.requestMicPermission();
    if (!hasPermission) {
      handlers.onError?.('Microphone permission was not granted. Please allow microphone access to use Techna.');
      this.isListeningActive = false;
      handlers.onEnd?.();
      return false;
    }

    handlers.onStart?.();

    // 1. Web Speech Recognition API
    if (this.isWebSpeechAvailable()) {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          this.isListeningActive = true;
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

            // Silence detection: if user paused speaking for 1.2s, treat as finalized phrase
            if (this.silenceTimer) clearTimeout(this.silenceTimer);
            this.silenceTimer = setTimeout(() => {
              if (this.isListeningActive && this.lastTranscript) {
                handlers.onTranscript?.(this.lastTranscript, true);
              }
            }, 1200);
          }
        };

        rec.onerror = (evt: any) => {
          console.warn('Speech recognition error event:', evt.error);
          if (evt.error === 'not-allowed') {
            handlers.onError?.('Microphone permission blocked. Please enable it in browser settings.');
            this.stop();
          } else if (evt.error === 'no-speech') {
            // Ignore no-speech, keep listening
          } else if (evt.error === 'network') {
            handlers.onError?.('Speech network error. You can also type or use keyboard dictation.');
          }
        };

        rec.onend = () => {
          // If browser automatically stopped but user is still in listening mode, auto-restart
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
      }
    }

    return true;
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

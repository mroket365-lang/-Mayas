/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppLanguage } from '../types';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

let recognition: any = null;

const langToLocale: Record<AppLanguage, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ja: 'ja-JP',
  de: 'de-DE',
  tr: 'tr-TR',
  fr: 'fr-FR',
};

export const speechService = {
  isRecognitionSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  },

  startListening(
    lang: AppLanguage,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.isRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langToLocale[lang] || 'ar-SA';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
          const res = event.results[i];
          transcript += res[0].transcript;
          onResult(transcript, res.isFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        onError(event.error);
      };

      recognition.onend = () => {
        onEnd();
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      onError(e);
    }
  },

  stopListening() {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Stop recognition warning:', e);
      }
    }
  },

  speakText(text: string, lang: AppLanguage, speed: number = 1.0, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const cleanText = text.replace(/[*#_`~]/g, ''); // strip markdown chars
      if (!cleanText.trim()) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const locale = langToLocale[lang] || 'ar-SA';
      utterance.lang = locale;
      utterance.rate = speed;

      let hasFinished = false;
      const finishOnce = () => {
        if (!hasFinished) {
          hasFinished = true;
          if (onEnd) onEnd();
        }
      };

      // Find appropriate voice if available
      const voices = window.speechSynthesis.getVoices();
      const targetLangPrefix = lang.toLowerCase();
      const suitableVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangPrefix));
      if (suitableVoice) {
        utterance.voice = suitableVoice;
      }

      utterance.onend = () => {
        finishOnce();
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis utterance error:', err);
        finishOnce();
      };

      window.speechSynthesis.speak(utterance);

      // Safety timeout in case browser speech synthesis gets stuck
      const approxDurationMs = Math.max(2000, (cleanText.length / 10) * 1000);
      setTimeout(() => {
        if (!hasFinished && window.speechSynthesis.speaking) {
          // If still speaking after generous time, don't force cancel but allow callback if done
        }
      }, approxDurationMs + 5000);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onEnd) onEnd();
    }
  },

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};

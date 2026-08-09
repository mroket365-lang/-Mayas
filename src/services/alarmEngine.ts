import { CompanionItem } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const alarmEngine = {
  playChimeSound(type: 'alarm' | 'notification' | 'success' = 'notification') {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'alarm') {
        // High dual-tone alarm chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.2); // A5
        osc.frequency.setValueAtTime(587.33, now + 0.4);
        osc.frequency.setValueAtTime(880, now + 0.6);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'success') {
        // Soft ascending chord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.15); // C#5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.start(now);
        osc.stop(now + 0.8);
      } else {
        // Soft notification bell
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio playback failed or restricted by browser:', e);
    }
  },

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  showSystemNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }
  },

  checkDueItems(items: CompanionItem[], onDueTrigger: (item: CompanionItem) => void) {
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    items.forEach(item => {
      if (item.status === 'completed' || item.status === 'cancelled') return;

      // Check snoozed item
      if (item.status === 'snoozed' && item.snoozedUntil) {
        const snoozeDate = new Date(item.snoozedUntil);
        if (now >= snoozeDate) {
          onDueTrigger(item);
          return;
        }
      }

      // Check due date & time match
      if (item.dueDate === currentDateStr && item.dueTime) {
        if (item.dueTime === currentTimeStr && item.status === 'pending') {
          onDueTrigger(item);
        }
      }

      // Check recurring habits or daily alarms
      if (item.repeatRule === 'daily' && item.dueTime === currentTimeStr && item.status === 'pending') {
        onDueTrigger(item);
      }
    });
  }
};

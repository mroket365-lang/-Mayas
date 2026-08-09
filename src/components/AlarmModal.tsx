import React from 'react';
import { CompanionItem, UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';

interface AlarmModalProps {
  item: CompanionItem;
  profile: UserProfile;
  onSnooze: (item: CompanionItem, minutes: number) => void;
  onComplete: (item: CompanionItem) => void;
  onDismiss: () => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  item,
  profile,
  onSnooze,
  onComplete,
  onDismiss,
}) => {
  const t = getTranslation(profile.language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center space-y-6 shadow-2xl animate-bounce-subtle">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
          <Bell className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{t.alarmRinging}</span>
          <h3 className="text-xl font-black text-[var(--text-main)]">{item.title}</h3>
          {item.description && <p className="text-xs text-[var(--text-muted)]">{item.description}</p>}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => onComplete(item)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.markDone}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSnooze(item, 5)}
              className="py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] hover:bg-black/5 flex items-center justify-center gap-1 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.snooze5m}</span>
            </button>

            <button
              onClick={() => onSnooze(item, 15)}
              className="py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] hover:bg-black/5 flex items-center justify-center gap-1 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.snooze15m}</span>
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center justify-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>{t.dismissAlarm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

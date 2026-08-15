import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Heart,
  Flame,
  Zap,
  Mic,
  MicOff,
  Square,
  CheckCircle2,
  Circle,
  MessageSquare,
  Volume2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw,
  Plus
} from 'lucide-react';
import { UserProfile, CompanionItem, DailyCheckIn, MoodType, HabitCheckInStatus } from '../types';
import { speechService } from '../services/speechService';
import { alarmEngine } from '../services/alarmEngine';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  items: CompanionItem[];
  onSaveCheckIn: (checkIn: DailyCheckIn) => void;
  existingTodayCheckIn?: DailyCheckIn | null;
}

const MOOD_OPTIONS: {
  type: MoodType;
  labelAr: string;
  labelEn: string;
  emoji: string;
  score: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}[] = [
  {
    type: 'great',
    labelAr: 'رائع ومتحمس',
    labelEn: 'Great & Energized',
    emoji: '🌟',
    score: 5,
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    borderClass: 'border-emerald-500/40'
  },
  {
    type: 'good',
    labelAr: 'سعيد ومرتاح',
    labelEn: 'Good & Calm',
    emoji: '😊',
    score: 4,
    colorClass: 'text-sky-500 dark:text-sky-400',
    bgClass: 'bg-sky-500/10 hover:bg-sky-500/20',
    borderClass: 'border-sky-500/40'
  },
  {
    type: 'neutral',
    labelAr: 'عادي / هادئ',
    labelEn: 'Neutral / Okay',
    emoji: '😐',
    score: 3,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
    borderClass: 'border-amber-500/40'
  },
  {
    type: 'tired',
    labelAr: 'مرهق وبحاجة راحة',
    labelEn: 'Tired & Drained',
    emoji: '😴',
    score: 2,
    colorClass: 'text-indigo-500 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    borderClass: 'border-indigo-500/40'
  },
  {
    type: 'stressed',
    labelAr: 'متوتر ومضغوط',
    labelEn: 'Stressed / Busy',
    emoji: '😫',
    score: 2,
    colorClass: 'text-rose-500 dark:text-rose-400',
    bgClass: 'bg-rose-500/10 hover:bg-rose-500/20',
    borderClass: 'border-rose-500/40'
  },
  {
    type: 'sad',
    labelAr: 'حزين أو محبط',
    labelEn: 'Sad or Down',
    emoji: '😔',
    score: 1,
    colorClass: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-500/10 hover:bg-slate-500/20',
    borderClass: 'border-slate-500/40'
  }
];

const DEFAULT_SUGGESTED_HABITS = [
  { id: 'hab_water', titleAr: 'شرب 2 لتر ماء 💧', titleEn: 'Drink 2L Water 💧' },
  { id: 'hab_workout', titleAr: 'رياضة أو مشي 🏃‍♂️', titleEn: 'Workout or Walk 🏃‍♂️' },
  { id: 'hab_read', titleAr: 'قراءة أو تعلم 📖', titleEn: 'Reading or Learning 📖' },
  { id: 'hab_mindful', titleAr: 'صلاة أو تأمل 🧘‍♂️', titleEn: 'Meditation / Prayer 🧘‍♂️' },
  { id: 'hab_sleep', titleAr: 'نوم مبكر وكافي 🌙', titleEn: 'Adequate Sleep 🌙' }
];

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  profile,
  items,
  onSaveCheckIn,
  existingTodayCheckIn
}) => {
  const isArabic = profile.language === 'ar';
  const companionNickname = profile.addressAs || (isArabic ? 'يا غالي' : 'Friend');

  // Form State
  const [selectedMood, setSelectedMood] = useState<MoodType>(existingTodayCheckIn?.mood || 'good');
  const [energyLevel, setEnergyLevel] = useState<number>(existingTodayCheckIn?.energyLevel || 4);
  const [noteText, setNoteText] = useState<string>(existingTodayCheckIn?.note || '');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  
  // Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceInterimTranscript, setVoiceInterimTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingIntervalRef = useRef<any>(null);

  // Habits State
  const userHabits = items.filter(i => i.type === 'habit');
  const [habitStatuses, setHabitStatuses] = useState<Record<string, { title: string; completed: boolean }>>({});

  // Submission / Celebration feedback state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [companionFeedback, setCompanionFeedback] = useState<string>('');

  // Initialize habit statuses
  useEffect(() => {
    if (!isOpen) return;

    setIsSubmitted(false);
    setCompanionFeedback('');
    
    if (existingTodayCheckIn) {
      setSelectedMood(existingTodayCheckIn.mood);
      setEnergyLevel(existingTodayCheckIn.energyLevel);
      setNoteText(existingTodayCheckIn.note || '');
      setInputMode(existingTodayCheckIn.source || 'text');

      const initialHabits: Record<string, { title: string; completed: boolean }> = {};
      existingTodayCheckIn.habitsSummary.forEach(h => {
        initialHabits[h.habitId] = { title: h.habitTitle, completed: h.completed };
      });
      setHabitStatuses(initialHabits);
    } else {
      // Build initial habit list from existing user habits or default suggestions
      const initialHabits: Record<string, { title: string; completed: boolean }> = {};
      const todayStr = new Date().toISOString().split('T')[0];

      if (userHabits.length > 0) {
        userHabits.forEach(h => {
          const isDoneToday = h.status === 'completed' || (h.completedDates && h.completedDates.includes(todayStr));
          initialHabits[h.id] = { title: h.title, completed: Boolean(isDoneToday) };
        });
      } else {
        DEFAULT_SUGGESTED_HABITS.forEach(h => {
          initialHabits[h.id] = { title: isArabic ? h.titleAr : h.titleEn, completed: false };
        });
      }
      setHabitStatuses(initialHabits);
      setSelectedMood('good');
      setEnergyLevel(4);
      setNoteText('');
    }
  }, [isOpen, existingTodayCheckIn, items]);

  // Voice recording cleanup
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      speechService.stopListening();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleHabit = (id: string, title: string) => {
    setHabitStatuses(prev => ({
      ...prev,
      [id]: {
        title,
        completed: !prev[id]?.completed
      }
    }));
  };

  // Voice recording start
  const handleStartVoice = () => {
    if (isRecordingVoice) {
      handleStopVoice();
      return;
    }

    setIsRecordingVoice(true);
    setVoiceInterimTranscript('');
    setRecordingSeconds(0);
    setInputMode('voice');

    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);

    speechService.startListening(
      profile.language,
      (transcript, isFinal) => {
        setVoiceInterimTranscript(transcript);
        if (isFinal) {
          setNoteText(prev => (prev ? prev + ' ' + transcript : transcript));
          setVoiceInterimTranscript('');
        }
      },
      (err) => {
        console.warn('Voice check-in recognition error:', err);
        handleStopVoice();
      },
      () => {
        setIsRecordingVoice(false);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      }
    );
  };

  const handleStopVoice = () => {
    speechService.stopListening();
    setIsRecordingVoice(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (voiceInterimTranscript) {
      setNoteText(prev => (prev ? prev + ' ' + voiceInterimTranscript : voiceInterimTranscript));
      setVoiceInterimTranscript('');
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    setNoteText(prev => (prev ? `${prev}\n• ${prompt}: ` : `• ${prompt}: `));
  };

  // Generate friendly companion feedback response
  const generateCompanionFeedback = (mood: MoodType, completedCount: number, streakVal: number) => {
    if (isArabic) {
      let moodMsg = '';
      if (mood === 'great') {
        moodMsg = `ما شاء الله يا ${companionNickname}! طاقتك ومزاجك الرائع ينيران اليوم 🌟`;
      } else if (mood === 'good') {
        moodMsg = `الحمد لله يا ${companionNickname}، سعيد برؤيتك في مزاج طيب ومرتاح 😊`;
      } else if (mood === 'neutral') {
        moodMsg = `يوم هادئ ومستقر يا ${companionNickname}، كل خطوة وثبات تحسب لك ✨`;
      } else if (mood === 'tired') {
        moodMsg = `يعطيك ألف عافية يا ${companionNickname}. خذ قسطاً كافياً من الراحة الليلة لتستعيد كامل نشاطك ☕🌙`;
      } else if (mood === 'stressed') {
        moodMsg = `أنا معك يا ${companionNickname}. خذ نفساً عميقاً ولا تحمل نفسك أكثر من طاقتها، غداً يوم أجمل وأخف بإذن الله 🌿`;
      } else {
        moodMsg = `سلامتك يا ${companionNickname}. وجودك ومحاولاتك دائماً ثمينة، وكل عسر يتبعه يسر بإذن الله 🤍`;
      }

      const habitMsg = completedCount > 0
        ? ` أنجزت اليوم ${completedCount} من عاداتك بنجاح!`
        : '';
      const streakMsg = streakVal > 1
        ? ` وحققت سلسلة التزام ${streakVal} أيام متتالية! 🔥`
        : ' وتم تسجيل تقييمك بنجاح!';

      return `${moodMsg}${habitMsg}${streakMsg}`;
    } else {
      let moodMsg = `Great to check in with you, ${companionNickname}! `;
      if (mood === 'great' || mood === 'good') {
        moodMsg += 'Love this positive energy and momentum! 🌟';
      } else if (mood === 'tired' || mood === 'stressed') {
        moodMsg += 'Make sure to get restful sleep tonight. You did great today! 🌿';
      } else {
        moodMsg += 'Taking a moment for self-reflection makes every day better. 🤍';
      }
      return `${moodMsg} (${completedCount} habits checked, ${streakVal}d streak 🔥)`;
    }
  };

  // Save Check-in
  const handleSave = () => {
    const selectedMoodObj = MOOD_OPTIONS.find(m => m.type === selectedMood) || MOOD_OPTIONS[1];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const habitsSummary: HabitCheckInStatus[] = Object.entries(habitStatuses).map(([habitId, h]) => ({
      habitId,
      habitTitle: h.title,
      completed: h.completed
    }));

    const finalCheckIn: DailyCheckIn = {
      id: existingTodayCheckIn?.id || `checkin_${Date.now()}`,
      date: todayStr,
      time: timeStr,
      mood: selectedMood,
      moodScore: selectedMoodObj.score,
      energyLevel,
      note: noteText.trim() || undefined,
      habitsSummary,
      source: inputMode,
      createdAt: existingTodayCheckIn?.createdAt || now.toISOString()
    };

    const completedHabitsCount = habitsSummary.filter(h => h.completed).length;
    const currentStreak = (profile.checkInStreak || 0) + (existingTodayCheckIn ? 0 : 1);
    const feedback = generateCompanionFeedback(selectedMood, completedHabitsCount, currentStreak);

    setCompanionFeedback(feedback);
    setIsSubmitted(true);
    alarmEngine.playChimeSound('success');

    // Save to storage and notify
    onSaveCheckIn(finalCheckIn);

    // Speak companion warm feedback if speech is enabled
    if (profile.alarmSoundEnabled) {
      speechService.speakText(feedback, profile.language, profile.voiceSpeed || 1.0);
    }
  };

  const completedHabitsCount = Object.values(habitStatuses).filter(h => h.completed).length;
  const totalHabitsCount = Object.keys(habitStatuses).length;

  return (
    <div
      id="daily-checkin-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Title & Streak */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
                  {isArabic ? 'التقييم اليومي والمزاج' : 'Daily Mood & Habit Check-in'}
                </h2>
                {(profile.checkInStreak || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    {profile.checkInStreak} {isArabic ? 'يوم' : 'days'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isArabic ? `كيف كان يومك يا ${companionNickname}؟` : `How was your day, ${companionNickname}?`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={isArabic ? 'إغلاق' : 'Close'}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {isSubmitted ? (
            /* Celebration Screen */
            <div className="text-center py-6 sm:py-8 space-y-4 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <Award className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">
                  {isArabic ? 'تم حفظ التقييم بنجاح! ✨' : 'Check-in Saved Successfully! ✨'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                  {isArabic ? 'تم تحديث إحصائياتك وسجل المزاج في بروفايلك' : 'Your profile stats and mood streak have been updated'}
                </p>
              </div>

              {companionFeedback && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-right rtl:text-right ltr:text-left text-sm text-[var(--text-main)] leading-relaxed shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>{isArabic ? 'رسالة الرفيق لك:' : "Companion's Message:"}</span>
                  </div>
                  <p>{companionFeedback}</p>
                </div>
              )}

              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-2xl bg-[var(--accent-sage)] text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {isArabic ? 'تم، شكراً لك' : 'Done, Thank You'}
                </button>
              </div>
            </div>
          ) : (
            /* Check-in Interactive Steps */
            <>
              {/* Step 1: Mood Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                  1. {isArabic ? 'كيف تصف مزاجك وشعورك العام اليوم؟' : 'How is your general mood today?'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {MOOD_OPTIONS.map(opt => {
                    const isSelected = selectedMood === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSelectedMood(opt.type)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                          isSelected
                            ? `${opt.bgClass} ${opt.borderClass} ring-2 ring-emerald-500/40 shadow-sm scale-105`
                            : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl mb-1 filter drop-shadow-sm">{opt.emoji}</span>
                        <span className={`text-[11px] font-bold text-center leading-tight ${opt.colorClass}`}>
                          {isArabic ? opt.labelAr.split(' ')[0] : opt.labelEn.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Energy Level */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    {isArabic ? 'مستوى طاقتك ونشاطك:' : 'Energy & Vitality Level:'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {energyLevel} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1.5">
                  <span>{isArabic ? 'منخفض 😴' : 'Low 😴'}</span>
                  <span>{isArabic ? 'متوسط ⚡' : 'Moderate ⚡'}</span>
                  <span>{isArabic ? 'طاقة عالية 🔥' : 'Peak High 🔥'}</span>
                </div>
              </div>

              {/* Step 3: Habits Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    2. {isArabic ? 'تحديث العادات المنجزة اليوم' : 'Daily Habits Completed'}
                  </label>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {completedHabitsCount} / {totalHabitsCount} {isArabic ? 'مكتمل' : 'done'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {Object.entries(habitStatuses).map(([id, habit]) => {
                    const isDone = habit.completed;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleToggleHabit(id, habit.title)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-right rtl:text-right ltr:text-left ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--text-main)] font-semibold'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{habit.title}</span>
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Voice or Text Reflection Note */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    3. {isArabic ? 'ملاحظة أو تسجيل صوتي سريع (اختياري)' : 'Brief Reflection / Voice (Optional)'}
                  </label>

                  <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        inputMode === 'text'
                          ? 'bg-[var(--accent-sage)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {isArabic ? 'نص ✍️' : 'Text ✍️'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('voice')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        inputMode === 'voice'
                          ? 'bg-[var(--accent-sage)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {isArabic ? 'صوت 🎙️' : 'Voice 🎙️'}
                    </button>
                  </div>
                </div>

                {inputMode === 'voice' ? (
                  /* Voice Recording Box */
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={isRecordingVoice ? handleStopVoice : handleStartVoice}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                          isRecordingVoice
                            ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30'
                        }`}
                      >
                        {isRecordingVoice ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[var(--text-main)]">
                        {isRecordingVoice
                          ? isArabic
                            ? `جاري الاستماع... (${recordingSeconds} ثانية) اضغط للتوقف`
                            : `Listening... (${recordingSeconds}s) tap to stop`
                          : isArabic
                          ? 'اضغط على المايك وتحدث عن يومك'
                          : 'Tap mic and speak about your day'}
                      </p>
                      {voiceInterimTranscript && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 italic bg-emerald-500/10 p-2 rounded-xl">
                          "{voiceInterimTranscript}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Textarea for note text */}
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={
                      isArabic
                        ? 'ما الذي جعلك تشعر بالرضا اليوم؟ أو أي تحدي تود تدوينه...'
                        : 'What made you feel proud today? Or any reflection...'
                    }
                    className="w-full p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-main)] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                  />

                  {/* Quick Reflection Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPromptClick(isArabic ? 'إنجاز فخور به' : 'Proud achievement')}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-emerald-500/30 transition-colors"
                    >
                      🌟 {isArabic ? 'إنجاز مميز' : 'Achievement'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPromptClick(isArabic ? 'شيء ممتن له' : 'Grateful for')}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-emerald-500/30 transition-colors"
                    >
                      🤍 {isArabic ? 'امتنان' : 'Gratitude'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPromptClick(isArabic ? 'هدف الغد' : "Tomorrow's goal")}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-emerald-500/30 transition-colors"
                    >
                      🎯 {isArabic ? 'هدف الغد' : "Tomorrow's goal"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSubmitted && (
          <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {isArabic ? 'تخطي اليوم' : 'Skip Today'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isArabic ? 'حفظ التقييم اليومي' : 'Save Check-in'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

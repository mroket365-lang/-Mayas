import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, CompanionItem } from '../types';
import { getTranslation } from '../locales/translations';
import {
  Send,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  Calendar,
  Bell,
  BookmarkCheck,
  MicOff,
  Square,
  Paperclip,
  X,
  ShieldCheck,
  Image as ImageIcon,
  Film,
  SendHorizontal,
  Radio,
  Copy,
  Scissors,
  Flame,
  HeartHandshake,
  Plus,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { speechService } from '../services/speechService';
import { AudioWaveform } from './AudioWaveform';
import { SnippetExtractorModal } from './SnippetExtractorModal';

interface CompanionViewProps {
  messages: ChatMessage[];
  profile: UserProfile;
  items: CompanionItem[];
  onOpenMaritalSupport?: () => void;
  onSendMessage: (
    text: string,
    media?: { base64: string; mimeType: string; name: string; type: 'image' | 'video' | 'audio' }
  ) => Promise<void>;
  isLoading: boolean;
  onOpenPermissions: () => void;
}

interface ChatMessageItemProps {
  msg: ChatMessage;
  isLast: boolean;
  isLoading: boolean;
  profile: UserProfile;
  copiedMsgId: string | null;
  speakingMsgId: string | null;
  onCopyMessage: (id: string, text: string) => void;
  onExtractText: (text: string) => void;
  onToggleSpeech: (id: string, text: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  msg,
  isLast,
  isLoading,
  profile,
  copiedMsgId,
  speakingMsgId,
  onCopyMessage,
  onExtractText,
  onToggleSpeech,
}) => {
  const timeString = React.useMemo(() => {
    try {
      return new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [msg.timestamp]);

  return (
    <div
      className={`flex flex-col ${
        msg.sender === 'user' ? 'items-end' : 'items-start'
      } space-y-1.5 animate-fade-in`}
    >
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
          msg.sender === 'user'
            ? 'bg-[var(--accent-sage)] text-white rounded-br-none'
            : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] rounded-bl-none'
        }`}
      >
        {/* Display attached image, video, or audio */}
        {msg.mediaUrl && (
          <div className="mb-2.5 rounded-2xl overflow-hidden border border-black/10 max-w-xs">
            {msg.mediaType === 'video' ? (
              <video
                src={msg.mediaUrl}
                controls
                className="w-full max-h-56 object-cover rounded-2xl"
              />
            ) : msg.mediaType === 'audio' ? (
              <audio
                src={msg.mediaUrl}
                controls
                className="w-full py-1 px-1 rounded-2xl"
              />
            ) : (
              <img
                src={msg.mediaUrl}
                alt="Attached media"
                className="w-full max-h-56 object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap select-text">
          {msg.text}
          {isLoading && isLast && msg.sender === 'ai' && (
            <span className="inline-block w-2 h-4 bg-[var(--accent-sage)] ml-1 animate-pulse rounded-full align-middle" />
          )}
        </p>

        {/* Executed Action Cards */}
        {msg.actionsTaken && msg.actionsTaken.length > 0 && (
          <div className="mt-3 pt-2 border-t border-black/10 space-y-1.5">
            {msg.actionsTaken.map((act, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/10 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {act.itemType === 'appointment' && <Calendar className="w-4 h-4 text-emerald-500" />}
                  {act.itemType === 'alarm' && <Bell className="w-4 h-4 text-amber-500" />}
                  {act.itemType === 'task' && <Check className="w-4 h-4 text-blue-500" />}
                  {act.itemType === 'memory' && <BookmarkCheck className="w-4 h-4 text-purple-500" />}
                  <span className="font-bold">
                    {act.itemType === 'memory'
                      ? `${profile.language === 'ar' ? '🧠 تذكّر الرفيق:' : '🧠 Learned:'} ${act.title}`
                      : act.title}
                  </span>
                </div>
                {act.details && (
                  <span className="opacity-70 text-[10px] bg-black/10 px-2 py-0.5 rounded-full">
                    {act.details}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Footer Toolbar: Time, Copy, TTS Play/Stop, Snippet Extractor */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-[10px] text-[var(--text-muted)] font-medium">
          {timeString}
        </span>

        {/* Copy Entire Message Button */}
        <button
          onClick={() => onCopyMessage(msg.id, msg.text)}
          className={`p-1.5 rounded-xl transition-all ${
            copiedMsgId === msg.id
              ? 'bg-emerald-500/10 text-emerald-600 font-bold'
              : 'text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:bg-[var(--bg-hover)]'
          }`}
          title={profile.language === 'ar' ? 'نسخ الرسالة كاملة' : 'Copy entire message'}
        >
          {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Snippet Extractor Button */}
        <button
          onClick={() => onExtractText(msg.text)}
          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:bg-[var(--bg-hover)] transition-all"
          title={profile.language === 'ar' ? 'تحديد ونسخ نص/أجزاء منفصلة' : 'Extract & copy text snippet'}
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        {/* Play / Stop Reading TTS Button for AI Messages */}
        {msg.sender === 'ai' && (
          <button
            onClick={() => onToggleSpeech(msg.id, msg.text)}
            className={`p-1.5 rounded-xl transition-all flex items-center gap-1 ${
              speakingMsgId === msg.id
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:bg-[var(--bg-hover)]'
            }`}
            title={
              speakingMsgId === msg.id
                ? (profile.language === 'ar' ? 'إيقاف قراءة الرسالة' : 'Stop reading message')
                : (profile.language === 'ar' ? 'تشغيل قراءة الرسالة' : 'Read message aloud')
            }
          >
            {speakingMsgId === msg.id ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[9px]">{profile.language === 'ar' ? 'إيقاف' : 'Stop'}</span>
              </>
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

export const CompanionView: React.FC<CompanionViewProps> = ({
  messages,
  profile,
  items,
  onOpenMaritalSupport,
  onSendMessage,
  isLoading,
  onOpenPermissions,
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [activeAudioStream, setActiveAudioStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Live Continuous Voice Conversation & Plus Menu States
  const [isContinuousVoiceMode, setIsContinuousVoiceMode] = useState(true);
  const [liveVoiceStatus, setLiveVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [aiSpokenText, setAiSpokenText] = useState<string>('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);

  // MediaRecorder & Navigation refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const plusMenuRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Keep messagesRef in sync with current messages prop
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Click outside to close plus menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollH, 44), 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Attached media state
  const [attachedMedia, setAttachedMedia] = useState<{
    base64: string;
    mimeType: string;
    name: string;
    type: 'image' | 'video' | 'audio';
  } | null>(null);

  // Copy, TTS, Snippet extractor state
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [extractingText, setExtractingText] = useState<string | null>(null);

  const handleCopyMessage = React.useCallback((msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  }, []);

  const handleToggleSpeech = React.useCallback((msgId: string, text: string) => {
    setSpeakingMsgId((prevSpeaking) => {
      if (prevSpeaking === msgId) {
        speechService.stopSpeaking();
        return null;
      } else {
        speechService.stopSpeaking();
        speechService.speakText(text, profile.language, profile.voiceSpeed || 1.0, () => {
          setSpeakingMsgId(null);
        });
        return msgId;
      }
    });
  }, [profile.language, profile.voiceSpeed]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const t = getTranslation(profile.language);

  const [thinkingIndex, setThinkingIndex] = useState(0);

  const companionName =
    profile.displayName ||
    (profile.language === 'ar'
      ? profile.companionGender === 'female'
        ? 'رفيقتك'
        : 'رفيقك'
      : 'Companion');

  const isFemale = profile.companionGender === 'female';

  const arThinkingPhrases = [
    `${companionName} ${isFemale ? 'تفكر' : 'يفكر'}...`,
    `${companionName} ${isFemale ? 'تكتب' : 'يكتب'}...`,
    'جاري تحليل الطلب...',
    `${isFemale ? 'تجهز' : 'يجهز'} الرد بدقة...`,
    `${companionName} ${isFemale ? 'تراجع' : 'يراجع'} التفاصيل...`,
  ];

  const enThinkingPhrases = [
    `${companionName} is thinking...`,
    `${companionName} is typing...`,
    'Analyzing request...',
    'Preparing response...',
    'Checking details...',
  ];

  const currentThinkingText =
    profile.language === 'ar'
      ? arThinkingPhrases[thinkingIndex % arThinkingPhrases.length]
      : enThinkingPhrases[thinkingIndex % enThinkingPhrases.length];

  useEffect(() => {
    let interval: any = null;
    if (isLoading) {
      setThinkingIndex(0);
      interval = setInterval(() => {
        setThinkingIndex((prev) => prev + 1);
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const prevMsgLengthRef = useRef(messages.length);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNewMessage = messages.length !== prevMsgLengthRef.current;
    prevMsgLengthRef.current = messages.length;

    const timer = setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isNewMessage ? 'smooth' : 'auto',
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages.length, isLoading, messages[messages.length - 1]?.text]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedMedia) || isLoading) return;

    const textToSend = inputText;
    const mediaToSend = attachedMedia;

    setInputText('');
    setAttachedMedia(null);

    await onSendMessage(textToSend, mediaToSend || undefined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isDoc = file.type.includes('pdf') || file.type.includes('text') || file.type.includes('document') || file.name.endsWith('.txt') || file.name.endsWith('.pdf');

    if (!isImage && !isVideo && !isAudio && !isDoc) {
      alert(
        profile.language === 'ar'
          ? 'يرجى اختيار صورة، فيديو، ملف صوتي، أو مستند نصي/PDF'
          : 'Please select an image, video, audio file, or document'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachedMedia({
        base64: result,
        mimeType: file.type || 'application/octet-stream',
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startVoiceInteraction = async () => {
    setIsVoiceOverlayOpen(true);
    setIsListening(true);
    setMicPermissionError(false);
    setLiveVoiceStatus('listening');
    setVoiceInterimText('');
    accumulatedTranscriptRef.current = '';
    setRecordingSeconds(0);

    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setActiveAudioStream(stream);

        try {
          const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? { mimeType: 'audio/webm;codecs=opus' }
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? { mimeType: 'audio/mp4' }
            : undefined;

          const recorder = new MediaRecorder(stream, options);
          audioChunksRef.current = [];

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          recorder.start(200);
          mediaRecorderRef.current = recorder;
        } catch (e) {
          console.warn('MediaRecorder setup error:', e);
        }
      } else {
        throw new Error('getUserMedia not supported');
      }
    } catch (err) {
      console.warn('Could not acquire raw stream / permission denied:', err);
      setMicPermissionError(true);
      setIsListening(false);
      setLiveVoiceStatus('idle');
      return;
    }

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    speechService.startListening(
      profile.language,
      (transcript) => {
        if (transcript.trim()) {
          accumulatedTranscriptRef.current = transcript;
          setVoiceInterimText(transcript);
        }
      },
      (err) => {
        console.warn('Speech recognition warning:', err);
      },
      () => {
        // Recognition complete
      }
    );
  };

  const stopVoiceInteraction = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    speechService.stopListening();
    speechService.stopSpeaking();

    if (activeAudioStream) {
      activeAudioStream.getTracks().forEach((track) => track.stop());
      setActiveAudioStream(null);
    }

    setIsListening(false);
    setIsVoiceOverlayOpen(false);
    setLiveVoiceStatus('idle');
  };

  const handleCancelVoice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    const text = (voiceInterimText || accumulatedTranscriptRef.current).trim();
    if (text) {
      setInputText(text);
    }
    stopVoiceInteraction();
  };

  const handleSendVoiceImmediately = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    speechService.stopListening();

    // Stop MediaRecorder and assemble recorded Audio Blob
    let audioBlob: Blob | null = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch (e) {
          resolve();
        }
      });
    }

    if (audioChunksRef.current.length > 0) {
      const mimeType = recorder?.mimeType || 'audio/webm';
      audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    }

    if (activeAudioStream) {
      activeAudioStream.getTracks().forEach((track) => track.stop());
      setActiveAudioStream(null);
    }

    setIsListening(false);
    setLiveVoiceStatus('thinking');

    let audioMedia:
      | { base64: string; mimeType: string; name: string; type: 'audio' }
      | undefined = undefined;

    if (audioBlob && audioBlob.size > 0) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      audioMedia = {
        base64: base64Data,
        mimeType: audioBlob.type || 'audio/webm',
        name: 'voice_recording.webm',
        type: 'audio',
      };
    }

    const liveTranscript = (voiceInterimText || accumulatedTranscriptRef.current).trim();
    const textToSend =
      liveTranscript ||
      (profile.language === 'ar' ? '🎙️ تسجيل صوتي' : '🎙️ Voice recording');

    setVoiceInterimText('');
    accumulatedTranscriptRef.current = '';

    // Send message to AI
    await onSendMessage(textToSend, audioMedia || attachedMedia || undefined);
    setAttachedMedia(null);

    // Speak AI Response Aloud using updated messagesRef
    const latestMsgs = messagesRef.current;
    const latestAiMessage = [...latestMsgs].reverse().find((m) => m.sender === 'ai');
    const replyToSpeak = latestAiMessage?.text || '';

    if (replyToSpeak) {
      setAiSpokenText(replyToSpeak);
      setLiveVoiceStatus('speaking');
      speechService.speakText(replyToSpeak, profile.language, profile.voiceSpeed || 1.0, () => {
        if (isContinuousVoiceMode) {
          // Restart hands-free continuous voice listening loop
          startVoiceInteraction();
        } else {
          setLiveVoiceStatus('idle');
          setIsVoiceOverlayOpen(false);
        }
      });
    } else if (isContinuousVoiceMode) {
      startVoiceInteraction();
    } else {
      setIsVoiceOverlayOpen(false);
      setLiveVoiceStatus('idle');
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto relative min-h-0 overflow-hidden flex-1">
      {(profile.privateCandidMode || profile.personality === 'bold') && (
        <div className="mx-3 mt-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between gap-2 shadow-sm animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span>
              {profile.language === 'ar'
                ? 'نمط الحوارات الخاصة والصريحة مفعّل: الذكاء الاصطناعي يتفاعل معك بجرأة وصدق وشفافية تامّة.'
                : 'Private Candid Mode Enabled: Bold, direct & transparent AI responses active.'}
            </span>
          </div>
        </div>
      )}

      {profile.specialCounselingEnabled &&
        profile.specialCounselingExpiresAt &&
        new Date(profile.specialCounselingExpiresAt).getTime() > Date.now() && (
          <div
            onClick={onOpenMaritalSupport}
            className="mx-3 mt-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-500/15 via-pink-500/15 to-amber-500/15 border border-rose-500/40 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2 shadow-sm animate-fade-in shrink-0 cursor-pointer hover:border-rose-500 transition-all"
          >
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
              <span>
                {profile.language === 'ar'
                  ? 'جلسة الاستشارة والدعم الزوجي نشطة: يمكنك طرح أسئلتك حول العلاقة الحميمة بوضوح وصراحة للحصول على إرشادات مخصصة.'
                  : 'Marital Support Session Active: Ask questions with complete clarity for direct guidance.'}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 font-extrabold shrink-0">
              {profile.language === 'ar' ? 'عرض الجلسة' : 'View'}
            </span>
          </div>
        )}

      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-12 sm:pb-16">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 animate-fade-in">
            <div className="p-4 rounded-3xl bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {profile.language === 'ar'
                  ? `مرحباً بك ${profile.addressAs} ❤️`
                  : `Hello ${profile.addressAs} ❤️`}
              </h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md mt-2 leading-relaxed">
                {profile.language === 'ar'
                  ? 'تحدث معي بصوتك، أو شاركني صورك وفيديوهاتك، ومواعيدك وأهدافك. أنا رفيقك الشخصي أستمع وأتذكر معك دائماً.'
                  : 'Speak with your voice, share photos & videos, or talk about your tasks and goals. I am your personal companion.'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={onOpenPermissions}
                className="px-4 py-2 rounded-2xl border border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-bold text-xs flex items-center gap-1.5 transition-all hover:bg-[var(--accent-sage)]/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t.permissionsTitle}</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {[
                profile.language === 'ar' ? 'بكرة الساعة 4 عندي مقابلة' : 'Tomorrow at 4 PM meeting',
                profile.language === 'ar' ? 'ذكرني أجهز الأوراق' : 'Remind me to prepare papers',
                profile.language === 'ar' ? 'صحيني الساعة 7' : 'Wake me up at 7 AM',
                profile.language === 'ar' ? 'تعبت اليوم في الدوام' : 'Had a long day at work',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  className="px-3.5 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-main)] transition-all"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessageItem
              key={msg.id}
              msg={msg}
              isLast={idx === messages.length - 1}
              isLoading={isLoading}
              profile={profile}
              copiedMsgId={copiedMsgId}
              speakingMsgId={speakingMsgId}
              onCopyMessage={handleCopyMessage}
              onExtractText={setExtractingText}
              onToggleSpeech={handleToggleSpeech}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] w-max text-xs text-[var(--accent-sage)] font-bold shadow-sm animate-fade-in">
            <Sparkles className="w-4 h-4 animate-spin text-[var(--accent-sage)] shrink-0" />
            <span className="transition-all duration-300 min-w-[130px]">{currentThinkingText}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Input for Photos and Videos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*"
        className="hidden"
      />

      {/* Bottom Text, Media, & Voice Bar */}
      <div className="shrink-0 z-30 bg-[var(--bg-surface)] border-t border-[var(--border-color)] p-2.5 sm:p-3 shadow-lg rounded-t-2xl sm:rounded-t-3xl">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Attachment Thumbnail Preview */}
          {attachedMedia && (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {attachedMedia.type === 'image' ? (
                  <img
                    src={attachedMedia.base64}
                    alt="Thumbnail"
                    className="w-10 h-10 object-cover rounded-xl border"
                  />
                ) : attachedMedia.type === 'audio' ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Film className="w-5 h-5" />
                  </div>
                )}
                <div className="truncate text-xs">
                  <p className="font-bold text-[var(--text-main)] truncate">{attachedMedia.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] capitalize">{attachedMedia.type}</p>
                </div>
              </div>

              <button
                onClick={() => setAttachedMedia(null)}
                className="p-1.5 rounded-xl hover:bg-black/10 text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-1.5 sm:gap-2 relative">
            {/* When typing (inputText.trim().length > 0), hide paperclip and mic buttons, show single + button */}
            {inputText.trim().length > 0 ? (
              <div className="relative shrink-0 mb-0.5" ref={plusMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all shrink-0 ${
                    isPlusMenuOpen
                      ? 'bg-[var(--accent-sage)] text-white border-[var(--accent-sage)]'
                      : 'bg-[var(--bg-hover)] text-[var(--accent-sage)] border-[var(--border-color)] hover:bg-[var(--accent-sage)]/10'
                  }`}
                  title={profile.language === 'ar' ? 'إضافة خيارات' : 'Add options'}
                >
                  <Plus className={`w-5 h-5 transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
                </button>

                {/* Popover options menu */}
                {isPlusMenuOpen && (
                  <div className="absolute bottom-full mb-2 start-0 z-50 w-56 p-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl space-y-1 animate-scale-up">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] flex items-center gap-2.5 transition-all text-start"
                    >
                      <Paperclip className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
                      <span>{profile.language === 'ar' ? 'رفع صورة أو مستند' : 'Attach Photo or Document'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        startVoiceInteraction();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] flex items-center gap-2.5 transition-all text-start"
                    >
                      <Mic className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{profile.language === 'ar' ? 'المحادثة الصوتية المباشرة' : 'Live Voice Conversation'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* When NOT typing (inputText is empty), show default Paperclip & Mic buttons */
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-sage)] transition-all shrink-0 mb-0.5"
                  title={t.attachMedia}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={startVoiceInteraction}
                  className="p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-hover)] text-[var(--accent-sage)] hover:bg-[var(--accent-sage)]/10 transition-all shadow-sm shrink-0 mb-0.5"
                  title={t.voiceMode}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Clear, Multi-line Auto-Expanding Textarea with Defined Borders & Return Line-Break Behavior */}
            <div className="relative flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Do NOT submit form on Enter!
                    // Allow Enter key / Return arrow on soft keyboards to insert a new line \n naturally
                    e.stopPropagation();
                  }
                }}
                placeholder={t.typeMessage}
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs sm:text-sm font-medium leading-relaxed focus:outline-none focus:border-[var(--accent-sage)] focus:ring-2 focus:ring-[var(--accent-sage)]/20 shadow-inner resize-none transition-all"
                style={{ minHeight: '44px', maxHeight: '160px' }}
              />
            </div>

            <button
              type="submit"
              disabled={(!inputText.trim() && !attachedMedia) || isLoading}
              className="p-2.5 sm:p-3 rounded-2xl bg-[var(--accent-sage)] text-white disabled:opacity-40 hover:opacity-90 transition-all shadow-md shrink-0 mb-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Real-time Live Audio Voice Mode Fullscreen Overlay */}
      {isVoiceOverlayOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950/95 text-white backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="w-full flex justify-between items-center max-w-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="font-bold text-sm tracking-wide">
                {profile.language === 'ar' ? 'الحديث المباشر (صوت وصوت)' : 'Live Voice Conversation'}
              </span>
            </div>

            {/* Timer Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{formatSeconds(recordingSeconds)}</span>
            </div>

            <button
              onClick={handleCancelVoice}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {micPermissionError ? (
            /* Microphone Permission Denied / Error Banner */
            <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 max-w-sm text-center space-y-4 my-auto animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 shadow-inner">
                <MicOff className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-rose-300">
                  {profile.language === 'ar' ? 'مطلوب الإذن بالوصول للميكروفون' : 'Microphone Permission Required'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {profile.language === 'ar'
                    ? 'تعذر الوصول إلى الميكروفون. يرجى التوجه لإعدادات المتصفح وإعطاء الإذن لاستخدام المايك حتى يستمع إليك رفيقك ويجيبك.'
                    : 'Microphone access could not be acquired. Please allow microphone permissions in browser settings.'}
                </p>
              </div>
              <button
                type="button"
                onClick={startVoiceInteraction}
                className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-xs shadow-lg transition-all"
              >
                {profile.language === 'ar' ? 'إعادة المحاولة والموافقة على الإذن 🎙️' : 'Retry & Grant Permission 🎙️'}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center text-center space-y-6 my-auto">
              {/* Audio Waveform Real-time Visualizer */}
              <div className="w-full">
                <AudioWaveform isListening={liveVoiceStatus === 'listening' || isListening} stream={activeAudioStream} />
              </div>

              {/* Live Status Indicator */}
              <div className="space-y-1">
                <p className="text-xl font-black text-emerald-300">
                  {liveVoiceStatus === 'speaking'
                    ? (profile.language === 'ar' ? '🔊 الرفيق يتحدث الآن...' : '🔊 Companion is speaking...')
                    : liveVoiceStatus === 'thinking'
                    ? (profile.language === 'ar' ? '🧠 الرفيق يفكر ويجهز الإجابة...' : '🧠 Companion is thinking...')
                    : (profile.language === 'ar' ? '🎙️ يستمع لصوتك الآن...' : '🎙️ Listening to your voice...')}
                </p>
                <p className="text-xs text-slate-400">
                  {profile.language === 'ar'
                    ? 'تحدث بحرية، وسيقوم الرفيق بالرد عليك صوتياً مباشرة'
                    : 'Speak freely, your companion responds aloud directly'}
                </p>
              </div>

              {/* Continuous Voice Loop Toggle */}
              <button
                type="button"
                onClick={() => setIsContinuousVoiceMode(!isContinuousVoiceMode)}
                className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  isContinuousVoiceMode
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/10 border-white/20 text-slate-400'
                }`}
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>
                  {isContinuousVoiceMode
                    ? (profile.language === 'ar' ? 'حوار مستمر تلقائياً (تفاعل صوتي دون انقطاع)' : 'Auto Continuous Dialogue ON')
                    : (profile.language === 'ar' ? 'تفعيل الحوار المستمر' : 'Enable Continuous Dialogue')}
                </span>
              </button>

              {voiceInterimText ? (
                <p className="text-base text-slate-200 max-w-md bg-white/10 p-4 rounded-2xl border border-white/10 italic">
                  "{voiceInterimText}"
                </p>
              ) : aiSpokenText && liveVoiceStatus === 'speaking' ? (
                <p className="text-sm text-emerald-200 max-w-md bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 leading-relaxed">
                  "{aiSpokenText}"
                </p>
              ) : null}
            </div>
          )}

          {/* Action Buttons: Prominent Send Voice button and Cancel button */}
          <div className="w-full max-w-md flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSendVoiceImmediately}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all"
            >
              <SendHorizontal className="w-5 h-5" />
              <span>{profile.language === 'ar' ? 'إرسال وتحاور صوتياً 🚀' : 'Send & Talk Aloud 🚀'}</span>
            </button>

            <button
              type="button"
              onClick={handleCancelVoice}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <X className="w-4 h-4" />
              <span>{profile.language === 'ar' ? 'إغلاق المحادثة الصوتية' : 'Close Voice Chat'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Snippet Extractor Modal */}
      {extractingText && (
        <SnippetExtractorModal
          text={extractingText}
          profile={profile}
          isOpen={!!extractingText}
          onClose={() => setExtractingText(null)}
        />
      )}
    </div>
  );
};

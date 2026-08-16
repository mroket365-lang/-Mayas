import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { UserProfile, CompanionItem, ChatMessage } from './types';
import { storageService } from './services/storageService';
import { alarmEngine } from './services/alarmEngine';
import { speechService } from './services/speechService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CompanionView } from './components/CompanionView';
import { SavedView } from './components/SavedView';
import { TodayView } from './components/TodayView';
import { ProfileView } from './components/ProfileView';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { AlarmModal } from './components/AlarmModal';
import { PermissionsModal } from './components/PermissionsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { StatsModal } from './components/StatsModal';
import { MaritalCounselingModal } from './components/MaritalCounselingModal';
import { AuthModal } from './components/AuthModal';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { AdminPanel } from './admin/AdminPanel';
import { realtimeClient } from './services/realtimeClient';
import { FeatureGateProvider } from './context/FeatureGateContext';

export interface SystemPublicSettings {
  maintenanceMode: boolean;
  newRegistrationsEnabled: boolean;
  multiAIEnabled: boolean;
  voiceEnabled: boolean;
  privateCandidAllowed: boolean;
  maritalSupportAllowed: boolean;
  privateCandidMode: string;
  maritalSupportMode: string;
  updatedAt: string;
  plans: any[];
  paymentMethods: any[];
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin');
  });

  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [items, setItems] = useState<CompanionItem[]>(() => storageService.getItems());
  const [messages, setMessages] = useState<ChatMessage[]>(() => storageService.getMessages());
  const [activeTab, setActiveTab] = useState<'companion' | 'saved' | 'today' | 'profile'>('companion');

  const [systemSettings, setSystemSettings] = useState<SystemPublicSettings | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMaritalSupportOpen, setIsMaritalSupportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState<CompanionItem | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [dailyReviewText, setDailyReviewText] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);

  const handleLogout = () => {
    const { profile: guestProfile, items: emptyItems, messages: emptyMessages } = storageService.resetToGuestSession();
    setProfile(guestProfile);
    setItems(emptyItems);
    setMessages(emptyMessages);
  };

  // Cloud User Data Fetcher (fetches latest authoritative data from server)
  const fetchCloudUserData = useCallback(async (uid?: string, email?: string) => {
    const targetUid = uid || profile.id;
    const targetEmail = email || profile.email;
    if (!targetUid && !targetEmail) return;
    if (targetUid === 'user_default_01' && !targetEmail) return;

    try {
      const query = new URLSearchParams();
      if (targetUid) query.set('userId', targetUid);
      if (targetEmail) query.set('email', targetEmail);
      query.set('_t', Date.now().toString());

      const res = await fetch(`/api/user/data?${query.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.profileData) {
            setProfile((prev) => {
              const merged: UserProfile = {
                ...prev,
                ...json.profileData,
                id: json.user?.id || prev.id,
                email: json.user?.email || prev.email,
                displayName: json.profileData.displayName || json.profileData.name || json.user?.name || prev.displayName,
                addressAs: json.profileData.addressAs || json.user?.addressAs || prev.addressAs,
              };
              storageService.saveProfile(merged);
              return merged;
            });
          }
          if (Array.isArray(json.messagesData) && json.messagesData.length > 0) {
            setMessages((prev) => {
              const msgMap = new Map<string, ChatMessage>();
              prev.forEach((m) => { if (m?.id) msgMap.set(m.id, m); });
              json.messagesData.forEach((m: ChatMessage) => { if (m?.id) msgMap.set(m.id, m); });
              const merged = Array.from(msgMap.values()).sort(
                (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
              );
              storageService.saveMessages(merged);
              return merged;
            });
          }
          if (Array.isArray(json.itemsData) && json.itemsData.length > 0) {
            setItems((prev) => {
              const itemMap = new Map<string, CompanionItem>();
              prev.forEach((it) => { if (it?.id) itemMap.set(it.id, it); });
              json.itemsData.forEach((it: CompanionItem) => { if (it?.id) itemMap.set(it.id, it); });
              const merged = Array.from(itemMap.values());
              storageService.saveItems(merged);
              return merged;
            });
          }
        }
      }
    } catch (err) {
      console.warn('Cloud sync fetch failed:', err);
    }
  }, [profile.id, profile.email]);

  // Initial cloud sync on mount and when login ID changes
  useEffect(() => {
    if (profile.id && profile.id !== 'user_default_01') {
      fetchCloudUserData(profile.id, profile.email);
    }
  }, [profile.id, profile.email, fetchCloudUserData]);

  // Real-Time System Settings & Cross-Device User Synchronization
  useEffect(() => {
    realtimeClient.init(profile.id || 'user_default_01', profile.email || '');

    // Settings subscription
    const unsubSettings = realtimeClient.subscribe('settings', (settingsData: SystemPublicSettings) => {
      setSystemSettings(settingsData);
    });

    // Cross-device user data sync event
    const unsubUserData = realtimeClient.subscribe('user_data_synced', (data: any) => {
      if (!data) return;
      if (data.profileData) {
        setProfile((prev) => {
          const merged: UserProfile = {
            ...prev,
            ...data.profileData,
            id: prev.id,
            email: prev.email,
          };
          storageService.saveProfile(merged);
          return merged;
        });
      }
      if (Array.isArray(data.messagesData)) {
        setMessages((prev) => {
          const msgMap = new Map<string, ChatMessage>();
          prev.forEach((m) => { if (m?.id) msgMap.set(m.id, m); });
          data.messagesData.forEach((m: ChatMessage) => { if (m?.id) msgMap.set(m.id, m); });
          const merged = Array.from(msgMap.values()).sort(
            (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
          );
          storageService.saveMessages(merged);
          return merged;
        });
      }
      if (Array.isArray(data.itemsData)) {
        setItems((prev) => {
          const itemMap = new Map<string, CompanionItem>();
          prev.forEach((it) => { if (it?.id) itemMap.set(it.id, it); });
          data.itemsData.forEach((it: CompanionItem) => { if (it?.id) itemMap.set(it.id, it); });
          const merged = Array.from(itemMap.values());
          storageService.saveItems(merged);
          return merged;
        });
      }
    });

    // Cross-device profile update event
    const unsubProfile = realtimeClient.subscribe('user_profile_updated', (data: any) => {
      const pData = data?.profile || data;
      if (pData) {
        setProfile((prev) => {
          const merged: UserProfile = {
            ...prev,
            ...pData,
            id: prev.id,
            email: prev.email,
          };
          storageService.saveProfile(merged);
          return merged;
        });
      }
    });

    // Cross-device chat sync event
    const unsubChat = realtimeClient.subscribe('user_chat_sync', (data: any) => {
      if (!data) return;
      if (data.newUserMessage || data.newAiMessage) {
        setMessages((prev) => {
          const msgMap = new Map<string, ChatMessage>();
          prev.forEach((m) => { if (m?.id) msgMap.set(m.id, m); });
          if (data.newUserMessage?.id) msgMap.set(data.newUserMessage.id, data.newUserMessage);
          if (data.newAiMessage?.id) msgMap.set(data.newAiMessage.id, data.newAiMessage);
          if (Array.isArray(data.messagesData)) {
            data.messagesData.forEach((m: ChatMessage) => { if (m?.id) msgMap.set(m.id, m); });
          }
          const merged = Array.from(msgMap.values()).sort(
            (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
          );
          storageService.saveMessages(merged);
          return merged;
        });
      }
      if (Array.isArray(data.createdOrUpdatedItems) && data.createdOrUpdatedItems.length > 0) {
        setItems((prev) => {
          const itemMap = new Map<string, CompanionItem>();
          prev.forEach((it) => { if (it?.id) itemMap.set(it.id, it); });
          data.createdOrUpdatedItems.forEach((it: CompanionItem) => { if (it?.id) itemMap.set(it.id, it); });
          const merged = Array.from(itemMap.values());
          storageService.saveItems(merged);
          return merged;
        });
      }
      if (data.updatedProfile) {
        setProfile((prev) => {
          const merged: UserProfile = {
            ...prev,
            ...data.updatedProfile,
            id: prev.id,
            email: prev.email,
          };
          storageService.saveProfile(merged);
          return merged;
        });
      }
    });

    const handleCustomSync = (e: any) => {
      if (e.detail) {
        setSystemSettings((prev) => ({ ...prev, ...e.detail }));
      }
    };

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible' && profile.id && profile.id !== 'user_default_01') {
        fetchCloudUserData(profile.id, profile.email);
      }
    };

    window.addEventListener('system_settings_updated', handleCustomSync);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      unsubSettings();
      unsubUserData();
      unsubProfile();
      unsubChat();
      window.removeEventListener('system_settings_updated', handleCustomSync);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [profile.id, profile.email, fetchCloudUserData]);

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  // Synchronize RTL/LTR & Theme
  useEffect(() => {
    document.documentElement.dir = profile.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = profile.language;
    if (profile.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.language, profile.theme]);

  // Request notification permissions
  useEffect(() => {
    alarmEngine.requestNotificationPermission();
  }, []);

  // Automatic debounced cloud backup & synchronization for logged-in users
  useEffect(() => {
    if (!profile.id || profile.id === 'user_default_01') return;

    const syncTimer = setTimeout(() => {
      fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          profileData: profile,
          messagesData: messages.slice(-100), // Keep last 100 messages synced
          itemsData: items,
        }),
      }).catch(() => {
        // Silently handle offline/sync failures without cluttering logs
      });
    }, 3000);

    return () => clearTimeout(syncTimer);
  }, [profile, messages, items]);

  // Alarm Schedule Engine Loop
  useEffect(() => {
    const interval = setInterval(() => {
      alarmEngine.checkDueItems(items, (dueItem) => {
        if (!ringingAlarm) {
          setRingingAlarm(dueItem);
          alarmEngine.playChimeSound('alarm');
          alarmEngine.showSystemNotification('تنبيه من الرفيق', dueItem.title);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [items, ringingAlarm]);

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    storageService.saveProfile(updatedProfile);

    // If authenticated, immediately update profile on server and trigger real-time broadcast to all devices
    if (updatedProfile.id && updatedProfile.id !== 'user_default_01') {
      fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedProfile.id,
          email: updatedProfile.email,
          name: updatedProfile.displayName,
          displayName: updatedProfile.displayName,
          addressAs: updatedProfile.addressAs,
          personality: updatedProfile.personality,
          companionGender: updatedProfile.companionGender,
          language: updatedProfile.language,
          theme: updatedProfile.theme,
          timezone: updatedProfile.timeZone,
          voiceSpeed: updatedProfile.voiceSpeed,
          useEmojis: updatedProfile.useEmojis,
          proactivityLevel: updatedProfile.proactivityLevel,
          dailyMessageLimit: updatedProfile.dailyMessageLimit,
          privateCandidMode: updatedProfile.privateCandidMode,
          specialCounselingEnabled: updatedProfile.specialCounselingEnabled,
          dailyCheckInEnabled: updatedProfile.dailyCheckInEnabled,
          dailyCheckInTime: updatedProfile.dailyCheckInTime,
        }),
      }).catch((err) => {
        console.warn('Real-time profile sync error:', err);
      });
    }
  };

  const handleAddItem = useCallback((newItem: CompanionItem) => {
    const updated = storageService.addItem(newItem);
    setItems(updated);
  }, []);

  const handleUpdateItem = useCallback((updatedItem: CompanionItem) => {
    const updated = storageService.updateItem(updatedItem);
    setItems(updated);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    const updated = storageService.deleteItem(id);
    setItems(updated);
  }, []);

  // Chat message submission with real-time SSE streaming
  const handleSendMessage = async (
    text: string,
    media?: { base64: string; mimeType: string; name: string; type: 'image' | 'video' | 'audio' }
  ) => {
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      mediaUrl: media?.base64,
      mediaType: media?.type,
      mediaName: media?.name,
    };

    const updatedMessages = storageService.addMessage(userMsg);
    setMessages(updatedMessages);
    setIsLoadingAI(true);

    const aiMsgId = 'msg_ai_' + Date.now();
    let currentStreamingText = '';

    // Placeholder message for real-time streaming chunks
    const pendingAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, pendingAiMsg]);

    // Calculate exact real-time client device time context
    const now = new Date();
    const isArabic = profile.language === 'ar';
    const langLocale = isArabic ? 'ar-SA' : 'en-US';
    let userTz = profile.timeZone || 'Asia/Riyadh';
    try {
      userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || userTz;
    } catch (_) {}

    let dayOfWeek = now.toLocaleDateString(langLocale, { weekday: 'long' });
    let formattedDate = now.toLocaleDateString(langLocale, { year: 'numeric', month: 'long', day: 'numeric' });
    let formattedTime = now.toLocaleTimeString(langLocale, { hour: '2-digit', minute: '2-digit', hour12: true });
    let time24 = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const clientTimeContext = {
      timeZone: userTz,
      isoTimestamp: now.toISOString(),
      dayOfWeek,
      formattedDate,
      formattedTime,
      time24,
    };

    let finalData: any = null;
    let streamSuccess = false;

    try {
      const response = await fetch('/api/companion/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.map((m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })),
          profile,
          items,
          mediaBase64: media?.base64,
          mediaMimeType: media?.mimeType,
          clientTimeContext,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.text) {
                  currentStreamingText += parsed.text;
                  const chunkText = currentStreamingText;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === aiMsgId ? { ...m, text: chunkText } : m))
                  );
                }
                if (parsed.done) {
                  finalData = parsed;
                  streamSuccess = true;
                }
              } catch (_) {}
            }
          }
        }

        if (buffer.trim().startsWith('data: ')) {
          try {
            const parsed = JSON.parse(buffer.trim().slice(6));
            if (parsed.done) {
              finalData = parsed;
              streamSuccess = true;
            }
          } catch (_) {}
        }
      }
    } catch (streamErr) {
      console.warn('Streaming response unavailable, switching to standard JSON endpoint:', streamErr);
    }

    // Fallback seamlessly to standard non-streaming POST if stream failed or did not finish
    if (!streamSuccess) {
      try {
        const res = await fetch('/api/companion/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: updatedMessages.map((m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })),
            profile,
            items,
            mediaBase64: media?.base64,
            mediaMimeType: media?.mimeType,
            clientTimeContext,
          }),
        });

        if (res.ok) {
          finalData = await res.json();
        } else {
          throw new Error(`Fallback HTTP ${res.status}`);
        }
      } catch (fallbackErr) {
        console.error('Send message error:', fallbackErr);
        const fallbackText =
          profile.language === 'ar'
            ? 'عذراً يا غالي، تعثر الاتصال بالخادم. حاول ثانية!'
            : 'Sorry my friend, connection issue. Please retry!';
        const errorMsg: ChatMessage = {
          id: aiMsgId,
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? errorMsg : m)));
        storageService.addMessage(errorMsg);
        setIsLoadingAI(false);
        return;
      }
    }

    const replyText =
      finalData?.replyText ||
      currentStreamingText ||
      (profile.language === 'ar' ? 'تم تسجيل رسالتك' : 'Got it!');
    const actions = finalData?.actions || [];
    const createdOrUpdatedItems = finalData?.createdOrUpdatedItems || [];
    const updatedProfile = finalData?.updatedProfile;

    if (updatedProfile) {
      handleUpdateProfile({ ...profile, ...updatedProfile });
    }

    if (createdOrUpdatedItems && createdOrUpdatedItems.length > 0) {
      createdOrUpdatedItems.forEach((item: CompanionItem) => {
        const exists = items.some((i) => i.id === item.id);
        if (exists) {
          handleUpdateItem(item);
        } else {
          handleAddItem(item);
        }
      });
      alarmEngine.playChimeSound('success');
    }

    const finalAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: replyText,
      timestamp: new Date().toISOString(),
      actionsTaken: actions,
    };

    storageService.addMessage(finalAiMsg);
    setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? finalAiMsg : m)));
    setIsLoadingAI(false);
  };

  // Start End of Day Review
  const handleStartEndReview = async () => {
    setIsReviewing(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayItems = items.filter((i) => i.dueDate === todayStr);

      const response = await fetch('/api/companion/review-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, todayItems }),
      });

      const data = await response.json();
      setDailyReviewText(data.reviewText || '');

      // Add to conversation thread as well
      const reviewMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: 'ai',
        text: data.reviewText,
        timestamp: new Date().toISOString(),
      };
      setMessages(storageService.addMessage(reviewMsg));
    } catch (e) {
      console.error('Review error:', e);
    } finally {
      setIsReviewing(false);
    }
  };

  // Alarm actions
  const handleSnoozeAlarm = (item: CompanionItem, minutes: number) => {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    handleUpdateItem({
      ...item,
      status: 'snoozed',
      snoozedUntil,
    });
    setRingingAlarm(null);
  };

  const handleCompleteAlarm = (item: CompanionItem) => {
    handleUpdateItem({
      ...item,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    setRingingAlarm(null);
  };

  const handleClearMemory = () => {
    if (confirm(profile.language === 'ar' ? 'هل أنت متأكد من مسح الذاكرة بالكامل؟' : 'Are you sure you want to clear memory completely?')) {
      storageService.clearAllData();
      setItems([]);
      setMessages([]);
      setIsSettingsOpen(false);
    }
  };

  const handleExportData = () => {
    const dataStr = storageService.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rafiq_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FeatureGateProvider
      profile={profile}
      items={items}
      messages={messages}
      currentPlanId={profile.planTier || 'free'}
      onOpenSubscription={() => setIsSubscriptionOpen(true)}
      onOpenAuth={() => setIsAuthOpen(true)}
    >
      <div className="h-dvh flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors max-w-full overflow-hidden relative">
        {/* Real-time System Maintenance Overlay */}
        {systemSettings?.maintenanceMode && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md text-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="p-4 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-4 animate-bounce">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black mb-2">النظام في حالة صيانة مؤقتة</h2>
            <p className="text-slate-300 max-w-md text-sm mb-6">
              يقوم فريق الإدارة بتحديث الخدمات في لوحة التحكم حالياً. ستعمل المنصة وتتزامن تلقائياً فور انتهاء التعديلات خلال لحظات.
            </p>
            <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>جاري المزامنة التلقائية مع لوحة التحكم (&lt; 10 ثوانٍ)...</span>
            </div>
          </div>
        )}

        <Header
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        systemSettings={systemSettings}
        onOpenMaritalSupport={
          systemSettings?.maritalSupportAllowed !== false
            ? () => setIsMaritalSupportOpen(true)
            : undefined
        }
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-2 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'companion' && (
          <CompanionView
            messages={messages}
            profile={profile}
            items={items}
            onOpenMaritalSupport={
              systemSettings?.maritalSupportAllowed !== false
                ? () => setIsMaritalSupportOpen(true)
                : undefined
            }
            onSendMessage={handleSendMessage}
            isLoading={isLoadingAI}
            onOpenPermissions={() => setIsPermissionsOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'saved' && (
          <div className="h-full overflow-y-auto w-full">
            <SavedView
              items={items}
              profile={profile}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
            />
          </div>
        )}

        {activeTab === 'today' && (
          <div className="h-full overflow-y-auto w-full">
            <TodayView
              items={items}
              profile={profile}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onStartEndReview={handleStartEndReview}
              reviewText={dailyReviewText}
              isReviewing={isReviewing}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto w-full">
            <ProfileView
              profile={profile}
              items={items}
              systemSettings={systemSettings}
              onUpdateProfile={handleUpdateProfile}
              onNavigateTab={setActiveTab}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenSubscription={() => setIsSubscriptionOpen(true)}
              onOpenAuth={() => setIsAuthOpen(true)}
              onLogout={handleLogout}
              onOpenDailyCheckIn={() => setIsDailyCheckInOpen(true)}
            />
          </div>
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
      />

      {!profile.onboardingCompleted && (
        <OnboardingModal
          profile={profile}
          onComplete={(p) => {
            handleUpdateProfile(p);
          }}
        />
      )}

      {isSubscriptionOpen && (
        <SubscriptionModal
          profile={profile}
          onClose={() => setIsSubscriptionOpen(false)}
          onProfileUpdated={(updatedProfile) => {
            setProfile(updatedProfile);
            try {
              localStorage.setItem('ai_companion_profile', JSON.stringify(updatedProfile));
            } catch (e) {
              console.error('Save profile error', e);
            }
          }}
        />
      )}

      {isStatsOpen && (
        <StatsModal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          items={items}
          profile={profile}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          profile={profile}
          systemSettings={systemSettings}
          onSaveProfile={handleUpdateProfile}
          onClose={() => setIsSettingsOpen(false)}
          onClearMemory={handleClearMemory}
          onExportData={handleExportData}
          onOpenMaritalSupport={
            systemSettings?.maritalSupportAllowed !== false
              ? () => {
                  setIsSettingsOpen(false);
                  setIsMaritalSupportOpen(true);
                }
              : undefined
          }
          onOpenSubscription={() => {
            setIsSettingsOpen(false);
            setIsSubscriptionOpen(true);
          }}
          onOpenAuth={() => {
            setIsSettingsOpen(false);
            setIsAuthOpen(true);
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          profile={profile}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(userData) => {
            if (userData.accountId || userData.id) {
              const defaultName = userData.name || (userData.email ? userData.email.split('@')[0] : profile.displayName);
              const restoredProfile: UserProfile = {
                ...profile,
                id: userData.accountId || userData.id,
                email: userData.email,
                username: userData.username || (userData.email ? userData.email.split('@')[0] : undefined),
                phone: userData.phone || profile.phone,
                displayName: defaultName,
                addressAs: userData.profileData?.addressAs || profile.addressAs || defaultName,
                ...(userData.profileData || {}),
              };

              handleUpdateProfile(restoredProfile);

              // Merge or Restore messages:
              // If server has stored messages, prioritize or merge with local session messages
              if (userData.messagesData && Array.isArray(userData.messagesData) && userData.messagesData.length > 0) {
                // If local guest had some messages, merge them without duplicating ids
                const serverMsgIds = new Set(userData.messagesData.map((m: any) => m.id));
                const uniqueLocalMsgs = messages.filter((m) => !serverMsgIds.has(m.id));
                const combinedMsgs = [...userData.messagesData, ...uniqueLocalMsgs];
                setMessages(combinedMsgs);
                storageService.saveMessages(combinedMsgs);
              } else if (messages.length > 0) {
                // New registration or empty account: save current local guest messages to user's storage
                storageService.saveMessages(messages);
              }

              // Merge or Restore items:
              if (userData.itemsData && Array.isArray(userData.itemsData) && userData.itemsData.length > 0) {
                const serverItemIds = new Set(userData.itemsData.map((i: any) => i.id));
                const uniqueLocalItems = items.filter((i) => !serverItemIds.has(i.id));
                const combinedItems = [...userData.itemsData, ...uniqueLocalItems];
                setItems(combinedItems);
                storageService.saveItems(combinedItems);
              } else if (items.length > 0) {
                storageService.saveItems(items);
              }

              // Store remember token
              storageService.setRememberToken(`token_${userData.id}_${Date.now()}`, userData);
            }
          }}
        />
      )}

      {isMaritalSupportOpen && (
        <MaritalCounselingModal
          isOpen={isMaritalSupportOpen}
          onClose={() => setIsMaritalSupportOpen(false)}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {isPermissionsOpen && (
        <PermissionsModal
          profile={profile}
          onClose={() => setIsPermissionsOpen(false)}
        />
      )}

      {isDailyCheckInOpen && (
        <DailyCheckInModal
          isOpen={isDailyCheckInOpen}
          onClose={() => setIsDailyCheckInOpen(false)}
          profile={profile}
          items={items}
          onSaveCheckIn={(checkIn) => {
            storageService.saveDailyCheckIn(checkIn);
            // Refresh streak in profile
            const stats = storageService.getCheckInStats();
            handleUpdateProfile({
              ...profile,
              checkInStreak: stats.streak,
            });
            setIsDailyCheckInOpen(false);
          }}
          existingTodayCheckIn={storageService.getTodayCheckIn()}
        />
      )}

      {ringingAlarm && (
        <AlarmModal
          item={ringingAlarm}
          profile={profile}
          onSnooze={handleSnoozeAlarm}
          onComplete={handleCompleteAlarm}
          onDismiss={() => setRingingAlarm(null)}
        />
      )}
      </div>
    </FeatureGateProvider>
  );
}

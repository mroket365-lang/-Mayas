import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, CompanionItem, ChatMessage } from './types';
import { storageService } from './services/storageService';
import { alarmEngine } from './services/alarmEngine';
import { speechService } from './services/speechService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CompanionView } from './components/CompanionView';
import { SavedView } from './components/SavedView';
import { TodayView } from './components/TodayView';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { AlarmModal } from './components/AlarmModal';
import { PermissionsModal } from './components/PermissionsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminPanel } from './admin/AdminPanel';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin');
  });

  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [items, setItems] = useState<CompanionItem[]>(() => storageService.getItems());
  const [messages, setMessages] = useState<ChatMessage[]>(() => storageService.getMessages());
  const [activeTab, setActiveTab] = useState<'companion' | 'saved' | 'today'>('companion');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState<CompanionItem | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [dailyReviewText, setDailyReviewText] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);

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

    try {
      const response = await fetch('/api/companion/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
          profile,
          items,
          mediaBase64: media?.base64,
          mediaMimeType: media?.mimeType,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalData: any = null;

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
              }
            } catch (_) {}
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6));
          if (parsed.done) finalData = parsed;
        } catch (_) {}
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
    } catch (e) {
      console.error('Send message error:', e);
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
    } finally {
      setIsLoadingAI(false);
    }
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
      <Header
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-2">
        {activeTab === 'companion' && (
          <CompanionView
            messages={messages}
            profile={profile}
            items={items}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingAI}
            onOpenPermissions={() => setIsPermissionsOpen(true)}
          />
        )}

        {activeTab === 'saved' && (
          <SavedView
            items={items}
            profile={profile}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
          />
        )}

        {activeTab === 'today' && (
          <TodayView
            items={items}
            profile={profile}
            onUpdateItem={handleUpdateItem}
            onStartEndReview={handleStartEndReview}
            reviewText={dailyReviewText}
            isReviewing={isReviewing}
          />
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
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          profile={profile}
          onSaveProfile={handleUpdateProfile}
          onClose={() => setIsSettingsOpen(false)}
          onClearMemory={handleClearMemory}
          onExportData={handleExportData}
        />
      )}

      {isPermissionsOpen && (
        <PermissionsModal
          profile={profile}
          onClose={() => setIsPermissionsOpen(false)}
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
  );
}

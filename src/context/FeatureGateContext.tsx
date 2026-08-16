import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  FeatureRuleConfig,
  EvaluatedFeatureStatus,
  UserProfile,
  CompanionItem,
  ChatMessage,
} from '../types';
import { defaultFeaturesList } from '../constants/defaultFeatures';
import { realtimeClient } from '../services/realtimeClient';
import { Lock, Sparkles, LogIn, Crown, Clock, CheckCircle, ArrowRight, X } from 'lucide-react';

interface FeatureGateContextType {
  features: FeatureRuleConfig[];
  evaluatedFeatures: Record<string, EvaluatedFeatureStatus>;
  isFeatureEnabled: (featureId: string) => boolean;
  isFeatureVisible: (featureId: string) => boolean;
  getFeatureStatus: (featureId: string) => EvaluatedFeatureStatus | undefined;
  getFeatureConfig: (featureId: string) => FeatureRuleConfig | undefined;
  triggerLockedPrompt: (featureId: string) => void;
  openSubscriptionModal?: () => void;
  openAuthModal?: () => void;
}

const FeatureGateContext = createContext<FeatureGateContextType | null>(null);

interface FeatureGateProviderProps {
  children: ReactNode;
  profile: UserProfile;
  items?: CompanionItem[];
  messages?: ChatMessage[];
  currentPlanId?: string;
  onOpenSubscription?: () => void;
  onOpenAuth?: () => void;
}

export const FeatureGateProvider: React.FC<FeatureGateProviderProps> = ({
  children,
  profile,
  items = [],
  messages = [],
  currentPlanId = 'free',
  onOpenSubscription,
  onOpenAuth,
}) => {
  const [features, setFeatures] = useState<FeatureRuleConfig[]>(defaultFeaturesList);
  const [activeLockedFeatureId, setActiveLockedFeatureId] = useState<string | null>(null);

  // Completed tasks count
  const completedTasksCount = useMemo(() => {
    return items.filter((i) => i.status === 'completed' || i.status === 'completed_late').length;
  }, [items]);

  const messagesCount = useMemo(() => {
    return messages.filter((m) => m.sender === 'user').length;
  }, [messages]);

  // Client-side local evaluation engine (runs immediately for 0ms latency)
  const evaluatedFeatures = useMemo(() => {
    const result: Record<string, EvaluatedFeatureStatus> = {};
    const isLoggedIn = Boolean(
      (profile.email && profile.email.trim().length > 0) ||
      (profile.id && profile.id.startsWith('USR-') && profile.id !== 'user_default_01')
    );

    for (const feature of features) {
      // 1. Audience
      if (feature.targetAudience === 'disabled') {
        result[feature.id] = {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'disabled',
          lockMessage: 'هذه الميزة معطلة مؤقتاً للصيانة أو التطوير',
        };
        continue;
      }

      if (feature.targetAudience === 'specific_users') {
        const allowedList = (feature.specificUsers || []).map((u) => u.toLowerCase().trim()).filter(Boolean);
        const match =
          (profile.id && allowedList.includes(profile.id.toLowerCase().trim())) ||
          (profile.email && allowedList.includes(profile.email.toLowerCase().trim()));

        if (!match) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'specific_users_only',
            lockMessage: feature.customLockMessage || 'هذه الميزة متاحة فقط لمستخدمين محددين تجريبياً',
          };
          continue;
        }
      }

      if (feature.targetAudience === 'authenticated_only') {
        if (!isLoggedIn) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'requires_auth',
            lockMessage: feature.customLockMessage || 'يرجى تسجيل الدخول أو إنشاء حساب للوصول لهذه الميزة',
          };
          continue;
        }
      }

      // 2. Plan Tier
      if (feature.allowedPlans && feature.allowedPlans.length > 0 && !feature.allowedPlans.includes('all')) {
        if (!feature.allowedPlans.includes(currentPlanId)) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'plan_restricted',
            lockMessage:
              feature.customLockMessage ||
              `هذه الميزة متاحة في الخطط المتقدمة (${feature.allowedPlans.join(' / ')})`,
          };
          continue;
        }
      }

      // 3. Progressive Disclosure
      if (feature.progressiveDisclosure && feature.progressiveDisclosure.enabled) {
        if (feature.progressiveDisclosure.minAccountAgeDays > 0) {
          const accountCreation = (profile as any).createdAt;
          if (accountCreation) {
            const daysOld = (Date.now() - new Date(accountCreation).getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld < feature.progressiveDisclosure.minAccountAgeDays) {
              const remaining = Math.ceil(feature.progressiveDisclosure.minAccountAgeDays - daysOld);
              result[feature.id] = {
                id: feature.id,
                name: feature.nameAr,
                icon: feature.icon,
                enabled: false,
                locked: true,
                lockedBehavior: feature.lockedBehavior,
                reason: 'progressive_time_locked',
                lockMessage:
                  feature.customLockMessage ||
                  `ستفتح هذه الميزة بعد ${remaining} يوم من استخدامك المستمر للتطبيق ✨`,
              };
              continue;
            }
          }
        }

        if (feature.progressiveDisclosure.minMessagesSent > 0) {
          if (messagesCount < feature.progressiveDisclosure.minMessagesSent) {
            const needed = feature.progressiveDisclosure.minMessagesSent - messagesCount;
            result[feature.id] = {
              id: feature.id,
              name: feature.nameAr,
              icon: feature.icon,
              enabled: false,
              locked: true,
              lockedBehavior: feature.lockedBehavior,
              reason: 'progressive_messages_locked',
              lockMessage:
                feature.customLockMessage ||
                `أرسل ${needed} رسائل إضافية للرفيق لفتح هذه الميزة تلقائياً ✨`,
            };
            continue;
          }
        }

        if (feature.progressiveDisclosure.minCompletedTasks > 0) {
          if (completedTasksCount < feature.progressiveDisclosure.minCompletedTasks) {
            const needed = feature.progressiveDisclosure.minCompletedTasks - completedTasksCount;
            result[feature.id] = {
              id: feature.id,
              name: feature.nameAr,
              icon: feature.icon,
              enabled: false,
              locked: true,
              lockedBehavior: feature.lockedBehavior,
              reason: 'progressive_tasks_locked',
              lockMessage:
                feature.customLockMessage ||
                `أنجز ${needed} مهام إضافية لفتح هذه الأداة تلقائياً ✨`,
            };
            continue;
          }
        }
      }

      // 4. Time Window
      if (feature.timeWindow && feature.timeWindow.enabled) {
        const now = Date.now();
        if (feature.timeWindow.startDate && new Date(feature.timeWindow.startDate).getTime() > now) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'outside_time_window',
            lockMessage: feature.customLockMessage || 'هذه الميزة ستبدأ قريباً في الموعد المحدد',
          };
          continue;
        }
        if (feature.timeWindow.endDate && new Date(feature.timeWindow.endDate).getTime() < now) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'outside_time_window',
            lockMessage: feature.customLockMessage || 'انتهت الفترة المحددة لهذه الميزة',
          };
          continue;
        }
      }

      // Pass
      result[feature.id] = {
        id: feature.id,
        name: feature.nameAr,
        icon: feature.icon,
        enabled: true,
        locked: false,
        lockedBehavior: feature.lockedBehavior,
        reason: 'ok',
      };
    }

    return result;
  }, [features, profile, currentPlanId, messagesCount, completedTasksCount]);

  // Initial Fetch & Real-time sync
  useEffect(() => {
    const fetchLatestSettings = async () => {
      try {
        const params = new URLSearchParams({
          userId: profile.id || 'user_default_01',
          email: profile.email || '',
          planId: currentPlanId,
          messagesCount: messagesCount.toString(),
          tasksCompletedCount: completedTasksCount.toString(),
        });
        const res = await fetch(`/api/public/settings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.features && Array.isArray(data.features)) {
            setFeatures(data.features);
          }
        }
      } catch (err) {
        console.warn('Could not fetch feature settings:', err);
      }
    };

    fetchLatestSettings();

    // Subscribe to SSE realtime stream for instant feature toggles
    const unsubFeatures = realtimeClient.subscribe('features_updated', (event: any) => {
      if (event.allFeatures && Array.isArray(event.allFeatures)) {
        setFeatures(event.allFeatures);
      } else if (event.feature) {
        setFeatures((prev) => {
          const idx = prev.findIndex((f) => f.id === event.feature.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.feature;
            return next;
          }
          return [...prev, event.feature];
        });
      }
    });

    const unsubSettings = realtimeClient.subscribe('settings', (settingsData: any) => {
      if (settingsData.features && Array.isArray(settingsData.features)) {
        setFeatures(settingsData.features);
      }
    });

    return () => {
      unsubFeatures();
      unsubSettings();
    };
  }, [profile.id, profile.email, currentPlanId, messagesCount, completedTasksCount]);

  const isFeatureEnabled = (featureId: string): boolean => {
    const status = evaluatedFeatures[featureId];
    if (!status) return true; // default open if not configured
    return status.enabled;
  };

  const isFeatureVisible = (featureId: string): boolean => {
    const status = evaluatedFeatures[featureId];
    if (!status) return true;
    if (status.enabled) return true;
    return status.lockedBehavior === 'badge_lock';
  };

  const getFeatureStatus = (featureId: string): EvaluatedFeatureStatus | undefined => {
    return evaluatedFeatures[featureId];
  };

  const getFeatureConfig = (featureId: string): FeatureRuleConfig | undefined => {
    return features.find((f) => f.id === featureId);
  };

  const triggerLockedPrompt = (featureId: string) => {
    setActiveLockedFeatureId(featureId);
  };

  const lockedFeatureStatus = activeLockedFeatureId ? evaluatedFeatures[activeLockedFeatureId] : null;
  const lockedFeatureConfig = activeLockedFeatureId ? features.find((f) => f.id === activeLockedFeatureId) : null;

  return (
    <FeatureGateContext.Provider
      value={{
        features,
        evaluatedFeatures,
        isFeatureEnabled,
        isFeatureVisible,
        getFeatureStatus,
        getFeatureConfig,
        triggerLockedPrompt,
        openSubscriptionModal: onOpenSubscription,
        openAuthModal: onOpenAuth,
      }}
    >
      {children}

      {/* Feature Locked Information & Upgrade Modal */}
      {activeLockedFeatureId && lockedFeatureStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 text-center">
            {/* Close Button */}
            <button
              onClick={() => setActiveLockedFeatureId(null)}
              className="absolute top-4 start-4 p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lock Icon Banner */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 animate-bounce" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                {lockedFeatureConfig?.nameAr || lockedFeatureStatus.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {lockedFeatureStatus.lockMessage || lockedFeatureConfig?.descriptionAr || 'هذه الميزة تتطلب تفعيل الخطة أو استيفاء الشروط المحددة'}
              </p>
            </div>

            {/* Status Reason Callout */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-start space-y-2">
              <div className="flex items-center gap-2 font-bold text-[var(--text-main)]">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>كيفية فتح هذه الميزة:</span>
              </div>

              {lockedFeatureStatus.reason === 'requires_auth' && (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <LogIn className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>قم بتسجيل الدخول أو إنشاء حسابك المجاني لتفعيل هذه الميزة فوراً وحفظ بياناتك سحابياً.</span>
                </div>
              )}

              {lockedFeatureStatus.reason === 'plan_restricted' && (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    هذه الميزة مخصصة للخطط المتقدمة ({lockedFeatureConfig?.allowedPlans?.join(' / ')}). قم بترقية اشتراكك للاستمتاع بها بلا قيود.
                  </span>
                </div>
              )}

              {lockedFeatureStatus.reason === 'progressive_messages_locked' && (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    الاستمرار في الدردشة مع الرفيق يفتح ميزات إضافية تدريجياً لضمان تجربة سهلة وسلسة!
                  </span>
                </div>
              )}

              {lockedFeatureStatus.reason === 'progressive_tasks_locked' && (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>أنجز المزيد من مهامك اليومية لترقية مستوى رفيقك الذكي.</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {lockedFeatureStatus.reason === 'requires_auth' && onOpenAuth && (
                <button
                  onClick={() => {
                    setActiveLockedFeatureId(null);
                    onOpenAuth();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول / إنشاء حساب</span>
                </button>
              )}

              {lockedFeatureStatus.reason === 'plan_restricted' && onOpenSubscription && (
                <button
                  onClick={() => {
                    setActiveLockedFeatureId(null);
                    onOpenSubscription();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>ترقية الخطة الآن ✨</span>
                </button>
              )}

              <button
                onClick={() => setActiveLockedFeatureId(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] font-bold text-xs border border-[var(--border-color)] transition-all"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </FeatureGateContext.Provider>
  );
};

export const useFeatureGate = (featureId?: string) => {
  const context = useContext(FeatureGateContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      features: [],
      evaluatedFeatures: {},
      isFeatureEnabled: () => true,
      isFeatureVisible: () => true,
      getFeatureStatus: () => undefined,
      getFeatureConfig: () => undefined,
      triggerLockedPrompt: () => {},
      openSubscriptionModal: undefined,
      openAuthModal: undefined,
      isEnabled: true,
      isVisible: true,
      status: undefined,
      config: undefined,
    };
  }

  if (!featureId) {
    return {
      ...context,
      isEnabled: true,
      isVisible: true,
      status: undefined,
      config: undefined,
    };
  }

  const isEnabled = context.isFeatureEnabled(featureId);
  const isVisible = context.isFeatureVisible(featureId);
  const status = context.getFeatureStatus(featureId);
  const config = context.getFeatureConfig(featureId);

  return {
    ...context,
    isEnabled,
    isVisible,
    status,
    config,
    triggerLockedPrompt: () => context.triggerLockedPrompt(featureId),
  };
};

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  lockedFallback?: (props: { onUnlock: () => void; status: EvaluatedFeatureStatus }) => ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  children,
  fallback = null,
  lockedFallback,
}) => {
  const { isEnabled, isVisible, status, triggerLockedPrompt } = useFeatureGate(featureId);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (isVisible && status && status.lockedBehavior === 'badge_lock') {
    if (lockedFallback) {
      return <>{lockedFallback({ onUnlock: triggerLockedPrompt, status })}</>;
    }
    // Default locked wrapper with lock overlay/badge
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerLockedPrompt();
        }}
        className="relative cursor-pointer group"
      >
        <div className="opacity-60 pointer-events-none filter grayscale-[40%]">
          {children}
        </div>
        <div className="absolute top-1 end-1 bg-amber-500 text-white rounded-full p-1 shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
          <Lock className="w-3 h-3" />
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
};

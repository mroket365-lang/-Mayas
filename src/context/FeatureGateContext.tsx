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
import {
  Lock,
  Sparkles,
  LogIn,
  Crown,
  Clock,
  CheckCircle,
  ArrowRight,
  X,
  Wrench,
  Rocket,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';

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

export const FEATURE_ALIASES: Record<string, string> = {
  // Voice input
  chat_voice: 'tool_voice_input',
  voice_input: 'tool_voice_input',
  tool_voice_input: 'tool_voice_input',

  // Attachments
  chat_attachment: 'tool_attachments',
  attachments: 'tool_attachments',
  tool_attachments: 'tool_attachments',

  // Voice reply / TTS
  tool_voice_reply: 'tool_voice_reply',
  voice_reply: 'tool_voice_reply',
  chat_tts: 'tool_voice_reply',

  // Stats
  action_stats: 'tool_stats',
  stats: 'tool_stats',
  tool_stats: 'tool_stats',

  // Theme
  pref_dark_mode: 'feature_theme_customization',
  theme_customization: 'feature_theme_customization',
  feature_theme_customization: 'feature_theme_customization',

  // Daily review
  action_daily_review: 'tool_daily_review',
  daily_review: 'tool_daily_review',
  tool_daily_review: 'tool_daily_review',

  // Snippets
  snippet_extractor: 'feature_snippet_extractor',
  feature_snippet_extractor: 'feature_snippet_extractor',

  // Goals
  goals_tracking: 'feature_goals_tracking',
  feature_goals_tracking: 'feature_goals_tracking',

  // Candid & Marital
  private_candid: 'tool_private_candid',
  tool_private_candid: 'tool_private_candid',
  marital_counseling: 'tool_marital_counseling',
  tool_marital_counseling: 'tool_marital_counseling',

  // Tools menu & Language
  action_tools_menu: 'action_tools_menu',
  tools_menu: 'action_tools_menu',
  pref_language: 'pref_language',
  language_selector: 'pref_language',

  // Focus mode
  focus_mode: 'feature_focus_mode',
  feature_focus_mode: 'feature_focus_mode',
};

export const normalizeFeatureId = (id: string): string => {
  if (!id) return id;
  return FEATURE_ALIASES[id] || id;
};

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
      // 0. Maintenance Mode / Coming Soon explicit locked behavior
      if (feature.lockedBehavior === 'maintenance') {
        result[feature.id] = {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: 'maintenance',
          reason: 'maintenance',
          lockTitle: feature.customLockTitle || 'الميزة تحت الصيانة والتحسينات 🛠️',
          lockMessage:
            feature.maintenanceMessage ||
            feature.customLockMessage ||
            'نعمل حالياً على تطوير وتحديث هذه الميزة لتقديم أداء أفضل وتجربة مميزة، وسنعاود إتاحتها فور اكتمال التحديثات. شكراً لتفهمكم وصبركم ✨',
          customBadge: feature.customBadge || 'maintenance',
          customBadgeText: feature.customBadgeText,
        };
        continue;
      }

      if (feature.lockedBehavior === 'coming_soon') {
        result[feature.id] = {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: 'coming_soon',
          reason: 'coming_soon',
          lockTitle: feature.customLockTitle || 'قريباً جداً 🚀',
          lockMessage:
            feature.customLockMessage ||
            'ترقبوا إطلاق هذه الميزة قريباً! نعمل على تجهيزها لتمنحكم تجربة استثنائية.',
          customBadge: feature.customBadge || 'coming_soon',
          customBadgeText: feature.customBadgeText,
        };
        continue;
      }

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
          lockTitle: feature.customLockTitle || 'الميزة معطلة مؤقتاً',
          lockMessage: feature.customLockMessage || 'هذه الميزة معطلة مؤقتاً للصيانة أو التطوير',
          customBadge: feature.customBadge,
          customBadgeText: feature.customBadgeText,
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
            lockTitle: feature.customLockTitle || 'ميزة خاصة ومحددة',
            lockMessage: feature.customLockMessage || 'هذه الميزة متاحة فقط لمستخدمين محددين تجريبياً',
            customBadge: feature.customBadge,
            customBadgeText: feature.customBadgeText,
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
            lockTitle: feature.customLockTitle || 'تسجيل الدخول مطلوب 🔑',
            lockMessage: feature.customLockMessage || 'يرجى تسجيل الدخول أو إنشاء حساب للوصول لهذه الميزة',
            customBadge: feature.customBadge,
            customBadgeText: feature.customBadgeText,
          };
          continue;
        }
      }

      // 2. Plan Tier Requirement (Supports 'none' / hidden from all plans)
      if (feature.allowedPlans) {
        const plans = feature.allowedPlans;
        const isNone = plans.includes('none') || plans.length === 0;

        if (isNone) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'plan_restricted',
            lockTitle: feature.customLockTitle || 'غير متاحة للباقات',
            lockMessage:
              feature.customLockMessage || 'هذه الميزة معطلة حالياً لكافة الباقات والخطط',
            customBadge: feature.customBadge,
            customBadgeText: feature.customBadgeText,
          };
          continue;
        }

        if (!plans.includes('all') && !plans.includes(currentPlanId)) {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'plan_restricted',
            lockTitle: feature.customLockTitle || 'ترقية الخطة مطلوبة 👑',
            lockMessage:
              feature.customLockMessage ||
              `هذه الميزة متاحة في الخطط المتقدمة (${plans.join(' / ')})`,
            customBadge: feature.customBadge,
            customBadgeText: feature.customBadgeText,
          };
          continue;
        }
      }

      // 3. Language & Platform Targeting
      if (feature.languageTarget && feature.languageTarget !== 'all') {
        if (feature.languageTarget === 'ar_only' && profile.language !== 'ar') {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'language_mismatch',
            lockTitle: 'متاحة باللغة العربية',
            lockMessage: 'هذه الميزة مخصصة لواجهة اللغة العربية حالياً',
          };
          continue;
        }
        if (feature.languageTarget === 'en_only' && profile.language !== 'en') {
          result[feature.id] = {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'language_mismatch',
            lockTitle: 'English Only Feature',
            lockMessage: 'This feature is currently enabled for English language mode.',
          };
          continue;
        }
      }

      // 4. Progressive Disclosure
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
                lockTitle: feature.customLockTitle || 'تفتح تدريجياً ✨',
                lockMessage:
                  feature.customLockMessage ||
                  `ستفتح هذه الميزة بعد ${remaining} يوم من استخدامك المستمر للتطبيق ✨`,
                customBadge: feature.customBadge,
                customBadgeText: feature.customBadgeText,
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
              lockTitle: feature.customLockTitle || 'تفتح مع التفاعل 💬',
              lockMessage:
                feature.customLockMessage ||
                `أرسل ${needed} رسائل إضافية للرفيق لفتح هذه الميزة تلقائياً ✨`,
              customBadge: feature.customBadge,
              customBadgeText: feature.customBadgeText,
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
              lockTitle: feature.customLockTitle || 'تفتح مع إنجاز المهام 🎯',
              lockMessage:
                feature.customLockMessage ||
                `أنجز ${needed} مهام إضافية لفتح هذه الأداة تلقائياً ✨`,
              customBadge: feature.customBadge,
              customBadgeText: feature.customBadgeText,
            };
            continue;
          }
        }
      }

      // 5. Time Window
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
            lockTitle: feature.customLockTitle || 'الميزة ستبدأ قريباً',
            lockMessage: feature.customLockMessage || 'هذه الميزة ستبدأ قريباً في الموعد المحدد',
            customBadge: feature.customBadge,
            customBadgeText: feature.customBadgeText,
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
            lockTitle: feature.customLockTitle || 'انتهت الفترة المحددة',
            lockMessage: feature.customLockMessage || 'انتهت الفترة المحددة لإتاحة هذه الميزة',
            customBadge: feature.customBadge,
            customBadgeText: feature.customBadgeText,
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
        customBadge: feature.customBadge,
        customBadgeText: feature.customBadgeText,
      };
    }

    // Map all alias keys to their resolved canonical evaluations
    Object.entries(FEATURE_ALIASES).forEach(([aliasKey, canonicalId]) => {
      if (result[canonicalId] && !result[aliasKey]) {
        result[aliasKey] = {
          ...result[canonicalId],
          id: aliasKey,
        };
      }
    });

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
    const canonical = normalizeFeatureId(featureId);
    const status = evaluatedFeatures[canonical] || evaluatedFeatures[featureId];
    if (!status) return true; // default open if not configured
    return status.enabled;
  };

  const isFeatureVisible = (featureId: string): boolean => {
    const canonical = normalizeFeatureId(featureId);
    const status = evaluatedFeatures[canonical] || evaluatedFeatures[featureId];
    if (!status) return true;
    if (status.enabled) return true;
    return status.lockedBehavior !== 'hide';
  };

  const getFeatureStatus = (featureId: string): EvaluatedFeatureStatus | undefined => {
    const canonical = normalizeFeatureId(featureId);
    return evaluatedFeatures[canonical] || evaluatedFeatures[featureId];
  };

  const getFeatureConfig = (featureId: string): FeatureRuleConfig | undefined => {
    const canonical = normalizeFeatureId(featureId);
    return features.find((f) => f.id === canonical || f.id === featureId);
  };

  const triggerLockedPrompt = (featureId: string) => {
    const canonical = normalizeFeatureId(featureId);
    setActiveLockedFeatureId(canonical || featureId);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 text-center">
            {/* Close Button */}
            <button
              onClick={() => setActiveLockedFeatureId(null)}
              className="absolute top-4 start-4 p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Hero Icon Banner */}
            {lockedFeatureStatus.reason === 'maintenance' || lockedFeatureConfig?.lockedBehavior === 'maintenance' ? (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg">
                <Wrench className="w-8 h-8 animate-pulse" />
              </div>
            ) : lockedFeatureStatus.reason === 'coming_soon' || lockedFeatureConfig?.lockedBehavior === 'coming_soon' ? (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg">
                <Rocket className="w-8 h-8 animate-bounce" />
              </div>
            ) : lockedFeatureStatus.reason === 'requires_auth' ? (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                <LogIn className="w-8 h-8" />
              </div>
            ) : lockedFeatureStatus.reason === 'plan_restricted' ? (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 animate-bounce" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                {lockedFeatureStatus.lockTitle ||
                  (lockedFeatureStatus.reason === 'maintenance'
                    ? 'الميزة تحت الصيانة والتحسينات 🛠️'
                    : lockedFeatureStatus.reason === 'coming_soon'
                    ? 'قريباً جداً 🚀'
                    : lockedFeatureConfig?.nameAr || lockedFeatureStatus.name)}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {lockedFeatureStatus.lockMessage ||
                  lockedFeatureConfig?.descriptionAr ||
                  'هذه الميزة مقفلة حالياً بناءً على إعدادات النظام'}
              </p>
            </div>

            {/* Status Details / Reassurance Callout */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-start space-y-2">
              {lockedFeatureStatus.reason === 'maintenance' || lockedFeatureConfig?.lockedBehavior === 'maintenance' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-500">
                    <Wrench className="w-4 h-4 shrink-0" />
                    <span>أعمال صيانة وتطوير جارية</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    فريق التطوير يعمل على ترقية وتحسين هذه الأداة لتقديم أفضل استجابة. كافة بياناتك ومهامك محفوظة وسيعود الزر للعمل تلقائياً فور انتهاء التحديثات.
                  </p>
                </div>
              ) : lockedFeatureStatus.reason === 'coming_soon' || lockedFeatureConfig?.lockedBehavior === 'coming_soon' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-purple-400">
                    <Rocket className="w-4 h-4 shrink-0" />
                    <span>ميزة جديدة في طور الإطلاق</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    نقوم بتجهيز واختبار هذه الميزة المبتكرة لضمان تجربة فريدة، ترقبوا تفعيلها قريباً!
                  </p>
                </div>
              ) : lockedFeatureStatus.reason === 'requires_auth' ? (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <LogIn className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>قم بتسجيل الدخول أو إنشاء حسابك المجاني لتفعيل هذه الميزة فوراً ومزامنة بياناتك سحابياً.</span>
                </div>
              ) : lockedFeatureStatus.reason === 'plan_restricted' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Crown className="w-4 h-4 shrink-0" />
                    <span>مخصصة للباقات المتقدمة</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {lockedFeatureConfig?.allowedPlans?.includes('none')
                      ? 'هذه الميزة معطلة حالياً في كافة الباقات.'
                      : `هذه الميزة متاحة لمشتركي الخطط المتقدمة (${lockedFeatureConfig?.allowedPlans?.join(' / ')}).`}
                  </p>
                </div>
              ) : lockedFeatureStatus.reason === 'progressive_messages_locked' ? (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>الاستمرار في الدردشة مع الرفيق يفتح ميزات إضافية تدريجياً لضمان تجربة سهلة وسلسة!</span>
                </div>
              ) : lockedFeatureStatus.reason === 'progressive_tasks_locked' ? (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>أنجز المزيد من مهامك اليومية لترقية مستوى رفيقك وفتح المزيد من الأدوات.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[var(--text-muted)] text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{lockedFeatureStatus.lockMessage || 'هذه الميزة تتطلب تفعيل الخطة أو استيفاء الشروط المحددة.'}</span>
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

              {lockedFeatureStatus.reason === 'plan_restricted' &&
                !lockedFeatureConfig?.allowedPlans?.includes('none') &&
                onOpenSubscription && (
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
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition-all ${
                  lockedFeatureStatus.reason === 'maintenance' || lockedFeatureConfig?.lockedBehavior === 'maintenance'
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
              >
                {lockedFeatureStatus.reason === 'maintenance' || lockedFeatureConfig?.lockedBehavior === 'maintenance'
                  ? 'حسناً، بانتظار التحديث 👍'
                  : 'حسناً، فهمت'}
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

  if (isVisible && status && status.lockedBehavior !== 'hide') {
    if (lockedFallback) {
      return <>{lockedFallback({ onUnlock: triggerLockedPrompt, status })}</>;
    }
    // Default locked wrapper with lock overlay/badge
    const isMaintenance = status.lockedBehavior === 'maintenance';
    const isComingSoon = status.lockedBehavior === 'coming_soon';

    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerLockedPrompt();
        }}
        className="relative cursor-pointer group"
      >
        <div className="opacity-60 pointer-events-none filter grayscale-[35%]">
          {children}
        </div>
        <div
          className={`absolute top-1 end-1 rounded-full p-1 shadow-md transition-transform group-hover:scale-110 ${
            isMaintenance
              ? 'bg-amber-600 text-white shadow-amber-600/30'
              : isComingSoon
              ? 'bg-purple-600 text-white shadow-purple-600/30'
              : 'bg-amber-500 text-white shadow-amber-500/30'
          }`}
        >
          {isMaintenance ? (
            <Wrench className="w-3 h-3" />
          ) : isComingSoon ? (
            <Rocket className="w-3 h-3" />
          ) : (
            <Lock className="w-3 h-3" />
          )}
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Lock,
  Globe,
  Users,
  UserCheck,
  Ban,
  Crown,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  MessageCircle,
  BarChart3,
  Mic,
  Volume2,
  Paperclip,
  Flame,
  HeartHandshake,
  Target,
  FileText,
  Bell,
  Smile,
  Palette,
  Search,
  Check,
  X,
  Edit3,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Laptop,
  Eye,
  EyeOff,
  Filter,
  TrendingUp,
  BookOpen,
  Compass,
  Maximize2,
  ShieldAlert,
  Wrench,
  Rocket,
  Tag,
  Languages,
} from 'lucide-react';
import {
  FeatureRuleConfig,
  FeatureCategory,
  FeatureAudience,
  FeatureLockedBehavior,
  FeatureDeviceTarget,
  FeatureLanguageTarget,
  FeatureCustomBadge,
} from '../types';

interface AdminFeaturesViewProps {
  token: string;
}

const categoryLabels: Record<FeatureCategory, { label: string; icon: any }> = {
  tabs: { label: 'الواجهات والتبويبات الرئيسية', icon: Layers },
  actions: { label: 'الأزرار والإجراءات العلوية', icon: SlidersHorizontal },
  chat_tools: { label: 'أدوات المحادثة والذكاء الاصطناعي', icon: MessageCircle },
  saved_tools: { label: 'أدوات المحفوظات والمهام', icon: Target },
  preferences: { label: 'التفضيلات والمظهر', icon: Palette },
  ai_modules: { label: 'نماذج وقدرات الذكاء الاصطناعي', icon: Sparkles },
};

const audienceLabels: Record<FeatureAudience, { label: string; color: string; icon: any }> = {
  everyone: { label: 'الجميع (عام)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Globe },
  authenticated_only: { label: 'المسجلون فقط', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: UserCheck },
  specific_users: { label: 'مستخدمون محددون', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Users },
  disabled: { label: 'معطلة كلياً', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: Ban },
};

const lockedBehaviorLabels: Record<
  FeatureLockedBehavior,
  { label: string; desc: string; icon: any; color: string }
> = {
  hide: {
    label: 'إخفاء تام من الواجهة 🙈',
    desc: 'العنصر يختفي تماماً ولا يظهر في أي مكان',
    icon: EyeOff,
    color: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  badge_lock: {
    label: 'شارة قفل وترقية 👑',
    desc: 'يظهر الزر وعليه رمز القفل ويطلب ترقية الخطة',
    icon: Lock,
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  maintenance: {
    label: 'وضع الصيانة والتحسينات 🛠️',
    desc: 'يقفل الزر وعند الضغط يعرض رسالة توضيحية بأعمال الصيانة والتحديث',
    icon: Wrench,
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  coming_soon: {
    label: 'قريباً جداً 🚀',
    desc: 'يظهر كزر قادم قريباً مع نافذة تشويقية للمستخدمين',
    icon: Rocket,
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  custom_popup: {
    label: 'نافذة تنبيه مخصصة 📋',
    desc: 'إظهار نافذة منبثقة بتصميم وعنوان مخصصين عند النقر',
    icon: HelpCircle,
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
};

// Map icon strings to Lucide components
const iconMap: Record<string, any> = {
  MessageCircle,
  Calendar,
  BookmarkCheck: Target,
  User: Users,
  BarChart3,
  Mic,
  Volume2,
  Paperclip,
  Flame,
  HeartHandshake,
  Target,
  FileText,
  Bell,
  Smile,
  Sparkles,
  Palette,
  Layers,
  Crown,
  TrendingUp,
  BookOpen,
  Compass,
  Maximize2,
  SlidersHorizontal,
  Globe,
  ShieldAlert,
  Wrench,
  Rocket,
};

export const AdminFeaturesView: React.FC<AdminFeaturesViewProps> = ({ token }) => {
  const [features, setFeatures] = useState<FeatureRuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'matrix' | 'simulator'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');

  // Edit Modal State
  const [editingFeature, setEditingFeature] = useState<FeatureRuleConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Simulator State
  const [simUserType, setSimUserType] = useState<'guest' | 'authenticated'>('guest');
  const [simEmail, setSimEmail] = useState('');
  const [simPlan, setSimPlan] = useState<'free' | 'premium' | 'pro'>('free');
  const [simAccountAgeDays, setSimAccountAgeDays] = useState(0);
  const [simMessagesCount, setSimMessagesCount] = useState(0);
  const [simCompletedTasks, setSimCompletedTasks] = useState(0);
  const [simResults, setSimResults] = useState<Record<string, any> | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchFeatures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/features', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load feature rules');
      const data = await res.json();
      setFeatures(data);
    } catch (err: any) {
      setError(err.message || 'Error loading features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [token]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleQuickAudienceChange = async (feature: FeatureRuleConfig, audience: FeatureAudience) => {
    const updated = { ...feature, targetAudience: audience };
    try {
      const res = await fetch(`/api/admin/features/${feature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update');
      const saved = await res.json();
      setFeatures((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      showToast(`تم تحديث نطاق ظهور "${feature.nameAr}" بنجاح ✨`);
    } catch (err: any) {
      setError('فشل في حفظ التعديل السريع');
    }
  };

  const handleQuickMaintenanceToggle = async (feature: FeatureRuleConfig) => {
    const isCurrentlyMaintenance = feature.lockedBehavior === 'maintenance';
    const updated: FeatureRuleConfig = {
      ...feature,
      lockedBehavior: isCurrentlyMaintenance ? 'badge_lock' : 'maintenance',
      customLockTitle: isCurrentlyMaintenance ? undefined : (feature.customLockTitle || 'الميزة تحت الصيانة والتحسينات'),
      customLockMessage: isCurrentlyMaintenance ? undefined : (feature.customLockMessage || 'نعمل حالياً على تطوير وتحديث هذه الميزة لتكون بأفضل أداء، سنعاود إتاحتها قريباً! 🛠️'),
    };

    try {
      const res = await fetch(`/api/admin/features/${feature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update');
      const saved = await res.json();
      setFeatures((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      showToast(
        !isCurrentlyMaintenance
          ? `تم تفعيل وضع الصيانة لميزة "${feature.nameAr}" بنجاح 🛠️`
          : `تم إلغاء وضع الصيانة لميزة "${feature.nameAr}" بنجاح ✨`
      );
    } catch (err: any) {
      setError('فشل في تعديل وضع الصيانة');
    }
  };

  const handleQuickPlanNoneToggle = async (feature: FeatureRuleConfig) => {
    const isNone = (feature.allowedPlans || []).includes('none');
    const updated: FeatureRuleConfig = {
      ...feature,
      allowedPlans: isNone ? ['all'] : ['none'],
    };

    try {
      const res = await fetch(`/api/admin/features/${feature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update');
      const saved = await res.json();
      setFeatures((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      showToast(
        !isNone
          ? `تم إخفاء ميزة "${feature.nameAr}" من كافة الباقات (بلا) 🚫`
          : `تم إعادة إتاحة ميزة "${feature.nameAr}" لكافة الباقات ✨`
      );
    } catch (err: any) {
      setError('فشل في تعديل باقات الميزة');
    }
  };

  const handleSaveModal = async () => {
    if (!editingFeature) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/features/${editingFeature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingFeature),
      });
      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      setFeatures((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      setEditingFeature(null);
      showToast(`تم حفظ قواعد ميزة "${saved.nameAr}" بنجاح وتطبيقها في الوقت الفعلي 🚀`);
    } catch (err: any) {
      setError('فشل في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط جميع الميزات لتكون متاحة للجميع بالوضع الافتراضي؟')) return;
    try {
      const res = await fetch('/api/admin/features/reset-defaults', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to reset');
      const data = await res.json();
      setFeatures(data.features);
      showToast('تمت إعادة تعيين جميع الميزات بنجاح!');
    } catch (err: any) {
      setError('فشل في إعادة التعيين');
    }
  };

  const runSimulation = async () => {
    setSimLoading(true);
    try {
      const payload = {
        userId: simUserType === 'guest' ? 'user_default_01' : 'USR-TEST-001',
        email: simUserType === 'guest' ? '' : simEmail || 'user@example.com',
        planId: simPlan,
        accountCreatedAt:
          simAccountAgeDays > 0
            ? new Date(Date.now() - simAccountAgeDays * 24 * 60 * 60 * 1000).toISOString()
            : new Date().toISOString(),
        messagesCount: simMessagesCount,
        tasksCompletedCount: simCompletedTasks,
      };

      const res = await fetch('/api/admin/features/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSimResults(data.evaluation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  const filteredFeatures = features.filter((f) => {
    const matchesSearch =
      f.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesAudience = selectedAudience === 'all' || f.targetAudience === selectedAudience;
    return matchesSearch && matchesCategory && matchesAudience;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>نظام التحكم بالواجهات والصلاحيات الديناميكية</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">إدارة الميزات وظهور الأزرار والواجهات</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            تحكم كامل في إظهار أو إخفاء أي زر أو واجهة، تخصيصها لمشتركين محددين، ربطها بالباقات، أو تفعيل الكشف التدريجي لإبهار المستخدمين مع زيادة تفاعلهم.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab(activeTab === 'matrix' ? 'simulator' : 'matrix')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              activeTab === 'simulator'
                ? 'bg-amber-600 text-white shadow-amber-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{activeTab === 'simulator' ? 'العودة لقائمة الميزات' : 'محاكي تجربة المستخدم 🧪'}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all text-xs flex items-center gap-1.5"
            title="إعادة ضبط الكل للافتراضي"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg shadow-emerald-500/10">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold">إجمالي الميزات المسجلة</p>
            <p className="text-lg font-black text-white">{features.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold">متاحة للجميع (عام)</p>
            <p className="text-lg font-black text-emerald-400">
              {features.filter((f) => f.targetAudience === 'everyone').length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold">مقيدة بالباقات والخطط</p>
            <p className="text-lg font-black text-amber-400">
              {features.filter((f) => f.allowedPlans && f.allowedPlans.length > 0 && !f.allowedPlans.includes('all')).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold">كشف تدريجي مفعّل</p>
            <p className="text-lg font-black text-purple-400">
              {features.filter((f) => f.progressiveDisclosure?.enabled).length}
            </p>
          </div>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن ميزة، زر، أو واجهة..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl ps-9 pe-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">كل الأقسام</option>
                <option value="tabs">الواجهات والتبويبات</option>
                <option value="actions">الأزرار العلوية</option>
                <option value="chat_tools">أدوات المحادثة</option>
                <option value="saved_tools">أدوات المحفوظات</option>
                <option value="preferences">التفضيلات والمظهر</option>
              </select>

              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">كل الفئات المستهدفة</option>
                <option value="everyone">الجميع (عام)</option>
                <option value="authenticated_only">المسجلون فقط</option>
                <option value="specific_users">مستخدمون محددون</option>
                <option value="disabled">معطلة كلياً</option>
              </select>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFeatures.map((feature) => {
              const IconComp = iconMap[feature.icon] || Sparkles;
              const audInfo = audienceLabels[feature.targetAudience] || audienceLabels.everyone;
              const hasPlans =
                feature.allowedPlans && feature.allowedPlans.length > 0 && !feature.allowedPlans.includes('all');
              const hasProgressive = feature.progressiveDisclosure?.enabled;
              const hasTimeWindow = feature.timeWindow?.enabled;

              return (
                <div
                  key={feature.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-xl hover:shadow-indigo-950/20"
                >
                  <div className="space-y-3">
                    {/* Header: Icon, Name & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white">{feature.nameAr}</h3>
                          <p className="text-[10px] text-slate-400 font-mono">{feature.id}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingFeature({ ...feature })}
                        className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl transition-all text-xs"
                        title="تعديل الشروط والقواعد"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {feature.descriptionAr}
                    </p>

                    {/* Rules Pill Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {/* Target Audience Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${audInfo.color}`}
                      >
                        <audInfo.icon className="w-3 h-3" />
                        <span>{audInfo.label}</span>
                      </span>

                      {/* Plan Restrictions */}
                      {hasPlans ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                            feature.allowedPlans.includes('none')
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>
                            {feature.allowedPlans.includes('none')
                              ? 'بلا (مخفية عن كل الباقات)'
                              : `باقة: ${feature.allowedPlans.join(', ')}`}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                          كل الباقات
                        </span>
                      )}

                      {/* Progressive Disclosure */}
                      {hasProgressive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <Clock className="w-3 h-3" />
                          <span>
                            {feature.progressiveDisclosure.minAccountAgeDays > 0 &&
                              `بعد ${feature.progressiveDisclosure.minAccountAgeDays} يوم`}
                            {feature.progressiveDisclosure.minMessagesSent > 0 &&
                              ` | ${feature.progressiveDisclosure.minMessagesSent} رسالة`}
                            {feature.progressiveDisclosure.minCompletedTasks > 0 &&
                              ` | ${feature.progressiveDisclosure.minCompletedTasks} مهام`}
                          </span>
                        </span>
                      )}

                      {/* Locked Behavior */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                          lockedBehaviorLabels[feature.lockedBehavior]?.color || 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {feature.lockedBehavior === 'maintenance' ? (
                          <>
                            <Wrench className="w-3 h-3 text-orange-400" />
                            <span>صيانة 🛠️</span>
                          </>
                        ) : feature.lockedBehavior === 'coming_soon' ? (
                          <>
                            <Rocket className="w-3 h-3 text-purple-400" />
                            <span>قريباً 🚀</span>
                          </>
                        ) : feature.lockedBehavior === 'badge_lock' ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>قفل وترقية</span>
                          </>
                        ) : feature.lockedBehavior === 'custom_popup' ? (
                          <>
                            <HelpCircle className="w-3 h-3 text-indigo-400" />
                            <span>تنبيه مخصص</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>إخفاء كلي</span>
                          </>
                        )}
                      </span>

                      {/* Custom Badge Tag */}
                      {feature.customBadge && feature.customBadge !== 'none' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Tag className="w-2.5 h-2.5" />
                          <span>
                            {feature.customBadge === 'new'
                              ? 'جديد ✨'
                              : feature.customBadge === 'beta'
                              ? 'تجريبي 🧪'
                              : feature.customBadge === 'maintenance'
                              ? 'صيانة 🛠️'
                              : feature.customBadge === 'coming_soon'
                              ? 'قريباً 🚀'
                              : feature.customBadge === 'vip'
                              ? 'VIP 👑'
                              : feature.customBadgeText || 'شارة مخصصة'}
                          </span>
                        </span>
                      )}

                      {/* Device targeting badge */}
                      {feature.deviceTarget && feature.deviceTarget !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {feature.deviceTarget === 'mobile_only' ? <Smartphone className="w-2.5 h-2.5" /> : <Laptop className="w-2.5 h-2.5" />}
                          <span>{feature.deviceTarget === 'mobile_only' ? 'موبايل فقط' : 'كمبيوتر فقط'}</span>
                        </span>
                      )}
                    </div>

                    {/* Whitelisted users count if applicable */}
                    {feature.targetAudience === 'specific_users' && (
                      <div className="text-[10px] text-amber-300/80 bg-amber-950/30 p-2 rounded-xl border border-amber-500/20">
                        <span>قائمة المسموح لهم: </span>
                        <span className="font-mono">
                          {feature.specificUsers && feature.specificUsers.length > 0
                            ? feature.specificUsers.join(', ')
                            : 'لم يُحدد مستخدمون بعد'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons Footer */}
                  <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">نطاق الظهور:</span>
                      <div className="flex items-center gap-1">
                        {(['everyone', 'authenticated_only', 'disabled'] as FeatureAudience[]).map((aud) => (
                          <button
                            key={aud}
                            onClick={() => handleQuickAudienceChange(feature, aud)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                              feature.targetAudience === aud
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {aud === 'everyone' ? 'الكل' : aud === 'authenticated_only' ? 'مسجلين' : 'تعطيل'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fast Mode Toggles */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => handleQuickMaintenanceToggle(feature)}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          feature.lockedBehavior === 'maintenance'
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                            : 'bg-slate-800/80 hover:bg-orange-950/40 text-slate-300 hover:text-orange-300 border border-slate-700'
                        }`}
                        title="تبديل وضع الصيانة لهذه الميزة فوراً"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>{feature.lockedBehavior === 'maintenance' ? 'الصيانة مفعلة 🛠️' : 'وضع الصيانة'}</span>
                      </button>

                      <button
                        onClick={() => handleQuickPlanNoneToggle(feature)}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          (feature.allowedPlans || []).includes('none')
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700'
                        }`}
                        title="إخفاء الميزة تماماً عن جميع الباقات (بلا)"
                      >
                        <Ban className="w-3 h-3" />
                        <span>{(feature.allowedPlans || []).includes('none') ? 'مخفية (بلا) 🚫' : 'إخفاء بالباقات'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* User Simulator / Live Sandbox Tab */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <span>محاكي تجربة المستخدم المباشرة (Live Experience Simulator)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                اختر مواصفات المستخدم أو الزائر لتشاهد بدقة متناهية ما هي الأزرار والواجهات التي ستظهر له وما هي العناصر التي ستختفي أو تظهر كشعار مقفل أو في وضع الصيانة.
              </p>
            </div>

            {/* Simulation Controls Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              {/* 1. User Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">حالة المستخدم:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimUserType('guest')}
                    className={`py-2 px-3 rounded-xl font-bold transition-all ${
                      simUserType === 'guest'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    زائر / غير مسجل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimUserType('authenticated')}
                    className={`py-2 px-3 rounded-xl font-bold transition-all ${
                      simUserType === 'authenticated'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    مستخدم مسجل
                  </button>
                </div>
              </div>

              {/* 2. Email Address */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">البريد الإلكتروني التجريبي:</label>
                <input
                  type="email"
                  disabled={simUserType === 'guest'}
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  placeholder="vip-user@gmail.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 disabled:opacity-40"
                />
              </div>

              {/* 3. Subscription Plan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">خطة الاشتراك الحالية:</label>
                <select
                  disabled={simUserType === 'guest'}
                  value={simPlan}
                  onChange={(e: any) => setSimPlan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-40"
                >
                  <option value="free">الخطة المجانية (Free)</option>
                  <option value="premium">الخطة المتقدمة (Premium)</option>
                  <option value="pro">الخطة الاحترافية (Pro Family)</option>
                </select>
              </div>

              {/* 4. Account Age */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">عمر الحساب بالأيام (مدة الاستخدام):</label>
                <input
                  type="number"
                  min="0"
                  value={simAccountAgeDays}
                  onChange={(e) => setSimAccountAgeDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* 5. Messages Sent Count */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">عدد الرسائل المرسلة للرفيق:</label>
                <input
                  type="number"
                  min="0"
                  value={simMessagesCount}
                  onChange={(e) => setSimMessagesCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* 6. Tasks Completed */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">عدد المهام المنجزة:</label>
                <input
                  type="number"
                  min="0"
                  value={simCompletedTasks}
                  onChange={(e) => setSimCompletedTasks(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={simLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{simLoading ? 'جاري فحص وتطبيق الشروط...' : 'تشغيل المحاكاة ومعاينة مظهر التطبيق لهذا المستخدم 🚀'}</span>
            </button>
          </div>

          {/* Simulation Output Cards */}
          {simResults && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="font-bold text-sm text-slate-200">نتائج الفحص الحي لكل عنصر في التطبيق:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {features.map((feature) => {
                  const evalStatus = simResults[feature.id];
                  const IconComp = iconMap[feature.icon] || Sparkles;

                  return (
                    <div
                      key={feature.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        evalStatus?.enabled
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : evalStatus?.lockedBehavior === 'maintenance'
                          ? 'bg-orange-950/20 border-orange-500/30'
                          : evalStatus?.lockedBehavior === 'coming_soon'
                          ? 'bg-purple-950/20 border-purple-500/30'
                          : evalStatus?.lockedBehavior === 'badge_lock'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-900/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <IconComp className="w-4 h-4 text-slate-300" />
                          <span className="font-bold text-xs text-white">{feature.nameAr}</span>
                        </div>

                        {evalStatus?.enabled ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            مفتوحة وظاهرة ✨
                          </span>
                        ) : evalStatus?.lockedBehavior === 'maintenance' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                            <Wrench className="w-2.5 h-2.5" />
                            <span>صيانة 🛠️</span>
                          </span>
                        ) : evalStatus?.lockedBehavior === 'coming_soon' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <Rocket className="w-2.5 h-2.5" />
                            <span>قريباً 🚀</span>
                          </span>
                        ) : evalStatus?.lockedBehavior === 'badge_lock' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>شارة مقفلة</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            مخفية كلياً 🙈
                          </span>
                        )}
                      </div>

                      {/* Reason text */}
                      {!evalStatus?.enabled && (
                        <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                          {evalStatus?.lockMessage || 'غير مستوفٍ للشروط'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Feature Rule Comprehensive Modal */}
      {editingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">تعديل قواعد وظهور: {editingFeature.nameAr}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{editingFeature.id}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingFeature(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Target Audience */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>1. الجمهور المستهدف (Target Audience):</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['everyone', 'authenticated_only', 'specific_users', 'disabled'] as FeatureAudience[]).map((aud) => {
                  const isSelected = editingFeature.targetAudience === aud;
                  const info = audienceLabels[aud];
                  return (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => setEditingFeature({ ...editingFeature, targetAudience: aud })}
                      className={`p-3 rounded-2xl font-bold flex flex-col items-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <info.icon className="w-4 h-4" />
                      <span className="text-[11px] text-center">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Whitelisted users if specific_users */}
            {editingFeature.targetAudience === 'specific_users' && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                <label className="font-bold text-amber-300">
                  إيميلات أو معرّفات المستخدمين المسموح لهم فقط (مفصولة بفواصل):
                </label>
                <input
                  type="text"
                  value={editingFeature.specificUsers?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      specificUsers: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  placeholder="user1@gmail.com, USR-1234, admin@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400">
                  لن تظهر هذه الميزة إلا لهؤلاء المستخدمين المحددين حصراً عند تسجيل دخولهم.
                </p>
              </div>
            )}

            {/* 2. Subscription Plans Entitlement with "None" support */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>2. ربط الميزة بالباقات والخطط (Plan Tiers):</span>
                </label>

                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingFeature({ ...editingFeature, allowedPlans: ['all'] })}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg"
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFeature({ ...editingFeature, allowedPlans: ['none'] })}
                    className="px-2 py-1 bg-rose-900/40 hover:bg-rose-800/60 text-[10px] font-bold text-rose-300 rounded-lg border border-rose-500/30"
                  >
                    بلا (إخفاء) 🚫
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFeature({ ...editingFeature, allowedPlans: ['premium', 'pro'] })}
                    className="px-2 py-1 bg-amber-900/40 hover:bg-amber-800/60 text-[10px] font-bold text-amber-300 rounded-lg border border-amber-500/30"
                  >
                    مدفوع فقط 👑
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'متاحة لكل الباقات', desc: 'تظهر للجميع' },
                  { id: 'none', label: 'بلا / إخفاء من الجميع 🚫', desc: 'لا تظهر لأي باقة' },
                  { id: 'free', label: 'الخطة المجانية Free', desc: 'الباقة العادية' },
                  { id: 'premium', label: 'الخطة المتقدمة Premium', desc: 'باقة الأفراد' },
                  { id: 'pro', label: 'الخطة الاحترافية Pro', desc: 'باقة العائلة والبرو' },
                ].map((planOption) => {
                  const currentPlans = editingFeature.allowedPlans || ['all'];
                  const isChecked =
                    planOption.id === 'all'
                      ? currentPlans.includes('all')
                      : planOption.id === 'none'
                      ? currentPlans.includes('none')
                      : !currentPlans.includes('none') && currentPlans.includes(planOption.id);

                  const togglePlan = () => {
                    if (planOption.id === 'all') {
                      setEditingFeature({ ...editingFeature, allowedPlans: ['all'] });
                    } else if (planOption.id === 'none') {
                      setEditingFeature({ ...editingFeature, allowedPlans: ['none'] });
                    } else {
                      let current = currentPlans.filter((p) => p !== 'all' && p !== 'none');
                      if (current.includes(planOption.id)) {
                        current = current.filter((p) => p !== planOption.id);
                      } else {
                        current.push(planOption.id);
                      }
                      if (current.length === 0) current = ['all'];
                      setEditingFeature({ ...editingFeature, allowedPlans: current });
                    }
                  };

                  return (
                    <button
                      key={planOption.id}
                      type="button"
                      onClick={togglePlan}
                      className={`p-2.5 rounded-2xl font-bold flex items-center justify-between border transition-all ${
                        isChecked
                          ? planOption.id === 'none'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-start">
                        <span className="text-[11px] block">{planOption.label}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Locked Behavior & Custom Alert Messages */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-orange-400" />
                <span>3. سلوك العنصر عند عدم استيفاء الشروط أو الصيانة (Locked Behavior):</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {(
                  [
                    'hide',
                    'badge_lock',
                    'maintenance',
                    'coming_soon',
                    'custom_popup',
                  ] as FeatureLockedBehavior[]
                ).map((behavior) => {
                  const isSelected = editingFeature.lockedBehavior === behavior;
                  const item = lockedBehaviorLabels[behavior];
                  const Icon = item.icon;

                  return (
                    <button
                      key={behavior}
                      type="button"
                      onClick={() => setEditingFeature({ ...editingFeature, lockedBehavior: behavior })}
                      className={`p-3 rounded-2xl font-bold flex items-start gap-2.5 border transition-all text-start ${
                        isSelected
                          ? behavior === 'maintenance'
                            ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-600/30'
                            : behavior === 'coming_soon'
                            ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                            : behavior === 'badge_lock'
                            ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                            : 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs">{item.label}</p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Title and Message Configuration */}
              {editingFeature.lockedBehavior !== 'hide' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 text-[11px]">
                      عنوان نافذة التنبيه أو الصيانة (Custom Title):
                    </label>
                    <input
                      type="text"
                      value={editingFeature.customLockTitle || ''}
                      onChange={(e) =>
                        setEditingFeature({ ...editingFeature, customLockTitle: e.target.value })
                      }
                      placeholder={
                        editingFeature.lockedBehavior === 'maintenance'
                          ? 'الميزة تحت الصيانة والتحسينات 🛠️'
                          : editingFeature.lockedBehavior === 'coming_soon'
                          ? 'قريباً جداً في التحديث القادم 🚀'
                          : 'ترقية باقة الاشتراك مطلوبة 👑'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 text-[11px]">
                      رسالة التوضيح المخصصة عند الضغط على الميزة المقفلة:
                    </label>
                    <textarea
                      rows={2}
                      value={editingFeature.customLockMessage || ''}
                      onChange={(e) =>
                        setEditingFeature({ ...editingFeature, customLockMessage: e.target.value })
                      }
                      placeholder={
                        editingFeature.lockedBehavior === 'maintenance'
                          ? 'نعمل حالياً على تحديث هذه الميزة لتحسين سرعتها ودقتها، سنعاود فتحها خلال الساعات القادمة.'
                          : editingFeature.lockedBehavior === 'coming_soon'
                          ? 'هذه الميزة الذكية قيد التطوير والإطلاق قريباً جداً، ترقبوها!'
                          : 'هذه الميزة مخصصة لمشتركي باقة البريميوم، قم بالترقية الآن للاستفادة الكاملة ✨'
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Granular Targeting: Device & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              {/* Device Targeting */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>استهداف نوع الجهاز (Device Target):</span>
                </label>
                <select
                  value={editingFeature.deviceTarget || 'all'}
                  onChange={(e: any) =>
                    setEditingFeature({
                      ...editingFeature,
                      deviceTarget: e.target.value as FeatureDeviceTarget,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">كافة الأجهزة (موبايل وكمبيوتر)</option>
                  <option value="mobile_only">الهواتف والأجهزة الذكية فقط 📱</option>
                  <option value="desktop_only">أجهزة الكمبيوتر وسطح المكتب فقط 💻</option>
                </select>
              </div>

              {/* Language Targeting */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  <span>استهداف لغة الواجهة (Language Target):</span>
                </label>
                <select
                  value={editingFeature.languageTarget || 'all'}
                  onChange={(e: any) =>
                    setEditingFeature({
                      ...editingFeature,
                      languageTarget: e.target.value as FeatureLanguageTarget,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">كافة اللغات 🌐</option>
                  <option value="ar_only">اللغة العربية فقط 🇸🇦</option>
                  <option value="en_only">اللغة الإنجليزية فقط 🇬🇧</option>
                </select>
              </div>
            </div>

            {/* 5. Custom Button Badge (شارة تسويقية أو تنبيهية على الزر) */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-200 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>شارة تسويقية أو تنبيهية على الزر (Visual Badge):</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: 'none', label: 'بدون شارة' },
                  { type: 'new', label: 'جديد ✨' },
                  { type: 'beta', label: 'تجريبي 🧪' },
                  { type: 'maintenance', label: 'صيانة 🛠️' },
                  { type: 'coming_soon', label: 'قريباً 🚀' },
                  { type: 'vip', label: 'VIP 👑' },
                  { type: 'custom', label: 'نص مخصص ✍️' },
                ].map((badgeOpt) => {
                  const isCurrent = (editingFeature.customBadge || 'none') === badgeOpt.type;
                  return (
                    <button
                      key={badgeOpt.type}
                      type="button"
                      onClick={() =>
                        setEditingFeature({
                          ...editingFeature,
                          customBadge: badgeOpt.type as FeatureCustomBadge,
                        })
                      }
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {badgeOpt.label}
                    </button>
                  );
                })}
              </div>

              {editingFeature.customBadge === 'custom' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={editingFeature.customBadgeText || ''}
                    onChange={(e) =>
                      setEditingFeature({
                        ...editingFeature,
                        customBadgeText: e.target.value,
                      })
                    }
                    placeholder="اكتب النص مثل: حصري، خصم 50%، ميزة الأسبوع..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* 6. Progressive Disclosure (الكشف التدريجي مع الوقت والتفاعل) */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <div>
                    <h4 className="font-extrabold text-slate-200 text-xs">
                      6. نظام الكشف التدريجي المدهش (Progressive Disclosure)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      إخفاء الميزة في البداية لتسهيل الواجهة ثم إظهارها تلقائياً بعد فترة من الاستخدام لإبهار العميل.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={editingFeature.progressiveDisclosure?.enabled || false}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      progressiveDisclosure: {
                        enabled: e.target.checked,
                        minAccountAgeDays: editingFeature.progressiveDisclosure?.minAccountAgeDays || 0,
                        minMessagesSent: editingFeature.progressiveDisclosure?.minMessagesSent || 0,
                        minCompletedTasks: editingFeature.progressiveDisclosure?.minCompletedTasks || 0,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {editingFeature.progressiveDisclosure?.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 text-[11px]">بعد أيام من التسجيل:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingFeature.progressiveDisclosure?.minAccountAgeDays || 0}
                      onChange={(e) =>
                        setEditingFeature({
                          ...editingFeature,
                          progressiveDisclosure: {
                            ...editingFeature.progressiveDisclosure,
                            minAccountAgeDays: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 text-[11px]">بعد عدد رسائل مرسلة:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingFeature.progressiveDisclosure?.minMessagesSent || 0}
                      onChange={(e) =>
                        setEditingFeature({
                          ...editingFeature,
                          progressiveDisclosure: {
                            ...editingFeature.progressiveDisclosure,
                            minMessagesSent: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 text-[11px]">بعد إنجاز عدد مهام:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingFeature.progressiveDisclosure?.minCompletedTasks || 0}
                      onChange={(e) =>
                        setEditingFeature({
                          ...editingFeature,
                          progressiveDisclosure: {
                            ...editingFeature.progressiveDisclosure,
                            minCompletedTasks: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ ونشر التعديل فوراً 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

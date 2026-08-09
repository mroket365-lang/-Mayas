import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { Mic, Image, Video, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface PermissionsModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ profile, onClose }) => {
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [mediaLibraryStatus, setMediaLibraryStatus] = useState<'prompt' | 'granted'>('granted');

  const t = getTranslation(profile.language);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((res) => setMicStatus(res.state as 'prompt' | 'granted' | 'denied'))
        .catch(() => {});

      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((res) => setCameraStatus(res.state as 'prompt' | 'granted' | 'denied'))
        .catch(() => {});
    }
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('granted');
      stream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.warn('Microphone permission error:', e);
      setMicStatus('denied');
    }
  };

  const requestCameraAndVideoPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('granted');
      stream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.warn('Camera/Video permission error:', e);
      setCameraStatus('denied');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b pb-3 border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[var(--accent-sage)]" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">{t.permissionsTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t.permissionsDesc}</p>

        <div className="space-y-3">
          {/* Microphone Permission */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">
                  {profile.language === 'ar' ? 'الميكروفون (التسجيل الصوتي)' : 'Microphone (Voice Input)'}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {micStatus === 'granted'
                    ? profile.language === 'ar' ? 'مسموح به' : 'Granted'
                    : micStatus === 'denied'
                    ? profile.language === 'ar' ? 'مرفوض - يرجى التفعيل من المتصفح' : 'Denied - Allow in browser'
                    : profile.language === 'ar' ? 'يتطلب الإذن للتحدث' : 'Requires permission to speak'}
                </p>
              </div>
            </div>

            {micStatus === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <button
                onClick={requestMicPermission}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                {t.grantPermissions}
              </button>
            )}
          </div>

          {/* Camera / Video Permission */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">
                  {profile.language === 'ar' ? 'الكاميرا وتسجيل الفيديو' : 'Camera & Video Recording'}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {cameraStatus === 'granted'
                    ? profile.language === 'ar' ? 'مسموح به' : 'Granted'
                    : cameraStatus === 'denied'
                    ? profile.language === 'ar' ? 'مرفوض' : 'Denied'
                    : profile.language === 'ar' ? 'لتقاط الصور والفيديوهات مباشرة' : 'To capture photos & videos'}
                </p>
              </div>
            </div>

            {cameraStatus === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <button
                onClick={requestCameraAndVideoPermission}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm"
              >
                {t.grantPermissions}
              </button>
            )}
          </div>

          {/* Photo & Video Library Permission */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">
                  {profile.language === 'ar' ? 'معرض الصور والفيديوهات' : 'Photo & Video Gallery'}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {profile.language === 'ar' ? 'متاح لاختيار الملفات ومشاركتها' : 'Available to attach and share'}
                </p>
              </div>
            </div>

            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[var(--accent-sage)] text-white font-bold text-sm shadow-md hover:opacity-90 transition-all"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};

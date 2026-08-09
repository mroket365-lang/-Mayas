import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Copy, Check, ListFilter, Sparkles, Scissors } from 'lucide-react';

interface SnippetExtractorModalProps {
  text: string;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const SnippetExtractorModal: React.FC<SnippetExtractorModalProps> = ({
  text,
  profile,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isArabic = profile.language === 'ar';
  const [copiedIdx, setCopiedIdx] = useState<number | 'all' | null>(null);

  // Split text into lines/paragraphs or bullet points
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleCopy = (content: string, index: number | 'all') => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-2xl overflow-y-auto max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)]">
                {isArabic ? 'تحديد ونسخ أجزاء النص' : 'Extract & Copy Snippets'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isArabic ? 'اختر الفقرة أو السطر الذي تريد نسخه بشكل منفصل' : 'Copy specific paragraphs or lines individually'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Entire Text Button */}
        <div className="flex justify-end">
          <button
            onClick={() => handleCopy(text, 'all')}
            className="px-3.5 py-2 rounded-2xl bg-[var(--accent-sage)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all"
          >
            {copiedIdx === 'all' ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>{isArabic ? 'تم نسخ الرسالة كاملة!' : 'Entire Message Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{isArabic ? 'نسخ كافة النص' : 'Copy Full Message'}</span>
              </>
            )}
          </button>
        </div>

        {/* Parsed Snippets List */}
        <div className="space-y-2.5">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] flex items-start justify-between gap-3 text-xs leading-relaxed group transition-all hover:border-[var(--accent-sage)]"
            >
              <p className="text-[var(--text-main)] flex-1 whitespace-pre-wrap select-text font-medium">
                {line}
              </p>

              <button
                onClick={() => handleCopy(line, idx)}
                className={`p-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  copiedIdx === idx
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:border-[var(--accent-sage)]'
                }`}
                title={isArabic ? 'نسخ هذه الفقرة' : 'Copy snippet'}
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isArabic ? 'تم' : 'Done'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isArabic ? 'نسخ' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

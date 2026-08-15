import React, { useState } from 'react';
import { CompanionItem, UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import {
  FileText,
  Image as ImageIcon,
  X,
  Save,
  Feather,
  Quote,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

interface LongNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CompanionItem) => void;
  profile: UserProfile;
  initialItem?: CompanionItem | null;
}

export const LongNoteModal: React.FC<LongNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
  initialItem,
}) => {
  if (!isOpen) return null;

  const isArabic = profile.language === 'ar';
  const t = getTranslation(profile.language);

  const [title, setTitle] = useState(initialItem?.title || '');
  const [content, setContent] = useState(initialItem?.description || '');
  const [category, setCategory] = useState<'long_note' | 'poetry' | 'snippet' | 'draft'>(
    initialItem?.noteCategory || 'long_note'
  );
  const [imageUrl, setImageUrl] = useState<string>(initialItem?.imageUrl || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(isArabic ? 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت' : 'Image size too large (<5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const updatedItem: CompanionItem = {
      id: initialItem?.id || 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: initialItem?.userId || profile.id || 'user_local',
      type: 'note',
      title: title.trim(),
      description: content.trim(),
      status: 'pending',
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLongNote: true,
      noteCategory: category,
      imageUrl: imageUrl || undefined,
    };

    onSave(updatedItem);
    onClose();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split('\n').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {initialItem ? (isArabic ? 'تعديل الملاحظة الطويلة' : 'Edit Long Note') : (isArabic ? 'تدوين ملاحظة طويلة / قصيدة / مقتطف' : 'New Long Note & Poetry')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {isArabic ? 'احفظ خواطرك، أفكارك، قصائدك ومقتطفاتك مع إمكانية إرفاق صورة' : 'Save long writings, poems, and excerpts with photo attachments'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] mb-1.5 block">
              {isArabic ? 'تصنيف الملاحظة:' : 'Category:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'long_note', label: isArabic ? 'ملاحظة طويلة 📝' : 'Long Note 📝' },
                { id: 'poetry', label: isArabic ? 'قصيدة شِعرية 📜' : 'Poetry 📜' },
                { id: 'snippet', label: isArabic ? 'مقتطفات واقتباس ✨' : 'Excerpt ✨' },
                { id: 'draft', label: isArabic ? 'مسودة مقال 💡' : 'Article Draft 💡' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    category === cat.id
                      ? 'bg-[var(--accent-sage)] text-white border-[var(--accent-sage)] shadow-sm'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
              {isArabic ? 'عنوان الملاحظة / القصيدة:' : 'Note Title:'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isArabic ? 'مثال: قصيدة في الأمل، مقتطفات من كتاب الشغف...' : 'e.g., Morning Thoughts, Poetry on Hope...'}
              className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
              required
            />
          </div>

          {/* Content Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[var(--text-muted)]">
                {isArabic ? 'نص الملاحظة أو المقتطف:' : 'Content:'}
              </label>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {isArabic ? `${wordCount} كلمة | ${lineCount} سطر` : `${wordCount} words | ${lineCount} lines`}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder={isArabic ? 'اكتب هنا أفكارك ونصوصك الطويلة، أسطر القصيدة أو المقتطفات براحتك...' : 'Write your long text, poem lines or quotes freely here...'}
              className="w-full p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)] resize-y min-h-[160px]"
              required
            />
          </div>

          {/* Image Attachment Section */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>{isArabic ? 'إرفاق صورة مع الملاحظة:' : 'Attach Image:'}</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'حذف الصورة' : 'Remove'}</span>
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] max-h-48">
                <img src={imageUrl} alt="Attached" className="w-full h-48 object-cover rounded-2xl" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-center space-y-2 hover:bg-[var(--bg-hover)] transition-colors">
                <Upload className="w-6 h-6 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {isArabic ? 'اختر صورة من جهازك لربطها بهذه الملاحظة' : 'Upload photo to attach with note'}
                </p>
                <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm">
                  <span>{isArabic ? 'اختر صورة 📷' : 'Choose Photo 📷'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isArabic ? 'حفظ الملاحظة الطويلة ✨' : 'Save Long Note ✨'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] font-bold text-xs sm:text-sm hover:bg-[var(--bg-hover)] transition-all"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

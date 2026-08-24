import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Bold, Italic, Heading1, Heading2, List, Quote, Code, Eye, Edit3, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Article, HistoricalCategory } from '../types';
import { uploadBlogImage, formatArticleContent } from '../lib/blogService';

interface BlogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
  articleToEdit?: Article | null;
}

const CATEGORIES: HistoricalCategory[] = [
  'საქართველოს ისტორია',
  'ძველი მსოფლიო',
  'შუა საუკუნეები',
  'ახალი და უახლესი ისტორია',
  'ეროვნული გამოცდები',
  'სხვა ტესტები'
];

export const BlogEditorModal: React.FC<BlogEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  articleToEdit
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HistoricalCategory>('საქართველოს ისტორია');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('ისტორია, ეროვნული გამოცდები');
  const [author, setAuthor] = useState('ნოდარ თოთაძე');
  const [featured, setFeatured] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Inline Image Insertion State
  const [showImageModal, setShowImageModal] = useState(false);
  const [inlineImageUrl, setInlineImageUrl] = useState('');
  const [inlineCaption, setInlineCaption] = useState('');
  const [uploadingInline, setUploadingInline] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (articleToEdit) {
      setTitle(articleToEdit.title || '');
      setCategory(articleToEdit.category || 'საქართველოს ისტორია');
      setExcerpt(articleToEdit.excerpt || '');
      setContent(articleToEdit.content || '');
      setImageUrl(articleToEdit.imageUrl || '');
      setTagsInput(articleToEdit.tags?.join(', ') || 'ისტორია');
      setAuthor(articleToEdit.author || 'ნოდარ თოთაძე');
      setFeatured(articleToEdit.featured || false);
    } else {
      // Reset form for new article
      setTitle('');
      setCategory('საქართველოს ისტორია');
      setExcerpt('');
      setContent('');
      setImageUrl('');
      setTagsInput('ისტორია, ეროვნული გამოცდები');
      setAuthor('ნოდარ თოთაძე');
      setFeatured(false);
    }
    setErrorMessage('');
    setSuccessMessage('');
  }, [articleToEdit, isOpen]);

  if (!isOpen) return null;

  // Insert formatted text snippets at cursor position in textarea
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || 'ტექსტი';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  // Image Upload Handler for Cover Image
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage('');

    try {
      const publicUrl = await uploadBlogImage(file);
      setImageUrl(publicUrl);
      setSuccessMessage('ფოტო წარმატებით აიტვირთა Supabase Storage-ში!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Image upload error:', err);
      setErrorMessage('ფოტოს ატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Inline Image File Upload Handler (For Blog Full Text)
  const handleInlineImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    try {
      const publicUrl = await uploadBlogImage(file);
      setInlineImageUrl(publicUrl);
      setSuccessMessage('ტექსტის ფოტო წარმატებით აიტვირთა Supabase Storage-ში!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Inline image upload error:', err);
      alert('ფოტოს ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingInline(false);
    }
  };

  // Insert Inline Image into Textarea Content
  const handleInsertInlineImage = (finalUrl?: string, captionText?: string) => {
    const urlToUse = finalUrl || inlineImageUrl;
    if (!urlToUse.trim()) return;

    const caption = captionText !== undefined ? captionText : inlineCaption;
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : content.length;
    const end = textarea ? textarea.selectionEnd : content.length;

    const imageSnippet = `\n\n<figure class="my-6 text-center">\n  <img src="${urlToUse.trim()}" alt="${caption.trim()}" class="rounded-2xl max-w-full mx-auto shadow-md border border-[#E6DDCB]" />\n  ${caption.trim() ? `<figcaption class="text-xs text-[#666666] italic mt-2">${caption.trim()}</figcaption>` : ''}\n</figure>\n\n`;

    const newContent = content.substring(0, start) + imageSnippet + content.substring(end);
    setContent(newContent);

    // Reset inline modal form
    setInlineImageUrl('');
    setInlineCaption('');
    setShowImageModal(false);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = start + imageSnippet.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 80);
  };


  // Save / Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('გთხოვთ შეიყვანოთ ბლოგის სათაური');
      return;
    }

    if (!content.trim()) {
      setErrorMessage('გთხოვთ შეიყვანოთ ბლოგის ტექსტი');
      return;
    }

    setIsSaving(true);

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newArticle: Article = {
        id: articleToEdit?.id || `art-${Date.now()}`,
        title: title.trim(),
        slug: title.trim().toLowerCase().replace(/[^a-z0-9georgian]/g, '-'),
        excerpt: excerpt.trim() || title.trim().substring(0, 120),
        content: content.trim(),
        category,
        author: author.trim() || 'ნოდარ თოთაძე',
        date: articleToEdit?.date || new Date().toISOString().split('T')[0],
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66',
        featured,
        tags: tags.length ? tags : ['ისტორია']
      };

      await onSave(newArticle);
      setSuccessMessage('ბლოგი წარმატებით შენახულია!');
      
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error('Error saving article:', err);
      setErrorMessage('ბლოგის შენახვა ვერ მოხერხდა: ' + (err.message || 'უცნობი შეცდომა'));
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#E6DDCB] shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E6DDCB] bg-[#FAF8F3] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C79B3A]">
              ადმინ პანელი
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#13253D]">
              {articleToEdit ? 'ბლოგის რედაქტირება' : 'ახალი ბლოგის დაწერა'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Tabs */}
            <div className="flex bg-[#E6DDCB]/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'write'
                    ? 'bg-white text-[#13253D] shadow-sm'
                    : 'text-[#666666] hover:text-[#13253D]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C79B3A]" />
                <span>რედაქტირება</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-[#13253D] shadow-sm'
                    : 'text-[#666666] hover:text-[#13253D]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#C79B3A]" />
                <span>გადახედვა</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#8A8A8A] hover:text-[#13253D] hover:bg-[#E6DDCB]/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'write' ? (
            <>
              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Title (8 cols) */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider">
                    ბლოგის სათაური *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="მაგ: დავით აღმაშენებლის სამხედრო რეფორმები..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-4 py-2.5 text-sm font-serif font-bold text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                  />
                </div>

                {/* Category (4 cols) */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider">
                    კატეგორია
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as HistoricalCategory)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2.5 text-xs font-medium text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Excerpt Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider">
                  მოკლე აღწერა (Excerpt)
                </label>
                <textarea
                  rows={2}
                  placeholder="ბლოგის მოკლე ანოტაცია, რომელიც გამოჩნდება ბარათებზე..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-4 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                />
              </div>

              {/* Image Upload Box */}
              <div className="space-y-2 p-4 bg-[#FAF8F3] border border-[#E6DDCB] rounded-2xl">
                <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider block">
                  გარეკანის ფოტო (Supabase Storage)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Thumbnail */}
                  <div className="w-full sm:w-36 h-24 rounded-xl bg-white border border-[#E6DDCB] overflow-hidden shrink-0 flex items-center justify-center relative group">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-6 h-6 text-[#C79B3A] mx-auto opacity-60" />
                        <span className="text-[10px] text-[#8A8A8A] mt-1 block">ფოტო არ არის</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#C79B3A]" />
                        )}
                        <span>{uploadingImage ? 'იტვირთება...' : 'ფოტოს ატვირთვა Supabase-ში'}</span>
                      </button>

                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                          წაშლა
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="ან ჩასვით ფოტოს URL პირდაპირ (https://...)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-white border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                    />
                  </div>
                </div>
              </div>

              {/* Rich Formatting Toolbar + Content Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider">
                    ბლოგის სრული ტექსტი *
                  </label>

                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 bg-[#FAF8F3] border border-[#E6DDCB] p-1 rounded-xl flex-wrap">
                    <button
                      type="button"
                      title="Bold (მუქი)"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 hover:bg-white text-[#13253D] rounded-lg transition-colors cursor-pointer"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Italic (დახრილი)"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 hover:bg-white text-[#13253D] rounded-lg transition-colors cursor-pointer"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-[1px] bg-[#E6DDCB] mx-1" />
                    <button
                      type="button"
                      title="Heading 2 (ქვესათაური)"
                      onClick={() => insertFormatting('\n## ', '\n')}
                      className="p-1.5 hover:bg-white text-[#13253D] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      title="Heading 3 (პარაგრაფი)"
                      onClick={() => insertFormatting('\n### ', '\n')}
                      className="p-1.5 hover:bg-white text-[#13253D] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      H3
                    </button>
                    <div className="h-4 w-[1px] bg-[#E6DDCB] mx-1" />
                    <button
                      type="button"
                      title="Quote (ციტატა)"
                      onClick={() => insertFormatting('\n> „', '“\n')}
                      className="p-1.5 hover:bg-white text-[#13253D] rounded-lg transition-colors cursor-pointer"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Bullet List (სია)"
                      onClick={() => insertFormatting('\n- ')}
                      className="p-1.5 hover:bg-white text-[#13253D] rounded-lg transition-colors cursor-pointer"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Code Block"
                      onClick={() => insertFormatting('```\n', '\n```')}
                      className="p-1.5 hover:bg-white text-[#13253D] rounded-lg transition-colors cursor-pointer"
                    >
                      <Code className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-[1px] bg-[#E6DDCB] mx-1" />

                    {/* Inline Image Upload Button */}
                    <button
                      type="button"
                      title="ფოტოს ატვირთვა / ჩასმა ტექსტში (Supabase Storage)"
                      onClick={() => setShowImageModal(true)}
                      className="p-1.5 bg-[#C79B3A]/15 hover:bg-[#13253D] text-[#13253D] hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold px-2.5 border border-[#C79B3A]/30"
                    >
                      <ImageIcon className="w-4 h-4 text-[#C79B3A]" />
                      <span>ფოტოს ჩასმა ტექსტში</span>
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={12}
                  required
                  placeholder="დაწერეთ ბლოგის სრული ტექსტი აქ... შეგიძლიათ გამოიყენოთ ქვესათაურები, ციტატები, სიები და ჩასვათ ფოტოები."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-2xl p-4 text-sm font-sans leading-relaxed text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                />
              </div>

              {/* Extra Metadata (Author, Tags, Featured) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#666666]">ავტორი</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#13253D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#666666]">ტეგები (მძიმით გამოყოფილი)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#13253D]"
                  />
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C79B3A] focus:ring-[#C79B3A]"
                />
                <label htmlFor="featured-checkbox" className="text-xs font-semibold text-[#13253D] cursor-pointer">
                  რჩეული ბლოგი (გამოჩნდება მთავარ გვერდზე გამოყოფილად)
                </label>
              </div>
            </>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-6 bg-[#FAF8F3]/50 p-6 rounded-2xl border border-[#E6DDCB]">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-[#13253D] text-[#C79B3A] text-xs font-bold rounded-full uppercase tracking-wider">
                  {category}
                </span>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#13253D] leading-tight">
                  {title || 'ბლოგის სათაური'}
                </h1>
                <div className="flex items-center gap-3 text-xs text-[#8A8A8A]">
                  <span>ავტორი: {author}</span>
                </div>
              </div>

              {imageUrl && (
                <div className="aspect-[16/9] max-h-[350px] w-full rounded-2xl overflow-hidden border border-[#E6DDCB] shadow-md">
                  <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                </div>
              )}

              {excerpt && (
                <p className="font-serif italic text-base text-[#C79B3A] border-l-2 border-[#C79B3A] pl-4 py-1">
                  {excerpt}
                </p>
              )}

              <div
                dangerouslySetInnerHTML={{ __html: formatArticleContent(content || 'აქ გამოჩნდება თქვენი დაწერილი ტექსტის პირდაპირი გადახედვა...') }}
                className="prose prose-stone max-w-none space-y-4 prose-headings:font-serif prose-headings:text-[#0D1B2A] prose-a:text-[#C79B3A] prose-img:rounded-2xl prose-img:shadow-md prose-img:mx-auto prose-img:my-6 border-t border-[#E6DDCB] pt-4 font-serif text-[#13253D] leading-relaxed"
              />
            </div>
          )}

          {/* Inline Image Modal */}
          {showImageModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white border border-[#E6DDCB] shadow-2xl rounded-2xl p-6 w-full max-w-lg space-y-4 relative">
                <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-3">
                  <h3 className="font-serif font-bold text-lg text-[#13253D] flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#C79B3A]" />
                    <span>ფოტოს ატვირთვა / ჩასმა ტექსტში</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="p-1 text-[#8A8A8A] hover:text-[#13253D] rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Device Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider block">
                      1. აირჩიეთ ფაილი მოწყობილობიდან (Supabase Storage)
                    </label>
                    <input
                      type="file"
                      ref={inlineFileInputRef}
                      accept="image/*"
                      onChange={handleInlineImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingInline}
                      onClick={() => inlineFileInputRef.current?.click()}
                      className="w-full py-3 bg-[#FAF8F3] hover:bg-[#E6DDCB]/40 border border-dashed border-[#C79B3A] text-[#13253D] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingInline ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#C79B3A]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#C79B3A]" />
                      )}
                      <span>{uploadingInline ? 'ფოტო იტვირთება Supabase-ში...' : 'ფოტოს ატვირთვა მოწყობილობიდან'}</span>
                    </button>
                  </div>

                  {/* OR URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider block">
                      2. ან ჩასვით ფოტოს პირდაპირი ბმული (URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={inlineImageUrl}
                      onChange={(e) => setInlineImageUrl(e.target.value)}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                    />
                  </div>

                  {/* Caption */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#13253D] uppercase tracking-wider block">
                      3. ფოტოს წარწერა / აღწერა (არასავალდებულო)
                    </label>
                    <input
                      type="text"
                      placeholder="მაგ: დიდგორის ბრძოლის ილუსტრაცია"
                      value={inlineCaption}
                      onChange={(e) => setInlineCaption(e.target.value)}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                    />
                  </div>

                  {/* Image Preview if available */}
                  {inlineImageUrl && (
                    <div className="rounded-xl overflow-hidden max-h-40 border border-[#E6DDCB] bg-[#FAF8F3] flex items-center justify-center p-2">
                      <img src={inlineImageUrl} alt="Preview" className="max-h-36 object-contain rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E6DDCB] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-2 border border-[#E6DDCB] text-[#13253D] text-xs font-semibold rounded-xl hover:bg-[#FAF8F3] cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="button"
                    disabled={!inlineImageUrl.trim() || uploadingInline}
                    onClick={() => handleInsertInlineImage()}
                    className="px-5 py-2 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ტექსტში ჩასმა
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E6DDCB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#E6DDCB] text-[#13253D] text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#FAF8F3] transition-colors cursor-pointer"
            >
              გაუქმება
            </button>

            <button
              type="submit"
              disabled={isSaving || uploadingImage}
              className="px-6 py-2.5 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>ინახება...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C79B3A]" />
                  <span>{articleToEdit ? 'ცვლილებების შენახვა' : 'ბლოგის გამოქვეყნება'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

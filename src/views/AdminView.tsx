import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, FileText, CheckCircle2, ShieldCheck, RefreshCw, AlertTriangle, Eye } from 'lucide-react';
import { Article, HistoricalCategory } from '../types';
import { fetchAllArticles, saveArticle, deleteArticle } from '../lib/blogService';
import { BlogEditorModal } from '../components/BlogEditorModal';

interface AdminViewProps {
  user: { name: string; email: string } | null;
  onOpenArticle: (article: Article) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, onOpenArticle }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllArticles();
      setArticles(data);
    } catch (err) {
      console.error('Error loading articles in Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  const handleSaveArticle = async (savedArt: Article) => {
    const updated = await saveArticle(savedArt);
    setArticles(prev => {
      const idx = prev.findIndex(a => a.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArticleId) return;
    setIsDeleting(true);
    try {
      await deleteArticle(deletingArticleId);
      setArticles(prev => prev.filter(a => a.id !== deletingArticleId));
      setDeletingArticleId(null);
    } catch (err) {
      console.error('Error deleting article:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'draft' ? art.status === 'draft' : art.status !== 'draft');
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="max-w-[1280px] mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="relative bg-[#0D1B2A] text-white rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl border-4 border-[#C79B3A]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Background Emblem Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#C79B3A_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ადმინისტრირება</span>
            </span>
            <span className="text-xs font-mono text-[#FAF8F3]/70">
              {user?.email || 'ntistoria@gmail.com'}
            </span>
          </div>

          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F3]">
            ბლოგებისა და კონტენტის მართვა
          </h1>
          <p className="text-xs sm:text-sm text-[#FAF8F3]/80 max-w-xl font-normal">
            დაამატეთ ახალი ისტორიული სტატიები, დაარედაქტირეთ არსებული ბლოგები და შეინახეთ დრაფტებში.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleCreateNew}
          className="z-10 px-6 py-3.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-luxury flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ახალი ბლოგის დაწერა</span>
        </button>
      </div>

      <div className="space-y-8">

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6DDCB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#C79B3A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ძიება ბლოგის სათაურით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-3 py-2 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#C79B3A] shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-medium text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
          >
            <option value="all">ყველა კატეგორია</option>
            <option value="საქართველოს ისტორია">საქართველოს ისტორია</option>
            <option value="ძველი მსოფლიო">ძველი მსოფლიო</option>
            <option value="შუა საუკუნეები">შუა საუკუნეები</option>
            <option value="ახალი და უახლესი ისტორია">ახალი და უახლესი ისტორია</option>
            <option value="ეროვნული გამოცდები">ეროვნული გამოცდები</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-medium text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="published">გამოქვეყნებული</option>
            <option value="draft">დრაფტები</option>
          </select>
        </div>

      </div>

      {/* Articles Management Table / List */}
      <div className="bg-white rounded-2xl border border-[#E6DDCB] shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-[#E6DDCB] bg-[#FAF8F3] flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-[#13253D]">
            ბლოგების სია ({filteredArticles.length})
          </h3>

          <button
            onClick={loadData}
            className="text-xs text-[#C79B3A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>განახლება</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#8A8A8A]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C79B3A] mb-2" />
            <span>იტვირთება სტატიები...</span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-[#8A8A8A] space-y-2">
            <FileText className="w-8 h-8 text-[#C79B3A] mx-auto opacity-60" />
            <p className="font-serif text-sm font-semibold">სტატიები ვერ მოიძებნა</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6DDCB]">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="p-4 sm:p-6 hover:bg-[#FAF8F3]/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Info Left */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#E6DDCB] shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-[#FAF8F3] border border-[#E6DDCB] text-[#C79B3A] text-[10px] font-bold rounded-md uppercase">
                        {art.category}
                      </span>
                      {art.status === 'draft' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-md">
                          📝 დრაფტი
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                          ✓ გამოქვეყნებული
                        </span>
                      )}
                      {art.featured && (
                        <span className="px-2 py-0.5 bg-[#C79B3A] text-[#0D1B2A] text-[10px] font-bold rounded-md">
                          ★ რჩეული
                        </span>
                      )}
                      <span className="text-[11px] text-[#8A8A8A]">{art.date}</span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-[#13253D] line-clamp-1">
                      {art.title}
                    </h4>

                    <p className="text-xs text-[#666666] line-clamp-1 max-w-2xl">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                {/* Actions Right */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onOpenArticle(art)}
                    title="ნახვა"
                    className="px-3 py-2 bg-[#FAF8F3] hover:bg-[#E6DDCB]/50 border border-[#E6DDCB] text-[#13253D] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span className="hidden sm:inline">ნახვა</span>
                  </button>

                  <button
                    onClick={() => handleEdit(art)}
                    title="რედაქტირება"
                    className="px-3 py-2 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>რედაქტირება</span>
                  </button>

                  <button
                    onClick={() => setDeletingArticleId(art.id)}
                    title="წაშლა"
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>წაშლა</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Editor Modal */}
      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveArticle}
        articleToEdit={editingArticle}
      />

      {/* Delete Confirmation Dialog */}
      {deletingArticleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E6DDCB] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#13253D]">
                ნამდვილად გსურთ ბლოგის წაშლა?
              </h3>
              <p className="text-xs text-[#666666]">
                ეს მოქმედება შეუქცევადია და ბლოგი წაიშლება პლატფორმიდან.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingArticleId(null)}
                className="px-4 py-2 border border-[#E6DDCB] text-xs font-bold rounded-xl text-[#13253D] hover:bg-[#FAF8F3]"
              >
                გაუქმება
              </button>

              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'იშლება...' : 'დიახ, წაშლა'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

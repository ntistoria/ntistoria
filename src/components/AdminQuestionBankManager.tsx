import { useState, useEffect, useMemo, type FC } from 'react';
import {
  Database,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
  X,
  BookOpen,
  MapPin,
  Layers,
  FileText,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  TEST_CATEGORIES,
  DEFAULT_PROGRAMS,
  invalidateTestServiceCache
} from '../lib/testService';

interface RawQuestionRow {
  id: string | number;
  [key: string]: any;
}

const ITEMS_PER_PAGE = 20;

export const AdminQuestionBankManager: FC = () => {
  const [selectedCatKey, setSelectedCatKey] = useState<string>('mcq');
  const [activeTableName, setActiveTableName] = useState<string>('multiple_choice_questions');
  const [rows, setRows] = useState<RawQuestionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRow, setEditingRow] = useState<RawQuestionRow | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form Fields
  const [formProgramNumber, setFormProgramNumber] = useState<number>(1);
  const [formSubProgramNumber, setFormSubProgramNumber] = useState<number>(1);
  const [formParentNumber, setFormParentNumber] = useState<number>(1);
  const [formQuestionNumber, setFormQuestionNumber] = useState<number>(1);
  const [formPrompt, setFormPrompt] = useState<string>('');
  const [formOption1, setFormOption1] = useState<string>('');
  const [formOption2, setFormOption2] = useState<string>('');
  const [formOption3, setFormOption3] = useState<string>('');
  const [formOption4, setFormOption4] = useState<string>('');
  const [formCorrectOption, setFormCorrectOption] = useState<number>(1);
  const [formOpenAnswer, setFormOpenAnswer] = useState<string>('');
  const [formScore, setFormScore] = useState<number>(1);
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formChronSeq, setFormChronSeq] = useState<string>('1, 2, 3');

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'mcq': return <BookOpen className="w-4 h-4 text-[#C79B3A]" />;
      case 'map': return <MapPin className="w-4 h-4 text-[#C79B3A]" />;
      case 'analogies': return <Layers className="w-4 h-4 text-[#C79B3A]" />;
      case 'source': return <FileText className="w-4 h-4 text-[#C79B3A]" />;
      case 'chronology': return <Clock className="w-4 h-4 text-[#C79B3A]" />;
      case 'illustrations': return <ImageIcon className="w-4 h-4 text-[#C79B3A]" />;
      default: return <Database className="w-4 h-4 text-[#C79B3A]" />;
    }
  };

  const loadCategoryRows = async (catKey: string) => {
    setLoading(true);
    setErrorMsg(null);
    setPage(1);

    const catMeta = TEST_CATEGORIES.find(c => c.key === catKey) || TEST_CATEGORIES[0];
    let resolvedTable = catMeta.tableNames[0];
    let loadedRows: RawQuestionRow[] = [];

    for (const tbl of catMeta.tableNames) {
      try {
        // For analogy_questions and source_questions, `answer` may be column-restricted for authenticated role
        const selectCols =
          tbl === 'analogy_questions'
            ? 'id, analogy_number, question_number, question, score'
            : tbl === 'source_questions'
            ? 'id, source_number, question_number, question, score'
            : '*';

        let allData: RawQuestionRow[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(tbl)
            .select(selectCols)
            .order('id', { ascending: true })
            .range(from, from + pageSize - 1);

          if (error) {
            hasMore = false;
            break;
          }
          if (data && data.length > 0) {
            allData = allData.concat(data as unknown as RawQuestionRow[]);
            if (data.length < pageSize) hasMore = false;
            else from += pageSize;
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0) {
          resolvedTable = tbl;
          loadedRows = allData;
          break;
        }
      } catch {}
    }

    setActiveTableName(resolvedTable);
    setRows(loadedRows);
    setLoading(false);
  };

  useEffect(() => {
    loadCategoryRows(selectedCatKey);
  }, [selectedCatKey]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Extract normalized display fields from any raw DB row
  const extractRowDisplay = (row: RawQuestionRow) => {
    const prompt = String(row.question || row.prompt || row.title || '');
    const chapterNum = Number(row.program_number || row.chapter_number || row.program || 0);
    const parentNum = Number(
      row.map_number || row.analogy_number || row.source_number || row.illustration_number || 0
    );
    const qNum = Number(row.question_number || row.chronology_number || row.number || row.id || 0);

    let options: string[] = [];
    if (Array.isArray(row.options)) {
      options = row.options;
    } else if (row.answer_1 || row.answer_2 || row.option_a) {
      options = [
        row.answer_1 || row.option_a || '',
        row.answer_2 || row.option_b || '',
        row.answer_3 || row.option_c || '',
        row.answer_4 || row.option_d || ''
      ].filter(Boolean);
    }

    const correctOpt =
      typeof row.correct_answer === 'number'
        ? row.correct_answer
        : typeof row.correct_option === 'number'
        ? row.correct_option
        : typeof row.correct_answer_index === 'number'
        ? row.correct_answer_index + 1
        : null;

    const openAns =
      typeof row.answer === 'string'
        ? row.answer
        : typeof row.correct_answer === 'string'
        ? row.correct_answer
        : '';

    return { prompt, chapterNum, parentNum, qNum, options, correctOpt, openAns };
  };

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const { prompt, chapterNum, parentNum, qNum, options, openAns } = extractRowDisplay(row);

      if (chapterFilter !== 'all' && selectedCatKey === 'mcq') {
        const targetCh = Number(chapterFilter);
        if (chapterNum !== targetCh) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inPrompt = prompt.toLowerCase().includes(q);
        const inOptions = options.some(o => String(o).toLowerCase().includes(q));
        const inOpen = openAns.toLowerCase().includes(q);
        const inNum = String(qNum).includes(q) || String(parentNum).includes(q) || String(row.id).includes(q);
        if (!inPrompt && !inOptions && !inOpen && !inNum) return false;
      }

      return true;
    });
  }, [rows, chapterFilter, searchQuery, selectedCatKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, page]);

  const openCreateModal = () => {
    setEditingRow(null);
    setFormProgramNumber(chapterFilter !== 'all' ? Number(chapterFilter) : 1);
    setFormSubProgramNumber(1);
    setFormParentNumber(1);
    setFormQuestionNumber(rows.length + 1);
    setFormPrompt('');
    setFormOption1('');
    setFormOption2('');
    setFormOption3('');
    setFormOption4('');
    setFormCorrectOption(1);
    setFormOpenAnswer('');
    setFormScore(1);
    setFormExplanation('');
    setFormChronSeq('1, 2, 3');
    setIsModalOpen(true);
  };

  const openEditModal = (row: RawQuestionRow) => {
    setEditingRow(row);
    const { prompt, chapterNum, parentNum, qNum, options, correctOpt, openAns } = extractRowDisplay(row);
    setFormProgramNumber(chapterNum || 1);
    setFormSubProgramNumber(Number(row.sub_program_number || 1));
    setFormParentNumber(parentNum || 1);
    setFormQuestionNumber(qNum || 1);
    setFormPrompt(prompt);
    setFormOption1(options[0] || '');
    setFormOption2(options[1] || '');
    setFormOption3(options[2] || '');
    setFormOption4(options[3] || '');
    setFormCorrectOption(correctOpt || 1);
    setFormOpenAnswer(openAns || '');
    setFormScore(Number(row.score || 1));
    setFormExplanation(String(row.explanation || row.description || ''));
    const rawSeq = row.correct_sequence || row.sequence || [1, 2, 3];
    setFormChronSeq(Array.isArray(rawSeq) ? rawSeq.join(', ') : String(rawSeq));
    setIsModalOpen(true);
  };

  const handleSaveRow = async () => {
    if (!formPrompt.trim()) {
      setErrorMsg('გთხოვთ შეავსოთ კითხვის ტექსტი.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const sample = editingRow || rows[0] || {};
      const payload: Record<string, any> = {};

      // Prompt column
      if ('prompt' in sample && !('question' in sample)) {
        payload.prompt = formPrompt.trim();
      } else {
        payload.question = formPrompt.trim();
      }

      if (selectedCatKey === 'mcq') {
        payload.program_number = Number(formProgramNumber) || 1;
        if ('sub_program_number' in sample || !editingRow) {
          payload.sub_program_number = Number(formSubProgramNumber) || 1;
        }
        if ('question_number' in sample || !editingRow) {
          payload.question_number = Number(formQuestionNumber) || 1;
        }
        if ('options' in sample && Array.isArray(sample.options)) {
          payload.options = [formOption1, formOption2, formOption3, formOption4].map(s => s.trim());
        } else {
          payload.answer_1 = formOption1.trim();
          payload.answer_2 = formOption2.trim();
          payload.answer_3 = formOption3.trim();
          payload.answer_4 = formOption4.trim();
        }
        if ('correct_answer_index' in sample) {
          payload.correct_answer_index = Math.max(0, Number(formCorrectOption) - 1);
        } else {
          payload.correct_answer = Number(formCorrectOption) || 1;
        }
        if ('explanation' in sample && formExplanation.trim()) {
          payload.explanation = formExplanation.trim();
        }
      } else if (selectedCatKey === 'chronology') {
        if ('chronology_number' in sample) {
          payload.chronology_number = Number(formQuestionNumber) || 1;
        } else if ('question_number' in sample) {
          payload.question_number = Number(formQuestionNumber) || 1;
        }
        payload.answer_1 = formOption1.trim();
        payload.answer_2 = formOption2.trim();
        payload.answer_3 = formOption3.trim();
        const parsedSeq = formChronSeq
          .split(/[\s,]+/)
          .map(Number)
          .filter(n => n > 0);
        if ('correct_sequence' in sample) {
          payload.correct_sequence = parsedSeq.length >= 3 ? parsedSeq.slice(0, 3) : [1, 2, 3];
        } else {
          payload.correct_answer = formChronSeq.trim();
        }
      } else {
        // map, analogies, source, illustrations
        if (selectedCatKey === 'map') payload.map_number = Number(formParentNumber) || 1;
        if (selectedCatKey === 'analogies') payload.analogy_number = Number(formParentNumber) || 1;
        if (selectedCatKey === 'source') payload.source_number = Number(formParentNumber) || 1;
        if (selectedCatKey === 'illustrations') payload.illustration_number = Number(formParentNumber) || 1;

        payload.question_number = Number(formQuestionNumber) || 1;
        if ('score' in sample || selectedCatKey === 'analogies' || selectedCatKey === 'source') {
          payload.score = Number(formScore) || 1;
        }
        if (formOpenAnswer.trim()) {
          payload.answer = formOpenAnswer.trim();
        }
      }

      if (editingRow) {
        const { error } = await supabase
          .from(activeTableName)
          .update(payload)
          .eq('id', editingRow.id);

        if (error) throw error;

        setRows(prev =>
          prev.map(r => (r.id === editingRow.id ? { ...r, ...payload } : r))
        );
        showToast('კითხვა წარმატებით განახლდა!');
      } else {
        const { data, error } = await supabase
          .from(activeTableName)
          .insert([payload])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          setRows(prev => [data[0] as RawQuestionRow, ...prev]);
        } else {
          await loadCategoryRows(selectedCatKey);
        }
        showToast('ახალი კითხვა წარმატებით დაემატა!');
      }

      invalidateTestServiceCache();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving question row:', err);
      setErrorMsg(err?.message || 'კითხვის შენახვა ვერ მოხერხდა (შეამოწმეთ RLS უფლებები).');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRow = async (row: RawQuestionRow) => {
    if (!confirm(`ნამდვილად გსურთ კითხვის (ID: ${row.id}) წაშლა ბაზიდან?`)) return;

    try {
      const { error } = await supabase
        .from(activeTableName)
        .delete()
        .eq('id', row.id);

      if (error) throw error;

      setRows(prev => prev.filter(r => r.id !== row.id));
      invalidateTestServiceCache();
      showToast('კითხვა წაიშალა ბაზიდან.');
    } catch (err: any) {
      console.error('Error deleting question row:', err);
      setErrorMsg(err?.message || 'წაშლა ვერ მოხერხდა.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Category Selector */}
      <div className="bg-white rounded-3xl border border-[#E6DDCB] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DDCB] pb-4">
          <div className="space-y-1">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0D1B2A] flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#C79B3A]" />
              <span>საგამოცდო კითხვების ბანკი</span>
            </h2>
            <p className="text-xs text-[#666666]">
              მოძებნეთ, გაფილტრეთ, ჩაასწორეთ ან დაამატეთ საგამოცდო კითხვები პირდაპირ ადმინ-პანელიდან (ცხრილი: <code className="font-mono text-[#0D1B2A] bg-[#FAF8F3] px-1.5 py-0.5 rounded">{activeTableName}</code>)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadCategoryRows(selectedCatKey)}
              className="p-2.5 rounded-xl bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 border border-[#E6DDCB] text-[#0D1B2A] transition-colors cursor-pointer"
              title="განახლება"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C79B3A]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>კითხვის დამატება</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {TEST_CATEGORIES.map(cat => {
            const active = selectedCatKey === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setSelectedCatKey(cat.key);
                  setChapterFilter('all');
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-[#0D1B2A] text-white border-[#0D1B2A] shadow-sm'
                    : 'bg-[#FAF8F3] text-[#0D1B2A] border-[#E6DDCB] hover:border-[#C79B3A]'
                }`}
              >
                {getCategoryIcon(cat.key)}
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Chapter Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#C79B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="მოძებნეთ კითხვის ტექსტით, პასუხით ან ნომრით..."
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
            />
          </div>

          {selectedCatKey === 'mcq' && (
            <select
              value={chapterFilter}
              onChange={e => {
                setChapterFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
            >
              <option value="all">ყველა თავი ({rows.length})</option>
              {DEFAULT_PROGRAMS.map(p => (
                <option key={p.chapterNumber} value={String(p.chapterNumber)}>
                  თავი {p.chapterNumber}: {p.title.replace(/^თავი\s*\d+:\s*/i, '').slice(0, 38)}
                </option>
              ))}
            </select>
          )}

          <span className="px-3.5 py-2 bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl text-xs font-mono font-bold text-[#0D1B2A] shrink-0 text-center">
            ნაპოვნია: {filteredRows.length}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#E6DDCB] p-12 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#666666]">კითხვების ბანკის ჩატვირთვა...</p>
        </div>
      ) : paginatedRows.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E6DDCB] p-12 text-center space-y-2">
          <p className="font-serif font-bold text-lg text-[#0D1B2A]">კითხვები ვერ მოიძებნა</p>
          <p className="text-xs text-[#666666]">შეცვალეთ საძიებო სიტყვა ან დაამატეთ ახალი კითხვა.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedRows.map(row => {
            const { prompt, chapterNum, parentNum, qNum, options, correctOpt, openAns } = extractRowDisplay(row);
            const optLabels = ['ა', 'ბ', 'გ', 'დ'];

            return (
              <div
                key={row.id}
                className="bg-white rounded-2xl border border-[#E6DDCB] hover:border-[#C79B3A]/60 p-4 sm:p-5 shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#0D1B2A] text-[#C79B3A] text-[11px] font-mono font-bold rounded-md">
                        ID #{row.id}
                      </span>
                      {chapterNum > 0 && (
                        <span className="px-2.5 py-0.5 bg-[#FAF8F3] border border-[#E6DDCB] text-[#0D1B2A] text-[11px] font-bold rounded-md">
                          თავი {chapterNum}
                        </span>
                      )}
                      {parentNum > 0 && (
                        <span className="px-2.5 py-0.5 bg-[#FAF8F3] border border-[#E6DDCB] text-[#0D1B2A] text-[11px] font-bold rounded-md">
                          დავალება #{parentNum}.{qNum}
                        </span>
                      )}
                      {row.score && (
                        <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-md">
                          {row.score} ქულა
                        </span>
                      )}
                    </div>

                    <p className="font-serif font-bold text-sm sm:text-base text-[#0D1B2A] leading-snug">
                      {prompt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(row)}
                      className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#C79B3A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] transition-colors cursor-pointer"
                      title="რედაქტირება"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {options.map((opt, idx) => {
                      const isCorrect = correctOpt === idx + 1;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-[#FAF8F3] border-[#E6DDCB] text-[#0D1B2A]'
                          }`}
                        >
                          <span className="font-mono font-bold text-[#C79B3A]">
                            {optLabels[idx] || idx + 1})
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {openAns && options.length === 0 && (
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold">სწორი პასუხი: </span>
                    <span>{openAns}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E6DDCB] px-4 py-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] text-xs font-bold text-[#0D1B2A] disabled:opacity-40 cursor-pointer"
              >
                წინა გვერდი
              </button>
              <span className="text-xs font-mono font-bold text-[#0D1B2A]">
                გვერდი {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] text-xs font-bold text-[#0D1B2A] disabled:opacity-40 cursor-pointer"
              >
                შემდეგი გვერდი
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-[#C79B3A] max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-3">
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                {editingRow ? `კითხვის რედაქტირება (ID #${editingRow.id})` : 'ახალი კითხვის დამატება'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#FAF8F3] hover:bg-rose-50 text-[#0D1B2A] hover:text-rose-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedCatKey === 'mcq' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      თავი (1–11)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={11}
                      value={formProgramNumber}
                      onChange={e => setFormProgramNumber(Number(e.target.value))}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      ქვეთავი
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formSubProgramNumber}
                      onChange={e => setFormSubProgramNumber(Number(e.target.value))}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      კითხვის №
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formQuestionNumber}
                      onChange={e => setFormQuestionNumber(Number(e.target.value))}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                    />
                  </div>
                </div>
              ) : selectedCatKey !== 'chronology' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      დავალების / წყაროს / რუკის №
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formParentNumber}
                      onChange={e => setFormParentNumber(Number(e.target.value))}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      ქვე-კითხვის №
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formQuestionNumber}
                      onChange={e => setFormQuestionNumber(Number(e.target.value))}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      მაქს. ქულა
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formScore}
                      onChange={e => setFormScore(Number(e.target.value))}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                  კითხვის ტექსტი (პირობა)
                </label>
                <textarea
                  rows={3}
                  value={formPrompt}
                  onChange={e => setFormPrompt(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl p-3 text-xs sm:text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                  placeholder="შეიყვანეთ კითხვის პირობა..."
                />
              </div>

              {selectedCatKey === 'mcq' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                        ვარიანტი ა (1)
                      </label>
                      <input
                        type="text"
                        value={formOption1}
                        onChange={e => setFormOption1(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                        ვარიანტი ბ (2)
                      </label>
                      <input
                        type="text"
                        value={formOption2}
                        onChange={e => setFormOption2(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                        ვარიანტი გ (3)
                      </label>
                      <input
                        type="text"
                        value={formOption3}
                        onChange={e => setFormOption3(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                        ვარიანტი დ (4)
                      </label>
                      <input
                        type="text"
                        value={formOption4}
                        onChange={e => setFormOption4(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                        სწორი პასუხი (1=ა, 2=ბ, 3=გ, 4=დ)
                      </label>
                      <select
                        value={formCorrectOption}
                        onChange={e => setFormCorrectOption(Number(e.target.value))}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-bold text-[#0D1B2A]"
                      >
                        <option value={1}>1 — ვარიანტი ა</option>
                        <option value={2}>2 — ვარიანტი ბ</option>
                        <option value={3}>3 — ვარიანტი გ</option>
                        <option value={4}>4 — ვარიანტი დ</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                        განმარტება (არასავალდებულო)
                      </label>
                      <input
                        type="text"
                        value={formExplanation}
                        onChange={e => setFormExplanation(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                        placeholder="რატომ არის ეს პასუხი სწორი..."
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedCatKey === 'chronology' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formOption1}
                    onChange={e => setFormOption1(e.target.value)}
                    placeholder="მოვლენა 1"
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                  />
                  <input
                    type="text"
                    value={formOption2}
                    onChange={e => setFormOption2(e.target.value)}
                    placeholder="მოვლენა 2"
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                  />
                  <input
                    type="text"
                    value={formOption3}
                    onChange={e => setFormOption3(e.target.value)}
                    placeholder="მოვლენა 3"
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs text-[#0D1B2A]"
                  />
                  <div>
                    <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                      სწორი თანმიმდევრობა (მაგ: 2, 1, 3)
                    </label>
                    <input
                      type="text"
                      value={formChronSeq}
                      onChange={e => setFormChronSeq(e.target.value)}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0D1B2A]"
                    />
                  </div>
                </div>
              )}

              {selectedCatKey !== 'mcq' && selectedCatKey !== 'chronology' && (
                <div>
                  <label className="text-[11px] font-bold text-[#666666] uppercase block mb-1">
                    სწორი პასუხი / შეფასების კრიტერიუმი
                  </label>
                  <textarea
                    rows={3}
                    value={formOpenAnswer}
                    onChange={e => setFormOpenAnswer(e.target.value)}
                    placeholder="შეიყვანეთ სწორი პასუხი (ან დატოვეთ ცარიელი თუ უცვლელია)..."
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl p-3 text-xs text-[#0D1B2A]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6DDCB]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] text-xs font-bold text-[#0D1B2A] cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveRow}
                className="px-6 py-2.5 rounded-xl bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


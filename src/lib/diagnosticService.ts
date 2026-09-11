import { supabase } from './supabase';
import {
  DiagnosticQuestion,
  DiagnosticAttempt,
  DiagnosticAnswer,
  DiagnosticAttemptWithAnswers,
  DiagnosticGradePayload,
} from '../types';

export const TEST_ID = 'diagnostic-1';
export const TIME_LIMIT_SECONDS = 25 * 60;

export const getDiagnosticQuestions = async (): Promise<DiagnosticQuestion[]> => {
  const { data, error } = await supabase
    .from('diagnostic_questions')
    .select('*')
    .eq('test_id', TEST_ID)
    .order('question_order', { ascending: true });
  if (error) { console.error('getDiagnosticQuestions:', error); return []; }
  return (data || []).map((row: any) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : row.options ? JSON.parse(row.options) : null,
  })) as DiagnosticQuestion[];
};

export const getOrCreateAttempt = async (userId: string, userEmail: string): Promise<DiagnosticAttempt | null> => {
  const { data: existing } = await supabase
    .from('diagnostic_attempts').select('*')
    .eq('test_id', TEST_ID).eq('user_id', userId).eq('status', 'in_progress')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (existing) {
    return existing as DiagnosticAttempt;
  }
  const { data: created, error } = await supabase
    .from('diagnostic_attempts')
    .insert({ test_id: TEST_ID, user_id: userId, user_email: userEmail.toLowerCase().trim(), status: 'in_progress', started_at: new Date().toISOString(), max_score: 40 })
    .select().single();
  if (error) { console.error('getOrCreateAttempt:', error); return null; }
  return created as DiagnosticAttempt;
};

export const getLatestAttempt = async (userId: string): Promise<DiagnosticAttempt | null> => {
  const { data } = await supabase
    .from('diagnostic_attempts').select('*')
    .eq('test_id', TEST_ID).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data as DiagnosticAttempt | null;
};

export const getRemainingSeconds = (startedAt: string): number => {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, TIME_LIMIT_SECONDS - elapsed);
};

export const saveAnswer = async (attemptId: string, questionId: string, answerText: string): Promise<boolean> => {
  const { error } = await supabase.from('diagnostic_answers')
    .upsert({ attempt_id: attemptId, question_id: questionId, answer_text: answerText, updated_at: new Date().toISOString() }, { onConflict: 'attempt_id,question_id' });
  if (error) { console.error('saveAnswer:', error); return false; }
  return true;
};

export const getAnswersForAttempt = async (attemptId: string): Promise<DiagnosticAnswer[]> => {
  const { data, error } = await supabase.from('diagnostic_answers').select('*').eq('attempt_id', attemptId);
  if (error) { console.error('getAnswersForAttempt:', error); return []; }
  return (data || []) as DiagnosticAnswer[];
};

export const submitAttempt = async (attemptId: string): Promise<boolean> => {
  const { error } = await supabase.from('diagnostic_attempts')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', attemptId).eq('status', 'in_progress');
  if (error) { console.error('submitAttempt:', error); return false; }
  return true;
};

export const getAllAttemptsAdmin = async (): Promise<DiagnosticAttemptWithAnswers[]> => {
  const { data: attempts, error } = await supabase
    .from('diagnostic_attempts').select('*').eq('test_id', TEST_ID)
    .in('status', ['submitted', 'graded'])
    .order('created_at', { ascending: false });
  if (error) { console.error('getAllAttemptsAdmin:', error); return []; }
  const emails = [...new Set((attempts || []).map((a: any) => a.user_email))];
  const { data: profiles } = await supabase.from('profiles').select('email, full_name').in('email', emails);
  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.email] = p.full_name || p.email; });
  return (attempts || []).map((a: any) => ({ ...a, answers: [], student_name: profileMap[a.user_email] || a.user_email })) as DiagnosticAttemptWithAnswers[];
};

export const getAttemptWithAnswers = async (attemptId: string): Promise<DiagnosticAttemptWithAnswers | null> => {
  const { data: attempt, error: aErr } = await supabase.from('diagnostic_attempts').select('*').eq('id', attemptId).maybeSingle();
  if (aErr || !attempt) return null;
  const { data: answers } = await supabase.from('diagnostic_answers').select('*').eq('attempt_id', attemptId);
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('email', attempt.user_email).maybeSingle();
  return { ...attempt, answers: (answers || []) as DiagnosticAnswer[], student_name: (profile as any)?.full_name || attempt.user_email } as DiagnosticAttemptWithAnswers;
};

export const awardPointsToAnswer = async (payload: DiagnosticGradePayload): Promise<boolean> => {
  const { error } = await supabase.from('diagnostic_answers')
    .update({ points_awarded: payload.points_awarded, teacher_comment: payload.teacher_comment ?? null, updated_at: new Date().toISOString() })
    .eq('id', payload.answerId);
  if (error) { console.error('awardPointsToAnswer:', error); return false; }
  return true;
};

export const finalizeGrading = async (attemptId: string, grades: DiagnosticGradePayload[]): Promise<boolean> => {
  const updates = grades.map((g) =>
    supabase.from('diagnostic_answers')
      .update({ points_awarded: g.points_awarded, teacher_comment: g.teacher_comment ?? null, updated_at: new Date().toISOString() })
      .eq('id', g.answerId)
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) { console.error('finalizeGrading: error in bulk update'); return false; }
  const totalScore = grades.reduce((sum, g) => sum + (g.points_awarded || 0), 0);
  const { error } = await supabase.from('diagnostic_attempts')
    .update({ status: 'graded', total_score: totalScore, graded_at: new Date().toISOString() })
    .eq('id', attemptId);
  if (error) { console.error('finalizeGrading:', error); return false; }
  return true;
};


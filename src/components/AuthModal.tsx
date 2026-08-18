import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        setIsSuccess(true);
        setSuccessMsg(
          data.session 
            ? 'რეგისტრაცია წარმატებით დასრულდა!' 
            : 'რეგისტრაცია წარმატებულია! გთხოვთ შეამოწმოთ თქვენი ელ-ფოსტა დადასტურებისთვის.'
        );

        if (data.user && onSuccessLogin) {
          onSuccessLogin({
            name: fullName,
            email: data.user.email || email,
          });
        }

        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2000);

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const fullName = data.user?.user_metadata?.full_name || 
                         `${data.user?.user_metadata?.first_name || ''} ${data.user?.user_metadata?.last_name || ''}`.trim() || 
                         email.split('@')[0];

        setIsSuccess(true);
        setSuccessMsg('ავტორიზაცია წარმატებით დასრულდა!');

        if (onSuccessLogin) {
          onSuccessLogin({
            name: fullName,
            email: data.user.email || email,
          });
        }

        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('არასწორი ელ-ფოსტა ან პაროლი');
      } else if (err.message?.includes('User already registered')) {
        setErrorMsg('ამ ელ-ფოსტით მომხმარებელი უკვე დარეგისტრირებულია');
      } else if (err.message?.includes('Password should be at least')) {
        setErrorMsg('პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს');
      } else {
        setErrorMsg(err.message || 'დაფიქსირდა შეცდომა ავტორიზაციისას');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || 'Google-ით ავტორიზაცია ვერ მოხერხდა');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white border border-[#E6DDCB] shadow-2xl rounded-2xl w-full max-w-md overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8A8A8A] hover:text-[#13253D] hover:bg-[#F5F2EA] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#C79B3A]">
            აკადემიური პორტალი
          </span>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#13253D]">
            {mode === 'register' ? 'ანგარიშის შექმნა' : 'ავტორიზაცია'}
          </h2>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in zoom-in-95 duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {isSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-center">{successMsg}</span>
          </div>
        ) : (
          <>
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full py-3 px-4 bg-white border border-[#E6DDCB] hover:border-[#C79B3A] rounded-xl text-xs sm:text-sm font-semibold text-[#13253D] flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'register' ? 'რეგისტრაცია Google-ით' : 'შესვლა Google-ით'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="h-[1px] w-full bg-[#E6DDCB]" />
              <span className="absolute bg-white px-3 text-[11px] uppercase tracking-wider text-[#8A8A8A] font-medium">
                ან ელ-ფოსტით
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#13253D]">სახელი</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#C79B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="გიორგი"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#13253D]">გვარი</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#C79B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="ბერიძე"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#13253D]">ემაილი</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#C79B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#13253D]">პაროლი</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#C79B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#13253D] focus:outline-none focus:border-[#C79B3A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{mode === 'register' ? 'რეგისტრაცია' : 'შესვლა'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="text-center pt-2 border-t border-[#E6DDCB] text-xs text-[#666666]">
              {mode === 'register' ? (
                <p>
                  უკვე გაქვს ანგარიში?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="font-bold text-[#C79B3A] hover:underline cursor-pointer"
                  >
                    შესვლა
                  </button>
                </p>
              ) : (
                <p>
                  არ გაქვს ანგარიში?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                    }}
                    className="font-bold text-[#C79B3A] hover:underline cursor-pointer"
                  >
                    რეგისტრაცია
                  </button>
                </p>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

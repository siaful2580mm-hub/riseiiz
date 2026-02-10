import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { Mail, Lock, Loader2, ArrowRight, User, AlertTriangle } from 'lucide-react';
import { TRANSLATIONS, DAILY_SIGNUP_LIMIT } from '../constants.tsx';

const Auth: React.FC = () => {
  const t = TRANSLATIONS.bn;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clear errors when switching modes
  useEffect(() => {
    setErrorMsg(null);
  }, [isSignUp]);

  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.toLowerCase());
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg("দয়া করে একটি সঠিক ইমেইল অ্যাড্রেস ব্যবহার করুন।");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // 1. Check Daily Limit
        const today = new Date().toISOString().split('T')[0];
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        if (countError) throw countError;
        if (count !== null && count >= DAILY_SIGNUP_LIMIT) {
          throw new Error(t.signup_limit_reached);
        }

        // 2. Attempt Sign Up
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { 
              full_name: fullName.trim(),
              referred_by: null
            }
          }
        });
        
        if (signUpError) throw signUpError;
        alert('অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল চেক করুন।');
      } else {
        // 3. Attempt Login
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Friendly error mapping
      const message = error.message === 'Invalid login credentials' 
        ? 'ভুল ইমেইল অথবা পাসওয়ার্ড।' 
        : error.message;
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#05060f]">
      <GlassCard className="w-full max-w-md space-y-6 border-[#00f2ff]/10">
        {/* Header Section */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00f2ff]/20">
             <ArrowRight className="text-[#05060f]" size={32} />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent uppercase tracking-tighter">
            {isSignUp ? t.auth_signup : t.auth_login}
          </h2>
          {isSignUp && (
             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-2">
               Daily Limit: {DAILY_SIGNUP_LIMIT} Users Only
             </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 items-start animate-in fade-in zoom-in duration-200">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-red-200 leading-relaxed font-bold">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.full_name}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#00f2ff]/50 outline-none transition-all text-white" placeholder="আপনার পুরো নাম" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#00f2ff]/50 outline-none transition-all text-white" placeholder="real-email@gmail.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#00f2ff]/50 outline-none transition-all text-white" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-primary rounded-2xl font-black text-sm shadow-lg shadow-[#00f2ff]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all text-[#05060f] uppercase tracking-widest mt-4">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            {isSignUp ? t.auth_signup : t.auth_login}
          </button>
        </form>

        <div className="text-center pt-2">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-[#00f2ff] hover:text-[#7b61ff] transition-colors uppercase tracking-widest">
            {isSignUp ? t.auth_has_account : t.auth_no_account}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Auth;

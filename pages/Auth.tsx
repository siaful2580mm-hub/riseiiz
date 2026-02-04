
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { Mail, Lock, Loader2, ArrowRight, User, AlertCircle, Gift } from 'lucide-react';
import { TRANSLATIONS } from '../constants.tsx';

const Auth: React.FC = () => {
  const t = TRANSLATIONS.bn;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralId, setReferralId] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralId(ref.toUpperCase());
      setIsSignUp(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { 
              full_name: fullName,
              referral_id: referralId.trim().toUpperCase()
            }
          }
        });
        if (error) throw error;
        alert(t.signup_success);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message === 'Failed to fetch') {
        setErrorMsg('সংযোগ ত্রুটি: সুপাবেস সার্ভারে পৌঁছানো যাচ্ছে না।');
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {isSignUp ? t.auth_signup : t.auth_login}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isSignUp ? 'Riseii Pro-তে যুক্ত হয়ে ইনকাম শুরু করুন' : 'আপনার ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 items-start animate-in fade-in duration-300">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-red-200 leading-relaxed font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.full_name}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
                  placeholder="আপনার পুরো নাম"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
                placeholder="example@mail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isSignUp && (
             <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.ref_code} (ঐচ্ছিক)</label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                <input 
                  type="text" 
                  value={referralId}
                  onChange={(e) => setReferralId(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/20 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-all font-mono uppercase"
                  placeholder="CODE777"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all text-slate-950 uppercase"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            {isSignUp ? t.auth_signup : t.auth_login}
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest"
          >
            {isSignUp ? t.auth_has_account : t.auth_no_account}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Auth;

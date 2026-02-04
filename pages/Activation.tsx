
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, Zap, CreditCard, Send, Loader2, Info, ArrowLeft, Clock } from 'lucide-react';
import { ACTIVATION_FEE } from '../constants.tsx';

const Activation: React.FC = () => {
  const { profile, t } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [pendingReq, setPendingReq] = useState<any>(null);

  useEffect(() => {
    if (profile?.is_active) {
      navigate('/wallet');
      return;
    }
    fetchPendingRequest();
  }, [profile, navigate]);

  const fetchPendingRequest = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('activations')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'pending')
      .maybeSingle();
    setPendingReq(data);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !trxId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('activations').insert({
        user_id: profile.id,
        method,
        transaction_id: trxId.trim().toUpperCase(),
        status: 'pending'
      });

      if (error) {
        if (error.code === '23505') throw new Error('এই ট্রানজ্যাকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
        throw error;
      }

      alert('অ্যাক্টিভেশন রিকোয়েস্ট জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের জন্য অপেক্ষা করুন।');
      fetchPendingRequest();
    } catch (err: any) {
      alert(err.message || 'সাবমিশন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.is_active) return null;

  if (pendingReq) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> {t.back}
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="text-amber-400" size={40} />
          </div>
          <h2 className="text-2xl font-black">{t.activation_pending}</h2>
          <p className="text-slate-400 max-w-xs text-sm">
            আপনার অ্যাক্টিভেশন রিকোয়েস্ট (ট্রানজ্যাকশন আইডি: {pendingReq.transaction_id}) বর্তমানে যাচাই করা হচ্ছে। সাধারণত ২ ঘণ্টার কম সময় লাগে।
          </p>
          <GlassCard className="w-full max-w-sm mt-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">পদ্ধতি:</span>
              <span className="text-white uppercase font-bold">{pendingReq.method}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">সময়:</span>
              <span className="text-white">{new Date(pendingReq.created_at).toLocaleString('bn-BD')}</span>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">{t.activation_title}</h2>
      </div>

      <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h3 className="font-black text-white">{t.unlock_features}</h3>
            <p className="text-xs text-slate-400">উপার্জিত টাকা উত্তোলনের জন্য আপনার অ্যাকাউন্ট সক্রিয় করুন।</p>
          </div>
        </div>
      </GlassCard>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
        <Info className="text-blue-400 shrink-0" size={20} />
        <div className="space-y-2">
          <p className="text-xs text-blue-100/70 leading-relaxed">
            নিচের যেকোনো একটি নম্বরে "Send Money" এর মাধ্যমে ৳{ACTIVATION_FEE} পাঠিয়ে ট্রানজ্যাকশন আইডি (Transaction ID) এখানে দিন।
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">টাকা পাঠানোর নম্বরসমূহ:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between bg-slate-900/50 p-2 rounded-lg border border-white/5">
                <span className="text-xs font-bold text-pink-400">বিকাশ (পার্সোনাল)</span>
                <span className="text-xs font-mono">017XXXXXXXX</span>
              </div>
              <div className="flex justify-between bg-slate-900/50 p-2 rounded-lg border border-white/5">
                <span className="text-xs font-bold text-orange-400">নগদ (পার্সোনাল)</span>
                <span className="text-xs font-mono">018XXXXXXXX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleActivate} className="space-y-4">
        <GlassCard className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={12} /> পেমেন্ট পদ্ধতি নির্বাচন করুন
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['bkash', 'nagad', 'rocket'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 text-[10px] font-black uppercase rounded-xl border transition-all ${
                    method === m ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  {m === 'bkash' ? 'বিকাশ' : m === 'nagad' ? 'নগদ' : 'রকেট'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} /> ট্রানজ্যাকশন আইডি (Transaction ID)
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="যেমন: 8J2K9L3M"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-emerald-500 outline-none transition-all uppercase"
            />
          </div>
        </GlassCard>

        <button
          type="submit"
          disabled={loading || !trxId}
          className="w-full py-4 bg-gradient-primary rounded-xl font-black text-sm text-slate-950 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          {t.submit_activation}
        </button>
      </form>
    </div>
  );
};

export default Activation;

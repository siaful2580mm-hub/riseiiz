
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, Zap, CreditCard, Send, Loader2, Info, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { ACTIVATION_FEE } from '../constants.tsx';

const Activation: React.FC = () => {
  const { profile, t } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('bkash');
  const [trxId, setTrxId] = useState('');
  const [pendingReq, setPendingReq] = useState<any>(null);
  const [fee, setFee] = useState(ACTIVATION_FEE);

  useEffect(() => {
    const checkSettings = async () => {
      const { data } = await supabase.from('system_settings').select('require_activation, activation_fee').single();
      if (data) {
        setFee(data.activation_fee);
        if (!data.require_activation || profile?.is_active) {
          navigate('/wallet');
          return;
        }
      }
    };
    
    if (profile) checkSettings();
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

      <GlassCard className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
            <CreditCard size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-amber-400 text-lg uppercase tracking-tight">৳{fee} ডিপোজিট করতে হবে</h3>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">অ্যাকাউন্ট ভেরিফাই এবং অ্যাক্টিভেশন ফি</p>
          </div>
        </div>
        <Zap size={100} className="absolute -bottom-4 -right-4 text-amber-500/10" />
      </GlassCard>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
        <Info className="text-blue-400 shrink-0" size={24} />
        <div className="space-y-3">
          <p className="text-xs text-blue-100 font-bold leading-relaxed">
            নিচের যেকোনো একটি নম্বরে "Send Money" এর মাধ্যমে <span className="text-[#00f2ff]">৳{fee}</span> পাঠিয়ে ট্রানজ্যাকশন আইডি (Transaction ID) নিচে দিন।
          </p>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">পেমেন্ট নম্বরসমূহ:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-black text-pink-500 uppercase">বিকাশ (Personal)</span>
                <span className="text-sm font-mono font-bold text-white tracking-wider">017XXXXXXXX</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-black text-orange-400 uppercase">নগদ (Personal)</span>
                <span className="text-sm font-mono font-bold text-white tracking-wider">018XXXXXXXX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleActivate} className="space-y-4">
        <GlassCard className="space-y-4 border-white/10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={12} /> পেমেন্ট মেথড
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['bkash', 'nagad', 'rocket'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-3 text-[10px] font-black uppercase rounded-xl border transition-all ${
                    method === m ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white'
                  }`}
                >
                  {m === 'bkash' ? 'বিকাশ' : m === 'nagad' ? 'নগদ' : 'রকেট'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} /> Transaction ID (TrxID)
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="যেমন: ABC123XYZ"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-4 text-sm font-mono font-black tracking-widest focus:border-amber-500 outline-none transition-all uppercase"
            />
          </div>
        </GlassCard>

        <div className="flex items-start gap-2 px-2">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight italic">ভুল TrxID দিলে অ্যাকাউন্ট চিরতরে ব্যান করা হতে পারে।</p>
        </div>

        <button
          type="submit"
          disabled={loading || !trxId}
          className="w-full py-5 bg-gradient-primary rounded-2xl font-black text-sm text-slate-950 shadow-xl shadow-[#00f2ff]/20 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          {t.submit_activation}
        </button>
      </form>
    </div>
  );
};

export default Activation;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, Zap, CreditCard, Send, Loader2, Info, ArrowLeft, Clock } from 'lucide-react';
import { ACTIVATION_FEE } from '../constants.tsx';

const Activation: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
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
        if (error.code === '23505') throw new Error('This Transaction ID has already been used.');
        throw error;
      }

      alert('Activation request submitted! Please wait for admin approval.');
      fetchPendingRequest();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.is_active) return null;

  if (pendingReq) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="text-amber-400" size={40} />
          </div>
          <h2 className="text-2xl font-black">Activation Pending</h2>
          <p className="text-slate-400 max-w-xs text-sm">
            Your activation request (TrxID: {pendingReq.transaction_id}) is under review. This usually takes less than 2 hours.
          </p>
          <GlassCard className="w-full max-w-sm mt-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Method:</span>
              <span className="text-white uppercase font-bold">{pendingReq.method}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Submitted:</span>
              <span className="text-white">{new Date(pendingReq.created_at).toLocaleString()}</span>
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
        <h2 className="text-2xl font-black">Account Activation</h2>
      </div>

      <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h3 className="font-black text-white">Unlock Full Features</h3>
            <p className="text-xs text-slate-400">Activate your account to start withdrawing your earnings.</p>
          </div>
        </div>
      </GlassCard>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
        <Info className="text-blue-400 shrink-0" size={20} />
        <div className="space-y-2">
          <p className="text-xs text-blue-100/70 leading-relaxed">
            Send ৳{ACTIVATION_FEE} to any of the numbers below using "Send Money" and paste the Transaction ID.
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Methods:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between bg-slate-900/50 p-2 rounded-lg border border-white/5">
                <span className="text-xs font-bold text-pink-400">bKash (Personal)</span>
                <span className="text-xs font-mono">017XXXXXXXX</span>
              </div>
              <div className="flex justify-between bg-slate-900/50 p-2 rounded-lg border border-white/5">
                <span className="text-xs font-bold text-orange-400">Nagad (Personal)</span>
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
              <CreditCard size={12} /> Payment Method
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
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} /> Transaction ID
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="Ex: 8J2K9L3M"
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
          SUBMIT FOR ACTIVATION
        </button>
      </form>
    </div>
  );
};

export default Activation;

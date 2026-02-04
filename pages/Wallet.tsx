
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { Wallet as WalletIcon, ArrowUpRight, History, CreditCard, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import { MIN_WITHDRAWAL, MIN_REFERRALS_FOR_WITHDRAW } from '../constants.tsx';
import { Transaction } from '../types.ts';

const Wallet: React.FC = () => {
  const { profile, refreshProfile, t } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [walletNum, setWalletNum] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile && !profile.is_active) {
      navigate('/activation');
      return;
    }
    fetchTransactions();
  }, [profile, navigate]);

  const fetchTransactions = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasMinBalance = profile && profile.balance >= MIN_WITHDRAWAL;
  const hasMinReferrals = profile && profile.referral_count >= MIN_REFERRALS_FOR_WITHDRAW;
  const canWithdraw = profile && profile.is_active && hasMinBalance && hasMinReferrals;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw || !profile) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      alert(`Minimum withdrawal is ৳${MIN_WITHDRAWAL}`);
      return;
    }
    if (withdrawAmount > profile.balance) {
      alert('Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      const { error: withdrawError } = await supabase.from('withdrawals').insert({
        user_id: profile.id,
        amount: withdrawAmount,
        method,
        wallet_number: walletNum,
        status: 'pending'
      });

      if (withdrawError) throw withdrawError;

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - withdrawAmount })
        .eq('id', profile.id);

      if (balanceError) throw balanceError;

      await supabase.from('transactions').insert({
        user_id: profile.id,
        type: 'withdraw',
        amount: withdrawAmount,
        description: `Withdrawal request via ${method}`
      });

      alert(`Withdrawal request of ৳${amount} submitted!`);
      setAmount('');
      setWalletNum('');
      refreshProfile();
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">{t.wallet}</h2>

      <div className="grid grid-cols-1 gap-4">
        {!hasMinBalance && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-center">
            <AlertCircle className="text-red-400 shrink-0" size={20} />
            <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider">Need at least ৳{MIN_WITHDRAWAL} to withdraw</p>
          </div>
        )}
        {!hasMinReferrals && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-center">
            <AlertCircle className="text-amber-400 shrink-0" size={20} />
            <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">Need {MIN_REFERRALS_FOR_WITHDRAW - profile.referral_count} more referrals to unlock</p>
          </div>
        )}
      </div>

      <GlassCard className="bg-gradient-to-br from-emerald-500 to-teal-700 border-none relative overflow-hidden h-48 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-emerald-100/60 text-xs font-bold uppercase tracking-widest">{t.total_balance}</span>
            <h1 className="text-4xl font-black">৳{profile.balance.toFixed(2)}</h1>
          </div>
          <WalletIcon className="text-emerald-100/20" size={48} />
        </div>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-100/70">
           <span>{profile.full_name}</span>
           <span>Referrals: {profile.referral_count}</span>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
      </GlassCard>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ArrowUpRight className="text-emerald-400" size={20} /> {t.payout_req}
        </h3>
        <GlassCard>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.amount}</span>
                <input type="number" min={MIN_WITHDRAWAL} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all" />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.method}</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all">
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.wallet_num}</span>
              <input type="text" value={walletNum} onChange={(e) => setWalletNum(e.target.value)} placeholder="01XXXXXXXXX" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all" />
            </label>
            <button disabled={!canWithdraw || submitting} type="submit" className="w-full py-4 bg-gradient-primary rounded-xl font-black text-sm text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:grayscale transition-all flex justify-center items-center gap-2 uppercase">
              {submitting ? <Loader2 className="animate-spin" /> : <WalletIcon size={20} />}
              {t.withdraw}
            </button>
          </form>
        </GlassCard>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History className="text-blue-400" size={20} /> {t.recent_tx}
        </h3>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="glass-dark p-3 rounded-xl flex justify-between items-center border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.type === 'withdraw' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">{tx.description}</p>
                  <p className="text-[10px] text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-sm font-black ${tx.type === 'withdraw' ? 'text-red-400' : 'text-emerald-400'}`}>
                {tx.type === 'withdraw' ? '-' : '+'}৳{tx.amount}
              </span>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center py-10 text-slate-600 italic text-sm">No transactions yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default Wallet;

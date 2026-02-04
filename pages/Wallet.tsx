
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import GlassCard from '../components/GlassCard';
import { Wallet as WalletIcon, ArrowUpRight, History, CreditCard, ShieldAlert } from 'lucide-react';
import { MIN_WITHDRAWAL, MIN_REFERRALS_FOR_WITHDRAW } from '../constants';

const Wallet: React.FC = () => {
  const user = db.user;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [walletNum, setWalletNum] = useState('');

  const canWithdraw = user.balance >= MIN_WITHDRAWAL && user.referral_count >= MIN_REFERRALS_FOR_WITHDRAW && user.is_active;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw) return;
    alert(`Withdrawal request of ৳${amount} submitted!`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">My Wallet</h2>

      {/* Activation Notice */}
      {!user.is_active && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-4">
          <ShieldAlert className="text-amber-400 shrink-0" size={24} />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-100">Account Not Active</h4>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              To withdraw funds, your account must be active. Pay the one-time activation fee of 30 BDT to unlock withdrawals.
            </p>
            <button className="mt-2 text-xs font-bold bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg active:scale-95">
              ACTIVATE NOW
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <GlassCard className="bg-gradient-to-br from-emerald-500 to-teal-700 border-none relative overflow-hidden h-48 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-emerald-100/60 text-xs font-bold uppercase tracking-widest">Available Balance</span>
            <h1 className="text-4xl font-black">৳{user.balance.toFixed(2)}</h1>
          </div>
          <WalletIcon className="text-emerald-100/20" size={48} />
        </div>
        
        <div className="flex justify-between items-end">
          <div className="text-[10px] text-emerald-100/60 font-mono">
            ACCOUNT HOLDER: {user.full_name?.toUpperCase()}<br/>
            RISEII PRO MEMBER SINCE 2024
          </div>
          <div className="w-12 h-8 glass flex items-center justify-center rounded-lg">
            <div className="w-8 h-5 bg-emerald-400/20 rounded-sm"></div>
          </div>
        </div>

        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
      </GlassCard>

      {/* Withdrawal Form */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ArrowUpRight className="text-emerald-400" size={20} /> Request Payout
        </h3>
        <GlassCard>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-400">AMOUNT (MIN 250)</span>
                <input 
                  type="number"
                  min={MIN_WITHDRAWAL}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="250"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-400">METHOD</span>
                <select 
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                </select>
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-400">WALLET NUMBER</span>
              <input 
                type="text"
                value={walletNum}
                onChange={(e) => setWalletNum(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
              />
            </label>

            {!canWithdraw && (
              <p className="text-[10px] text-red-400 font-bold bg-red-500/10 p-2 rounded-lg text-center">
                REQUIREMENTS: MIN ৳250, 3 REFERRALS & ACTIVE STATUS
              </p>
            )}

            <button 
              type="submit"
              disabled={!canWithdraw || !amount || !walletNum}
              className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:grayscale transition-all"
            >
              WITHDRAW FUNDS
            </button>
          </form>
        </GlassCard>
      </section>

      {/* History */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History className="text-blue-400" size={20} /> Recent Transactions
        </h3>
        <div className="space-y-2">
          {db.transactions.length > 0 ? (
            db.transactions.map((tx: any) => (
              <div key={tx.id} className="glass-dark p-3 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === 'earning' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
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
            ))
          ) : (
            <div className="py-8 text-center text-slate-600 text-xs italic">
              No transactions yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Wallet;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { User, ShieldCheck, Mail, LogOut, Copy, Gift, ChevronRight, LayoutDashboard, Zap, Clock, Send, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { profile, user, signOut, refreshProfile, t } = useAuth();
  const navigate = useNavigate();
  const [inputRefCode, setInputRefCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const isOwner = user?.email === 'rakibulislamrovin@gmail.com';
  const isAdmin = profile?.role === 'admin' || isOwner;

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const copyRefCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      alert('Referral code copied!');
    }
  };

  const handleApplyReferral = async () => {
    if (!profile || !inputRefCode || isApplying) return;
    const cleanCode = inputRefCode.trim().toUpperCase();
    
    if (cleanCode === profile.referral_code) {
      alert("You cannot use your own referral code.");
      return;
    }

    setIsApplying(true);
    try {
      const { data: settings } = await supabase.from('system_settings').select('referral_reward').single();
      const bonus = settings?.referral_reward || 15;

      // Use RPC to bypass RLS and update both balances atomically
      const { error: rpcError } = await supabase.rpc('apply_referral', {
        target_user_id: profile.id,
        ref_code: cleanCode,
        bonus_amount: bonus
      });

      if (rpcError) throw rpcError;

      alert(`Success! You and your friend both received ৳${bonus} bonus.`);
      setInputRefCode('');
      refreshProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Invalid referral code or internal error.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-[#00f2ff]/20 overflow-hidden bg-slate-800 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-500" />
            )}
          </div>
          {isAdmin && (
            <div className="absolute bottom-0 right-0 bg-[#00f2ff] text-slate-950 p-1 rounded-full border-2 border-slate-950 shadow-lg animate-pulse">
              <ShieldCheck size={16} />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-black">{profile.full_name || 'Riseii Member'}</h2>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
            <Mail size={12} /> {profile.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isAdmin && (
          <GlassCard 
            onClick={() => navigate('/admin')}
            className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border-emerald-400/50 border-2"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-slate-950 rounded-xl">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight uppercase">Admin Panel</h3>
                  <p className="text-[10px] text-emerald-300 uppercase font-black tracking-widest">Management Access</p>
                </div>
              </div>
              <ChevronRight className="text-emerald-400" />
            </div>
          </GlassCard>
        )}

        {!profile.referred_by && (
          <GlassCard className="border-amber-500/30 bg-amber-500/5 space-y-4">
            <div className="flex items-center gap-3">
              <Gift className="text-amber-400" size={24} />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Claim Referral Bonus</h3>
                <p className="text-[10px] text-slate-400">রেফার কোড ব্যবহার করলে আপনি এবং আপনার বন্ধু দুজনেই ১৫ টাকা পাবেন!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputRefCode} 
                onChange={(e) => setInputRefCode(e.target.value)} 
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono uppercase focus:border-amber-400 outline-none" 
                placeholder="RP-XXXXXX" 
              />
              <button 
                onClick={handleApplyReferral}
                disabled={isApplying || !inputRefCode}
                className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isApplying ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Apply
              </button>
            </div>
          </GlassCard>
        )}

        <GlassCard className="border-blue-500/30 relative">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t.ref_code}</p>
                <h3 className="text-2xl font-black mt-1 font-mono tracking-tighter text-white">{profile.referral_code}</h3>
              </div>
              <button 
                onClick={copyRefCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 active:scale-95 transition-all text-[10px] font-black uppercase"
              >
                <Copy size={14} /> {t.share_code}
              </button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.total_ref}: <b className="text-white text-sm">{profile.referral_count}</b></span>
            <button onClick={() => navigate('/referral-history')} className="text-blue-400 font-black flex items-center gap-1 uppercase text-[10px] tracking-widest hover:underline">
              {t.ref_history} <Clock size={12} />
            </button>
          </div>
        </GlassCard>

        <div className="space-y-2 mt-4">
          <button onClick={() => navigate('/wallet')} className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Zap size={20}/></div>
              <span className="font-bold text-sm uppercase tracking-tight">Earning History</span>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>
          
          <button 
            onClick={() => navigate('/kyc')}
            className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><ShieldCheck size={20}/></div>
              <span className="font-bold text-sm uppercase tracking-tight">{t.kyc_status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                profile.kyc_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 
                profile.kyc_status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-500'
              }`}>
                {profile.kyc_status === 'none' ? t.verify_now : profile.kyc_status}
              </span>
              <ChevronRight size={18} className="text-slate-600" />
            </div>
          </button>

          <button 
            onClick={handleSignOut}
            className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between group hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><LogOut size={20}/></div>
              <span className="font-bold text-sm group-hover:text-red-400 uppercase tracking-tight">{t.sign_out}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

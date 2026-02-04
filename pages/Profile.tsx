
import React from 'react';
import { db } from '../services/mockDb';
import GlassCard from '../components/GlassCard';
import { User, ShieldCheck, Mail, LogOut, Share2, Copy, Gift, ChevronRight } from 'lucide-react';

const Profile: React.FC = () => {
  const user = db.user;

  const copyRef = () => {
    navigator.clipboard.writeText(user.referral_code);
    alert('Code copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 overflow-hidden">
            <img src={user.avatar_url || 'https://picsum.photos/100'} alt="Profile" className="w-full h-full object-cover" />
          </div>
          {user.kyc_status === 'verified' && (
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-950">
              <ShieldCheck size={16} />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-black">{user.full_name}</h2>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
            <Mail size={12} /> {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Referral Card */}
        <GlassCard className="border-blue-500/30 relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Your Referral Code</p>
              <h3 className="text-2xl font-black mt-1 font-mono tracking-tighter">{user.referral_code}</h3>
            </div>
            <button 
              onClick={copyRef}
              className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 active:scale-95"
            >
              <Copy size={20} />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Referrals: <b className="text-white">{user.referral_count}</b></span>
            <span className="text-blue-400 font-bold flex items-center gap-1">
              Invite Friends <Share2 size={12} />
            </span>
          </div>
        </GlassCard>

        {/* Menu Items */}
        <div className="space-y-2 mt-4">
          <button className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Gift size={20}/></div>
              <span className="font-bold text-sm">Bonuses & Rewards</span>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>
          
          <button className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><ShieldCheck size={20}/></div>
              <span className="font-bold text-sm">KYC Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified</span>
              <ChevronRight size={18} className="text-slate-600" />
            </div>
          </button>

          <button className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><User size={20}/></div>
              <span className="font-bold text-sm">Account Settings</span>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>

          <button className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between group hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><LogOut size={20}/></div>
              <span className="font-bold text-sm group-hover:text-red-400">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

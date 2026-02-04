
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { User, ShieldCheck, Mail, LogOut, Share2, Copy, Gift, ChevronRight, LayoutDashboard, Zap } from 'lucide-react';

const Profile: React.FC = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  // Hardcoded check for the owner email to prevent sync issues
  const isOwner = user?.email === 'rakibulislamrovin@gmail.com';
  const isAdmin = profile?.role === 'admin' || isOwner;

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const copyRef = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      alert('Referral code copied!');
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 overflow-hidden bg-slate-800 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-500" />
            )}
          </div>
          {isAdmin && (
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-950 shadow-lg animate-pulse">
              <ShieldCheck size={16} />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-black">{profile.full_name || 'Riseii Member'}</h2>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
            <Mail size={12} /> {profile.email}
          </p>
          {isAdmin && (
            <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/30">
              System Administrator
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {isAdmin && (
          <GlassCard 
            onClick={() => navigate('/admin')}
            className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border-emerald-400/50 border-2 shadow-emerald-500/10"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/40">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight">ADMIN PANEL ACCESS</h3>
                  <p className="text-[10px] text-emerald-300 uppercase font-black tracking-widest flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> Management Mode Active
                  </p>
                </div>
              </div>
              <div className="bg-emerald-500/20 p-2 rounded-full">
                <ChevronRight size={24} className="text-emerald-400" />
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard className="border-blue-500/30 relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Your Referral Code</p>
              <h3 className="text-2xl font-black mt-1 font-mono tracking-tighter">{profile.referral_code}</h3>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                copyRef();
              }}
              className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 active:scale-95"
            >
              <Copy size={20} />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Referrals: <b className="text-white">{profile.referral_count}</b></span>
            <span className="text-blue-400 font-bold flex items-center gap-1">
              Invite Friends <Share2 size={12} />
            </span>
          </div>
        </GlassCard>

        <div className="space-y-2 mt-4">
          <button className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Gift size={20}/></div>
              <span className="font-bold text-sm">Bonuses & Rewards</span>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
          </button>
          
          <button 
            onClick={() => navigate('/kyc')}
            className="w-full glass-dark p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-all"><ShieldCheck size={20}/></div>
              <span className="font-bold text-sm">KYC Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                profile.kyc_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 
                profile.kyc_status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-500'
              }`}>
                {profile.kyc_status === 'none' ? 'Verify Now' : profile.kyc_status}
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
              <span className="font-bold text-sm group-hover:text-red-400">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

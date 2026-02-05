
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { 
  Megaphone, ArrowRight, CheckSquare, Loader2, ShieldAlert, Zap, 
  UserX, RefreshCw, LogOut, Info, Gift, MessageCircle, Wallet, 
  CheckCircle, Trophy, Star, TrendingUp, Download, Play, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task, Withdrawal } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, profileLoading, refreshProfile, signOut } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState({ totalPaid: 45250, verifiedUsers: 1240 });
  const [loadingData, setLoadingData] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'rakibulislamrovin@gmail.com';

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [settingsRes, tasksRes, payoutsRes] = await Promise.all([
          supabase.from('system_settings').select('*').single(),
          supabase.from('tasks').select('*').eq('is_active', true).order('is_featured', { ascending: false }).limit(5),
          supabase.from('withdrawals').select('*, user:profiles(full_name)').eq('status', 'completed').order('created_at', { ascending: false }).limit(5)
        ]);
        
        if (settingsRes.data) setSettings(settingsRes.data);
        if (tasksRes.data) setRecentTasks(tasksRes.data);
        if (payoutsRes.data) setRecentPayouts(payoutsRes.data);
        
        // Manual stats simulation/fetch
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { data: withdrawalSums } = await supabase.from('withdrawals').select('amount').eq('status', 'completed');
        const sum = withdrawalSums?.reduce((acc, curr) => acc + curr.amount, 0) || 45250;
        
        setStats({ totalPaid: sum, verifiedUsers: userCount || 1240 });
      } catch (err) {
        console.error("Dashboard Data Error:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (user && profile) fetchData();
  }, [user, profile]);

  if (profileLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#00f2ff]/10 border-t-[#00f2ff] rounded-full animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00f2ff] animate-pulse" size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">সংযোগ করা হচ্ছে...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Global Trust Counter - Professional Look */}
      <div className="flex gap-3">
        <div className="flex-1 glass-dark border-emerald-500/20 p-4 rounded-3xl flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="flex justify-between items-start z-10">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">LIVE</span>
            </div>
          </div>
          <div className="z-10">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Payouts</p>
            <p className="text-xl font-black text-emerald-400">৳{stats.totalPaid.toLocaleString()}</p>
          </div>
          <div className="absolute -bottom-4 -right-4 text-emerald-500/5 group-hover:scale-110 transition-transform">
             <Trophy size={80} />
          </div>
        </div>
        <div className="flex-1 glass-dark border-blue-500/20 p-4 rounded-3xl flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="flex justify-between items-start z-10">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users size={16} />
            </div>
          </div>
          <div className="z-10">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Workers</p>
            <p className="text-xl font-black text-blue-400">{stats.verifiedUsers.toLocaleString()}+</p>
          </div>
          <div className="absolute -bottom-4 -right-4 text-blue-500/5 group-hover:scale-110 transition-transform">
             <CheckCircle size={80} />
          </div>
        </div>
      </div>

      {/* Notice Board */}
      {settings?.notice_text && (
        <Link to={settings.notice_link || '/notice'} className="block">
          <div className="bg-gradient-to-r from-[#00f2ff]/20 to-[#7b61ff]/20 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-all">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00f2ff] group-hover:rotate-12 transition-transform">
              <Megaphone size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-200 font-bold leading-snug">{settings.notice_text}</p>
              <span className="text-[8px] font-black uppercase text-[#00f2ff]/60 tracking-widest mt-1 block">বিস্তারিত দেখুন <ArrowRight className="inline" size={8} /></span>
            </div>
          </div>
        </Link>
      )}

      {/* Quick Actions Scroll */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
         <div className="min-w-[120px] glass-dark border-white/5 p-4 rounded-2xl text-center space-y-2 group active:scale-95 transition-all">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto group-hover:bg-amber-500 group-hover:text-slate-950 transition-all"><Gift size={20} /></div>
            <p className="text-[9px] font-black uppercase text-slate-400">Daily Bonus</p>
         </div>
         <Link to="/referral-history" className="min-w-[120px] glass-dark border-white/5 p-4 rounded-2xl text-center space-y-2 group active:scale-95 transition-all">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-500 group-hover:text-slate-950 transition-all"><Users size={20} /></div>
            <p className="text-[9px] font-black uppercase text-slate-400">Invite Friends</p>
         </Link>
         <div className="min-w-[120px] glass-dark border-white/5 p-4 rounded-2xl text-center space-y-2 group active:scale-95 transition-all">
            <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto group-hover:bg-red-500 group-hover:text-slate-950 transition-all"><Play size={20} /></div>
            <p className="text-[9px] font-black uppercase text-slate-400">Watch Guide</p>
         </div>
         <a href="#" className="min-w-[120px] glass-dark border-white/5 p-4 rounded-2xl text-center space-y-2 group active:scale-95 transition-all">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all"><Download size={20} /></div>
            <p className="text-[9px] font-black uppercase text-slate-400">Download App</p>
         </a>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 to-transparent border-[#00f2ff]/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.total_balance}</span>
          <span className="text-2xl font-black text-[#00f2ff]">৳{profile.balance.toFixed(2)}</span>
        </GlassCard>
        <Link to="/wallet" className="block">
          <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-transparent border-[#7b61ff]/20 active:scale-95 transition-all">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">Quick Wallet</span>
            <div className="flex justify-between items-center">
              <span className="text-xl font-black text-[#7b61ff]">WITHDRAW</span>
              <ArrowRight className="text-[#7b61ff]/40" size={16} />
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Tasks Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CheckSquare className="text-[#00f2ff]" size={18} /> Available Work
          </h3>
          <Link to="/tasks" className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest border-b border-[#00f2ff]/20 pb-0.5">{t.view_all}</Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {loadingData ? (
             <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-600" /></div>
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <Link key={task.id} to={`/tasks`}>
                <GlassCard className={`hover:border-[#00f2ff]/40 transition-all group p-4 border-l-4 ${task.category === 'facebook' ? 'border-l-[#1877F2]' : task.is_featured ? 'border-l-amber-500' : 'border-l-white/5'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${task.category === 'facebook' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-white/5 text-slate-300'}`}><Zap size={20} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-200">{task.title}</h4>
                          {task.is_featured && <Star size={12} className="text-amber-500 fill-current" />}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{task.category}</p>
                      </div>
                    </div>
                    <span className="text-white font-black text-lg">৳{task.reward_amount}</span>
                  </div>
                </GlassCard>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 glass rounded-3xl border-dashed border-white/5">
              <p className="text-xs text-slate-600 italic">নতুন কাজ শীঘ্রই আসছে...</p>
            </div>
          )}
        </div>
      </section>

      {/* Payout Ticker - Trust Builder */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
           <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Withdrawals (Verified)</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {recentPayouts.map((p, idx) => (
            <div key={idx} className="min-w-[160px] glass-dark p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black text-emerald-400">{(p as any).user?.full_name?.[0] || 'R'}</div>
                 <p className="text-[10px] font-black text-slate-300 truncate">{(p as any).user?.full_name || 'Riseii Member'}</p>
               </div>
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-[8px] text-slate-600 font-bold uppercase">{p.method}</p>
                   <p className="text-xs font-black text-emerald-400">৳{p.amount}</p>
                 </div>
                 <CheckCircle size={14} className="text-emerald-500/40" />
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

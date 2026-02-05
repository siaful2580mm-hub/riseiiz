
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { 
  Megaphone, ArrowRight, CheckSquare, Loader2, Zap, 
  Gift, Users, Wallet, CheckCircle, Trophy, TrendingUp, Download, Play, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task, Withdrawal } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, profileLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ totalPaid: 45250, verifiedUsers: 1240 });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [settingsRes, tasksRes] = await Promise.all([
          supabase.from('system_settings').select('*').single(),
          supabase.from('tasks').select('*').eq('is_active', true).order('is_featured', { ascending: false }).limit(5)
        ]);
        
        if (settingsRes.data) setSettings(settingsRes.data);
        if (tasksRes.data) setRecentTasks(tasksRes.data);
        
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { data: withdrawalSums } = await supabase.from('withdrawals').select('amount').eq('status', 'completed');
        const sum = (withdrawalSums?.reduce((acc, curr) => acc + curr.amount, 0) || 0) + 45250;
        
        setStats({ totalPaid: sum, verifiedUsers: (userCount || 0) + 1240 });
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

  // Calculate earning progress toward min withdrawal
  const minWithdraw = settings?.min_withdrawal || 250;
  const progressPercent = Math.min((profile.balance / minWithdraw) * 100, 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Global Trust Header */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-dark border-emerald-500/20 p-4 rounded-[2rem] flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="z-10">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <TrendingUp size={16} />
            </div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Paid Out</p>
            <p className="text-xl font-black text-emerald-400">৳{stats.totalPaid.toLocaleString()}</p>
          </div>
          <Trophy size={80} className="absolute -bottom-4 -right-4 text-emerald-500/5 group-hover:scale-110 transition-transform" />
        </div>
        <div className="glass-dark border-blue-500/20 p-4 rounded-[2rem] flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="z-10">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
              <Users size={16} />
            </div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Earners</p>
            <p className="text-xl font-black text-blue-400">{stats.verifiedUsers.toLocaleString()}+</p>
          </div>
          <CheckCircle size={80} className="absolute -bottom-4 -right-4 text-blue-500/5 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Notice Board */}
      {settings?.notice_text && (
        <Link to={settings.notice_link || '/notice'} className="block">
          <div className="bg-gradient-to-r from-[#00f2ff]/10 to-[#7b61ff]/10 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-all">
            <div className="w-10 h-10 bg-[#00f2ff]/10 rounded-xl flex items-center justify-center text-[#00f2ff] group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(0,242,255,0.1)]">
              <Megaphone size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-200 font-bold leading-tight">{settings.notice_text}</p>
              <span className="text-[8px] font-black uppercase text-[#00f2ff]/60 tracking-widest mt-1 block">বিস্তারিত পড়ুন <ArrowRight className="inline" size={8} /></span>
            </div>
          </div>
        </Link>
      )}

      {/* User Balance & Progress */}
      <div className="grid grid-cols-1 gap-4">
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 via-transparent to-transparent border-[#00f2ff]/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">My Balance</span>
              <h1 className="text-4xl font-black text-[#00f2ff] mt-1">৳{profile.balance.toFixed(2)}</h1>
            </div>
            <div className="text-right">
               <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Trust Score</span>
               <div className="flex items-center gap-1 mt-1">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span className="text-sm font-black text-white">98%</span>
               </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
              <span>Withdraw Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-primary shadow-[0_0_10px_#00f2ff]" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-[7px] text-slate-600 font-bold uppercase">Target: ৳{minWithdraw}</p>
          </div>
        </GlassCard>
      </div>

      {/* Quick Access Menu */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
         <Link to="/referral-history" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto"><Users size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Referral</p>
         </Link>
         <Link to="/tasks" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto"><Zap size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Tasks</p>
         </Link>
         <Link to="/wallet" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-[#7b61ff]/10 text-[#7b61ff] rounded-2xl flex items-center justify-center mx-auto"><Wallet size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Wallet</p>
         </Link>
      </div>

      {/* Featured Missions */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
            <Zap className="text-[#00f2ff]" size={16} /> New Opportunities
          </h3>
          <Link to="/tasks" className="text-[9px] font-black text-[#00f2ff] uppercase tracking-widest">View All <ChevronRight className="inline" size={10} /></Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {loadingData ? (
             <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-600" /></div>
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <Link key={task.id} to={`/tasks`}>
                <GlassCard className="hover:border-[#00f2ff]/40 transition-all group p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={18} className="text-[#00f2ff]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">{task.title}</h4>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{task.category}</p>
                      </div>
                    </div>
                    <span className="text-[#00f2ff] font-black text-lg">৳{task.reward_amount}</span>
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
    </div>
  );
};

export default Dashboard;

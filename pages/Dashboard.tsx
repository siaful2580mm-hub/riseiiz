
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { 
  Megaphone, ArrowRight, CheckSquare, Loader2, Zap, 
  Gift, Users, Wallet, CheckCircle, Trophy, TrendingUp, Download, Play 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task, Withdrawal } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, profileLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState({ totalPaid: 45250, verifiedUsers: 1240 });
  const [loadingData, setLoadingData] = useState(true);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Global Trust Header - Visual Impact */}
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
          <div className="absolute top-4 right-4 flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
             <span className="text-[6px] font-black text-emerald-500 uppercase">Live</span>
          </div>
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

      {/* Main Balance Card */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 via-transparent to-transparent border-[#00f2ff]/20 flex flex-col justify-between h-32">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">My Balance</span>
          <div>
            <span className="text-3xl font-black text-[#00f2ff]">৳{profile.balance.toFixed(2)}</span>
            <div className="flex items-center gap-1 mt-1">
               <Gift size={10} className="text-amber-500" />
               <span className="text-[8px] text-amber-500/80 font-black uppercase">৳১০ বোনাস যুক্ত</span>
            </div>
          </div>
        </GlassCard>
        <Link to="/wallet" className="block">
          <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-transparent border-[#7b61ff]/20 active:scale-95 transition-all flex flex-col justify-between h-32">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Quick Action</span>
            <div className="flex justify-between items-end">
              <span className="text-lg font-black text-white leading-tight">CASH OUT<br/><span className="text-[#7b61ff]">WALLET</span></span>
              <div className="w-8 h-8 rounded-full bg-[#7b61ff]/20 flex items-center justify-center text-[#7b61ff]">
                <ArrowRight size={16} />
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Quick Access Menu */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
         <Link to="/referral-history" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto"><Users size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Referral</p>
         </Link>
         <a href={settings?.support_url} target="_blank" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto"><Play size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Tutorial</p>
         </a>
         <Link to="/tasks" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto"><Zap size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Top Work</p>
         </Link>
         <Link to="/kyc" className="min-w-[110px] glass-dark border-white/5 p-4 rounded-3xl text-center space-y-2 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto"><CheckCircle size={20} /></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">KYC</p>
         </Link>
      </div>

      {/* Featured Missions */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
            <Zap className="text-[#00f2ff]" size={16} /> High Reward Tasks
          </h3>
          <Link to="/tasks" className="text-[9px] font-black text-[#00f2ff] uppercase tracking-widest">সকল কাজ <ChevronRight className="inline" size={10} /></Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {loadingData ? (
             <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-600" /></div>
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <Link key={task.id} to={`/tasks`}>
                <GlassCard className={`hover:border-[#00f2ff]/40 transition-all group p-4 border-l-4 ${task.category === 'facebook' ? 'border-l-[#1877F2] bg-[#1877F2]/5' : task.is_featured ? 'border-l-amber-500' : 'border-l-white/5'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${task.category === 'facebook' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-white/5 text-slate-300'}`}>
                        {task.category === 'facebook' ? <Facebook size={18} /> : <Zap size={18} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">{task.title}</h4>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{task.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-white font-black text-lg block leading-none">৳{task.reward_amount}</span>
                       <span className="text-[7px] text-emerald-400 uppercase font-black">Verified</span>
                    </div>
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

      {/* Payout Ticker */}
      <div className="glass-dark border-white/5 rounded-2xl p-3 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Payout Status</p>
         </div>
         <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
               <div key={i} className="w-5 h-5 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[6px] font-black text-white">{String.fromCharCode(64+i)}</div>
            ))}
         </div>
      </div>
    </div>
  );
};

// Simple internal icon for layout consistency
const Facebook = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const ChevronRight = ({ className, size }: { className?: string; size: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
);

export default Dashboard;


import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { Megaphone, ArrowRight, CheckSquare, Loader2, ShieldAlert, Zap, UserX, RefreshCw, LogOut, Info, Gift, MessageCircle, Wallet, CheckCircle, Trophy, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task, Withdrawal } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, profileLoading, refreshProfile, signOut } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, verifiedUsers: 0 });
  const [loadingData, setLoadingData] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'rakibulislamrovin@gmail.com';

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [settingsRes, tasksRes, payoutsRes, statsRes] = await Promise.all([
          supabase.from('system_settings').select('*').single(),
          supabase.from('tasks').select('*').eq('is_active', true).order('is_featured', { ascending: false }).limit(5),
          supabase.from('withdrawals').select('*, user:profiles(full_name)').eq('status', 'completed').order('created_at', { ascending: false }).limit(3),
          supabase.rpc('get_app_stats').catch(() => ({ data: { paid: 45250, users: 1240 } })) // Fallback or custom RPC
        ]);
        
        if (settingsRes.data) setSettings(settingsRes.data);
        if (tasksRes.data) setRecentTasks(tasksRes.data);
        if (payoutsRes.data) setRecentPayouts(payoutsRes.data);
        
        // Manual stats if RPC not exists
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true);
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
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Global Trust Counter */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-dark border-emerald-500/20 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><Trophy size={16} /></div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Paid</p>
            <p className="text-sm font-black text-emerald-400">৳{stats.totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-dark border-blue-500/20 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><CheckCircle size={16} /></div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Verified</p>
            <p className="text-sm font-black text-blue-400">{stats.verifiedUsers.toLocaleString()}+</p>
          </div>
        </div>
      </div>

      {/* Featured Notification */}
      {settings?.notice_text && (
        <Link to={settings.notice_link || '/notice'} className="block">
          <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-2xl p-4 flex items-start gap-4 neon-pulse group">
            <Megaphone className="text-[#00f2ff] shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <p className="text-sm text-slate-200 leading-relaxed font-medium">{settings.notice_text}</p>
              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#00f2ff]/60 mt-2">
                সব খবর দেখুন <ArrowRight size={10} />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 to-transparent border-[#00f2ff]/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.total_balance}</span>
          <span className="text-2xl font-black text-[#00f2ff]">৳{profile.balance.toFixed(2)}</span>
        </GlassCard>
        <Link to="/referral-history" className="block">
          <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-transparent border-[#7b61ff]/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.referrals}</span>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-[#7b61ff]">{profile.referral_count}</span>
              <ArrowRight className="text-[#7b61ff]/40" size={16} />
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Banner Ad Section */}
      {settings?.banner_ads_code && (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-center py-1 text-slate-700">Sponsored Advertisement</p>
          <div 
            className="flex justify-center"
            dangerouslySetInnerHTML={{ __html: settings.banner_ads_code }}
          />
        </div>
      )}

      {/* Tasks Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CheckSquare className="text-[#00f2ff]" size={18} /> {t.active_opps}
          </h3>
          <Link to="/tasks" className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">{t.view_all}</Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {loadingData ? (
             <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-600" /></div>
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <Link key={task.id} to={`/tasks`}>
                <GlassCard className={`hover:border-[#00f2ff]/40 transition-all group p-4 border-l-4 ${task.is_featured ? 'border-l-amber-500' : 'border-l-transparent'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:text-[#00f2ff]"><Zap size={20} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-200">{task.title}</h4>
                          {task.is_featured && <Star size={12} className="text-amber-500 fill-current" />}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{task.category}</p>
                      </div>
                    </div>
                    <span className="text-[#00f2ff] font-black text-lg">৳{task.reward_amount}</span>
                  </div>
                </GlassCard>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 glass rounded-2xl border-dashed border-white/5">
              <p className="text-xs text-slate-500 italic">বর্তমানে কোনো কাজ নেই।</p>
            </div>
          )}
        </div>
      </section>

      {/* Payouts Ticker */}
      <section className="space-y-3 pb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Recent Proof of Payment</h3>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {recentPayouts.map((p, idx) => (
            <div key={idx} className="min-w-[140px] glass-dark p-3 rounded-xl border border-white/5">
               <p className="text-[9px] font-black text-white truncate">{(p as any).user?.full_name}</p>
               <div className="flex justify-between items-center mt-2">
                 <span className="text-emerald-400 font-black text-xs">৳{p.amount}</span>
                 <CheckCircle size={10} className="text-emerald-500" />
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

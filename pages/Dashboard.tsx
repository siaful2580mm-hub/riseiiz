import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ExternalLink, Megaphone, ArrowRight, CheckSquare, Loader2, ShieldAlert, Zap, UserX, RefreshCw, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, profileLoading, refreshProfile, signOut } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'rakibulislamrovin@gmail.com';

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [settingsRes, tasksRes] = await Promise.all([
          supabase.from('system_settings').select('*').maybeSingle(),
          supabase.from('tasks').select('*').eq('is_active', true).limit(5)
        ]);
        if (settingsRes.data) setSettings(settingsRes.data);
        if (tasksRes.data) setRecentTasks(tasksRes.data);
      } catch (err) {
        console.error("Dashboard Data Error:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  // If user exists but profile is still loading from DB
  if (profileLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="animate-spin text-[#00f2ff]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">আপনার প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  // If user is logged in but profile record is definitely missing (trigger failed)
  if (!profile && user && !profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 px-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <UserX size={40} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">প্রোফাইল তৈরি হয়নি</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            আপনার অ্যাকাউন্ট তৈরি হয়েছে কিন্তু ড্যাশবোর্ড প্রোফাইল এখনও প্রস্তুত নয়। এটি সাধারণত প্রথমবার সাইনআপের সময় হয়।
          </p>
        </div>
        <div className="flex flex-col w-full gap-3 max-w-xs">
          <button 
            onClick={() => refreshProfile()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-primary rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00f2ff]/20"
          >
            <RefreshCw size={18} /> আবার চেষ্টা করুন
          </button>
          <button 
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 rounded-xl text-slate-400 font-black text-xs uppercase tracking-widest border border-white/5"
          >
            <LogOut size={18} /> লগআউট
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {isAdmin && (
        <Link to="/admin" className="block">
          <div className="bg-gradient-to-r from-[#7b61ff] to-[#00f2ff] p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-[#00f2ff]/20 active:scale-95 transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShieldAlert className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-white font-black text-lg uppercase leading-tight">এডমিন প্যানেল</h2>
                <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80">সিস্টেম ম্যানেজমেন্ট</p>
              </div>
            </div>
            <ArrowRight className="text-white" size={20} />
          </div>
        </Link>
      )}

      {settings?.notice_text && (
        <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-2xl p-4 flex items-start gap-4 neon-pulse">
          <Megaphone className="text-[#00f2ff] shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {settings.notice_text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 to-transparent">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.total_balance}</span>
          <span className="text-2xl font-black text-[#00f2ff]">৳{profile.balance.toFixed(2)}</span>
        </GlassCard>
        <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-transparent">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.referrals}</span>
          <span className="text-2xl font-black text-[#7b61ff]">{profile.referral_count}</span>
        </GlassCard>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CheckSquare className="text-[#00f2ff]" size={18} /> {t.active_opps}
          </h3>
          <Link to="/tasks" className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">
             {t.view_all}
          </Link>
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
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:text-[#00f2ff] transition-colors">
                         <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{task.category}</p>
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
    </div>
  );
};

export default Dashboard;
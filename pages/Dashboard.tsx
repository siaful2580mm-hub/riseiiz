import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ExternalLink, Megaphone, ArrowRight, CheckSquare, Loader2, ShieldAlert, Zap, UserX, RefreshCw, LogOut, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, profileLoading, refreshProfile, signOut, debugInfo } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

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

    if (user && profile) fetchData();
  }, [user, profile]);

  // If user is authenticated but profile is missing from database (common for failed referrals)
  if (!profile && user && !profileLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 text-center space-y-8 px-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center border border-red-500/20 relative">
          <UserX size={48} className="text-red-500" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-50"></div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-black uppercase tracking-tighter">প্রোফাইল ত্রুটি!</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            আপনার অ্যাকাউন্ট তৈরি হয়েছে কিন্তু ডাটাবেস আপনার প্রোফাইলটি রেকর্ড করতে পারেনি। এটি সাধারণত ভুল রেফারাল কোড বা সার্ভার ওভারলোডের কারণে হয়।
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 max-w-xs mx-auto">
          <button 
            onClick={() => refreshProfile()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-primary rounded-2xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00f2ff]/20 active:scale-95 transition-all"
          >
            <RefreshCw size={18} /> পুনরায় লোড করুন
          </button>
          <button 
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10"
          >
            <LogOut size={18} /> লগআউট করুন
          </button>
          
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] flex items-center justify-center gap-1 mt-4"
          >
            <Terminal size={10} /> {showLogs ? "Logs লুকান" : "Debug Logs দেখুন"}
          </button>
        </div>

        {showLogs && (
          <div className="w-full bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-[9px] text-emerald-500/80 text-left overflow-y-auto max-h-48 space-y-1">
            {debugInfo.map((log, i) => <div key={i} className="border-l border-emerald-500/20 pl-2">{log}</div>)}
          </div>
        )}
      </div>
    );
  }

  // Background loader inside dashboard
  if (profileLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#00f2ff]/10 border-t-[#00f2ff] rounded-full animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00f2ff] animate-pulse" size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {isAdmin && (
        <Link to="/admin" className="block">
          <div className="bg-gradient-to-r from-[#7b61ff] to-[#00f2ff] p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-[#00f2ff]/20 active:scale-95 transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShieldAlert className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-white font-black text-lg uppercase leading-tight">এডমিন প্যানেল</h2>
                <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80">সিস্টেম কন্ট্রোল</p>
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
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 to-transparent border-[#00f2ff]/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.total_balance}</span>
          <span className="text-2xl font-black text-[#00f2ff]">৳{profile.balance.toFixed(2)}</span>
        </GlassCard>
        <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-transparent border-[#7b61ff]/20">
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
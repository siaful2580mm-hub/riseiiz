import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { TrendingUp, ExternalLink, Megaphone, ArrowRight, CheckSquare, Loader2, ShieldAlert, Zap, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile, user, t, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'rakibulislamrovin@gmail.com';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, tasksRes] = await Promise.all([
          supabase.from('system_settings').select('*').maybeSingle(),
          supabase.from('tasks').select('*').eq('is_active', true).limit(5)
        ]);

        if (settingsRes.data) setSettings(settingsRes.data);
        if (tasksRes.data) setRecentTasks(tasksRes.data);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="animate-spin text-[#00f2ff]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  // If auth finished but profile is still null, it's a critical error
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <UserX size={48} className="text-red-500 opacity-50" />
        <h2 className="text-xl font-bold">প্রোফাইল পাওয়া যায়নি</h2>
        <p className="text-slate-400 max-w-xs text-sm">আপনার অ্যাকাউন্টটি ঠিকমতো তৈরি হয়নি। অনুগ্রহ করে লগআউট করে আবার চেষ্টা করুন অথবা এডমিনের সাথে যোগাযোগ করুন।</p>
      </div>
    );
  }

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
                <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80">পুরো সিস্টেম আপনার নিয়ন্ত্রণে</p>
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
            {settings.notice_link && (
              <a 
                href={settings.notice_link} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#00f2ff] text-[10px] font-black mt-2 hover:underline uppercase tracking-widest"
              >
                টেলিগ্রাম চ্যানেলে যোগ দিন <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-[#00f2ff]/10 to-transparent border-[#00f2ff]/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.total_balance}</span>
          <span className="text-2xl font-black text-[#00f2ff]">৳{profile.balance.toFixed(2)}</span>
          <div className="flex items-center gap-1 mt-3 text-[9px] text-emerald-500 font-black uppercase tracking-widest">
            <TrendingUp size={10} /> লাইভ আপডেট
          </div>
        </GlassCard>
        <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-transparent border-[#7b61ff]/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">{t.referrals}</span>
          <span className="text-2xl font-black text-[#7b61ff]">{profile.referral_count}</span>
          <Link to="/profile" className="text-[9px] text-[#7b61ff] font-black mt-3 flex items-center gap-1 hover:text-white transition-colors uppercase tracking-widest">
            কোড শেয়ার করুন <ArrowRight size={10} />
          </Link>
        </GlassCard>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <CheckSquare className="text-[#00f2ff]" size={18} /> {t.active_opps}
          </h3>
          <Link to="/tasks" className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest hover:underline">
             {t.view_all}
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <Link key={task.id} to={`/tasks`}>
                <GlassCard className="hover:border-[#00f2ff]/40 transition-all group p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-[#00f2ff] transition-colors">
                         <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200 group-hover:text-white">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{task.category}</p>
                      </div>
                    </div>
                    <span className="text-[#00f2ff] font-black text-lg">৳{task.reward_amount}</span>
                  </div>
                </GlassCard>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 glass rounded-2xl border-dashed border-white/5">
              <p className="text-xs text-slate-500 font-medium italic">বর্তমানে কোনো কাজ নেই। এডমিন ডাটা যোগ করলে এখানে দেখা যাবে।</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
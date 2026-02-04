
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { TrendingUp, Users, ExternalLink, Megaphone, ArrowRight, CheckSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemSettings, Task } from '../types.ts';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [settingsRes, tasksRes] = await Promise.all([
        supabase.from('system_settings').select('*').single(),
        supabase.from('tasks').select('*').eq('is_active', true).limit(3)
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (tasksRes.data) setRecentTasks(tasksRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {settings?.notice_text && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-4 animate-pulse">
          <Megaphone className="text-emerald-400 shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <p className="text-sm text-emerald-100 leading-relaxed">
              {settings.notice_text}
            </p>
            {settings.notice_link && (
              <a 
                href={settings.notice_link} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold mt-2 hover:underline"
              >
                JOIN CHANNEL <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Balance</span>
            <span className="text-3xl font-black text-emerald-400">৳{profile?.balance?.toFixed(2) || '0.00'}</span>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-500/70 font-bold">
              <TrendingUp size={12} /> Live Updates
            </div>
          </div>
        </GlassCard>
        <GlassCard className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Referrals</span>
            <span className="text-3xl font-black text-blue-400">{profile?.referral_count || 0}</span>
            <Link to="/profile" className="text-[10px] text-blue-500/70 font-bold mt-2 flex items-center gap-1 hover:text-blue-400 transition-colors">
              SHARE CODE <ArrowRight size={10} />
            </Link>
          </div>
        </GlassCard>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CheckSquare className="text-emerald-400" size={20} /> Active Opportunities
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <Link key={task.id} to={`/tasks`}>
                <GlassCard className="hover:bg-white/10 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold group-hover:text-emerald-400 transition-colors">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg font-black text-sm">
                      ৳{task.reward_amount}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No tasks available at the moment.</div>
          )}
          <Link to="/tasks" className="w-full py-3 rounded-xl bg-slate-900 border border-white/10 text-center text-sm font-bold text-slate-400 hover:text-white transition-colors">
            View All Tasks
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

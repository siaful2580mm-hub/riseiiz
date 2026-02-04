
import React from 'react';
import { db } from '../services/mockDb';
import GlassCard from '../components/GlassCard';
import { TrendingUp, Users, ExternalLink, Megaphone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const user = db.user;
  const settings = db.settings;

  return (
    <div className="space-y-6">
      {/* Notice Section */}
      {settings.notice_text && (
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

      {/* Balance Summary */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Balance</span>
            <span className="text-3xl font-black text-emerald-400">৳{user.balance.toFixed(2)}</span>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-500/70 font-bold">
              <TrendingUp size={12} /> +12% this week
            </div>
          </div>
        </GlassCard>
        <GlassCard className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Referrals</span>
            <span className="text-3xl font-black text-blue-400">{user.referral_count}</span>
            <Link to="/profile" className="text-[10px] text-blue-500/70 font-bold mt-2 flex items-center gap-1 hover:text-blue-400 transition-colors">
              SHARE CODE <ArrowRight size={10} />
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Ad Space */}
      <div className="w-full h-24 glass-dark rounded-xl flex items-center justify-center text-slate-600 border border-white/5 border-dashed">
        <p className="text-xs font-medium uppercase tracking-widest">Sponsored Advertisement</p>
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CheckSquare className="text-emerald-400" size={20} /> Active Opportunities
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {db.tasks.slice(0, 3).map((task) => (
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
          ))}
          <Link to="/tasks" className="w-full py-3 rounded-xl bg-slate-900 border border-white/10 text-center text-sm font-bold text-slate-400 hover:text-white transition-colors">
            View All Tasks
          </Link>
        </div>
      </section>

      {/* Referral Info */}
      <GlassCard className="relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-2">
          <h3 className="text-lg font-bold">Refer & Earn Bonus</h3>
          <p className="text-sm text-slate-400">Invite friends to Riseii Pro and get 5 BDT each when they sign up.</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 bg-slate-900 rounded-lg p-3 text-center border border-white/10 font-mono text-emerald-400">
              {user.referral_code}
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(user.referral_code);
                alert("Referral code copied!");
              }}
              className="px-6 py-3 bg-gradient-primary rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              COPY
            </button>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 text-emerald-500/5 opacity-50">
          <Users size={120} />
        </div>
      </GlassCard>
    </div>
  );
};

import { CheckSquare } from 'lucide-react';
export default Dashboard;

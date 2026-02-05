
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, 
  Trash2, Edit, Loader2, Eye, Plus, ExternalLink, 
  History as HistoryIcon, Filter, Zap, UserX, UserCheck, Coins, Search, AlertTriangle,
  Settings as SettingsIcon, Save, Megaphone, FileText, Wrench, ToggleRight, X, LayoutGrid, Link as LinkIcon,
  ChevronRight, ArrowUpRight, Ban, Unlock, UserCircle, Wallet, MessageCircle, RefreshCw, Star, TrendingUp, DollarSign
} from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType, SubmissionStatus, Activation, SystemSettings, Withdrawal } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'withdrawals' | 'tasks' | 'users' | 'settings'>('submissions');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, pendingSubmissions: 0, pendingWithdrawals: 0, totalEarnings: 0 });

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '', description: '', category: 'facebook', reward_amount: 10, link: '', proof_type: 'image', is_active: true, is_featured: false
  });

  useEffect(() => {
    fetchData();
    fetchAdminStats();
  }, [activeTab, subFilter]);

  const fetchAdminStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingSub } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingWith } = await supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: withdrawalsDone } = await supabase.from('withdrawals').select('amount').eq('status', 'completed');
      
      const totalPaid = withdrawalsDone?.reduce((a, b) => a + b.amount, 0) || 0;
      setAdminStats({ 
        totalUsers: usersCount || 0, 
        pendingSubmissions: pendingSub || 0, 
        pendingWithdrawals: pendingWith || 0,
        totalEarnings: totalPaid
      });
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'submissions') {
        const query = supabase.from('submissions').select('*, task:tasks(*), user:profiles(email, full_name)');
        const { data, error } = await (subFilter === 'pending' ? query.eq('status', 'pending') : query.neq('status', 'pending')).order('created_at', { ascending: false });
        if (error) throw error;
        setSubmissions(data || []);
      } else if (activeTab === 'withdrawals') {
        const { data, error } = await supabase.from('withdrawals').select('*, user:profiles(*)').order('created_at', { ascending: false });
        if (error) throw error;
        setWithdrawals(data || []);
      } else if (activeTab === 'tasks') {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setTasks(data || []);
      } else if (activeTab === 'users') {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        setUsers(data || []);
      } else if (activeTab === 'settings') {
        const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).maybeSingle();
        if (error) throw error;
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!settings) return;
    setIsUpdatingSettings(true);
    try {
      const { error } = await supabase.from('system_settings').update(settings).eq('id', 1);
      if (error) throw error;
      alert('System configuration updated successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent uppercase tracking-tight">Admin Control</h2>
          <button onClick={() => { fetchData(); fetchAdminStats(); }} className="p-2 bg-white/5 rounded-xl text-[#00f2ff] active:rotate-180 transition-transform"><RefreshCw size={20} /></button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           <div className="glass-dark border-white/5 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Users</p>
              <p className="text-xl font-black text-white">{adminStats.totalUsers}</p>
           </div>
           <div className="glass-dark border-amber-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Tasks</p>
              <p className="text-xl font-black text-amber-500">{adminStats.pendingSubmissions}</p>
           </div>
           <div className="glass-dark border-emerald-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Withdrawals</p>
              <p className="text-xl font-black text-emerald-500">{adminStats.pendingWithdrawals}</p>
           </div>
           <div className="glass-dark border-blue-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-xl font-black text-blue-500">৳{adminStats.totalEarnings}</p>
           </div>
        </div>
        
        <div className="flex gap-2 glass-dark rounded-2xl p-2 overflow-x-auto scrollbar-hide border-white/5">
          {(['submissions', 'withdrawals', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeTab === tab ? 'bg-gradient-primary text-slate-950 shadow-lg shadow-[#00f2ff]/20' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00f2ff]" /></div>
      ) : (
        <>
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setSubFilter('pending')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${subFilter === 'pending' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>Unprocessed</button>
                <button onClick={() => setSubFilter('processed')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${subFilter === 'processed' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>History</button>
              </div>
              {submissions.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl"><p className="text-xs text-slate-500 italic">No submissions found.</p></div>
              ) : (
                submissions.map(sub => (
                  <GlassCard key={sub.id} className="space-y-4 border-white/5">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00f2ff]"><FileText size={20} /></div>
                         <div>
                            <p className="text-sm font-black text-white">{sub.task?.title}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">User: {(sub as any).user?.full_name || 'Anonymous'}</p>
                         </div>
                      </div>
                      <span className="text-emerald-400 font-black text-lg">৳{sub.task?.reward_amount}</span>
                    </div>
                    <div className="bg-black/60 p-3 rounded-2xl border border-white/5 overflow-hidden">
                       {sub.task?.proof_type === 'image' ? (
                          <a href={sub.proof_data} target="_blank" rel="noreferrer"><img src={sub.proof_data} className="w-full max-h-60 object-contain rounded-xl" /></a>
                       ) : <p className="text-xs text-slate-300 font-mono break-all">{sub.proof_data}</p>}
                    </div>
                    {sub.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={async () => {
                           const { error } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', sub.id);
                           if (!error) {
                             const { data: p } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
                             await supabase.from('profiles').update({ balance: (p?.balance || 0) + (sub.task?.reward_amount || 0) }).eq('id', sub.user_id);
                             await supabase.from('transactions').insert({ user_id: sub.user_id, amount: sub.task?.reward_amount, type: 'earning', description: `Approved: ${sub.task?.title}` });
                             fetchData(); fetchAdminStats();
                           }
                         }} className="py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase">APPROVE</button>
                         <button onClick={async () => {
                           await supabase.from('submissions').update({ status: 'rejected' }).eq('id', sub.id);
                           fetchData(); fetchAdminStats();
                         }} className="py-3 bg-red-500/10 text-red-400 rounded-xl font-black text-[10px] uppercase">REJECT</button>
                      </div>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
               <GlassCard className="space-y-6 border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                     <Wrench className="text-[#00f2ff]" size={20} />
                     <h3 className="text-sm font-black uppercase text-white">System Configuration</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Min Withdrawal (৳)</label>
                      <input type="number" value={settings.min_withdrawal} onChange={e => setSettings({...settings, min_withdrawal: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#00f2ff]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activation Fee (৳)</label>
                      <input type="number" value={settings.activation_fee} onChange={e => setSettings({...settings, activation_fee: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#00f2ff]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Reward (৳)</label>
                      <input type="number" value={settings.referral_reward} onChange={e => setSettings({...settings, referral_reward: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#00f2ff]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Support URL</label>
                    <input type="text" value={settings.support_url} onChange={e => setSettings({...settings, support_url: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#00f2ff]" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                     <div>
                        <p className="text-sm font-bold text-white">Maintenance Mode</p>
                        <p className="text-[10px] text-slate-500 uppercase">Lock app for non-admin users</p>
                     </div>
                     <button onClick={() => setSettings({...settings, is_maintenance: !settings.is_maintenance})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.is_maintenance ? 'bg-red-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.is_maintenance ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                     <div>
                        <p className="text-sm font-bold text-white">Require Activation</p>
                        <p className="text-[10px] text-slate-500 uppercase">Users must pay fee to withdraw</p>
                     </div>
                     <button onClick={() => setSettings({...settings, require_activation: !settings.require_activation})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.require_activation ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.require_activation ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
               </GlassCard>

               <GlassCard className="space-y-4 border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                     <Megaphone className="text-[#00f2ff]" size={20} />
                     <h3 className="text-sm font-black uppercase text-white">Notice Board</h3>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticker Message</label>
                     <input type="text" value={settings.notice_text || ''} onChange={e => setSettings({...settings, notice_text: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#00f2ff]" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Notice (HTML)</label>
                     <textarea value={settings.global_notice || ''} onChange={e => setSettings({...settings, global_notice: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-xs font-mono h-32 focus:border-[#00f2ff] outline-none" />
                  </div>
               </GlassCard>

               <button disabled={isUpdatingSettings} onClick={handleUpdateSettings} className="w-full py-5 bg-gradient-primary rounded-2xl text-slate-950 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-[#00f2ff]/20 active:scale-[0.98] transition-all">
                 {isUpdatingSettings ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                 SAVE SYSTEM CHANGES
               </button>
            </div>
          )}

          {activeTab === 'users' && (
             <div className="space-y-4">
                <div className="relative mb-6">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                   <input type="text" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#00f2ff] outline-none" placeholder="Search users by name or email..." />
                </div>
                {users.map(u => (
                  <GlassCard key={u.id} className="flex justify-between items-center border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[#00f2ff] font-black border border-white/5">{u.email[0].toUpperCase()}</div>
                        <div>
                           <p className="font-bold text-sm text-white">{u.full_name}</p>
                           <p className="text-[10px] text-slate-500 font-black uppercase">Balance: ৳{u.balance} • Ref: {u.referral_count}</p>
                        </div>
                     </div>
                     <button onClick={() => alert('User details modal coming soon')} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"><Eye size={18} /></button>
                  </GlassCard>
                ))}
             </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

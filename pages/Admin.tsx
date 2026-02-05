
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
import { Submission, Task, Profile, SystemSettings, Withdrawal } from '../types.ts';

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

  const handleAddTask = async () => {
    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) throw error;
      alert('Task added successfully!');
      setShowAddTask(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    fetchData();
  };

  const handleUpdateSettings = async () => {
    if (!settings) return;
    setIsUpdatingSettings(true);
    try {
      const { error } = await supabase.from('system_settings').update(settings).eq('id', 1);
      if (error) throw error;
      alert('Settings updated!');
    } catch (e: any) { alert(e.message); }
    finally { setIsUpdatingSettings(false); }
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent uppercase">Admin Pannel</h2>
          <button onClick={() => fetchData()} className="p-2 bg-white/5 rounded-xl text-[#00f2ff]"><RefreshCw size={20} /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           <div className="glass-dark border-white/5 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Users</p>
              <p className="text-xl font-black text-white">{adminStats.totalUsers}</p>
           </div>
           <div className="glass-dark border-amber-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Subs</p>
              <p className="text-xl font-black text-amber-500">{adminStats.pendingSubmissions}</p>
           </div>
           <div className="glass-dark border-emerald-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Pending With</p>
              <p className="text-xl font-black text-emerald-500">{adminStats.pendingWithdrawals}</p>
           </div>
           <div className="glass-dark border-blue-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Paid Out</p>
              <p className="text-xl font-black text-blue-500">৳{adminStats.totalEarnings}</p>
           </div>
        </div>
        
        <div className="flex gap-2 glass-dark rounded-2xl p-2 overflow-x-auto border-white/5">
          {(['submissions', 'withdrawals', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all ${activeTab === tab ? 'bg-gradient-primary text-slate-950 shadow-lg' : 'text-slate-500'}`}>
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
                <button onClick={() => setSubFilter('pending')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl ${subFilter === 'pending' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>Pending</button>
                <button onClick={() => setSubFilter('processed')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl ${subFilter === 'processed' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>History</button>
              </div>
              {submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-white">{sub.task?.title}</p>
                      <p className="text-[10px] text-slate-500">By: {(sub as any).user?.full_name}</p>
                    </div>
                    <span className="text-emerald-400 font-black">৳{sub.task?.reward_amount}</span>
                  </div>
                  <div className="bg-black/40 rounded-xl overflow-hidden">
                    <img src={sub.proof_data} className="w-full max-h-48 object-contain" />
                  </div>
                  {sub.status === 'pending' && (
                    <div className="flex gap-2">
                       <button onClick={async () => {
                         const { error } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', sub.id);
                         if (!error) {
                            const { data: p } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
                            await supabase.from('profiles').update({ balance: (p?.balance || 0) + (sub.task?.reward_amount || 0) }).eq('id', sub.user_id);
                            await supabase.from('transactions').insert({ user_id: sub.user_id, amount: sub.task?.reward_amount, type: 'earning', description: `Task approved: ${sub.task?.title}` });
                            fetchData();
                         }
                       }} className="flex-1 py-2 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-lg">APPROVE</button>
                       <button onClick={async () => {
                         await supabase.from('submissions').update({ status: 'rejected' }).eq('id', sub.id);
                         fetchData();
                       }} className="flex-1 py-2 bg-red-500/20 text-red-400 font-black text-[10px] rounded-lg">REJECT</button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <button onClick={() => setShowAddTask(true)} className="w-full py-3 bg-gradient-primary text-slate-950 font-black rounded-xl text-xs uppercase">+ Create New Task</button>
              {tasks.map(t => (
                <GlassCard key={t.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">{t.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{t.category} • ৳{t.reward_amount}</p>
                  </div>
                  <button onClick={() => handleDeleteTask(t.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                </GlassCard>
              ))}
              
              {showAddTask && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
                  <div className="glass w-full max-w-md p-6 rounded-[2rem] space-y-4">
                    <div className="flex justify-between">
                       <h3 className="font-black text-white">Add New Task</h3>
                       <button onClick={() => setShowAddTask(false)}><X /></button>
                    </div>
                    <input placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-900 p-4 rounded-xl text-sm border border-white/5 outline-none" />
                    <textarea placeholder="Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-slate-900 p-4 rounded-xl text-sm border border-white/5 outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                       <input placeholder="Reward (৳)" type="number" value={newTask.reward_amount} onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})} className="bg-slate-900 p-4 rounded-xl text-sm border border-white/5 outline-none" />
                       <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as any})} className="bg-slate-900 p-4 rounded-xl text-sm border border-white/5 outline-none">
                          <option value="facebook">Facebook</option>
                          <option value="youtube">YouTube</option>
                          <option value="tiktok">TikTok</option>
                       </select>
                    </div>
                    <input placeholder="Task Link" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-slate-900 p-4 rounded-xl text-sm border border-white/5 outline-none" />
                    <button onClick={handleAddTask} className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-xl">SAVE TASK</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
               <GlassCard className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Wrench size={18} className="text-[#00f2ff]" />
                     <h3 className="text-sm font-black uppercase">System Config</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase">Min Withdraw</label>
                      <input type="number" value={settings.min_withdrawal} onChange={e => setSettings({...settings, min_withdrawal: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-sm outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase">Activation Fee</label>
                      <input type="number" value={settings.activation_fee} onChange={e => setSettings({...settings, activation_fee: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-sm outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase">Ref Bonus</label>
                      <input type="number" value={settings.referral_reward} onChange={e => setSettings({...settings, referral_reward: parseFloat(e.target.value)})} className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase">Ticker Notice</label>
                      <input value={settings.notice_text} onChange={e => setSettings({...settings, notice_text: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-sm outline-none" />
                  </div>
                  <button disabled={isUpdatingSettings} onClick={handleUpdateSettings} className="w-full py-4 bg-gradient-primary rounded-xl text-slate-950 font-black text-sm uppercase">
                    {isUpdatingSettings ? 'Saving...' : 'SAVE SETTINGS'}
                  </button>
               </GlassCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

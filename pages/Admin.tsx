
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, 
  Trash2, Edit, Loader2, Eye, Plus, ExternalLink, 
  History as HistoryIcon, Filter, Zap, UserX, UserCheck, Coins, Search, AlertTriangle,
  Settings as SettingsIcon, Save, Megaphone, FileText, Wrench, ToggleRight, X, LayoutGrid, Link as LinkIcon,
  ChevronRight, ArrowUpRight, Ban, Unlock, UserCircle, Wallet, MessageCircle, RefreshCw, Star, TrendingUp
} from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType, SubmissionStatus, Activation, SystemSettings, Withdrawal } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'activations' | 'withdrawals' | 'tasks' | 'users' | 'settings'>('submissions');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
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
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
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

  const handleToggleFeature = async (task: Task) => {
    try {
      const { error } = await supabase.from('tasks').update({ is_featured: !task.is_featured }).eq('id', task.id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_featured: !t.is_featured } : t));
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent uppercase tracking-tight">System Control</h2>
          <button onClick={() => { fetchData(); fetchAdminStats(); }} className="p-2 bg-white/5 rounded-xl text-[#00f2ff] active:rotate-180 transition-transform"><RefreshCw size={20} /></button>
        </div>

        {/* Admin Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           <div className="glass-dark border-white/5 p-3 rounded-2xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Users</p>
              <p className="text-lg font-black text-white">{adminStats.totalUsers}</p>
           </div>
           <div className="glass-dark border-amber-500/20 p-3 rounded-2xl">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Pending Work</p>
              <p className="text-lg font-black text-amber-500">{adminStats.pendingSubmissions}</p>
           </div>
           <div className="glass-dark border-emerald-500/20 p-3 rounded-2xl">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Pending Payouts</p>
              <p className="text-lg font-black text-emerald-500">{adminStats.pendingWithdrawals}</p>
           </div>
           <div className="glass-dark border-blue-500/20 p-3 rounded-2xl">
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Paid Out</p>
              <p className="text-lg font-black text-blue-500">৳{adminStats.totalEarnings}</p>
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
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.task?.category === 'facebook' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-[#00f2ff]/10 text-[#00f2ff]'}`}><FileText size={20} /></div>
                         <div>
                            <p className="text-sm font-black text-white">{sub.task?.title}</p>
                            <p className="text-[10px] text-slate-500 font-black uppercase">User: {(sub as any).user?.full_name || 'Anonymous'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-black text-lg">৳{sub.task?.reward_amount}</span>
                        <p className="text-[8px] text-slate-600 font-black uppercase">{new Date(sub.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-black/60 p-3 rounded-2xl border border-white/5 overflow-hidden">
                       {sub.task?.proof_type === 'image' ? (
                          <a href={sub.proof_data} target="_blank" rel="noreferrer" className="block relative group">
                             <img src={sub.proof_data} className="w-full max-h-60 object-contain rounded-xl border border-white/5 group-hover:opacity-80 transition-opacity" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"><ExternalLink size={24} className="text-white" /></div>
                          </a>
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
                         }} className="py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/10 active:scale-95 transition-all">APPROVE</button>
                         <button onClick={async () => {
                           await supabase.from('submissions').update({ status: 'rejected' }).eq('id', sub.id);
                           fetchData(); fetchAdminStats();
                         }} className="py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all">REJECT</button>
                      </div>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
               <button onClick={() => setShowAddTask(true)} className="w-full py-4 bg-gradient-primary text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00f2ff]/20">+ CREATE NEW WORK</button>
               {tasks.map(t => (
                 <GlassCard key={t.id} className="flex justify-between items-center border-white/5">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.category === 'facebook' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 'bg-white/5 text-slate-500'}`}><Zap size={18} /></div>
                       <div>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-sm text-white">{t.title}</p>
                             {t.is_featured && <Star size={10} className="text-amber-500 fill-current" />}
                          </div>
                          <p className="text-[9px] text-slate-500 font-black uppercase">{t.category} • Reward: ৳{t.reward_amount}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleToggleFeature(t)} className={`p-2 rounded-xl transition-all ${t.is_featured ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-500'}`} title="Feature Task"><Star size={16} /></button>
                       <button onClick={async () => { if(confirm('Delete mission?')) { await supabase.from('tasks').delete().eq('id', t.id); fetchData(); } }} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                    </div>
                 </GlassCard>
               ))}
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
               <GlassCard className="space-y-4 border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                     <TrendingUp className="text-amber-500" size={18} />
                     <h3 className="text-xs font-black uppercase text-slate-300">Monetization: Ad Banners</h3>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase">Banner HTML/JS Code</label>
                     <textarea value={settings.banner_ads_code || ''} onChange={e => setSettings({...settings, banner_ads_code: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#00f2ff] h-40 text-blue-300" placeholder="Paste your ad networks script code here..." />
                  </div>
               </GlassCard>
               <GlassCard className="space-y-4 border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                     <Megaphone className="text-[#00f2ff]" size={18} />
                     <h3 className="text-xs font-black uppercase text-slate-300">Announcements</h3>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase">Ticker Message</label>
                     <input type="text" value={settings.notice_text || ''} onChange={e => setSettings({...settings, notice_text: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[#00f2ff]" />
                  </div>
               </GlassCard>
               <button onClick={async () => {
                 await supabase.from('system_settings').update(settings).eq('id', 1);
                 alert('Settings deployed successfully!');
               }} className="w-full py-5 bg-gradient-primary rounded-2xl text-slate-950 font-black text-sm uppercase tracking-widest shadow-2xl shadow-[#00f2ff]/20 active:scale-[0.98] transition-all">DEPLOY SYSTEM CHANGES</button>
            </div>
          )}
        </>
      )}

      {/* Mission Creation Overlay */}
      {showAddTask && (
         <div className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="glass w-full max-w-lg rounded-[2.5rem] border-white/10 p-8 space-y-6 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white">Publish Mission</h3>
                  <button onClick={() => setShowAddTask(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-500">✕</button>
               </div>
               <div className="space-y-4">
                  <input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm" placeholder="Title (e.g., Post on FB Wall)" />
                  <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-sm h-24" placeholder="Instructions for the user..." />
                  <div className="grid grid-cols-2 gap-4">
                    <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as TaskCategory})} className="bg-black/60 border border-white/5 rounded-2xl p-4 text-xs font-black uppercase text-slate-400">
                       <option value="facebook">Facebook</option>
                       <option value="youtube">YouTube</option>
                       <option value="tiktok">TikTok</option>
                       <option value="other">Other/Web</option>
                    </select>
                    <input type="number" value={newTask.reward_amount} onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})} className="bg-black/60 border border-white/5 rounded-2xl p-4 text-sm" placeholder="Reward (৳)" />
                  </div>
                  <input value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-xs font-mono" placeholder="Target Link (https://...)" />
                  <textarea value={newTask.copy_text} onChange={e => setNewTask({...newTask, copy_text: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-xs" placeholder="Post Caption (Optional)" />
                  <div className="flex items-center gap-3 px-2">
                     <input type="checkbox" checked={newTask.is_featured} onChange={e => setNewTask({...newTask, is_featured: e.target.checked})} id="feat" className="w-4 h-4 accent-[#00f2ff]" />
                     <label htmlFor="feat" className="text-[10px] font-black uppercase text-amber-500 tracking-widest cursor-pointer">Mark as Featured (Ad)</label>
                  </div>
               </div>
               <button onClick={async () => {
                 await supabase.from('tasks').insert(newTask);
                 setShowAddTask(false);
                 fetchData();
               }} className="w-full py-5 bg-gradient-primary text-slate-950 font-black rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-[#00f2ff]/20">PUBLISH TO USERS</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default Admin;

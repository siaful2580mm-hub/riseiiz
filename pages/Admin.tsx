
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Clock, CheckCircle, Trash2, Loader2, Plus, 
  RefreshCw, Wrench, X, Star, DollarSign, Wallet, FileText, Search, 
  UserX, UserCheck, Zap, Globe, MessageCircle, AlertTriangle
} from 'lucide-react';
import { Submission, Task, Profile, SystemSettings, Withdrawal, Activation } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'withdrawals' | 'activations' | 'tasks' | 'users' | 'settings' | 'kyc'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [kycRequests, setKycRequests] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, pendingSub: 0, pendingWithdraw: 0, totalPaid: 0, pendingActivations: 0 });
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '', description: '', category: 'facebook', reward_amount: 10, link: '', proof_type: 'image', is_active: true, is_featured: false, copy_text: '', image_url: ''
  });

  useEffect(() => {
    fetchData();
    fetchAdminStats();
  }, [activeTab]);

  const fetchAdminStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingSub } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingWith } = await supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingAct } = await supabase.from('activations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: withdrawalsDone } = await supabase.from('withdrawals').select('amount').eq('status', 'completed');
      
      const totalPaid = withdrawalsDone?.reduce((a, b) => a + (b.amount || 0), 0) || 0;
      setAdminStats({ 
        totalUsers: usersCount || 0, 
        pendingSub: pendingSub || 0, 
        pendingWithdraw: pendingWith || 0,
        pendingActivations: pendingAct || 0,
        totalPaid
      });
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'submissions') {
        const { data } = await supabase.from('submissions').select('*, task:tasks(*), user:profiles(email, full_name)').order('created_at', { ascending: false });
        setSubmissions(data || []);
      } else if (activeTab === 'withdrawals') {
        const { data } = await supabase.from('withdrawals').select('*, user:profiles(*)').order('created_at', { ascending: false });
        setWithdrawals(data || []);
      } else if (activeTab === 'activations') {
        const { data } = await supabase.from('activations').select('*, user:profiles(*)').order('created_at', { ascending: false });
        setActivations(data || []);
      } else if (activeTab === 'tasks') {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        setTasks(data || []);
      } else if (activeTab === 'users') {
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (searchUser) {
          query = query.ilike('email', `%${searchUser}%`);
        }
        const { data } = await query.limit(50);
        setUsers(data || []);
      } else if (activeTab === 'kyc') {
        const { data } = await supabase.from('profiles').select('*').eq('kyc_status', 'pending');
        setKycRequests(data || []);
      } else if (activeTab === 'settings') {
        const { data } = await supabase.from('system_settings').select('*').eq('id', 1).maybeSingle();
        setSettings(data);
      }
    } catch (err: any) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleUpdateActivation = async (act: Activation, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('activations').update({ status }).eq('id', act.id);
      if (error) throw error;

      if (status === 'approved') {
        await supabase.from('profiles').update({ is_active: true }).eq('id', act.user_id);
      }
      
      alert(`Activation ${status}!`);
      fetchData();
      fetchAdminStats();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddTask = async () => {
    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) throw error;
      alert('Task added successfully!');
      setShowAddTask(false);
      setNewTask({ title: '', description: '', category: 'facebook', reward_amount: 10, link: '', proof_type: 'image', is_active: true, is_featured: false, copy_text: '', image_url: '' });
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateSubmission = async (sub: Submission, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('submissions').update({ status }).eq('id', sub.id);
      if (error) throw error;

      if (status === 'approved') {
        const { data: p } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
        await supabase.from('profiles').update({ balance: (p?.balance || 0) + (sub.task?.reward_amount || 0) }).eq('id', sub.user_id);
        await supabase.from('transactions').insert({ user_id: sub.user_id, amount: sub.task?.reward_amount, type: 'earning', description: `Task approved: ${sub.task?.title}` });
      }
      fetchData();
      fetchAdminStats();
    } catch (e: any) { alert(e.message); }
  };

  const handleWithdrawal = async (w: Withdrawal, status: 'completed' | 'rejected') => {
    try {
      await supabase.from('withdrawals').update({ status }).eq('id', w.id);
      if (status === 'rejected') {
        const { data: p } = await supabase.from('profiles').select('balance').eq('id', w.user_id).single();
        await supabase.from('profiles').update({ balance: (p?.balance || 0) + w.amount }).eq('id', w.user_id);
      }
      fetchData();
      fetchAdminStats();
    } catch (e: any) { alert(e.message); }
  };

  const toggleUserBan = async (user: Profile) => {
    try {
      await supabase.from('profiles').update({ is_banned: !user.is_banned }).eq('id', user.id);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const deleteUser = async (user: Profile) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete user ${user.email}? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      alert('User profile deleted.');
      fetchData();
      fetchAdminStats();
    } catch (e: any) { alert(e.message); }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      const { error } = await supabase.from('system_settings').update(settings).eq('id', 1);
      if (error) throw error;
      alert('Global Settings Updated!');
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent">Pannel Dashboard</h2>
          <button onClick={() => fetchData()} className="p-2 bg-white/5 rounded-xl text-[#00f2ff]"><RefreshCw size={20} /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
           <div className="glass-dark border-white/5 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
              <p className="text-xl font-black text-white">{adminStats.totalUsers}</p>
           </div>
           <div className="glass-dark border-amber-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Sub</p>
              <p className="text-xl font-black text-amber-500">{adminStats.pendingSub}</p>
           </div>
           <div className="glass-dark border-emerald-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Activations</p>
              <p className="text-xl font-black text-emerald-500">{adminStats.pendingActivations}</p>
           </div>
           <div className="glass-dark border-emerald-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Pending With</p>
              <p className="text-xl font-black text-emerald-500">{adminStats.pendingWithdraw}</p>
           </div>
           <div className="glass-dark border-blue-500/20 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-xl font-black text-blue-500">৳{adminStats.totalPaid}</p>
           </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
          {(['submissions', 'activations', 'withdrawals', 'kyc', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gradient-primary text-slate-950 shadow-lg shadow-[#00f2ff]/20' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
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
              {submissions.length === 0 ? <p className="text-center py-10 text-slate-500">No submissions found.</p> :
              submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-white">{sub.task?.title}</p>
                      <p className="text-[10px] text-slate-500">{(sub as any).user?.full_name} ({(sub as any).user?.email})</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                        sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 
                        sub.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>{sub.status}</span>
                  </div>
                  {sub.proof_data && (
                    <div className="bg-black/40 rounded-xl overflow-hidden min-h-[100px] flex items-center justify-center border border-white/5">
                       {sub.proof_data.startsWith('http') ? <img src={sub.proof_data} className="w-full max-h-60 object-contain" /> : <p className="p-4 text-xs font-mono break-all text-slate-400">{sub.proof_data}</p>}
                    </div>
                  )}
                  {sub.status === 'pending' && (
                    <div className="flex gap-2">
                       <button onClick={() => handleUpdateSubmission(sub, 'approved')} className="flex-1 py-3 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition-all">APPROVE</button>
                       <button onClick={() => handleUpdateSubmission(sub, 'rejected')} className="flex-1 py-3 bg-red-500/20 text-red-400 font-black text-[10px] rounded-xl active:scale-95 transition-all">REJECT</button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'activations' && (
            <div className="space-y-4">
              {activations.length === 0 ? <p className="text-center py-10 text-slate-500">No activation requests.</p> :
              activations.map(act => (
                <GlassCard key={act.id} className="space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-[#00f2ff] uppercase tracking-widest">TrxID: {act.transaction_id}</p>
                        <p className="text-sm font-bold text-white mt-1">Method: {act.method}</p>
                        <p className="text-[10px] text-slate-400">User: {act.user?.full_name} ({act.user?.email})</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${act.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{act.status}</span>
                   </div>
                   {act.status === 'pending' && (
                     <div className="flex gap-2">
                       <button onClick={() => handleUpdateActivation(act, 'approved')} className="flex-1 py-3 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-xl">APPROVE</button>
                       <button onClick={() => handleUpdateActivation(act, 'rejected')} className="flex-1 py-3 bg-red-500/20 text-red-400 font-black text-[10px] rounded-xl">REJECT</button>
                     </div>
                   )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {withdrawals.length === 0 ? <p className="text-center py-10 text-slate-500">No withdrawals found.</p> :
              withdrawals.map(w => (
                <GlassCard key={w.id} className="space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-base font-black text-white">৳{w.amount}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{w.method} • {w.wallet_number}</p>
                        <p className="text-[10px] text-blue-400 font-bold mt-1">User: {w.user?.full_name} ({w.user?.email})</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{w.status}</span>
                   </div>
                   {w.status === 'pending' && (
                     <div className="flex gap-2">
                       <button onClick={() => handleWithdrawal(w, 'completed')} className="flex-1 py-3 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-xl">MARK AS PAID</button>
                       <button onClick={() => handleWithdrawal(w, 'rejected')} className="flex-1 py-3 bg-red-500/20 text-red-400 font-black text-[10px] rounded-xl">REJECT</button>
                     </div>
                   )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input 
                   type="text" 
                   value={searchUser} 
                   onChange={e => setSearchUser(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && fetchData()}
                   placeholder="Search by email..." 
                   className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#00f2ff]/50 outline-none" 
                 />
              </div>
              {users.map(u => (
                <GlassCard key={u.id} className="flex flex-col gap-4 border-white/5">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${u.is_banned ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                           {u.is_banned ? <UserX size={20} /> : u.email[0].toUpperCase()}
                         </div>
                         <div>
                            <p className="font-bold text-sm">{u.full_name || 'No Name'}</p>
                            <p className="text-[10px] text-slate-500">{u.email}</p>
                            <div className="flex gap-2 mt-1">
                               {u.is_active ? <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-black">ACTIVE</span> : <span className="text-[8px] bg-slate-500/10 text-slate-500 px-1.5 py-0.5 rounded font-black">UNACTIVATED</span>}
                               {u.kyc_status === 'verified' && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-black">KYC OK</span>}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-emerald-400">৳{u.balance}</p>
                         <p className="text-[10px] text-slate-500">Refs: {u.referral_count}</p>
                      </div>
                   </div>
                   
                   <div className="flex gap-2 pt-2 border-t border-white/5">
                      <button 
                        onClick={() => toggleUserBan(u)} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${u.is_banned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}
                      >
                         {u.is_banned ? <><UserCheck size={14} /> UNBAN</> : <><UserX size={14} /> BAN</>}
                      </button>
                      <button 
                        onClick={() => deleteUser(u)} 
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase transition-all"
                      >
                         <Trash2 size={14} /> DELETE
                      </button>
                   </div>
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <button onClick={() => setShowAddTask(true)} className="w-full py-4 bg-gradient-primary text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-[#00f2ff]/20">+ Create New Mission</button>
              {tasks.length === 0 ? <p className="text-center py-10 text-slate-500">No tasks created.</p> :
              tasks.map(t => (
                <GlassCard key={t.id} className="flex justify-between items-center border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00f2ff]">
                        {t.is_featured ? <Star size={18} fill="currentColor" /> : <FileText size={18} />}
                     </div>
                     <div>
                       <p className="font-bold text-sm">{t.title}</p>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t.category} • ৳{t.reward_amount}</p>
                     </div>
                  </div>
                  <button onClick={async () => { if(confirm('Delete this task?')) { await supabase.from('tasks').delete().eq('id', t.id); fetchData(); } }} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all">
                    <Trash2 size={18} />
                  </button>
                </GlassCard>
              ))}
              {showAddTask && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
                  <div className="glass w-full max-w-md p-8 rounded-[2.5rem] space-y-4 overflow-y-auto max-h-[90vh] border-white/10 shadow-3xl">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-black text-xl text-white uppercase tracking-tighter">New Mission</h3>
                       <button onClick={() => setShowAddTask(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                          <X size={20} />
                       </button>
                    </div>
                    <div className="space-y-3">
                       <input placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-[#00f2ff]/30" />
                       <textarea placeholder="Step Instructions" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-[#00f2ff]/30 h-24" />
                       <div className="grid grid-cols-2 gap-3">
                          <input placeholder="Reward (৳)" type="number" value={newTask.reward_amount} onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})} className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-[#00f2ff]/30" />
                          <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as any})} className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-[#00f2ff]/30">
                             <option value="facebook">Facebook</option>
                             <option value="youtube">YouTube</option>
                             <option value="tiktok">TikTok</option>
                             <option value="other">Other</option>
                          </select>
                       </div>
                       <input placeholder="Target Link (Optional)" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm outline-none" />
                       <input placeholder="Asset Image URL (Optional)" value={newTask.image_url} onChange={e => setNewTask({...newTask, image_url: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-sm outline-none" />
                       <div className="flex items-center gap-2 p-2">
                          <input type="checkbox" id="feat" checked={newTask.is_featured} onChange={e => setNewTask({...newTask, is_featured: e.target.checked})} className="w-4 h-4 accent-[#00f2ff]" />
                          <label htmlFor="feat" className="text-xs text-slate-400 font-bold uppercase tracking-widest">Featured Mission</label>
                       </div>
                    </div>
                    <button onClick={handleAddTask} className="w-full py-5 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">SAVE MISSION</button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
               <GlassCard className="space-y-6 border-white/5">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4"><Wrench size={24} className="text-[#00f2ff]" /><h3 className="text-lg font-black uppercase tracking-tighter">System Configuration</h3></div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Toggles */}
                    <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Switches</h4>
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> <span className="text-xs font-bold">Maintenance Mode</span></div>
                          <input type="checkbox" checked={settings.is_maintenance} onChange={e => setSettings({...settings, is_maintenance: e.target.checked})} className="w-10 h-5 accent-amber-500" />
                       </div>
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2"><Zap size={14} className="text-[#00f2ff]" /> <span className="text-xs font-bold">Require Activation</span></div>
                          <input type="checkbox" checked={settings.require_activation} onChange={e => setSettings({...settings, require_activation: e.target.checked})} className="w-10 h-5 accent-[#00f2ff]" />
                       </div>
                    </div>

                    {/* Monetary Inputs */}
                    <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Financials</h4>
                       <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-[8px] text-slate-500 font-black uppercase mb-1 block">Min Withdraw (৳)</label>
                            <input type="number" value={settings.min_withdrawal} onChange={e => setSettings({...settings, min_withdrawal: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs outline-none" />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 font-black uppercase mb-1 block">Activation Fee (৳)</label>
                            <input type="number" value={settings.activation_fee} onChange={e => setSettings({...settings, activation_fee: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs outline-none" />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 font-black uppercase mb-1 block">Ref Bonus (৳)</label>
                            <input type="number" value={settings.referral_reward} onChange={e => setSettings({...settings, referral_reward: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs outline-none" />
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Text/Links */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Communication</h4>
                     <div><label className="text-[8px] text-slate-500 font-black uppercase mb-1 block">Support URL (Telegram/WA)</label><div className="relative"><MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={settings.support_url} onChange={e => setSettings({...settings, support_url: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-xs outline-none" /></div></div>
                     <div><label className="text-[8px] text-slate-500 font-black uppercase mb-1 block">Ticker Message</label><input value={settings.notice_text} onChange={e => setSettings({...settings, notice_text: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs outline-none" /></div>
                     <div><label className="text-[8px] text-slate-500 font-black uppercase mb-1 block">Global Notice (HTML Supported)</label><textarea value={settings.global_notice} onChange={e => setSettings({...settings, global_notice: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs outline-none h-32 font-mono" /></div>
                  </div>

                  <button onClick={saveSettings} className="w-full py-5 bg-gradient-primary rounded-2xl text-slate-950 font-black text-sm uppercase tracking-widest shadow-xl shadow-[#00f2ff]/20 active:scale-[0.98] transition-all">SAVE ALL CHANGES</button>
               </GlassCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

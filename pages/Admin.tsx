
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, 
  Trash2, Edit, Loader2, Eye, Plus, ExternalLink, 
  History as HistoryIcon, Filter, Zap, UserX, UserCheck, Coins, Search, AlertTriangle,
  Settings as SettingsIcon, Save, Megaphone, FileText, Wrench, ToggleRight, X, LayoutGrid, Link as LinkIcon,
  ChevronRight, ArrowUpRight, Ban, Unlock, UserCircle
} from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType, SubmissionStatus, Activation, SystemSettings } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'activations' | 'tasks' | 'users' | 'settings'>('submissions');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [balanceChange, setBalanceChange] = useState<string>('');
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'youtube',
    reward_amount: 5,
    link: '',
    proof_type: 'image',
    is_active: true
  });

  // User Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, subFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'submissions') {
        let query = supabase
          .from('submissions')
          .select('*, task:tasks(*), user:profiles(email, full_name)');
        
        if (subFilter === 'pending') {
          query = query.eq('status', 'pending');
        } else {
          query = query.neq('status', 'pending');
        }

        const { data } = await query.order('created_at', { ascending: false });
        setSubmissions(data || []);
      } else if (activeTab === 'tasks') {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        setTasks(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'activations') {
        const { data } = await supabase
          .from('activations')
          .select('*, user:profiles(email, full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setActivations(data || []);
      } else if (activeTab === 'settings') {
        const { data } = await supabase.from('system_settings').select('*').single();
        if (data) setSettings(data);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submission Processing
  const handleProcessSubmission = async (sub: Submission, status: 'approved' | 'rejected') => {
    setProcessingId(sub.id);
    try {
      const { error: subError } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', sub.id);

      if (subError) throw subError;

      if (status === 'approved' && sub.task) {
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
        if (profile) {
          await supabase.from('profiles').update({ balance: profile.balance + sub.task.reward_amount }).eq('id', sub.user_id);
          await supabase.from('transactions').insert({
            user_id: sub.user_id,
            type: 'earning',
            amount: sub.task.reward_amount,
            description: `Task Approved: ${sub.task.title}`
          });
        }
      }
      
      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Activation Processing
  const handleProcessActivation = async (act: Activation, status: 'approved' | 'rejected') => {
    setProcessingId(act.id);
    try {
      const { error } = await supabase.from('activations').update({ status }).eq('id', act.id);
      if (error) throw error;

      if (status === 'approved') {
        await supabase.from('profiles').update({ is_active: true }).eq('id', act.user_id);
      }

      setActivations(prev => prev.filter(a => a.id !== act.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // User Management
  const handleUpdateUser = async (updates: Partial<Profile>) => {
    if (!selectedUser) return;
    setProcessingId('user-update');
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', selectedUser.id);
      if (error) throw error;
      
      const updatedUser = { ...selectedUser, ...updates };
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
      alert('User updated successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceChange) return;
    const amount = parseFloat(balanceChange);
    if (isNaN(amount)) return;

    setProcessingId('balance-update');
    try {
      const newBalance = selectedUser.balance + amount;
      const { error } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', selectedUser.id);
      if (error) throw error;

      await supabase.from('transactions').insert({
        user_id: selectedUser.id,
        type: amount > 0 ? 'bonus' : 'withdraw',
        amount: Math.abs(amount),
        description: `Admin Adjustment: ${amount > 0 ? 'Added' : 'Subtracted'}`
      });

      const updatedUser = { ...selectedUser, balance: newBalance };
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
      setBalanceChange('');
      alert('Balance adjusted');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Settings Management
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setProcessingId('settings-save');
    try {
      const { error } = await supabase.from('system_settings').update(settings).eq('id', 1);
      if (error) throw error;
      alert('Settings saved successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('new-task');
    try {
      const { error } = await supabase.from('tasks').insert(newTask);
      if (error) throw error;
      alert('Task created successfully!');
      setShowAddTask(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add task');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const { error } = await supabase.from('tasks').update({ is_active: !task.is_active }).eq('id', task.id);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: !task.is_active } : t));
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ADMIN COMMAND</h2>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-400 uppercase">Live Console</span>
          </div>
        </div>
        
        <div className="flex gap-1 glass rounded-2xl p-1.5 overflow-x-auto scrollbar-hide border-white/5 shadow-2xl">
          {(['submissions', 'activations', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab ? 'bg-gradient-primary text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'submissions' && <FileText size={14} />}
              {tab === 'activations' && <Zap size={14} />}
              {tab === 'tasks' && <LayoutGrid size={14} />}
              {tab === 'users' && <Users size={14} />}
              {tab === 'settings' && <SettingsIcon size={14} />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retrieving Data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/5 p-1 rounded-2xl border border-white/5">
                 <button onClick={() => setSubFilter('pending')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${subFilter === 'pending' ? 'bg-emerald-500/20 text-emerald-400 shadow-inner' : 'text-slate-500'}`}><Clock size={14} /> Pending</button>
                 <button onClick={() => setSubFilter('processed')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all ${subFilter === 'processed' ? 'bg-emerald-500/20 text-emerald-400 shadow-inner' : 'text-slate-500'}`}><HistoryIcon size={14} /> History</button>
              </div>
              
              {submissions.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
                   <Package size={48} className="mx-auto text-slate-700 mb-2" />
                   <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No submissions found</p>
                </div>
              ) : (
                submissions.map(sub => (
                  <GlassCard key={sub.id} className="space-y-4 border-white/5 hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0"><FileText size={20} /></div>
                        <div>
                          <p className="text-sm font-black text-white">{sub.task?.title || 'Unknown Task'}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">User: {(sub as any).user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-black text-sm">৳{sub.task?.reward_amount}</span>
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{new Date(sub.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">User Proof Data:</span>
                       {sub.task?.proof_type === 'image' ? (
                         <a href={sub.proof_data} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all group relative">
                           <img src={sub.proof_data} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Proof" />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/20">
                              <Eye className="text-white" />
                           </div>
                         </a>
                       ) : (
                         <p className="text-xs text-slate-300 font-mono break-all bg-white/5 p-3 rounded-lg">{sub.proof_data}</p>
                       )}
                    </div>

                    {sub.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          disabled={processingId === sub.id}
                          onClick={() => handleProcessSubmission(sub, 'approved')}
                          className="flex items-center justify-center gap-2 py-3 bg-emerald-500 rounded-xl text-slate-950 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                        >
                          {processingId === sub.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} Approve
                        </button>
                        <button 
                          disabled={processingId === sub.id}
                          onClick={() => handleProcessSubmission(sub, 'rejected')}
                          className="flex items-center justify-center gap-2 py-3 bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {activeTab === 'activations' && (
            <div className="space-y-4">
               {activations.length === 0 ? (
                 <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
                   <Zap size={48} className="mx-auto text-slate-700 mb-2 opacity-20" />
                   <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No pending activations</p>
                 </div>
               ) : (
                 activations.map(act => (
                   <GlassCard key={act.id} className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"><Zap size={20} /></div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">Activation Req: {act.method}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{(act as any).user?.full_name} ({(act as any).user?.email})</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Transaction ID:</span>
                         <p className="text-sm font-mono font-black text-emerald-400 mt-1 select-all">{act.transaction_id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          disabled={processingId === act.id}
                          onClick={() => handleProcessActivation(act, 'approved')}
                          className="flex items-center justify-center gap-2 py-3 bg-emerald-500 rounded-xl text-slate-950 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                           {processingId === act.id ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Approve
                        </button>
                        <button 
                          disabled={processingId === act.id}
                          onClick={() => handleProcessActivation(act, 'rejected')}
                          className="flex items-center justify-center gap-2 py-3 bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                   </GlassCard>
                 ))
               )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
               <div className="flex items-center gap-2 bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-all">
                  <Search size={18} className="text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by email or name..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="bg-transparent border-none outline-none text-sm w-full font-medium text-white placeholder:text-slate-600" 
                  />
               </div>
               
               <div className="space-y-3">
                 {users.filter(u => u.email.includes(searchTerm) || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                   <div 
                    key={u.id} 
                    onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                    className="glass-dark p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group"
                   >
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-white/5 group-hover:text-emerald-400 transition-colors">
                             {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : u.email[0].toUpperCase()}
                           </div>
                           <div>
                             <p className="font-black text-sm text-slate-200">{u.full_name || 'Anonymous'}</p>
                             <div className="flex items-center gap-2">
                               <p className="text-[10px] text-slate-500">{u.email}</p>
                               {u.is_banned && <span className="bg-red-500 text-white text-[7px] px-1 rounded font-black uppercase">Banned</span>}
                               {u.role === 'admin' && <span className="bg-emerald-500 text-slate-950 text-[7px] px-1 rounded font-black uppercase">Admin</span>}
                             </div>
                           </div>
                         </div>
                         <div className="text-right flex items-center gap-4">
                           <div>
                             <p className="text-emerald-400 font-black text-base">৳{u.balance.toFixed(2)}</p>
                             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Refs: {u.referral_count}</p>
                           </div>
                           <ChevronRight size={18} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <GlassCard className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                   <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Megaphone size={20} /></div>
                   <h3 className="text-lg font-black uppercase tracking-tight">Public Communications</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dashboard Announcement Bar</label>
                  <input 
                    type="text" 
                    value={settings.notice_text || ''} 
                    onChange={e => setSettings({...settings, notice_text: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-emerald-500" 
                    placeholder="Short news text for home screen..." 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Announcement Link</label>
                  <input 
                    type="text" 
                    value={settings.notice_link || ''} 
                    onChange={e => setSettings({...settings, notice_link: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-emerald-500" 
                    placeholder="/notice or https://..." 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Global News Page (HTML Supported)</label>
                  <textarea 
                    value={settings.global_notice || ''} 
                    onChange={e => setSettings({...settings, global_notice: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 h-32 font-mono" 
                    placeholder="<h1>News</h1><p>Content...</p>" 
                  />
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassCard className="space-y-4">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Coins size={20} /></div>
                      <h3 className="text-sm font-black uppercase tracking-tight">Economy Settings</h3>
                   </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min. Withdrawal (৳)</label>
                    <input type="number" value={settings.min_withdrawal} onChange={e => setSettings({...settings, min_withdrawal: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Activation Fee (৳)</label>
                    <input type="number" value={settings.activation_fee} onChange={e => setSettings({...settings, activation_fee: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-emerald-500" />
                  </div>
                </GlassCard>

                <GlassCard className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Wrench size={20} /></div>
                      <h3 className="text-sm font-black uppercase tracking-tight">System Modes</h3>
                   </div>
                   
                   <div className="flex items-center justify-between p-2">
                      <div>
                        <p className="text-xs font-black uppercase text-white">Maintenance Mode</p>
                        <p className="text-[8px] text-slate-500 font-bold">Lock app for all non-admins</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, is_maintenance: !settings.is_maintenance})}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.is_maintenance ? 'bg-red-500' : 'bg-slate-700'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.is_maintenance ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>

                   <div className="flex items-center justify-between p-2">
                      <div>
                        <p className="text-xs font-black uppercase text-white">Require Activation</p>
                        <p className="text-[8px] text-slate-500 font-bold">New users must pay fee to withdraw</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, require_activation: !settings.require_activation})}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.require_activation ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.require_activation ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                </GlassCard>
              </div>

              <button 
                type="submit" 
                disabled={processingId === 'settings-save'}
                className="w-full py-5 bg-gradient-primary rounded-2xl text-slate-950 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {processingId === 'settings-save' ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Apply System Changes
              </button>
            </form>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <button 
                onClick={() => setShowAddTask(true)}
                className="w-full py-4 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Plus size={16} /> Create New Task
              </button>

              <div className="grid grid-cols-1 gap-3">
                {tasks.map(t => (
                  <GlassCard key={t.id} className="flex justify-between items-center border-white/5 group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        <LayoutGrid size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t.category}</span>
                          <span className="text-[9px] font-black text-emerald-400">৳{t.reward_amount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleTask(t)} className={`p-2 rounded-lg transition-all ${t.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}><ToggleRight size={18} /></button>
                      <button onClick={() => handleDeleteTask(t.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 overflow-y-auto">
           <div className="glass w-full max-w-lg rounded-[2.5rem] border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
              <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-primary p-0.5 shadow-xl">
                       <div className="w-full h-full bg-slate-900 rounded-[1.4rem] flex items-center justify-center overflow-hidden">
                          {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-slate-500" />}
                       </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{selectedUser.full_name || 'Anonymous'}</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowUserModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 text-center">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Current Balance</p>
                      <p className="text-3xl font-black text-white">৳{selectedUser.balance.toFixed(2)}</p>
                   </div>
                   <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-5 text-center">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Referrals</p>
                      <p className="text-3xl font-black text-white">{selectedUser.referral_count}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Manual Balance Adjustment</h4>
                   <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={balanceChange} 
                        onChange={e => setBalanceChange(e.target.value)} 
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-black outline-none focus:border-emerald-500 text-emerald-400" 
                        placeholder="+/- Amount" 
                      />
                      <button 
                        disabled={processingId === 'balance-update'}
                        onClick={handleAdjustBalance}
                        className="px-6 bg-gradient-primary rounded-2xl text-slate-950 font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
                      >
                         Apply
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quick Actions</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleUpdateUser({ is_banned: !selectedUser.is_banned })}
                        className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          selectedUser.is_banned ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                         {selectedUser.is_banned ? <Unlock size={14} /> : <Ban size={14} />}
                         {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                      </button>
                      <button 
                        onClick={() => handleUpdateUser({ role: selectedUser.role === 'admin' ? 'user' : 'admin' })}
                        className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          selectedUser.role === 'admin' ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                         {selectedUser.role === 'admin' ? <UserX size={14} /> : <ShieldCheck size={14} />}
                         {selectedUser.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                   </div>
                   
                   <button 
                    onClick={() => handleUpdateUser({ is_active: !selectedUser.is_active })}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                   >
                     <Zap size={14} /> {selectedUser.is_active ? 'Deactivate Account' : 'Force Activate Account'}
                   </button>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
                   <p className="text-[10px] font-bold text-slate-600 uppercase">Referral Code: <span className="text-white font-mono">{selectedUser.referral_code}</span></p>
                   <p className="text-[10px] font-bold text-slate-600 uppercase">Joined: <span className="text-white">{new Date(selectedUser.created_at).toLocaleString()}</span></p>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
           <GlassCard className="w-full max-w-lg relative animate-in zoom-in-95 duration-200 shadow-3xl">
             <button onClick={() => setShowAddTask(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>
             <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Plus className="text-emerald-400" /> Create New Reward Task</h3>
             
             <form onSubmit={handleAddTask} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Task Title</label>
                    <input type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500" placeholder="e.g. Subscribe to channel" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reward (৳)</label>
                    <input type="number" required value={newTask.reward_amount} onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instruction / Steps</label>
                  <textarea required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500 h-24 resize-none" placeholder="1. Open link... 2. Take screenshot..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Platform Category</label>
                    <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as TaskCategory})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500 appearance-none">
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="other">Other/Website</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Proof Requirement</label>
                    <select value={newTask.proof_type} onChange={e => setNewTask({...newTask, proof_type: e.target.value as ProofType})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-500 appearance-none">
                      <option value="image">Screenshot Image</option>
                      <option value="text">Username/Text</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Action Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input type="url" required value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs outline-none focus:border-emerald-500" placeholder="https://..." />
                  </div>
                </div>

                <button 
                  disabled={processingId === 'new-task'}
                  className="w-full py-5 bg-gradient-primary rounded-2xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {processingId === 'new-task' ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Save and Publish Task
                </button>
             </form>
           </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Admin;

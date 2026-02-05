
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, 
  Trash2, Edit, Loader2, Eye, Plus, ExternalLink, 
  History as HistoryIcon, Filter, Zap, UserX, UserCheck, Coins, Search, AlertTriangle,
  Settings as SettingsIcon, Save, Megaphone, FileText, Wrench, ToggleRight, X, LayoutGrid, Link as LinkIcon
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
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'youtube',
    reward_amount: 5,
    link: '',
    proof_type: 'image',
    is_active: true
  });

  // User Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editBalance, setEditBalance] = useState<string>('');

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Admin Command</h2>
        <div className="flex gap-1 glass rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {(['submissions', 'activations', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/5 p-1 rounded-xl">
                 <button onClick={() => setSubFilter('pending')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-2 ${subFilter === 'pending' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}><Clock size={14} /> Pending</button>
                 <button onClick={() => setSubFilter('processed')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-2 ${subFilter === 'processed' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500'}`}><HistoryIcon size={14} /> History</button>
              </div>
              {submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-emerald-400 font-bold uppercase">{sub.task?.title}</p>
                      <p className="text-[10px] text-slate-400">User: {(sub as any).user?.email}</p>
                    </div>
                    {subFilter === 'pending' && (
                      <div className="flex gap-2">
                        <button className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle size={18} /></button>
                        <button className="p-2 bg-red-500/20 text-red-400 rounded-lg"><XCircle size={18} /></button>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Proof:</span>
                    <p className="text-[10px] text-slate-300 break-all">{sub.proof_data}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <button 
                onClick={() => setShowAddTask(true)}
                className="w-full py-4 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Plus size={16} /> Add New Task
              </button>

              <div className="grid grid-cols-1 gap-3">
                {tasks.map(t => (
                  <GlassCard key={t.id} className="flex justify-between items-center">
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

          {activeTab === 'users' && (
            <div className="space-y-6">
               <div className="flex items-center gap-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <Search size={18} className="text-slate-500" />
                  <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs w-full font-medium" />
               </div>
               <div className="space-y-3">
                 {users.filter(u => u.email.includes(searchTerm)).map(u => (
                   <div key={u.id} className="glass-dark p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-500">{u.email[0].toUpperCase()}</div>
                           <div>
                             <p className="font-bold text-sm">{u.full_name || 'No Name'}</p>
                             <p className="text-[10px] text-slate-500">{u.email}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-emerald-400 font-black text-sm">৳{u.balance.toFixed(2)}</p>
                           <p className="text-[9px] text-slate-500 font-bold uppercase">Refs: {u.referral_count}</p>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
           <GlassCard className="w-full max-w-lg relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowAddTask(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
             <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Plus className="text-emerald-400" /> Create New Task</h3>
             
             <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Task Title</label>
                    <input type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500" placeholder="Subscribe to YouTube" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reward (৳)</label>
                    <input type="number" required value={newTask.reward_amount} onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instruction / Description</label>
                  <textarea required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500 h-20 resize-none" placeholder="Go to link, subscribe and screenshot..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as TaskCategory})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500">
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="other">Other/Website</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Proof Type</label>
                    <select value={newTask.proof_type} onChange={e => setNewTask({...newTask, proof_type: e.target.value as ProofType})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500">
                      <option value="image">Screenshot Image</option>
                      <option value="text">Username/Text</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input type="url" required value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-xs outline-none focus:border-emerald-500" placeholder="https://..." />
                  </div>
                </div>

                <button 
                  disabled={processingId === 'new-task'}
                  className="w-full py-4 bg-gradient-primary rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {processingId === 'new-task' ? <Loader2 className="animate-spin" /> : <Save size={16} />}
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

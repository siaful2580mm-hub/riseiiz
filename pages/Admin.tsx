
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, 
  Trash2, Edit, Loader2, Eye, Plus, ExternalLink, 
  History as HistoryIcon, Filter, Zap, UserX, UserCheck, Coins, Search, AlertTriangle,
  Settings as SettingsIcon, Save, Megaphone, FileText, Wrench, ToggleRight, X, LayoutGrid, Link as LinkIcon,
  ChevronRight, ArrowUpRight, Ban, Unlock, UserCircle, Wallet, MessageCircle, RefreshCw, Star
} from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType, SubmissionStatus, Activation, SystemSettings, Withdrawal } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'activations' | 'withdrawals' | 'tasks' | 'users' | 'settings'>('submissions');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [balanceChange, setBalanceChange] = useState<string>('');
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '', description: '', category: 'youtube', reward_amount: 5, link: '', proof_type: 'image', is_active: true, is_featured: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, subFilter]);

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
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent">ADMIN CONSOLE</h2>
          <button onClick={fetchData} className="p-2 bg-white/5 rounded-xl text-[#00f2ff]"><RefreshCw size={20} /></button>
        </div>
        
        <div className="flex gap-2 glass rounded-2xl p-2 overflow-x-auto scrollbar-hide border-white/5">
          {(['submissions', 'withdrawals', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase whitespace-nowrap ${activeTab === tab ? 'bg-gradient-primary text-slate-950' : 'text-slate-500'}`}>
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
              <div className="flex bg-white/5 p-1 rounded-xl">
                <button onClick={() => setSubFilter('pending')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${subFilter === 'pending' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>Pending</button>
                <button onClick={() => setSubFilter('processed')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${subFilter === 'processed' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>Processed</button>
              </div>
              {submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                       <div className="w-10 h-10 bg-[#00f2ff]/10 rounded-xl flex items-center justify-center text-[#00f2ff]"><FileText size={20} /></div>
                       <div><p className="text-sm font-black text-white">{sub.task?.title}</p><p className="text-[10px] text-slate-500 uppercase">{(sub as any).user?.email}</p></div>
                    </div>
                    <div className="text-right"><span className="text-emerald-400 font-black">৳{sub.task?.reward_amount}</span></div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 overflow-hidden">
                     {sub.task?.proof_type === 'image' ? (
                        <a href={sub.proof_data} target="_blank" rel="noreferrer"><img src={sub.proof_data} className="w-full max-h-40 object-contain rounded-lg border border-white/10" /></a>
                     ) : <p className="text-xs text-slate-300 font-mono">{sub.proof_data}</p>}
                  </div>
                  {sub.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={async () => {
                         const { error } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', sub.id);
                         if (!error) {
                           const { data: p } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
                           await supabase.from('profiles').update({ balance: (p?.balance || 0) + (sub.task?.reward_amount || 0) }).eq('id', sub.user_id);
                           await supabase.from('transactions').insert({ user_id: sub.user_id, amount: sub.task?.reward_amount, type: 'earning', description: `Task Approved: ${sub.task?.title}` });
                           fetchData();
                         }
                       }} className="py-2.5 bg-emerald-500 rounded-xl text-slate-950 font-black text-[9px] uppercase">Approve</button>
                       <button onClick={async () => {
                         await supabase.from('submissions').update({ status: 'rejected' }).eq('id', sub.id);
                         fetchData();
                       }} className="py-2.5 bg-red-500/20 text-red-400 rounded-xl font-black text-[9px] uppercase border border-red-500/20">Reject</button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
               <GlassCard className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 border-b border-white/5 pb-2">Task Ads (Banner)</h3>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-600 uppercase">Ad Script / HTML Code</label>
                     <textarea value={settings.banner_ads_code || ''} onChange={e => setSettings({...settings, banner_ads_code: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-[#00f2ff] h-32 font-mono" placeholder="Paste script code from Monetag or AdSense..." />
                  </div>
               </GlassCard>
               <GlassCard className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-500 border-b border-white/5 pb-2">Global Comms</h3>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-600 uppercase">Announcement Text</label>
                     <input type="text" value={settings.notice_text || ''} onChange={e => setSettings({...settings, notice_text: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-[#00f2ff]" />
                  </div>
               </GlassCard>
               <button onClick={async () => {
                 await supabase.from('system_settings').update(settings).eq('id', 1);
                 alert('Settings Updated!');
               }} className="w-full py-4 bg-gradient-primary rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00f2ff]/20">SAVE SYSTEM CHANGES</button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
               <button onClick={() => setShowAddTask(true)} className="w-full py-4 bg-[#00f2ff] text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest mb-4">+ CREATE NEW MISSION</button>
               {tasks.map(t => (
                 <GlassCard key={t.id} className="flex justify-between items-center border-white/5">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${t.is_featured ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-slate-500'}`}><Zap size={18} /></div>
                       <div><p className="font-bold text-sm text-white">{t.title}</p><p className="text-[9px] text-slate-500 font-black uppercase">{t.category} • ৳{t.reward_amount}</p></div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleToggleFeature(t)} className={`p-2 rounded-lg ${t.is_featured ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`} title="Feature Task"><Star size={16} /></button>
                       <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('tasks').delete().eq('id', t.id); fetchData(); } }} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                 </GlassCard>
               ))}
            </div>
          )}
        </>
      )}

      {/* Task Creation Modal */}
      {showAddTask && (
         <div className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-lg relative space-y-4">
               <button onClick={() => setShowAddTask(false)} className="absolute top-4 right-4 text-slate-500">✕</button>
               <h3 className="text-xl font-black text-white">Create Mission</h3>
               <div className="space-y-3">
                  <input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="Task Title" />
                  <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs h-20" placeholder="Instructions" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as TaskCategory})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs">
                       <option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="other">Web/Other</option>
                    </select>
                    <input type="number" value={newTask.reward_amount} onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="Reward (৳)" />
                  </div>
                  <input value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="Target Link (https://...)" />
                  <textarea value={newTask.copy_text} onChange={e => setNewTask({...newTask, copy_text: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs" placeholder="Caption to Copy (Optional)" />
                  <div className="flex items-center gap-2 px-2">
                     <input type="checkbox" checked={newTask.is_featured} onChange={e => setNewTask({...newTask, is_featured: e.target.checked})} id="feat" />
                     <label htmlFor="feat" className="text-[10px] font-black uppercase text-amber-500">Feature this task (Task Ad)</label>
                  </div>
               </div>
               <button onClick={async () => {
                 await supabase.from('tasks').insert(newTask);
                 setShowAddTask(false);
                 fetchData();
               }} className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase">PUBLISH MISSION</button>
            </GlassCard>
         </div>
      )}
    </div>
  );
};

export default Admin;

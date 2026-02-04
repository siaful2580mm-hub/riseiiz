
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, Trash2, Edit, Loader2, Eye, Plus, ExternalLink } from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'tasks' | 'users' | 'kyc'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [pendingKYC, setPendingKYC] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // Create Task Form State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'facebook' as TaskCategory,
    reward_amount: 10,
    link: '',
    proof_type: 'image' as ProofType,
    copy_text: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'submissions') {
        const { data } = await supabase
          .from('submissions')
          .select('*, task:tasks(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        setSubmissions(data || []);
      } else if (activeTab === 'tasks') {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        setTasks(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').limit(50).order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'kyc') {
        const { data } = await supabase.from('profiles').select('*').eq('kyc_status', 'pending');
        setPendingKYC(data || []);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('creating');
    try {
      const { error } = await supabase.from('tasks').insert([newTask]);
      if (error) throw error;
      alert('Task created successfully!');
      setShowTaskForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (sub: Submission) => {
    if (!sub.task) return;
    setProcessingId(sub.id);
    try {
      const { error: subErr } = await supabase.from('submissions').update({ status: 'approved' }).eq('id', sub.id);
      if (subErr) throw subErr;

      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
      const currentBalance = profile?.balance || 0;

      const { error: balErr } = await supabase
        .from('profiles')
        .update({ balance: currentBalance + sub.task.reward_amount })
        .eq('id', sub.user_id);
      if (balErr) throw balErr;

      await supabase.from('transactions').insert({
        user_id: sub.user_id,
        type: 'earning',
        amount: sub.task.reward_amount,
        description: `Approved: ${sub.task.title}`
      });

      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject this submission?')) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleKYCAction = async (userId: string, action: 'verified' | 'rejected') => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: action })
        .eq('id', userId);
      
      if (error) throw error;
      setPendingKYC(prev => prev.filter(u => u.id !== userId));
      alert(`KYC ${action === 'verified' ? 'approved' : 'rejected'}!`);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Admin Command</h2>
        <div className="flex gap-1 glass rounded-lg p-1 overflow-x-auto">
          {(['submissions', 'tasks', 'users', 'kyc'] as const).map((tab) => (
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
              <h3 className="font-bold">Pending Reviews ({submissions.length})</h3>
              {submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-emerald-400 font-bold uppercase">{sub.task?.title}</p>
                      <p className="text-[10px] text-slate-500">{sub.user_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(sub)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle size={18} /></button>
                      <button onClick={() => handleReject(sub.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><XCircle size={18} /></button>
                    </div>
                  </div>
                  {sub.task?.proof_type === 'image' ? (
                    <a href={sub.proof_data} target="_blank" rel="noreferrer" className="block w-full h-40 rounded-xl overflow-hidden border border-white/10 group relative">
                       <img src={sub.proof_data} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs uppercase">View Full Proof</div>
                    </a>
                  ) : (
                    <div className="bg-slate-900 p-3 rounded-xl border border-white/5 text-xs font-mono break-all text-slate-300">
                      {sub.proof_data}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Active Tasks</h3>
                <button 
                  onClick={() => setShowTaskForm(true)}
                  className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1"
                >
                  <Plus size={14} /> NEW TASK
                </button>
              </div>
              
              {showTaskForm && (
                <GlassCard className="border-emerald-500/30 animate-in slide-in-from-top">
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Task Title" 
                        required
                        className="col-span-2 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                        value={newTask.title}
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                      />
                      <select 
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                        value={newTask.category}
                        onChange={e => setNewTask({...newTask, category: e.target.value as any})}
                      >
                        <option value="facebook">Facebook</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="other">Other/Web</option>
                      </select>
                      <input 
                        type="number" 
                        placeholder="Reward (৳)"
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                        value={newTask.reward_amount}
                        onChange={e => setNewTask({...newTask, reward_amount: parseFloat(e.target.value)})}
                      />
                    </div>
                    <textarea 
                      placeholder="Step-by-step instructions..." 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm h-20 focus:border-emerald-500 outline-none"
                      value={newTask.description}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                    />
                    <input 
                      placeholder="Target Link (URL)"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                      value={newTask.link}
                      onChange={e => setNewTask({...newTask, link: e.target.value})}
                    />
                    
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Advanced Assets (Optional)</p>
                      <input 
                        placeholder="Text for user to COPY (Post content)"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                        value={newTask.copy_text}
                        onChange={e => setNewTask({...newTask, copy_text: e.target.value})}
                      />
                      <input 
                        placeholder="Image URL for user to DOWNLOAD"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                        value={newTask.image_url}
                        onChange={e => setNewTask({...newTask, image_url: e.target.value})}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl">SAVE TASK</button>
                      <button type="button" onClick={() => setShowTaskForm(false)} className="px-6 bg-slate-800 font-bold py-3 rounded-xl">CANCEL</button>
                    </div>
                  </form>
                </GlassCard>
              )}

              {tasks.map(task => (
                <div key={task.id} className="glass-dark p-3 rounded-xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-[10px]">৳{task.reward_amount}</span>
                     <div>
                       <h4 className="text-xs font-bold">{task.title}</h4>
                       <p className="text-[8px] text-slate-500 uppercase tracking-widest">{task.category} • {task.proof_type}</p>
                     </div>
                   </div>
                   <button className="p-2 text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <h3 className="font-bold">Pending KYC ({pendingKYC.length})</h3>
              {pendingKYC.map(u => (
                <GlassCard key={u.id} className="flex gap-4">
                   <div className="w-20 h-20 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                      <img src={u.kyc_document_url || ''} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-sm">{u.kyc_full_name}</h4>
                      <p className="text-[10px] font-mono text-slate-500">{u.kyc_id_number}</p>
                      <a href={u.kyc_document_url || ''} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 font-bold hover:underline inline-flex items-center gap-1">VIEW ID <ExternalLink size={10} /></a>
                      <div className="flex gap-2 mt-2">
                         <button onClick={() => handleKYCAction(u.id, 'verified')} className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-lg">APPROVE</button>
                         <button onClick={() => handleKYCAction(u.id, 'rejected')} className="px-3 py-1.5 bg-red-500/20 text-red-400 text-[10px] font-black rounded-lg">REJECT</button>
                      </div>
                   </div>
                </GlassCard>
              ))}
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="space-y-3">
               <h3 className="font-bold">User Database</h3>
               {users.map(u => (
                 <div key={u.id} className="glass-dark p-3 rounded-xl flex justify-between items-center text-[10px]">
                    <div className="flex-1">
                      <p className="font-bold">{u.full_name}</p>
                      <p className="text-slate-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-black">৳{u.balance.toFixed(2)}</p>
                      <p className="text-slate-500">Refs: {u.referral_count}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

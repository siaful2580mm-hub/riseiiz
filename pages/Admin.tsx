
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, Trash2, Edit, Loader2, Eye, Plus, ExternalLink, History as HistoryIcon, Filter, MapPin, Phone, Briefcase, Calendar, Zap } from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType, SubmissionStatus, Activation } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'tasks' | 'users' | 'kyc' | 'activations'>('submissions');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [pendingKYC, setPendingKYC] = useState<Profile[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
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
        const { data } = await supabase.from('profiles').select('*').limit(50).order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'kyc') {
        const { data } = await supabase.from('profiles').select('*').eq('kyc_status', 'pending');
        setPendingKYC(data || []);
      } else if (activeTab === 'activations') {
        const { data } = await supabase
          .from('activations')
          .select('*, user:profiles(email, full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setActivations(data || []);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveActivation = async (act: Activation) => {
    setProcessingId(act.id);
    try {
      const { error: actErr } = await supabase.from('activations').update({ status: 'approved' }).eq('id', act.id);
      if (actErr) throw actErr;

      const { error: profErr } = await supabase.from('profiles').update({ is_active: true }).eq('id', act.user_id);
      if (profErr) throw profErr;

      await supabase.from('transactions').insert({
        user_id: act.user_id,
        type: 'activation',
        amount: 30,
        description: 'Account successfully activated'
      });

      alert('Account activated!');
      setActivations(prev => prev.filter(a => a.id !== act.id));
    } catch (err: any) {
      alert(err.message || 'Approval failed');
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
        description: `Task reward: ${sub.task.title}`
      });

      alert('Approved successfully!');
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
      alert('Submission rejected.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Admin Command</h2>
        <div className="flex gap-1 glass rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {(['submissions', 'activations', 'tasks', 'users', 'kyc'] as const).map((tab) => (
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
                 <button 
                  onClick={() => setSubFilter('pending')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${subFilter === 'pending' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <Clock size={14} /> Pending Review
                 </button>
                 <button 
                  onClick={() => setSubFilter('processed')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${subFilter === 'processed' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <HistoryIcon size={14} /> Processed History
                 </button>
              </div>
              
              {submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide">{sub.task?.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">User: {(sub as any).user?.email}</p>
                    </div>
                    {subFilter === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(sub)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-slate-950 transition-all active:scale-90">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleReject(sub.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90">
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Proof:</span>
                    <p className="text-[10px] text-slate-300 break-all">{sub.proof_data}</p>
                  </div>
                </GlassCard>
              ))}
              {submissions.length === 0 && <p className="text-center py-20 text-slate-600 italic">No submissions found.</p>}
            </div>
          )}

          {activeTab === 'activations' && (
            <div className="space-y-4">
              <h3 className="font-bold">Pending Activations ({activations.length})</h3>
              {activations.map(act => (
                <GlassCard key={act.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                       <h4 className="font-black text-white">{(act as any).user?.full_name}</h4>
                       <p className="text-xs text-slate-500">{(act as any).user?.email}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-400 font-black">৳30</p>
                       <p className="text-[10px] text-slate-500 uppercase font-bold">{act.method}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase block">TrxID:</span>
                      <span className="text-xs font-mono text-white">{act.transaction_id}</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleApproveActivation(act)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-slate-950 transition-all">
                         <CheckCircle size={18} />
                       </button>
                       <button onClick={() => { /* Reject logic here */ }} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                         <XCircle size={18} />
                       </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {activations.length === 0 && <p className="text-center py-20 text-slate-600 italic">No pending activation requests.</p>}
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <h3 className="font-bold">Pending KYC Requests ({pendingKYC.length})</h3>
              {pendingKYC.map(u => (
                <GlassCard key={u.id} className="flex flex-col gap-4">
                   <div className="flex gap-4">
                     <div className="w-24 h-24 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                        {u.kyc_document_url ? (
                          <img src={u.kyc_document_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold text-[8px]">NO PHOTO</div>
                        )}
                     </div>
                     <div className="flex-1 space-y-1">
                        <h4 className="font-black text-lg text-emerald-400">{u.kyc_full_name}</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <p className="text-[10px] flex items-center gap-1 text-slate-300"><Calendar size={10}/> Age: <b>{u.kyc_age}</b></p>
                          <p className="text-[10px] flex items-center gap-1 text-slate-300"><Calendar size={10}/> DoB: <b>{u.kyc_dob}</b></p>
                          <p className="text-[10px] flex items-center gap-1 text-slate-300"><Phone size={10}/> Phone: <b>{u.kyc_phone}</b></p>
                          <p className="text-[10px] flex items-center gap-1 text-slate-300"><Briefcase size={10}/> Prof: <b>{u.kyc_profession}</b></p>
                        </div>
                     </div>
                   </div>
                   
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><MapPin size={10}/> Address:</p>
                      <p className="text-xs text-slate-300 italic">{u.kyc_address}</p>
                   </div>

                   <div className="flex gap-2">
                      <button onClick={() => handleKYCAction(u.id, 'verified')} className="flex-1 py-3 bg-emerald-500 text-slate-950 text-xs font-black rounded-xl active:scale-95 transition-all">APPROVE IDENTITY</button>
                      <button onClick={() => handleKYCAction(u.id, 'rejected')} className="flex-1 py-3 bg-red-500/20 text-red-400 text-xs font-black rounded-xl active:scale-95 transition-all">REJECT</button>
                   </div>
                </GlassCard>
              ))}
              {pendingKYC.length === 0 && <div className="text-center py-20 text-slate-600 italic">No KYC requests at the moment.</div>}
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Active Tasks</h3>
                <button onClick={() => setShowTaskForm(true)} className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1">
                  <Plus size={14} /> NEW TASK
                </button>
              </div>
              {tasks.map(task => (
                <div key={task.id} className="glass-dark p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold">{task.title}</h4>
                    <p className="text-[8px] text-slate-500 uppercase">৳{task.reward_amount} • {task.category}</p>
                  </div>
                  <button className="p-2 text-red-500/50"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
               <h3 className="font-bold">User Management</h3>
               {users.map(u => (
                 <div key={u.id} className="glass-dark p-3 rounded-xl flex justify-between items-center text-[10px]">
                    <div>
                      <p className="font-bold">{u.full_name}</p>
                      <p className="text-slate-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-black">৳{u.balance.toFixed(2)}</p>
                      <p className="text-slate-500">KYC: {u.kyc_status}</p>
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

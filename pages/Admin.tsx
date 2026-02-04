
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { Submission, Task, Profile } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'tasks' | 'users'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

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
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" /> Admin Command
        </h2>
        <div className="flex gap-1 glass rounded-lg p-1">
          {(['submissions', 'tasks', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                activeTab === tab ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3 bg-blue-500/10 border-blue-500/20">
          <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Pending</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-blue-400">{submissions.length}</span>
            <Clock size={16} className="text-blue-500/50" />
          </div>
        </GlassCard>
        <GlassCard className="p-3 bg-emerald-500/10 border-emerald-500/20">
          <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Total Tasks</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-emerald-400">{tasks.length || '...'}</span>
            <Package size={16} className="text-emerald-500/50" />
          </div>
        </GlassCard>
        <GlassCard className="p-3 bg-pink-500/10 border-pink-500/20">
          <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Users</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-pink-400">{users.length || '...'}</span>
            <Users size={16} className="text-pink-500/50" />
          </div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {activeTab === 'submissions' && (
            <section className="space-y-4">
              <h3 className="font-bold">Pending Submissions</h3>
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm italic">Clean desk! No pending submissions.</div>
                ) : (
                  submissions.map((sub) => (
                    <GlassCard key={sub.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-xs text-emerald-400 font-bold uppercase">{sub.task?.title || 'Unknown Task'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">UID: {sub.user_id}</p>
                          <div className="bg-slate-900 p-2 rounded border border-white/5 mt-2 max-w-xs sm:max-w-md">
                            <p className="text-xs break-all font-mono text-slate-300">{sub.proof_data}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            disabled={processingId === sub.id}
                            onClick={() => handleApprove(sub)}
                            className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 transition-all disabled:opacity-50"
                          >
                            {processingId === sub.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                          </button>
                          <button 
                            disabled={processingId === sub.id}
                            onClick={() => handleReject(sub.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-slate-950 transition-all disabled:opacity-50"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === 'tasks' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Task Manager</h3>
                <button className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-3 py-1 rounded">CREATE NEW</button>
              </div>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="glass-dark p-3 rounded-xl flex justify-between items-center border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 glass rounded-lg flex items-center justify-center font-black text-emerald-400">৳{task.reward_amount}</div>
                      <div>
                        <h4 className="text-xs font-bold">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 uppercase">{task.category} • {task.proof_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:text-emerald-400 transition-colors"><Edit size={14}/></button>
                      <button className="p-1.5 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="space-y-4">
              <h3 className="font-bold">Member Directory</h3>
              <div className="glass-dark overflow-hidden rounded-xl border border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left min-w-[500px]">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="p-3 font-bold uppercase">Name / Email</th>
                        <th className="p-3 font-bold uppercase">Balance</th>
                        <th className="p-3 font-bold uppercase">Referrals</th>
                        <th className="p-3 font-bold uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5">
                          <td className="p-3">
                            <div className="font-bold">{u.full_name || 'No Name'}</div>
                            <div className="text-slate-500 truncate max-w-[150px]">{u.email}</div>
                          </td>
                          <td className="p-3 font-bold text-emerald-400">৳{u.balance.toFixed(2)}</td>
                          <td className="p-3 text-blue-400 font-bold">{u.referral_count}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'}`}>
                              {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

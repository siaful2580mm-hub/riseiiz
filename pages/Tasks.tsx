
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { CATEGORY_ICONS } from '../constants.tsx';
import { ExternalLink, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Task } from '../types.ts';

const Tasks: React.FC = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTaskIds, setSubmittedTaskIds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [tasksRes, submissionsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('is_active', true),
        supabase.from('submissions').select('task_id').eq('user_id', profile.id)
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (submissionsRes.data) {
        setSubmittedTaskIds(submissionsRes.data.map(s => s.task_id));
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !proof || !profile) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('submissions').insert({
        task_id: selectedTask.id,
        user_id: profile.id,
        proof_data: proof,
        status: 'pending'
      });

      if (error) throw error;

      setSubmittedTaskIds(prev => [...prev, selectedTask.id]);
      setSelectedTask(null);
      setProof('');
      alert('Task submitted successfully! Waiting for admin approval.');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Daily Tasks</h2>
        <span className="text-xs text-slate-500 font-bold bg-slate-900 px-3 py-1 rounded-full border border-white/5">
          {tasks.length} AVAILABLE
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => {
          const isDone = submittedTaskIds.includes(task.id);
          return (
            <GlassCard key={task.id} className={isDone ? 'opacity-60 grayscale' : ''}>
              <div className="flex gap-4">
                <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  {CATEGORY_ICONS[task.category] || CATEGORY_ICONS['other']}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base leading-tight">{task.title}</h3>
                    <span className="text-emerald-400 font-black text-lg">৳{task.reward_amount}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  
                  {isDone ? (
                    <div className="mt-4 flex items-center gap-1 text-emerald-400 font-bold text-xs uppercase">
                      <CheckCircle2 size={14} /> Submitted
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="mt-4 w-full py-2 bg-slate-900 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                    >
                      Start Task
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <AlertCircle className="mx-auto text-slate-600" size={48} />
            <p className="text-slate-500">No active tasks at the moment.</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white p-2">✕</button>
              </div>

              <a 
                href={selectedTask.link} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
              >
                <ExternalLink size={18} /> OPEN TASK LINK
              </a>

              <form onSubmit={handleSubmit} className="pt-4 border-t border-white/10 space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Proof Required ({selectedTask.proof_type})</span>
                  <textarea 
                    required
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                    placeholder={selectedTask.proof_type === 'image' ? 'Paste image URL or username...' : 'Enter text proof here...'}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm outline-none h-24 focus:border-emerald-500 transition-all"
                  />
                </label>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  SUBMIT TASK
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

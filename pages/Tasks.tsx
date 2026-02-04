
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { CATEGORY_ICONS } from '../constants.tsx';
import { ExternalLink, Send, CheckCircle2, Loader2, AlertCircle, Filter, ArrowUpDown } from 'lucide-react';
import { Task, TaskCategory } from '../types.ts';

type SortOption = 'newest' | 'oldest' | 'reward-high' | 'reward-low';

const Tasks: React.FC = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTaskIds, setSubmittedTaskIds] = useState<number[]>([]);
  
  // Filter and Sort states
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

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

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'reward-high':
          return b.reward_amount - a.reward_amount;
        case 'reward-low':
          return a.reward_amount - b.reward_amount;
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [tasks, filterCategory, sortBy]);

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

  const categories: (TaskCategory | 'all')[] = ['all', 'youtube', 'facebook', 'instagram', 'twitter', 'other'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Daily Tasks</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="w-full sm:w-auto pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold uppercase outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Platforms' : cat}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold uppercase outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="reward-high">Reward: High to Low</option>
              <option value="reward-low">Reward: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTasks.map((task) => {
          const isDone = submittedTaskIds.includes(task.id);
          return (
            <GlassCard key={task.id} className={`${isDone ? 'opacity-60 grayscale' : 'hover:border-emerald-500/30'}`}>
              <div className="flex gap-4">
                <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  {CATEGORY_ICONS[task.category] || CATEGORY_ICONS['other']}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base leading-tight">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                           {task.category}
                         </span>
                         <span className="text-[10px] text-slate-600 font-medium">
                           {new Date(task.created_at).toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-black text-lg">৳{task.reward_amount}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{task.description}</p>
                  
                  {isDone ? (
                    <div className="mt-4 flex items-center gap-1 text-emerald-400 font-bold text-xs uppercase bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={14} /> Submitted
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="mt-4 w-full py-2 bg-slate-900 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 transition-all"
                    >
                      Start Task
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
        {filteredAndSortedTasks.length === 0 && (
          <div className="text-center py-12 space-y-3 glass rounded-3xl border-dashed border-white/10">
            <AlertCircle className="mx-auto text-slate-600" size={48} />
            <div>
              <p className="text-slate-200 font-bold">No tasks found</p>
              <p className="text-slate-500 text-sm">Try adjusting your filters or check back later.</p>
            </div>
            {filterCategory !== 'all' && (
              <button 
                onClick={() => setFilterCategory('all')}
                className="text-xs font-bold text-emerald-400 uppercase tracking-widest hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    {CATEGORY_ICONS[selectedTask.category] || CATEGORY_ICONS['other']}
                  </div>
                  <h3 className="text-xl font-black">{selectedTask.title}</h3>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white p-2">✕</button>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Reward Amount</span>
                <span className="text-2xl font-black text-emerald-400">৳{selectedTask.reward_amount}</span>
              </div>

              <a 
                href={selectedTask.link} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all text-white"
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
                    placeholder={selectedTask.proof_type === 'image' ? 'Paste image URL or your platform username (e.g. @username)...' : 'Enter text proof here...'}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm outline-none h-24 focus:border-emerald-500 transition-all placeholder:text-slate-700"
                  />
                </label>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-500/20 text-slate-950"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  SUBMIT PROOF
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

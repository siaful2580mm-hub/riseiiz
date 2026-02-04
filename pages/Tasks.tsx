
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { CATEGORY_ICONS } from '../constants.tsx';
import { ExternalLink, Send, CheckCircle2, Loader2, Copy, Download, Camera, Info, ListChecks, Clock, AlertTriangle } from 'lucide-react';
import { Task, TaskCategory, SubmissionStatus } from '../types.ts';

type SortOption = 'newest' | 'oldest' | 'reward-high' | 'reward-low';
const IMGBB_API_KEY = '5e66705a72b74bc10253029076d35cca';

const Tasks: React.FC = () => {
  const { profile, t } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proof, setProof] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState<Record<number, SubmissionStatus>>({});
  
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    fetchData();
    
    if (!profile) return;
    
    const subChannel = supabase
      .channel('user-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const updatedSub = payload.new as any;
          setUserSubmissions(prev => ({
            ...prev,
            [updatedSub.task_id]: updatedSub.status as SubmissionStatus
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
    };
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [tasksRes, submissionsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('is_active', true),
        supabase.from('submissions').select('task_id, status').eq('user_id', profile.id)
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (submissionsRes.data) {
        const subsMap: Record<number, SubmissionStatus> = {};
        submissionsRes.data.forEach(s => {
          subsMap[s.task_id] = s.status;
        });
        setUserSubmissions(subsMap);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'reward-high': return b.reward_amount - a.reward_amount;
        case 'reward-low': return a.reward_amount - b.reward_amount;
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [tasks, filterCategory, sortBy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error('Proof upload failed');
    return data.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !profile) return;

    setIsSubmitting(true);
    try {
      let finalProof = proof;
      if (selectedTask.proof_type === 'image' && proofFile) {
        finalProof = await uploadToImgBB(proofFile);
      }

      const { error } = await supabase.from('submissions').insert({
        task_id: selectedTask.id,
        user_id: profile.id,
        proof_data: finalProof,
        status: 'pending'
      });

      if (error) throw error;

      setUserSubmissions(prev => ({ ...prev, [selectedTask.id]: 'pending' }));
      handleCloseModal();
      alert('Task submitted! Admin will verify your proof.');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setProof('');
    setProofFile(null);
    setProofPreview(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black">{t.daily_tasks}</h2>
        <div className="flex items-center gap-2">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">{t.all_platforms}</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="other">Websites</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="newest">{t.newest}</option>
            <option value="reward-high">{t.high_reward}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Info size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No tasks available.</p>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => {
            const status = userSubmissions[task.id];
            const isDone = !!status;
            
            return (
              <GlassCard key={task.id} className={`${status === 'approved' ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex gap-4">
                  <div className="w-14 h-14 glass-dark rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                    {CATEGORY_ICONS[task.category] || CATEGORY_ICONS['other']}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base leading-tight group-hover:text-emerald-400 transition-colors">{task.title}</h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{task.category}</span>
                      </div>
                      <span className="text-emerald-400 font-black text-xl">৳{task.reward_amount}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                    
                    {isDone ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {status === 'pending' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 font-bold text-[10px] uppercase rounded-full border border-amber-500/20">
                            <Clock size={12} /> {t.pending_verif}
                          </div>
                        )}
                        {status === 'approved' && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase rounded-full border border-emerald-500/20">
                            <CheckCircle2 size={12} /> {t.completed}
                          </div>
                        )}
                        {status === 'rejected' && (
                          <div className="inline-flex flex-col gap-2 w-full">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 font-bold text-[10px] uppercase rounded-full border border-red-500/20 w-max">
                              <AlertTriangle size={12} /> {t.rejected}
                            </div>
                            <button 
                              onClick={() => setSelectedTask(task)}
                              className="w-full py-2 bg-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-300"
                            >
                              Resubmit Proof
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="mt-4 w-full py-2.5 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-slate-950 transition-all active:scale-[0.97]"
                      >
                        {t.launch_task}
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 border-white/20">
            <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-2 glass-dark rounded-lg">{CATEGORY_ICONS[selectedTask.category]}</div>
                   <h3 className="text-xl font-black">{selectedTask.title}</h3>
                </div>
                <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">✕</button>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t.earn_reward}</span>
                </div>
                <span className="text-3xl font-black text-emerald-400">৳{selectedTask.reward_amount}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <ListChecks size={16} />
                  <h4 className="text-xs font-black uppercase tracking-widest">{t.instruction}</h4>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/10 leading-relaxed italic">
                    "{selectedTask.description}"
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <a href={selectedTask.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm text-white active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                      <ExternalLink size={18} /> {t.go_target}
                    </a>
                    {selectedTask.copy_text && (
                      <button onClick={() => { navigator.clipboard.writeText(selectedTask.copy_text!); alert('Copied!'); }} className="flex items-center justify-center gap-2 py-3.5 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-2xl font-black text-sm text-indigo-400 active:scale-95 transition-all">
                        <Copy size={18} /> {t.copy_caption}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="pt-6 border-t border-white/10 space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <Camera size={14} /> {t.submit_proof} ({selectedTask.proof_type})
                  </span>
                  {selectedTask.proof_type === 'image' ? (
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="proof-img" />
                      <label htmlFor="proof-img" className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all overflow-hidden relative group">
                        {proofPreview ? <img src={proofPreview} className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-500" />}
                      </label>
                    </div>
                  ) : (
                    <textarea required value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Paste proof here..." className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-sm h-28 focus:border-emerald-500 outline-none transition-all resize-none shadow-inner" />
                  )}
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-gradient-primary rounded-2xl font-black text-sm text-slate-950 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  {t.submit_now}
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

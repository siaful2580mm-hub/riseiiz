import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { CATEGORY_ICONS } from '../constants.tsx';
// Added Star to the imported icons from lucide-react
import { ExternalLink, Send, CheckCircle2, Loader2, Copy, Download, Camera, Info, ListChecks, Clock, AlertTriangle, Filter, History, Zap, Upload, Facebook, ShieldCheck, Star } from 'lucide-react';
import { Task, TaskCategory, SubmissionStatus, SystemSettings } from '../types.ts';

type SortOption = 'newest' | 'oldest' | 'reward-high' | 'reward-low';
const IMGBB_API_KEY = '5e66705a72b74bc10253029076d35cca';

const Tasks: React.FC = () => {
  const { profile, t } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'submitted'>('available');
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
      const [tasksRes, submissionsRes, settingsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('is_active', true),
        supabase.from('submissions').select('task_id, status').eq('user_id', profile.id),
        supabase.from('system_settings').select('*').single()
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
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
    
    if (activeTab === 'available') {
      result = result.filter(t => !userSubmissions[t.id]);
    } else {
      result = result.filter(t => !!userSubmissions[t.id]);
    }

    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }

    result.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      
      switch (sortBy) {
        case 'reward-high': return b.reward_amount - a.reward_amount;
        case 'reward-low': return a.reward_amount - b.reward_amount;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [tasks, filterCategory, sortBy, activeTab, userSubmissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !profile) return;

    setIsSubmitting(true);
    try {
      let finalProof = proof;
      if (selectedTask.proof_type === 'image' && proofFile) {
        finalProof = await uploadToImgBB(proofFile);
      }

      const { data: existing } = await supabase.from('submissions').select('id').eq('task_id', selectedTask.id).eq('user_id', profile.id).maybeSingle();

      if (existing) {
        await supabase.from('submissions').update({ proof_data: finalProof, status: 'pending' }).eq('id', existing.id);
      } else {
        await supabase.from('submissions').insert({
          task_id: selectedTask.id,
          user_id: profile.id,
          proof_data: finalProof,
          status: 'pending'
        });
      }

      setUserSubmissions(prev => ({ ...prev, [selectedTask.id]: 'pending' }));
      setSelectedTask(null);
      alert('Task submitted! Verified usually in 2-6 hours.');
      setActiveTab('submitted');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!data.success) throw new Error('Proof upload failed');
    return data.data.url;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00f2ff]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">Daily Missions</h2>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('available')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'available' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>Available</button>
          <button onClick={() => setActiveTab('submitted')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'submitted' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>My Work</button>
        </div>
      </div>

      {/* Sponsored Ad */}
      {settings?.banner_ads_code && activeTab === 'available' && (
         <div className="glass-dark border-amber-500/20 rounded-2xl p-4 overflow-hidden">
            <p className="text-[8px] font-black uppercase text-amber-500 mb-2">Promoted Content</p>
            <div dangerouslySetInnerHTML={{ __html: settings.banner_ads_code }} />
         </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTasks.map((task) => (
          <GlassCard key={task.id} className={`border-l-4 ${task.is_featured ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-transparent'} ${task.category === 'facebook' ? 'border-[#1877F2]/30' : ''}`}>
            <div className="flex gap-4">
              <div className="w-14 h-14 glass-dark rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                {CATEGORY_ICONS[task.category] || CATEGORY_ICONS['other']}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white">{task.title}</h3>
                      {task.is_featured && <Star size={12} className="text-amber-500 fill-current" />}
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{task.category}</span>
                  </div>
                  <span className="text-[#00f2ff] font-black text-xl">৳{task.reward_amount}</span>
                </div>
                
                <button 
                  onClick={() => setSelectedTask(task)}
                  className="mt-4 w-full py-2.5 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase hover:bg-[#00f2ff] hover:text-slate-950 transition-all active:scale-[0.98]"
                >
                  {activeTab === 'submitted' ? 'View Details' : 'Launch Task'}
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Task Execution Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 border-white/10">
            <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white">{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className="text-slate-500">✕</button>
              </div>

              {/* Specialized FB Guide */}
              {selectedTask.category === 'facebook' && (
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                  <Facebook className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Facebook Guide</p>
                    <p className="text-[11px] text-slate-300 leading-tight">আপনার পোস্টটি অবশ্যই <b>Public</b> হতে হবে নতুবা রিওয়ার্ড দেওয়া হবে না।</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-sm text-slate-400 bg-black/40 p-4 rounded-2xl border border-white/5 italic">
                  {selectedTask.description}
                </p>
                <div className="flex flex-col gap-2">
                  <a href={selectedTask.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-4 bg-blue-600 rounded-2xl font-black text-xs text-white active:scale-95 transition-all">
                    <ExternalLink size={16} /> Link এ যান
                  </a>
                  {selectedTask.copy_text && (
                    <button onClick={() => { navigator.clipboard.writeText(selectedTask.copy_text!); alert('Copied!'); }} className="flex items-center justify-center gap-2 py-4 bg-white/5 rounded-2xl font-black text-xs text-slate-300 border border-white/5 active:scale-95 transition-all">
                      <Copy size={16} /> Caption কপি করুন
                    </button>
                  )}
                </div>
              </div>

              {activeTab === 'available' && (
                <form onSubmit={handleSubmit} className="pt-6 border-t border-white/5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Camera size={14} /> Proof Required</label>
                    {selectedTask.proof_type === 'image' ? (
                       <label className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 cursor-pointer overflow-hidden group">
                         {proofPreview ? <img src={proofPreview} className="w-full h-full object-cover" /> : <><Upload size={24} className="text-slate-600 mb-2" /><span className="text-[9px] font-black uppercase text-slate-500">Upload Screenshot</span></>}
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                           const file = e.target.files?.[0];
                           if(file) { setProofFile(file); const r = new FileReader(); r.onload = (e) => setProofPreview(e.target?.result as string); r.readAsDataURL(file); }
                         }} />
                       </label>
                    ) : (
                       <input required value={proof} onChange={e => setProof(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs" placeholder="Paste link/username..." />
                    )}
                  </div>
                  <button disabled={isSubmitting} className="w-full py-4 bg-gradient-primary rounded-2xl font-black text-xs text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-[#00f2ff]/20">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />} SUBMIT PROOF
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
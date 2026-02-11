
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { CATEGORY_ICONS } from '../constants.tsx';
import { 
  ExternalLink, Send, CheckCircle2, Loader2, Copy, 
  Camera, ListChecks, Clock, Zap, Upload, Facebook, Star, ChevronRight, FileDown 
} from 'lucide-react';
import { Task, TaskCategory, SubmissionStatus, SystemSettings } from '../types.ts';

type SortOption = 'newest' | 'oldest' | 'reward-high' | 'reward-low';
const IMGBB_API_KEY = 'f5789c14135a479b4e3893c6b9ccf074';

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

  // Reset proof fields when modal is closed or task is changed
  useEffect(() => {
    setProof('');
    setProofFile(null);
    setProofPreview(null);
  }, [selectedTask]);

  useEffect(() => {
    fetchData();
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

      if (!finalProof && selectedTask.proof_type === 'image') {
        throw new Error('দয়া করে কাজের প্রমাণ হিসেবে স্ক্রিনশটটি আপলোড করুন।');
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
      alert('আপনার কাজটি সফলভাবে জমা দেওয়া হয়েছে! এডমিন শীঘ্রই যাচাই করবে।');
      setActiveTab('submitted');
    } catch (err: any) {
      alert(err.message || 'সাবমিশন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
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

  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `riseii-asset-${Date.now()}.png`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00f2ff]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">{t.mission_board}</h2>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTab('available')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'available' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>{t.available_missions}</button>
          <button onClick={() => setActiveTab('submitted')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'submitted' ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'text-slate-500'}`}>{t.my_submissions}</button>
        </div>

        <div className="flex items-center gap-2">
           <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-[#00f2ff] transition-all flex-1">
             <option value="all">{t.all_platforms}</option>
             <option value="facebook">Facebook</option>
             <option value="youtube">YouTube</option>
             <option value="tiktok">TikTok</option>
           </select>
           <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-[#00f2ff] transition-all flex-1">
             <option value="newest">{t.sort_by}{t.newest}</option>
             <option value="reward-high">{t.sort_by}{t.high_reward}</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTasks.length === 0 ? (
           <div className="text-center py-20 glass rounded-3xl border-dashed border-white/5 space-y-4">
              <Zap size={40} className="mx-auto text-slate-800" />
              <p className="text-[10px] font-black uppercase text-slate-500">{t.no_missions}</p>
           </div>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <GlassCard key={task.id} className={`border-l-4 transition-all duration-300 ${task.is_featured ? 'border-l-amber-500' : 'border-l-transparent'}`}>
              <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 ${task.category === 'facebook' ? 'bg-blue-600/10 text-blue-500' : 'bg-white/5 text-slate-300'}`}>
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
                    <span className="text-white font-black text-xl">৳{task.reward_amount}</span>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="flex-1 py-2.5 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                    >
                      {activeTab === 'submitted' ? 'বিস্তারিত দেখুন' : t.launch_task}
                    </button>
                    {task.link && activeTab === 'available' && (
                       <button onClick={() => { window.open(task.link, '_blank'); }} className="p-2.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl">
                          <ExternalLink size={18} />
                       </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom duration-300 border-white/10">
            <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white">{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-colors">✕</button>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">পুরস্কার পাবেন</p>
                   <p className="text-3xl font-black text-white">৳{selectedTask.reward_amount}</p>
                </div>
                <Zap size={32} className="text-emerald-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <ListChecks size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">{t.instruction}</h4>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                   <p className="text-sm text-slate-300 leading-relaxed italic">{selectedTask.description}</p>
                   <div className="grid grid-cols-1 gap-3 pt-2">
                      {selectedTask.link && (
                        <a href={selectedTask.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 py-4 bg-gradient-primary rounded-2xl font-black text-xs text-slate-950 uppercase tracking-widest active:scale-95 transition-all">
                          <ExternalLink size={18} /> {t.visit_link}
                        </a>
                      )}
                      {selectedTask.copy_text && (
                        <button onClick={() => { navigator.clipboard.writeText(selectedTask.copy_text!); alert('ক্যাপশন কপি করা হয়েছে!'); }} className="flex items-center justify-center gap-3 py-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl font-black text-xs text-indigo-400 uppercase tracking-widest active:scale-95 transition-all">
                          <Copy size={18} /> {t.copy_caption}
                        </button>
                      )}
                      {selectedTask.image_url && (
                        <button onClick={() => handleDownloadImage(selectedTask.image_url!)} className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs text-slate-300 uppercase tracking-widest active:scale-95 transition-all">
                          <FileDown size={18} /> {t.download_asset}
                        </button>
                      )}
                   </div>
                </div>
              </div>

              {activeTab === 'available' ? (
                <form onSubmit={handleSubmit} className="pt-6 border-t border-white/5 space-y-5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Camera size={14} /> {t.upload_proof}</label>
                    {selectedTask.proof_type === 'image' ? (
                       <label className="w-full h-44 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center bg-white/5 cursor-pointer overflow-hidden group">
                         {proofPreview ? (
                            <img src={proofPreview} className="w-full h-full object-cover" />
                         ) : (
                            <>
                              <Upload size={32} className="text-slate-700 mb-2 group-hover:text-[#00f2ff] transition-colors" />
                              <span className="text-[10px] font-black uppercase text-slate-600">স্ক্রিনশট আপলোড করতে ক্লিক করুন</span>
                            </>
                         )}
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                           const file = e.target.files?.[0];
                           if(file) { setProofFile(file); const r = new FileReader(); r.onload = (e) => setProofPreview(e.target?.result as string); r.readAsDataURL(file); }
                         }} />
                       </label>
                    ) : (
                       <input required value={proof} onChange={e => setProof(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xs font-mono" placeholder="আপনার প্রোফাইল আইডি বা লিঙ্ক দিন..." />
                    )}
                  </div>
                  <button disabled={isSubmitting} className="w-full py-5 bg-gradient-primary rounded-2xl font-black text-sm text-slate-950 flex items-center justify-center gap-3 shadow-2xl shadow-[#00f2ff]/30 uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    {t.submit_now}
                  </button>
                </form>
              ) : (
                <div className="pt-6 border-t border-white/5 text-center">
                   <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">কাজের বর্তমান অবস্থা</p>
                      <p className={`text-sm font-black uppercase tracking-widest mt-1 ${
                        userSubmissions[selectedTask.id] === 'approved' ? 'text-emerald-400' : 
                        userSubmissions[selectedTask.id] === 'rejected' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {userSubmissions[selectedTask.id] === 'approved' ? t.completed : 
                         userSubmissions[selectedTask.id] === 'rejected' ? t.rejected : 'যাচাই করা হচ্ছে (Pending)'}
                      </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;


import React, { useState } from 'react';
import { db } from '../services/mockDb';
import GlassCard from '../components/GlassCard';
import { CATEGORY_ICONS } from '../constants';
import { ExternalLink, Camera, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Task } from '../types';

const Tasks: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTasks, setSubmittedTasks] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !proof) return;

    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    
    db.submitTask(selectedTask.id, proof);
    setSubmittedTasks([...submittedTasks, selectedTask.id]);
    setSelectedTask(null);
    setProof('');
    setIsSubmitting(false);
    alert('Task submitted successfully! Admin will review it shortly.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Daily Tasks</h2>
        <div className="px-3 py-1 glass-dark rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30">
          {db.tasks.length} AVAILABLE
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {db.tasks.map((task) => {
          const isDone = submittedTasks.includes(task.id);
          return (
            <GlassCard key={task.id} className={isDone ? 'opacity-60 grayscale' : ''}>
              <div className="flex gap-4">
                <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                  {CATEGORY_ICONS[task.category]}
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
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white p-2">✕</button>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-400 leading-relaxed">{selectedTask.description}</p>
                <a 
                  href={selectedTask.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <ExternalLink size={18} /> OPEN TASK LINK
                </a>
              </div>

              <form onSubmit={handleSubmit} className="pt-4 border-t border-white/10 space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Proof Required ({selectedTask.proof_type === 'image' ? 'Screenshot' : 'Link/Text'})
                  </span>
                  
                  {selectedTask.proof_type === 'image' ? (
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          // In demo, we just store file name
                          if (e.target.files?.[0]) setProof(e.target.files[0].name);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        required
                      />
                      <div className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-emerald-500/50 transition-colors">
                        <Camera className="text-slate-500 group-hover:text-emerald-400 transition-colors" size={32} />
                        <span className="text-xs font-medium text-slate-500">
                          {proof || 'Tap to upload screenshot'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <textarea 
                      required
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      placeholder="Enter the required text or link here..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none h-24"
                    />
                  )}
                </label>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
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

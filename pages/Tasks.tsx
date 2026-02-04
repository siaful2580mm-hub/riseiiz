
import React, { useState } from 'react';
import { db } from '../services/mockDb.ts';
import GlassCard from '../components/GlassCard.tsx';
import { CATEGORY_ICONS } from '../constants.tsx';
import { ExternalLink, Camera, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Task } from '../types.ts';

const Tasks: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTasks, setSubmittedTasks] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !proof) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    
    db.submitTask(selectedTask.id, proof);
    setSubmittedTasks([...submittedTasks, selectedTask.id]);
    setSelectedTask(null);
    setProof('');
    setIsSubmitting(false);
    alert('Task submitted successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Daily Tasks</h2>
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

      {selectedTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white p-2">✕</button>
              </div>

              <a 
                href={selectedTask.link} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 rounded-xl font-bold text-sm shadow-lg active:scale-95"
              >
                <ExternalLink size={18} /> OPEN TASK LINK
              </a>

              <form onSubmit={handleSubmit} className="pt-4 border-t border-white/10 space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Proof Required</span>
                  <textarea 
                    required
                    value={proof}
                    onChange={(e) => setProof(e.target.value)}
                    placeholder="Enter link or text proof..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm outline-none h-24"
                  />
                </label>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
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

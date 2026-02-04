
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import GlassCard from '../components/GlassCard';
import { ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'tasks' | 'users'>('submissions');
  const [pendingSubmissions, setPendingSubmissions] = useState(db.submissions.filter(s => s.status === 'pending'));

  const approve = (id: number) => {
    db.approveSubmission(id);
    setPendingSubmissions(pendingSubmissions.filter(s => s.id !== id));
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-3 bg-blue-500/10 border-blue-500/20">
          <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Pending</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-blue-400">{pendingSubmissions.length}</span>
            <Clock size={16} className="text-blue-500/50" />
          </div>
        </GlassCard>
        <GlassCard className="p-3 bg-emerald-500/10 border-emerald-500/20">
          <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Users</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-emerald-400">1,248</span>
            <Users size={16} className="text-emerald-500/50" />
          </div>
        </GlassCard>
        <GlassCard className="p-3 bg-pink-500/10 border-pink-500/20">
          <span className="text-[8px] uppercase tracking-tighter text-slate-400 font-bold">Tasks</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-pink-400">{db.tasks.length}</span>
            <Package size={16} className="text-pink-500/50" />
          </div>
        </GlassCard>
      </div>

      {activeTab === 'submissions' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Pending Submissions</h3>
            <button 
              onClick={() => pendingSubmissions.forEach(s => approve(s.id))}
              className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-500 hover:text-slate-950 transition-colors"
            >
              APPROVE ALL
            </button>
          </div>
          
          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">No pending submissions. Well done!</div>
            ) : (
              pendingSubmissions.map((sub) => (
                <GlassCard key={sub.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs text-emerald-400 font-bold uppercase">{sub.task?.title}</p>
                      <p className="text-[10px] text-slate-400">User: {sub.user_id}</p>
                      <div className="bg-slate-900 p-2 rounded border border-white/5 mt-2">
                        <p className="text-xs break-all font-mono text-slate-300">{sub.proof_data}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => approve(sub.id)}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button className="p-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
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
            {db.tasks.map(task => (
              <div key={task.id} className="glass-dark p-3 rounded-xl flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 glass rounded-lg flex items-center justify-center font-black text-emerald-400">৳{task.reward_amount}</div>
                  <div>
                    <h4 className="text-xs font-bold">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 uppercase">{task.category} • {task.proof_type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:text-emerald-400"><Edit size={14}/></button>
                  <button className="p-1.5 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className="space-y-4">
          <h3 className="font-bold">Recent Users</h3>
          <div className="glass-dark overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 font-bold uppercase">User</th>
                  <th className="p-3 font-bold uppercase">Balance</th>
                  <th className="p-3 font-bold uppercase">Status</th>
                  <th className="p-3 font-bold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-3">user_{i}@example.com</td>
                    <td className="p-3 font-bold text-emerald-400">৳{Math.floor(Math.random()*500)}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px]">ACTIVE</span>
                    </td>
                    <td className="p-3">
                      <button className="text-red-400 hover:underline">BAN</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Admin;

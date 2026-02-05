
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.ts';
import GlassCard from '../components/GlassCard.tsx';
import { 
  ShieldCheck, Users, Package, Clock, CheckCircle, XCircle, 
  Trash2, Edit, Loader2, Eye, Plus, ExternalLink, 
  History as HistoryIcon, Filter, Zap, UserX, UserCheck, Coins, Search, AlertTriangle,
  Settings as SettingsIcon, Save, Megaphone, FileText, Wrench, ToggleRight, X, LayoutGrid, Link as LinkIcon,
  ChevronRight, ArrowUpRight, Ban, Unlock, UserCircle, Wallet, MessageCircle, MoreHorizontal
} from 'lucide-react';
import { Submission, Task, Profile, TaskCategory, ProofType, SubmissionStatus, Activation, SystemSettings, Withdrawal } from '../types.ts';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'activations' | 'withdrawals' | 'tasks' | 'users' | 'settings'>('submissions');
  const [subFilter, setSubFilter] = useState<'pending' | 'processed'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [balanceChange, setBalanceChange] = useState<string>('');
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'youtube',
    reward_amount: 5,
    link: '',
    proof_type: 'image',
    is_active: true
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, subFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'submissions') {
        let query = supabase.from('submissions').select('*, task:tasks(*), user:profiles(email, full_name)');
        query = subFilter === 'pending' ? query.eq('status', 'pending') : query.neq('status', 'pending');
        const { data } = await query.order('created_at', { ascending: false });
        setSubmissions(data || []);
      } else if (activeTab === 'withdrawals') {
        const { data } = await supabase.from('withdrawals').select('*, user:profiles(*)').order('created_at', { ascending: false });
        setWithdrawals(data || []);
      } else if (activeTab === 'tasks') {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        setTasks(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'activations') {
        const { data } = await supabase.from('activations').select('*, user:profiles(email, full_name)').eq('status', 'pending');
        setActivations(data || []);
      } else if (activeTab === 'settings') {
        const { data } = await supabase.from('system_settings').select('*').single();
        if (data) setSettings(data);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id: number, status: 'completed' | 'rejected') => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
      if (error) throw error;
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w));
      alert(`Withdrawal ${status}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessSubmission = async (sub: Submission, status: 'approved' | 'rejected') => {
    setProcessingId(sub.id);
    try {
      const { error: subError } = await supabase.from('submissions').update({ status }).eq('id', sub.id);
      if (subError) throw subError;
      if (status === 'approved' && sub.task) {
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', sub.user_id).single();
        if (profile) {
          await supabase.from('profiles').update({ balance: profile.balance + sub.task.reward_amount }).eq('id', sub.user_id);
          await supabase.from('transactions').insert({
            user_id: sub.user_id,
            type: 'earning',
            amount: sub.task.reward_amount,
            description: `Task Approved: ${sub.task.title}`
          });
        }
      }
      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    } catch (err: any) { alert(err.message); } finally { setProcessingId(null); }
  };

  const handleUpdateUser = async (updates: Partial<Profile>) => {
    if (!selectedUser) return;
    setProcessingId('user-update');
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', selectedUser.id);
      if (error) throw error;
      const updatedUser = { ...selectedUser, ...updates };
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
    } catch (err: any) { alert(err.message); } finally { setProcessingId(null); }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceChange) return;
    const amount = parseFloat(balanceChange);
    setProcessingId('balance-update');
    try {
      const newBalance = selectedUser.balance + amount;
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', selectedUser.id);
      await supabase.from('transactions').insert({ user_id: selectedUser.id, type: amount > 0 ? 'bonus' : 'withdraw', amount: Math.abs(amount), description: `Admin Adjustment: ${amount > 0 ? 'Credit' : 'Debit'}` });
      setSelectedUser({ ...selectedUser, balance: newBalance });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
      setBalanceChange('');
    } catch (err: any) { alert(err.message); } finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CONSOLE PRO</h2>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Administrator</span>
          </div>
        </div>
        
        <div className="flex gap-2 glass rounded-2xl p-2 overflow-x-auto scrollbar-hide border-white/5 shadow-2xl">
          {(['submissions', 'activations', 'withdrawals', 'tasks', 'users', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab ? 'bg-gradient-primary text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab === 'submissions' && <FileText size={14} />}
              {tab === 'activations' && <Zap size={14} />}
              {tab === 'withdrawals' && <Wallet size={14} />}
              {tab === 'tasks' && <LayoutGrid size={14} />}
              {tab === 'users' && <Users size={14} />}
              {tab === 'settings' && <SettingsIcon size={14} />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-emerald-500 mb-2" /><p className="text-[10px] font-black uppercase text-slate-500">Syncing Data...</p></div>
      ) : (
        <>
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button onClick={() => setSubFilter('pending')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${subFilter === 'pending' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>Pending</button>
                <button onClick={() => setSubFilter('processed')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${subFilter === 'processed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>History</button>
              </div>
              {submissions.map(sub => (
                <GlassCard key={sub.id} className="space-y-4 border-white/5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400"><FileText size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-white">{sub.task?.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{(sub as any).user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-black">৳{sub.task?.reward_amount}</span>
                      <p className="text-[8px] text-slate-600 font-black uppercase">{new Date(sub.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                     {sub.task?.proof_type === 'image' ? (
                       <a href={sub.proof_data} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-lg overflow-hidden border border-white/10 group relative">
                         <img src={sub.proof_data} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Proof" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-emerald-500/20"><Eye className="text-white" /></div>
                       </a>
                     ) : (
                       <p className="text-xs text-slate-300 font-mono break-all">{sub.proof_data}</p>
                     )}
                  </div>
                  {sub.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleProcessSubmission(sub, 'approved')} className="py-2.5 bg-emerald-500 rounded-xl text-slate-950 font-black text-[9px] uppercase">Approve</button>
                      <button onClick={() => handleProcessSubmission(sub, 'rejected')} className="py-2.5 bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl font-black text-[9px] uppercase">Reject</button>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
               {withdrawals.length === 0 ? <div className="text-center py-20 text-slate-500 text-xs font-black uppercase tracking-widest opacity-30">No withdrawals</div> : withdrawals.map(w => (
                 <GlassCard key={w.id} className="space-y-3">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><Wallet size={20} /></div>
                        <div>
                          <p className="text-sm font-black text-white">৳{w.amount}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black">{(w as any).user?.full_name}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase ${
                        w.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                        w.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{w.status}</span>
                   </div>
                   <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Method: {w.method}</p>
                      <p className="text-xs font-mono font-black text-emerald-400 select-all">{w.wallet_number}</p>
                   </div>
                   {w.status === 'pending' && (
                     <div className="grid grid-cols-2 gap-2 pt-2">
                        <button onClick={() => handleProcessWithdrawal(w.id, 'completed')} className="py-2.5 bg-emerald-500 rounded-xl text-slate-950 font-black text-[9px] uppercase">Done</button>
                        <button onClick={() => handleProcessWithdrawal(w.id, 'rejected')} className="py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-black text-[9px] uppercase">Reject</button>
                     </div>
                   )}
                 </GlassCard>
               ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/5">
                  <Search size={16} className="text-slate-500" />
                  <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs w-full font-medium" />
               </div>
               <div className="space-y-2">
                 {users.filter(u => u.email.includes(searchTerm) || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                   <div key={u.id} onClick={() => { setSelectedUser(u); setShowUserModal(true); }} className="glass-dark p-3 rounded-xl border border-white/5 flex justify-between items-center cursor-pointer hover:border-emerald-500/20 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-white/5">{u.email[0].toUpperCase()}</div>
                         <div><p className="font-black text-xs text-slate-200">{u.full_name || 'Anonymous'}</p><p className="text-[9px] text-slate-500">{u.email}</p></div>
                      </div>
                      <div className="text-right">
                         <p className="text-emerald-400 font-black text-sm">৳{u.balance.toFixed(2)}</p>
                         <p className="text-[8px] text-slate-600 font-black uppercase">Refs: {u.referral_count}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
              <GlassCard className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-4"><Megaphone size={16} className="text-blue-400"/><h3 className="text-xs font-black uppercase tracking-widest">Notice & Comms</h3></div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Banner Text</label>
                  <input type="text" value={settings.notice_text || ''} onChange={e => setSettings({...settings, notice_text: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Support Widget URL (Telegram/WhatsApp)</label>
                  <input type="text" value={settings.support_url || ''} onChange={e => setSettings({...settings, support_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Global News (HTML)</label>
                  <textarea value={settings.global_notice || ''} onChange={e => setSettings({...settings, global_notice: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-emerald-500 h-24 font-mono" />
                </div>
              </GlassCard>

              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5 pb-2">Economy</h3>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-600 uppercase">Min Withdraw</label>
                    <input type="number" value={settings.min_withdrawal} onChange={e => setSettings({...settings, min_withdrawal: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-600 uppercase">Act. Fee</label>
                    <input type="number" value={settings.activation_fee} onChange={e => setSettings({...settings, activation_fee: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs" />
                  </div>
                </GlassCard>
                <GlassCard className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5 pb-2">System</h3>
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-white">Maint.</span>
                      <button onClick={() => setSettings({...settings, is_maintenance: !settings.is_maintenance})} className={`w-8 h-4 rounded-full relative transition-colors ${settings.is_maintenance ? 'bg-red-500' : 'bg-slate-700'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.is_maintenance ? 'left-4.5' : 'left-0.5'}`} /></button>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-white">Act. Req</span>
                      <button onClick={() => setSettings({...settings, require_activation: !settings.require_activation})} className={`w-8 h-4 rounded-full relative transition-colors ${settings.require_activation ? 'bg-emerald-500' : 'bg-slate-700'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.require_activation ? 'left-4.5' : 'left-0.5'}`} /></button>
                   </div>
                </GlassCard>
              </div>

              <button onClick={async () => {
                setProcessingId('settings');
                await supabase.from('system_settings').update(settings).eq('id', 1);
                setProcessingId(null);
                alert('Saved');
              }} className="w-full py-4 bg-gradient-primary rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                {processingId === 'settings' ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save All Changes
              </button>
            </div>
          )}
        </>
      )}

      {/* User Inspection Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[120] bg-slate-950/98 backdrop-blur-xl flex items-end sm:items-center justify-center p-4">
           <div className="glass w-full max-w-md rounded-3xl border-white/10 shadow-3xl animate-in slide-in-from-bottom duration-300">
              <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center font-black text-slate-950">{selectedUser.email[0].toUpperCase()}</div>
                    <div><h3 className="font-black text-white">{selectedUser.full_name}</h3><p className="text-[10px] text-slate-500 uppercase">{selectedUser.email}</p></div>
                  </div>
                  <button onClick={() => setShowUserModal(false)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-slate-400">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Balance</p>
                      <p className="text-2xl font-black text-white">৳{selectedUser.balance.toFixed(2)}</p>
                   </div>
                   <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Refs</p>
                      <p className="text-2xl font-black text-white">{selectedUser.referral_count}</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Quick Balance Mod</p>
                   <div className="flex gap-2">
                      <input type="number" value={balanceChange} onChange={e => setBalanceChange(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-black outline-none" placeholder="+/- 10" />
                      <button onClick={handleAdjustBalance} className="px-4 bg-emerald-500 rounded-xl text-slate-950 font-black text-[10px] uppercase">Apply</button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => handleUpdateUser({ is_banned: !selectedUser.is_banned })} className={`py-3 rounded-xl font-black text-[9px] uppercase border ${selectedUser.is_banned ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      {selectedUser.is_banned ? 'Unban User' : 'Ban User'}
                   </button>
                   <button onClick={() => handleUpdateUser({ role: selectedUser.role === 'admin' ? 'user' : 'admin' })} className="py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl font-black text-[9px] uppercase">
                      {selectedUser.role === 'admin' ? 'Demote' : 'Make Admin'}
                   </button>
                </div>
                <div className="pt-4 border-t border-white/5"><p className="text-[8px] font-bold text-slate-600 uppercase">Joined: {new Date(selectedUser.created_at).toLocaleString()}</p></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

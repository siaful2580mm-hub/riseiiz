
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ArrowLeft, Clock, Loader2, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Withdrawal } from '../types.ts';

const WithdrawalHistory: React.FC = () => {
  const { profile, t } = useAuth();
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (!profile?.id) return;
      try {
        const { data, error } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setWithdrawals(data || []);
      } catch (err) {
        console.error("Error fetching withdrawal history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [profile]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-emerald-400" size={16} />;
      case 'rejected': return <XCircle className="text-red-400" size={16} />;
      case 'processing': return <Clock className="text-blue-400" size={16} />;
      default: return <AlertCircle className="text-amber-400" size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Paid';
      case 'rejected': return 'Rejected';
      case 'processing': return 'Processing';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
           <CreditCard className="text-[#00f2ff]" /> {t.withdraw_history}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00f2ff]" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-20 space-y-4 glass rounded-3xl border-dashed border-white/10">
           <Clock size={48} className="mx-auto text-slate-700" />
           <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No withdrawal requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <GlassCard key={w.id} className="space-y-4 border-white/5">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xl font-black text-white">৳{w.amount}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{w.method}</span>
                       <span className="text-slate-700">•</span>
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{w.wallet_number}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusColor(w.status)}`}>
                    {getStatusIcon(w.status)}
                    {getStatusLabel(w.status)}
                  </div>
               </div>
               
               <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[9px] text-slate-500 font-bold">{new Date(w.created_at).toLocaleString('bn-BD')}</span>
                  {w.status === 'rejected' && (
                    <span className="text-[9px] text-red-400 italic font-bold">Check with support</span>
                  )}
               </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;

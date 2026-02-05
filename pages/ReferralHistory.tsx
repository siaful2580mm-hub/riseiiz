
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ArrowLeft, UserPlus, Clock, ChevronRight, Loader2, Users } from 'lucide-react';
import { Profile } from '../types.ts';

const ReferralHistory: React.FC = () => {
  const { profile, t } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!profile?.referral_code) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, full_name, created_at, is_active')
          .eq('referred_by', profile.referral_code)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setReferrals(data || []);
      } catch (err) {
        console.error("Error fetching referrals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
           <Users className="text-[#00f2ff]" /> {t.ref_history}
        </h2>
      </div>

      <GlassCard className="bg-gradient-to-br from-[#7b61ff]/10 to-[#00f2ff]/10">
        <div className="flex justify-between items-center">
           <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{t.total_ref}</span>
           <span className="text-3xl font-black text-white">{profile?.referral_count || 0}</span>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00f2ff]" /></div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-20 space-y-4 glass rounded-3xl border-dashed border-white/10">
           <UserPlus size={48} className="mx-auto text-slate-700" />
           <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{t.no_ref_msg}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((ref, idx) => (
            <GlassCard key={idx} className="flex justify-between items-center py-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-white/5">
                    {ref.email[0].toUpperCase()}
                  </div>
                  <div>
                     <p className="font-bold text-sm text-slate-200">{ref.full_name || 'Riseii Member'}</p>
                     <p className="text-[10px] text-slate-500 flex items-center gap-1">
                       <Clock size={10} /> {new Date(ref.created_at).toLocaleDateString()}
                     </p>
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                 ref.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-white/5'
               }`}>
                 {ref.is_active ? 'Active' : 'Joined'}
               </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralHistory;

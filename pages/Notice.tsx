import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { Megaphone, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard.tsx';

const Notice: React.FC = () => {
  const [notice, setNotice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotice = async () => {
      const { data } = await supabase.from('system_settings').select('global_notice').single();
      if (data) setNotice(data.global_notice || 'No announcements yet.');
      setLoading(false);
    };
    fetchNotice();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronLeft />
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
           <Megaphone className="text-[#00f2ff]" /> Global Notice
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00f2ff]" /></div>
      ) : (
        <GlassCard className="prose prose-invert max-w-none">
          <div 
            className="text-slate-300 leading-relaxed space-y-4 text-sm"
            dangerouslySetInnerHTML={{ __html: notice }}
          />
        </GlassCard>
      )}
    </div>
  );
};

export default Notice;
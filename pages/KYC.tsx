
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, FileText, Upload, Camera, CheckCircle2, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';

const IMGBB_API_KEY = '5e66705a72b74bc10253029076d35cca';

const KYC: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: ''
  });

  if (profile?.kyc_status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
          <FileText className="text-blue-400" size={40} />
        </div>
        <h2 className="text-2xl font-black">KYC Under Review</h2>
        <p className="text-slate-400 max-w-xs">Our team is verifying your documents. This usually takes 24-48 hours. We'll notify you once verified.</p>
        <button onClick={() => navigate('/profile')} className="mt-4 px-6 py-2 bg-slate-800 rounded-xl font-bold text-sm">Back to Profile</button>
      </div>
    );
  }

  if (profile?.kyc_status === 'verified') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="text-emerald-400" size={40} />
        </div>
        <h2 className="text-2xl font-black text-emerald-400">Account Verified</h2>
        <p className="text-slate-400 max-w-xs">Congratulations! Your identity has been verified. You now have full access to all features.</p>
        <button onClick={() => navigate('/profile')} className="mt-4 px-6 py-2 bg-slate-800 rounded-xl font-bold text-sm">Back to Profile</button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadToImgBB = async (imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error('Image upload failed');
    return data.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !profile) return;

    setLoading(true);
    try {
      // 1. Upload ID Image to ImgBB
      const imageUrl = await uploadToImgBB(file);

      // 2. Update Profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_full_name: formData.fullName,
          kyc_id_number: formData.idNumber,
          kyc_document_url: imageUrl,
          kyc_status: 'pending'
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      alert('KYC submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronLeft />
        </button>
        <h2 className="text-2xl font-black">Identity Verification</h2>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-4">
        <ShieldCheck className="text-emerald-400 shrink-0" size={24} />
        <p className="text-xs text-emerald-100/70 leading-relaxed">
          Verify your identity to unlock higher withdrawal limits and premium tasks. Your data is encrypted and used only for verification purposes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassCard className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal Full Name</label>
            <input 
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="As per NID / Passport"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID Card Number</label>
            <input 
              type="text"
              required
              value={formData.idNumber}
              onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
              placeholder="NID or Passport Number"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID Document Photo</label>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden" 
                id="doc-upload" 
              />
              <label 
                htmlFor="doc-upload"
                className="w-full h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all bg-white/5 overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="ID Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={32} className="text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
                    <span className="text-xs font-bold text-slate-400">Click to capture or upload photo</span>
                    <span className="text-[10px] text-slate-600 mt-1">Clear photo of Front Side</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </GlassCard>

        <button 
          type="submit"
          disabled={loading || !file || !formData.fullName || !formData.idNumber}
          className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-slate-950"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          SUBMIT FOR VERIFICATION
        </button>
      </form>
    </div>
  );
};

export default KYC;

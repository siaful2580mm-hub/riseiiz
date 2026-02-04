
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import GlassCard from '../components/GlassCard.tsx';
import { ShieldCheck, FileText, Upload, Camera, CheckCircle2, Loader2, AlertCircle, ChevronLeft, User as UserIcon, Calendar, MapPin, Phone, Briefcase } from 'lucide-react';

const IMGBB_API_KEY = '5e66705a72b74bc10253029076d35cca';

const KYC: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    age: '',
    dob: '',
    address: '',
    phone: '',
    profession: ''
  });

  if (profile?.kyc_status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
          <FileText className="text-blue-400" size={40} />
        </div>
        <h2 className="text-2xl font-black">KYC Under Review</h2>
        <p className="text-slate-400 max-w-xs">Our team is verifying your information. This usually takes 24-48 hours. We'll notify you once verified.</p>
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
    if (!profile) return;

    setLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        imageUrl = await uploadToImgBB(file);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_full_name: formData.fullName,
          kyc_age: parseInt(formData.age),
          kyc_dob: formData.dob,
          kyc_address: formData.address,
          kyc_phone: formData.phone,
          kyc_profession: formData.profession,
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
        <h2 className="text-2xl font-black">Account Verification</h2>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-4">
        <ShieldCheck className="text-emerald-400 shrink-0" size={24} />
        <p className="text-xs text-emerald-100/70 leading-relaxed">
          Provide your accurate personal information to unlock full account features. This data is only used for identity verification.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pb-10">
        <GlassCard className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserIcon size={12} /> Full Name
            </label>
            <input 
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="Your full legal name"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Age
              </label>
              <input 
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="Ex: 25"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Date of Birth
              </label>
              <input 
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Phone size={12} /> Phone Number
            </label>
            <input 
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="01XXXXXXXXX"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={12} /> Profession
            </label>
            <input 
              type="text"
              required
              value={formData.profession}
              onChange={(e) => setFormData({...formData, profession: e.target.value})}
              placeholder="Ex: Student, Teacher, etc."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} /> Permanent Address
            </label>
            <textarea 
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Your full address..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm h-24 focus:border-emerald-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Camera size={12} /> Self Photo (Optional)
            </label>
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
                className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all bg-white/5 overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="ID Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={32} className="text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Click to upload photo</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </GlassCard>

        <button 
          type="submit"
          disabled={loading || !formData.fullName || !formData.age || !formData.dob || !formData.address || !formData.phone || !formData.profession}
          className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-slate-950"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          SUBMIT INFORMATION
        </button>
      </form>
    </div>
  );
};

export default KYC;

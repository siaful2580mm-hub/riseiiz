
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { isSupabaseConfigured } from './services/supabase.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Tasks from './pages/Tasks.tsx';
import Wallet from './pages/Wallet.tsx';
import Profile from './pages/Profile.tsx';
import Admin from './pages/Admin.tsx';
import Auth from './pages/Auth.tsx';
import KYC from './pages/KYC.tsx';
import Activation from './pages/Activation.tsx';
import { Loader2, AlertTriangle, ExternalLink, Zap } from 'lucide-react';

const SetupRequired: React.FC = () => (
  <div className="min-h-screen bg-[#05060f] flex items-center justify-center p-6 text-white">
    <div className="max-w-md w-full glass p-8 rounded-3xl border-[#00f2ff]/30 text-center space-y-6">
      <div className="w-16 h-16 bg-[#00f2ff]/10 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="text-[#00f2ff]" size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter">সেটআপ প্রয়োজন</h2>
        <p className="text-slate-400 text-sm">
          দয়া করে আপনার Supabase credentials চেক করুন।
        </p>
      </div>
      <a 
        href="https://supabase.com" 
        target="_blank" 
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-primary text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest"
      >
        SUPABASE এ যান <ExternalLink size={16} />
      </a>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-[#00f2ff]/10 rounded-3xl flex items-center justify-center animate-pulse">
             <Zap size={40} className="text-[#00f2ff] fill-current" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent">RISEII PRO</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f2ff]/40">অপেক্ষা করুন...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/activation" element={<Activation />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
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
import { Loader2, AlertTriangle, ExternalLink, Zap, Terminal, RefreshCcw } from 'lucide-react';

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
  const { user, loading, debugInfo } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => {
        setTimedOut(true);
      }, 8000); // 8 seconds timeout
    } else {
      setTimedOut(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-xs w-full">
          <div className="w-24 h-24 bg-[#00f2ff]/10 rounded-[2rem] flex items-center justify-center animate-pulse border border-[#00f2ff]/20">
             <Zap size={48} className="text-[#00f2ff] fill-current" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#00f2ff] to-[#7b61ff] bg-clip-text text-transparent">RISEII PRO</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f2ff]/60 animate-pulse">সংযোগ করা হচ্ছে...</p>
          </div>

          {timedOut && (
            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] text-red-400 font-bold uppercase text-center">সার্ভার থেকে রেসপন্স আসতে দেরি হচ্ছে</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
              >
                <RefreshCcw size={14} /> আবার চেষ্টা করুন
              </button>
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="w-full py-2 text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1"
              >
                <Terminal size={10} /> {showDebug ? "Debug Log লুকান" : "Debug Log দেখুন"}
              </button>
            </div>
          )}

          {showDebug && (
            <div className="w-full bg-black/60 border border-white/5 p-4 rounded-xl font-mono text-[9px] text-emerald-500 overflow-y-auto max-h-40 space-y-1">
              {debugInfo.map((log, i) => (
                <div key={i} className="border-l border-emerald-500/30 pl-2 leading-tight">{log}</div>
              ))}
            </div>
          )}
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
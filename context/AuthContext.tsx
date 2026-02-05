import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.ts';
import { Profile } from '../types.ts';
import { TRANSLATIONS } from '../constants.tsx';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  t: any;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const t = TRANSLATIONS.bn;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;

      if (!data && user) {
        // Fallback for missing profile
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { data: created } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Member',
            referral_code: newCode,
            role: user.email === 'rakibulislamrovin@gmail.com' ? 'admin' : 'user'
          })
          .select()
          .maybeSingle();
        setProfile(created || null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      if (mounted) setUser(u);
      if (u) await fetchProfile(u.id);
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      if (mounted) {
        setLoading(true);
        setUser(u);
        if (u) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, t, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
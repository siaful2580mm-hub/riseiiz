
import React from 'react';
import { Youtube, Facebook, Instagram, Twitter, Globe, Play } from 'lucide-react';

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="text-red-500" />,
  facebook: <Facebook className="text-blue-500" />,
  instagram: <Instagram className="text-pink-500" />,
  twitter: <Twitter className="text-sky-400" />,
  tiktok: <Play className="text-white fill-current" />,
  other: <Globe className="text-slate-400" />
};

export const MIN_WITHDRAWAL = 250;
export const REFERRAL_BONUS = 5;
export const ACTIVATION_FEE = 30;
export const MIN_REFERRALS_FOR_WITHDRAW = 3;

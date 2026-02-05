
import React from 'react';
import { Youtube, Facebook, Instagram, Twitter, Globe, Play } from 'lucide-react';

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="text-red-500" />,
  facebook: <Facebook className="text-blue-500" />,
  instagram: <Instagram className="text-pink-500" />,
  twitter: <Twitter className="text-cyan-400" />,
  tiktok: <Play className="text-white fill-current" />,
  other: <Globe className="text-slate-400" />
};

export const MIN_WITHDRAWAL = 250;
export const REFERRAL_BONUS = 5;
export const ACTIVATION_FEE = 30;
export const MIN_REFERRALS_FOR_WITHDRAW = 3;
export const DAILY_SIGNUP_LIMIT = 200;

export const TRANSLATIONS = {
  bn: {
    home: "হোম",
    tasks: "কাজসমূহ",
    wallet: "ওয়ালেট",
    profile: "প্রোফাইল",
    admin_panel: "অ্যাডমিন",
    total_balance: "মোট ব্যালেন্স",
    referrals: "রেফারাল",
    active_opps: "চলমান কাজ",
    view_all: "সব কাজ দেখুন",
    earn_reward: "পুরস্কার জিতুন",
    withdraw: "টাকা উত্তোলন",
    payout_req: "উত্তোলনের অনুরোধ",
    amount: "টাকার পরিমাণ",
    method: "পদ্ধতি",
    wallet_num: "নম্বর (বিকাশ/নগদ)",
    recent_tx: "সাম্প্রতিক লেনদেন",
    support: "সাপোর্ট",
    kyc_status: "KYC অবস্থা",
    verify_now: "ভেরিফাই করুন",
    sign_out: "লগ আউট",
    welcome_admin: "স্বাগতম এডমিন",
    daily_tasks: "দৈনিক কাজ",
    all_platforms: "সব প্ল্যাটফর্ম",
    newest: "নতুনগুলো",
    high_reward: "বেশি ইনকাম",
    pending_verif: "যাচাইধীন আছে",
    completed: "কাজ সম্পন্ন",
    rejected: "বাতিল হয়েছে",
    launch_task: "কাজ শুরু করুন",
    submit_proof: "প্রমাণ জমা দিন",
    instruction: "নির্দেশাবলী",
    go_target: "লিংকে যান",
    copy_caption: "ক্যাপশন কপি করুন",
    download_asset: "ছবি ডাউনলোড করুন",
    submit_now: "জমা দিন",
    share_code: "কোড কপি",
    copy_link: "লিংক কপি",
    ref_code: "রেফারাল কোড",
    ref_link: "রেফারাল লিংক",
    total_ref: "মোট রেফারাল",
    invite: "বন্ধুদের ইনভাইট করুন",
    bonuses: "বোনাস ও পুরস্কার",
    verify_id: "পরিচয় যাচাইকরণ",
    identity_verif: "KYC ভেরিফিকেশন",
    activation_title: "অ্যাকাউন্ট অ্যাক্টিভেশন",
    activation_pending: "অ্যাক্টিভেশন পেন্ডিং",
    unlock_features: "সব ফিচার আনলক করুন",
    submit_activation: "অ্যাক্টিভেশনের জন্য জমা দিন",
    min_bal_error: "উত্তোলনের জন্য কমপক্ষে ২৫০ টাকা প্রয়োজন",
    ref_error: "উত্তোলনের জন্য অন্তত ৩টি রেফারাল প্রয়োজন",
    account_not_active: "অ্যাকাউন্ট সক্রিয় নয়",
    back: "পিছনে",
    auth_welcome: "Riseii Pro-তে স্বাগতম",
    auth_login: "লগইন করুন",
    auth_signup: "অ্যাকাউন্ট তৈরি করুন",
    auth_no_account: "অ্যাকাউন্ট নেই? সাইন আপ করুন",
    auth_has_account: "অ্যাকাউন্ট আছে? লগইন করুন",
    full_name: "পুরো নাম",
    email: "ইমেইল অ্যাড্রেস",
    password: "পাসওয়ার্ড",
    signup_success: "ইমেইল চেক করুন (স্প্যাম ফোল্ডারও দেখুন)",
    kyc_pending_desc: "আমাদের টিম আপনার তথ্য যাচাই করছে। এতে ২৪-৪৮ ঘণ্টা সময় লাগতে পারে।",
    kyc_verified_desc: "অভিনন্দন! আপনার পরিচয় যাচাই করা হয়েছে।",
    age: "বয়স",
    dob: "জন্ম তারিখ",
    phone: "ফোন নম্বর",
    profession: "পেশা",
    address: "বর্তমান ঠিকানা",
    upload_photo: "আপনার ছবি আপলোড করুন",
    submit_info: "তথ্য জমা দিন",
    signup_limit_reached: "দুঃখিত, আজকের সাইন আপের সীমা পূর্ণ হয়ে গেছে। দয়া করে আগামীকাল আবার চেষ্টা করুন।"
  }
};

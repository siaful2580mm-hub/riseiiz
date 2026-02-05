
export type UserRole = 'user' | 'admin';
export type KYCStatus = 'none' | 'pending' | 'verified';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type TaskCategory = 'youtube' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'other';
export type ProofType = 'image' | 'text';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  balance: number;
  role: UserRole;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  is_banned: boolean;
  is_active: boolean;
  kyc_status: KYCStatus;
  kyc_full_name: string | null;
  kyc_id_number: string | null;
  kyc_document_url: string | null;
  kyc_age?: number;
  kyc_dob?: string;
  kyc_address?: string;
  kyc_phone?: string;
  kyc_profession?: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  reward_amount: number;
  link: string;
  proof_type: ProofType;
  copy_text?: string;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface Submission {
  id: number;
  task_id: number;
  user_id: string;
  proof_data: string;
  status: SubmissionStatus;
  created_at: string;
  task?: Task;
  user?: Profile;
}

export interface Withdrawal {
  id: number;
  user_id: string;
  amount: number;
  method: string;
  wallet_number: string;
  status: WithdrawalStatus;
  created_at: string;
  user?: Profile;
}

export interface Activation {
  id: number;
  user_id: string;
  method: string;
  transaction_id: string;
  status: SubmissionStatus;
  created_at: string;
  user?: Profile;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: 'earning' | 'withdraw' | 'bonus' | 'activation';
  amount: number;
  description: string;
  created_at: string;
}

export interface SystemSettings {
  id: number;
  notice_text: string;
  notice_link: string;
  global_notice: string;
  banner_ads_code: string;
  min_withdrawal: number;
  activation_fee: number;
  referral_reward: number;
  support_url: string;
  is_maintenance: boolean;
  require_activation: boolean;
}

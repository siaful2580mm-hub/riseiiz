
export type UserRole = 'user' | 'admin';
export type KYCStatus = 'none' | 'pending' | 'verified';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type TaskCategory = 'youtube' | 'facebook' | 'instagram' | 'twitter' | 'other';
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
  is_active: boolean;
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
  banner_ads_code: string;
  min_withdrawal: number;
  activation_fee: number;
}


import { Profile, Task, Submission, Withdrawal, Transaction, SystemSettings } from '../types';

// Initial Mock Data
// Fix: Added missing kyc_full_name, kyc_id_number, and kyc_document_url properties to mockUser
export const mockUser: Profile = {
  id: 'user-123',
  email: 'john@example.com',
  full_name: 'John Doe',
  avatar_url: 'https://picsum.photos/200',
  balance: 145.50,
  role: 'user',
  referral_code: 'RISE777',
  referred_by: null,
  referral_count: 5,
  is_banned: false,
  is_active: true,
  kyc_status: 'verified',
  kyc_full_name: 'John Doe',
  kyc_id_number: '1234567890',
  kyc_document_url: 'https://picsum.photos/400/300',
  created_at: new Date().toISOString()
};

export const mockAdmin: Profile = {
  ...mockUser,
  id: 'admin-123',
  email: 'admin@riseii.pro',
  full_name: 'Admin Master',
  role: 'admin'
};

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Subscribe to our YouTube Channel',
    description: 'Visit the link, subscribe, and upload a screenshot of your subscription.',
    category: 'youtube',
    reward_amount: 5,
    link: 'https://youtube.com',
    proof_type: 'image',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Like & Share Facebook Post',
    description: 'Like the latest post on our FB page and share it to your timeline.',
    category: 'facebook',
    reward_amount: 3.5,
    link: 'https://facebook.com',
    proof_type: 'image',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Follow Instagram Profile',
    description: 'Follow @riseiipro on Instagram and provide your username.',
    category: 'instagram',
    reward_amount: 2,
    link: 'https://instagram.com',
    proof_type: 'text',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export const mockSubmissions: Submission[] = [];

// Fix: Added missing properties 'global_notice', 'is_maintenance', and 'require_activation' to mockSettings to satisfy SystemSettings interface
export const mockSettings: SystemSettings = {
  id: 1,
  notice_text: 'Welcome to Riseii Pro! Complete tasks daily to earn massive rewards. Minimum withdrawal is 250 BDT.',
  notice_link: 'https://t.me/riseiipro',
  global_notice: '<h1>Welcome!</h1><p>Join our community today and start earning.</p>',
  banner_ads_code: '<div>Ad Space</div>',
  min_withdrawal: 250,
  activation_fee: 30,
  is_maintenance: false,
  require_activation: false
};

// Simple Mock Store
class MockStore {
  user: Profile = mockUser;
  tasks: Task[] = mockTasks;
  submissions: Submission[] = mockSubmissions;
  withdrawals: Withdrawal[] = [];
  transactions: Transaction[] = [];
  settings: SystemSettings = mockSettings;

  updateUser(data: Partial<Profile>) {
    this.user = { ...this.user, ...data };
  }

  submitTask(taskId: number, proof: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    const sub: Submission = {
      id: Math.floor(Math.random() * 1000000),
      task_id: taskId,
      user_id: this.user.id,
      proof_data: proof,
      status: 'pending',
      created_at: new Date().toISOString(),
      task
    };
    this.submissions.push(sub);
  }

  approveSubmission(subId: number) {
    const sub = this.submissions.find(s => s.id === subId);
    if (sub && sub.status === 'pending') {
      sub.status = 'approved';
      if (sub.task) {
        this.user.balance += sub.task.reward_amount;
        this.transactions.push({
          id: Math.random(),
          user_id: this.user.id,
          type: 'earning',
          amount: sub.task.reward_amount,
          description: `Task reward: ${sub.task.title}`,
          created_at: new Date().toISOString()
        });
      }
    }
  }
}

export const db = new MockStore();

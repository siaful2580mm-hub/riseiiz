
-- [Previous tables remain the same...]

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  notice_text TEXT,
  notice_link TEXT,
  global_notice TEXT, 
  banner_ads_code TEXT,
  min_withdrawal NUMERIC DEFAULT 250,
  activation_fee NUMERIC DEFAULT 30,
  is_maintenance BOOLEAN DEFAULT false,
  require_activation BOOLEAN DEFAULT true, -- NEW: Control if activation is required
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings if not exists
INSERT INTO system_settings (id, notice_text, notice_link, global_notice, is_maintenance, require_activation)
VALUES (1, 'Welcome to Riseii Pro!', '/notice', '<h1>Platform Rules</h1><p>Welcome to our global notice page. Please follow all instructions carefully.</p>', false, true)
ON CONFLICT (id) DO NOTHING;

-- Policies for settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON system_settings;
CREATE POLICY "Settings are viewable by everyone" ON system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
CREATE POLICY "Admins can update settings" ON system_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

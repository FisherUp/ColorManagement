-- ============================================================
-- 环氧磨石颜色管理系统 - 用户认证与角色管理
-- 在 01_schema.sql 之后执行
-- ============================================================

-- ============================================================
-- 1. 用户档案表 (user_profiles)
-- 与 Supabase auth.users 关联，存储角色和显示信息
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',          -- 显示名称（中文姓名）
  role TEXT NOT NULL DEFAULT 'viewer',   -- 角色：admin / sales / formulator / viewer
  avatar_url TEXT DEFAULT '',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,        -- 是否激活（管理员可禁用）
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'sales', 'formulator', 'viewer'))
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 自动更新 updated_at
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. 邀请记录表 (invitations)
-- 管理员邀请用户的记录
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,              -- 接受邀请的时间
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_invitation_role CHECK (role IN ('admin', 'sales', 'formulator', 'viewer'))
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- ============================================================
-- 3. 自动创建用户档案的触发器
-- 当新用户注册/接受邀请时，自动在 user_profiles 中创建记录
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
  user_role TEXT := 'viewer';
  user_name TEXT := '';
  inviter_id UUID := NULL;
BEGIN
  -- 查找是否有对应的邀请记录
  SELECT * INTO invitation_record
  FROM invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    user_role := invitation_record.role;
    inviter_id := invitation_record.invited_by;
    -- 标记邀请已接受
    UPDATE invitations SET accepted_at = NOW() WHERE id = invitation_record.id;
  END IF;

  -- 从用户元数据中获取显示名称
  user_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');

  INSERT INTO user_profiles (id, email, display_name, role, invited_by)
  VALUES (NEW.id, NEW.email, user_name, user_role, inviter_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定到 auth.users 的插入触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 4. RLS 策略 - user_profiles
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 用户可以读取自己的档案
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 管理员可以读取所有用户档案
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 用户可以更新自己的档案（不能改角色）
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- 管理员可以更新所有用户档案（含角色）
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 邀请表：管理员可以读写
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 5. 更新现有表的 RLS 策略 - 基于角色
-- 注意：这些策略需要先删除旧的宽松策略再创建
-- ============================================================

-- 辅助函数：获取当前用户角色
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'viewer'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 辅助函数：判断是否为管理员或配色工程师
CREATE OR REPLACE FUNCTION is_editor()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('admin', 'formulator');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 辅助函数：判断是否为管理员
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 6. 删除旧策略并创建新的角色策略
-- ============================================================

-- --- projects ---
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated update projects" ON projects;

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert projects"
  ON projects FOR INSERT
  WITH CHECK (is_editor());

CREATE POLICY "Editors can update projects"
  ON projects FOR UPDATE
  USING (is_editor());

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  USING (is_admin());

-- --- project_images ---
DROP POLICY IF EXISTS "Allow public read project_images" ON project_images;
DROP POLICY IF EXISTS "Allow authenticated insert project_images" ON project_images;
DROP POLICY IF EXISTS "Allow authenticated delete project_images" ON project_images;

CREATE POLICY "Authenticated users can read project_images"
  ON project_images FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert project_images"
  ON project_images FOR INSERT
  WITH CHECK (is_editor());

CREATE POLICY "Editors can delete project_images"
  ON project_images FOR DELETE
  USING (is_editor());

-- --- colors ---
DROP POLICY IF EXISTS "Allow public read colors" ON colors;
DROP POLICY IF EXISTS "Allow authenticated insert colors" ON colors;
DROP POLICY IF EXISTS "Allow authenticated update colors" ON colors;

CREATE POLICY "Authenticated users can read colors"
  ON colors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert colors"
  ON colors FOR INSERT
  WITH CHECK (is_editor());

CREATE POLICY "Editors can update colors"
  ON colors FOR UPDATE
  USING (is_editor());

CREATE POLICY "Admins can delete colors"
  ON colors FOR DELETE
  USING (is_admin());

-- --- color_confusions ---
DROP POLICY IF EXISTS "Allow public read color_confusions" ON color_confusions;
DROP POLICY IF EXISTS "Allow authenticated insert color_confusions" ON color_confusions;
DROP POLICY IF EXISTS "Allow authenticated delete color_confusions" ON color_confusions;

CREATE POLICY "Authenticated users can read color_confusions"
  ON color_confusions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can insert color_confusions"
  ON color_confusions FOR INSERT
  WITH CHECK (is_editor());

CREATE POLICY "Editors can delete color_confusions"
  ON color_confusions FOR DELETE
  USING (is_editor());

-- --- orders ---
DROP POLICY IF EXISTS "Allow public read orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated insert orders" ON orders;

CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sales and above can insert orders"
  ON orders FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'sales', 'formulator'));

-- --- order_items ---
DROP POLICY IF EXISTS "Allow public read order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated insert order_items" ON order_items;

CREATE POLICY "Authenticated users can read order_items"
  ON order_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sales and above can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'sales', 'formulator'));

-- --- export_logs ---
DROP POLICY IF EXISTS "Allow public read export_logs" ON export_logs;
DROP POLICY IF EXISTS "Allow authenticated insert export_logs" ON export_logs;

CREATE POLICY "Authenticated users can read export_logs"
  ON export_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sales and above can insert export_logs"
  ON export_logs FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'sales', 'formulator'));

-- ============================================================
-- 7. 创建第一个管理员的函数
-- 首次部署时调用，将指定邮箱用户设为管理员
-- ============================================================
CREATE OR REPLACE FUNCTION promote_to_admin(target_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles SET role = 'admin' WHERE email = target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

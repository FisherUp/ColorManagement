-- ============================================================
-- 环氧磨石颜色管理系统 - Supabase 数据库建表脚本
-- 执行顺序：01_schema.sql → 02_storage.sql → 03_seed_data.sql
-- 在 Supabase Dashboard → SQL Editor 中依次执行
-- ============================================================

-- 启用 UUID 扩展（Supabase 默认已启用，保险起见）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 项目表 (projects)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- 项目名称
  customer TEXT DEFAULT '',              -- 客户名称
  region TEXT DEFAULT '',                -- 地区
  owner TEXT DEFAULT '',                 -- 销售负责人
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),  -- 年份
  status TEXT DEFAULT '待确认',           -- 项目状态：试运行/生产中/待确认/已完结
  note TEXT DEFAULT '',                  -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_year ON projects(year);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================================
-- 2. 项目图片表 (project_images)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,               -- 压缩后原图URL（WebP, max 1920px）
  thumbnail_url TEXT DEFAULT '',         -- 缩略图URL（WebP, 400px宽，用于列表预览）
  sort_order INTEGER DEFAULT 0,          -- 排序
  caption TEXT DEFAULT '',               -- 图片说明
  file_size INTEGER DEFAULT 0,           -- 压缩后文件大小（字节）
  original_size INTEGER DEFAULT 0,       -- 原始文件大小（字节）
  width INTEGER DEFAULT 0,              -- 图片宽度（px）
  height INTEGER DEFAULT 0,             -- 图片高度（px）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images(project_id);

-- ============================================================
-- 3. 颜色表 (colors)
-- ============================================================
CREATE TABLE IF NOT EXISTS colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                    -- 颜色编号，如 T-082
  name TEXT NOT NULL,                    -- 完整名称，如 "T-082 浅灰白"
  description TEXT DEFAULT '',           -- 颜色描述
  set_item TEXT NOT NULL,                -- 套装 Item Code
  a_item TEXT NOT NULL,                  -- A组分 Item Code
  lab_l NUMERIC(6,2) DEFAULT 0,          -- LAB 色彩空间 - L 值
  lab_a NUMERIC(6,2) DEFAULT 0,          -- LAB 色彩空间 - a 值
  lab_b NUMERIC(6,2) DEFAULT 0,          -- LAB 色彩空间 - b 值
  confirm_date DATE,                     -- 客户确认日期
  status TEXT DEFAULT '待确认',           -- 颜色状态：可用/待确认/暂停/旧版
  swatch_css TEXT DEFAULT '',            -- 色板CSS渐变（用于前端显示）
  updated_by TEXT DEFAULT '',            -- 最近修改人
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colors_project ON colors(project_id);
CREATE INDEX IF NOT EXISTS idx_colors_code ON colors(code);
CREATE INDEX IF NOT EXISTS idx_colors_set_item ON colors(set_item);
CREATE INDEX IF NOT EXISTS idx_colors_status ON colors(status);

-- ============================================================
-- 4. 颜色易混淆关系表 (color_confusions)
-- 记录哪些颜色之间容易混淆
-- ============================================================
CREATE TABLE IF NOT EXISTS color_confusions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  confused_color_name TEXT NOT NULL,     -- 易混淆颜色名称
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_color_confusions_color ON color_confusions(color_id);

-- ============================================================
-- 5. 订单表 (orders) - 用于后续销售管理扩展
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no TEXT NOT NULL UNIQUE,          -- 确认单编号，如 CF-20260521-001
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  confirmed_by TEXT DEFAULT '',           -- 确认人
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_project ON orders(project_id);
CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);

-- ============================================================
-- 6. 订单明细表 (order_items) - 记录每个颜色的采购量
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  color_id UUID NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0,    -- 套数
  unit TEXT DEFAULT '套',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_color ON order_items(color_id);

-- ============================================================
-- 7. 导出记录表 (export_logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_no TEXT NOT NULL,
  project_name TEXT NOT NULL,
  color_count INTEGER DEFAULT 0,
  exported_by TEXT DEFAULT '',
  exported_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_colors_updated_at
  BEFORE UPDATE ON colors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. Row Level Security (RLS) 策略
-- 初期允许 anon 角色读取，后续可收紧
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_confusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（公开只读）
CREATE POLICY "Allow public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read project_images" ON project_images FOR SELECT USING (true);
CREATE POLICY "Allow public read colors" ON colors FOR SELECT USING (true);
CREATE POLICY "Allow public read color_confusions" ON color_confusions FOR SELECT USING (true);
CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public read export_logs" ON export_logs FOR SELECT USING (true);

-- 允许 authenticated 用户写入（后续可按角色细分）
CREATE POLICY "Allow authenticated insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated insert project_images" ON project_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete project_images" ON project_images FOR DELETE USING (true);
CREATE POLICY "Allow authenticated insert colors" ON colors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update colors" ON colors FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated insert color_confusions" ON color_confusions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete color_confusions" ON color_confusions FOR DELETE USING (true);
CREATE POLICY "Allow authenticated insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert export_logs" ON export_logs FOR INSERT WITH CHECK (true);

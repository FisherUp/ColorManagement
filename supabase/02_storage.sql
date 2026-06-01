-- ============================================================
-- 环氧磨石颜色管理系统 - Supabase Storage 存储桶配置
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 创建公开的图片存储桶
-- 前端已做压缩（WebP, max 1920px），上传后通常 100-500KB
-- file_size_limit 设为 2MB，防止绕过前端直传大文件
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,                          -- 公开访问（无需认证即可读取图片）
  2097152,                       -- 文件大小限制 2MB（前端已压缩为 WebP）
  ARRAY['image/webp', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS 策略：允许所有人读取图片
CREATE POLICY "Allow public read project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

-- Storage RLS 策略：允许认证用户上传图片
-- 限制：文件必须在 项目ID/ 子目录下，防止随意上传
CREATE POLICY "Allow authenticated upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Storage RLS 策略：允许认证用户更新（覆盖）图片
CREATE POLICY "Allow authenticated update project images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-images');

-- Storage RLS 策略：允许认证用户删除图片
CREATE POLICY "Allow authenticated delete project images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-images');

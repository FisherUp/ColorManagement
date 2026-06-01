import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { compressImage, generateThumbnail, formatFileSize } from "../lib/imageCompress";

/**
 * 图片上传 Hook
 * 自动压缩 + 生成缩略图 + 上传到 Supabase Storage + 写入 project_images 表
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total, fileName }

  /**
   * 上传项目图片（支持多张）
   * @param {FileList|File[]} files - 图片文件列表
   * @param {string} projectId - 项目 UUID
   * @param {object} options
   * @param {number} options.startOrder - 起始排序值
   * @returns {Promise<{success: object[], failed: object[]}>}
   */
  const uploadProjectImages = useCallback(async (files, projectId, options = {}) => {
    const { startOrder = 0 } = options;
    setUploading(true);

    const results = { success: [], failed: [] };
    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setProgress({ current: i + 1, total: fileList.length, fileName: file.name });

      try {
        // 验证文件类型
        if (!file.type.startsWith("image/")) {
          results.failed.push({ file: file.name, error: "不是图片文件" });
          continue;
        }

        // 验证原始文件大小（超过 20MB 的原片直接拒绝）
        if (file.size > 20 * 1024 * 1024) {
          results.failed.push({ file: file.name, error: "文件超过 20MB" });
          continue;
        }

        // 压缩图片
        const compressed = await compressImage(file);
        const thumb = await generateThumbnail(file);

        // 生成文件名（项目ID前缀 + 时间戳 + 随机串）
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const baseName = `${projectId}/${timestamp}-${random}`;
        const fullPath = `${baseName}.webp`;
        const thumbPath = `${baseName}-thumb.webp`;

        // 上传压缩后的原图
        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(fullPath, compressed.blob, {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000", // 1年缓存
            upsert: false,
          });

        if (uploadError) {
          results.failed.push({ file: file.name, error: uploadError.message });
          continue;
        }

        // 上传缩略图
        await supabase.storage
          .from("project-images")
          .upload(thumbPath, thumb.blob, {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000",
            upsert: false,
          });

        // 获取公开 URL
        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(fullPath);

        const { data: thumbUrlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(thumbPath);

        // 写入 project_images 表
        const { error: dbError } = await supabase.from("project_images").insert({
          project_id: projectId,
          image_url: urlData.publicUrl,
          thumbnail_url: thumbUrlData.publicUrl,
          sort_order: startOrder + i,
          caption: "",
          file_size: compressed.compressedSize,
          original_size: compressed.originalSize,
          width: compressed.width,
          height: compressed.height,
        });

        if (dbError) {
          // 上传成功但写入数据库失败，尝试删除已上传的文件
          await supabase.storage.from("project-images").remove([fullPath, thumbPath]);
          results.failed.push({ file: file.name, error: dbError.message });
          continue;
        }

        results.success.push({
          file: file.name,
          url: urlData.publicUrl,
          thumbnailUrl: thumbUrlData.publicUrl,
          originalSize: formatFileSize(compressed.originalSize),
          compressedSize: formatFileSize(compressed.compressedSize),
          ratio: `${Math.round((1 - compressed.compressedSize / compressed.originalSize) * 100)}%`,
        });
      } catch (err) {
        results.failed.push({ file: file.name, error: err.message });
      }
    }

    setUploading(false);
    setProgress(null);
    return results;
  }, []);

  /**
   * 删除项目图片
   * @param {string} imageId - project_images 表的 UUID
   * @param {string} imageUrl - 图片完整 URL，用于从 Storage 中删除
   */
  const deleteProjectImage = useCallback(async (imageId, imageUrl) => {
    // 从 URL 中提取存储路径
    const storagePath = extractStoragePath(imageUrl);

    if (storagePath) {
      // 删除原图和缩略图
      const thumbPath = storagePath.replace(".webp", "-thumb.webp");
      await supabase.storage.from("project-images").remove([storagePath, thumbPath]);
    }

    // 删除数据库记录
    const { error } = await supabase.from("project_images").delete().eq("id", imageId);
    if (error) {
      console.error("删除图片记录失败:", error);
      return false;
    }
    return true;
  }, []);

  return { uploadProjectImages, deleteProjectImage, uploading, progress };
}

/**
 * 从 Supabase Storage 公开 URL 中提取文件路径
 */
function extractStoragePath(url) {
  const marker = "/object/public/project-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/**
 * 图片压缩工具
 * 上传前在客户端压缩图片，节省 Supabase Storage 空间和带宽
 *
 * 策略：
 * - 最大宽度 1920px（案例图片够用）
 * - 输出 WebP 格式（体积比 JPEG 小 25-35%）
 * - 质量 0.8（视觉无明显损失）
 * - 同时生成缩略图（400px 宽，用于列表预览）
 */

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1440;
const THUMB_WIDTH = 400;
const QUALITY = 0.8;
const THUMB_QUALITY = 0.7;

/**
 * 压缩单张图片
 * @param {File} file - 原始图片文件
 * @param {object} options - 可选配置
 * @param {number} options.maxWidth - 最大宽度，默认 1920
 * @param {number} options.maxHeight - 最大高度，默认 1440
 * @param {number} options.quality - 压缩质量 0-1，默认 0.8
 * @param {string} options.format - 输出格式，默认 'image/webp'
 * @returns {Promise<{blob: Blob, width: number, height: number, originalSize: number, compressedSize: number}>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    quality = QUALITY,
    format = "image/webp",
  } = options;

  const originalSize = file.size;

  // 加载图片
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);

  // 使用 Canvas 压缩
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, format, quality);

  // 如果压缩后反而更大（小文件可能出现），使用原文件
  if (blob.size >= originalSize && originalSize < 500 * 1024) {
    return {
      blob: file,
      width: img.width,
      height: img.height,
      originalSize,
      compressedSize: originalSize,
    };
  }

  return {
    blob,
    width,
    height,
    originalSize,
    compressedSize: blob.size,
  };
}

/**
 * 生成缩略图
 * @param {File|Blob} file - 图片文件
 * @param {object} options
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
export async function generateThumbnail(file, options = {}) {
  const {
    maxWidth = THUMB_WIDTH,
    quality = THUMB_QUALITY,
    format = "image/webp",
  } = options;

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxWidth);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, format, quality);
  return { blob, width, height };
}

/**
 * 加载图片为 HTMLImageElement
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = URL.createObjectURL(file instanceof Blob ? file : file);
  });
}

/**
 * 计算缩放后的尺寸，保持宽高比
 */
function calculateDimensions(origWidth, origHeight, maxWidth, maxHeight) {
  let width = origWidth;
  let height = origHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Canvas 转 Blob
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob 失败"));
      },
      type,
      quality
    );
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

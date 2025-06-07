/**
 * 图片压缩工具的主要 JavaScript 文件
 * 实现图片上传、压缩和下载功能
 */

// DOM 元素
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片数据
let currentFile = null;
let compressedBlob = null;

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 点击上传按钮触发文件选择
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    // 文件选择变化时处理图片
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽相关事件
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // 质量滑块变化时重新压缩
    qualitySlider.addEventListener('input', handleQualityChange);
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', handleDownload);
    
    // 初始化下载按钮状态
    downloadBtn.disabled = true;
    downloadBtn.textContent = '请先上传图片';
}

/**
 * 处理文件选择
 * @param {Event} event - 文件选择事件
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        await processImage(file);
    }
}

/**
 * 处理拖拽悬停
 * @param {DragEvent} event - 拖拽事件
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.add('drag-over');
}

/**
 * 处理拖拽离开
 * @param {DragEvent} event - 拖拽事件
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove('drag-over');
}

/**
 * 处理文件拖放
 * @param {DragEvent} event - 拖拽事件
 */
async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        await processImage(file);
    }
}

/**
 * 处理图片压缩质量变化
 */
async function handleQualityChange() {
    if (currentFile) {
        // 更新质量显示
        const quality = parseInt(qualitySlider.value) / 100;
        qualityValue.textContent = `${qualitySlider.value}%`;
        
        // 显示加载状态
        downloadBtn.disabled = true;
        downloadBtn.textContent = '正在压缩...';
        compressedImage.style.opacity = '0.5';
        
        // 执行压缩
        await compressImage(currentFile, quality);
        
        // 恢复图片显示
        compressedImage.style.opacity = '1';
    }
}

/**
 * 处理图片下载
 */
function handleDownload() {
    if (compressedBlob) {
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_${currentFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

/**
 * 处理图片文件
 * @param {File} file - 图片文件对象
 */
async function processImage(file) {
    currentFile = file;
    
    // 显示原图
    const originalUrl = URL.createObjectURL(file);
    originalImage.src = originalUrl;
    originalSize.textContent = formatFileSize(file.size);
    
    // 压缩图片
    const quality = parseInt(qualitySlider.value) / 100;
    await compressImage(file, quality);
    
    // 显示预览区域
    uploadSection.style.display = 'none';
    previewSection.style.display = 'block';
}

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {number} quality - 压缩质量（0-1）
 */
async function compressImage(file, quality) {
    try {
        // 更新压缩选项
        const options = {
            maxSizeMB: 10, // 增加最大文件大小限制
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: quality,
            // 添加更多压缩选项
            initialQuality: quality,
            alwaysKeepResolution: true, // 保持原始分辨率
            fileType: file.type // 保持原始文件类型
        };
        
        // 压缩前释放之前的 URL
        if (compressedImage.src) {
            URL.revokeObjectURL(compressedImage.src);
        }
        
        // 执行压缩
        compressedBlob = await imageCompression(file, options);
        
        // 创建新的 URL 并更新图片
        const compressedUrl = URL.createObjectURL(compressedBlob);
        compressedImage.src = compressedUrl;
        
        // 更新文件大小显示
        const originalSizeNum = file.size;
        const compressedSizeNum = compressedBlob.size;
        originalSize.textContent = formatFileSize(originalSizeNum);
        compressedSize.textContent = formatFileSize(compressedSizeNum);
        
        // 计算并显示压缩率
        const compressionRatio = ((1 - compressedSizeNum / originalSizeNum) * 100).toFixed(1);
        console.log(`压缩质量: ${quality * 100}%, 压缩率: ${compressionRatio}%`);
        
        // 更新下载按钮状态
        downloadBtn.disabled = false;
        downloadBtn.textContent = `下载压缩后的图片 (${compressionRatio}% 压缩率)`;
        
    } catch (error) {
        console.error('压缩图片时出错:', error);
        alert('压缩图片时出错，请重试');
        downloadBtn.disabled = true;
        downloadBtn.textContent = '压缩失败，请重试';
    }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeEventListeners); 
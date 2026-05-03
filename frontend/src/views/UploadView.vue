<template>
  <div class="upload-view">
    <div class="upload-container">
      <div class="page-header">
        <h2 class="page-title">上传影像</h2>
        <p class="page-subtitle">上传 DICOM 医疗影像文件到云端存储</p>
      </div>

      <div class="upload-area" @click="triggerFileInput">
        <input
          type="file"
          ref="fileInputRef"
          multiple
          accept=".dcm,.dicom"
          @change="handleFileSelect"
          style="display: none"
        />
        <div class="upload-icon" :class="{ active: isDragOver }">📤</div>
        <h3 class="upload-title">
          {{ selectedFiles.length > 0 ? '已选择文件' : '点击选择或拖拽文件到此处' }}
        </h3>
        <p class="upload-hint">支持 .dcm, .dicom 格式，单文件最大 500MB</p>
      </div>

      <div class="file-list" v-if="selectedFiles.length > 0">
        <div class="list-header">
          <h3 class="list-title">已选择的文件 ({{ selectedFiles.length }})</h3>
          <button class="btn btn-text" @click="clearFiles">清空列表</button>
        </div>

        <div class="file-items">
          <div
            v-for="(file, index) in selectedFiles"
            :key="index"
            class="file-item"
          >
            <div class="file-icon">📄</div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span>{{ formatSize(file.size) }}</span>
              </div>
              <div class="progress-bar" v-if="uploadStatus[index]">
                <div
                  class="progress-fill"
                  :class="{ success: uploadStatus[index]?.success, error: uploadStatus[index]?.error }"
                  :style="{ width: uploadStatus[index]?.progress + '%' }"
                ></div>
              </div>
              <div class="upload-status" v-if="uploadStatus[index]">
                <span v-if="uploadStatus[index]?.uploading">
                  上传中... {{ uploadStatus[index]?.progress }}%
                </span>
                <span v-else-if="uploadStatus[index]?.success" class="success">
                  ✓ 上传成功
                </span>
                <span v-else-if="uploadStatus[index]?.error" class="error">
                  ✗ 上传失败: {{ uploadStatus[index]?.errorMessage }}
                </span>
              </div>
            </div>
            <button
              class="remove-btn"
              @click="removeFile(index)"
              :disabled="uploadStatus[index]?.uploading"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="upload-actions">
          <button
            class="btn btn-primary upload-btn"
            @click="uploadFiles"
            :disabled="isUploading || allUploaded"
          >
            <span v-if="isUploading" class="spinner"></span>
            <span v-else>开始上传</span>
          </button>
          <router-link to="/viewer" class="btn btn-secondary">
            直接查看本地文件
          </router-link>
        </div>
      </div>

      <div class="demo-section" v-if="!selectedFiles.length">
        <h3 class="section-title">快速开始</h3>
        <div class="demo-options">
          <div class="demo-card" @click="router.push('/viewer')">
            <div class="demo-icon">🔬</div>
            <h4 class="demo-title">使用本地 DICOM 文件</h4>
            <p class="demo-desc">在影像查看器中直接选择本地文件进行预览</p>
          </div>
          <div class="demo-card" @click="router.push('/images')">
            <div class="demo-icon">📋</div>
            <h4 class="demo-title">浏览已上传影像</h4>
            <p class="demo-desc">查看和管理已上传到服务器的影像文件</p>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3 class="section-title">关于 DICOM 格式</h3>
        <div class="info-cards">
          <div class="info-card">
            <h4>📋 什么是 DICOM？</h4>
            <p>DICOM (Digital Imaging and Communications in Medicine) 是医疗影像领域的国际标准格式，用于存储、传输和管理医学图像和相关数据。</p>
          </div>
          <div class="info-card">
            <h4>🔧 支持的功能</h4>
            <p>本平台支持 DICOM 图像的实时解析、窗宽窗位调整、缩放平移等专业阅片功能，所有解析工作均在浏览器端完成。</p>
          </div>
          <div class="info-card">
            <h4>🔒 数据安全</h4>
            <p>上传的 DICOM 文件将被加密存储在 AWS S3 中，传输过程采用 TLS 加密，确保患者隐私和数据安全。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { dicomApi } from '@/services/api';

const router = useRouter();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const isDragOver = ref(false);
const isUploading = ref(false);
const uploadStatus = ref<Array<{
  uploading: boolean;
  progress: number;
  success: boolean;
  error: boolean;
  errorMessage?: string;
} | null>>([]);

const allUploaded = computed(() => {
  return uploadStatus.value.every(
    (status) => status?.success
  );
});

function triggerFileInput(): void {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (files && files.length > 0) {
    const dicomFiles = Array.from(files).filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'dcm' || ext === 'dicom' || ext === undefined;
    });

    selectedFiles.value = [...selectedFiles.value, ...dicomFiles];
    uploadStatus.value = new Array(selectedFiles.value.length).fill(null);
  }

  input.value = '';
}

function removeFile(index: number): void {
  selectedFiles.value.splice(index, 1);
  uploadStatus.value.splice(index, 1);
}

function clearFiles(): void {
  selectedFiles.value = [];
  uploadStatus.value = [];
}

async function uploadFiles(): Promise<void> {
  if (selectedFiles.value.length === 0) return;

  isUploading.value = true;

  for (let i = 0; i < selectedFiles.value.length; i++) {
    if (uploadStatus.value[i]?.success) continue;

    uploadStatus.value[i] = {
      uploading: true,
      progress: 0,
      success: false,
      error: false
    };

    try {
      uploadStatus.value[i]!.progress = 10;

      const result = await dicomApi.uploadImage(selectedFiles.value[i]);

      uploadStatus.value[i]!.progress = 100;
      uploadStatus.value[i]!.success = true;
      uploadStatus.value[i]!.uploading = false;

      console.log('上传成功:', result);
    } catch (error: any) {
      uploadStatus.value[i]!.error = true;
      uploadStatus.value[i]!.uploading = false;
      uploadStatus.value[i]!.errorMessage = error.message || '未知错误';
      console.error('上传失败:', error);
    }
  }

  isUploading.value = false;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = false;
}

function handleDrop(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const dicomFiles = Array.from(files).filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'dcm' || ext === 'dicom' || ext === undefined;
    });

    selectedFiles.value = [...selectedFiles.value, ...dicomFiles];
    uploadStatus.value = new Array(selectedFiles.value.length).fill(null);
  }
}

onMounted(() => {
  const uploadArea = document.querySelector('.upload-area');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
  }
});

onUnmounted(() => {
  const uploadArea = document.querySelector('.upload-area');
  if (uploadArea) {
    uploadArea.removeEventListener('dragover', handleDragOver);
    uploadArea.removeEventListener('dragleave', handleDragLeave);
    uploadArea.removeEventListener('drop', handleDrop);
  }
});
</script>

<style scoped>
.upload-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.upload-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 24px;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: var(--background-hover);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  transition: transform var(--transition-fast);
}

.upload-icon.active {
  transform: scale(1.1);
}

.upload-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: var(--text-secondary);
}

.file-list {
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.list-title {
  font-size: 15px;
  font-weight: 500;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--background-dark);
  border-radius: var(--radius-md);
}

.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-bar {
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-fill.success {
  background-color: var(--success-color);
}

.progress-fill.error {
  background-color: var(--error-color);
}

.upload-status {
  font-size: 12px;
  margin-top: 4px;
}

.upload-status .success {
  color: var(--success-color);
}

.upload-status .error {
  color: var(--error-color);
}

.remove-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 16px;
  flex-shrink: 0;
}

.remove-btn:hover:not(:disabled) {
  background-color: var(--error-color);
  color: white;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.upload-btn {
  flex: 1;
  padding: 12px 24px;
  font-size: 15px;
}

.demo-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.demo-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.demo-card {
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.demo-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.demo-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.demo-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.info-section {
  margin-top: 32px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .info-cards {
    grid-template-columns: 1fr;
  }

  .demo-options {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
}

.info-card h4 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.info-card p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>

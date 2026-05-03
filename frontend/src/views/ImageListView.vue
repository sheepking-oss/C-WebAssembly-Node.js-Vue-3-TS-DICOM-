<template>
  <div class="image-list-view">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">影像列表</h2>
        <span class="image-count">{{ imageList.length }} 个文件</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索文件名..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
        <router-link to="/upload" class="btn btn-primary">
          <span>📤</span>
          <span>上传影像</span>
        </router-link>
      </div>
    </div>

    <div class="content-area">
      <div class="loading-overlay" v-if="isLoading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>

      <div class="empty-state" v-else-if="filteredImageList.length === 0">
        <div class="empty-icon" v-if="searchQuery">🔍</div>
        <div class="empty-icon" v-else>📁</div>
        <p class="empty-text" v-if="searchQuery">
          未找到匹配的影像文件
        </p>
        <p class="empty-text" v-else>
          暂无影像文件
        </p>
        <router-link to="/upload" class="btn btn-primary" v-if="!searchQuery">
          上传第一张影像
        </router-link>
      </div>

      <div class="image-grid" v-else>
        <div
          v-for="image in filteredImageList"
          :key="image.id"
          class="image-card"
          @click="viewImage(image)"
        >
          <div class="card-preview">
            <div class="preview-placeholder">
              <span class="preview-icon">📷</span>
            </div>
            <div class="card-overlay">
              <div class="overlay-actions">
                <button class="overlay-btn" @click.stop="viewImage(image)">
                  查看
                </button>
                <button
                  class="overlay-btn danger"
                  @click.stop="confirmDelete(image)"
                  v-if="canDelete"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
          <div class="card-info">
            <div class="card-title">{{ image.name }}</div>
            <div class="card-meta">
              <span class="meta-item">📦 {{ formatSize(image.size) }}</span>
              <span class="meta-item">📅 {{ formatDate(image.lastModified) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="delete-modal" v-if="showDeleteModal">
      <div class="modal-overlay" @click="showDeleteModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>确定要删除此影像文件吗？</p>
          <p class="file-name">{{ imageToDelete?.name }}</p>
          <p class="warning-text">此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteModal = false">
            取消
          </button>
          <button class="btn btn-primary danger" @click="deleteImage" :disabled="isDeleting">
            <span v-if="isDeleting" class="spinner small"></span>
            <span v-else>确认删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dicomApi } from '@/services/api';
import type { ImageFile } from '@/stores/dicomStore';

const router = useRouter();

const imageList = ref<ImageFile[]>([]);
const searchQuery = ref('');
const isLoading = ref(false);
const isDeleting = ref(false);
const showDeleteModal = ref(false);
const imageToDelete = ref<ImageFile | null>(null);

const canDelete = ref(true);

const filteredImageList = computed(() => {
  if (!searchQuery.value) {
    return imageList.value;
  }

  const query = searchQuery.value.toLowerCase();
  return imageList.value.filter((image) =>
    image.name.toLowerCase().includes(query)
  );
});

async function loadImageList(): Promise<void> {
  isLoading.value = true;

  try {
    const images = await dicomApi.getImageList();
    imageList.value = images;
  } catch (error) {
    console.error('加载影像列表失败:', error);
  } finally {
    isLoading.value = false;
  }
}

function viewImage(image: ImageFile): void {
  router.push({ name: 'ImageViewer', params: { id: image.id } });
}

function confirmDelete(image: ImageFile): void {
  imageToDelete.value = image;
  showDeleteModal.value = true;
}

async function deleteImage(): Promise<void> {
  if (!imageToDelete.value) return;

  isDeleting.value = true;

  try {
    await dicomApi.deleteImage(imageToDelete.value.key);
    await loadImageList();
    showDeleteModal.value = false;
    imageToDelete.value = null;
  } catch (error) {
    console.error('删除影像失败:', error);
    alert('删除失败，请稍后重试');
  } finally {
    isDeleting.value = false;
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(() => {
  loadImageList();
});
</script>

<style scoped>
.image-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.image-count {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 4px 12px;
  background-color: var(--background-card);
  border-radius: var(--radius-sm);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
}

.search-input {
  width: 280px;
  padding-right: 40px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
}

.content-area {
  flex: 1;
  min-height: 0;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-dark);
}

.loading-spinner {
  text-align: center;
}

.loading-spinner .spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border-width: 3px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 4px;
  overflow-y: auto;
  height: 100%;
}

.image-card {
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.card-preview {
  aspect-ratio: 4/3;
  background-color: #000;
  position: relative;
  overflow: hidden;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon {
  font-size: 48px;
  opacity: 0.5;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.image-card:hover .card-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 12px;
}

.overlay-btn {
  padding: 8px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.overlay-btn:hover {
  background-color: var(--primary-hover);
}

.overlay-btn.danger {
  background-color: var(--error-color);
}

.overlay-btn.danger:hover {
  background-color: #dc2626;
}

.card-info {
  padding: 16px;
}

.card-title {
  font-weight: 500;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
}

.modal-content {
  position: relative;
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background-color: var(--background-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px 20px;
  text-align: center;
}

.modal-body p {
  margin-bottom: 8px;
}

.file-name {
  font-weight: 600;
  color: var(--primary-color);
  word-break: break-all;
}

.warning-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.btn.danger {
  background-color: var(--error-color);
}

.btn.danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
</style>

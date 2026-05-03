<template>
  <div class="dashboard-view">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalImages }}</div>
          <div class="stat-label">总影像数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🆕</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayImages }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.patients }}</div>
          <div class="stat-label">患者数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💾</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.storageUsed }}</div>
          <div class="stat-label">存储使用</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">最近上传</h3>
          <router-link to="/images" class="btn btn-text">
            查看全部 →
          </router-link>
        </div>
        <div class="image-list">
          <div
            v-for="image in recentImages"
            :key="image.id"
            class="image-item"
            @click="viewImage(image)"
          >
            <div class="image-preview">
              <span class="preview-icon">📷</span>
            </div>
            <div class="image-info">
              <div class="image-name">{{ image.name }}</div>
              <div class="image-meta">
                <span>{{ formatSize(image.size) }}</span>
                <span>{{ formatDate(image.lastModified) }}</span>
              </div>
            </div>
          </div>

          <div v-if="recentImages.length === 0" class="empty-state">
            <div class="empty-icon">📁</div>
            <p>暂无影像数据</p>
            <router-link to="/upload" class="btn btn-primary">
              上传影像
            </router-link>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">快捷操作</h3>
        </div>
        <div class="quick-actions">
          <router-link to="/upload" class="action-card">
            <div class="action-icon">📤</div>
            <div class="action-text">上传新影像</div>
          </router-link>

          <router-link to="/viewer" class="action-card">
            <div class="action-icon">🔬</div>
            <div class="action-text">影像查看器</div>
          </router-link>

          <router-link to="/images" class="action-card">
            <div class="action-icon">📋</div>
            <div class="action-text">浏览影像库</div>
          </router-link>

          <div class="action-card" @click="handleDemoUpload">
            <div class="action-icon">🎯</div>
            <div class="action-text">使用示例数据</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dicomApi } from '@/services/api';
import type { ImageFile } from '@/stores/dicomStore';

const router = useRouter();

const stats = ref({
  totalImages: 0,
  todayImages: 0,
  patients: 0,
  storageUsed: '0 GB'
});

const recentImages = ref<ImageFile[]>([]);

async function loadData(): Promise<void> {
  try {
    const images = await dicomApi.getImageList();
    recentImages.value = images.slice(0, 5);
    stats.value.totalImages = images.length;

    let totalSize = 0;
    images.forEach(img => {
      totalSize += img.size;
    });
    stats.value.storageUsed = formatSize(totalSize);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

function viewImage(image: ImageFile): void {
  router.push({ name: 'ImageViewer', params: { id: image.id } });
}

function handleDemoUpload(): void {
  router.push('/upload');
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all var(--transition-fast);
}

.stat-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.section-card {
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background-color: var(--background-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.image-item:hover {
  background-color: var(--background-hover);
}

.image-preview {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-icon {
  font-size: 20px;
}

.image-info {
  flex: 1;
  min-width: 0;
}

.image-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.image-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background-color: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  color: inherit;
}

.action-card:hover {
  border-color: var(--primary-color);
  background-color: var(--background-hover);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 32px;
}

.action-text {
  font-weight: 500;
  text-align: center;
}
</style>

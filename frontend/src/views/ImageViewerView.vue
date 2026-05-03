<template>
  <div class="image-viewer-view">
    <div class="viewer-layout">
      <aside class="sidebar-panel">
        <div class="panel-section">
          <h3 class="panel-title">文件选择</h3>
          <div class="file-input-area" @click="triggerFileInput">
            <input
              type="file"
              ref="fileInputRef"
              accept=".dcm,.dicom"
              @change="handleFileSelect"
              style="display: none"
            />
            <div class="upload-icon">📁</div>
            <p class="upload-text">点击选择 DICOM 文件</p>
            <p class="upload-hint">支持 .dcm, .dicom 格式</p>
          </div>

          <div class="recent-files" v-if="imageList.length > 0">
            <h4 class="sub-title">从服务器加载</h4>
            <div class="file-list">
              <div
                v-for="image in imageList"
                :key="image.id"
                class="file-item"
                :class="{ active: selectedImageId === image.id }"
                @click="loadFromServer(image)"
              >
                <div class="file-icon">📄</div>
                <div class="file-info">
                  <div class="file-name">{{ image.name }}</div>
                  <div class="file-meta">{{ formatSize(image.size) }}</div>
                </div>
              </div>
            </div>
            <button class="btn btn-text refresh-btn" @click="loadImageList">
              🔄 刷新列表
            </button>
          </div>
        </div>

        <div class="panel-section" v-if="currentDicom">
          <h3 class="panel-title">窗宽窗位</h3>
          <div class="control-group">
            <div class="control-label">
              <span>窗宽 (Width)</span>
              <span class="control-value">{{ windowLevel.width.toFixed(0) }}</span>
            </div>
            <input
              type="range"
              :min="pixelRange.min"
              :max="pixelRange.max"
              v-model.number="windowLevel.width"
              class="slider"
            />
          </div>
          <div class="control-group">
            <div class="control-label">
              <span>窗位 (Center)</span>
              <span class="control-value">{{ windowLevel.center.toFixed(0) }}</span>
            </div>
            <input
              type="range"
              :min="pixelRange.min"
              :max="pixelRange.max"
              v-model.number="windowLevel.center"
              class="slider"
            />
          </div>
          <button class="btn btn-secondary w-full" @click="resetWindowLevel">
            🔄 重置为默认值
          </button>

          <div class="preset-list">
            <h4 class="sub-title">预设</h4>
            <div class="preset-buttons">
              <button
                v-for="preset in wlPresets"
                :key="preset.name"
                class="preset-btn"
                @click="applyPreset(preset)"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="panel-section" v-if="currentDicom">
          <h3 class="panel-title">工具</h3>
          <div class="tool-buttons">
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'wwl' }"
              @click="setTool('wwl')"
            >
              <span class="tool-icon">🔧</span>
              <span>窗宽窗位</span>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'zoom' }"
              @click="setTool('zoom')"
            >
              <span class="tool-icon">🔍</span>
              <span>缩放</span>
            </button>
            <button
              class="tool-btn"
              :class="{ active: currentTool === 'pan' }"
              @click="setTool('pan')"
            >
              <span class="tool-icon">✋</span>
              <span>平移</span>
            </button>
          </div>
        </div>

        <div class="panel-section metadata-section" v-if="currentDicom">
          <h3 class="panel-title">患者信息</h3>
          <div class="metadata-list">
            <div class="metadata-item">
              <span class="metadata-label">姓名</span>
              <span class="metadata-value">{{ metadata.patientName || '-' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">ID</span>
              <span class="metadata-value">{{ metadata.patientID || '-' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">性别</span>
              <span class="metadata-value">{{ metadata.patientSex || '-' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">年龄</span>
              <span class="metadata-value">{{ metadata.patientAge || '-' }}</span>
            </div>
          </div>

          <h3 class="panel-title mt-4">检查信息</h3>
          <div class="metadata-list">
            <div class="metadata-item">
              <span class="metadata-label">检查日期</span>
              <span class="metadata-value">{{ metadata.studyDate || '-' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">检查描述</span>
              <span class="metadata-value">{{ metadata.studyDescription || '-' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">序列描述</span>
              <span class="metadata-value">{{ metadata.seriesDescription || '-' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">检查类型</span>
              <span class="metadata-value">{{ metadata.modality || '-' }}</span>
            </div>
          </div>

          <h3 class="panel-title mt-4">图像信息</h3>
          <div class="metadata-list">
            <div class="metadata-item">
              <span class="metadata-label">分辨率</span>
              <span class="metadata-value">{{ imageInfo.columns }} x {{ imageInfo.rows }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">位深</span>
              <span class="metadata-value">{{ imageInfo.bitsAllocated }} bits</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">存储位</span>
              <span class="metadata-value">{{ imageInfo.bitsStored }} bits</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">像素间距</span>
              <span class="metadata-value">{{ metadata.pixelSpacing || '-' }}</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="viewer-main">
        <div class="canvas-container">
          <DicomCanvas
            ref="dicomCanvasRef"
            :dicom-data="currentDicom"
            :is-loading="isLoading"
            :initial-window-level="windowLevel"
            @window-level-change="handleWindowLevelChange"
            @scale-change="handleScaleChange"
          />
        </div>

        <div class="viewer-footer" v-if="currentDicom">
          <div class="footer-info">
            <span class="info-tag">
              窗宽: {{ windowLevel.width.toFixed(0) }} | 窗位: {{ windowLevel.center.toFixed(0) }}
            </span>
            <span class="info-tag">
              缩放: {{ (scale * 100).toFixed(0) }}%
            </span>
            <span class="info-tag" v-if="currentFileName">
              文件: {{ currentFileName }}
            </span>
          </div>
          <div class="footer-hint">
            <span class="hint-text">💡 提示: 鼠标拖动调整窗宽窗位 (左右=窗宽, 上下=窗位)</span>
            <span class="hint-text">鼠标滚轮缩放 | 中键拖动平移</span>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { dicomApi } from '@/services/api';
import { parseDicom } from '@/utils/dicomParser';
import DicomCanvas from '@/components/DicomCanvas.vue';
import type { ParsedDicom, DicomMetadata, DicomImageInfo, WindowLevelParams } from '@/types/dicom';
import type { ImageFile } from '@/stores/dicomStore';

const route = useRoute();

const fileInputRef = ref<HTMLInputElement | null>(null);
const dicomCanvasRef = ref<InstanceType<typeof DicomCanvas> | null>(null);

const currentDicom = ref<ParsedDicom | null>(null);
const currentFileName = ref<string>('');
const selectedImageId = ref<string | null>(null);
const imageList = ref<ImageFile[]>([]);
const isLoading = ref(false);

const windowLevel = reactive<WindowLevelParams>({
  center: 0,
  width: 255
});

const pixelRange = reactive({
  min: -1000,
  max: 3000
});

const scale = ref(1);
const currentTool = ref<'wwl' | 'zoom' | 'pan'>('wwl');

const metadata = computed<DicomMetadata>(() => {
  return currentDicom.value?.metadata || {} as DicomMetadata;
});

const imageInfo = computed<DicomImageInfo>(() => {
  return currentDicom.value?.imageInfo || {
    rows: 0,
    columns: 0,
    bitsAllocated: 0,
    bitsStored: 0,
    highBit: 0,
    samplesPerPixel: 0,
    windowCenter: 0,
    windowWidth: 255,
    rescaleIntercept: 0,
    rescaleSlope: 1,
    photometricInterpretation: ''
  };
});

const wlPresets = [
  { name: '骨骼', center: 300, width: 1500 },
  { name: '肺窗', center: -600, width: 1500 },
  { name: '腹部', center: 50, width: 350 },
  { name: '脑窗', center: 40, width: 80 },
  { name: '纵隔', center: 50, width: 400 },
  { name: '骨窗', center: 500, width: 2000 }
];

function triggerFileInput(): void {
  fileInputRef.value?.click();
}

async function handleFileSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  isLoading.value = true;
  currentFileName.value = file.name;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const parsed = await parseDicom(arrayBuffer);

    currentDicom.value = parsed;
    selectedImageId.value = null;

    const { windowCenter, windowWidth } = parsed.imageInfo;
    windowLevel.center = windowCenter || 0;
    windowLevel.width = windowWidth > 0 ? windowWidth : 255;

    if (parsed.imageInfo.bitsStored > 8) {
      const minVal = -(1 << (parsed.imageInfo.bitsStored - 1));
      const maxVal = (1 << (parsed.imageInfo.bitsStored - 1)) - 1;
      pixelRange.min = Math.min(minVal, -2000);
      pixelRange.max = Math.max(maxVal, 4000);
    } else {
      pixelRange.min = 0;
      pixelRange.max = 255;
    }
  } catch (error) {
    console.error('DICOM 解析失败:', error);
    alert('无法解析此 DICOM 文件，请检查文件格式是否正确');
  } finally {
    isLoading.value = false;
  }

  input.value = '';
}

async function loadImageList(): Promise<void> {
  try {
    const images = await dicomApi.getImageList();
    imageList.value = images;
  } catch (error) {
    console.error('加载影像列表失败:', error);
  }
}

async function loadFromServer(image: ImageFile): Promise<void> {
  isLoading.value = true;
  selectedImageId.value = image.id;
  currentFileName.value = image.name;

  try {
    const arrayBuffer = await dicomApi.downloadImage(image.key);
    const parsed = await parseDicom(arrayBuffer);

    currentDicom.value = parsed;

    const { windowCenter, windowWidth } = parsed.imageInfo;
    windowLevel.center = windowCenter || 0;
    windowLevel.width = windowWidth > 0 ? windowWidth : 255;

    if (parsed.imageInfo.bitsStored > 8) {
      const minVal = -(1 << (parsed.imageInfo.bitsStored - 1));
      const maxVal = (1 << (parsed.imageInfo.bitsStored - 1)) - 1;
      pixelRange.min = Math.min(minVal, -2000);
      pixelRange.max = Math.max(maxVal, 4000);
    } else {
      pixelRange.min = 0;
      pixelRange.max = 255;
    }
  } catch (error) {
    console.error('加载影像失败:', error);
    alert('无法加载此影像，请稍后重试');
  } finally {
    isLoading.value = false;
  }
}

function handleWindowLevelChange(newWl: WindowLevelParams): void {
  windowLevel.center = newWl.center;
  windowLevel.width = newWl.width;
}

function handleScaleChange(newScale: number): void {
  scale.value = newScale;
}

function resetWindowLevel(): void {
  if (!currentDicom.value) return;

  const { windowCenter, windowWidth } = currentDicom.value.imageInfo;
  windowLevel.center = windowCenter || 0;
  windowLevel.width = windowWidth > 0 ? windowWidth : 255;

  dicomCanvasRef.value?.resetWindowLevel();
}

function applyPreset(preset: { name: string; center: number; width: number }): void {
  windowLevel.center = preset.center;
  windowLevel.width = preset.width;
}

function setTool(tool: 'wwl' | 'zoom' | 'pan'): void {
  currentTool.value = tool;
  dicomCanvasRef.value?.setToolMode(tool);
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

watch(
  [() => windowLevel.center, () => windowLevel.width],
  () => {
    if (dicomCanvasRef.value && currentDicom.value) {
      dicomCanvasRef.value.render();
    }
  }
);

onMounted(() => {
  loadImageList();

  const imageId = route.params.id as string;
  if (imageId) {
    setTimeout(async () => {
      await loadImageList();
      const foundImage = imageList.value.find(img => img.id === imageId);
      if (foundImage) {
        loadFromServer(foundImage);
      }
    }, 100);
  }
});
</script>

<style scoped>
.image-viewer-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.viewer-layout {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.sidebar-panel {
  width: 320px;
  flex-shrink: 0;
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  padding: 20px;
}

.panel-section {
  margin-bottom: 24px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.sub-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.file-input-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.file-input-area:hover {
  border-color: var(--primary-color);
  background-color: var(--background-hover);
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.upload-text {
  font-weight: 500;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.recent-files {
  margin-top: 20px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: var(--radius-md);
  background-color: var(--background-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.file-item:hover {
  background-color: var(--background-hover);
}

.file-item.active {
  background-color: var(--secondary-color);
  border: 1px solid var(--primary-color);
}

.file-icon {
  font-size: 20px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.refresh-btn {
  width: 100%;
  margin-top: 12px;
}

.control-group {
  margin-bottom: 16px;
}

.control-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.control-value {
  color: var(--primary-color);
  font-weight: 600;
  font-family: monospace;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--background-dark);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.w-full {
  width: 100%;
}

.preset-list {
  margin-top: 20px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 8px 12px;
  background-color: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 12px;
  transition: all var(--transition-fast);
}

.preset-btn:hover {
  background-color: var(--background-hover);
  border-color: var(--primary-color);
}

.tool-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.tool-btn:hover {
  background-color: var(--background-hover);
}

.tool-btn.active {
  background-color: var(--secondary-color);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tool-icon {
  font-size: 18px;
}

.metadata-section {
  background-color: var(--background-dark);
  border-radius: var(--radius-md);
  padding: 16px;
}

.metadata-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.metadata-label {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.metadata-value {
  font-size: 12px;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.mt-4 {
  margin-top: 20px;
}

.viewer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.canvas-container {
  flex: 1;
  min-height: 0;
  background-color: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.viewer-footer {
  margin-top: 12px;
  padding: 12px 20px;
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.footer-info {
  display: flex;
  gap: 24px;
}

.info-tag {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.footer-hint {
  display: flex;
  gap: 24px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>

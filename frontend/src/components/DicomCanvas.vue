<template>
  <div class="dicom-canvas-container" ref="containerRef">
    <canvas
      ref="canvasRef"
      class="dicom-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @wheel="handleWheel"
      @contextmenu.prevent
    ></canvas>

    <div class="canvas-overlay" v-if="!hasImage">
      <div class="empty-message">
        <div class="empty-icon">📷</div>
        <p>{{ emptyMessage }}</p>
      </div>
    </div>

    <div class="canvas-overlay" v-if="isLoading">
      <div class="loading-message">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </div>

    <div class="canvas-info" v-if="hasImage && showInfo">
      <div class="info-item">
        <span class="info-label">窗宽:</span>
        <span class="info-value">{{ currentWindowLevel.width.toFixed(0) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">窗位:</span>
        <span class="info-value">{{ currentWindowLevel.center.toFixed(0) }}</span>
      </div>
      <div v-if="pixelValue !== null" class="info-item">
        <span class="info-label">像素值:</span>
        <span class="info-value">{{ pixelValue }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">缩放:</span>
        <span class="info-value">{{ (scale * 100).toFixed(0) }}%</span>
      </div>
    </div>

    <div class="canvas-toolbar" v-if="showToolbar">
      <button
        class="toolbar-btn"
        :class="{ active: toolMode === 'wwl' }"
        @click="setToolMode('wwl')"
        title="窗宽窗位调整"
      >
        🔧
      </button>
      <button
        class="toolbar-btn"
        :class="{ active: toolMode === 'zoom' }"
        @click="setToolMode('zoom')"
        title="缩放"
      >
        🔍
      </button>
      <button
        class="toolbar-btn"
        :class="{ active: toolMode === 'pan' }"
        @click="setToolMode('pan')"
        title="平移"
      >
        ✋
      </button>
      <div class="toolbar-divider"></div>
      <button
        class="toolbar-btn"
        @click="resetView"
        title="重置视图"
      >
        ↺
      </button>
      <button
        class="toolbar-btn"
        @click="resetWindowLevel"
        title="重置窗宽窗位"
      >
        🔄
      </button>
    </div>

    <div class="cursor-info" v-if="isDragging && toolMode === 'wwl'">
      <div class="cursor-item">
        <span class="cursor-label">窗宽:</span>
        <span class="cursor-value">{{ currentWindowLevel.width.toFixed(0) }}</span>
      </div>
      <div class="cursor-item">
        <span class="cursor-label">窗位:</span>
        <span class="cursor-value">{{ currentWindowLevel.center.toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { DicomRenderer } from '@/utils/dicomRenderer';
import type { ParsedDicom, WindowLevelParams } from '@/types/dicom';

interface Props {
  dicomData?: ParsedDicom | null;
  isLoading?: boolean;
  emptyMessage?: string;
  showInfo?: boolean;
  showToolbar?: boolean;
  initialWindowLevel?: WindowLevelParams;
}

const props = withDefaults(defineProps<Props>(), {
  dicomData: null,
  isLoading: false,
  emptyMessage: '请选择或上传 DICOM 影像',
  showInfo: true,
  showToolbar: true,
  initialWindowLevel: () => ({ center: 0, width: 255 })
});

interface Emits {
  (e: 'windowLevelChange', value: WindowLevelParams): void;
  (e: 'scaleChange', value: number): void;
  (e: 'pixelValueChange', value: number | null): void;
}

const emit = defineEmits<Emits>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const renderer = ref<DicomRenderer | null>(null);
const currentWindowLevel = ref<WindowLevelParams>({ ...props.initialWindowLevel });
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const pixelValue = ref<number | null>(null);

const toolMode = ref<'wwl' | 'zoom' | 'pan'>('wwl');
const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);
const lastWindowLevel = ref<WindowLevelParams>({ center: 0, width: 255 });
const lastScale = ref(1);
const lastOffset = ref({ x: 0, y: 0 });

const hasImage = computed(() => !!props.dicomData);

function initRenderer(): void {
  if (!props.dicomData) return;

  if (!renderer.value) {
    renderer.value = new DicomRenderer();
  }

  renderer.value.setDicom(props.dicomData);

  const { windowCenter, windowWidth } = props.dicomData.imageInfo;
  currentWindowLevel.value = {
    center: windowCenter || 0,
    width: windowWidth > 0 ? windowWidth : 255
  };

  renderer.value.setWindowLevel(currentWindowLevel.value.center, currentWindowLevel.value.width);

  fitToContainer();
}

function fitToContainer(): void {
  if (!canvasRef.value || !props.dicomData) return;

  const { rows, columns } = props.dicomData.imageInfo;
  const canvasWidth = canvasRef.value.width;
  const canvasHeight = canvasRef.value.height;

  const imageAspectRatio = columns / rows;
  const canvasAspectRatio = canvasWidth / canvasHeight;

  if (imageAspectRatio > canvasAspectRatio) {
    scale.value = canvasWidth / columns;
  } else {
    scale.value = canvasHeight / rows;
  }

  offsetX.value = (canvasWidth - columns * scale.value) / 2;
  offsetY.value = (canvasHeight - rows * scale.value) / 2;

  render();
}

function render(): void {
  if (!canvasRef.value || !renderer.value || !props.dicomData) return;

  renderer.value.setWindowLevel(currentWindowLevel.value.center, currentWindowLevel.value.width);

  const success = renderer.value.renderToCanvas(
    canvasRef.value,
    scale.value,
    offsetX.value,
    offsetY.value
  );

  if (!success) {
    console.error('渲染失败');
  }
}

function resizeCanvas(): void {
  if (!canvasRef.value || !containerRef.value) return;

  const container = containerRef.value;
  const canvas = canvasRef.value;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  canvas.style.width = `${container.clientWidth}px`;
  canvas.style.height = `${container.clientHeight}px`;

  if (hasImage.value) {
    fitToContainer();
  }
}

function handleMouseDown(event: MouseEvent): void {
  if (!hasImage.value || !canvasRef.value) return;

  event.preventDefault();
  isDragging.value = true;

  lastMouseX.value = event.clientX;
  lastMouseY.value = event.clientY;
  lastWindowLevel.value = { ...currentWindowLevel.value };
  lastScale.value = scale.value;
  lastOffset.value = { x: offsetX.value, y: offsetY.value };

  canvasRef.value.style.cursor = getCursorStyle();
}

function handleMouseMove(event: MouseEvent): void {
  if (!hasImage.value || !canvasRef.value) return;

  updatePixelValue(event);

  if (!isDragging.value) {
    canvasRef.value.style.cursor = getCursorStyle();
    return;
  }

  const deltaX = event.clientX - lastMouseX.value;
  const deltaY = event.clientY - lastMouseY.value;

  switch (toolMode.value) {
    case 'wwl':
      adjustWindowLevel(deltaX, deltaY);
      break;
    case 'zoom':
      adjustScale(deltaY);
      break;
    case 'pan':
      adjustPan(deltaX, deltaY);
      break;
  }

  lastMouseX.value = event.clientX;
  lastMouseY.value = event.clientY;
}

function handleMouseUp(): void {
  if (!isDragging.value) return;

  isDragging.value = false;

  if (canvasRef.value) {
    canvasRef.value.style.cursor = getCursorStyle();
  }
}

function handleWheel(event: WheelEvent): void {
  if (!hasImage.value) return;

  event.preventDefault();

  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.1, Math.min(10, scale.value * (1 + delta)));

  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const imageX = (mouseX - offsetX.value) / scale.value;
    const imageY = (mouseY - offsetY.value) / scale.value;

    scale.value = newScale;

    offsetX.value = mouseX - imageX * scale.value;
    offsetY.value = mouseY - imageY * scale.value;
  } else {
    scale.value = newScale;
  }

  emit('scaleChange', scale.value);
  render();
}

function adjustWindowLevel(deltaX: number, deltaY: number): void {
  if (!renderer.value) return;

  const wcMultiplier = 2;
  const wwMultiplier = 4;

  const deltaCenter = -deltaY * wcMultiplier;
  const deltaWidth = deltaX * wwMultiplier;

  const newCenter = currentWindowLevel.value.center + deltaCenter;
  const newWidth = Math.max(1, currentWindowLevel.value.width + deltaWidth);

  currentWindowLevel.value = {
    center: newCenter,
    width: newWidth
  };

  emit('windowLevelChange', { ...currentWindowLevel.value });
  render();
}

function adjustScale(deltaY: number): void {
  const scaleFactor = 1 - (deltaY / 200);
  scale.value = Math.max(0.1, Math.min(10, scale.value * scaleFactor));
  emit('scaleChange', scale.value);
  render();
}

function adjustPan(deltaX: number, deltaY: number): void {
  offsetX.value += deltaX;
  offsetY.value += deltaY;
  render();
}

function updatePixelValue(event: MouseEvent): void {
  if (!canvasRef.value || !renderer.value) {
    pixelValue.value = null;
    return;
  }

  const rect = canvasRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const value = renderer.value.getPixelValue(
    mouseX,
    mouseY,
    scale.value,
    offsetX.value,
    offsetY.value
  );

  pixelValue.value = value;
  emit('pixelValueChange', value);
}

function getCursorStyle(): string {
  if (isDragging.value) {
    return toolMode.value === 'pan' ? 'grabbing' : 'none';
  }

  switch (toolMode.value) {
    case 'wwl':
      return 'crosshair';
    case 'zoom':
      return 'zoom-in';
    case 'pan':
      return 'grab';
    default:
      return 'default';
  }
}

function setToolMode(mode: 'wwl' | 'zoom' | 'pan'): void {
  toolMode.value = mode;
}

function resetView(): void {
  fitToContainer();
  emit('scaleChange', scale.value);
}

function resetWindowLevel(): void {
  if (!props.dicomData) return;

  const { windowCenter, windowWidth } = props.dicomData.imageInfo;
  currentWindowLevel.value = {
    center: windowCenter || 0,
    width: windowWidth > 0 ? windowWidth : 255
  };

  emit('windowLevelChange', { ...currentWindowLevel.value });
  render();
}

watch(
  () => props.dicomData,
  (newData) => {
    if (newData) {
      initRenderer();
    }
  }
);

watch(
  () => props.initialWindowLevel,
  (newWl) => {
    if (newWl && hasImage.value) {
      currentWindowLevel.value = { ...newWl };
      render();
    }
  },
  { deep: true }
);

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(containerRef.value);
  }

  resizeCanvas();

  if (props.dicomData) {
    initRenderer();
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

defineExpose({
  render,
  resetView,
  resetWindowLevel,
  fitToContainer,
  setToolMode,
  getWindowLevel: () => ({ ...currentWindowLevel.value }),
  getScale: () => scale.value
});
</script>

<style scoped>
.dicom-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  overflow: hidden;
}

.dicom-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.empty-message,
.loading-message {
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-message p {
  font-size: 16px;
}

.canvas-info {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-family: monospace;
  font-size: 13px;
  pointer-events: none;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  color: var(--primary-color);
  font-weight: 600;
}

.canvas-toolbar {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: var(--radius-lg);
  padding: 8px;
  border: 1px solid var(--border-color);
}

.toolbar-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background-color: var(--background-hover);
}

.toolbar-btn.active {
  background-color: var(--primary-color);
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
  margin: 0 4px;
}

.cursor-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.85);
  border-radius: var(--radius-md);
  padding: 8px 16px;
  pointer-events: none;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid var(--primary-color);
}

.cursor-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.cursor-label {
  color: var(--text-secondary);
}

.cursor-value {
  color: var(--primary-color);
  font-weight: 600;
}
</style>

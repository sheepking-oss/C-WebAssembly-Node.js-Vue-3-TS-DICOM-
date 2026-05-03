import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ParsedDicom, DicomMetadata, DicomImageInfo } from '@/types/dicom'

export interface ImageFile {
  id: string
  name: string
  size: number
  lastModified: string
  contentType: string
  key: string
}

export interface WindowLevel {
  center: number
  width: number
}

export const useDicomStore = defineStore('dicom', () => {
  const currentImage = ref<ParsedDicom | null>(null)
  const imageList = ref<ImageFile[]>([])
  const selectedImageId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const windowLevel = ref<WindowLevel>({
    center: 0,
    width: 255
  })

  const hasImage = computed(() => currentImage.value !== null)
  const metadata = computed<DicomMetadata | null>(() => {
    return currentImage.value?.metadata || null
  })
  const imageInfo = computed<DicomImageInfo | null>(() => {
    return currentImage.value?.imageInfo || null
  })

  function setCurrentImage(image: ParsedDicom | null) {
    currentImage.value = image
    if (image) {
      const wc = image.imageInfo.windowCenter || 0
      const ww = image.imageInfo.windowWidth || 255
      windowLevel.value = {
        center: wc,
        width: ww > 0 ? ww : 255
      }
    }
  }

  function setImageList(images: ImageFile[]) {
    imageList.value = images
  }

  function setSelectedImageId(id: string | null) {
    selectedImageId.value = id
  }

  function setWindowLevel(center: number, width: number) {
    windowLevel.value = {
      center,
      width: width > 0 ? width : 1
    }
  }

  function adjustWindowLevel(deltaCenter: number, deltaWidth: number) {
    const newCenter = windowLevel.value.center + deltaCenter
    const newWidth = Math.max(1, windowLevel.value.width + deltaWidth)
    windowLevel.value = {
      center: newCenter,
      width: newWidth
    }
  }

  function resetWindowLevel() {
    if (currentImage.value) {
      const wc = currentImage.value.imageInfo.windowCenter || 0
      const ww = currentImage.value.imageInfo.windowWidth || 255
      windowLevel.value = {
        center: wc,
        width: ww > 0 ? ww : 255
      }
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function clearCurrentImage() {
    currentImage.value = null
    selectedImageId.value = null
    windowLevel.value = { center: 0, width: 255 }
  }

  return {
    currentImage,
    imageList,
    selectedImageId,
    isLoading,
    error,
    windowLevel,
    hasImage,
    metadata,
    imageInfo,
    setCurrentImage,
    setImageList,
    setSelectedImageId,
    setWindowLevel,
    adjustWindowLevel,
    resetWindowLevel,
    setLoading,
    setError,
    clearCurrentImage
  }
})

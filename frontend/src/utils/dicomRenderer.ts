import type { ParsedDicom, WindowLevelParams, PixelValueRange, LutArray } from '@/types/dicom';

export class DicomRenderer {
  private parsedDicom: ParsedDicom | null = null;
  private windowLevel: WindowLevelParams = { center: 0, width: 255 };
  private pixelRange: PixelValueRange = { min: 0, max: 255 };
  private lut: LutArray | null = null;
  private cachedWindowLevel: WindowLevelParams | null = null;

  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private cachedImageData: ImageData | null = null;
  private cachedScale: number | null = null;
  private cachedOffsetX: number | null = null;
  private cachedOffsetY: number | null = null;
  private lastDpr: number = 1;

  private isRendering: boolean = false;
  private pendingRender: boolean = false;
  private animationFrameId: number | null = null;

  constructor(dicom?: ParsedDicom) {
    if (dicom) {
      this.setDicom(dicom);
    }
  }

  setDicom(dicom: ParsedDicom): void {
    this.parsedDicom = dicom;
    this.calculatePixelRange();

    const wc = dicom.imageInfo.windowCenter || 0;
    const ww = dicom.imageInfo.windowWidth || 255;
    this.windowLevel = {
      center: wc,
      width: ww > 0 ? ww : 255
    };

    this.lut = null;
    this.cachedWindowLevel = null;
    this.cachedImageData = null;
    this.cachedScale = null;
    this.cachedOffsetX = null;
    this.cachedOffsetY = null;
  }

  setWindowLevel(center: number, width: number): void {
    const newWl = {
      center,
      width: Math.max(1, width)
    };

    if (
      this.windowLevel.center === newWl.center &&
      this.windowLevel.width === newWl.width
    ) {
      return;
    }

    this.windowLevel = newWl;
    this.lut = null;
    this.cachedWindowLevel = null;
    this.invalidateCache();
  }

  getWindowLevel(): WindowLevelParams {
    return { ...this.windowLevel };
  }

  getPixelRange(): PixelValueRange {
    return { ...this.pixelRange };
  }

  private invalidateCache(): void {
    this.cachedImageData = null;
    this.cachedScale = null;
    this.cachedOffsetX = null;
    this.cachedOffsetY = null;
  }

  private calculatePixelRange(): void {
    if (!this.parsedDicom) {
      this.pixelRange = { min: 0, max: 255 };
      return;
    }

    const { pixelData, imageInfo } = this.parsedDicom;
    const bitsStored = imageInfo.bitsStored || 8;

    if (pixelData instanceof Int16Array) {
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      const step = Math.max(1, Math.floor(pixelData.length / 1000));
      
      for (let i = 0; i < pixelData.length; i += step) {
        const val = pixelData[i];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      
      if (min === Number.MAX_SAFE_INTEGER) {
        min = -(1 << (bitsStored - 1));
        max = (1 << (bitsStored - 1)) - 1;
      }
      
      this.pixelRange = { min, max };
    } else if (pixelData instanceof Uint16Array) {
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      const step = Math.max(1, Math.floor(pixelData.length / 1000));
      
      for (let i = 0; i < pixelData.length; i += step) {
        const val = pixelData[i];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      
      if (min === Number.MAX_SAFE_INTEGER) {
        min = 0;
        max = (1 << bitsStored) - 1;
      }
      
      this.pixelRange = { min, max };
    } else {
      const maxValue = (1 << bitsStored) - 1;
      const isSigned = imageInfo.photometricInterpretation === 'MONOCHROME1' ||
                       imageInfo.photometricInterpretation === 'MONOCHROME2';
      
      if (isSigned) {
        this.pixelRange = {
          min: -(1 << (bitsStored - 1)),
          max: (1 << (bitsStored - 1)) - 1
        };
      } else {
        this.pixelRange = { min: 0, max: maxValue };
      }
    }
  }

  private generateLut(): LutArray {
    if (this.lut && this.cachedWindowLevel &&
        this.cachedWindowLevel.center === this.windowLevel.center &&
        this.cachedWindowLevel.width === this.windowLevel.width) {
      return this.lut;
    }

    const { center, width } = this.windowLevel;
    const { min, max } = this.pixelRange;
    const lutSize = max - min + 1;
    const lut = new Uint8ClampedArray(lutSize);

    const low = center - width / 2;
    const high = center + width / 2;
    const range = high - low;

    if (range <= 0) {
      lut.fill(128);
    } else {
      for (let i = 0; i < lutSize; i++) {
        const pixelValue = min + i;

        if (pixelValue <= low) {
          lut[i] = 0;
        } else if (pixelValue >= high) {
          lut[i] = 255;
        } else {
          lut[i] = Math.round(((pixelValue - low) / range) * 255);
        }
      }
    }

    this.lut = lut;
    this.cachedWindowLevel = { ...this.windowLevel };

    return lut;
  }

  private ensureOffscreenCanvas(width: number, height: number): void {
    if (!this.offscreenCanvas || 
        this.offscreenCanvas.width !== width || 
        this.offscreenCanvas.height !== height) {
      this.offscreenCanvas = new OffscreenCanvas(width, height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.invalidateCache();
    }
  }

  private renderToImageDataFast(
    targetWidth: number,
    targetHeight: number,
    scale: number,
    offsetX: number,
    offsetY: number
  ): ImageData {
    if (!this.parsedDicom) {
      return new ImageData(targetWidth, targetHeight);
    }

    const { imageInfo, pixelData } = this.parsedDicom;
    const { rows, columns, photometricInterpretation, rescaleIntercept, rescaleSlope } = imageInfo;

    const imageData = new ImageData(targetWidth, targetHeight);
    const data = imageData.data;
    const lut = this.generateLut();
    const { min: pixelMin } = this.pixelRange;

    const effectiveScale = scale;
    const effectiveOffsetX = offsetX;
    const effectiveOffsetY = offsetY;

    const isMonochrome1 = photometricInterpretation === 'MONOCHROME1';
    const isRgb = photometricInterpretation === 'RGB';

    const hasRescale = rescaleIntercept !== 0 || rescaleSlope !== 1;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor((x - effectiveOffsetX) / effectiveScale);
        const srcY = Math.floor((y - effectiveOffsetY) / effectiveScale);

        const pixelIndex = y * targetWidth + x;
        const dataIndex = pixelIndex * 4;

        if (srcX < 0 || srcX >= columns || srcY < 0 || srcY >= rows) {
          data[dataIndex] = 0;
          data[dataIndex + 1] = 0;
          data[dataIndex + 2] = 0;
          data[dataIndex + 3] = 255;
          continue;
        }

        let grayValue: number;

        if (isRgb) {
          const srcIndex = (srcY * columns + srcX) * 3;
          if (srcIndex + 2 < pixelData.length) {
            data[dataIndex] = pixelData[srcIndex];
            data[dataIndex + 1] = pixelData[srcIndex + 1];
            data[dataIndex + 2] = pixelData[srcIndex + 2];
            data[dataIndex + 3] = 255;
          }
          continue;
        } else {
          const srcIndex = srcY * columns + srcX;

          let rawValue: number;
          if (pixelData instanceof Int16Array) {
            rawValue = pixelData[srcIndex];
          } else if (pixelData instanceof Uint16Array) {
            rawValue = pixelData[srcIndex];
          } else {
            rawValue = pixelData[srcIndex];
          }

          if (hasRescale) {
            if (rescaleSlope !== 1) {
              rawValue = rawValue * rescaleSlope;
            }
            if (rescaleIntercept !== 0) {
              rawValue = rawValue + rescaleIntercept;
            }
          }

          const lutIndex = Math.floor(rawValue - pixelMin);
          if (lutIndex >= 0 && lutIndex < lut.length) {
            grayValue = lut[lutIndex];
          } else if (lutIndex < 0) {
            grayValue = 0;
          } else {
            grayValue = 255;
          }
        }

        if (isMonochrome1) {
          grayValue = 255 - grayValue;
        }

        data[dataIndex] = grayValue;
        data[dataIndex + 1] = grayValue;
        data[dataIndex + 2] = grayValue;
        data[dataIndex + 3] = 255;
      }
    }

    return imageData;
  }

  renderToImageData(
    targetWidth: number,
    targetHeight: number,
    scale?: number,
    offsetX?: number,
    offsetY?: number
  ): ImageData | null {
    if (!this.parsedDicom) {
      return null;
    }

    const effectiveScale = scale || 1;
    const effectiveOffsetX = offsetX || 0;
    const effectiveOffsetY = offsetY || 0;

    if (
      this.cachedImageData &&
      this.cachedImageData.width === targetWidth &&
      this.cachedImageData.height === targetHeight &&
      this.cachedScale === effectiveScale &&
      this.cachedOffsetX === effectiveOffsetX &&
      this.cachedOffsetY === effectiveOffsetY
    ) {
      return this.cachedImageData;
    }

    const imageData = this.renderToImageDataFast(
      targetWidth,
      targetHeight,
      effectiveScale,
      effectiveOffsetX,
      effectiveOffsetY
    );

    this.cachedImageData = imageData;
    this.cachedScale = effectiveScale;
    this.cachedOffsetX = effectiveOffsetX;
    this.cachedOffsetY = effectiveOffsetY;

    return imageData;
  }

  renderToCanvas(
    canvas: HTMLCanvasElement,
    scale?: number,
    offsetX?: number,
    offsetY?: number
  ): boolean {
    if (!this.parsedDicom) {
      return false;
    }

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    const logicalWidth = displayWidth * dpr;
    const logicalHeight = displayHeight * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }

    if (canvas.width !== logicalWidth || canvas.height !== logicalHeight) {
      canvas.width = logicalWidth;
      canvas.height = logicalHeight;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      this.invalidateCache();
    }

    const effectiveScale = scale || 1;
    const effectiveOffsetX = offsetX || 0;
    const effectiveOffsetY = offsetY || 0;

    const imageData = this.renderToImageData(
      logicalWidth,
      logicalHeight,
      effectiveScale,
      effectiveOffsetX,
      effectiveOffsetY
    );

    if (!imageData) {
      return false;
    }

    ctx.putImageData(imageData, 0, 0);
    return true;
  }

  requestRender(
    canvas: HTMLCanvasElement,
    scale?: number,
    offsetX?: number,
    offsetY?: number
  ): void {
    if (this.isRendering) {
      this.pendingRender = true;
      return;
    }

    this.isRendering = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.renderToCanvas(canvas, scale, offsetX, offsetY);
      this.isRendering = false;

      if (this.pendingRender) {
        this.pendingRender = false;
        this.requestRender(canvas, scale, offsetX, offsetY);
      }
    });
  }

  getPixelValue(x: number, y: number, scale: number, offsetX: number, offsetY: number): number | null {
    if (!this.parsedDicom) {
      return null;
    }

    const { imageInfo, pixelData } = this.parsedDicom;
    const { rows, columns, rescaleIntercept, rescaleSlope } = imageInfo;

    const srcX = Math.floor((x - offsetX) / scale);
    const srcY = Math.floor((y - offsetY) / scale);

    if (srcX < 0 || srcX >= columns || srcY < 0 || srcY >= rows) {
      return null;
    }

    const srcIndex = srcY * columns + srcX;
    let value: number;

    if (pixelData instanceof Int16Array) {
      value = pixelData[srcIndex];
    } else if (pixelData instanceof Uint16Array) {
      value = pixelData[srcIndex];
    } else {
      value = pixelData[srcIndex];
    }

    const hasRescale = rescaleIntercept !== 0 || rescaleSlope !== 1;
    if (hasRescale) {
      if (rescaleSlope !== 1) {
        value = value * rescaleSlope;
      }
      if (rescaleIntercept !== 0) {
        value = value + rescaleIntercept;
      }
    }

    return value;
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.cachedImageData = null;
    this.parsedDicom = null;
    this.lut = null;
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastArgs: Parameters<T> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  let lastArgs: Parameters<T> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (!ticking) {
      requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(this, lastArgs);
        }
        ticking = false;
        lastArgs = null;
      });
      ticking = true;
    }
  };
}

import type { ParsedDicom, WindowLevelParams, PixelValueRange, LutArray } from '@/types/dicom';

export class DicomRenderer {
  private parsedDicom: ParsedDicom | null = null;
  private windowLevel: WindowLevelParams = { center: 0, width: 255 };
  private pixelRange: PixelValueRange = { min: 0, max: 255 };
  private lut: LutArray | null = null;
  private cachedWindowLevel: WindowLevelParams | null = null;

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
  }

  setWindowLevel(center: number, width: number): void {
    this.windowLevel = {
      center,
      width: Math.max(1, width)
    };
    this.lut = null;
  }

  getWindowLevel(): WindowLevelParams {
    return { ...this.windowLevel };
  }

  getPixelRange(): PixelValueRange {
    return { ...this.pixelRange };
  }

  private calculatePixelRange(): void {
    if (!this.parsedDicom) {
      this.pixelRange = { min: 0, max: 255 };
      return;
    }

    const { pixelData, imageInfo } = this.parsedDicom;
    const bitsStored = imageInfo.bitsStored || 8;
    const isSigned = imageInfo.photometricInterpretation === 'MONOCHROME1' ||
                     imageInfo.photometricInterpretation === 'MONOCHROME2';

    if (pixelData instanceof Int16Array) {
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      for (let i = 0; i < pixelData.length; i++) {
        const val = pixelData[i];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      this.pixelRange = { min, max };
    } else if (pixelData instanceof Uint16Array) {
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      for (let i = 0; i < pixelData.length; i++) {
        const val = pixelData[i];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      this.pixelRange = { min, max };
    } else {
      const maxValue = (1 << bitsStored) - 1;
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

    for (let i = 0; i < lutSize; i++) {
      const pixelValue = min + i;

      if (pixelValue <= low) {
        lut[i] = 0;
      } else if (pixelValue >= high) {
        lut[i] = 255;
      } else {
        lut[i] = Math.round(((pixelValue - low) / width) * 255);
      }
    }

    this.lut = lut;
    this.cachedWindowLevel = { ...this.windowLevel };

    return lut;
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

    const { imageInfo, pixelData } = this.parsedDicom;
    const { rows, columns, photometricInterpretation, rescaleIntercept, rescaleSlope } = imageInfo;

    const imageData = new ImageData(targetWidth, targetHeight);
    const lut = this.generateLut();
    const { min: pixelMin } = this.pixelRange;

    const effectiveScale = scale || Math.min(targetWidth / columns, targetHeight / rows);
    const effectiveOffsetX = offsetX || (targetWidth - columns * effectiveScale) / 2;
    const effectiveOffsetY = offsetY || (targetHeight - rows * effectiveScale) / 2;

    const isMonochrome1 = photometricInterpretation === 'MONOCHROME1';
    const isMonochrome2 = photometricInterpretation === 'MONOCHROME2';
    const isRgb = photometricInterpretation === 'RGB';

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor((x - effectiveOffsetX) / effectiveScale);
        const srcY = Math.floor((y - effectiveOffsetY) / effectiveScale);

        const pixelIndex = y * targetWidth + x;
        const dataIndex = pixelIndex * 4;

        if (srcX < 0 || srcX >= columns || srcY < 0 || srcY >= rows) {
          imageData.data[dataIndex] = 0;
          imageData.data[dataIndex + 1] = 0;
          imageData.data[dataIndex + 2] = 0;
          imageData.data[dataIndex + 3] = 255;
          continue;
        }

        let grayValue: number;

        if (isRgb) {
          const srcIndex = (srcY * columns + srcX) * 3;
          if (srcIndex + 2 < pixelData.length) {
            imageData.data[dataIndex] = pixelData[srcIndex];
            imageData.data[dataIndex + 1] = pixelData[srcIndex + 1];
            imageData.data[dataIndex + 2] = pixelData[srcIndex + 2];
            imageData.data[dataIndex + 3] = 255;
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

          if (rescaleSlope !== 0 && rescaleSlope !== 1) {
            rawValue = rawValue * rescaleSlope;
          }
          if (rescaleIntercept !== 0) {
            rawValue = rawValue + rescaleIntercept;
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

        imageData.data[dataIndex] = grayValue;
        imageData.data[dataIndex + 1] = grayValue;
        imageData.data[dataIndex + 2] = grayValue;
        imageData.data[dataIndex + 3] = 255;
      }
    }

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

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }

    const imageData = this.renderToImageData(
      canvas.width,
      canvas.height,
      scale,
      offsetX,
      offsetY
    );

    if (!imageData) {
      return false;
    }

    ctx.putImageData(imageData, 0, 0);
    return true;
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

    if (rescaleSlope !== 0 && rescaleSlope !== 1) {
      value = value * rescaleSlope;
    }
    if (rescaleIntercept !== 0) {
      value = value + rescaleIntercept;
    }

    return value;
  }
}

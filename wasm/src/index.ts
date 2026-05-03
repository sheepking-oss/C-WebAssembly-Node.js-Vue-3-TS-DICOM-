import type DicomParserModule from './dicom_parser';

export interface DicomMetadata {
  patientName: string;
  patientID: string;
  patientBirthDate: string;
  patientSex: string;
  patientAge: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  studyID: string;
  studyInstanceUID: string;
  seriesDate: string;
  seriesTime: string;
  seriesDescription: string;
  seriesNumber: string;
  seriesInstanceUID: string;
  modality: string;
  manufacturer: string;
  institutionName: string;
  stationName: string;
  imageType: string;
  instanceNumber: string;
  sopInstanceUID: string;
  sopClassUID: string;
  rows: string;
  columns: string;
  bitsAllocated: string;
  bitsStored: string;
  highBit: string;
  samplesPerPixel: string;
  photometricInterpretation: string;
  windowCenter: string;
  windowWidth: string;
  rescaleIntercept: string;
  rescaleSlope: string;
  pixelSpacing: string;
  sliceThickness: string;
  spacingBetweenSlices: string;
  imagePositionPatient: string;
  imageOrientationPatient: string;
  sliceLocation: string;
  bodyPartExamined: string;
  viewPosition: string;
  kvp: string;
  tubeCurrent: string;
  exposureTime: string;
  exposure: string;
  [key: string]: string;
}

export interface DicomImageInfo {
  rows: number;
  columns: number;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  samplesPerPixel: number;
  windowCenter: number;
  windowWidth: number;
  rescaleIntercept: number;
  rescaleSlope: number;
  photometricInterpretation: string;
}

export interface ParsedDicom {
  metadata: DicomMetadata;
  imageInfo: DicomImageInfo;
  pixelData: Uint8Array | Int16Array | Uint16Array;
  rawPixelData: Uint8Array;
}

let Module: typeof DicomParserModule | null = null;

async function loadModule(): Promise<typeof DicomParserModule> {
  if (Module) {
    return Module;
  }

  const moduleExports = await import('./dicom_parser.js');
  Module = await moduleExports.default();
  return Module as typeof DicomParserModule;
}

export class DicomParser {
  private module: typeof DicomParserModule | null = null;
  private parserPtr: number = 0;

  async init(): Promise<void> {
    this.module = await loadModule();
    this.parserPtr = this.module._dicom_create();
  }

  destroy(): void {
    if (this.parserPtr && this.module) {
      this.module._dicom_destroy(this.parserPtr);
      this.parserPtr = 0;
    }
  }

  parse(data: ArrayBuffer | Uint8Array): ParsedDicom {
    if (!this.module || !this.parserPtr) {
      throw new Error('DICOM 解析器未初始化');
    }

    const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
    const dataSize = uint8Data.length;

    const dataPtr = this.module._malloc(dataSize);
    if (!dataPtr) {
      throw new Error('内存分配失败');
    }

    try {
      this.module.HEAPU8.set(uint8Data, dataPtr);

      const success = this.module._dicom_parse(this.parserPtr, dataPtr, dataSize);
      if (!success) {
        throw new Error('DICOM 文件解析失败');
      }

      const metadata = this.getMetadata();
      const imageInfo = this.getImageInfo();
      const pixelData = this.getPixelData();
      const rawPixelData = this.getRawPixelData();

      return {
        metadata,
        imageInfo,
        pixelData,
        rawPixelData
      };
    } finally {
      this.module._free(dataPtr);
    }
  }

  private getMetadata(): DicomMetadata {
    if (!this.module || !this.parserPtr) {
      throw new Error('DICOM 解析器未初始化');
    }

    const jsonPtr = this.module._dicom_get_metadata_json(this.parserPtr);
    if (!jsonPtr) {
      return {} as DicomMetadata;
    }

    try {
      const jsonStr = this.module.UTF8ToString(jsonPtr);
      return JSON.parse(jsonStr) as DicomMetadata;
    } finally {
      this.module._dicom_free_string(jsonPtr);
    }
  }

  private getImageInfo(): DicomImageInfo {
    if (!this.module || !this.parserPtr) {
      throw new Error('DICOM 解析器未初始化');
    }

    return {
      rows: this.module._dicom_get_rows(this.parserPtr),
      columns: this.module._dicom_get_columns(this.parserPtr),
      bitsAllocated: this.module._dicom_get_bits_allocated(this.parserPtr),
      bitsStored: this.module._dicom_get_bits_stored(this.parserPtr),
      highBit: this.module._dicom_get_high_bit(this.parserPtr),
      samplesPerPixel: this.module._dicom_get_samples_per_pixel(this.parserPtr),
      windowCenter: this.module._dicom_get_window_center(this.parserPtr),
      windowWidth: this.module._dicom_get_window_width(this.parserPtr),
      rescaleIntercept: this.module._dicom_get_rescale_intercept(this.parserPtr),
      rescaleSlope: this.module._dicom_get_rescale_slope(this.parserPtr),
      photometricInterpretation: this.getMetadata().photometricInterpretation
    };
  }

  private getRawPixelData(): Uint8Array {
    if (!this.module || !this.parserPtr) {
      throw new Error('DICOM 解析器未初始化');
    }

    const sizePtr = this.module._malloc(4);
    if (!sizePtr) {
      throw new Error('内存分配失败');
    }

    try {
      const pixelDataPtr = this.module._dicom_get_pixel_data(this.parserPtr, sizePtr);
      const size = this.module.getValue(sizePtr, 'i32');

      if (!pixelDataPtr || size === 0) {
        return new Uint8Array();
      }

      return new Uint8Array(
        this.module.HEAPU8.buffer,
        pixelDataPtr,
        size
      ).slice();
    } finally {
      this.module._free(sizePtr);
    }
  }

  private getPixelData(): Uint8Array | Int16Array | Uint16Array {
    const rawData = this.getRawPixelData();
    const imageInfo = this.getImageInfo();

    if (rawData.length === 0) {
      return new Uint8Array();
    }

    const bitsAllocated = imageInfo.bitsAllocated;
    const isSigned = imageInfo.photometricInterpretation === 'MONOCHROME1' ||
                     imageInfo.photometricInterpretation === 'MONOCHROME2';

    if (bitsAllocated === 8) {
      return rawData;
    } else if (bitsAllocated === 16) {
      const numPixels = rawData.length / 2;
      const isLittleEndian = true;

      if (isSigned) {
        const result = new Int16Array(numPixels);
        for (let i = 0; i < numPixels; i++) {
          const byteOffset = i * 2;
          if (isLittleEndian) {
            result[i] = rawData[byteOffset] | (rawData[byteOffset + 1] << 8);
          } else {
            result[i] = (rawData[byteOffset] << 8) | rawData[byteOffset + 1];
          }
        }
        return result;
      } else {
        const result = new Uint16Array(numPixels);
        for (let i = 0; i < numPixels; i++) {
          const byteOffset = i * 2;
          if (isLittleEndian) {
            result[i] = rawData[byteOffset] | (rawData[byteOffset + 1] << 8);
          } else {
            result[i] = (rawData[byteOffset] << 8) | rawData[byteOffset + 1];
          }
        }
        return result;
      }
    }

    return rawData;
  }
}

export async function parseDicom(data: ArrayBuffer | Uint8Array): Promise<ParsedDicom> {
  const parser = new DicomParser();
  try {
    await parser.init();
    return parser.parse(data);
  } finally {
    parser.destroy();
  }
}

export async function initDicomParser(): Promise<DicomParser> {
  const parser = new DicomParser();
  await parser.init();
  return parser;
}

export * from './dicom_parser';

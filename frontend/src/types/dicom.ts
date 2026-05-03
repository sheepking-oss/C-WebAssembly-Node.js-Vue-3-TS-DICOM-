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

export interface WindowLevelParams {
  center: number;
  width: number;
}

export interface PixelValueRange {
  min: number;
  max: number;
}

export interface LutEntry {
  pixelValue: number;
  displayValue: number;
}

export type LutArray = Uint8ClampedArray;

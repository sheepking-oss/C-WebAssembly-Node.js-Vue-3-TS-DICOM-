import type { ParsedDicom, DicomMetadata, DicomImageInfo } from '@/types/dicom';

const TAG_PATIENT_NAME = 0x00100010;
const TAG_PATIENT_ID = 0x00100020;
const TAG_PATIENT_BIRTH_DATE = 0x00100030;
const TAG_PATIENT_SEX = 0x00100040;
const TAG_PATIENT_AGE = 0x00101010;

const TAG_STUDY_DATE = 0x00080020;
const TAG_STUDY_TIME = 0x00080030;
const TAG_STUDY_DESCRIPTION = 0x00081030;
const TAG_STUDY_ID = 0x00200010;
const TAG_STUDY_INSTANCE_UID = 0x0020000D;

const TAG_SERIES_DATE = 0x00080021;
const TAG_SERIES_TIME = 0x00080031;
const TAG_SERIES_DESCRIPTION = 0x0008103E;
const TAG_SERIES_NUMBER = 0x00200011;
const TAG_SERIES_INSTANCE_UID = 0x0020000E;

const TAG_MODALITY = 0x00080060;
const TAG_MANUFACTURER = 0x00080070;
const TAG_INSTITUTION_NAME = 0x00080080;
const TAG_STATION_NAME = 0x00081010;

const TAG_IMAGE_TYPE = 0x00080008;
const TAG_INSTANCE_NUMBER = 0x00200013;
const TAG_SOP_INSTANCE_UID = 0x00080018;
const TAG_SOP_CLASS_UID = 0x00080016;

const TAG_ROWS = 0x00280010;
const TAG_COLUMNS = 0x00280011;
const TAG_BITS_ALLOCATED = 0x00280100;
const TAG_BITS_STORED = 0x00280101;
const TAG_HIGH_BIT = 0x00280102;
const TAG_SAMPLES_PER_PIXEL = 0x00280002;
const TAG_PHOTOMETRIC_INTERPRETATION = 0x00280004;

const TAG_WINDOW_CENTER = 0x00281050;
const TAG_WINDOW_WIDTH = 0x00281051;
const TAG_RESCALE_INTERCEPT = 0x00281052;
const TAG_RESCALE_SLOPE = 0x00281053;

const TAG_PIXEL_SPACING = 0x00280030;
const TAG_SLICE_THICKNESS = 0x00180050;
const TAG_SPACING_BETWEEN_SLICES = 0x00180088;
const TAG_IMAGE_POSITION_PATIENT = 0x00200032;
const TAG_IMAGE_ORIENTATION_PATIENT = 0x00200037;
const TAG_SLICE_LOCATION = 0x00201041;

const TAG_BODY_PART_EXAMINED = 0x00180015;
const TAG_VIEW_POSITION = 0x00185101;
const TAG_KVP = 0x00180060;
const TAG_TUBE_CURRENT = 0x00181151;
const TAG_EXPOSURE_TIME = 0x00181150;
const TAG_EXPOSURE = 0x00181152;

const TAG_PIXEL_DATA = 0x7FE00010;

const VR_OB = 0x424F;
const VR_OW = 0x574F;
const VR_OF = 0x464F;
const VR_SQ = 0x5153;
const VR_UN = 0x4E55;

interface DicomElement {
  tag: number;
  vr: number;
  length: number;
  valueOffset: number;
}

function readUint16(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return data[offset] | (data[offset + 1] << 8);
  }
  return (data[offset] << 8) | data[offset + 1];
}

function readUint32(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (littleEndian) {
    return (
      data[offset] |
      (data[offset + 1] << 8) |
      (data[offset + 2] << 16) |
      (data[offset + 3] << 24)
    ) >>> 0;
  }
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  ) >>> 0;
}

function readInt16(data: Uint8Array, offset: number, littleEndian: boolean): number {
  const val = readUint16(data, offset, littleEndian);
  return val >= 0x8000 ? val - 0x10000 : val;
}

function readInt32(data: Uint8Array, offset: number, littleEndian: boolean): number {
  const val = readUint32(data, offset, littleEndian);
  return val >= 0x80000000 ? val - 0x100000000 : val;
}

function decodeString(data: Uint8Array, offset: number, length: number): string {
  const bytes = data.slice(offset, offset + length);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 32 && byte < 127) {
      result += String.fromCharCode(byte);
    } else if (byte !== 0) {
      result += '?';
    }
  }
  return result.trim();
}

function parseNumberString(str: string): number {
  const trimmed = str.trim();
  if (trimmed === '') return 0;
  const firstValue = trimmed.split('\\')[0].trim();
  const num = parseFloat(firstValue);
  return isNaN(num) ? 0 : num;
}

function checkPreamble(data: Uint8Array): { hasPreamble: boolean; offset: number } {
  if (data.length < 132) {
    return { hasPreamble: false, offset: 0 };
  }

  const magic = data.slice(128, 132);
  if (
    magic[0] === 0x44 &&
    magic[1] === 0x49 &&
    magic[2] === 0x43 &&
    magic[3] === 0x4D
  ) {
    return { hasPreamble: true, offset: 132 };
  }

  return { hasPreamble: false, offset: 0 };
}

function detectTransferSyntax(
  data: Uint8Array,
  offset: number
): { isExplicitVR: boolean; isLittleEndian: boolean; newOffset: number } {
  let currentOffset = offset;
  let isExplicitVR = true;
  let isLittleEndian = true;

  while (currentOffset + 8 <= data.length) {
    const group = readUint16(data, currentOffset, true);
    const element = readUint16(data, currentOffset + 2, true);

    if (group === 0xFFFE) {
      currentOffset += 8;
      continue;
    }

    if (group === 0x0002 && element === 0x0010) {
      const testVR = readUint16(data, currentOffset + 4, true);
      isExplicitVR = (testVR >= 0x4100 && testVR <= 0x5A5A);

      if (isExplicitVR) {
        const vrStr = String.fromCharCode(testVR & 0xFF, testVR >> 8);

        if (vrStr === 'UI' || vrStr === 'CS') {
          let length = readUint16(data, currentOffset + 6, true);
          const valueOffset = currentOffset + 8;

          if (valueOffset + length <= data.length) {
            const tsUID = decodeString(data, valueOffset, length);
            const firstUID = tsUID.split('\\')[0].trim();

            if (firstUID === '1.2.840.10008.1.2') {
              isExplicitVR = false;
              isLittleEndian = true;
            } else if (firstUID === '1.2.840.10008.1.2.1') {
              isExplicitVR = true;
              isLittleEndian = true;
            } else if (firstUID === '1.2.840.10008.1.2.2') {
              isExplicitVR = true;
              isLittleEndian = false;
            } else if (firstUID === '1.2.840.10008.1.2.99') {
              isExplicitVR = false;
              isLittleEndian = false;
            }
          }
        }
      }

      break;
    }

    if (group > 0x0002) {
      break;
    }

    const testVR = readUint16(data, currentOffset + 4, true);
    const looksLikeVR = (testVR >= 0x4100 && testVR <= 0x5A5A);

    if (looksLikeVR) {
      const vrStr = String.fromCharCode(testVR & 0xFF, testVR >> 8);
      const needsExtendedLength =
        vrStr === 'OB' ||
        vrStr === 'OW' ||
        vrStr === 'OF' ||
        vrStr === 'SQ' ||
        vrStr === 'UN' ||
        vrStr === 'UC' ||
        vrStr === 'UR' ||
        vrStr === 'UT' ||
        vrStr === 'OD' ||
        vrStr === 'OL' ||
        vrStr === 'OV' ||
        vrStr === 'SL' ||
        vrStr === 'SV' ||
        vrStr === 'UL' ||
        vrStr === 'UV';

      if (needsExtendedLength) {
        currentOffset += 12;
      } else {
        const length = readUint16(data, currentOffset + 6, true);
        currentOffset += 8 + length;
      }
    } else {
      const length = readUint32(data, currentOffset + 4, true);
      currentOffset += 8 + (length === 0xFFFFFFFF ? 0 : length);
    }
  }

  return { isExplicitVR, isLittleEndian, newOffset: offset };
}

function parseDataSet(
  data: Uint8Array,
  offset: number,
  isExplicitVR: boolean,
  isLittleEndian: boolean
): Map<number, DicomElement> {
  const elements = new Map<number, DicomElement>();
  let currentOffset = offset;

  while (currentOffset + 8 <= data.length) {
    const group = readUint16(data, currentOffset, isLittleEndian);
    const element = readUint16(data, currentOffset + 2, isLittleEndian);
    const tag = (group << 16) | element;

    if (group === 0xFFFE) {
      const itemLength = readUint32(data, currentOffset + 4, isLittleEndian);
      if (itemLength === 0xFFFFFFFF) {
        currentOffset += 8;
        while (currentOffset + 8 <= data.length) {
          const testGroup = readUint16(data, currentOffset, isLittleEndian);
          const testElement = readUint16(data, currentOffset + 2, isLittleEndian);
          if (testGroup === 0xFFFE && (testElement === 0xE00D || testElement === 0xE0DD)) {
            currentOffset += 8;
            break;
          }

          const innerElements = parseDataSet(data, currentOffset, isExplicitVR, isLittleEndian);
          if (innerElements.size === 0) {
            currentOffset += 8;
          } else {
            break;
          }
        }
      } else {
        currentOffset += 8 + itemLength;
      }
      continue;
    }

    let vr = 0;
    let length: number;
    let valueOffset: number;

    if (isExplicitVR) {
      vr = readUint16(data, currentOffset + 4, isLittleEndian);

      const needsExtendedLength =
        vr === VR_OB ||
        vr === VR_OW ||
        vr === VR_OF ||
        vr === VR_SQ ||
        vr === VR_UN;

      if (needsExtendedLength) {
        length = readUint32(data, currentOffset + 8, isLittleEndian);
        valueOffset = currentOffset + 12;
      } else {
        length = readUint16(data, currentOffset + 6, isLittleEndian);
        valueOffset = currentOffset + 8;
      }
    } else {
      length = readUint32(data, currentOffset + 4, isLittleEndian);
      valueOffset = currentOffset + 8;
    }

    if (length === 0xFFFFFFFF) {
      if (tag === TAG_PIXEL_DATA) {
        const startOffset = valueOffset;
        let foundEnd = false;
        let pixelDataSize = 0;

        while (valueOffset + 8 <= data.length) {
          const itemGroup = readUint16(data, valueOffset, isLittleEndian);
          const itemElement = readUint16(data, valueOffset + 2, isLittleEndian);

          if (itemGroup === 0xFFFE && (itemElement === 0xE0DD || itemElement === 0xE00D)) {
            const itemLength2 = readUint32(data, valueOffset + 4, isLittleEndian);
            if (itemLength2 === 0) {
              foundEnd = true;
              pixelDataSize = valueOffset - startOffset - 8;
              break;
            }
            valueOffset += 8 + itemLength2;
          } else {
            break;
          }
        }

        if (foundEnd) {
          elements.set(tag, {
            tag,
            vr: VR_OW,
            length: pixelDataSize,
            valueOffset: startOffset + 8
          });
        }
      }

      currentOffset = valueOffset;
      continue;
    }

    if (valueOffset + length > data.length) {
      break;
    }

    elements.set(tag, {
      tag,
      vr,
      length,
      valueOffset
    });

    currentOffset = valueOffset + length;
  }

  return elements;
}

function getStringValue(
  elements: Map<number, DicomElement>,
  tag: number,
  data: Uint8Array
): string {
  const element = elements.get(tag);
  if (!element) return '';
  return decodeString(data, element.valueOffset, element.length);
}

function getNumberValue(
  elements: Map<number, DicomElement>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean,
  vr: number
): number {
  const element = elements.get(tag);
  if (!element) return 0;

  const str = decodeString(data, element.valueOffset, element.length);
  return parseNumberString(str);
}

function getUint16Value(
  elements: Map<number, DicomElement>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element || element.length < 2) return 0;
  return readUint16(data, element.valueOffset, isLittleEndian);
}

function getInt16Value(
  elements: Map<number, DicomElement>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element || element.length < 2) return 0;
  return readInt16(data, element.valueOffset, isLittleEndian);
}

function extractPixelData(
  elements: Map<number, DicomElement>,
  data: Uint8Array,
  bitsAllocated: number,
  bitsStored: number,
  isLittleEndian: boolean
): Uint8Array {
  const element = elements.get(TAG_PIXEL_DATA);
  if (!element || element.length === 0) {
    return new Uint8Array();
  }

  return data.slice(element.valueOffset, element.valueOffset + element.length);
}

export function parseDicom(data: ArrayBuffer | Uint8Array): ParsedDicom {
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);

  const { hasPreamble, offset: preambleOffset } = checkPreamble(uint8Data);

  const { isExplicitVR, isLittleEndian } = detectTransferSyntax(
    uint8Data,
    preambleOffset
  );

  const elements = parseDataSet(uint8Data, preambleOffset, isExplicitVR, isLittleEndian);

  const rows = getUint16Value(elements, TAG_ROWS, uint8Data, isLittleEndian);
  const columns = getUint16Value(elements, TAG_COLUMNS, uint8Data, isLittleEndian);
  const bitsAllocated = getUint16Value(elements, TAG_BITS_ALLOCATED, uint8Data, isLittleEndian) || 8;
  const bitsStored = getUint16Value(elements, TAG_BITS_STORED, uint8Data, isLittleEndian) || bitsAllocated;
  const highBit = getUint16Value(elements, TAG_HIGH_BIT, uint8Data, isLittleEndian) || (bitsStored - 1);
  const samplesPerPixel = getUint16Value(elements, TAG_SAMPLES_PER_PIXEL, uint8Data, isLittleEndian) || 1;

  const photometricInterpretation = getStringValue(elements, TAG_PHOTOMETRIC_INTERPRETATION, uint8Data);

  const windowCenterStr = getStringValue(elements, TAG_WINDOW_CENTER, uint8Data);
  const windowWidthStr = getStringValue(elements, TAG_WINDOW_WIDTH, uint8Data);

  let windowCenter = parseNumberString(windowCenterStr);
  let windowWidth = parseNumberString(windowWidthStr);

  if (windowWidth === 0) {
    if (bitsAllocated <= 8) {
      windowCenter = 128;
      windowWidth = 256;
    } else {
      windowCenter = 0;
      windowWidth = 400;
    }
  }

  const rescaleInterceptStr = getStringValue(elements, TAG_RESCALE_INTERCEPT, uint8Data);
  const rescaleSlopeStr = getStringValue(elements, TAG_RESCALE_SLOPE, uint8Data);

  const rescaleIntercept = parseNumberString(rescaleInterceptStr);
  const rescaleSlope = parseNumberString(rescaleSlopeStr) || 1;

  const pixelData = extractPixelData(
    elements,
    uint8Data,
    bitsAllocated,
    bitsStored,
    isLittleEndian
  );

  let typedPixelData: Uint8Array | Int16Array | Uint16Array;

  if (bitsAllocated === 16) {
    const numPixels = pixelData.length / 2;
    const isSigned = photometricInterpretation === 'MONOCHROME1' ||
                     photometricInterpretation === 'MONOCHROME2';

    if (isSigned) {
      typedPixelData = new Int16Array(numPixels);
      for (let i = 0; i < numPixels; i++) {
        const byteOffset = i * 2;
        if (isLittleEndian) {
          typedPixelData[i] = pixelData[byteOffset] | (pixelData[byteOffset + 1] << 8);
        } else {
          typedPixelData[i] = (pixelData[byteOffset] << 8) | pixelData[byteOffset + 1];
        }
      }
    } else {
      typedPixelData = new Uint16Array(numPixels);
      for (let i = 0; i < numPixels; i++) {
        const byteOffset = i * 2;
        if (isLittleEndian) {
          typedPixelData[i] = pixelData[byteOffset] | (pixelData[byteOffset + 1] << 8);
        } else {
          typedPixelData[i] = (pixelData[byteOffset] << 8) | pixelData[byteOffset + 1];
        }
      }
    }
  } else {
    typedPixelData = pixelData;
  }

  const metadata: DicomMetadata = {
    patientName: getStringValue(elements, TAG_PATIENT_NAME, uint8Data),
    patientID: getStringValue(elements, TAG_PATIENT_ID, uint8Data),
    patientBirthDate: getStringValue(elements, TAG_PATIENT_BIRTH_DATE, uint8Data),
    patientSex: getStringValue(elements, TAG_PATIENT_SEX, uint8Data),
    patientAge: getStringValue(elements, TAG_PATIENT_AGE, uint8Data),
    studyDate: getStringValue(elements, TAG_STUDY_DATE, uint8Data),
    studyTime: getStringValue(elements, TAG_STUDY_TIME, uint8Data),
    studyDescription: getStringValue(elements, TAG_STUDY_DESCRIPTION, uint8Data),
    studyID: getStringValue(elements, TAG_STUDY_ID, uint8Data),
    studyInstanceUID: getStringValue(elements, TAG_STUDY_INSTANCE_UID, uint8Data),
    seriesDate: getStringValue(elements, TAG_SERIES_DATE, uint8Data),
    seriesTime: getStringValue(elements, TAG_SERIES_TIME, uint8Data),
    seriesDescription: getStringValue(elements, TAG_SERIES_DESCRIPTION, uint8Data),
    seriesNumber: getStringValue(elements, TAG_SERIES_NUMBER, uint8Data),
    seriesInstanceUID: getStringValue(elements, TAG_SERIES_INSTANCE_UID, uint8Data),
    modality: getStringValue(elements, TAG_MODALITY, uint8Data),
    manufacturer: getStringValue(elements, TAG_MANUFACTURER, uint8Data),
    institutionName: getStringValue(elements, TAG_INSTITUTION_NAME, uint8Data),
    stationName: getStringValue(elements, TAG_STATION_NAME, uint8Data),
    imageType: getStringValue(elements, TAG_IMAGE_TYPE, uint8Data),
    instanceNumber: getStringValue(elements, TAG_INSTANCE_NUMBER, uint8Data),
    sopInstanceUID: getStringValue(elements, TAG_SOP_INSTANCE_UID, uint8Data),
    sopClassUID: getStringValue(elements, TAG_SOP_CLASS_UID, uint8Data),
    rows: rows.toString(),
    columns: columns.toString(),
    bitsAllocated: bitsAllocated.toString(),
    bitsStored: bitsStored.toString(),
    highBit: highBit.toString(),
    samplesPerPixel: samplesPerPixel.toString(),
    photometricInterpretation,
    windowCenter: windowCenter.toString(),
    windowWidth: windowWidth.toString(),
    rescaleIntercept: rescaleIntercept.toString(),
    rescaleSlope: rescaleSlope.toString(),
    pixelSpacing: getStringValue(elements, TAG_PIXEL_SPACING, uint8Data),
    sliceThickness: getStringValue(elements, TAG_SLICE_THICKNESS, uint8Data),
    spacingBetweenSlices: getStringValue(elements, TAG_SPACING_BETWEEN_SLICES, uint8Data),
    imagePositionPatient: getStringValue(elements, TAG_IMAGE_POSITION_PATIENT, uint8Data),
    imageOrientationPatient: getStringValue(elements, TAG_IMAGE_ORIENTATION_PATIENT, uint8Data),
    sliceLocation: getStringValue(elements, TAG_SLICE_LOCATION, uint8Data),
    bodyPartExamined: getStringValue(elements, TAG_BODY_PART_EXAMINED, uint8Data),
    viewPosition: getStringValue(elements, TAG_VIEW_POSITION, uint8Data),
    kvp: getStringValue(elements, TAG_KVP, uint8Data),
    tubeCurrent: getStringValue(elements, TAG_TUBE_CURRENT, uint8Data),
    exposureTime: getStringValue(elements, TAG_EXPOSURE_TIME, uint8Data),
    exposure: getStringValue(elements, TAG_EXPOSURE, uint8Data)
  };

  const imageInfo: DicomImageInfo = {
    rows,
    columns,
    bitsAllocated,
    bitsStored,
    highBit,
    samplesPerPixel,
    windowCenter,
    windowWidth,
    rescaleIntercept,
    rescaleSlope,
    photometricInterpretation
  };

  return {
    metadata,
    imageInfo,
    pixelData: typedPixelData,
    rawPixelData: pixelData
  };
}

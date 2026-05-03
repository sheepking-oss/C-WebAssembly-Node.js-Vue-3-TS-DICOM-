import type {
  ParsedDicom,
  DicomMetadata,
  DicomImageInfo,
  DicomValue,
  DicomTag,
  DicomVR
} from '@/types/dicom';

const TAG_PATIENT_NAME = 0x00100010;
const TAG_PATIENT_ID = 0x00100020;
const TAG_PATIENT_BIRTH_DATE = 0x00100030;
const TAG_PATIENT_SEX = 0x00100040;
const TAG_PATIENT_AGE = 0x00101010;
const TAG_PATIENT_SIZE = 0x00101020;
const TAG_PATIENT_WEIGHT = 0x00101030;

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
const TAG_MANUFACTURER_MODEL_NAME = 0x00081090;
const TAG_DEVICE_SERIAL_NUMBER = 0x00181000;
const TAG_SOFTWARE_VERSIONS = 0x00181020;

const TAG_IMAGE_TYPE = 0x00080008;
const TAG_INSTANCE_NUMBER = 0x00200013;
const TAG_SOP_INSTANCE_UID = 0x00080018;
const TAG_SOP_CLASS_UID = 0x00080016;
const TAG_ACQUISITION_DATE = 0x00080022;
const TAG_ACQUISITION_TIME = 0x00080032;
const TAG_CONTENT_DATE = 0x00080023;
const TAG_CONTENT_TIME = 0x00080033;
const TAG_IMAGE_COMMENTS = 0x00204000;

const TAG_ROWS = 0x00280010;
const TAG_COLUMNS = 0x00280011;
const TAG_BITS_ALLOCATED = 0x00280100;
const TAG_BITS_STORED = 0x00280101;
const TAG_HIGH_BIT = 0x00280102;
const TAG_SAMPLES_PER_PIXEL = 0x00280002;
const TAG_PHOTOMETRIC_INTERPRETATION = 0x00280004;
const TAG_PIXEL_REPRESENTATION = 0x00280103;
const TAG_SMALLEST_IMAGE_PIXEL_VALUE = 0x00280106;
const TAG_LARGEST_IMAGE_PIXEL_VALUE = 0x00280107;

const TAG_WINDOW_CENTER = 0x00281050;
const TAG_WINDOW_WIDTH = 0x00281051;
const TAG_WINDOW_CENTER_WIDTH_EXPLANATION = 0x00281055;
const TAG_RESCALE_INTERCEPT = 0x00281052;
const TAG_RESCALE_SLOPE = 0x00281053;
const TAG_RESCALE_TYPE = 0x00281054;
const TAG_PRESENTATION_LUT_SHAPE = 0x20500020;

const TAG_PIXEL_SPACING = 0x00280030;
const TAG_IMAGE_POSITION_PATIENT = 0x00200032;
const TAG_IMAGE_ORIENTATION_PATIENT = 0x00200037;
const TAG_SLICE_LOCATION = 0x00201041;
const TAG_SLICE_THICKNESS = 0x00180050;
const TAG_SPACING_BETWEEN_SLICES = 0x00180088;
const TAG_FRAME_OF_REFERENCE_UID = 0x00200052;
const TAG_POSITION_REFERENCE_INDICATOR = 0x00201040;

const TAG_NUMBER_OF_FRAMES = 0x00280008;
const TAG_FRAME_INCREMENT_POINTER = 0x00280009;
const TAG_FRAME_TIME = 0x00181063;
const TAG_FRAME_TIME_VECTOR = 0x00181065;
const TAG_CINE_RATE = 0x00180040;
const TAG_RECOMMENDED_DISPLAY_FRAME_RATE = 0x00289003;

const TAG_BODY_PART_EXAMINED = 0x00180015;
const TAG_PATIENT_POSITION = 0x00185100;
const TAG_VIEW_POSITION = 0x00185101;
const TAG_KILOVOLTAGE_PEAK = 0x00180060;
const TAG_TABLE_HEIGHT = 0x00181130;
const TAG_ROTATION_DIRECTION = 0x00181140;
const TAG_EXPOSURE_TIME = 0x00181150;
const TAG_XRAY_TUBE_CURRENT = 0x00181151;
const TAG_EXPOSURE = 0x00181152;
const TAG_EXPOSURE_IN_MAS = 0x00181153;
const TAG_FILTER_TYPE = 0x00181160;
const TAG_GENERATOR_POWER = 0x00181170;
const TAG_FOCAL_SPOTS = 0x00181190;
const TAG_CONVOLUTION_KERNEL = 0x00181210;
const TAG_SCAN_TYPE = 0x00180023;
const TAG_SCAN_OPTIONS = 0x00180022;
const TAG_SINGLE_COLLIMATION_WIDTH = 0x00180090;
const TAG_TOTAL_COLLIMATION_WIDTH = 0x00180091;
const TAG_NOMINAL_SLICE_THICKNESS = 0x00180051;
const TAG_TABLE_SPEED = 0x00181131;
const TAG_TABLE_FEED_PER_ROTATION = 0x00181132;
const TAG_SPIRAL_PITCH_FACTOR = 0x00181134;
const TAG_DATA_COLLECTION_DIAMETER = 0x00180092;
const TAG_RECONSTRUCTION_DIAMETER = 0x00180093;
const TAG_DISTANCE_SOURCE_TO_DETECTOR = 0x00181110;
const TAG_DISTANCE_SOURCE_TO_ISOCENTER = 0x00181111;
const TAG_GANTRY_DETECTOR_TILT = 0x00181120;

const TAG_LOSSY_IMAGE_COMPRESSION = 0x00282110;
const TAG_LOSSY_IMAGE_COMPRESSION_RATIO = 0x00282112;
const TAG_LOSSY_IMAGE_COMPRESSION_METHOD = 0x00282114;

const TAG_SPECIFIC_CHARACTER_SET = 0x00080005;
const TAG_INSTITUTIONAL_DEPARTMENT_NAME = 0x00081040;
const TAG_OPERATOR_NAME = 0x00081070;
const TAG_PERFORMING_PHYSICIAN_NAME = 0x00081050;
const TAG_REFERRING_PHYSICIAN_NAME = 0x00080090;
const TAG_ACCESSION_NUMBER = 0x00080050;
const TAG_PROTOCOL_NAME = 0x00181030;
const TAG_LATERALITY = 0x00200060;

const TAG_PIXEL_DATA = 0x7FE00010;

const VR_OB = 0x424F;
const VR_OW = 0x574F;
const VR_OF = 0x464F;
const VR_SQ = 0x5153;
const VR_UN = 0x4E55;
const VR_UC = 0x4355;
const VR_UR = 0x5255;
const VR_UT = 0x5455;
const VR_OD = 0x444F;
const VR_OL = 0x4C4F;
const VR_OV = 0x564F;
const VR_SL = 0x4C53;
const VR_SV = 0x5653;
const VR_UL = 0x4C55;
const VR_UV = 0x5655;

interface DicomElementInternal {
  tag: number;
  vr: number;
  length: number;
  valueOffset: number;
  rawData?: Uint8Array;
}

function readUint16(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (offset + 2 > data.length) return 0;
  if (littleEndian) {
    return data[offset] | (data[offset + 1] << 8);
  }
  return (data[offset] << 8) | data[offset + 1];
}

function readUint32(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (offset + 4 > data.length) return 0;
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

function readFloat32(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (offset + 4 > data.length) return 0;
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  for (let i = 0; i < 4; i++) {
    view.setUint8(i, littleEndian ? data[offset + i] : data[offset + 3 - i]);
  }
  return view.getFloat32(0, true);
}

function readFloat64(data: Uint8Array, offset: number, littleEndian: boolean): number {
  if (offset + 8 > data.length) return 0;
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, littleEndian ? data[offset + i] : data[offset + 7 - i]);
  }
  return view.getFloat64(0, true);
}

function decodeString(data: Uint8Array, offset: number, length: number): string {
  if (length <= 0 || offset + length > data.length) return '';
  
  const bytes = data.slice(offset, offset + length);
  let result = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte >= 32 && byte < 127) {
      result += String.fromCharCode(byte);
    } else if (byte === 0) {
      continue;
    }
  }
  
  return result.trim();
}

function parseMultiValue(str: string): string[] {
  if (!str) return [];
  return str.split('\\').map(s => s.trim()).filter(s => s.length > 0);
}

function parseNumberString(str: string): number {
  const trimmed = str.trim();
  if (trimmed === '') return 0;
  const firstValue = trimmed.split('\\')[0].trim();
  const num = parseFloat(firstValue);
  return isNaN(num) ? 0 : num;
}

function parseNumberArray(str: string): number[] {
  const values = parseMultiValue(str);
  return values.map(v => parseFloat(v)).filter(v => !isNaN(v));
}

function parseTagToNumber(group: number, element: number): number {
  return (group << 16) | element;
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
            } else if (firstUID === '1.2.840.10008.1.2.1.99') {
              isExplicitVR = true;
              isLittleEndian = true;
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
): Map<number, DicomElementInternal> {
  const elements = new Map<number, DicomElementInternal>();
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
        if (currentOffset + 12 > data.length) {
          break;
        }
        length = readUint32(data, currentOffset + 8, isLittleEndian);
        valueOffset = currentOffset + 12;
      } else {
        if (currentOffset + 8 > data.length) {
          break;
        }
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
            valueOffset: startOffset + 8,
            rawData: data.slice(startOffset + 8, startOffset + 8 + pixelDataSize)
          });
        }
      }

      currentOffset = valueOffset;
      continue;
    }

    if (valueOffset + length > data.length) {
      break;
    }

    const rawData = data.slice(valueOffset, valueOffset + length);

    elements.set(tag, {
      tag,
      vr,
      length,
      valueOffset,
      rawData
    });

    currentOffset = valueOffset + length;
  }

  return elements;
}

function getStringValue(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array
): string {
  const element = elements.get(tag);
  if (!element || !element.rawData) return '';
  return decodeString(element.rawData, 0, element.rawData.length);
}

function getMultiStringValue(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array
): string[] {
  const str = getStringValue(elements, tag, data);
  return parseMultiValue(str);
}

function getNumberValue(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element) return 0;

  const str = getStringValue(elements, tag, data);
  return parseNumberString(str);
}

function getNumberArrayValue(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number[] {
  const element = elements.get(tag);
  if (!element || !element.rawData) return [];

  const str = decodeString(element.rawData, 0, element.rawData.length);
  return parseNumberArray(str);
}

function getUint16Value(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element || !element.rawData || element.rawData.length < 2) return 0;
  return readUint16(element.rawData, 0, isLittleEndian);
}

function getInt16Value(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element || !element.rawData || element.rawData.length < 2) return 0;
  return readInt16(element.rawData, 0, isLittleEndian);
}

function getUint32Value(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element || !element.rawData || element.rawData.length < 4) return 0;
  return readUint32(element.rawData, 0, isLittleEndian);
}

function getInt32Value(
  elements: Map<number, DicomElementInternal>,
  tag: number,
  data: Uint8Array,
  isLittleEndian: boolean
): number {
  const element = elements.get(tag);
  if (!element || !element.rawData || element.rawData.length < 4) return 0;
  return readInt32(element.rawData, 0, isLittleEndian);
}

function extractPixelData(
  elements: Map<number, DicomElementInternal>,
  data: Uint8Array,
  bitsAllocated: number,
  bitsStored: number,
  isLittleEndian: boolean
): Uint8Array {
  const element = elements.get(TAG_PIXEL_DATA);
  if (!element) {
    return new Uint8Array();
  }

  if (element.rawData) {
    return element.rawData;
  }

  if (element.valueOffset + element.length > data.length) {
    return new Uint8Array();
  }

  return data.slice(element.valueOffset, element.valueOffset + element.length);
}

function getElementSafe<T>(
  value: T | undefined,
  defaultValue: T
): T {
  return value !== undefined ? value : defaultValue;
}

export function parseDicom(data: ArrayBuffer | Uint8Array): ParsedDicom {
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);

  const { hasPreamble, offset: preambleOffset } = checkPreamble(uint8Data);

  const { isExplicitVR, isLittleEndian } = detectTransferSyntax(
    uint8Data,
    preambleOffset
  );

  const elements = parseDataSet(uint8Data, preambleOffset, isExplicitVR, isLittleEndian);

  const specificCharacterSet = getMultiStringValue(elements, TAG_SPECIFIC_CHARACTER_SET, uint8Data);

  const rows = getUint16Value(elements, TAG_ROWS, uint8Data, isLittleEndian);
  const columns = getUint16Value(elements, TAG_COLUMNS, uint8Data, isLittleEndian);
  const bitsAllocated = getUint16Value(elements, TAG_BITS_ALLOCATED, uint8Data, isLittleEndian) || 8;
  const bitsStored = getUint16Value(elements, TAG_BITS_STORED, uint8Data, isLittleEndian) || bitsAllocated;
  const highBit = getUint16Value(elements, TAG_HIGH_BIT, uint8Data, isLittleEndian) || (bitsStored - 1);
  const samplesPerPixel = getUint16Value(elements, TAG_SAMPLES_PER_PIXEL, uint8Data, isLittleEndian) || 1;
  const pixelRepresentation = getUint16Value(elements, TAG_PIXEL_REPRESENTATION, uint8Data, isLittleEndian);

  const photometricInterpretation = getStringValue(elements, TAG_PHOTOMETRIC_INTERPRETATION, uint8Data);

  const windowCenters = getNumberArrayValue(elements, TAG_WINDOW_CENTER, uint8Data, isLittleEndian);
  const windowWidths = getNumberArrayValue(elements, TAG_WINDOW_WIDTH, uint8Data, isLittleEndian);

  let windowCenter = windowCenters.length > 0 ? windowCenters[0] : 0;
  let windowWidth = windowWidths.length > 0 ? windowWidths[0] : 255;

  if (windowWidth === 0) {
    if (bitsAllocated <= 8) {
      windowCenter = 128;
      windowWidth = 256;
    } else {
      windowCenter = 0;
      windowWidth = 400;
    }
  }

  const rescaleIntercept = getNumberValue(elements, TAG_RESCALE_INTERCEPT, uint8Data, isLittleEndian);
  const rescaleSlope = getNumberValue(elements, TAG_RESCALE_SLOPE, uint8Data, isLittleEndian) || 1;

  const numberOfFramesStr = getStringValue(elements, TAG_NUMBER_OF_FRAMES, uint8Data);
  const numberOfFrames = numberOfFramesStr ? parseInt(numberOfFramesStr, 10) : 1;
  const isMultiFrame = numberOfFrames > 1;

  const frameTime = getNumberValue(elements, TAG_FRAME_TIME, uint8Data, isLittleEndian);
  const frameTimeVector = getNumberArrayValue(elements, TAG_FRAME_TIME_VECTOR, uint8Data, isLittleEndian);
  const frameIncrementPointer = getNumberArrayValue(elements, TAG_FRAME_INCREMENT_POINTER, uint8Data, isLittleEndian);
  const cineRate = getNumberValue(elements, TAG_CINE_RATE, uint8Data, isLittleEndian);
  const recommendedDisplayFrameRate = getNumberValue(elements, TAG_RECOMMENDED_DISPLAY_FRAME_RATE, uint8Data, isLittleEndian);

  const pixelData = extractPixelData(
    elements,
    uint8Data,
    bitsAllocated,
    bitsStored,
    isLittleEndian
  );

  let typedPixelData: Uint8Array | Int16Array | Uint16Array;
  let frames: Array<Uint8Array | Int16Array | Uint16Array> | undefined;

  const pixelsPerFrame = rows * columns * samplesPerPixel;
  const bytesPerPixel = bitsAllocated / 8;
  const frameSize = pixelsPerFrame * bytesPerPixel;

  if (bitsAllocated === 16) {
    const numPixels = pixelData.length / 2;
    const isSigned = pixelRepresentation === 1 ||
                     photometricInterpretation === 'MONOCHROME1' ||
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

    if (isMultiFrame && numberOfFrames > 1) {
      frames = [];
      const pixelsPerFrame16 = rows * columns * samplesPerPixel;
      for (let f = 0; f < numberOfFrames; f++) {
        const startIdx = f * pixelsPerFrame16;
        const endIdx = startIdx + pixelsPerFrame16;
        if (endIdx <= typedPixelData.length) {
          frames.push(typedPixelData.slice(startIdx, endIdx));
        }
      }
    }
  } else {
    typedPixelData = pixelData;

    if (isMultiFrame && numberOfFrames > 1) {
      frames = [];
      const pixelsPerFrame8 = rows * columns * samplesPerPixel;
      for (let f = 0; f < numberOfFrames; f++) {
        const startIdx = f * pixelsPerFrame8;
        const endIdx = startIdx + pixelsPerFrame8;
        if (endIdx <= typedPixelData.length) {
          frames.push(typedPixelData.slice(startIdx, endIdx));
        }
      }
    }
  }

  const imageType = getMultiStringValue(elements, TAG_IMAGE_TYPE, uint8Data);
  const softwareVersions = getMultiStringValue(elements, TAG_SOFTWARE_VERSIONS, uint8Data);
  const focalSpots = getNumberArrayValue(elements, TAG_FOCAL_SPOTS, uint8Data, isLittleEndian);
  const scanOptions = getMultiStringValue(elements, TAG_SCAN_OPTIONS, uint8Data);
  const imageOrientationPatient = getNumberArrayValue(elements, TAG_IMAGE_ORIENTATION_PATIENT, uint8Data, isLittleEndian);
  const imagePositionPatient = getNumberArrayValue(elements, TAG_IMAGE_POSITION_PATIENT, uint8Data, isLittleEndian);
  const pixelSpacing = getNumberArrayValue(elements, TAG_PIXEL_SPACING, uint8Data, isLittleEndian);
  const lossyImageCompressionRatio = getNumberArrayValue(elements, TAG_LOSSY_IMAGE_COMPRESSION_RATIO, uint8Data, isLittleEndian);
  const lossyImageCompressionMethod = getMultiStringValue(elements, TAG_LOSSY_IMAGE_COMPRESSION_METHOD, uint8Data);

  const metadata: DicomMetadata = {
    patientName: getStringValue(elements, TAG_PATIENT_NAME, uint8Data),
    patientID: getStringValue(elements, TAG_PATIENT_ID, uint8Data),
    patientBirthDate: getStringValue(elements, TAG_PATIENT_BIRTH_DATE, uint8Data),
    patientSex: getStringValue(elements, TAG_PATIENT_SEX, uint8Data),
    patientAge: getStringValue(elements, TAG_PATIENT_AGE, uint8Data),
    patientSize: getNumberValue(elements, TAG_PATIENT_SIZE, uint8Data, isLittleEndian),
    patientWeight: getNumberValue(elements, TAG_PATIENT_WEIGHT, uint8Data, isLittleEndian),

    studyInstanceUID: getStringValue(elements, TAG_STUDY_INSTANCE_UID, uint8Data),
    studyDate: getStringValue(elements, TAG_STUDY_DATE, uint8Data),
    studyTime: getStringValue(elements, TAG_STUDY_TIME, uint8Data),
    studyID: getStringValue(elements, TAG_STUDY_ID, uint8Data),
    studyDescription: getStringValue(elements, TAG_STUDY_DESCRIPTION, uint8Data),
    referringPhysicianName: getStringValue(elements, TAG_REFERRING_PHYSICIAN_NAME, uint8Data),
    accessionNumber: getStringValue(elements, TAG_ACCESSION_NUMBER, uint8Data),

    seriesInstanceUID: getStringValue(elements, TAG_SERIES_INSTANCE_UID, uint8Data),
    seriesDate: getStringValue(elements, TAG_SERIES_DATE, uint8Data),
    seriesTime: getStringValue(elements, TAG_SERIES_TIME, uint8Data),
    seriesDescription: getStringValue(elements, TAG_SERIES_DESCRIPTION, uint8Data),
    seriesNumber: getStringValue(elements, TAG_SERIES_NUMBER, uint8Data),
    modality: getStringValue(elements, TAG_MODALITY, uint8Data),
    institutionName: getStringValue(elements, TAG_INSTITUTION_NAME, uint8Data),
    institutionalDepartmentName: getStringValue(elements, TAG_INSTITUTIONAL_DEPARTMENT_NAME, uint8Data),
    stationName: getStringValue(elements, TAG_STATION_NAME, uint8Data),
    performingPhysicianName: getStringValue(elements, TAG_PERFORMING_PHYSICIAN_NAME, uint8Data),
    protocolName: getStringValue(elements, TAG_PROTOCOL_NAME, uint8Data),

    manufacturer: getStringValue(elements, TAG_MANUFACTURER, uint8Data),
    manufacturerModelName: getStringValue(elements, TAG_MANUFACTURER_MODEL_NAME, uint8Data),
    deviceSerialNumber: getStringValue(elements, TAG_DEVICE_SERIAL_NUMBER, uint8Data),
    softwareVersions: softwareVersions.length > 0 ? softwareVersions : undefined,
    operatorName: getStringValue(elements, TAG_OPERATOR_NAME, uint8Data),

    imageType: imageType.length > 0 ? imageType : undefined,
    acquisitionDate: getStringValue(elements, TAG_ACQUISITION_DATE, uint8Data),
    acquisitionTime: getStringValue(elements, TAG_ACQUISITION_TIME, uint8Data),
    contentDate: getStringValue(elements, TAG_CONTENT_DATE, uint8Data),
    contentTime: getStringValue(elements, TAG_CONTENT_TIME, uint8Data),
    acquisitionNumber: getStringValue(elements, TAG_INSTANCE_NUMBER, uint8Data),
    imageComments: getStringValue(elements, TAG_IMAGE_COMMENTS, uint8Data),
    imageOrientationPatient: imageOrientationPatient.length > 0 ? imageOrientationPatient : undefined,
    imagePositionPatient: imagePositionPatient.length > 0 ? imagePositionPatient : undefined,
    pixelSpacing: pixelSpacing.length > 0 ? pixelSpacing : undefined,
    frameOfReferenceUID: getStringValue(elements, TAG_FRAME_OF_REFERENCE_UID, uint8Data),
    positionReferenceIndicator: getStringValue(elements, TAG_POSITION_REFERENCE_INDICATOR, uint8Data),
    sliceLocation: getStringValue(elements, TAG_SLICE_LOCATION, uint8Data),

    samplesPerPixel,
    photometricInterpretation,
    rows,
    columns,
    bitsAllocated,
    bitsStored,
    highBit,
    pixelRepresentation,
    windowCenter: windowCenters.length > 0 ? windowCenters : [windowCenter],
    windowWidth: windowWidths.length > 0 ? windowWidths : [windowWidth],
    windowCenters: windowCenters.length > 0 ? windowCenters : undefined,
    windowWidths: windowWidths.length > 0 ? windowWidths : undefined,
    rescaleIntercept,
    rescaleSlope,
    rescaleType: getStringValue(elements, TAG_RESCALE_TYPE, uint8Data),
    presentationLUTShape: getStringValue(elements, TAG_PRESENTATION_LUT_SHAPE, uint8Data),

    lossyImageCompression: getStringValue(elements, TAG_LOSSY_IMAGE_COMPRESSION, uint8Data),
    lossyImageCompressionRatio: lossyImageCompressionRatio.length > 0 ? lossyImageCompressionRatio : undefined,
    lossyImageCompressionMethod: lossyImageCompressionMethod.length > 0 ? lossyImageCompressionMethod : undefined,

    numberOfFrames: isMultiFrame ? numberOfFrames : undefined,
    frameIncrementPointer: frameIncrementPointer.length > 0 ? frameIncrementPointer : undefined,
    frameTime: frameTime > 0 ? frameTime : undefined,
    frameTimeVector: frameTimeVector.length > 0 ? frameTimeVector : undefined,
    cineRate: cineRate > 0 ? cineRate : undefined,
    recommendedDisplayFrameRate: recommendedDisplayFrameRate > 0 ? recommendedDisplayFrameRate : undefined,

    bodyPartExamined: getStringValue(elements, TAG_BODY_PART_EXAMINED, uint8Data),
    patientPosition: getStringValue(elements, TAG_PATIENT_POSITION, uint8Data),
    viewPosition: getStringValue(elements, TAG_VIEW_POSITION, uint8Data),
    laterality: getStringValue(elements, TAG_LATERALITY, uint8Data),

    kiloVoltagePeak: getNumberValue(elements, TAG_KILOVOLTAGE_PEAK, uint8Data, isLittleEndian),
    tableHeight: getNumberValue(elements, TAG_TABLE_HEIGHT, uint8Data, isLittleEndian),
    rotationDirection: getStringValue(elements, TAG_ROTATION_DIRECTION, uint8Data),
    exposureTime: getStringValue(elements, TAG_EXPOSURE_TIME, uint8Data),
    xRayTubeCurrent: getNumberValue(elements, TAG_XRAY_TUBE_CURRENT, uint8Data, isLittleEndian),
    exposure: getNumberValue(elements, TAG_EXPOSURE, uint8Data, isLittleEndian),
    exposureInMas: getNumberValue(elements, TAG_EXPOSURE_IN_MAS, uint8Data, isLittleEndian),
    filterType: getStringValue(elements, TAG_FILTER_TYPE, uint8Data),
    generatorPower: getNumberValue(elements, TAG_GENERATOR_POWER, uint8Data, isLittleEndian),
    focalSpots: focalSpots.length > 0 ? focalSpots : undefined,
    convolutionKernel: getStringValue(elements, TAG_CONVOLUTION_KERNEL, uint8Data),
    scanType: getStringValue(elements, TAG_SCAN_TYPE, uint8Data),
    scanOptions: scanOptions.length > 0 ? scanOptions : undefined,
    singleCollimationWidth: getNumberValue(elements, TAG_SINGLE_COLLIMATION_WIDTH, uint8Data, isLittleEndian),
    totalCollimationWidth: getNumberValue(elements, TAG_TOTAL_COLLIMATION_WIDTH, uint8Data, isLittleEndian),
    sliceThickness: getStringValue(elements, TAG_SLICE_THICKNESS, uint8Data),
    nominalSliceThickness: getNumberValue(elements, TAG_NOMINAL_SLICE_THICKNESS, uint8Data, isLittleEndian),
    tableSpeed: getNumberValue(elements, TAG_TABLE_SPEED, uint8Data, isLittleEndian),
    tableFeedPerRotation: getNumberValue(elements, TAG_TABLE_FEED_PER_ROTATION, uint8Data, isLittleEndian),
    spiralPitchFactor: getNumberValue(elements, TAG_SPIRAL_PITCH_FACTOR, uint8Data, isLittleEndian),
    dataCollectionDiameter: getNumberValue(elements, TAG_DATA_COLLECTION_DIAMETER, uint8Data, isLittleEndian),
    reconstructionDiameter: getNumberValue(elements, TAG_RECONSTRUCTION_DIAMETER, uint8Data, isLittleEndian),
    distanceSourceToDetector: getNumberValue(elements, TAG_DISTANCE_SOURCE_TO_DETECTOR, uint8Data, isLittleEndian),
    distanceSourceToIsocenter: getNumberValue(elements, TAG_DISTANCE_SOURCE_TO_ISOCENTER, uint8Data, isLittleEndian),
    gantryDetectorTilt: getNumberValue(elements, TAG_GANTRY_DETECTOR_TILT, uint8Data, isLittleEndian),
    spacingBetweenSlices: getStringValue(elements, TAG_SPACING_BETWEEN_SLICES, uint8Data),

    sopInstanceUID: getStringValue(elements, TAG_SOP_INSTANCE_UID, uint8Data),
    sopClassUID: getStringValue(elements, TAG_SOP_CLASS_UID, uint8Data),
    specificCharacterSet: specificCharacterSet.length > 0 ? specificCharacterSet : undefined,
    instanceNumber: getStringValue(elements, TAG_INSTANCE_NUMBER, uint8Data)
  };

  const imageInfo: DicomImageInfo = {
    rows,
    columns,
    bitsAllocated,
    bitsStored,
    highBit,
    samplesPerPixel,
    photometricInterpretation,
    windowCenter,
    windowWidth,
    rescaleIntercept,
    rescaleSlope,
    pixelRepresentation,
    windowCenters: windowCenters.length > 0 ? windowCenters : undefined,
    windowWidths: windowWidths.length > 0 ? windowWidths : undefined
  };

  return {
    metadata,
    imageInfo,
    pixelData: typedPixelData,
    rawPixelData: pixelData,
    isMultiFrame,
    frames,
    numberOfFrames: isMultiFrame ? numberOfFrames : undefined,
    currentFrame: 0
  };
}

export {
  DicomValue,
  DicomTag,
  DicomVR,
  DicomMetadata,
  DicomImageInfo,
  ParsedDicom,
  WindowLevelParams,
  PixelValueRange
} from '@/types/dicom';

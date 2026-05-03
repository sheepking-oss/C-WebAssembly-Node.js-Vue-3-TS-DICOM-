export type DicomValue = string | string[] | number | number[];

export interface DicomTag {
  group: number;
  element: number;
}

export enum DicomVR {
  AE = 'AE',
  AS = 'AS',
  AT = 'AT',
  CS = 'CS',
  DA = 'DA',
  DS = 'DS',
  DT = 'DT',
  FL = 'FL',
  FD = 'FD',
  IS = 'IS',
  LO = 'LO',
  LT = 'LT',
  OB = 'OB',
  OD = 'OD',
  OF = 'OF',
  OL = 'OL',
  OV = 'OV',
  OW = 'OW',
  PN = 'PN',
  PO = 'PO',
  PS = 'PS',
  QC = 'QC',
  QS = 'QS',
  QU = 'QU',
  QV = 'QV',
  QW = 'QW',
  SH = 'SH',
  SL = 'SL',
  SQ = 'SQ',
  SS = 'SS',
  ST = 'ST',
  SV = 'SV',
  SW = 'SW',
  TM = 'TM',
  UC = 'UC',
  UI = 'UI',
  UL = 'UL',
  UN = 'UN',
  UR = 'UR',
  US = 'US',
  UT = 'UT',
  UV = 'UV',
  UW = 'UW',
  Unknown = 'Unknown'
}

export interface DicomDataElement {
  tag: DicomTag;
  vr: DicomVR;
  value: DicomValue;
  rawValue?: Uint8Array;
}

export interface DicomSequenceItem {
  elements: Map<string, DicomDataElement>;
}

export interface DicomPersonName {
  familyName?: string;
  givenName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
}

export interface DicomDate {
  year?: number;
  month?: number;
  day?: number;
}

export interface DicomTime {
  hours?: number;
  minutes?: number;
  seconds?: number;
  fractionalSeconds?: number;
}

export interface DicomDateTime {
  date?: DicomDate;
  time?: DicomTime;
}

export interface DicomCodeSequenceItem {
  codeValue?: string;
  codingSchemeDesignator?: string;
  codeMeaning?: string;
  codingSchemeVersion?: string;
  contextIdentifier?: string;
  mappingResource?: string;
  mappingResourceUID?: string;
  longCodeValue?: string;
  contextUID?: string;
}

export interface DicomPatientModule {
  patientName?: DicomPersonName | string;
  patientID?: string;
  patientBirthDate?: DicomDate | string;
  patientBirthTime?: DicomTime | string;
  patientSex?: string;
  patientAge?: string;
  patientSize?: number;
  patientWeight?: number;
  patientAddress?: string;
  patientMotherBirthName?: DicomPersonName | string;
  medicalRecordLocator?: string;
  ethnicGroup?: string;
  patientComments?: string;
  patientIdentityRemoved?: string;
  patientTelephoneNumbers?: string[];
  patientReligiousPreference?: string;
  patientSpeciesDescription?: string;
  patientSpeciesCodeSequence?: DicomCodeSequenceItem[];
  patientBreedDescription?: string;
  patientBreedCodeSequence?: DicomCodeSequenceItem[];
  responsiblePerson?: string;
  responsibleOrganization?: string;
  responsiblePersonRole?: string;
  responsiblePersonRoleCodeSequence?: DicomCodeSequenceItem[];
  responsibleOrganizationRole?: string;
  responsibleOrganizationRoleCodeSequence?: DicomCodeSequenceItem[];
}

export interface DicomGeneralStudyModule {
  studyInstanceUID?: string;
  studyDate?: DicomDate | string;
  studyTime?: DicomTime | string;
  studyID?: string;
  studyDescription?: string;
  referringPhysicianName?: DicomPersonName | string;
  referringPhysicianAddress?: string;
  referringPhysicianTelephoneNumbers?: string[];
  accessionNumber?: string;
  institutionalDepartmentName?: string;
  studyComments?: string;
  procedureCodeSequence?: DicomCodeSequenceItem[];
  reasonForStudy?: string;
  reasonForStudyCodeSequence?: DicomCodeSequenceItem[];
  referringPhysicianIdentificationSequence?: DicomCodeSequenceItem[];
  consultationDiagnosisCodeSequence?: DicomCodeSequenceItem[];
  requestedProcedureCodeSequence?: DicomCodeSequenceItem[];
  requestedContrastAgent?: string;
  admissionID?: string;
  issuingAuthorityOfPatientID?: string;
  typeOfPatientID?: string;
  studyPriorityID?: string;
  requestedProcedureDescription?: string;
  scheduledStepSequence?: DicomSequenceItem[];
  physicianOfRecord?: DicomPersonName | string;
  physicianOfRecordIdentificationSequence?: DicomCodeSequenceItem[];
  performingPhysicianName?: DicomPersonName | string;
  performingPhysicianIdentificationSequence?: DicomCodeSequenceItem[];
  nameOfPhysiciansReadingStudy?: DicomPersonName | string;
  physiciansReadingStudyIdentificationSequence?: DicomCodeSequenceItem[];
  studyInstanceUIDIssuer?: string;
  otherStudyNumbers?: string[];
  otherStudyIDs?: string[];
}

export interface DicomGeneralSeriesModule {
  seriesInstanceUID?: string;
  seriesDate?: DicomDate | string;
  seriesTime?: DicomTime | string;
  seriesDescription?: string;
  seriesDescriptionCodeSequence?: DicomCodeSequenceItem[];
  modality?: string;
  institutionName?: string;
  institutionAddress?: string;
  stationName?: string;
  institutionalDepartmentName?: string;
  performingPhysicianName?: DicomPersonName | string;
  performingPhysicianIdentificationSequence?: DicomCodeSequenceItem[];
  protocolName?: string;
  seriesNumber?: number | string;
  laterality?: string;
  bodyPartExamined?: string;
  bodyPartExaminedCodeSequence?: DicomCodeSequenceItem[];
  patientPosition?: string;
  viewPosition?: string;
  procedureCodeSequence?: DicomCodeSequenceItem[];
  seriesInstanceUIDIssuer?: string;
  operatorName?: DicomPersonName | string;
  operatorIdentificationSequence?: DicomCodeSequenceItem[];
  clinicalTrialSubjectID?: string;
  clinicalTrialSubjectReadingID?: string;
  clinicalTrialCoordinatingCenterName?: string;
  clinicalTrialTimePointID?: string;
  clinicalTrialTimePointDescription?: string;
}

export interface DicomGeneralEquipmentModule {
  manufacturer?: string;
  manufacturerModelName?: string;
  deviceSerialNumber?: string;
  softwareVersions?: string[];
  institutionName?: string;
  institutionAddress?: string;
  institutionalDepartmentName?: string;
  stationName?: string;
}

export interface DicomImageModule {
  imageType?: string[];
  acquisitionDate?: DicomDate | string;
  acquisitionTime?: DicomTime | string;
  acquisitionDateTime?: DicomDateTime | string;
  contentDate?: DicomDate | string;
  contentTime?: DicomTime | string;
  acquisitionNumber?: number | string;
  imageComments?: string;
  imageOrientationPatient?: number[] | string;
  imagePositionPatient?: number[] | string;
  referenceImageSequence?: DicomSequenceItem[];
  derivationDescription?: string;
  derivationCodeSequence?: DicomCodeSequenceItem[];
  pixelSpacing?: number[] | string;
  imageLaterality?: string;
  frameOfReferenceUID?: string;
  positionReferenceIndicator?: string;
  sliceLocation?: number | string;
  frameComments?: string[];
  frameLabel?: string[];
  frameDateTime?: DicomDateTime[] | string[];
  frameAcquisitionDateTime?: DicomDateTime[] | string[];
  frameReferenceDateTime?: DicomDateTime[] | string[];
  frameDerivationDescription?: string[];
  frameDerivationCodeSequence?: DicomSequenceItem[];
  frameContentDescription?: string[];
  frameContentCodeSequence?: DicomSequenceItem[];
  frameComments?: string[];
}

export interface DicomImagePixelModule {
  samplesPerPixel?: number;
  photometricInterpretation?: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  bitsStored?: number;
  highBit?: number;
  pixelRepresentation?: number;
  smallestImagePixelValue?: number;
  largestImagePixelValue?: number;
  windowCenter?: number[];
  windowWidth?: number[];
  windowCenterWidthExplanation?: string[];
  rescaleIntercept?: number;
  rescaleSlope?: number;
  rescaleType?: string;
  lossyImageCompression?: string;
  lossyImageCompressionRatio?: number[];
  lossyImageCompressionMethod?: string[];
  iconImageSequence?: DicomSequenceItem[];
  presentationLUTShape?: string;
}

export interface DicomMultiFrameModule {
  numberOfFrames?: number;
  frameIncrementPointer?: number[];
  frameTime?: number;
  frameTimeVector?: number[];
  frameOffsetVector?: number[];
  frameStartOffsetVector?: number[];
  frameDelayVector?: number[];
  frameDelayVectorUnit?: string;
  cineRate?: number;
  recommendedDisplayFrameRate?: number;
  frameCount?: number;
  itemDelimiterBeforeItemLength?: string;
  itemLength?: number;
  frameExtractionSequence?: DicomSequenceItem[];
  concatenationUID?: string;
  inConcatenationNumber?: number;
  inConcatenationTotalNumber?: number;
  specificCharacterSet?: string[];
  sourceImageSequence?: DicomSequenceItem[];
  spatialRegistrationSequence?: DicomSequenceItem[];
  realWorldValueMappingSequence?: DicomSequenceItem[];
  pixelValueTransformationSequence?: DicomSequenceItem[];
  modalityLUTSequence?: DicomSequenceItem[];
  voiLUTSequence?: DicomSequenceItem[];
}

export interface DicomCtImageModule {
  kiloVoltagePeak?: number;
  tableHeight?: number;
  rotationDirection?: string;
  exposureTime?: number;
  xRayTubeCurrent?: number;
  exposure?: number;
  exposureInMas?: number;
  filterType?: string;
  generatorPower?: number;
  focalSpots?: number[];
  convolutionKernel?: string;
  dateOfLastDetectorCalibration?: DicomDate | string;
  timeOfLastDetectorCalibration?: DicomTime | string;
  exposureModulationType?: string;
  radiationMode?: string;
  acquisitionFieldOfViewDimensions?: number[];
  acquisitionFieldOfViewLabel?: string;
  collimatorType?: string;
  collimatorShape?: string;
  collimatorGridX?: number;
  collimatorGridY?: number;
  collimatorRotation?: number;
  collimatorCenterX?: number;
  collimatorCenterY?: number;
  bodyPartThickness?: number;
  compensatoryFilterMaterial?: string;
  compensatoryFilterType?: string;
  tableMotion?: string;
  tableSpeed?: number;
  tableFeedPerRotation?: number;
  spiralPitchFactor?: number;
  dataCollectionDiameter?: number;
  reconstructionDiameter?: number;
  reconstructedFieldOfView?: number;
  reconstructionDiameter?: number;
  distanceSourceToDetector?: number;
  distanceSourceToIsocenter?: number;
  gantryDetectorTilt?: number;
  gantryDetectorSlew?: number;
  gantryDetectorsPerRow?: number[];
  gantryNumberOfDetectorRows?: number;
  gantryNumberOfActiveDetectorRows?: number;
  gantryDetectorSpacingX?: number;
  gantryDetectorSpacingY?: number;
  gantryDetectorActiveRowSpacing?: number;
  gantryDetectorSensitivity?: number;
  gantryDetectorIntegrationTime?: number;
  gantryType?: string;
  gantryMovementSequence?: DicomSequenceItem[];
  tableType?: string;
  tableGantryTilt?: number;
  tableTopMovementSequence?: DicomSequenceItem[];
  tableTopRoll?: number;
  tableTopPitch?: number;
  tableTopYaw?: number;
  tableTopLateralPosition?: number;
  tableTopVerticalPosition?: number;
  tableTopLongitudinalPosition?: number;
  scanArc?: number;
  scanType?: string;
  scanOptions?: string[];
  singleCollimationWidth?: number;
  totalCollimationWidth?: number;
  sliceThickness?: number;
  nominalSliceThickness?: number;
  doseReferenceSequence?: DicomSequenceItem[];
  ctdiVolume?: number;
  ctdiW?: number;
  ctdiType?: string;
  ctdiPhantomType?: string;
  averageAcquisitionTime?: number;
  exposureControlMode?: string;
  positionerType?: string;
  positionerPrimaryAngle?: number;
  positionerSecondaryAngle?: number;
  contrastBolusSequence?: DicomSequenceItem[];
  contrastFlowRate?: number;
  contrastFlowDuration?: number;
  contrastTotalVolume?: number;
  contrastBolusAgent?: string;
  contrastBolusRoute?: string;
  contrastBolusTime?: DicomDateTime | string;
}

export interface DicomMetadata extends 
  DicomPatientModule,
  DicomGeneralStudyModule,
  DicomGeneralSeriesModule,
  DicomGeneralEquipmentModule,
  DicomImageModule,
  DicomImagePixelModule,
  DicomMultiFrameModule,
  DicomCtImageModule
{
  sopInstanceUID?: string;
  sopClassUID?: string;
  specificCharacterSet?: string[];
  instanceNumber?: number | string;
  contentCreatorName?: DicomPersonName | string;
  contentCreatorIdentificationCodeSequence?: DicomCodeSequenceItem[];
  [key: string]: DicomValue | undefined;
}

export interface DicomImageInfo {
  rows: number;
  columns: number;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  samplesPerPixel: number;
  photometricInterpretation: string;
  windowCenter: number;
  windowWidth: number;
  rescaleIntercept: number;
  rescaleSlope: number;
  pixelRepresentation: number;
  windowCenters?: number[];
  windowWidths?: number[];
}

export interface MultiFrameImageInfo extends DicomImageInfo {
  numberOfFrames: number;
  currentFrame: number;
  frameTime?: number;
  frameIncrementPointer?: number[];
}

export interface ParsedDicom {
  metadata: DicomMetadata;
  imageInfo: DicomImageInfo;
  pixelData: Uint8Array | Int16Array | Uint16Array;
  rawPixelData: Uint8Array;
  isMultiFrame?: boolean;
  frames?: Array<Uint8Array | Int16Array | Uint16Array>;
  numberOfFrames?: number;
  currentFrame?: number;
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

export interface RenderState {
  windowLevel: WindowLevelParams;
  scale: number;
  offsetX: number;
  offsetY: number;
  needsRender: boolean;
}

export interface MousePosition {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  deltaX: number;
  deltaY: number;
  accumulatedX: number;
  accumulatedY: number;
}

export interface PixelValueInfo {
  value: number | null;
  x: number;
  y: number;
  imageX: number;
  imageY: number;
}

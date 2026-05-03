#include "dicom_parser.h"
#include <cstring>
#include <sstream>
#include <iomanip>
#include <algorithm>

namespace dicom {

DicomParser::DicomParser()
    : isExplicitVR_(true), isLittleEndian_(true), parsed_(false) {}

uint16_t DicomParser::readUint16(const uint8_t* data, size_t& offset, bool littleEndian) {
    uint16_t value;
    if (littleEndian) {
        value = static_cast<uint16_t>(data[offset]) |
                (static_cast<uint16_t>(data[offset + 1]) << 8);
    } else {
        value = (static_cast<uint16_t>(data[offset]) << 8) |
                static_cast<uint16_t>(data[offset + 1]);
    }
    offset += 2;
    return value;
}

uint32_t DicomParser::readUint32(const uint8_t* data, size_t& offset, bool littleEndian) {
    uint32_t value;
    if (littleEndian) {
        value = static_cast<uint32_t>(data[offset]) |
                (static_cast<uint32_t>(data[offset + 1]) << 8) |
                (static_cast<uint32_t>(data[offset + 2]) << 16) |
                (static_cast<uint32_t>(data[offset + 3]) << 24);
    } else {
        value = (static_cast<uint32_t>(data[offset]) << 24) |
                (static_cast<uint32_t>(data[offset + 1]) << 16) |
                (static_cast<uint32_t>(data[offset + 2]) << 8) |
                static_cast<uint32_t>(data[offset + 3]);
    }
    offset += 4;
    return value;
}

uint16_t DicomParser::readVR(const uint8_t* data, size_t& offset) {
    uint16_t vr = static_cast<uint16_t>(data[offset]) |
                  (static_cast<uint16_t>(data[offset + 1]) << 8);
    offset += 2;
    return vr;
}

uint32_t DicomParser::readLength(const uint8_t* data, size_t& offset, bool isExplicitVR, VR vr) {
    if (isExplicitVR) {
        if (vr == VR::OB || vr == VR::OW || vr == VR::OF ||
            vr == VR::SQ || vr == VR::UN || vr == VR::UC ||
            vr == VR::UR || vr == VR::UT || vr == VR::OD ||
            vr == VR::OL || vr == VR::OV || vr == VR::SL ||
            vr == VR::SV || vr == VR::UL || vr == VR::UV) {
            offset += 2;
            return readUint32(data, offset, isLittleEndian_);
        } else {
            return static_cast<uint32_t>(readUint16(data, offset, isLittleEndian_));
        }
    } else {
        return readUint32(data, offset, isLittleEndian_);
    }
}

bool DicomParser::parsePreamble(const uint8_t* data, size_t& offset, size_t totalSize) {
    if (totalSize < 132) {
        if (totalSize >= 8) {
            uint16_t group = readUint16(data, offset, isLittleEndian_);
            uint16_t element = readUint16(data, offset, isLittleEndian_);
            if (group == 0x0008 && element == 0x0005) {
                offset = 0;
                return true;
            }
        }
        offset = 0;
        return true;
    }

    offset += 128;

    const char* prefix = reinterpret_cast<const char*>(data + offset);
    if (std::strncmp(prefix, "DICM", 4) != 0) {
        offset = 0;
        return true;
    }
    offset += 4;

    return true;
}

bool DicomParser::parseDataElement(const uint8_t* data, size_t& offset, size_t totalSize) {
    if (offset + 8 > totalSize) {
        return false;
    }

    Tag tag;
    tag.group = readUint16(data, offset, isLittleEndian_);
    tag.element = readUint16(data, offset, isLittleEndian_);

    if (tag.group == 0xFFFE) {
        uint32_t length = readUint32(data, offset, isLittleEndian_);
        if (length == 0xFFFFFFFF) {
            uint32_t itemLength = readUint32(data, offset, isLittleEndian_);
            offset += itemLength;
        } else {
            offset += length;
        }
        return true;
    }

    VR vr = VR::UNKNOWN;
    uint32_t length = 0;

    if (isExplicitVR_) {
        if (offset + 2 > totalSize) {
            return false;
        }
        uint16_t vrValue = readVR(data, offset);
        vr = static_cast<VR>(vrValue);
        length = readLength(data, offset, isExplicitVR_, vr);
    } else {
        length = readUint32(data, offset, isLittleEndian_);
        vr = VR::UNKNOWN;
    }

    if (length == 0xFFFFFFFF) {
        size_t startOffset = offset;
        while (offset < totalSize) {
            size_t savedOffset = offset;
            uint16_t testGroup = readUint16(data, offset, isLittleEndian_);
            uint16_t testElement = readUint16(data, offset, isLittleEndian_);
            offset = savedOffset;

            if (testGroup == 0xFFFE && (testElement == 0xE00D || testElement == 0xE0DD)) {
                break;
            }

            if (!parseDataElement(data, offset, totalSize)) {
                break;
            }
        }
        return true;
    }

    if (offset + length > totalSize || length > 1000000000) {
        return false;
    }

    std::vector<uint8_t> value;
    if (length > 0) {
        value.resize(length);
        std::memcpy(value.data(), data + offset, length);
        offset += length;
    }

    DataElement element(tag, vr, length, value);
    elements_[tag] = element;

    if (tag.group == 0x0002) {
        if (tag.element == 0x0010) {
            std::string tsUID(value.begin(), value.end());
            if (tsUID.find('\\') != std::string::npos) {
                tsUID = tsUID.substr(0, tsUID.find('\\'));
            }
            if (tsUID == "1.2.840.10008.1.2") {
                isExplicitVR_ = false;
                isLittleEndian_ = true;
            } else if (tsUID == "1.2.840.10008.1.2.1") {
                isExplicitVR_ = true;
                isLittleEndian_ = true;
            } else if (tsUID == "1.2.840.10008.1.2.2") {
                isExplicitVR_ = true;
                isLittleEndian_ = false;
            } else if (tsUID == "1.2.840.10008.1.2.99") {
                isExplicitVR_ = false;
                isLittleEndian_ = false;
            }
        }
    }

    return true;
}

bool DicomParser::parseDataSet(const uint8_t* data, size_t& offset, size_t totalSize) {
    while (offset < totalSize) {
        if (!parseDataElement(data, offset, totalSize)) {
            break;
        }
    }
    return true;
}

bool DicomParser::parse(const uint8_t* data, size_t size) {
    elements_.clear();
    pixelData_.clear();
    parsed_ = false;
    isExplicitVR_ = true;
    isLittleEndian_ = true;

    size_t offset = 0;

    if (!parsePreamble(data, offset, size)) {
        return false;
    }

    if (!parseDataSet(data, offset, size)) {
        return false;
    }

    extractPixelData();
    parsed_ = true;

    return true;
}

bool DicomParser::parse(const std::vector<uint8_t>& data) {
    return parse(data.data(), data.size());
}

void DicomParser::extractPixelData() {
    Tag pixelDataTag(0x7FE0, 0x0010);
    auto it = elements_.find(pixelDataTag);
    if (it != elements_.end()) {
        pixelData_ = it->second.value;
    }
}

bool DicomParser::hasElement(const Tag& tag) const {
    return elements_.find(tag) != elements_.end();
}

bool DicomParser::hasElement(uint16_t group, uint16_t element) const {
    return hasElement(Tag(group, element));
}

std::string DicomParser::convertValueToString(const DataElement& element) {
    if (element.value.empty()) {
        return "";
    }

    switch (element.vr) {
        case VR::CS:
        case VR::LO:
        case VR::PN:
        case VR::SH:
        case VR::ST:
        case VR::UT:
        case VR::AS:
        case VR::DA:
        case VR::DT:
        case VR::TM:
        case VR::UI:
            return std::string(element.value.begin(), element.value.end());
        case VR::DS:
        case VR::IS: {
            std::string str(element.value.begin(), element.value.end());
            str.erase(str.find_last_not_of(" \0") + 1);
            return str;
        }
        default: {
            std::ostringstream oss;
            for (size_t i = 0; i < element.value.size(); ++i) {
                if (i > 0) {
                    oss << " ";
                }
                oss << std::hex << std::setfill('0') << std::setw(2)
                    << static_cast<int>(element.value[i]);
            }
            return oss.str();
        }
    }
}

std::string DicomParser::getStringValue(const Tag& tag) const {
    auto it = elements_.find(tag);
    if (it == elements_.end()) {
        return "";
    }
    return convertValueToString(it->second);
}

std::string DicomParser::getStringValue(uint16_t group, uint16_t element) const {
    return getStringValue(Tag(group, element));
}

int16_t DicomParser::getInt16Value(const Tag& tag) const {
    auto it = elements_.find(tag);
    if (it == elements_.end() || it->second.value.size() < 2) {
        return 0;
    }

    int16_t value;
    if (isLittleEndian_) {
        value = static_cast<int16_t>(
            static_cast<uint16_t>(it->second.value[0]) |
            (static_cast<uint16_t>(it->second.value[1]) << 8)
        );
    } else {
        value = static_cast<int16_t>(
            (static_cast<uint16_t>(it->second.value[0]) << 8) |
            static_cast<uint16_t>(it->second.value[1])
        );
    }
    return value;
}

int16_t DicomParser::getInt16Value(uint16_t group, uint16_t element) const {
    return getInt16Value(Tag(group, element));
}

uint16_t DicomParser::getUint16Value(const Tag& tag) const {
    return static_cast<uint16_t>(getInt16Value(tag));
}

uint16_t DicomParser::getUint16Value(uint16_t group, uint16_t element) const {
    return getUint16Value(Tag(group, element));
}

int32_t DicomParser::getInt32Value(const Tag& tag) const {
    auto it = elements_.find(tag);
    if (it == elements_.end() || it->second.value.size() < 4) {
        return 0;
    }

    int32_t value;
    if (isLittleEndian_) {
        value = static_cast<int32_t>(
            static_cast<uint32_t>(it->second.value[0]) |
            (static_cast<uint32_t>(it->second.value[1]) << 8) |
            (static_cast<uint32_t>(it->second.value[2]) << 16) |
            (static_cast<uint32_t>(it->second.value[3]) << 24)
        );
    } else {
        value = static_cast<int32_t>(
            (static_cast<uint32_t>(it->second.value[0]) << 24) |
            (static_cast<uint32_t>(it->second.value[1]) << 16) |
            (static_cast<uint32_t>(it->second.value[2]) << 8) |
            static_cast<uint32_t>(it->second.value[3])
        );
    }
    return value;
}

int32_t DicomParser::getInt32Value(uint16_t group, uint16_t element) const {
    return getInt32Value(Tag(group, element));
}

uint32_t DicomParser::getUint32Value(const Tag& tag) const {
    return static_cast<uint32_t>(getInt32Value(tag));
}

uint32_t DicomParser::getUint32Value(uint16_t group, uint16_t element) const {
    return getUint32Value(Tag(group, element));
}

double DicomParser::getDoubleValue(const Tag& tag) const {
    auto it = elements_.find(tag);
    if (it == elements_.end() || it->second.value.size() < 8) {
        return 0.0;
    }

    std::string str = convertValueToString(it->second);
    try {
        return std::stod(str);
    } catch (...) {
        return 0.0;
    }
}

double DicomParser::getDoubleValue(uint16_t group, uint16_t element) const {
    return getDoubleValue(Tag(group, element));
}

const std::vector<uint8_t>& DicomParser::getPixelData() const {
    return pixelData_;
}

uint16_t DicomParser::getRows() const {
    return getUint16Value(0x0028, 0x0010);
}

uint16_t DicomParser::getColumns() const {
    return getUint16Value(0x0028, 0x0011);
}

uint16_t DicomParser::getBitsAllocated() const {
    return getUint16Value(0x0028, 0x0100);
}

uint16_t DicomParser::getBitsStored() const {
    return getUint16Value(0x0028, 0x0101);
}

uint16_t DicomParser::getHighBit() const {
    return getUint16Value(0x0028, 0x0102);
}

uint16_t DicomParser::getSamplesPerPixel() const {
    return getUint16Value(0x0028, 0x0002);
}

int32_t DicomParser::getWindowCenter() const {
    auto it = elements_.find(Tag(0x0028, 0x1050));
    if (it == elements_.end()) {
        return 0;
    }

    std::string str = convertValueToString(it->second);
    size_t pos = str.find('\\');
    if (pos != std::string::npos) {
        str = str.substr(0, pos);
    }

    try {
        return static_cast<int32_t>(std::stod(str));
    } catch (...) {
        return 0;
    }
}

int32_t DicomParser::getWindowWidth() const {
    auto it = elements_.find(Tag(0x0028, 0x1051));
    if (it == elements_.end()) {
        return 255;
    }

    std::string str = convertValueToString(it->second);
    size_t pos = str.find('\\');
    if (pos != std::string::npos) {
        str = str.substr(0, pos);
    }

    try {
        int32_t width = static_cast<int32_t>(std::stod(str));
        return width > 0 ? width : 255;
    } catch (...) {
        return 255;
    }
}

int32_t DicomParser::getRescaleIntercept() const {
    auto it = elements_.find(Tag(0x0028, 0x1052));
    if (it == elements_.end()) {
        return 0;
    }

    std::string str = convertValueToString(it->second);
    try {
        return static_cast<int32_t>(std::stod(str));
    } catch (...) {
        return 0;
    }
}

int32_t DicomParser::getRescaleSlope() const {
    auto it = elements_.find(Tag(0x0028, 0x1053));
    if (it == elements_.end()) {
        return 1;
    }

    std::string str = convertValueToString(it->second);
    try {
        int32_t slope = static_cast<int32_t>(std::stod(str));
        return slope > 0 ? slope : 1;
    } catch (...) {
        return 1;
    }
}

std::string DicomParser::getPhotometricInterpretation() const {
    return getStringValue(0x0028, 0x0004);
}

std::map<std::string, std::string> DicomParser::getMetadata() const {
    std::map<std::string, std::string> metadata;

    metadata["patientName"] = getStringValue(0x0010, 0x0010);
    metadata["patientID"] = getStringValue(0x0010, 0x0020);
    metadata["patientBirthDate"] = getStringValue(0x0010, 0x0030);
    metadata["patientSex"] = getStringValue(0x0010, 0x0040);
    metadata["patientAge"] = getStringValue(0x0010, 0x1010);

    metadata["studyDate"] = getStringValue(0x0008, 0x0020);
    metadata["studyTime"] = getStringValue(0x0008, 0x0030);
    metadata["studyDescription"] = getStringValue(0x0008, 0x1030);
    metadata["studyID"] = getStringValue(0x0020, 0x0010);
    metadata["studyInstanceUID"] = getStringValue(0x0020, 0x000D);

    metadata["seriesDate"] = getStringValue(0x0008, 0x0021);
    metadata["seriesTime"] = getStringValue(0x0008, 0x0031);
    metadata["seriesDescription"] = getStringValue(0x0008, 0x103E);
    metadata["seriesNumber"] = getStringValue(0x0020, 0x0011);
    metadata["seriesInstanceUID"] = getStringValue(0x0020, 0x000E);

    metadata["modality"] = getStringValue(0x0008, 0x0060);
    metadata["manufacturer"] = getStringValue(0x0008, 0x0070);
    metadata["institutionName"] = getStringValue(0x0008, 0x0080);
    metadata["stationName"] = getStringValue(0x0008, 0x1010);

    metadata["imageType"] = getStringValue(0x0008, 0x0008);
    metadata["instanceNumber"] = getStringValue(0x0020, 0x0013);
    metadata["sopInstanceUID"] = getStringValue(0x0008, 0x0018);
    metadata["sopClassUID"] = getStringValue(0x0008, 0x0016);

    metadata["rows"] = std::to_string(getRows());
    metadata["columns"] = std::to_string(getColumns());
    metadata["bitsAllocated"] = std::to_string(getBitsAllocated());
    metadata["bitsStored"] = std::to_string(getBitsStored());
    metadata["highBit"] = std::to_string(getHighBit());
    metadata["samplesPerPixel"] = std::to_string(getSamplesPerPixel());
    metadata["photometricInterpretation"] = getPhotometricInterpretation();

    metadata["windowCenter"] = std::to_string(getWindowCenter());
    metadata["windowWidth"] = std::to_string(getWindowWidth());
    metadata["rescaleIntercept"] = std::to_string(getRescaleIntercept());
    metadata["rescaleSlope"] = std::to_string(getRescaleSlope());

    metadata["pixelSpacing"] = getStringValue(0x0028, 0x0030);
    metadata["sliceThickness"] = getStringValue(0x0018, 0x0050);
    metadata["spacingBetweenSlices"] = getStringValue(0x0018, 0x0088);
    metadata["imagePositionPatient"] = getStringValue(0x0020, 0x0032);
    metadata["imageOrientationPatient"] = getStringValue(0x0020, 0x0037);
    metadata["sliceLocation"] = getStringValue(0x0020, 0x1041);

    metadata["bodyPartExamined"] = getStringValue(0x0018, 0x0015);
    metadata["viewPosition"] = getStringValue(0x0018, 0x5101);
    metadata["kvp"] = getStringValue(0x0018, 0x0060);
    metadata["tubeCurrent"] = getStringValue(0x0018, 0x1151);
    metadata["exposureTime"] = getStringValue(0x0018, 0x1150);
    metadata["exposure"] = getStringValue(0x0018, 0x1152);

    return metadata;
}

}

extern "C" {

DicomParser* dicom_create() {
    return new DicomParser();
}

void dicom_destroy(DicomParser* parser) {
    delete parser;
}

bool dicom_parse(DicomParser* parser, const uint8_t* data, size_t size) {
    if (!parser || !data || size == 0) {
        return false;
    }
    return parser->parse(data, size);
}

const uint8_t* dicom_get_pixel_data(DicomParser* parser, size_t* outSize) {
    if (!parser || !outSize) {
        return nullptr;
    }

    const std::vector<uint8_t>& pixelData = parser->getPixelData();
    *outSize = pixelData.size();

    if (pixelData.empty()) {
        return nullptr;
    }

    return pixelData.data();
}

char* dicom_get_metadata_json(DicomParser* parser) {
    if (!parser) {
        return nullptr;
    }

    std::map<std::string, std::string> metadata = parser->getMetadata();

    std::ostringstream oss;
    oss << "{";

    bool first = true;
    for (const auto& pair : metadata) {
        if (!first) {
            oss << ",";
        }
        first = false;

        std::string key = pair.first;
        std::string value = pair.second;

        std::string escapedValue;
        for (char c : value) {
            if (c == '\"' || c == '\\') {
                escapedValue += '\\';
            }
            if (c >= 32 && c < 127) {
                escapedValue += c;
            }
        }

        oss << "\"" << key << "\":\"" << escapedValue << "\"";
    }

    oss << "}";

    std::string jsonStr = oss.str();
    char* result = new char[jsonStr.length() + 1];
    std::strcpy(result, jsonStr.c_str());

    return result;
}

void dicom_free_string(char* str) {
    delete[] str;
}

uint16_t dicom_get_rows(DicomParser* parser) {
    return parser ? parser->getRows() : 0;
}

uint16_t dicom_get_columns(DicomParser* parser) {
    return parser ? parser->getColumns() : 0;
}

uint16_t dicom_get_bits_allocated(DicomParser* parser) {
    return parser ? parser->getBitsAllocated() : 0;
}

uint16_t dicom_get_bits_stored(DicomParser* parser) {
    return parser ? parser->getBitsStored() : 0;
}

uint16_t dicom_get_high_bit(DicomParser* parser) {
    return parser ? parser->getHighBit() : 0;
}

uint16_t dicom_get_samples_per_pixel(DicomParser* parser) {
    return parser ? parser->getSamplesPerPixel() : 0;
}

int32_t dicom_get_window_center(DicomParser* parser) {
    return parser ? parser->getWindowCenter() : 0;
}

int32_t dicom_get_window_width(DicomParser* parser) {
    return parser ? parser->getWindowWidth() : 255;
}

int32_t dicom_get_rescale_intercept(DicomParser* parser) {
    return parser ? parser->getRescaleIntercept() : 0;
}

int32_t dicom_get_rescale_slope(DicomParser* parser) {
    return parser ? parser->getRescaleSlope() : 1;
}

}

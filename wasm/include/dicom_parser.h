#ifndef DICOM_PARSER_H
#define DICOM_PARSER_H

#include <cstdint>
#include <cstddef>
#include <map>
#include <string>
#include <vector>
#include <memory>

namespace dicom {

enum class VR : uint16_t {
    AE = 0x4541,
    AS = 0x5341,
    AT = 0x5441,
    CS = 0x5343,
    DA = 0x4144,
    DS = 0x5344,
    DT = 0x5444,
    FL = 0x4C46,
    FD = 0x4446,
    IS = 0x5349,
    LO = 0x4F4C,
    LT = 0x544C,
    OB = 0x424F,
    OD = 0x444F,
    OF = 0x464F,
    OL = 0x4C4F,
    OV = 0x564F,
    OW = 0x574F,
    PN = 0x4E50,
    PO = 0x4F50,
    PS = 0x5350,
    QC = 0x4351,
    QS = 0x5351,
    QU = 0x5551,
    QV = 0x5651,
    QW = 0x5751,
    SH = 0x4853,
    SL = 0x4C53,
    SQ = 0x5153,
    SS = 0x5353,
    ST = 0x5453,
    SV = 0x5653,
    SW = 0x5753,
    TM = 0x4D54,
    UC = 0x4355,
    UI = 0x4955,
    UL = 0x4C55,
    UN = 0x4E55,
    UR = 0x5255,
    US = 0x5355,
    UT = 0x5455,
    UV = 0x5655,
    UW = 0x5755,
    OB_OW = 0x0000,
    UNKNOWN = 0xFFFF
};

struct Tag {
    uint16_t group;
    uint16_t element;

    Tag(uint16_t g = 0, uint16_t e = 0) : group(g), element(e) {}

    bool operator<(const Tag& other) const {
        if (group != other.group) {
            return group < other.group;
        }
        return element < other.element;
    }

    uint32_t toUint32() const {
        return (static_cast<uint32_t>(group) << 16) | element;
    }
};

struct DataElement {
    Tag tag;
    VR vr;
    uint32_t length;
    std::vector<uint8_t> value;

    DataElement() : vr(VR::UNKNOWN), length(0) {}
    DataElement(Tag t, VR v, uint32_t l, const std::vector<uint8_t>& val)
        : tag(t), vr(v), length(l), value(val) {}
};

class DicomParser {
private:
    std::map<Tag, DataElement> elements_;
    std::vector<uint8_t> pixelData_;
    bool isExplicitVR_;
    bool isLittleEndian_;
    bool parsed_;

    uint16_t readUint16(const uint8_t* data, size_t& offset, bool littleEndian = true);
    uint32_t readUint32(const uint8_t* data, size_t& offset, bool littleEndian = true);
    uint16_t readVR(const uint8_t* data, size_t& offset);
    uint32_t readLength(const uint8_t* data, size_t& offset, bool isExplicitVR, VR vr);
    bool parsePreamble(const uint8_t* data, size_t& offset, size_t totalSize);
    bool parseDataSet(const uint8_t* data, size_t& offset, size_t totalSize);
    bool parseDataElement(const uint8_t* data, size_t& offset, size_t totalSize);
    std::string convertValueToString(const DataElement& element);
    void extractPixelData();

public:
    DicomParser();
    ~DicomParser() = default;

    bool parse(const uint8_t* data, size_t size);
    bool parse(const std::vector<uint8_t>& data);

    bool hasElement(const Tag& tag) const;
    bool hasElement(uint16_t group, uint16_t element) const;

    std::string getStringValue(const Tag& tag) const;
    std::string getStringValue(uint16_t group, uint16_t element) const;

    int16_t getInt16Value(const Tag& tag) const;
    int16_t getInt16Value(uint16_t group, uint16_t element) const;

    uint16_t getUint16Value(const Tag& tag) const;
    uint16_t getUint16Value(uint16_t group, uint16_t element) const;

    int32_t getInt32Value(const Tag& tag) const;
    int32_t getInt32Value(uint16_t group, uint16_t element) const;

    uint32_t getUint32Value(const Tag& tag) const;
    uint32_t getUint32Value(uint16_t group, uint16_t element) const;

    double getDoubleValue(const Tag& tag) const;
    double getDoubleValue(uint16_t group, uint16_t element) const;

    const std::vector<uint8_t>& getPixelData() const;
    const std::map<Tag, DataElement>& getAllElements() const { return elements_; }

    uint16_t getRows() const;
    uint16_t getColumns() const;
    uint16_t getBitsAllocated() const;
    uint16_t getBitsStored() const;
    uint16_t getHighBit() const;
    uint16_t getSamplesPerPixel() const;
    int32_t getWindowCenter() const;
    int32_t getWindowWidth() const;
    int32_t getRescaleIntercept() const;
    int32_t getRescaleSlope() const;
    std::string getPhotometricInterpretation() const;

    std::map<std::string, std::string> getMetadata() const;

    bool isParsed() const { return parsed_; }
};

}

extern "C" {

using namespace dicom;

DicomParser* dicom_create();
void dicom_destroy(DicomParser* parser);

bool dicom_parse(DicomParser* parser, const uint8_t* data, size_t size);

const uint8_t* dicom_get_pixel_data(DicomParser* parser, size_t* outSize);

char* dicom_get_metadata_json(DicomParser* parser);

void dicom_free_string(char* str);

uint16_t dicom_get_rows(DicomParser* parser);
uint16_t dicom_get_columns(DicomParser* parser);
uint16_t dicom_get_bits_allocated(DicomParser* parser);
uint16_t dicom_get_bits_stored(DicomParser* parser);
uint16_t dicom_get_high_bit(DicomParser* parser);
uint16_t dicom_get_samples_per_pixel(DicomParser* parser);
int32_t dicom_get_window_center(DicomParser* parser);
int32_t dicom_get_window_width(DicomParser* parser);
int32_t dicom_get_rescale_intercept(DicomParser* parser);
int32_t dicom_get_rescale_slope(DicomParser* parser);

}

#endif

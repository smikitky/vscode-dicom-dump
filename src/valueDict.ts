interface ValueDict {
  [tag: string]: {
    [tagValue: string]: string;
  };
}

const dict: ValueDict = {
  '0002,0010': {
    // Transfer Syntax UID
    '1.2.840.10008.1.2':
      'Implicit VR Endian: Default Transfer Syntax for DICOM',
    '1.2.840.10008.1.2.1': 'Explicit VR Little Endian',
    '1.2.840.10008.1.2.1.99': 'Deflated Explicit VR Little Endian',
    '1.2.840.10008.1.2.2': 'Explicit VR Big Endian',
    '1.2.840.10008.1.2.4.50': 'JPEG Baseline (Process 1):',
    '1.2.840.10008.1.2.4.51': 'JPEG Baseline (Processes 2 & 4):',
    '1.2.840.10008.1.2.4.52': 'JPEG Extended (Processes 3 & 5)',
    '1.2.840.10008.1.2.4.53':
      'JPEG Spectral Selection, Nonhierarchical (Processes 6 & 8)',
    '1.2.840.10008.1.2.4.54':
      'JPEG Spectral Selection, Nonhierarchical (Processes 7 & 9)',
    '1.2.840.10008.1.2.4.55':
      'JPEG Full Progression, Nonhierarchical (Processes 10 & 12)',
    '1.2.840.10008.1.2.4.56':
      'JPEG Full Progression, Nonhierarchical (Processes 11 & 13)',
    '1.2.840.10008.1.2.4.57': 'JPEG Lossless, Nonhierarchical (Processes 14)',
    '1.2.840.10008.1.2.4.58': 'JPEG Lossless, Nonhierarchical (Processes 15)',
    '1.2.840.10008.1.2.4.59': 'JPEG Extended, Hierarchical (Processes 16 & 18)',
    '1.2.840.10008.1.2.4.60': 'JPEG Extended, Hierarchical (Processes 17 & 19)',
    '1.2.840.10008.1.2.4.61':
      'JPEG Spectral Selection, Hierarchical (Processes 20 & 22)',
    '1.2.840.10008.1.2.4.62':
      'JPEG Spectral Selection, Hierarchical (Processes 21 & 23)',
    '1.2.840.10008.1.2.4.63':
      'JPEG Full Progression, Hierarchical (Processes 24 & 26)',
    '1.2.840.10008.1.2.4.64':
      'JPEG Full Progression, Hierarchical (Processes 25 & 27)',
    '1.2.840.10008.1.2.4.65': 'JPEG Lossless, Nonhierarchical (Process 28)',
    '1.2.840.10008.1.2.4.66': 'JPEG Lossless, Nonhierarchical (Process 29)',
    '1.2.840.10008.1.2.4.70':
      'JPEG Lossless, Nonhierarchical, First-Order Prediction',
    '1.2.840.10008.1.2.4.80': 'JPEG-LS Lossless Image Compression',
    '1.2.840.10008.1.2.4.81':
      'JPEG-LS Lossy (Near- Lossless) Image Compression',
    '1.2.840.10008.1.2.4.90': 'JPEG 2000 Image Compression (Lossless Only)',
    '1.2.840.10008.1.2.4.91': 'JPEG 2000 Image Compression',
    '1.2.840.10008.1.2.4.92':
      'JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)',
    '1.2.840.10008.1.2.4.93':
      'JPEG 2000 Part 2 Multicomponent Image Compression',
    '1.2.840.10008.1.2.4.94': 'JPIP Referenced',
    '1.2.840.10008.1.2.4.95': 'JPIP Referenced Deflate',
    '1.2.840.10008.1.2.5': 'RLE Lossless',
    '1.2.840.10008.1.2.6.1': 'RFC 2557 MIME Encapsulation',
    '1.2.840.10008.1.2.4.100': 'MPEG2 Main Profile Main Level',
    '1.2.840.10008.1.2.4.102': 'MPEG-4 AVC/H.264 High Profile / Level 4.1',
    '1.2.840.10008.1.2.4.103':
      'MPEG-4 AVC/H.264 BD-compatible High Profile / Level 4.1'
  },
  '0008,0005': {
    // Specific Character Set
    'ISO_IR 100': 'Latin alphabet No. 1',
    'ISO_IR 101': 'Latin alphabet No. 2',
    'ISO_IR 109': 'Latin alphabet No. 3',
    'ISO_IR 110': 'Latin alphabet No. 4',
    'ISO_IR 144': 'Cyrillic',
    'ISO_IR 127': 'Arabic',
    'ISO_IR 126': 'Greek',
    'ISO_IR 138': 'Hebrew',
    'ISO_IR 148': 'Latin alphabet No. 5',
    'ISO_IR 13': 'Japanese (half-width katakana)',
    'ISO_IR 166': 'Thai',
    'ISO_IR 192': 'Unicode in UTF-8',
    'ISO 2022 IR 6': 'Default repertoire',
    'ISO 2022 IR 100': 'Latin alphabet No. 1',
    'ISO 2022 IR 101': 'Latin alphabet No. 2',
    'ISO 2022 IR 109': 'Latin alphabet No. 3',
    'ISO 2022 IR 110': 'Latin alphabet No. 4',
    'ISO 2022 IR 144': 'Cyrillic',
    'ISO 2022 IR 127': 'Arabic',
    'ISO 2022 IR 126': 'Greek',
    'ISO 2022 IR 138': 'Hebrew',
    'ISO 2022 IR 148': 'Latin alphabet No. 5',
    'ISO 2022 IR 13': 'Japanese (half-width katakana)',
    'ISO 2022 IR 166': 'Thai',
    'ISO 2022 IR 87': 'Japanese (kanji)',
    'ISO 2022 IR 159': 'Japanese (supplementary kanji)',
    'ISO 2022 IR 149': 'Korean',
    GB18030: 'Chinese GB18030',
    GBK: 'Chinese GBK'
  },
  '0008,0060': {
    // Modality
    AR: 'Autorefraction',
    AU: 'Audio',
    BDUS: 'Bone Densitometry (ultrasound)',
    BI: 'Biomagnetic imaging',
    BMD: 'Bone Densitometry (X-Ray)',
    CR: 'Computed Radiography',
    CT: 'Computed Tomography',
    DG: 'Diaphanography',
    DOC: 'Document',
    DX: 'Digital Radiography',
    ECG: 'Electrocardiography',
    EPS: 'Cardiac Electrophysiology',
    ES: 'Endoscopy',
    FID: 'Fiducials',
    GM: 'General Microscopy',
    HC: 'Hard Copy',
    HD: 'Hemodynamic Waveform',
    IO: 'Intra-Oral Radiography',
    IOL: 'Intraocular Lens Data',
    IVOCT: 'Intravascular Optical Coherence Tomography',
    IVUS: 'Intravascular Ultrasound',
    KER: 'Keratometry',
    KO: 'Key Object Selection',
    LEN: 'Lensometry',
    LS: 'Laser surface scan',
    MG: 'Mammography',
    MR: 'Magnetic Resonance',
    NM: 'Nuclear Medicine',
    OAM: 'Ophthalmic Axial Measurements',
    OCT: 'Optical Coherence Tomography (non-Ophthalmic)',
    OPM: 'Ophthalmic Mapping',
    OP: 'Ophthalmic Photography',
    OPT: 'Ophthalmic Tomography',
    OPV: 'Ophthalmic Visual Field',
    OSS: 'Optical Surface Scan',
    OT: 'Other',
    PLAN: 'Plan',
    PR: 'Presentation State',
    PT: 'Positron emission tomography (PET)',
    PX: 'Panoramic X-Ray',
    REG: 'Registration',
    RESP: 'Respiratory Waveform',
    RF: 'Radio Fluoroscopy',
    RG: 'Radiographic imaging (conventional film/screen)',
    RTDOSE: 'Radiotherapy Dose',
    RTIMAGE: 'Radiotherapy Image',
    RTPLAN: 'Radiotherapy Plan',
    RTRECORD: 'RT Treatment Record',
    RTSTRUCT: 'Radiotherapy Structure Set',
    RWV: 'Real World Value Map',
    SEG: 'Segmentation',
    SMR: 'Stereometric Relationship',
    SM: 'Slide Microscopy',
    SRF: 'Subjective Refraction',
    SR: 'SR Document',
    STAIN: 'Automated Slide Stainer',
    TG: 'Thermography',
    US: 'Ultrasound',
    VA: 'Visual Acuity',
    XA: 'X-Ray Angiography',
    XC: 'External-camera Photography'
  },
  '0018,5100': {
    // Patient Position
    HFP: 'Head First-Prone',
    HFS: 'Head First-Supine',
    HFDR: 'Head First-Decubitus Right',
    HFDL: 'Head First-Decubitus Left',
    FFDR: 'Feet First-Decubitus Right',
    FFDL: 'Feet First-Decubitus Left',
    FFP: 'Feet First-Prone',
    FFS: 'Feet First-Supine'
  },
  '0028,0004': {
    // Photometric Interpretation
    MONOCHROME1:
      'Pixel data represent a single monochrome image plane. The minimum sample value is intended to be displayed as white after any VOI gray scale transformations have been performed.',
    MONOCHROME2:
      'Pixel data represent a single monochrome image plane. The minimum sample value is intended to be displayed as black after any VOI gray scale transformations have been performed.',
    'PALETTE COLOR':
      'Pixel data describe a color image with a single sample per pixel (single image plane). The pixel value is used as an index into each of the Red, Blue, and Green Palette Color Lookup Tables.',
    RGB:
      'Pixel data represent a color image described by red, green, and blue image planes. The minimum sample value for each color plane represents minimum intensity of the color.',
    YBR_FULL:
      'Pixel data represent a color image described by one luminance (Y) and two chrominance planes (CB and CR).',
    YBR_FULL_422:
      'Pixel data represent a color image described by one luminance (Y) and two chrominance planes (CB and CR).',
    YBR_PARTIAL_422:
      'Pixel data represent a color image described by one luminance (Y) and two chrominance planes (CB and CR).',
    YBR_PARTIAL_420:
      'Pixel data represent a color image described by one luminance (Y) and two chrominance planes (CB and CR).',
    YBR_ICT:
      'Irreversible Color Transformation: Pixel data represent a color image described by one luminance (Y) and two chrominance planes (CB and CR).',
    YBR_RCT:
      'Reversible Color Transformation: Pixel data represent a color image described by one luminance (Y) and two chrominance planes (CB and CR).'
  },
  '0028,0006': {
    // Planar Configuration
    '0':
      'The sample values for the first pixel are followed by the sample values for the second pixel, etc. For RGB images, this means the order of the pixel values sent shall be R1, G1, B1, R2, G2, B2, …, etc.',
    '1':
      'Each color plane shall be sent contiguously. For RGB images, this means the order of the pixel values sent is R1, R2, R3, …, G1, G2, G3, …, B1, B2, B3, etc.'
  },
  '0028,0103': {
    // Pixel Representation
    '0': '0: Pixel samples are represented in unsigned integer.',
    '1': "1: Pixel samples are represnted in 2's complement (signed integer)."
  },
  '0028,1040': {
    // Pixel Intensity Relationship
    LIN: 'Pixel samples are linearly proportional to X-Ray beam intensity.',
    LOG:
      'Pixel samples are logarithmically proportional to X-Ray beam intensity.'
  }
};

export default dict;

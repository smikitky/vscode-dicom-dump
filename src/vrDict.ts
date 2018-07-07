// Based on ftp://dicom.nema.org/MEDICAL/Dicom/2014a/output/chtml/part05/sect_6.2.html

const dict: { [vr: string]: string | undefined } = {
  AE:
    '**Application Entity**. A string of characters that identifies an Application Entity with leading and trailing spaces (20H) being non-significant.',
  AS:
    '**Age String**. A string of characters with one of the following formats -- `nnnD`, `nnnW`, `nnnM`, `nnnY`; where `nnn` shall contain the number of days for `D`, weeks for `W`, months for `M`, or years for `Y`.',
  AT:
    '**Attribute Tag**. Ordered pair of 16-bit unsigned integers that is the value of a Data Element Tag.',
  CS:
    '**Code String**. A string of characters with leading or trailing spaces (20H) being non-significant. 16 bytes maximum.',
  DA:
    '**Date**. A string of characters of the format `YYYYMMDD`; where `YYYY` shall contain year, `MM` shall contain the month, and `DD` shall contain the day, interpreted as a date of the Gregorian calendar system.',
  DS:
    '**Decimal String**. A string of characters representing either a fixed point number or a floating point number.',
  DT:
    '**Date Time**. A concatenated date-time character string in the format: `YYYYMMDDHHMMSS.FFFFFF&ZZXX`',
  FL:
    '**Floating Point Single**. Single precision binary floating point number represented in IEEE 754:1985 32-bit Floating Point Number Format.',
  FD:
    '**Floating Point Double**. Double precision binary floating point number represented in IEEE 754:1985 64-bit Floating Point Number Format.',
  IS:
    '**Integer String**. A string of characters representing an Integer in base-10 (decimal).',
  LO:
    '**Long String**. A character string that may be padded with leading and/or trailing spaces. 64 chars maximum.',
  LT:
    '**Long Text**. A character string that may contain one or more paragraphs. 10240 chars maximum.',
  OB:
    '**Other Byte String**. A string of bytes where the encoding of the contents is specified by the negotiated Transfer Syntax.',
  OD:
    '**Other Double String**. A string of 64-bit IEEE 754:1985 floating point words.',
  OF:
    '**Other Float String**. A string of 32-bit IEEE 754:1985 floating point words.',
  OW:
    '**Other Word String**. A string of 16-bit words where the encoding of the contents is specified by the negotiated Transfer Syntax.',
  PN:
    '**Person Name**. A character string encoded using a 5 component convention. For human use, the five components in their order of occurrence are: family name complex, given name complex, middle name, name prefix, name suffix.',
  SH:
    '**Short String**. A character string that may be padded with leading and/or trailing spaces. 16 chars maximum.',
  SL:
    "**Signed Long**. Signed binary integer 32 bits long in 2's complement form.",
  SQ: '**Sequence of Items**. Value is a Sequence of zero or more Items.',
  SS:
    "**Signed Short**. Signed binary integer 16 bits long in 2's complement form.",
  ST:
    '**Short Text**. A character string that may contain one or more paragraphs. 1024 chars maximum.',
  TM:
    '**Time**. A string of characters of the format HHMMSS.FFFFFF; where HH contains hours (range "00" - "23"), MM contains minutes (range "00" - "59"), SS contains seconds (range "00" - "60"), and FFFFFF contains a fractional part of a second as small as 1 millionth of a second (range "000000" - "999999").',
  UI:
    '**Unique Identifier (UID)**. A character string containing a UID that is used to uniquely identify a wide variety of items. The UID is a series of numeric components separated by the period `.` character.',
  UL: '**Unsigned Long**. Unsigned binary integer 32 bits long.',
  UN:
    '**Unknown**. A string of bytes where the encoding of the contents is unknown.',
  US: '**Unsigned Short**. Unsigned binary integer 16 bits long.',
  UT:
    '**Unlimited Text**. A character string that may contain one or more paragraphs.'
};

export default dict;

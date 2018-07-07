/**
 * EncConverter takes byte arrays from DICOM file and returns an
 * ordinary JavaScript Unicode string.
 * Target VR types are SH (Short String), LO (Long String), ST (Short Text),
 * LT (Long Text), PN (Person Name) and UT (Unlimited Text).
 */
export interface EncConverter {
  (input: Buffer, vr?: string): string;
}

interface AvailableConverter {
  pattern: RegExp;
  converter: (charSet: string) => Promise<EncConverter>;
}

/**
 * A higher-order function that returns a new function,
 * which in turn returns an EncConverter.
 * @param encoding
 */
const iconvLite: (
  encoding: string
) => (() => Promise<EncConverter>) = encoding => {
  return async () => {
    const iconv = await import('iconv-lite');
    return buffer => iconv.decode(buffer, encoding);
  };
};

/**
 * Mapping of "specific character set defined terms" and EncConverter.
 */
const encodingMap: AvailableConverter[] = [
  {
    // Japanese ISO-2022-JP (aka "JIS"), including half-width katakana.
    pattern: /IR\s?(87|13)\b/,
    converter: async charSet => {
      // Currently iconv-lite does not support this encoding.
      const jconv = await import('jconv');
      return (buffer, vr) => {
        return jconv.decode(buffer, 'ISO-2022-JP');
      };
    }
  },
  { pattern: /IR\s?100\b/, converter: iconvLite('iso-8859-1') }, // Latin-1
  { pattern: /IR\s?101\b/, converter: iconvLite('iso-8859-2') }, // Latin-2
  { pattern: /IR\s?109\b/, converter: iconvLite('iso-8859-3') }, // Latin-3
  { pattern: /IR\s?110\b/, converter: iconvLite('iso-8859-4') }, // Latin-4
  { pattern: /IR\s?144/, converter: iconvLite('iso-8859-5') }, // Cyrillic
  { pattern: /IR\s?127/, converter: iconvLite('iso-8859-6') }, // Arabic
  { pattern: /IR\s?126/, converter: iconvLite('iso-8859-7') }, // Greek
  { pattern: /IR\s?138/, converter: iconvLite('iso-8859-8') }, // Hebrew
  { pattern: /IR\s?148/, converter: iconvLite('iso-8859-9') }, // Latin-5
  { pattern: /IR\s?192\b/, converter: iconvLite('utf-8') }, // UTF-8
  { pattern: /GB18030/, converter: iconvLite('gb18030') }, // Chinese
  { pattern: /GBK/, converter: iconvLite('gbk') }, // Chinese
  { pattern: /IR\s?166\b/, converter: iconvLite('tis620') } // Thai
  // Korean (ISO IR 149) needs pure-JS "ISO-2022-KR" solution...
];

// cf:
// https://github.com/InsightSoftwareConsortium/DCMTK/blob/master/dcmdata/libsrc/dcspchrs.cc#L168

/**
 * Examines the value of SpecificCharacterSet (0008,0005) and
 * creates the corresponding EncConverter.
 * @param charSet SpecificCharacterSet string from the DICOM file.
 */
export async function createEncConverter(
  charSet: string
): Promise<EncConverter | undefined> {
  for (let item of encodingMap) {
    if (item.pattern.test(charSet)) {
      return await item.converter(charSet);
    }
  }

  // Nothing matched.
  return undefined;
}

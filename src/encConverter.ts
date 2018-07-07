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

const convertJapanesePn = (buffer: Buffer, charSet: string, jconv: any) => {
  const map: { [key: string]: (buffer: Buffer) => string } = {
    'IR 6': b => b.toString('utf8'),
    'IR 13': b => jconv.decode(b, 'sjis'),
    'IR 87': b => jconv.decode(b, 'iso-2022-jp')
  };
  const charSets = charSet.split('\\').map(s => s.trim());
  if (charSets[0] === '') charSets[0] = 'ISO 2022 IR 6';
  const components = buffer.toString('binary').split('=');

  return components
    .map((component, index) => {
      const cs =
        index < charSets.length
          ? charSets[index]
          : charSets[charSets.length - 1];
      const enc = Object.keys(map).find(k => cs.indexOf(k) >= 0) || 'IR 6';
      return map[enc](Buffer.from(component, 'binary'));
    })
    .join('=');
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
      // ISO-IR 13 is rarely-used 7-bit hankaku katakana.
      const csValues = charSet.split('\\').map(s => s.trim());
      if (csValues[0] === '') csValues[0] = 'ISO-IR 6';

      const jconv = await import('jconv');
      return (buffer, vr) => {
        if (vr !== 'PN') return jconv.decode(buffer, 'ISO-2022-JP');
        return convertJapanesePn(buffer, charSet, jconv);
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
  // None matched, meaning some unknown encoding has been specified
  return undefined;
}

/**
 * EncConverter takes byte arrays from DICOM file and returns an
 * ordinary JavaScript Unicode string.
 * Target VR types are SH (Short String), LO (Long String), ST (Short Text),
 * LT (Long Text), PN (Person Name) and UT (Unlimited Text).
 */
export interface EncConverter {
  (input: Buffer): string;
}

interface AvailableConverter {
  pattern: RegExp;
  converter: () => Promise<EncConverter>;
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
    // ISO 8859-1 (aka "Latin-1")
    pattern: /IR\s?100\b/,
    converter: iconvLite('iso-8859-1')
  },
  {
    // UTF-8 encoding
    pattern: /IR\s?192\b/,
    converter: async () => {
      return buffer => buffer.toString('utf8');
    }
  },
  {
    // Japanese ISO-2022-JP (aka "JIS"), including half-width katakana.
    pattern: /IR\s?(87|13)\b/,
    converter: async () => {
      // Currently iconv-lite does not support this encoding.
      const jconv = await import('jconv');
      return buffer => jconv.decode(buffer, 'ISO-2022-JP');
    }
  }
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
      return await item.converter();
    }
  }

  // Nothing matched.
  return undefined;
}

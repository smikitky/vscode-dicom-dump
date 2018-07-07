/**
 * EncConverter takes byte arrays from DICOM file and returns an
 * ordinary JavaScript Unicode string.
 * Target VR types are SH (Short String), LO (Long String), ST (Short Text),
 * LT (Long Text), PN (Person Name) and UT (Unlimited Text).
 */
export interface EncConverter {
  (input: Buffer, vr: string): string;
}

type Decoder = (input: Buffer) => string;

/**
 * A higher-order function that returns a new function,
 * which in turn returns a Decoder.
 * We use HoF because we want to load external modules as late as possible.
 * @param encoding
 */
const iconvLite: (encoding: string) => (() => Promise<Decoder>) = encoding => {
  return async () => {
    const iconv = await import('iconv-lite');
    return buffer => iconv.decode(buffer, encoding);
  };
};

// cf:
// https://github.com/InsightSoftwareConsortium/DCMTK/blob/master/dcmdata/libsrc/dcspchrs.cc#L168

const encMap: { [key: string]: () => Promise<Decoder> } = {
  'IR 6': async () => b => b.toString('utf8'), // ASCII (but utf8 is compatible)
  'IR 13': iconvLite('sjis'), // Japanese half-width katakana (sjis is compatible)
  'IR 87': async () => {
    // Japanese JIS kanji
    const jconv = await import('jconv');
    return b => jconv.decode(b, 'iso-2022-jp');
  },
  'IR 149': async () => {
    // Korean
    const iconv = await import('iconv-lite');
    // HACK!: FIXME!: We should use a pure-JS ISO-2022-KR implementation,
    // but here we just ignore the escape sequence.
    return b => iconv.decode(b, 'euc-kr').replace(/\x1b\x24\x29\x43/g, '');
  },
  'IR 100': iconvLite('iso-8859-1'), // Latin-1
  'IR 101': iconvLite('iso-8859-2'), // Latin-2
  'IR 109': iconvLite('iso-8859-3'), // Latin-3
  'IR 110': iconvLite('iso-8859-4'), // Latin-4
  'IR 144': iconvLite('iso-8859-5'), // Cyrillic
  'IR 127': iconvLite('iso-8859-6'), // Arabic
  'IR 126': iconvLite('iso-8859-7'), // Greek
  'IR 138': iconvLite('iso-8859-8'), // Hebrew
  'IR 148': iconvLite('iso-8859-9'), // Latin-5
  'IR 192': iconvLite('utf-8'), // UTF-8
  GB18030: iconvLite('gb18030'), // Chinese
  GBK: iconvLite('gbk'), // Chinese
  'IR 166': iconvLite('tis620') // Thai
};

const createdDecoders = new Map<string, Decoder>();

/**
 * Examines the value of SpecificCharacterSet (0008,0005) and
 * creates the corresponding EncConverter.
 * @param charSet SpecificCharacterSet string from the DICOM file.
 */
export async function createEncConverter(
  charSet: string
): Promise<EncConverter | undefined> {
  // SpecificCharacterSet may have more than one value, delimited by '\'.
  // If the first value is omitted, it becomes default repertoire, i.e., ASCII.
  const charSets = charSet.split('\\').map(s => s.trim());
  if (charSets[0] === '') charSets[0] = 'IR 6'; // ASCII
  const decoders: EncConverter[] = [];

  // Now asynchronously create decoders that corresponds to each value.
  // External modules required for conversion will be lazily-loaded here.
  for (let cs of charSets) {
    const enc = Object.keys(encMap).find(k => cs.endsWith(k));
    if (!enc) return undefined;
    const decoder = createdDecoders.get(enc) || (await encMap[enc]());
    createdDecoders.set(enc, decoder);
    decoders.push(decoder);
  }

  // Creates the new EncConverter and returns it.
  return (buffer: Buffer, vr: string) => {
    if (vr !== 'PN') {
      return decoders[0](buffer, vr);
    } else {
      // If VR is 'PN', we need to separately decode each
      // component delimited by '='.
      const components = buffer
        .toString('binary')
        .split('=')
        .map(s => Buffer.from(s, 'binary'));
      const decodedComponents = components.map((component, index) => {
        const decoder =
          index < decoders.length
            ? decoders[index]
            : decoders[charSets.length - 1];
        return decoder(component, vr);
      });
      return decodedComponents.join('=');
    }
  };
}

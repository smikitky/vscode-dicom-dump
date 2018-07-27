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
  'IR 13': iconvLite('sjis'), // Japanese half-width kana (sjis is compatible)
  'IR 87': async () => {
    // Japanese JIS kanji
    const jconv = await import('jconv');
    return b => {
      // HACK: Replace the escape sequence 'ESC ( J' to 'ESC ( B'.
      // Both roughly mean "switch to ASCII",
      // but jconv currently does not support the former.
      const buf = Buffer.from(
        b.toString('binary').replace(/\x1b\x28\x4a/g, '\x1b\x28\x42'),
        'binary'
      );
      return jconv.decode(buf, 'iso-2022-jp');
    };
    // TODO: Many DICOM files in Japan actually stores kanji in 'SJIS'
    // rather than JIS. We might do some guessing here.
  },
  'IR 149': async () => {
    // EUC-KR is basically the same as ISO-2022-KR
    // except that KS X 1001 is implicitly invoked to G1 without
    // the escape sequence 'ESC $ ) C'. So we can simply remove this sequence.
    const iconv = await iconvLite('euc-kr')();
    return buffer => {
      const replaced = Buffer.from(
        buffer.toString('binary').replace(/\x1b\x24\x29\x43/g, ''),
        'binary'
      );
      return iconv(replaced);
    };
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
    }
    // If VR is 'PN', we need to separately decode each
    // component delimited by '='.
    const components = splitPnComponents(buffer.toString('binary')).map(s =>
      Buffer.from(s, 'binary')
    );
    const decodedComponents = components.map((component, index) => {
      const decoder =
        index < decoders.length
          ? decoders[index]
          : decoders[charSets.length - 1];
      return decoder(component, vr);
    });
    return decodedComponents.join('=');
  };
}

/**
 * Splits a string using the delimiter '=',
 * taking escape sequence into consideration.
 * https://en.wikipedia.org/wiki/ISO/IEC_2022
 */
export function splitPnComponents(input: string): string[] {
  // Note: this is only necessary for Japanese ISO-2022-JP,
  // where kanji characters are invoked to the G0 area.
  const len = input.length;
  const results: string[] = [];
  let escaped: boolean = false;
  let i = 0;
  let start = 0;
  while (i < len) {
    if (!escaped && input[i] === '=') {
      results.push(input.substring(start, i));
      start = i + 1;
      i++;
      continue;
    }
    const substr = input.substr(i, 3);
    if (substr.match(/^\x1b\$(@|B|\(D)/)) {
      // Switch to kanji
      escaped = true;
      i += 3;
    } else if (substr.match(/^\x1b\([BJ]/)) {
      // Switch to ASCII / JIS X 0201
      escaped = false;
      i += 3;
    } else {
      i++;
    }
  }
  results.push(input.substr(start));
  return results;
}

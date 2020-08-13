import { DataSet, Element } from 'dicom-parser';
import { DicomDataElements, TagInfo } from 'dicom-data-dictionary';
import { EncConverter } from './encConverter';
import { PrivateTagDict } from './privateTagDict';

export interface ParsedElement {
  tag: string; // like '(0008,0060)'
  vr: string; // like 'CS'
  name: string; // like 'modality'
  desc?: string; // like 'binary data of length: 2'
  text?: string; // like 'MR'
  sequenceItems?: ParsedElement[][]; // Only used for 'SQ' element
}

/**
 * Converts tag key into more familiar format like `(0008,0060)`
 * @param tag dicom-parser's tag string like 'x00080060'
 */
function formatTag(tag: string): string {
  const group = tag.substring(1, 5).toUpperCase();
  const element = tag.substring(5, 9).toUpperCase();
  return `(${group},${element})`;
}

function numberListToText(
  dataSet: DataSet,
  key: string,
  accessor: string,
  valueBytes: number
): { desc?: string; text?: string } {
  // Each numerical value field may contain more than one number value
  // due to the value multiplicity (VM) mechanism.
  const numElements = dataSet.elements[key].length / valueBytes;
  if (!numElements) return { desc: 'empty value' };
  const numbers: number[] = [];
  for (let i = 0; i < numElements; i++) {
    numbers.push((<any>dataSet)[accessor](key, i) as number);
  }
  return { text: numbers.join('\\') };
}

function elementToText(
  dataSet: DataSet,
  key: string,
  vr: string,
  rootDataSet: DataSet,
  encConverter: EncConverter
): { desc?: string; text?: string } {
  const element = dataSet.elements[key];

  if (vr.indexOf('|') >= 0) {
    // This means the true VR type depends on other DICOM element.
    const vrs = vr.split('|');
    if (vrs.every(v => ['OB', 'OW', 'OD', 'OF'].indexOf(v) >= 0)) {
      // This is a binary data, anyway, so treat it as such
      return elementToText(dataSet, key, 'OB', rootDataSet, encConverter);
    } else if (vrs.every(v => ['US', 'SS'].indexOf(v) >= 0)) {
      const pixelRepresentation = rootDataSet.uint16('x00280103');
      switch (pixelRepresentation) {
        case 0:
          return elementToText(dataSet, key, 'US', rootDataSet, encConverter);
        case 1:
          return elementToText(dataSet, key, 'SS', rootDataSet, encConverter);
        default:
          return { desc: 'error: could not determine pixel representation' };
      }
    } else {
      return { desc: 'error: could not guess VR of this tag' };
    }
  }

  const asHexDump = () => {
    const bin = Buffer.from(
      dataSet.byteArray.buffer,
      element.dataOffset,
      element.length
    );
    return `bin: 0x${bin.toString('hex')}`;
  };

  switch (vr) {
    case 'OB': // Other Byte String
    case 'OW': // Other Word String
    case 'OD': // Other Double String
    case 'OF': // Other Float String
    case '??': // VR not provided at all. Should not happen.
      return element.length <= 16
        ? { desc: asHexDump() }
        : { desc: `binary data of length: ${element.length}` };
    case 'SQ': {
      if (Array.isArray(element.items)) {
        const len = element.items.length;
        return { desc: `sequence of ${len} item${len !== 1 ? 's' : ''}` };
      } else return { desc: 'error: broken sequence' }; // should not happen
    }
    case 'AT': {
      // Attribute Tag
      const group = dataSet.uint16(key, 0) as number;
      const groupHexStr = ('0000' + group.toString(16)).substr(-4);
      const element = dataSet.uint16(key, 1) as number;
      const elementHexStr = ('0000' + element.toString(16)).substr(-4);
      return { text: '0x' + groupHexStr + elementHexStr };
    }
    case 'FL':
      return numberListToText(dataSet, key, 'float', 4);
    case 'FD':
      return numberListToText(dataSet, key, 'double', 8);
    case 'UL':
      return numberListToText(dataSet, key, 'uint32', 4);
    case 'SL':
      return numberListToText(dataSet, key, 'int32', 4);
    case 'US':
      return numberListToText(dataSet, key, 'uint16', 2);
    case 'SS':
      return numberListToText(dataSet, key, 'int16', 2);
    case 'UN': {
      // "Unknown" VR. We do not know how to stringify this value,
      // but tries to interpret as an ASCII string.
      const str = dataSet.string(key);
      const isAscii = typeof str === 'string' && /^[\x20-\x7E]+$/.test(str);
      if (isAscii) return { text: str };
      return element.length <= 16
        ? { desc: asHexDump() }
        : { desc: `seemengly binary data (UN) of length: ${element.length}` };
    }
    case 'SH':
    case 'LO':
    case 'ST':
    case 'LT':
    case 'PN':
    case 'UT': {
      // These are subject to Specific Character Set (0008,0005)
      const bin = Buffer.from(
        dataSet.byteArray.buffer,
        element.dataOffset,
        element.length
      );
      return { text: encConverter(bin, vr) };
    }
    default: {
      // Other string VRs which use ASCII chars, such as DT
      const text = dataSet.string(key);
      if (typeof text === 'undefined') return { desc: 'undefined' };
      if (!text.length) return { desc: 'empty string' };
      return { text };
    }
  }
}

function findTagInfo(
  dictionary: DicomDataElements,
  tag: string
): (TagInfo & { forceVr?: string }) | undefined {
  const key = tag.substring(1, 9).toUpperCase();
  if (key in dictionary) return dictionary[key];
  if (/0000$/.test(key)) {
    // (gggg,0000) is a _retired_ Group Length tag
    // http://dicom.nema.org/dicom/2013/output/chtml/part05/sect_7.2.html
    return { name: 'GroupLength', vr: 'UL' };
  }
  return undefined;
}

function findTagInfoPrivate(
  dictionary: PrivateTagDict,
  privateCreatorTable: any,
  dataSet: DataSet,
  element: Element,
  encConverter: EncConverter
): (TagInfo & { forceVr?: string }) | undefined {

  const tag = element.tag;
  const privateCreatorLow = tag.substring(5, 7);

  if (privateCreatorLow === '00') {
    const bin = Buffer.from(
      dataSet.byteArray.buffer,
      element.dataOffset,
      element.length
    );
    const privateCreator = encConverter(bin, 'LO');
    privateCreatorTable[tag] = privateCreator.trim();
    return { name: 'PrivateCreator', vr: 'LO' };
  }

  const privateCreatorKey = 'x' + tag.substring(1, 5) + '00' + privateCreatorLow;
  if (privateCreatorKey in privateCreatorTable) {
    const privateCreator = privateCreatorTable[privateCreatorKey];

    if (privateCreator in dictionary) {
      const privateKey = tag.substring(1, 5) + '00' + tag.substring(7, 9);
      const privateDictionary = dictionary[privateCreator];

      if (privateDictionary !== undefined && privateKey in privateDictionary) {
        return privateDictionary[privateKey];
      }
    }
  }
  return { name: privateCreatorKey, vr: 'LO' };
}

/**
 * Iterates of DICOM dataSet from dicom-parser and creates a
 * human-readable tree, which then can be transformed into a text document.
 * @param dataSet The raw results from dicom-parser.
 * @param deps Various options and dependencies.
 */
export function buildTreeFromDataSet(
  dataSet: DataSet,
  deps: {
    rootDataSet: DataSet;
    showPrivateTags: boolean;
    dictionary: DicomDataElements;
    privateDictionary: PrivateTagDict;
    encConverter: EncConverter;
  }
): ParsedElement[] {
  const { rootDataSet, showPrivateTags, dictionary, privateDictionary, encConverter } = deps;
  const privateCreatorTable = {};
  const entries: ParsedElement[] = [];
  const keys = Object.keys(dataSet.elements).sort();
  for (const key of keys) {
    const element = dataSet.elements[key];

    // A tag is private if the group number is odd
    const isPrivateTag = /[13579bdf]/i.test(element.tag[4]);
    if (isPrivateTag && !showPrivateTags) continue;

    // "Item delimitation" tag in a sequence
    if (key === 'xfffee00d') continue;

    const tagInfo = isPrivateTag
      ? findTagInfoPrivate(privateDictionary, privateCreatorTable, dataSet, element, encConverter)
      : findTagInfo(dictionary, element.tag);

    const vr: string =
      (tagInfo && tagInfo.forceVr && tagInfo.vr) ||
      element.vr ||
      (tagInfo ? tagInfo.vr : '??');

    const textOrDesc = elementToText(
      dataSet,
      key,
      vr,
      rootDataSet,
      encConverter
    );
    entries.push({
      tag: formatTag(element.tag),
      name: tagInfo ? tagInfo.name : '?',
      vr,
      ...textOrDesc,
      sequenceItems: Array.isArray(element.items)
        ? element.items.map(item => buildTreeFromDataSet(item.dataSet, deps))
        : undefined
    });
  }
  return entries;
}

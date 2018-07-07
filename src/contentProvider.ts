import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pify from 'pify';
import * as parser from 'dicom-parser';
import { standardDataElements } from 'dicom-data-dictionary';
import { DicomDataElements, TagInfo } from 'dicom-data-dictionary';
import { EncConverter, createEncConverter } from './encConverter';

interface HeadingEntry {
  depth: number;
  heading: string;
}

/** Represents a single line which describes an element. */
interface ElementEntry {
  depth: number;
  tag: string;
  vr: string;
  tagName: string;
  text: string;
}

/** Represents a single line of final output. */
type Entry = HeadingEntry | ElementEntry;

function formatTag(tag: string): string {
  const group = tag.substring(1, 5).toUpperCase();
  const element = tag.substring(5, 9).toUpperCase();
  return `(${group},${element})`;
}

function numberListToText(
  dataSet: parser.DataSet,
  key: string,
  accessor: string,
  valueBytes: number
): string {
  const numElements = dataSet.elements[key].length / valueBytes;
  const numbers: number[] = [];
  for (let i = 0; i < numElements; i++) {
    numbers.push((<any>dataSet)[accessor](key, i) as number);
  }
  return numbers.join('\\');
}

function elementToText(
  dataSet: parser.DataSet,
  key: string,
  vr: string,
  rootDataSet: parser.DataSet,
  encConverter: EncConverter
): string | undefined {
  const element = dataSet.elements[key];

  if (vr.indexOf('|') >= 0) {
    // This means the true VR type depends on other DICOM element.
    const vrs = vr.split('|');
    if (vrs.every(v => ['OB', 'OW', 'OD', 'OF'].indexOf(v) >= 0)) {
      // This is a binary data, anyway, so treat it as such
      return elementToText(dataSet, key, 'OB', rootDataSet, encConverter);
    } else if (vrs.every(v => ['US', 'SS'].indexOf(v) >= 0)) {
      const pixelRepresentation: number = rootDataSet.uint16('x00280103');
      switch (pixelRepresentation) {
        case 0:
          return elementToText(dataSet, key, 'US', rootDataSet, encConverter);
        case 1:
          return elementToText(dataSet, key, 'SS', rootDataSet, encConverter);
        default:
          return '<error: could not determine pixel representation>';
      }
    } else {
      return '<error: could not guess VR>';
    }
  }

  switch (vr) {
    case 'OB': // Other Byte String
    case 'OW': // Other Word String
    case 'OD': // Other Double String
    case 'OF': // Other Float String
    case '??': // VR not provided at all. Should not happen.
      return `<binary data of length: ${element.length}>`;
    case 'SQ':
      // This means the parser failed to recognize the element as a list.
      // Should not happen unless VR is forcibly changed.
      return '<unparsed sequence of items>';
    case 'AT': {
      // Attribute Tag
      const group = dataSet.uint16(key, 0);
      const groupHexStr = ('0000' + group.toString(16)).substr(-4);
      const element = dataSet.uint16(key, 1);
      const elementHexStr = ('0000' + element.toString(16)).substr(-4);
      return '0x' + groupHexStr + elementHexStr;
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
      // "Unknown" VR. We have no clue as to how to represent this.
      const str = dataSet.string(key);
      const isAscii = /^[\x20-\x7E]+$/.test(str);
      if (isAscii) return str;
      if (element.length <= 16) {
        const bin = Buffer.from(
          dataSet.byteArray.buffer,
          element.dataOffset,
          element.length
        );
        return `<bin: 0x${bin.toString('hex')}>`;
      }
      return `<seemengly binary data (UN) of length: ${element.length}>`;
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
      return encConverter(bin);
    }
    default:
      // Other string VRs which use ASCII chars, such as DT
      return dataSet.string(key);
  }
}

const readFile = pify(fs.readFile);

/**
 * DicomContentProvider is responsible for generating a virtual document
 * that contains the DICOM tags.
 */
export default class DicomContentProvider
  implements vscode.TextDocumentContentProvider {
  private _dict!: DicomDataElements;

  private _findTagInfo(
    tag: string
  ): (TagInfo & { forceVr?: string }) | undefined {
    const key = tag.substring(1, 9).toUpperCase();
    return this._dict[key];
  }

  private async _prepareEncConverter(charSet: string): Promise<EncConverter> {
    const defaultEncConverter: EncConverter = buf => buf.toString('utf8');
    if (!charSet) {
      // Empty tag means only 7-bit ASCII characters will be used.
      return defaultEncConverter;
    }

    const converter = await createEncConverter(charSet);
    if (converter) {
      // Found a good converter
      return converter;
    }

    vscode.window.showInformationMessage(
      `The character set ${charSet} is not supported. ` +
        `Strings may be broken.`
    );
    return defaultEncConverter;
  }

  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const config = vscode.workspace.getConfiguration('dicom');

    const additionalDict = config.get('dictionary') || {};
    this._dict = Object.assign({}, standardDataElements, additionalDict);

    const showPrivateTags = !!config.get('showPrivateTags');

    if (!(uri instanceof vscode.Uri)) return '';
    const path = uri.fsPath.replace(/\.dcm-dump$/, '');
    let rootDataSet: parser.DataSet;
    try {
      const fileContent = await readFile(path);
      const ba = new Uint8Array(fileContent.buffer);
      rootDataSet = parser.parseDicom(ba);
    } catch (e) {
      await vscode.window.showErrorMessage('Error opening DICOM file.');
      return '';
    }

    // Prepares a character encoding converter based on Specific Character Set.
    const specificCharacterSet = rootDataSet.string('x00080005');
    let encConverter = await this._prepareEncConverter(specificCharacterSet);

    const entries: Entry[] = [];

    const iterate = (dataSet: parser.DataSet, depth: number = 0) => {
      const keys = Object.keys(dataSet.elements).sort();
      for (let key of keys) {
        const element = dataSet.elements[key];

        // A tag is private if the group number is odd
        const isPrivateTag = /[13579bdf]/i.test(element.tag[4]);
        if (isPrivateTag && !showPrivateTags) continue;

        const tagInfo = this._findTagInfo(element.tag);
        const vr: string =
          (tagInfo && tagInfo.forceVr && tagInfo.vr) ||
          element.vr ||
          (tagInfo ? tagInfo.vr : '??');

        const entry: any = {
          depth,
          tag: formatTag(element.tag),
          tagName: tagInfo ? tagInfo.name : '?'
        };

        if (element.items) {
          // This menas the element WAS parsed as a sequence of items (SQ).
          // We check this not by VR but by the `items` field because
          // the parsing has been done without using any dictionary.
          const len = element.items.length;
          entries.push({
            ...entry,
            vr: 'SQ',
            text: `<sequence of ${len} item${len !== 1 ? 's' : ''}>`
          });
          element.items.forEach((item, index) => {
            entries.push({ depth: depth + 1, heading: `#${index}` });
            iterate(item.dataSet, depth + 1);
          });
        } else {
          const rawText: string | undefined = elementToText(
            dataSet,
            key,
            vr,
            rootDataSet,
            encConverter
          );
          const text =
            typeof rawText === 'string'
              ? rawText.length
                ? rawText
                : '<empty string>'
              : '<undefined>';
          entries.push({ ...entry, vr, text });
        }
      }
    };

    iterate(rootDataSet);

    return Promise.resolve(
      entries
        .map(e => {
          const indent = '  '.repeat(e.depth);
          if ('heading' in e) return indent + e.heading;
          return `${indent}${e.tag} ${e.vr} ${e.tagName} = ${e.text}`;
        })
        .join('\n')
    );
  }
}

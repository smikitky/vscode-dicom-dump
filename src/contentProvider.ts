import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pify from 'pify';
import * as parser from 'dicom-parser';
import { standardDataElements } from 'dicom-data-dictionary';
import { DicomDataElements, TagInfo } from 'dicom-data-dictionary';

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

const formatTag = (tag: string) => {
  const group = tag.substring(1, 5).toUpperCase();
  const element = tag.substring(5, 9).toUpperCase();
  return `(${group},${element})`;
};

const numberListToText = (
  dataSet: any,
  key: string,
  accessor: string,
  valueBytes: number
) => {
  const numElements = dataSet.elements[key].length / valueBytes;
  const numbers: number[] = [];
  for (let i = 0; i < numElements; i++) {
    numbers.push(dataSet[accessor](key, i));
  }
  return numbers.join('\\');
};

const elementToText = (dataSet: any, key: string, vr: string) => {
  const element = dataSet.elements[key];

  if (element.fragments) {
    return '<fragments>';
  }

  switch (vr) {
    case 'OB': // Other byte String
    case 'OW': // Other Word String
    case 'OD': // Other Double String
    case 'OF': // Other Float String
      return `<binary data (${vr}) of length: ${element.length}>`;
    case 'SQ':
      return '<sequence of items>'; // Not yet supported
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
    default:
      // string VR
      return dataSet.string(key);
  }
};

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

  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const config = vscode.workspace.getConfiguration('dicom');

    const additionalDict = config.get('dictionary') || {};
    this._dict = Object.assign({}, standardDataElements, additionalDict);

    const showPrivateTags = !!config.get('showPrivateTags');

    if (!(uri instanceof vscode.Uri)) return '';
    const path = uri.fsPath.replace(/\.dcm-dump$/, '');
    let rootDataSet: any;
    try {
      const fileContent = await readFile(path);
      const ba = new Uint8Array(fileContent.buffer);
      rootDataSet = parser.parseDicom(ba);
    } catch (e) {
      await vscode.window.showErrorMessage('Error opening DICOM file.');
      return '';
    }
    const entries: Entry[] = [];

    const iterate = (dataSet: any, depth: number = 0) => {
      for (let key in dataSet.elements) {
        const element = dataSet.elements[key];

        // A tag is private if the group number is odd
        const isPrivateTag = /[13579bdf]/i.test(element.tag[4]);
        if (isPrivateTag && !showPrivateTags) continue;

        const tagInfo = this._findTagInfo(element.tag);
        const vr: string =
          (tagInfo && tagInfo.forceVr && tagInfo.vr) ||
          element.vr ||
          (tagInfo ? tagInfo.vr : undefined);

        const entry: any = {
          depth,
          tag: formatTag(element.tag),
          tagName: tagInfo ? tagInfo.name : '?'
        };

        if (element.items) {
          // This menas the element WAS parsed as a sequence of items (SQ).
          // We check this not by VR but by the `items` field because
          // the parsing has been already finished without using any dictionary.
          const len = element.items.length;
          entries.push({
            ...entry,
            vr: 'SQ',
            text: `<sequence of ${len} item${len !== 1 ? 's' : ''}>`
          });
          element.items.forEach((item: any, index: number) => {
            entries.push({ depth: depth + 1, heading: `#${index}` });
            iterate(item.dataSet, depth + 1);
          });
        } else {
          const rawText: string | undefined = elementToText(dataSet, key, vr);
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

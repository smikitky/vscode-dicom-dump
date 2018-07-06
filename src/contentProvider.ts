import * as vscode from 'vscode';
import { TextDocumentContentProvider } from 'vscode';
import * as fs from 'fs';
import * as pify from 'pify';
import { DicomDataElements, TagInfo } from 'dicom-data-dictionary';

interface Entry {
  tag: string;
  vr: string;
  tagName: string;
  text: string;
}

const formatTag = (tag: string) => {
  const group = tag.substring(1, 5).toUpperCase();
  const element = tag.substring(5, 9).toUpperCase();
  return `[${group},${element}]`;
};

const textRepresentationOfNumberList = (
  dataSet: any,
  key: string,
  accessor: string,
  valueBytes: number
) => {
  const numElements = dataSet.elements[key].length / valueBytes;
  let result = '';
  for (let i = 0; i < numElements; i++) {
    if (i > 0) result += '\\';
    result += dataSet[accessor](key, i);
  }
  return result;
};

const textRepresentationOfElement = (dataSet: any, key: string, vr: string) => {
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
      return textRepresentationOfNumberList(dataSet, key, 'float', 4);
    case 'FD':
      return textRepresentationOfNumberList(dataSet, key, 'double', 8);
    case 'UL':
      return textRepresentationOfNumberList(dataSet, key, 'uint32', 4);
    case 'SL':
      return textRepresentationOfNumberList(dataSet, key, 'int32', 4);
    case 'US':
      return textRepresentationOfNumberList(dataSet, key, 'uint16', 2);
    case 'SS':
      return textRepresentationOfNumberList(dataSet, key, 'int16', 2);
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
export class DicomContentProvider implements TextDocumentContentProvider {
  private _parser: any;
  private _standardDict!: DicomDataElements;
  private _dict!: DicomDataElements;

  private _findTagInfo(
    tag: string
  ): (TagInfo & { forceVr?: string }) | undefined {
    const key = tag.substring(1, 9).toUpperCase();
    return this._dict[key];
  }

  private async _loadModules() {
    // We lazy-load large modules here to minimize the performance impact
    if (this._parser) return;
    this._parser = await import('dicom-parser');
    this._standardDict = (await import('dicom-data-dictionary')).standardDataElements;
  }

  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    await this._loadModules();

    const additionalDict =
      vscode.workspace.getConfiguration('dicom').get('dictionary') || {};
    this._dict = Object.assign({}, this._standardDict, additionalDict);

    if (!(uri instanceof vscode.Uri)) return '';
    const path = uri.fsPath.replace(/\.dcm-dump$/, '');
    let dataSet: any;
    try {
      const fileContent = await readFile(path);
      const ba = new Uint8Array(fileContent.buffer);
      dataSet = this._parser.parseDicom(ba);
    } catch (e) {
      await vscode.window.showErrorMessage('Error opening DICOM file.');
      return '';
    }
    const entries: Entry[] = [];
    for (let key in dataSet.elements) {
      const element = dataSet.elements[key];
      const tagInfo = this._findTagInfo(element.tag);
      const vr: string =
        (tagInfo && tagInfo.forceVr && tagInfo.vr) ||
        element.vr ||
        (tagInfo ? tagInfo.vr : undefined);
      let text: string | undefined = textRepresentationOfElement(
        dataSet,
        key,
        vr
      );
      entries.push({
        tag: formatTag(element.tag),
        vr,
        tagName: tagInfo ? tagInfo.name : '?',
        text:
          typeof text === 'string'
            ? text.length
              ? text
              : '<empty string>'
            : '<undefined>'
      });
    }
    return Promise.resolve(
      entries.map(e => `${e.tag} ${e.vr} ${e.tagName} = ${e.text}`).join('\n')
    );
  }
}

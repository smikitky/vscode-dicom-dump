import * as vscode from 'vscode';
import { TextDocumentContentProvider } from 'vscode';
import * as fs from 'fs';
import * as pify from 'pify';
import * as dicomParser from 'dicom-parser';
import { standardDataElements as dict } from 'dicom-data-dictionary';

interface Entry {
  tag: string;
  vr: string;
  tagName: string;
  text: string;
}

const findTagInfo = (tag: string) => {
  const key = tag.substring(1, 9).toUpperCase();
  return dict[key];
};

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
    return '<Fragments>';
  }

  switch (vr) {
    case 'OB': // Other byte String
    case 'OW': // Other Word String
    case 'OD': // Other Double String
    case 'OF': // Other Float String
      return `<Binary data (${vr}) of length: ${element.length}>`;
    case 'SQ':
      return '<Sequence of items>'; // Not yet supported
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
      const isAscii = /^[\x20-\x7E]*$/.test(str);
      if (isAscii) return str;
      return `<Seemengly binary data (UN) of length: ${element.length}>`;
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
  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    if (!(uri instanceof vscode.Uri)) return '';
    const path = uri.fsPath.replace(/\.dcm-dump$/, '');
    let dataSet: any;
    try {
      const fileContent = await readFile(path);
      const ba = new Uint8Array(fileContent.buffer);
      dataSet = dicomParser.parseDicom(ba);
    } catch (e) {
      await vscode.window.showErrorMessage('Error opening DICOM file.');
      return '';
    }
    const entries: Entry[] = [];
    for (let key in dataSet.elements) {
      const element = dataSet.elements[key];
      const tagInfo = findTagInfo(element.tag);
      const vr: string = element.vr || (tagInfo ? tagInfo.vr : undefined);
      let text: string | undefined = textRepresentationOfElement(
        dataSet,
        key,
        vr
      );
      entries.push({
        tag: formatTag(element.tag),
        vr,
        tagName: tagInfo ? tagInfo.name : '?',
        text: typeof text === 'string' ? text : '<undefined>'
      });
    }
    return Promise.resolve(
      entries.map(e => `${e.tag} ${e.vr} ${e.tagName} = ${e.text}`).join('\n')
    );
  }
}

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

const textRepresentationOfNumberLists = (
  dataSet: any,
  key: string,
  accessor: string,
  valueBytes: number
) => {
  const numElements = dataSet.elements[key].length / valueBytes;
  let result = '';
  for (let i = 0; i <= numElements; i++) {
    if (i > 0) result += '\\';
    result += dataSet[accessor](key, i + 1);
  }
  return result;
};

const textRepresentationOfElement = (dataSet: any, key: string, vr: string) => {
  const element = dataSet.elements[key];
  if (element.items) {
    // not supported!
    return '[Sequence]';
  }
  if (element.fragments) {
    // not supported!
    return '[Fragments]';
  }

  switch (vr) {
    case 'OB': // Other byte String
    case 'OW': // Other Word String
    case 'OD': // Other Double String
    case 'OF': // Other Float String
      return `<Binary data (${vr}) of length: ${element.length}>`;
    case 'SQ':
      return '<Sequence of items>';
    case 'AT': {
      // Attribute Tag
      const group = dataSet.uint16(key, 0);
      const groupHexStr = ('0000' + group.toString(16)).substr(-4);
      const element = dataSet.uint16(key, 1);
      const elementHexStr = ('0000' + element.toString(16)).substr(-4);
      return '0x' + groupHexStr + elementHexStr;
    }
    case 'FL':
      return textRepresentationOfNumberLists(dataSet, key, 'float', 4);
    case 'FD':
      return textRepresentationOfNumberLists(dataSet, key, 'double', 8);
    case 'UL':
      return textRepresentationOfNumberLists(dataSet, key, 'uint32', 4);
    case 'SL':
      return textRepresentationOfNumberLists(dataSet, key, 'int32', 4);
    case 'US':
      return textRepresentationOfNumberLists(dataSet, key, 'uint16', 2);
    case 'SS':
      return textRepresentationOfNumberLists(dataSet, key, 'int16', 2);
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
      let text = textRepresentationOfElement(dataSet, key, vr);
      entries.push({
        tag: formatTag(element.tag),
        vr,
        tagName: tagInfo ? tagInfo.name : '?',
        text
      });
    }
    return Promise.resolve(
      entries.map(e => `${e.tag} ${e.vr} ${e.tagName} = ${e.text}`).join('\n')
    );
  }
}

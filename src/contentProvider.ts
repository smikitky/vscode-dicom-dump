import * as vscode from 'vscode';
import * as fs from 'fs';
import * as dicomParser from 'dicom-parser';
import { standardDataElements as dict } from 'dicom-data-dictionary';

interface Entry {
  tag: string;
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

const textRepresentationOfElement = (dataSet: any, key: string) => {
  const element = dataSet.elements[key];
  const tagInfo = findTagInfo(element.tag);
  if (element.items) {
    // not supported!
    return '[Sequence]';
  }
  if (element.fragments) {
    // not supported!
    return '[Fragments]';
  }
  const vr: string | undefined =
    element.vr || (tagInfo ? tagInfo.vr : undefined);

  switch (vr) {
    case 'OB':
    case 'OW':
    case 'OF':
      return `[Binary data of length: ${element.length}]`;
    case 'SI':
      return 'What is this?';
    case 'SQ':
      return 'What is this?';
    case 'AT': {
      const group = dataSet.uint16(key, 0);
      const groupHexStr = ('0000' + group.toString(16)).substr(-4);
      const element = dataSet.uint16(key, 1);
      const elementHexStr = ('0000' + element.toString(16)).substr(-4);
      return 'x' + groupHexStr + elementHexStr;
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

/**
 * DicomContentProvider is responsible for generating a virtual document
 * that contains the DICOM tags.
 */
export class DicomContentProvider
  implements vscode.TextDocumentContentProvider {
  public async provideTextDocumentContent(url: vscode.Uri): Promise<string> {
    const path = url.fsPath;
    if (!fs.existsSync(path)) {
      await vscode.window.showErrorMessage(`No such file: ${path}.`);
    }
    const ba = new Uint8Array(fs.readFileSync(path).buffer);
    const dataSet = dicomParser.parseDicom(ba);
    const entries: Entry[] = [];

    for (let key in dataSet.elements) {
      const element = dataSet.elements[key];
      const tagInfo = findTagInfo(element.tag);
      let text = textRepresentationOfElement(dataSet, key);
      entries.push({
        tag: formatTag(element.tag),
        tagName: tagInfo ? tagInfo.name : '?',
        text
      });
    }
    return Promise.resolve(
      entries.map(e => `${e.tag} ${e.tagName} = ${e.text}`).join('\n')
    );
  }
}

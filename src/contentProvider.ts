import * as vscode from 'vscode';
import * as fs from 'fs';
import * as pify from 'pify'; // Promisify
import * as parser from 'dicom-parser';
import { standardDataElements, DicomDataElements } from 'dicom-data-dictionary';
import { EncConverter, createEncConverter } from './encConverter';
import { buildTreeFromDataSet, ParsedElement } from './extractor';

const readFile = pify(fs.readFile);

/**
 * Transforms the parsed elements into indented text.
 * @param elements
 * @param depth
 */
function parsedElementsToString(
  elements: ParsedElement[],
  depth: number = 0
): string {
  const lines = elements.map(e => {
    const indent = '  '.repeat(depth);
    const print = e.desc ? `<${e.desc}>` : e.text;
    const main = `${indent}${e.tag} ${e.vr} ${e.name} = ${print}`;
    if (e.sequenceItems) {
      return (
        main +
        '\n' +
        e.sequenceItems.map((sub, index) => {
          return (
            `${indent}  #${index}\n` + parsedElementsToString(sub, depth + 1)
          );
        })
      );
    } else {
      return main;
    }
  });
  return lines.join('\n');
}

/**
 * DicomContentProvider is responsible for generating a virtual document
 * that contains the DICOM tags.
 */
export default class DicomContentProvider
  implements vscode.TextDocumentContentProvider {
  private async _prepareEncConverter(
    charSet: string | undefined
  ): Promise<EncConverter> {
    const defaultEncConverter: EncConverter = buf => buf.toString('latin1');
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
    const additionalDict: DicomDataElements = config.get('dictionary') || {};
    const dictionary = Object.assign({}, standardDataElements, additionalDict);
    const showPrivateTags = !!config.get('showPrivateTags');

    if (!(uri instanceof vscode.Uri)) return '';
    const dumpMode = /\.dcmdump$/.test(uri.fsPath) ? 'dcmdump' : 'json';

    const path = uri.fsPath.replace(/\.(dcmdump|json)$/, '');
    let rootDataSet: parser.DataSet;
    try {
      const fileContent = await readFile(path);
      const byteArray = new Uint8Array(fileContent.buffer);
      rootDataSet = parser.parseDicom(byteArray);
    } catch (e) {
      vscode.window.showErrorMessage(
        'Error opening DICOM file. ' + (typeof e === 'string' ? e : e.message)
      );
      return '';
    }

    // Prepares a character encoding converter based on Specific Character Set.
    const specificCharacterSet = rootDataSet.string('x00080005');
    const encConverter = await this._prepareEncConverter(specificCharacterSet);

    const parsedElements = buildTreeFromDataSet(rootDataSet, {
      rootDataSet,
      showPrivateTags,
      dictionary,
      encConverter
    });

    return dumpMode === 'dcmdump'
      ? parsedElementsToString(parsedElements, 0)
      : JSON.stringify(parsedElements, null, '  ');
  }
}

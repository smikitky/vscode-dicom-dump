import * as vscode from 'vscode';
import * as qs from 'qs';
import * as parser from 'dicom-parser';
import { standardDataElements, DicomDataElements } from 'dicom-data-dictionary';
import { EncConverter, createEncConverter } from './encConverter';
import { buildTreeFromDataSet, ParsedElement } from './extractor';
import { PrivateTagDict } from "./privateTagDict";

/**
 * Transforms the parsed elements into indented text.
 * @param elements
 * @param depth
 */
function parsedElementsToString(elements: ParsedElement[], depth = 0): string {
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
    const privateDictionary: PrivateTagDict = config.get('privateDictionary') || {};
    const showPrivateTags = !!config.get('showPrivateTags');

    if (!(uri instanceof vscode.Uri)) return '';
    const query = qs.parse(uri.query);
    const scheme = query.scheme as string;
    const dumpMode = query.mode as string;

    let rootDataSet: parser.DataSet;
    const path = uri.fsPath.replace(/\.(dcmdump|json)$/, '');
    const fileUri = uri.with({ scheme, path });
    try {
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      // Clone as a 'pure' Uint8Array to avoid encoding issues
      const arr = new Uint8Array(fileContent);
      rootDataSet = parser.parseDicom(arr);
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
      privateDictionary,
      encConverter
    });

    return dumpMode === 'dcmdump'
      ? parsedElementsToString(parsedElements, 0)
      : JSON.stringify(parsedElements, null, '  ');
  }
}

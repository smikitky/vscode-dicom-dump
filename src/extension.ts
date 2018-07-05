'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as dicomParser from 'dicom-parser';
import dict from './dictionary';

const scheme = 'dicom-dump';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  const provider = new DicomContentProvider();
  const registrations = vscode.Disposable.from(
    vscode.workspace.registerTextDocumentContentProvider(scheme, provider)
  );

  const commandRegistration = vscode.commands.registerCommand(
    'dicom.showTags',
    async (uri: vscode.Uri) => {
      const newUri = uri.with({ scheme });
      const doc = await vscode.workspace.openTextDocument(newUri);
      return vscode.window.showTextDocument(doc);
    }
  );

  context.subscriptions.push(registrations, commandRegistration);
}

// this method is called when your extension is deactivated
export function deactivate() {}

interface Entry {
  tag: string;
  tagName: string;
  text: string;
}

const isStringVr = (vr: string) => {
  if (
    vr === 'AT' ||
    vr === 'FL' ||
    vr === 'FD' ||
    vr === 'OB' ||
    vr === 'OF' ||
    vr === 'OW' ||
    vr === 'SI' ||
    vr === 'SQ' ||
    vr === 'SS' ||
    vr === 'UL' ||
    vr === 'US'
  ) {
    return false;
  }
  return true;
};

const formatTag = (tag: string) => {
  const group = tag.substring(1, 5);
  const element = tag.substring(5, 9);
  return ('(' + group + ',' + element + ')').toUpperCase();
};

/**
 * DicomContentProvider is responsible for generating a virtual document
 * that contains the DICOM tags.
 */
class DicomContentProvider implements vscode.TextDocumentContentProvider {
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
      const tagStr = formatTag(element.tag);
      const tagInfo = dict[tagStr];
      let text: string = '';
      if (element.items) text = '[Sequence]';
      else if (element.fragments) text = '[Fragments]';
      else {
        const vr: string | undefined =
          element.vr || (tagInfo ? tagInfo.vr : undefined);
        if (vr && isStringVr(vr)) {
          text = dataSet.string(key);
        }
      }

      entries.push({
        tag: tagStr,
        tagName: tagInfo ? tagInfo.name : '?',
        text
      });
    }
    return Promise.resolve(
      entries.map(e => `${e.tag} ${e.tagName} = ${e.text}`).join('\n')
    );
  }
}

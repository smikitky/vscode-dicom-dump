'use strict';
import * as vscode from 'vscode';

const schema = 'dicomtags';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  const provider = new DicomContentProvider();
  const registrations = vscode.Disposable.from(
    vscode.workspace.registerTextDocumentContentProvider(schema, provider)
  );

  const commandRegistration = vscode.commands.registerTextEditorCommand(
    'dicom.showTags',
    async editor => {
      const uri = encodeLocation(editor.document.uri);
      const doc = await vscode.workspace.openTextDocument(uri);
      return vscode.window.showTextDocument(doc, (editor.viewColumn || 0) + 1);
    }
  );

  context.subscriptions.push(registrations, commandRegistration);
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * DicomContentProvider is responsible for generating a virtual document
 * that contains the DICOM tags.
 */
class DicomContentProvider implements vscode.TextDocumentContentProvider {
  public provideTextDocumentContent(url: vscode.Uri): Promise<string> {
    return Promise.resolve(url.toString());
  }
}

let seq = 0;

export function encodeLocation(uri: vscode.Uri): vscode.Uri {
  const query = JSON.stringify([uri.toString()]);
  return vscode.Uri.parse(`${schema}:dicom-tag-dump?${query}#${seq++}`);
}

export function decodeLocation(uri: vscode.Uri): [vscode.Uri] {
  let [target] = <[string]>JSON.parse(uri.query);
  return [vscode.Uri.parse(target)];
}

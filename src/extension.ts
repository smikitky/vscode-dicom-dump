'use strict';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('"vscode-dicom" is now active!');

  const provider = new DicomContentProvider();
  const registrations = vscode.Disposable.from(
    vscode.workspace.registerTextDocumentContentProvider('dicomtags', provider)
  );

  context.subscriptions.push(registrations);
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * DicomContentProvider is responsible for generating a virtual document
 * that contains the DICOM tags.
 */
class DicomContentProvider implements vscode.TextDocumentContentProvider {
  public provideTextDocumentContent(url: vscode.Uri): Promise<string> {
    return Promise.resolve('foobar');
  }
}

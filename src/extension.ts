'use strict';
import * as vscode from 'vscode';
import { DicomContentProvider } from './contentProvider';

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

'use strict';
import * as vscode from 'vscode';
import { DicomContentProvider } from './contentProvider';
import DicomHoverProvider from './hoverProvider';

const scheme = 'dicom-dump';

export function activate(context: vscode.ExtensionContext) {
  const provider = new DicomContentProvider();
  const r1 = vscode.workspace.registerTextDocumentContentProvider(
    scheme,
    provider
  );

  const r2 = vscode.commands.registerCommand(
    'dicom.showTags',
    async (uri: vscode.Uri) => {
      if (!(uri instanceof vscode.Uri)) return;
      const newUri = uri.with({ scheme, path: uri.path + '.dcm-dump' });
      const doc = await vscode.workspace.openTextDocument(newUri);
      return vscode.window.showTextDocument(doc);
    }
  );

  const r3 = vscode.languages.registerHoverProvider(
    { language: 'dicom-dump' },
    new DicomHoverProvider()
  );

  context.subscriptions.push(r1, r2, r3);
}

// export function deactivate() {}

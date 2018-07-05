'use strict';
import * as vscode from 'vscode';
import { DicomContentProvider } from './contentProvider';

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

  context.subscriptions.push(r1, r2);
}

// export function deactivate() {}

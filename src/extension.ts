'use strict';
import * as vscode from 'vscode';
import DicomHoverProvider from './hoverProvider';

const scheme = 'dicom-dump';

export function activate(context: vscode.ExtensionContext) {
  const r1 = vscode.workspace.registerTextDocumentContentProvider(
    scheme,
    new ContentProviderWrapper()
  );

  const r2 = vscode.commands.registerCommand(
    'dicom.showTags',
    async (uri: vscode.Uri) => {
      if (!(uri instanceof vscode.Uri)) return;
      const newUri = uri.with({ scheme, path: uri.path + '.dcmdump' });
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

/**
 * Wraps the actual DicomContentProvider in order to load
 * the actual big module as late as possible.
 */
class ContentProviderWrapper implements vscode.TextDocumentContentProvider {
  private _provider!: vscode.TextDocumentContentProvider;

  public async provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): Promise<string> {
    if (!this._provider) {
      const DicomContentProvider = (await import('./contentProvider')).default;
      this._provider = new DicomContentProvider();
    }
    return (await this._provider.provideTextDocumentContent(
      uri,
      token
    )) as string;
  }
}

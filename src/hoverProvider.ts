import * as vscode from 'vscode';

export default class DicomHoverProvider implements vscode.HoverProvider {
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    // The dictionary will be loaded lazily to minimize the performance impact
    const vrDict = (await import('./vrDict')).default;

    // Since we cannot directly get the scope from here,
    // we need to reanalyze the line.
    const line = document.lineAt(position.line).text;
    const match = line.match(/\s*(\([0-9A-F]{4}\,[0-9A-F]{4}\)) ([A-Z]{2})/);
    if (!match) return;
    const vrPos = match[0].length - 2;
    const vr = match[2];

    // Make sure the cursor is hovering on the VR part
    if (position.character < vrPos || vrPos + 1 < position.character) {
      return null;
    }

    const hover = vrDict[vr] || 'Unknown VR';
    return new vscode.Hover(hover);
  }
}
import * as vscode from 'vscode';

function extractToken(
  str: string,
  position: number
): { str: string; start: number } {
  const after = str.indexOf('\\', position);
  const before = str.lastIndexOf('\\', position);
  return {
    str: str.substring(
      before >= 0 ? before + 1 : 0,
      after >= 0 ? after : undefined
    ),
    start: before >= 0 ? before + 1 : 0
  };
}

export default class DicomHoverProvider implements vscode.HoverProvider {
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    // The dictionary will be loaded lazily to minimize the performance impact
    const vrDict = (await import('./vrDict')).default;
    const valueDict = (await import('./valueDict')).default;

    // Since we cannot directly get the scope from here,
    // we need to reanalyze the line.
    const line = document.lineAt(position.line).text;
    const match = line.match(
      /\s*(\([0-9A-F]{4}\,[0-9A-F]{4}\)) ([A-Z]{2}(\|[A-Z])*)/
    );
    if (!match) return;
    const tag = match[1].replace(/\(|\)/g, '');
    const vrPos = match[0].length - match[2].length;

    if (
      position.character >= vrPos &&
      position.character <= vrPos + match[2].length
    ) {
      // The cursor is hovering on the VR part
      const vr = document.getText(document.getWordRangeAtPosition(position));
      const hover = vrDict[vr] || 'Unknown VR';
      return new vscode.Hover(hover);
    }

    const valuePos = line.indexOf(' = ') + 3;
    if (valuePos > 2 && position.character >= valuePos) {
      const tagValue = line.substring(valuePos);
      const posInTagValue = position.character - valuePos;
      const token = extractToken(tagValue, posInTagValue);

      if (tag in valueDict && token.str in valueDict[tag]) {
        const description = valueDict[tag][token.str];
        return new vscode.Hover(
          description,
          new vscode.Range(
            new vscode.Position(position.line, valuePos + token.start),
            new vscode.Position(
              position.line,
              valuePos + token.start + token.str.length
            )
          )
        );
      }
    }

    return null;
  }
}

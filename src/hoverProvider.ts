import * as vscode from 'vscode';

function extractKeyword(
  str: string,
  position: number,
  separator: string = '\\'
): { str: string; start: number } {
  const after = str.indexOf(separator, position);
  const before = str.lastIndexOf(separator, position);
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

    // Hover for VR
    if (
      position.character >= vrPos &&
      position.character <= vrPos + match[2].length
    ) {
      // The cursor is hovering on the VR part
      const vr = document.getText(document.getWordRangeAtPosition(position));
      const hover = vrDict[vr] || 'Unknown VR';
      return new vscode.Hover(hover);
    }

    // Hover for tag values after '='
    const valuePos = line.indexOf(' = ') + 3;
    if (valuePos > 2 && position.character >= valuePos) {
      // The cursor is hovering on the value part
      const tagValue = line.substring(valuePos);
      const posInTagValue = position.character - valuePos;
      const word = extractKeyword(tagValue, posInTagValue);

      if (tag in valueDict && word.str in valueDict[tag]) {
        const description = valueDict[tag][word.str];
        return new vscode.Hover(
          description,
          new vscode.Range(
            new vscode.Position(position.line, valuePos + word.start),
            new vscode.Position(
              position.line,
              valuePos + word.start + word.str.length
            )
          )
        );
      }
    }
  }
}

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

function replaceKeywords(
  str: string,
  keywords: { [key: string]: string }
): string {
  const regex = new RegExp('{(' + Object.keys(keywords).join('|') + ')}', 'g');
  return str.replace(regex, (m, p1) => keywords[p1]);
}

interface SearchConfig {
  title: string;
  url: string;
}

export default class DicomHoverProvider implements vscode.HoverProvider {
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const makeHover = (pos: number, length: number, content: string) =>
      new vscode.Hover(
        content,
        new vscode.Range(
          new vscode.Position(position.line, pos),
          new vscode.Position(position.line, pos + length)
        )
      );

    // The dictionary will be loaded lazily to minimize the performance impact
    const vrDict = (await import('./vrDict')).default;
    const valueDict = (await import('./valueDict')).default;

    // Since we cannot directly get the scope from here,
    // we need to reanalyze the line.
    const line = document.lineAt(position.line).text;
    const match = line.match(
      /(\s*)(\([0-9A-F]{4}\,[0-9A-F]{4}\)) ([A-Z]{2}(\|[A-Z])*)/
    );
    if (!match) return;
    const tag = match[2].replace(/\(|\)/g, '');

    // Hover for Tag (gggg,eeee)
    const tagPos = match[1].length;
    if (
      position.character >= tagPos &&
      position.character <= tagPos + match[2].length
    ) {
      const searches = vscode.workspace
        .getConfiguration('dicom')
        .get<SearchConfig[]>('searches');
      if (!Array.isArray(searches) || !searches.length) return;
      const [EEEE, GGGG] = tag.split(',');
      const keywords = {
        EEEE,
        GGGG,
        eeee: EEEE.toLowerCase(),
        gggg: GGGG.toLowerCase()
      };

      const links = searches.map(search => ({
        title: replaceKeywords(search.title, keywords),
        url: replaceKeywords(search.url, keywords)
      }));

      return makeHover(
        tagPos,
        11,
        links
          .map(link => `[${link.title}](${encodeURI(link.url)})`)
          .join('  \n')
      );
    }

    // Hover for VR
    const vrPos = match[0].length - match[3].length;
    if (
      position.character >= vrPos &&
      position.character <= vrPos + match[3].length
    ) {
      // The cursor is hovering on the VR part
      const posInVr = position.character - vrPos;
      const vr = extractKeyword(match[3], posInVr, '|');
      const hover = vrDict[vr.str] || 'Unknown VR';
      return makeHover(vrPos + vr.start, vr.str.length, hover);
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
        return makeHover(valuePos + word.start, word.str.length, description);
      }
    }
  }
}

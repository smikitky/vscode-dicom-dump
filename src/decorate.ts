import * as vscode from 'vscode';

/**
 * The annotation type used to show our decorations.
 */
const annotationDecoration = vscode.window.createTextEditorDecorationType({
  after: {
    margin: '0 0 0 2em',
    color: new vscode.ThemeColor('editorCodeLens.foreground'),
    fontStyle: 'italic'
  }
});

/**
 * Adds decorations to some DICOM keywords/codes.
 * @param editor The editor to add the decorations.
 */
const decorate = async (editor: vscode.TextEditor): Promise<void> => {
  // The dictionary will be loaded lazily to minimize the performance impact
  const valueDict = (await import('./valueDict')).default;

  const decorations: vscode.DecorationOptions[] = [];
  const lineCount = editor.document.lineCount;

  for (let i = 0; i < lineCount; i++) {
    const line = editor.document.lineAt(i);
    const match = line.text.match(/(\s*)\(([0-9A-F]{4},[0-9A-F]{4})\)/);
    if (!match) continue;
    const tag = match[2];
    if (!(tag in valueDict)) continue;
    const contentText = line.text
      .substr(line.text.indexOf(' = ') + 3)
      .split('\\')
      .map(item => valueDict[tag][item] ?? '')
      .join('\\');
    if (contentText.length > 100) continue;
    decorations.push({
      range: line.range,
      renderOptions: { after: { contentText } }
    });
  }

  editor.setDecorations(annotationDecoration, decorations);
};

export default decorate;

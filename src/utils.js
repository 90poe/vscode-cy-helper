const vscode = require('vscode');
const { workspace, window } = vscode;

const openDocumentAtPosition = (path, position) => {
  workspace.openTextDocument(path).then(doc => {
    window.showTextDocument(doc, { preview: false }).then(doc => {
      let { line, column } = position;
      let p = new vscode.Position(line - 1, column);
      let s = new vscode.Selection(p, p);
      doc.selection = s;
      doc.revealRange(s, 1);
    });
  });
};

module.exports = {
  openDocumentAtPosition
};

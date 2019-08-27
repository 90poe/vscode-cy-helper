const vscode = require('vscode');
const { window, workspace } = vscode;
const { cypressCommandLocation } = require('./astParser');

let { customCommandsFolder } = workspace.getConfiguration().cypressHelper;

exports.openCustomCommand = () => {
  let editor = window.activeTextEditor;
  let root = editor.document.fileName.split('/cypress/').shift();
  let commandName;
  if (editor.selection.start.line === editor.selection.end.line) {
    let editor = window.activeTextEditor;
    let line = editor.document.lineAt(editor.selection.active.line).text;
    let commandNamePattern = /\.(.*)\(/g;
    commandName = commandNamePattern.exec(line).pop();
  } else {
    commandName = editor.revealRangedocument.getText(editor.selection);
  }
  let location = cypressCommandLocation(
    `${root}/${customCommandsFolder}`,
    commandName
  );
  !location && window.showErrorMessage('Command not found');
  let openPath = vscode.Uri.file(location.file);
  workspace.openTextDocument(openPath).then(doc => {
    window.showTextDocument(doc).then(doc => {
      let { line, column } = location.loc;
      let p = new vscode.Position(line - 1, column);
      let s = new vscode.Selection(p, p);
      doc.selection = s;
      doc.revealRange(s, 1);
    });
  });
};

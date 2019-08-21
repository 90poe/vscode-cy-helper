const vscode = require('vscode');
const parser = require('./findCommand');

const activate = context => {
  const packageManager = vscode.workspace
    .getConfiguration()
    .get('cypressHelper.packageManager');
  const commandForOpen = vscode.workspace
    .getConfiguration()
    .get('cypressHelper.commandForOpen');
  const customCommandsFolder = vscode.workspace
    .getConfiguration()
    .get('cypressHelper.customCommandsFolder');
  const cucumberUsed =
    vscode.window.activeTextEditor.document.languageId === 'feature';

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openSpecFile', () => {
      const terminal = vscode.window.createTerminal('CypressRun');
      const currentlyOpenTabfilePath =
        vscode.window.activeTextEditor.document.fileName;
      terminal.show();
      terminal.sendText(
        `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openSingleSpec', () => {
      const terminal = vscode.window.createTerminal('CypressRun');
      const editor = vscode.window.activeTextEditor;
      const currentlyOpenTabfilePath = editor.document.fileName;
      const line = editor.document.lineAt(editor.selection.active.line);
      const fullText = editor.document.getText();
      let scenarioIndexes = fullText
        .split('\n')
        .map((line, row) => {
          if (
            line.trim().startsWith('Scenario') ||
            line.trim().startsWith('it(')
          ) {
            return row;
          }
        })
        .filter(e => Boolean(e));
      let selectedScenarioIndex = scenarioIndexes.find(
        (scenarioIndex, position) => {
          return (
            line.lineNumber >= scenarioIndex &&
            line.lineNumber <= scenarioIndexes[position + 1]
          );
        }
      );
      if (cucumberUsed) {
        const previousLineText = editor.document.lineAt(
          selectedScenarioIndex - 1
        ).text;
        if (!previousLineText.includes('@focus')) {
          editor
            .edit(editBuilder => {
              editBuilder.replace(
                new vscode.Position(selectedScenarioIndex - 1, 0),
                '@focus'
              );
            })
            .then(() => {
              editor.document.save();
            });
        }
      } else {
        const itLine = editor.document.lineAt(selectedScenarioIndex);
        const itText = editor.document.getText(itLine.range);
        const indexOfIt = editor.document.getText(itText.range).indexOf('it(');
        editor
          .edit(editBuilder => {
            editBuilder.replace(
              new vscode.Position(selectedScenarioIndex, indexOfIt + 2),
              '.only'
            );
          })
          .then(() => {
            editor.document.save();
          });
      }

      terminal.show();
      terminal.sendText(
        `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openCustomCommand', () => {
      const editor = vscode.window.activeTextEditor;
      let commandName;
      if (editor.selection.start.line === editor.selection.end.line) {
        let line = editor.document.lineAt(editor.selection.active.line).text;
        let commandNamePattern = /\.(.*)\(/g;
        commandName = commandNamePattern.exec(line).pop();
      } else {
        commandName = editor.document.getText(editor.selection);
      }
      let currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName
        .split('/cypress/')
        .shift();
      let location = parser(
        `${currentlyOpenTabfilePath}/${customCommandsFolder}`,
        commandName
      );
      let openPath = vscode.Uri.file(location.file);
      vscode.workspace.openTextDocument(openPath).then(doc => {
        vscode.window.showTextDocument(doc).then(doc => {
          let { line, column } = location.loc;
          var p = new vscode.Position(line - 1, column);
          var s = new vscode.Selection(p, p);
          doc.selection = s;
          doc.revealRange(s, 1);
        });
      });
    })
  );
};
exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate
};

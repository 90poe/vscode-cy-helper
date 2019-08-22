const vscode = require('vscode');
const parser = require('./findCommand');

const activate = context => {
  let packageManager = vscode.workspace
    .getConfiguration()
    .get('cypressHelper.packageManager');
  let commandForOpen = vscode.workspace
    .getConfiguration()
    .get('cypressHelper.commandForOpen');
  let customCommandsFolder = vscode.workspace
    .getConfiguration()
    .get('cypressHelper.customCommandsFolder');

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openSpecFile', () => {
      let terminal = vscode.window.createTerminal('CypressRun');
      let currentlyOpenTabfilePath =
        vscode.window.activeTextEditor.document.fileName;
      terminal.show();
      terminal.sendText(
        `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openSingleSpec', () => {
      let cucumberUsed =
        vscode.window.activeTextEditor.document.languageId === 'feature';
      let terminal = vscode.window.createTerminal('CypressRun');
      let editor = vscode.window.activeTextEditor;
      let currentlyOpenTabfilePath = editor.document.fileName;
      let line = editor.document.lineAt(editor.selection.active.line);
      let fullText = editor.document.getText();
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
        let previousLineText = editor.document.lineAt(selectedScenarioIndex - 1)
          .text;
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
        let itLine = editor.document.lineAt(selectedScenarioIndex);
        let itText = editor.document.getText(itLine.range);
        let indexOfIt = editor.document.getText(itText.range).indexOf('it(');
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
      let editor = vscode.window.activeTextEditor;
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
          let p = new vscode.Position(line - 1, column);
          let s = new vscode.Selection(p, p);
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

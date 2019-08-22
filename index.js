const vscode = require('vscode');
const {
  getCypressCommandImplementation,
  generateTypeDefinitions
} = require('./astParser');

const activate = context => {
  let {
    packageManager,
    commandForOpen,
    customCommandsFolder,
    typeDefinitionFile,
    typeDefinitionExcludePatterns
  } = vscode.workspace.getConfiguration().cypressHelper;

  const openSpecFile = () => {
    let editor = vscode.window.activeTextEditor;
    let currentlyOpenTabfilePath = editor.document.fileName;
    let terminal =
      vscode.window.terminals.find(t => t._name === 'CypressRun') ||
      vscode.window.createTerminal('CypressRun');
    terminal.show();
    terminal.sendText(
      `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
    );
  };

  const openSingleSpec = () => {
    let editor = vscode.window.activeTextEditor;
    let cucumberUsed = editor.document.languageId === 'feature';
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
        let nextLine = scenarioIndexes[position + 1] || line.lineNumber + 1;
        return (
          line.lineNumber + 1 >= scenarioIndex &&
          line.lineNumber + 1 <= nextLine
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
    openSpecFile();
  };

  const openCustomCommand = () => {
    let editor = vscode.window.activeTextEditor;
    let root = editor.document.fileName.split('/cypress/').shift();
    let commandName;
    if (editor.selection.start.line === editor.selection.end.line) {
      let editor = vscode.window.activeTextEditor;
      let line = editor.document.lineAt(editor.selection.active.line).text;
      let commandNamePattern = /\.(.*)\(/g;
      commandName = commandNamePattern.exec(line).pop();
    } else {
      commandName = editor.revealRangedocument.getText(editor.selection);
    }
    let location = getCypressCommandImplementation(
      `${root}/${customCommandsFolder}`,
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
  };

  const generateCustomCommandTypes = () => {
    let editor = vscode.window.activeTextEditor;
    let root = editor.document.fileName.split('/cypress/').shift();
    generateTypeDefinitions(
      `${root}/${customCommandsFolder}`,
      typeDefinitionExcludePatterns,
      `${root}/${typeDefinitionFile}`
    );
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openSpecFile', openSpecFile),
    vscode.commands.registerCommand('extension.openSingleSpec', openSingleSpec),
    vscode.commands.registerCommand(
      'extension.openCustomCommand',
      openCustomCommand
    ),
    vscode.commands.registerCommand(
      'extension.generateCustomCommandTypes',
      generateCustomCommandTypes
    )
  );
};
exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate
};

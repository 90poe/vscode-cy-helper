const vscode = require('vscode');
const { workspace, window } = vscode;
const {
  cypressCommandLocation,
  generateTypeDefinitions
} = require('./astParser');

const TERMINAL_NAME = 'CypressRun';
const FOCUS_TAG = '@focus';
const TEST_BLOCK = 'it(';
const TEST_ONLY_BLOCK = '.only';

/**
 * TERMINAL:
 */
let _activeTerminal = null;
window.onDidCloseTerminal(terminal => {
  if (terminal.name === TERMINAL_NAME) {
    if (!terminal.disposed) {
      disposeTerminal();
    }
    let editor = window.activeTextEditor;
    let fullText = editor.document.getText().split('\n');
    editor
      .edit(editBuilder => {
        fullText
          .filter(
            row =>
              row.trim().startsWith(FOCUS_TAG) ||
              row.trim().includes(TEST_ONLY_BLOCK)
          )
          .map(row => fullText.indexOf(row))
          .map(index => {
            let { text, range } = editor.document.lineAt(index);
            let newText = text
              .replace(FOCUS_TAG, '')
              .replace(TEST_ONLY_BLOCK, '');
            editBuilder.replace(range, newText);
          });
      })
      .then(() => {
        editor.document.save();
      });
  }
});
const createTerminal = () => {
  _activeTerminal = window.createTerminal(TERMINAL_NAME);
  return _activeTerminal;
};
const disposeTerminal = () => {
  _activeTerminal.disposed = true;
  _activeTerminal.dispose();
  _activeTerminal = null;
};
const getTerminal = () => {
  if (_activeTerminal) {
    _activeTerminal.reused = true;
  } else {
    createTerminal();
  }
  return _activeTerminal;
};
// END TERMINAL

const activate = context => {
  let {
    packageManager,
    commandForOpen,
    customCommandsFolder,
    typeDefinitionFile,
    typeDefinitionExcludePatterns
  } = workspace.getConfiguration().cypressHelper;

  const openSpecFile = () => {
    let currentlyOpenTabfilePath = window.activeTextEditor.document.fileName;
    let terminal = getTerminal();
    terminal.show();
    terminal.sendText(
      `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
    );
  };

  const openSingleSpec = () => {
    let editor = window.activeTextEditor;
    let cucumberPreprocessorUsed = editor.document.languageId === 'feature';
    let line = editor.document.lineAt(editor.selection.active.line);
    let lineNumber = line.lineNumber + 1;
    let fullText = editor.document.getText().split('\n');
    let scenarioIndexes = fullText
      .filter(
        row =>
          row.trim().startsWith('Scenario') || row.trim().startsWith(TEST_BLOCK)
      )
      .map(row => fullText.indexOf(row));
    let selectedScenarioIndex =
      scenarioIndexes.find((scenarioIndex, position) => {
        let nextLine = scenarioIndexes[position + 1] || lineNumber;
        return lineNumber >= scenarioIndex && lineNumber <= nextLine;
      }) - 1;
    !selectedScenarioIndex && window.showErrorMessage('Test not found');
    if (cucumberPreprocessorUsed) {
      let { text: previousLineText } = editor.document.lineAt(
        selectedScenarioIndex
      );
      if (!previousLineText.includes(FOCUS_TAG)) {
        editor
          .edit(editBuilder => {
            editBuilder.replace(
              new vscode.Position(selectedScenarioIndex, 0),
              FOCUS_TAG
            );
          })
          .then(() => {
            editor.document.save();
          });
      }
    } else {
      let { range: lineRange } = editor.document.lineAt(selectedScenarioIndex);
      let { range: testRange } = editor.document.getText(lineRange);
      let indexOfTest = editor.document.getText(testRange).indexOf(TEST_BLOCK);
      !indexOfTest && window.showErrorMessage('Test not found');
      editor
        .edit(editBuilder => {
          editBuilder.replace(
            new vscode.Position(selectedScenarioIndex, indexOfTest + 2),
            TEST_ONLY_BLOCK
          );
        })
        .then(() => {
          editor.document.save();
        });
    }
    openSpecFile();
  };

  const openCustomCommand = () => {
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

  const generateCustomCommandTypes = () => {
    let editor = window.activeTextEditor;
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

const deactivate = () => {};

module.exports = {
  activate,
  deactivate
};

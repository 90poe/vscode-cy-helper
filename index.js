const vscode = require('vscode');
const { workspace, window } = vscode;
const {
  getCypressCommandImplementation,
  generateTypeDefinitions
} = require('./astParser');

const TERMINAL_NAME = 'CypressRun';
const FOCUS_TAG = '@focus';
const TEST_BLOCK = 'it(';

/**
 * TERMINAL:
 */
let _activeTerminal = null;
vscode.window.onDidCloseTerminal(terminal => {
  if (terminal.name === TERMINAL_NAME) {
    if (!terminal.disposed) {
      disposeTerminal();
    }
    let editor = window.activeTextEditor;
    let cucumberUsed = editor.document.languageId === 'feature';
    let fullText = editor.document.getText();
    editor
      .edit(editBuilder => {
        let focused = fullText
          .split('\n')
          .map((line, row) => {
            if (
              line.trim().startsWith(FOCUS_TAG) ||
              line.trim().startsWith(TEST_BLOCK)
            ) {
              return row;
            }
          })
          .filter(e => Boolean(e));
        focused.map(row => {
          let {
            text,
            firstNonWhitespaceCharacterIndex
          } = editor.document.lineAt(row);
          let textPosition = new vscode.Range(
            row,
            firstNonWhitespaceCharacterIndex,
            row,
            firstNonWhitespaceCharacterIndex + cucumberUsed
              ? FOCUS_TAG.length
              : TEST_BLOCK.length
          );
          let newText = text.replace(FOCUS_TAG, '').replace(TEST_BLOCK, '');
          editBuilder.replace(textPosition, newText);
        });
      })
      .then(() => {
        editor.document.save();
      });
  }
});
const createTerminal = () => {
  _activeTerminal = vscode.window.createTerminal(TERMINAL_NAME);
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
    terminal.sendText();
    vscode.commands.executeCommand('');
    terminal.sendText(
      `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
    );
  };

  const openSingleSpec = () => {
    let editor = window.activeTextEditor;
    let cucumberUsed = editor.document.languageId === 'feature';
    let line = editor.document.lineAt(editor.selection.active.line);
    let fullText = editor.document.getText();
    let scenarioIndexes = fullText
      .split('\n')
      .map((line, row) => {
        if (
          line.trim().startsWith('Scenario') ||
          line.trim().startsWith(TEST_BLOCK)
        ) {
          return row;
        }
      })
      .filter(e => Boolean(e));
    let selectedScenarioIndex =
      scenarioIndexes.find((scenarioIndex, position) => {
        let nextLine = scenarioIndexes[position + 1] || line.lineNumber + 1;
        return (
          line.lineNumber + 1 >= scenarioIndex &&
          line.lineNumber + 1 <= nextLine
        );
      }) - 1;
    if (cucumberUsed) {
      let { text: previousLineText } = editor.document.lineAt(
        selectedScenarioIndex
      );
      if (!previousLineText.includes(FOCUS_TAG)) {
        editor
          .edit(editBuilder => {
            editBuilder.replace(
              new vscode.Position(selectedScenarioIndex, 0),
              `${FOCUS_TAG}${previousLineText.length ? ' ' : ''}`
            );
          })
          .then(() => {
            editor.document.save();
          });
      }
    } else {
      let testLine = editor.document.lineAt(selectedScenarioIndex);
      let testText = editor.document.getText(testLine.range);
      let indexOfTest = editor.document
        .getText(testText.range)
        .indexOf(TEST_BLOCK);
      editor
        .edit(editBuilder => {
          editBuilder.replace(
            new vscode.Position(selectedScenarioIndex, indexOfTest + 2),
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
    let location = getCypressCommandImplementation(
      `${root}/${customCommandsFolder}`,
      commandName
    );
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

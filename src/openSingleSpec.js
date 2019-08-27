const vscode = require('vscode');
const { window } = vscode;
const { openSpecFile } = require('./openSpecFile');

const { FOCUS_TAG, TEST_BLOCK, TEST_ONLY_BLOCK } = require('./constants');

exports.openSingleSpec = () => {
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
  let selectedScenarioIndex = scenarioIndexes.find(
    (scenarioIndex, position) => {
      let nextLine = scenarioIndexes[position + 1] || lineNumber;
      return lineNumber >= scenarioIndex && lineNumber <= nextLine;
    }
  );
  !selectedScenarioIndex && window.showErrorMessage('Test not found');
  if (cucumberPreprocessorUsed) {
    let { text: previousLineText } = editor.document.lineAt(
      selectedScenarioIndex - 1
    );
    if (!previousLineText.includes(FOCUS_TAG)) {
      editor
        .edit(editBuilder => {
          editBuilder.replace(
            new vscode.Position(selectedScenarioIndex - 1, 0),
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

const vscode = require('vscode');
const { window } = vscode;
const { openSpecFile } = require('./openSpecFile');

const {
  FOCUS_TAG,
  TEST_BLOCK,
  TEST_ONLY_BLOCK,
  ONLY_BLOCK
} = require('./constants');

exports.openSingleTest = () => {
  let editor = window.activeTextEditor;
  let cucumberPreprocessorUsed = editor.document.languageId === 'feature';
  let line = editor.document.lineAt(editor.selection.active.line);
  let lineNumber = line.lineNumber + 1;
  let fullText = editor.document.getText().split('\n');
  let scenarioIndexes = fullText
    .filter(
      row =>
        row.trim().startsWith('Scenario') ||
        row.trim().startsWith(TEST_BLOCK) ||
        row.trim().startsWith(TEST_ONLY_BLOCK)
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
    let { text, range } = editor.document.lineAt(selectedScenarioIndex);
    let indexOfTest = text.indexOf(TEST_BLOCK);
    let indexOfOnly = text.indexOf(TEST_ONLY_BLOCK);
    !indexOfTest && !indexOfOnly && window.showErrorMessage('Test not found');
    let newText = text.replace(TEST_BLOCK, `it${ONLY_BLOCK}(`);
    editor
      .edit(editBuilder => {
        editBuilder.replace(range, newText);
      })
      .then(() => {
        editor.document.save();
      });
  }
  openSpecFile();
};

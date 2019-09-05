const { window, Position } = require('vscode');
const { openSpecFile } = require('./openSpecFile');

const {
  FOCUS_TAG,
  TEST_BLOCK,
  TEST_ONLY_BLOCK,
  ONLY_BLOCK
} = require('./helper/constants');

exports.openSingleTest = () => {
  const editor = window.activeTextEditor;
  const cucumberPreprocessorUsed = editor.document.languageId === 'feature';
  const line = editor.document.lineAt(editor.selection.active.line);
  const lineNumber = line.lineNumber + 1;
  const fullText = editor.document.getText().split('\n');
  // Find indexes of tests in file
  const scenarioIndexes = fullText
    .filter(
      row =>
        row.trim().startsWith('Scenario') ||
        row.trim().startsWith(TEST_BLOCK) ||
        row.trim().startsWith(TEST_ONLY_BLOCK)
    )
    .map(row => fullText.indexOf(row));
  // Find scenario related to current cursor position
  const selectedScenarioIndex = scenarioIndexes.find(
    (scenarioIndex, position) => {
      const nextLine = scenarioIndexes[position + 1] || lineNumber;
      return lineNumber >= scenarioIndex && lineNumber <= nextLine;
    }
  );
  !selectedScenarioIndex && window.showErrorMessage('Test not found');
  if (cucumberPreprocessorUsed) {
    // for gherkin set tag @focus on previous line to execute one test
    const { text: previousLineText } = editor.document.lineAt(
      selectedScenarioIndex - 1
    );
    if (!previousLineText.includes(FOCUS_TAG)) {
      editor
        .edit(editBuilder => {
          editBuilder.replace(
            new Position(selectedScenarioIndex - 1, 0),
            FOCUS_TAG
          );
        })
        .then(() => {
          editor.document.save();
        });
    }
  } else {
    // for javascript mocha syntax it.only() is required
    const { text, range } = editor.document.lineAt(selectedScenarioIndex);
    const indexOfTest = text.indexOf(TEST_BLOCK);
    const indexOfOnly = text.indexOf(TEST_ONLY_BLOCK);
    !indexOfTest && !indexOfOnly && window.showErrorMessage('Test not found');
    const newText = text.replace(TEST_BLOCK, `it${ONLY_BLOCK}(`);
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

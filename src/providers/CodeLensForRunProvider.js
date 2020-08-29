const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const {
  TEST_BLOCK,
  TEST_ONLY_BLOCK,
  SCENARIO
} = require('../helper/constants');

const { menuItems } = vscode.config();

class CodeLensForRunProvider {
  provideCodeLenses(document) {
    if (!menuItems.OpenCypress) {
      return;
    }
    this.codeLenses = [];
    const cucumberPreprocessorUsed = document.languageId === 'feature';

    const text = document.getText().split('\n');

    const tag = cucumberPreprocessorUsed ? '"@focus"' : '".only"';

    return text
      .filter(
        row =>
          row.trim().startsWith(SCENARIO) ||
          row.trim().startsWith(TEST_BLOCK) ||
          row.trim().startsWith(TEST_ONLY_BLOCK)
      )
      .reduce((lenses, row) => {
        const rowIndex = text.indexOf(row);
        const { range } = document.lineAt(rowIndex);
        lenses.push(
          vscode.codeLens(range, {
            title: 'Open Cypress',
            tooltip:
              'open test file with command configured in CypressHelper.commandForOpen',
            command: 'cypressHelper.openSpecFile',
            arguments: [document.fileName]
          })
        );
        lenses.push(
          vscode.codeLens(range, {
            title: `Set ${tag}`,
            tooltip:
              'open single test with command configured in CypressHelper.commandForOpen',
            command: 'cypressHelper.setOnlyTag',
            arguments: [rowIndex, cucumberPreprocessorUsed]
          })
        );
        lenses.push(
          vscode.codeLens(range, {
            title: `Clear ${tag}`,
            tooltip: `clear ${tag}`,
            command: 'cypressHelper.clearOnlyTag',
            arguments: [rowIndex, cucumberPreprocessorUsed]
          })
        );
        return lenses;
      }, []);
  }
}

module.exports = CodeLensForRunProvider;

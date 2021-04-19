const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const {
  TEST_BLOCK,
  TEST_ONLY_BLOCK,
  FOCUS_TAG_FORMATTED,
  SCENARIO
} = require('../helper/constants');

const { menuItems } = vscode.config();

class CodeLensForRunProvider {
  provideCodeLenses(document) {
    if (!menuItems.OpenCypress && !menuItems.RunCypress) {
      return;
    }
    this.codeLenses = [];
    const cucumberPreprocessorUsed = document.languageId === 'feature';

    const texts = document.getText().split('\n');

    const tag = cucumberPreprocessorUsed ? '"@focus"' : '".only"';

    return texts
      .map((text, index) => ({ text, index }))
      .filter(
        line =>
          line.text.trim().startsWith(SCENARIO) ||
          line.text.trim().startsWith(TEST_BLOCK) ||
          line.text.trim().startsWith(TEST_ONLY_BLOCK)
      )
      .reduce((lenses, line) => {
        const { text, index } = line;
        const { range } = document.lineAt(index);
        const useClearTagLense =
          cucumberPreprocessorUsed && index > 0
            ? texts[index - 1].trim().startsWith(FOCUS_TAG_FORMATTED)
            : text.trim().startsWith(TEST_ONLY_BLOCK);
        menuItems.OpenCypress &&
          lenses.push(
            vscode.codeLens(range, {
              title: 'Open Cypress',
              tooltip:
                'open test file with command configured in CypressHelper.commandForOpen',
              command: 'cypressHelper.openSpecFile',
              arguments: ['open', document.fileName]
            })
          );
        menuItems.RunCypress &&
          lenses.push(
            vscode.codeLens(range, {
              title: 'Run Cypress',
              tooltip:
                'run test file with command configured in CypressHelper.commandForRun',
              command: 'cypressHelper.openSpecFile',
              arguments: ['run', document.fileName]
            })
          );
        useClearTagLense
          ? lenses.push(
              vscode.codeLens(range, {
                title: `Clear ${tag}`,
                tooltip: `clear ${tag}`,
                command: 'cypressHelper.clearOnlyTag',
                arguments: [index, cucumberPreprocessorUsed]
              })
            )
          : lenses.push(
              vscode.codeLens(range, {
                title: `Set ${tag}`,
                tooltip:
                  'open single test with command configured in CypressHelper.commandForOpen',
                command: 'cypressHelper.setOnlyTag',
                arguments: [index, cucumberPreprocessorUsed]
              })
            );
        return lenses;
      }, []);
  }
}

module.exports = CodeLensForRunProvider;

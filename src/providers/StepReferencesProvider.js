const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { cucumberStepReferences } = require('../cucumberStepsUsage');

class CommandReferencesProvider {
  provideReferences() {
    const { usages: references } = cucumberStepReferences();
    const locationList = references.map(reference =>
      vscode.location(
        vscode.parseUri(reference.path),
        vscode.Position(reference.loc.line - 1, reference.loc.column)
      )
    );
    return locationList;
  }
}

module.exports = CommandReferencesProvider;

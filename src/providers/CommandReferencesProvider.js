const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { customCommandReferences } = require('../customCommandsUsage');
const { enableCommandReferenceProvider } = vscode.config();

class CommandReferencesProvider {
  provideReferences() {
    if (enableCommandReferenceProvider) {
      const { references } = customCommandReferences();
      const locationList = references.map(reference =>
        vscode.location(
          vscode.parseUri(reference.path),
          vscode.Position(
            reference.loc.start.line - 1,
            reference.loc.start.column
          )
        )
      );
      return locationList;
    }
  }
}

module.exports = CommandReferencesProvider;

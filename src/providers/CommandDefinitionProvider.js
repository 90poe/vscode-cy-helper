const path = require('path');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { cypressCommandLocation } = require('../parser/AST');
const { customCommandsFolder } = vscode.config();
const root = vscode.root();
const { detectCustomCommand } = require('../openCustomCommand');

class CommandDefinitionProvider {
  provideDefinition() {
    const { commandName, _ } = detectCustomCommand();

    if (commandName) {
      const commandsLocation = path.join(
        root,
        path.normalize(customCommandsFolder)
      );
      const location = cypressCommandLocation(commandsLocation, commandName);
      if (location && location.file) {
        const { file, loc } = location;
        const targetPosition = vscode.Position(loc.line - 1, loc.column);
        return vscode.location(vscode.parseUri(file), targetPosition);
      }
    }
  }
}

module.exports = CommandDefinitionProvider;

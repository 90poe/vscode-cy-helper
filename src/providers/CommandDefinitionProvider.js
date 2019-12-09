const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { cypressCommandLocation } = require('../parser/AST');
const { customCommandsFolder } = vscode.config();
const root = vscode.root();
const { detectCustomCommand } = require('../openCustomCommand');

class CommandDefinitionProvider {
  provideDefinition() {
    const commandName = detectCustomCommand();
    if (!commandName) {
      return undefined;
    }
    const { file, loc } = cypressCommandLocation(
      `${root}/${customCommandsFolder}`,
      commandName
    );
    if (!file) {
      return undefined;
    }
    const targetPosition = vscode.Position(loc.line - 1, loc.column);
    return vscode.location(vscode.parseUri(file), targetPosition);
  }
}

module.exports = CommandDefinitionProvider;

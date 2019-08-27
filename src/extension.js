const vscode = require('vscode');
const { openSpecFile } = require('./openSpecFile');
const { openSingleSpec } = require('./openSingleSpec');
const { openCustomCommand } = require('./openCustomCommand');
const { generateCustomCommandTypes } = require('./generateCustomCommandTypes');
const { removeTags } = require('./terminal');

const activate = context => {
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

  vscode.window.onDidCloseTerminal(terminal => removeTags(terminal));
};
exports.activate = activate;

const deactivate = () => {};

module.exports = {
  activate,
  deactivate
};

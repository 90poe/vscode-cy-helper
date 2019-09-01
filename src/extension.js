const vscode = require('vscode');
const { openSpecFile } = require('./openSpecFile');
const { openSingleTest } = require('./openSingleTest');
const { openCustomCommand } = require('./openCustomCommand');
const { generateCustomCommandTypes } = require('./generateCustomCommandTypes');
const { findUnusedCustomCommands } = require('./findUnusedCustomCommands');
const { removeTags } = require('./terminal');

const activate = context => {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.openSpecFile', openSpecFile),
    vscode.commands.registerCommand('extension.openSingleTest', openSingleTest),
    vscode.commands.registerCommand(
      'extension.openCustomCommand',
      openCustomCommand
    ),
    vscode.commands.registerCommand(
      'extension.generateCustomCommandTypes',
      generateCustomCommandTypes
    ),
    vscode.commands.registerCommand(
      'extension.findUnusedCustomCommands',
      findUnusedCustomCommands
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

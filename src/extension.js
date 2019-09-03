const vscode = require('vscode');
const { openSpecFile } = require('./openSpecFile');
const { openSingleTest } = require('./openSingleTest');
const { openCustomCommand } = require('./openCustomCommand');
const { generateCustomCommandTypes } = require('./generateCustomCommandTypes');
const {
  findUnusedCustomCommands,
  findCustomCommandReferences
} = require('./customCommandsUsage');
const {
  findUnusedCucumberSteps,
  findCucumberStepUsage
} = require('./cucumberStepsUsage');
const { removeTags } = require('./helper/terminal');

const activate = context => {
  context.subscriptions.push(
    vscode.commands.registerCommand('cypressHelper.openSpecFile', openSpecFile),
    vscode.commands.registerCommand(
      'cypressHelper.openSingleTest',
      openSingleTest
    ),
    vscode.commands.registerCommand(
      'cypressHelper.openCustomCommand',
      openCustomCommand
    ),
    vscode.commands.registerCommand(
      'cypressHelper.generateCustomCommandTypes',
      generateCustomCommandTypes
    ),
    vscode.commands.registerCommand(
      'cypressHelper.findUnusedCustomCommands',
      findUnusedCustomCommands
    ),
    vscode.commands.registerCommand(
      'cypressHelper.findUnusedCucumberSteps',
      findUnusedCucumberSteps
    ),
    vscode.commands.registerCommand(
      'cypressHelper.findCucumberStepUsage',
      findCucumberStepUsage
    ),
    vscode.commands.registerCommand(
      'cypressHelper.findCustomCommandReferences',
      findCustomCommandReferences
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

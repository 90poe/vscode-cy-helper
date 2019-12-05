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
const {
  updateWorkspaceFiles,
  promptToReloadWindow
} = require('./helper/utils');
const FixtureProvider = require('./fixtureProvider');

const activate = context => {
  let fixtureCompletionProvider = new FixtureProvider();
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
    ),
    vscode.languages.registerCompletionItemProvider(
      [
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'typescript' }
      ],
      fixtureCompletionProvider,
      ['('],
      ['/'],
      ['\\']
    ),
    fixtureCompletionProvider
  );
  vscode.window.onDidCloseTerminal(terminal => removeTags(terminal));
  vscode.workspace.onDidSaveTextDocument(document =>
    updateWorkspaceFiles(document.fileName)
  );
  vscode.workspace.onDidChangeConfiguration(promptToReloadWindow);
};
exports.activate = activate;

const deactivate = () => {};

module.exports = {
  activate,
  deactivate
};

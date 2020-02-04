const vscode = require('vscode');
const { openSpecFile } = require('./openSpecFile');
const { openSingleTest } = require('./openSingleTest');
const { openCustomCommand } = require('./openCustomCommand');
const { generateCustomCommandTypes } = require('./generateCustomCommandTypes');
const { createDefaultTsConfig } = require('./createDefaultTsConfig');
const {
  findUnusedCustomCommands,
  showCustomCommandReferences
} = require('./customCommandsUsage');
const {
  findUnusedCucumberSteps,
  findCucumberStepUsage
} = require('./cucumberStepsUsage');
const { parseHAR } = require('./parseHAR');
const { openJsonSchemaGenerator } = require('./openJsonSchemaGenerator');
const { removeTags } = require('./helper/terminal');
const { promptToReloadWindow } = require('./helper/utils');
const FixtureCompletionProvider = require('./providers/FixtureCompletionProvider');
const CommandDefinitionProvider = require('./providers/CommandDefinitionProvider');
const CommandReferencesProvider = require('./providers/CommandReferencesProvider');
const StepReferencesProvider = require('./providers/StepReferencesProvider');

const languageActivationSchema = [
  { scheme: 'file', language: 'javascript' },
  { scheme: 'file', language: 'typescript' }
];

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
      showCustomCommandReferences
    ),
    vscode.commands.registerCommand(
      'cypressHelper.createDefaultTsConfig',
      createDefaultTsConfig
    ),
    vscode.commands.registerCommand('cypressHelper.parseHar', file =>
      parseHAR(file)
    ),
    vscode.commands.registerCommand('cypressHelper.generateJsonSchema', file =>
      openJsonSchemaGenerator(file)
    ),
    vscode.languages.registerCompletionItemProvider(
      [
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'feature' }
      ],
      new FixtureCompletionProvider(),
      ['('],
      ['/'],
      ['\\'],
      ['"']
    ),
    vscode.languages.registerDefinitionProvider(
      languageActivationSchema,
      new CommandDefinitionProvider()
    ),
    vscode.languages.registerReferenceProvider(
      languageActivationSchema,
      new CommandReferencesProvider()
    ),
    vscode.languages.registerReferenceProvider(
      languageActivationSchema,
      new StepReferencesProvider()
    )
  );
  vscode.window.onDidCloseTerminal(terminal => removeTags(terminal));
  vscode.workspace.onDidChangeConfiguration(promptToReloadWindow);
};
exports.activate = activate;

const deactivate = () => {};

module.exports = {
  activate,
  deactivate
};

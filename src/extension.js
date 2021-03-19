const vscode = require('vscode');
const { openSpecFile } = require('./openSpecFile');
const { setOnlyTag, clearOnlyTag } = require('./testWithOnlyTags');
const { openCustomCommand } = require('./openCustomCommand');
const { generateCustomCommandTypes } = require('./generateCustomCommandTypes');
const { createDefaultTsConfig } = require('./createDefaultTsConfig');
const { regenerateTypes } = require('./generateTypesOnSave');
const {
  findUnusedCustomCommands,
  showCustomCommandReferences
} = require('./customCommandsUsage');
const {
  findUnusedCucumberSteps,
  findCucumberStepUsage
} = require('./cucumberStepsUsage');
const { parseHAR } = require('./90poe/parseHAR');
const { openJsonSchemaGenerator } = require('./90poe/openJsonSchemaGenerator');
const { removeTags } = require('./helper/terminal');
const { promptToReloadWindow } = require('./helper/utils');
const FixtureCompletionProvider = require('./providers/FixtureCompletionProvider');
const FixtureDefinitionProvider = require('./providers/FixtureDefinitionProvider');
const AliasCompletionProvider = require('./providers/AliasCompletionProvider');
const {
  AliasDefinitionProvider
} = require('./providers/AliasDefinitionProvider');
const CucumberTagsProvider = require('./providers/CucumberTagsProvider');
const GQLMockCompletionProvider = require('./90poe/gqlMockCompletionProvider');
const CommandDefinitionProvider = require('./providers/CommandDefinitionProvider');
const CommandReferencesProvider = require('./providers/CommandReferencesProvider');
const StepReferencesProvider = require('./providers/StepReferencesProvider');
const CodeLensForRunProvider = require('./providers/CodeLensForRunProvider');
const TypeKeypressEventsProvider = require('./providers/TypeKeypressEventsProvider');
const JqueryLocatorCompletionProvider = require('./providers/JqueryLocatorCompletionProvider');

const JsAndTsActivationSchema = [
  { scheme: 'file', language: 'javascript' },
  { scheme: 'file', language: 'typescript' }
];

const allLanguagesSchema = [
  ...JsAndTsActivationSchema,
  { scheme: 'file', language: 'feature' }
];

const activate = context => {
  context.subscriptions.push(
    vscode.commands.registerCommand('cypressHelper.openSpecFile', openSpecFile),
    vscode.commands.registerCommand('cypressHelper.setOnlyTag', setOnlyTag),
    vscode.commands.registerCommand('cypressHelper.clearOnlyTag', clearOnlyTag),
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
      allLanguagesSchema,
      new FixtureCompletionProvider(),
      '(',
      '/',
      '\\',
      '"'
    ),
    vscode.languages.registerCompletionItemProvider(
      JsAndTsActivationSchema,
      new AliasCompletionProvider(),
      '@'
    ),
    vscode.languages.registerDefinitionProvider(
      JsAndTsActivationSchema,
      new AliasDefinitionProvider()
    ),
    vscode.languages.registerCompletionItemProvider(
      [{ scheme: 'file', language: 'feature' }],
      new CucumberTagsProvider(),
      '@'
    ),
    vscode.languages.registerCompletionItemProvider(
      JsAndTsActivationSchema,
      new GQLMockCompletionProvider(),
      '(',
      '/',
      '\\'
    ),
    vscode.languages.registerCompletionItemProvider(
      JsAndTsActivationSchema,
      new TypeKeypressEventsProvider(),
      '{'
    ),
    vscode.languages.registerCompletionItemProvider(
      JsAndTsActivationSchema,
      new JqueryLocatorCompletionProvider(),
      '[',
      ':',
      '=',
      ' '
    ),
    vscode.languages.registerDefinitionProvider(
      JsAndTsActivationSchema,
      new CommandDefinitionProvider()
    ),
    vscode.languages.registerDefinitionProvider(
      allLanguagesSchema,
      new FixtureDefinitionProvider()
    ),
    vscode.languages.registerReferenceProvider(
      JsAndTsActivationSchema,
      new CommandReferencesProvider()
    ),
    vscode.languages.registerReferenceProvider(
      JsAndTsActivationSchema,
      new StepReferencesProvider()
    ),
    vscode.languages.registerCodeLensProvider(
      allLanguagesSchema,
      new CodeLensForRunProvider()
    )
  );
  vscode.window.onDidCloseTerminal(terminal => removeTags(terminal));
  vscode.workspace.onDidChangeConfiguration(event =>
    promptToReloadWindow(event)
  );
  vscode.workspace.onDidSaveTextDocument(document => regenerateTypes(document));
};
exports.activate = activate;

const deactivate = () => {};

module.exports = {
  activate,
  deactivate
};

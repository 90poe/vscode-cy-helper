const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { typeDefinitions, customCommandsAvailable } = require('./parser/AST');
const { readFilesFromDir } = require('./helper/utils');
const root = vscode.root();
const { message, SPACE } = require('./helper/constants');
const {
  checkTsConfigExist,
  writeTsConfig
} = require('./createDefaultTsConfig');
const {
  customCommandsFolder,
  typeDefinitionFile,
  typeDefinitionExcludePatterns,
  includeAnnotationForCommands
} = vscode.config();

/**
 * Template for type definition file
 */
const wrapTemplate = commands => `declare namespace Cypress {
    interface Chainable<Subject> {
        ${commands.join(SPACE)}
  }
}`;

/**
 * write gathered type definitions to file
 * @param {string} typeDefFile
 * @param {string[]} typeDefs
 * @param {boolean} onSave
 */
const writeTypeDefinition = (typeDefFile, typeDefs, onSave) => {
  fs.outputFileSync(typeDefFile, wrapTemplate(typeDefs), 'utf-8');
  if (!onSave) {
    vscode.show('info', message.GENERATED_TYPES);
    vscode.openDocument(typeDefFile);
  }
};

/**
 * remove not valid entries from type definitions
 * @param {string[]} incorrect
 * @param {string[]} definitions
 */
const cleanTypes = (incorrect, definitions) => {
  return definitions.filter(
    d => !incorrect.includes(d.split('(').shift().trim())
  );
};

/**
 * remove not valid entries from found commands
 * @param {string[]} incorrect
 * @param {string[]} available
 */
const cleanCommands = (incorrect, available) => {
  return available.filter(a => !incorrect.includes(a));
};

exports.generateCustomCommandTypes = (doc, onSave = false) => {
  const folder = path.join(root, path.normalize(customCommandsFolder));
  const excludes = typeDefinitionExcludePatterns;
  const typeDefFile = path.join(root, path.normalize(typeDefinitionFile));

  const customCommandFiles = readFilesFromDir(folder);
  let { commandsFound, typeDefs } = typeDefinitions(
    customCommandFiles,
    excludes,
    { includeAnnotations: includeAnnotationForCommands }
  );

  const availableTypeDefinitions = customCommandsAvailable(typeDefFile);

  let uniqueCommands = _.uniq(commandsFound);
  const incorrectCommands = uniqueCommands.filter(c => c.includes('-'));

  if (incorrectCommands.length) {
    vscode.show('err', message.INVALID_SYNTAX(incorrectCommands), true);
    typeDefs = cleanTypes(incorrectCommands, typeDefs);
    commandsFound = cleanCommands(incorrectCommands, commandsFound);
    uniqueCommands = cleanCommands(incorrectCommands, uniqueCommands);
  }

  if (commandsFound.length === uniqueCommands.length) {
    writeTypeDefinition(typeDefFile, typeDefs, onSave);

    if (!onSave) {
      if (typeDefs.length) {
        vscode.show('info', message.NO_COMMAND_DUPLICATES);
      } else {
        vscode.show('warn', message.NO_COMMAND);
      }
    }
  } else {
    const duplicates = _.uniq(
      _.filter(commandsFound, (v, i, a) => a.indexOf(v) !== i)
    );
    vscode.show('err', message.DUPLICATED_COMMANDS(duplicates), true);

    typeDefs = cleanTypes(duplicates, typeDefs);
    commandsFound = cleanCommands(duplicates, commandsFound);

    writeTypeDefinition(typeDefFile, typeDefs, onSave);
  }

  const added = _.difference(commandsFound, availableTypeDefinitions);
  const removed = _.difference(availableTypeDefinitions, commandsFound);

  added.length && vscode.show('info', message.NEW_COMMANDS(added));
  removed.length && vscode.show('info', message.REMOVED_COMMANDS(removed));
  const hasTsConfig = checkTsConfigExist(root);
  if (!hasTsConfig) {
    vscode
      .show(
        'info',
        `No tsconfig.json file detected, do you want to create?`,
        false,
        'No',
        'Yes'
      )
      .then(selectedAction => {
        if (selectedAction === 'Yes') {
          writeTsConfig(root);
        }
      });
  }
};

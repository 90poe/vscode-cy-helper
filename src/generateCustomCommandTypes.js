const { window, workspace } = require('vscode');
const _ = require('lodash');
const fs = require('fs-extra');
const { typeDefinitions, customCommandsAvailable } = require('./parser/AST');
const { readFilesFromDir } = require('./helper/utils');

const {
  customCommandsFolder,
  typeDefinitionFile,
  typeDefinitionExcludePatterns
} = workspace.getConfiguration().cypressHelper;

/**
 * Template for type definition file
 */
const wrapTemplate = commands => `declare namespace Cypress {
    interface Chainable<Subject> {
        ${commands.join('\n        ')}
  }
}`;

/**
 * write gathered type definitions to file
 * @param {string} typeDefFile
 * @param {string[]} typeDefs
 */
const writeTypeDefinition = (typeDefFile, typeDefs) => {
  fs.outputFileSync(typeDefFile, wrapTemplate(typeDefs), 'utf-8');
  window.showInformationMessage('Type definitions generated and saved');
  workspace.openTextDocument(typeDefFile).then(doc => {
    window.showTextDocument(doc, { preview: false });
  });
};

/**
 * remove not valid entries from type definitions
 * @param {string[]} incorrect
 * @param {string[]} definitions
 */
const cleanTypes = (incorrect, definitions) => {
  return definitions.filter(
    d =>
      !incorrect.includes(
        d
          .split('(')
          .shift()
          .trim()
      )
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

exports.generateCustomCommandTypes = () => {
  const editor = window.activeTextEditor;
  const root = editor.document.fileName.split('/cypress/').shift();
  const [folder, excludes, typeDefFile] = [
    `${root}/${customCommandsFolder}`,
    typeDefinitionExcludePatterns,
    `${root}/${typeDefinitionFile}`
  ];
  const customCommandFiles = readFilesFromDir(folder);
  let { commandsFound, typeDefs } = typeDefinitions(
    customCommandFiles,
    excludes
  );
  const availableTypeDefinitions = customCommandsAvailable(typeDefFile);
  let uniqueCommands = _.uniq(commandsFound);
  const incorrectCommands = uniqueCommands.filter(c => c.includes('-'));
  if (incorrectCommands.length) {
    window.showErrorMessage(
      `Incorrect command syntax:\n${incorrectCommands.join('\n')}`,
      { modal: true }
    );
    typeDefs = cleanTypes(incorrectCommands, typeDefs);
    commandsFound = cleanCommands(incorrectCommands, commandsFound);
    uniqueCommands = cleanCommands(incorrectCommands, uniqueCommands);
  }
  if (commandsFound.length === uniqueCommands.length) {
    writeTypeDefinition(typeDefFile, typeDefs);
    if (typeDefs.length) {
      window.showInformationMessage('No duplicates found');
    } else {
      window.showWarningMessage('No commands required type definitions found');
    }
  } else {
    const duplicates = _.uniq(
      _.filter(commandsFound, (v, i, a) => a.indexOf(v) !== i)
    );
    const messageForDuplicate = `Duplicated commands:\n${duplicates.join(
      '\n'
    )}`;
    window.showErrorMessage(messageForDuplicate, { modal: true });
    typeDefs = cleanTypes(duplicates, typeDefs);
    commandsFound = cleanCommands(duplicates, commandsFound);
    writeTypeDefinition(typeDefFile, typeDefs);
  }
  const added = _.difference(commandsFound, availableTypeDefinitions);
  const removed = _.difference(availableTypeDefinitions, commandsFound);
  if (added.length) {
    window.showInformationMessage(
      `New command types added:\n${added.join('\n')}`,
      {
        modal: true
      }
    );
  }
  if (removed.length) {
    window.showInformationMessage(
      `Removed command types:\n${removed.join('\n')}`,
      {
        modal: true
      }
    );
  }
};

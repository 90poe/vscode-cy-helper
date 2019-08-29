const { window, workspace } = require('vscode');
const _ = require('lodash');
const fs = require('fs-extra');
const {
  typeDefinitions,
  customCommandsAvailable,
  supportFiles
} = require('./astParser');

let {
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

const writeTypeDefinition = (typeDefFile, typeDefs) => {
  fs.outputFileSync(typeDefFile, wrapTemplate(typeDefs), 'utf-8');
  window.showInformationMessage('Type definitions generated and saved');
  workspace.openTextDocument(typeDefFile).then(doc => {
    window.showTextDocument(doc, { preview: false });
  });
};

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

const cleanCommands = (incorrect, available) => {
  return available.filter(a => !incorrect.includes(a));
};

exports.generateCustomCommandTypes = () => {
  let editor = window.activeTextEditor;
  let root = editor.document.fileName.split('/cypress/').shift();
  let [folder, excludes, typeDefFile] = [
    `${root}/${customCommandsFolder}`,
    typeDefinitionExcludePatterns,
    `${root}/${typeDefinitionFile}`
  ];
  let files = supportFiles(folder);
  let { commandsFound, typeDefs } = typeDefinitions(files, excludes);
  let availableTypeDefinitions = customCommandsAvailable(typeDefFile);
  let uniqueCommands = _.uniq(commandsFound);
  let incorrectCommands = uniqueCommands.filter(c => c.includes('-'));
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
    if (typeDefs.length) {
      writeTypeDefinition(typeDefFile, typeDefs);
    } else {
      window.showWarningMessage('No commands required type definitions found');
    }
    window.showInformationMessage('No duplicates found');
  } else {
    let duplicates = _.uniq(
      _.filter(commandsFound, (v, i, a) => a.indexOf(v) !== i)
    );
    let messageForDuplicate = `Duplicated commands:\n${duplicates.join('\n')}`;
    window.showErrorMessage(messageForDuplicate, { modal: true });
    typeDefs = cleanTypes(duplicates, typeDefs);
    commandsFound = cleanCommands(duplicates, commandsFound);
    writeTypeDefinition(typeDefFile, typeDefs);
  }
  let added = _.difference(commandsFound, availableTypeDefinitions);
  let removed = _.difference(availableTypeDefinitions, commandsFound);
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

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
  let added = _.difference(commandsFound, availableTypeDefinitions);
  let deleted = _.difference(availableTypeDefinitions, commandsFound);
  let foundUniqueCommands = _.uniq(commandsFound);
  if (commandsFound.length === foundUniqueCommands.length) {
    if (typeDefs.length) {
      fs.outputFileSync(typeDefFile, wrapTemplate(typeDefs), 'utf-8');
      window.showInformationMessage('Type definitions generated and saved');
      workspace.openTextDocument(typeDefFile).then(doc => {
        window.showTextDocument(doc, { preview: false });
      });
    } else {
      window.showWarningMessage('No commands required type definitions found');
    }
    window.showInformationMessage('No duplicates found');
  } else {
    let errorDuplicate = `Command already exist:\n${_.uniq(
      _.filter(commandsFound, (v, i, a) => a.indexOf(v) !== i)
    ).join('\n')}`;
    window.showErrorMessage(errorDuplicate, { modal: true });
  }
  if (added.length) {
    window.showInformationMessage(
      `New command types added:\n${added.join('\n')}`,
      {
        modal: true
      }
    );
  }
  if (deleted.length) {
    window.showInformationMessage(
      `Deleted command types:\n${deleted.join('\n')}`,
      {
        modal: true
      }
    );
  }
};

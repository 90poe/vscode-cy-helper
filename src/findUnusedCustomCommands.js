const { typeDefinitions, readFilesFromDir } = require('./astParser');
const vscode = require('vscode');
const { workspace, window } = vscode;
const fs = require('fs-extra');
const { openDocumentAtPosition } = require('./utils');
let { customCommandsFolder } = workspace.getConfiguration().cypressHelper;

exports.findUnusedCustomCommands = () => {
  let root = workspace.rootPath;
  let workspaceFiles = readFilesFromDir(root);
  let { commandsFound } = typeDefinitions(workspaceFiles, [], {
    includeLocationData: true
  });
  let uniqueCommands = Array.from(new Set(commandsFound.map(c => c.name))).map(
    name => {
      let { path, loc } = commandsFound.find(c => c.name === name);
      return {
        name: name,
        path: path,
        loc: loc
      };
    }
  );
  workspaceFiles.map(file => {
    let content = fs.readFileSync(file.path, 'utf-8');
    uniqueCommands = uniqueCommands.filter(
      command => new RegExp(`\\.${command.name}\\(`, 'g').exec(content) === null
    );
  });
  if (uniqueCommands) {
    let quickPickList = uniqueCommands.map(c => {
      return {
        label: c.name,
        detail: `${c.path
          .replace(root, '')
          .replace(`${customCommandsFolder}/`, '')}:${c.loc.start.line}`,
        data: c
      };
    });
    quickPickList.unshift({
      label: '',
      description: `Found ${uniqueCommands.length} not used Cypress custom commands:`
    });
    window
      .showQuickPick(quickPickList)
      .then(({ data }) => openDocumentAtPosition(data.path, data.loc.start));
  } else {
    window.showInformationMessage('No unused Cypress custom commands found');
  }
};

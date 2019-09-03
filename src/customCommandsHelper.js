const { typeDefinitions, readFilesFromDir } = require('./astParser');
const vscode = require('vscode');
const { workspace, window } = vscode;
const fs = require('fs-extra');
const { openDocumentAtPosition } = require('./utils');
const { detectCustomCommand } = require('./openCustomCommand');
let { customCommandsFolder } = workspace.getConfiguration().cypressHelper;
const root = workspace.rootPath;

const findCustomCommands = workspaceFiles => {
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
  return uniqueCommands;
};

const findUnusedCustomCommands = () => {
  let workspaceFiles = readFilesFromDir(root);
  let uniqueCommands = findCustomCommands(workspaceFiles);
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

const findCustomCommandReferences = () => {
  let commandName = detectCustomCommand({ implementation: true }).replace(
    /['"`]/g,
    ''
  );
  let commandPattern = new RegExp(`\\.${commandName}\\(`, 'g');
  let workspaceFiles = readFilesFromDir(root);
  let references = [];
  workspaceFiles.map(file => {
    let content = fs.readFileSync(file.path, 'utf-8').split('\n');
    content.map((row, index) => {
      let hasCommand = commandPattern.exec(row);
      let column = row.indexOf(commandName);
      if (hasCommand) {
        references.push({
          path: file.path,
          loc: {
            start: {
              line: index + 1,
              column: column
            }
          }
        });
      }
    });
  });
  if (references) {
    let quickPickList = references.map(c => {
      return {
        label: `${c.path.replace(root, '')}:${c.loc.start.line}`,
        data: c
      };
    });
    quickPickList.unshift({
      label: '',
      description: `Found ${references.length} command references:`
    });
    window
      .showQuickPick(quickPickList)
      .then(({ data }) => openDocumentAtPosition(data.path, data.loc.start));
  } else {
    window.showInformationMessage(`No references found for: ${commandName}`);
  }
};

module.exports = {
  findUnusedCustomCommands,
  findCustomCommandReferences
};

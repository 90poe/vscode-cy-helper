const { typeDefinitions } = require('./parser/AST');
const { workspace } = require('vscode');
const fs = require('fs-extra');
const { showQuickPickMenu, readFilesFromDir } = require('./helper/utils');
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
  showQuickPickMenu(uniqueCommands, {
    mapperFunction: c => {
      return {
        label: c.name,
        detail: `${c.path
          .replace(root, '')
          .replace(`${customCommandsFolder}/`, '')}:${c.loc.start.line}`,
        data: c
      };
    },
    header: `Found ${uniqueCommands.length} not used Cypress custom commands:`,
    notFoundMessage: 'No unused Cypress custom commands found'
  });
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
  showQuickPickMenu(references, {
    mapperFunction: c => {
      return {
        label: `${c.path.replace(root, '')}:${c.loc.start.line}`,
        data: c
      };
    },
    header: `Found ${references.length} usages of command "${commandName}":`,
    notFoundMessage: `No references found for: "${commandName}"`
  });
};

module.exports = {
  findUnusedCustomCommands,
  findCustomCommandReferences
};

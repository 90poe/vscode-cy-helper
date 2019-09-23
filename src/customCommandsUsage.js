const fs = require('fs-extra');
const _ = require('lodash');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { typeDefinitions } = require('./parser/AST');
const { readFilesFromDir } = require('./helper/utils');
const { message, regexp } = require('./helper/constants');
const { detectCustomCommand } = require('./openCustomCommand');
const { customCommandsFolder } = vscode.config();
const root = vscode.root();

const findCustomCommands = workspaceFiles => {
  const { commandsFound } = typeDefinitions(workspaceFiles, [], {
    includeLocationData: true
  });
  const uniqueCommands = commandsFound.map(found => {
    const { path, loc } = commandsFound.find(
      command => command.name === found.name
    );
    return {
      name: found.name,
      path: path,
      loc: loc
    };
  });
  return uniqueCommands;
};

const findUnusedCustomCommands = () => {
  const workspaceFiles = readFilesFromDir(root);
  let uniqueCommands = findCustomCommands(workspaceFiles);

  for (const file of workspaceFiles) {
    const content = fs.readFileSync(file.path, 'utf-8');
    uniqueCommands = uniqueCommands.filter(
      command => new RegExp(`\\.${command.name}\\(`, 'g').exec(content) === null
    );
  }

  vscode.showQuickPickMenu(uniqueCommands, {
    mapperFunction: c => {
      return {
        label: c.name,
        detail: `${c.path
          .replace(root, '')
          .replace(`${customCommandsFolder}/`, '')}:${c.loc.start.line}`,
        data: c
      };
    },
    header: message.UNUSED_COMMANDS_FOUND(uniqueCommands.length),
    notFoundMessage: message.UNUSED_COMMANDS_NOT_FOUND
  });
};

const findCustomCommandReferences = () => {
  const commandName = detectCustomCommand().replace(regexp.QUOTES, '');
  const commandPattern = new RegExp(`\\.${commandName}\\(`, 'g');
  const workspaceFiles = readFilesFromDir(root);

  const references = _.flatMap(workspaceFiles, file => {
    const content = fs.readFileSync(file.path, 'utf-8').split('\n');
    return content.map((row, index) => {
      const hasCommand = commandPattern.exec(row);
      if (hasCommand) {
        const column = row.indexOf(commandName);
        return {
          path: file.path,
          loc: {
            start: {
              line: index + 1,
              column: column
            }
          }
        };
      }
    });
  }).filter(_.identity);

  vscode.showQuickPickMenu(references, {
    mapperFunction: c => {
      return {
        label: `${c.path.replace(root, '')}:${c.loc.start.line}`,
        data: c
      };
    },
    header: message.REFERENCE_COMMAND_FOUND(references.length, commandName),
    notFoundMessage: message.REFERENCE_NOT_FOUND(commandName)
  });
};

module.exports = {
  findUnusedCustomCommands,
  findCustomCommandReferences
};

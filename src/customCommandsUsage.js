const path = require('path');
const _ = require('lodash');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { typeDefinitions } = require('./parser/AST');
const { readFilesFromDir, readFile } = require('./helper/utils');
const { message, regexp } = require('./helper/constants');
const { detectCustomCommand } = require('./openCustomCommand');
const { customCommandsFolder } = vscode.config();
const root = vscode.root();

const findCustomCommands = workspaceFiles => {
  const { commandsFound } = typeDefinitions(workspaceFiles, [], {
    includeLocationData: true
  });
  return commandsFound.map(found => {
    const { path, loc } = commandsFound.find(
      command => command.name === found.name
    );
    return {
      name: found.name,
      path: path,
      loc: loc
    };
  });
};

const findUnusedCustomCommands = () => {
  const workspaceFiles = readFilesFromDir(root);
  let uniqueCommands = findCustomCommands(workspaceFiles);

  for (const file of workspaceFiles) {
    const content = readFile(file) || '';
    uniqueCommands = uniqueCommands.filter(
      command => new RegExp(`\\.${command.name}\\(`, 'g').exec(content) === null
    );
  }

  vscode.showQuickPickMenu(uniqueCommands, {
    mapperFunction: c => {
      const fileRelativePath = c.path
        .replace(root, '')
        .replace(`${customCommandsFolder}${path.sep}`, '');
      return {
        label: c.name,
        detail: `${fileRelativePath}:${c.loc.start.line}`,
        data: c
      };
    },
    header: message.UNUSED_COMMANDS_FOUND(uniqueCommands.length),
    notFoundMessage: message.UNUSED_COMMANDS_NOT_FOUND
  });
};

/**
 * Detect custom command references
 * returns command name and references array
 */
const customCommandReferences = () => {
  const { commandName: command, err } = detectCustomCommand();
  if (err) {
    vscode.show('err', message.NO_COMMAND_DETECTED(err));
    return;
  }

  if (command) {
    const commandName = command.replace(regexp.QUOTES, '');
    const commandPattern = new RegExp(`\\.${commandName}\\(`, 'g');
    const workspaceFiles = readFilesFromDir(root);

    const references = _.flatMap(workspaceFiles, file => {
      const content = readFile(file) || '';
      return content.split('\n').map((row, index) => {
        const hasCommand = commandPattern.exec(row);
        if (hasCommand) {
          const column = row.indexOf(commandName);
          return {
            path: file,
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

    return {
      commandName: commandName,
      references: references
    };
  }
};

const showCustomCommandReferences = () => {
  const usage = customCommandReferences();
  if (usage) {
    const { commandName, references } = usage;
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
  } else {
    vscode.show('err', message.REFERENCE_NOT_FOUND());
  }
};

module.exports = {
  findUnusedCustomCommands,
  showCustomCommandReferences,
  customCommandReferences
};

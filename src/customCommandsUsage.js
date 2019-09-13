const fs = require('fs-extra');
const { typeDefinitions } = require('./parser/AST');
const {
  showQuickPickMenu,
  readFilesFromDir,
  config,
  root
} = require('./helper/utils');
const { detectCustomCommand } = require('./openCustomCommand');
const { customCommandsFolder } = config;

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
  const commandName = detectCustomCommand().replace(/['"`]/g, '');
  const commandPattern = new RegExp(`\\.${commandName}\\(`, 'g');
  const workspaceFiles = readFilesFromDir(root);

  const references = _.flatten(
    workspaceFiles.map(file => {
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
    })
  ).filter(e => Boolean(e));

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

const path = require('path');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { getTerminal } = require('./helper/terminal');
const { commandForOpen, commandForRun } = vscode.config();

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
const removeSpaces = s => s.replace(/\s/, '\\ ');

exports.openSpecFile = (type, filename) => {
  const pathWithoutSpaces = removeSpaces(filename);

  const absolutePath = pathWithoutSpaces.match(/^[a-z]:\//)
    ? capitalize(pathWithoutSpaces)
    : pathWithoutSpaces;

  const relativePath = path.relative(vscode.root(), pathWithoutSpaces);

  const terminal = getTerminal();
  terminal.show();
  const exec =
    type === 'run'
      ? { command: commandForRun, arg: `--spec "${relativePath}"` }
      : {
          command: commandForOpen,
          arg: `--config testFiles="${absolutePath}"`
        };
  terminal.sendText(`${exec.command} ${exec.arg}`);
};

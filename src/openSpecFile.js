const path = require('path');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { fileExist } = require('./helper/utils');
const { getTerminal } = require('./helper/terminal');
const { commandForOpen, commandForRun } = vscode.config();

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
const removeSpaces = s => s.replace(/\s/, '\\ ');

const findClosestPackageFolder = absolutePath => {
  const cwd = path.dirname(absolutePath);
  return fileExist(path.join(cwd, 'package.json'))
    ? cwd
    : findClosestPackageFolder(cwd);
};

const relativeRootPackage = absolutePath => {
  const closestRoot = findClosestPackageFolder(absolutePath);
  return {
    root: closestRoot,
    relativePath: path.relative(closestRoot, absolutePath)
  };
};

exports.openSpecFile = (type, filename) => {
  const pathWithoutSpaces = removeSpaces(filename);

  const absolutePath = pathWithoutSpaces.match(/^[a-z]:\//)
    ? capitalize(pathWithoutSpaces)
    : pathWithoutSpaces;

  const { root, relativePath } = relativeRootPackage(pathWithoutSpaces);

  const terminal = getTerminal(root);
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

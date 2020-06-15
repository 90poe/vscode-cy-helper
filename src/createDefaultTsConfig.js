const path = require('path');
const fs = require('fs-extra');
const { TSCONFIG_DEFAULT_DATA, message } = require('./helper/constants');
const { readFilesFromDir } = require('./helper/utils');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { customCommandsFolder } = vscode.config();

const writeTsConfig = root => {
  const cypressRoot = path.join(
    root,
    path.normalize(customCommandsFolder.split('cypress')[0]),
    'cypress'
  );
  const tsconfigPath = path.join(cypressRoot, 'tsconfig.json');
  fs.outputFileSync(tsconfigPath, TSCONFIG_DEFAULT_DATA, 'utf-8');
  vscode.show('info', message.TSCONFIG_GENERATED);
  vscode.openDocument(tsconfigPath);
};

const checkTsConfigExist = path => {
  const tsconfig = readFilesFromDir(path, {
    name: 'tsconfig',
    extension: '.json'
  });
  return Boolean(tsconfig.length);
};

const createDefaultTsConfig = () => {
  const root = vscode.root();
  const hasConfig = checkTsConfigExist(root);
  if (hasConfig) {
    vscode.show('err', message.TSCONFIG_EXIST);
  } else {
    writeTsConfig(root);
  }
};

module.exports = {
  checkTsConfigExist,
  writeTsConfig,
  createDefaultTsConfig
};

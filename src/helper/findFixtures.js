const _ = require('lodash');
const { readFilesFromDir } = require('./utils');

/**
 *
 * @param {string} root - vscode workspace absolute path
 * @param {string} text - text to check command which needs autocompletion
 * @param {*} context - autocompletion provider context
 * @param {*} opts - absolutePath option will provide object with absolute and relative path
 */
const findFixtures = (root, text, context, opts = { absolutePath: false }) => {
  // in case of triggering autocomplete for subfolders - detect last folder from already used
  const firstAutocompletion =
    context.triggerCharacter === '(' || context.triggerCharacter === '"';
  const baseFolder = firstAutocompletion
    ? 'fixtures'
    : `fixtures/**/${_.last(text.slice(0, -1).split(/"|'|`/))}`;
  if (!baseFolder) {
    return undefined;
  }

  // get fs path for fixtures
  const fixtures =
    readFilesFromDir(`${root}/**/${baseFolder}`, {
      extension: '',
      name: ''
    }) || [];

  // find files and folders that are right inside of base folder
  if (fixtures) {
    return fixtures
      .map(fixture => {
        const folders = fixture.split('/');
        const baseFolderIndex = folders.indexOf(_.last(baseFolder.split('/')));
        const relativePath =
          baseFolderIndex === -1 ? null : folders[baseFolderIndex + 1];
        return opts.absolutePath
          ? {
              absolute: fixture,
              relative: relativePath
            }
          : relativePath;
      })
      .filter(_.identity);
  }
};

module.exports = {
  findFixtures
};

const fs = require('fs-extra');
const _ = require('lodash');
const glob = require('fast-glob');
const VS = require('./vscodeWrapper');
const vscode = new VS();

/**
 * clear path from odd slashes
 * @param {string} path
 */

const sanitizePath = path =>
  path.split('/').filter(_.identity).join('/').replace(/\\/g, '/');

/**
 * Read files recursively from directory
 * @param {string} folder
 * @param {object} opts
 */
const readFilesFromDir = (
  folder,
  opts = { extension: '.js', name: undefined }
) => {
  try {
    const pattern = `${sanitizePath(folder)}/**/${opts.name || '*'}${
      opts.extension || ''
    }`;
    const files = glob.sync(pattern, {
      onlyFiles: true,
      absolute: true,
      suppressErrors: true,
      ignore: '**/node_modules/**'
    });
    return files.filter(f => f.includes('.'));
  } catch (er) {
    vscode.show('error', er.message);
    return [];
  }
};

/**
 * Read file content
 * @param {string} path
 */
const readFile = path =>
  (fs.pathExistsSync(sanitizePath(path)) &&
    fs.readFileSync(sanitizePath(path), 'utf-8')) ||
  null;

/**
 * Prompts user to reload editor window in order for configuration change to take effect.
 */
function promptToReloadWindow() {
  const action = 'Reload';
  vscode
    .show(
      'info',
      `Please reload window in order for changes in extension "Cypress Helper" configuration to take effect.`,
      false,
      action
    )
    .then(selectedAction => {
      if (selectedAction === action) {
        vscode.execute('workbench.action.reloadWindow');
      }
    });
}

module.exports = {
  readFilesFromDir,
  readFile,
  promptToReloadWindow
};

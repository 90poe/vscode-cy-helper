const path = require('path');
const fs = require('fs-extra');
const glob = require('fast-glob');
const VS = require('./vscodeWrapper');
const vscode = new VS();

/**
 * Read files recursively from directory
 * @param {string} folder
 * @param {object} opts
 */
const readFilesFromDir = (
  folder,
  opts = { extension: '.[j|t]s', name: undefined }
) => {
  try {
    const pattern = `${path.normalize(folder).replace(/\\/g, '/')}/**/${
      opts.name || '*'
    }${opts.extension || ''}`;
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
 * Check if given path existing
 * @param {string} filepath
 */
const fileExist = filepath => fs.pathExistsSync(filepath);

/**
 * Read file content
 * @param {string} filepath
 */
const readFile = filepath =>
  (fs.pathExistsSync(path.resolve(filepath)) &&
    fs.readFileSync(path.resolve(filepath), 'utf-8')) ||
  null;

/**
 * Prompts user to reload editor window in order for configuration change to take effect.
 */
function promptToReloadWindow(event) {
  const shouldReload = event.affectsConfiguration('cypressHelper');
  if (shouldReload) {
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
}

module.exports = {
  readFilesFromDir,
  readFile,
  fileExist,
  promptToReloadWindow
};

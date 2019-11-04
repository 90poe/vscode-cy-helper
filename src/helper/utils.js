const fs = require('fs-extra');
const _ = require('lodash');
const minimatch = require('minimatch');
const VS = require('./vscodeWrapper');
const vscode = new VS();

/**
 * Initially get all workspace files
 */
let indexedFiles = vscode.workspaceFiles();

/**
 * clear path from odd slashes
 * @param {string} path
 */

const sanitizePath = path =>
  path
    .split('/')
    .filter(_.identity)
    .join('/');

/**
 * Check if we should trigger scanning workspace files
 * when `onDidSaveTextDocument` event comes
 * update `indexedFiles` variable when new file added
 * @param {string} savedFileName
 */
const updateWorkspaceFiles = savedFileName => {
  const indexedPaths = indexedFiles.map(f => f.path);
  if (!indexedPaths.includes(savedFileName)) {
    indexedFiles = vscode.workspaceFiles();
  }
};

/**
 * Read files recursively from directory
 * @param {string} folder
 * @param {object} opts
 */
const readFilesFromDir = (folder, opts = { extension: '.js', name: '' }) =>
  indexedFiles.filter(
    ({ path }) =>
      minimatch(path, `**/${sanitizePath(folder)}/**/*`) &&
      path.endsWith(`${opts.name || ''}${opts.extension || ''}`)
  );

/**
 * Read file content
 * @param {string} path
 */
const readFile = path =>
  (fs.pathExistsSync(sanitizePath(path)) &&
    fs.readFileSync(sanitizePath(path), 'utf-8')) ||
  null;

module.exports = {
  readFilesFromDir,
  updateWorkspaceFiles,
  readFile
};

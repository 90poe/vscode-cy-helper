const klawSync = require('klaw-sync');

/**
 * Read files recursively from directory
 * @param {string} folder
 * @param {object} opts
 */
const readFilesFromDir = (folder, opts = { extension: '.js', name: '' }) =>
  klawSync(folder, {
    traverseAll: true,
    nodir: true,
    filter: ({ path }) =>
      !path.includes('node_modules') &&
      path.endsWith(`${opts.name || ''}${opts.extension || ''}`)
  }) || [];

module.exports = {
  readFilesFromDir
};

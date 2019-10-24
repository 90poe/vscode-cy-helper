const klawSync = require('klaw-sync');

/**
 * Read files recursively from directory
 * @param {string} folder
 * @param {object} opts
 */
const readFilesFromDir = (folder, opts = { extension: '.js', name: '' }) => {
  try {
    const files =
      klawSync(folder, {
        traverseAll: true,
        nodir: true,
        filter: ({ path }) =>
          !path.includes('node_modules') &&
          path.endsWith(`${opts.name || ''}${opts.extension || ''}`)
      }) || [];
    return files;
  } catch (er) {
    // eslint-disable-next-line no-console
    console.error(er);
    return [];
  }
};

module.exports = {
  readFilesFromDir
};

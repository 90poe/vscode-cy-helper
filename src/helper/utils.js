const { workspace, window, Position, Selection } = require('vscode');
const _ = require('lodash');
const klawSync = require('klaw-sync');
const { message } = require('./constants');

const root = workspace.workspaceFolders[0].uri.fsPath;
const config = workspace.getConfiguration().cypressHelper;

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

/**
 * Open document in vscode
 * @param {*} path
 */
const openDocument = path => {
  return workspace.openTextDocument(path).then(doc => {
    return window.showTextDocument(doc, { preview: false });
  });
};

/**
 * Open document and set cursor to position
 * @param {*} path
 * @param {*} position
 */
const openDocumentAtPosition = (path, position) => {
  openDocument(path).then(doc => {
    const { line, column } = position;
    const p = new Position(line - 1, column);
    const s = new Selection(p, p);
    doc.selection = s;
    doc.revealRange(s, 1);
  });
};

/**
 * Show vscode quick pick menu
 * @param {*} array
 * @param {*} opts
 */
const showQuickPickMenu = (
  array,
  opts = {
    mapperFunction: () => {
      return {
        label: '',
        detail: '',
        data: ''
      };
    },
    header: 'Quick pick header',
    notFoundMessage: message.DEFAULT_NO_ITEMS_QUICKMENU
  }
) => {
  if (array.length) {
    const quickPickList = array.map(opts.mapperFunction);

    quickPickList.unshift({
      label: '',
      description: opts.header
    });

    window
      .showQuickPick(quickPickList)
      .then(({ data }) =>
        openDocumentAtPosition(data.path, _.get(data, 'loc.start') || data.loc)
      );
  } else {
    show('Info', opts.notFoundMessage);
  }
};

/**
 * Show user notification
 * @param {string} level - info | warn | err
 * @param {string} notification - message
 * @param {boolean} isModal - show window with confirmation
 */
const show = (level, notification, isModal = false) => {
  const levels = ['Information', 'Warning', 'Error'];
  const method =
    levels.find(
      l => level.charAt(0).toLowerCase() === l.charAt(0).toLowerCase()
    ) || levels[0];
  window[`show${method}Message`](notification, {
    modal: isModal
  });
};

/**
 * Edit document at position
 * @param {*} position
 * @param {*} newText
 */
const editDocument = (position, newText) => {
  const editor = window.activeTextEditor;
  editor
    .edit(editBuilder => {
      _.isArray(position)
        ? position.map((p, i) => editBuilder.replace(p, newText[i]))
        : editBuilder.replace(position, newText);
    })
    .then(() => {
      editor.document.save();
    });
};

module.exports = {
  readFilesFromDir,
  openDocument,
  editDocument,
  openDocumentAtPosition,
  showQuickPickMenu,
  config,
  root,
  show
};

const { workspace, window, Position, Selection } = require('vscode');
const _ = require('lodash');
const klawSync = require('klaw-sync');

const root = workspace.workspaceFolders[0].uri.fsPath;

const readFilesFromDir = (folder, opts = { extension: '.js', name: '' }) =>
  klawSync(folder, {
    traverseAll: true,
    nodir: true,
    filter: ({ path }) =>
      !path.includes('node_modules') &&
      path.endsWith(`${opts.name || ''}${opts.extension || ''}`)
  }) || [];

const openDocumentAtPosition = (path, position) => {
  workspace.openTextDocument(path).then(doc => {
    window.showTextDocument(doc, { preview: false }).then(doc => {
      const { line, column } = position;
      const p = new Position(line - 1, column);
      const s = new Selection(p, p);
      doc.selection = s;
      doc.revealRange(s, 1);
    });
  });
};

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
    notFoundMessage: 'Not found items for quick pick menu'
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
    window.showInformationMessage(opts.notFoundMessage);
  }
};

module.exports = {
  readFilesFromDir,
  openDocumentAtPosition,
  showQuickPickMenu,
  root
};

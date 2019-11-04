const vscode = require('vscode');
const _ = require('lodash');
const klawSync = require('klaw-sync');
const { message } = require('./constants');

class VS {
  constructor() {
    const { window, workspace, Position, Selection } = vscode;
    this._window = window;
    this._workspace = workspace;
    this._Position = Position;
    this._Selection = Selection;
  }

  createTerminal(name) {
    return this._window.createTerminal(name);
  }

  activeTextEditor() {
    return this._window.activeTextEditor;
  }

  root() {
    return this._workspace.workspaceFolders[0].uri.fsPath;
  }

  config() {
    return this._workspace.getConfiguration().cypressHelper;
  }

  Position(coordinates) {
    return new this._Position(coordinates);
  }

  showQuickPick(items) {
    return this._window.showQuickPick(items);
  }

  /**
   * Open document in vscode
   * @param {*} path
   */
  openDocument(path) {
    return this._workspace.openTextDocument(path).then(doc => {
      return this._window.showTextDocument(doc, { preview: false });
    });
  }

  /**
   * Open document and set cursor to position
   * @param {*} path
   * @param {*} position
   */
  openDocumentAtPosition(path, position) {
    this.openDocument(path).then(doc => {
      const { line, column } = position;
      const p = new this._Position(line - 1, column);
      const s = new this._Selection(p, p);
      doc.selection = s;
      doc.revealRange(s, 1);
    });
  }

  /**
   * Show user notification
   * @param {string} level - info | warn | err
   * @param {string} notification - message
   * @param {boolean} isModal - show window with confirmation
   */
  show(level, notification, isModal = false) {
    const levels = ['Information', 'Warning', 'Error'];
    const method =
      levels.find(
        l => level.charAt(0).toLowerCase() === l.charAt(0).toLowerCase()
      ) || levels[0];
    this._window[`show${method}Message`](notification, {
      modal: isModal
    });
  }

  /**
   * Show vscode quick pick menu
   * @param {*} array
   * @param {*} opts
   */
  showQuickPickMenu(
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
  ) {
    if (array.length) {
      const quickPickList = array.map(opts.mapperFunction);

      quickPickList.unshift({
        label: '',
        description: opts.header
      });

      this.showQuickPick(quickPickList).then(({ data }) =>
        this.openDocumentAtPosition(
          data.path,
          _.get(data, 'loc.start') || data.loc
        )
      );
    } else {
      this.show('Info', opts.notFoundMessage);
    }
  }

  /**
   * Edit document at position
   * @param {*} position
   * @param {*} newText
   */
  editDocument(position, newText) {
    const editor = this.activeTextEditor();
    editor
      .edit(editBuilder => {
        _.isArray(position)
          ? position.map((p, i) => editBuilder.replace(p, newText[i]))
          : editBuilder.replace(position, newText);
      })
      .then(() => {
        editor.document.save();
      });
  }
  /**
   * Read files recursively from workspace root
   * @param {string} folder
   */
  workspaceFiles() {
    try {
      const files =
        klawSync(this.root(), {
          traverseAll: true,
          nodir: true,
          filter: ({ path }) => !path.includes('node_modules')
        }) || [];
      return files;
    } catch (er) {
      return [];
    }
  }
}

module.exports = VS;

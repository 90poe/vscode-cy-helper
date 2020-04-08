const vscode = require('vscode');
const _ = require('lodash');
const { message } = require('./constants');

class VS {
  constructor() {
    const {
      window,
      workspace,
      Position,
      Selection,
      Range,
      commands,
      Uri,
      Location,
      TextEdit
    } = vscode;
    this._window = window;
    this._workspace = workspace;
    this._Position = Position;
    this._Range = Range;
    this._Selection = Selection;
    this._commands = commands;
    this._URI = Uri;
    this._Location = Location;
    this._TextEdit = TextEdit;
  }

  execute(command) {
    return this._commands.executeCommand(command);
  }

  createTerminal(name) {
    return this._window.createTerminal(name);
  }

  activeTextEditor() {
    return this._window.activeTextEditor;
  }

  parseUri(path) {
    return this._URI.file(path);
  }

  location(uri, pos) {
    return new this._Location(uri, pos);
  }

  root() {
    return this._workspace.workspaceFolders[0].uri.fsPath;
  }
  /**
   * @typedef config
   * @property {string} commandForOpen
   * @property {string} customCommandsFolder
   * @property {string} typeDefinitionFile
   * @property {array} typeDefinitionExcludePatterns
   * @property {boolean} includeAnnotationForCommands
   * @property {object} menuItems
   * @property {array} fixtureAutocompletionCommands
   * @property {object} cucumberTagsAutocomplete
   * @property {boolean} enableCommandReferenceProvider
   * @property {boolean} cucumberFixtureAutocompleteOnQuotes
   * @returns {config}
   */
  config() {
    return this._workspace.getConfiguration().cypressHelper;
  }

  Position(coordinates, characters) {
    return new this._Position(coordinates, characters);
  }

  Range(start, end) {
    return new this._Range(start, end);
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
    if (path) {
      this.openDocument(path).then(doc => {
        const { line, column } = position;
        const p = new this._Position(line - 1, column);
        const s = new this._Selection(p, p);
        doc.selection = s;
        doc.revealRange(s, 1);
      });
    }
  }

  /**
   * Show user notification
   * @param {string} level - info | warn | err
   * @param {string} notification - message
   * @param {boolean} isModal - show window with confirmation
   */
  show(level, notification, isModal = false, ...items) {
    const levels = ['Information', 'Warning', 'Error'];
    const method =
      levels.find(
        l => level.charAt(0).toLowerCase() === l.charAt(0).toLowerCase()
      ) || levels[0];
    return this._window[`show${method}Message`](
      notification,
      {
        modal: isModal
      },
      ...items
    );
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

      this.showQuickPick(quickPickList).then(pick => {
        if (pick) {
          const { data } = pick;
          this.openDocumentAtPosition(
            data.path,
            _.get(data, 'loc.start') || data.loc
          );
        }
      });
    } else {
      this.show('Info', opts.notFoundMessage);
    }
  }

  /**
   * Edit document at position
   * @param {Position} position
   * @param {string} newText
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
   * replace text in document
   * used in completion providers
   * @param {Range} range
   * @param {string} newText
   */
  replaceText(range, newText) {
    return this._TextEdit.replace(range, newText);
  }
}

module.exports = VS;

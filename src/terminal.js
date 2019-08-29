const vscode = require('vscode');
const { window } = vscode;
const { TERMINAL_NAME, FOCUS_TAG, ONLY_BLOCK } = require('./constants');

let _activeTerminal = null;

const removeTags = terminal => {
  if (terminal.name === TERMINAL_NAME) {
    if (!terminal.disposed) {
      disposeTerminal();
    }
    let editor = window.activeTextEditor;
    let fullText = editor.document.getText().split('\n');
    editor
      .edit(editBuilder => {
        let focused = fullText
          .map((line, row) => {
            if (
              line.trim().startsWith(FOCUS_TAG) ||
              line.trim().includes(ONLY_BLOCK)
            ) {
              return row;
            }
          })
          .filter(e => Boolean(e));
        focused.map(row => {
          let { text, range } = editor.document.lineAt(row);
          let newText = text.replace(FOCUS_TAG, '').replace(ONLY_BLOCK, '');
          editBuilder.replace(range, newText);
        });
      })
      .then(() => {
        editor.document.save();
      });
  }
};

const createTerminal = () => {
  _activeTerminal = window.createTerminal(TERMINAL_NAME);
  return _activeTerminal;
};

const disposeTerminal = () => {
  _activeTerminal.disposed = true;
  _activeTerminal.dispose();
  _activeTerminal = null;
};

const getTerminal = () => {
  if (_activeTerminal) {
    _activeTerminal.reused = true;
  } else {
    createTerminal();
  }
  return _activeTerminal;
};

module.exports = {
  getTerminal: getTerminal,
  removeTags: removeTags
};

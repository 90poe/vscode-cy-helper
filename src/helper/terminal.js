const _ = require('lodash');
const VS = require('./vscodeWrapper');
const vscode = new VS();
const { TERMINAL_NAME, FOCUS_TAG, ONLY_BLOCK } = require('./constants');
const reuseTerminal = vscode.config().reuseTerminalInstance;

let _activeTerminal = null;

const removeTags = terminal => {
  if (terminal.name === TERMINAL_NAME) {
    if (!terminal.disposed) {
      disposeTerminal();
    }

    const editor = vscode.activeTextEditor();
    const fullText = editor.document.getText().split('\n');

    const testIndexes = fullText
      .map((line, index) => {
        if (
          line.trim().startsWith(FOCUS_TAG.trim()) ||
          line.trim().includes(ONLY_BLOCK)
        ) {
          return index;
        }
      })
      .filter(_.identity);

    const newTexts = [];
    const testLocation = testIndexes.map(index => {
      const { text, range } = editor.document.lineAt(index);
      const newText = text.replace(FOCUS_TAG, '').replace(ONLY_BLOCK, '');
      newTexts.push(newText);
      return range;
    });

    vscode.editDocument(testLocation, newTexts);
  }
};

const createTerminal = cwd => {
  _activeTerminal = vscode.createTerminal({
    name: TERMINAL_NAME,
    cwd: cwd
  });
  _activeTerminal.cwd = cwd;
  return _activeTerminal;
};

const disposeTerminal = () => {
  _activeTerminal.disposed = true;
  _activeTerminal.dispose();
  _activeTerminal = null;
};

const getTerminal = cwd => {
  if (!reuseTerminal) {
    _activeTerminal && disposeTerminal();
  }
  const currentDir = cwd || vscode.root();
  if (!_activeTerminal || _activeTerminal.cwd !== currentDir) {
    createTerminal(cwd);
  }
  return _activeTerminal;
};

module.exports = {
  getTerminal,
  removeTags
};

const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { getTerminal } = require('./helper/terminal');
const { commandForOpen } = vscode.config();

exports.openSpecFile = () => {
  const editor = vscode.activeTextEditor();
  const spec = editor.document.fileName;
  const terminal = getTerminal();
  terminal.show();
  terminal.sendText(`${commandForOpen} --config testFiles=${spec}`);
};

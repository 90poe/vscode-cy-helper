const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { getTerminal } = require('./helper/terminal');
const { commandForOpen } = vscode.config();

exports.openSpecFile = filename => {
  const terminal = getTerminal();
  terminal.show();
  terminal.sendText(`${commandForOpen} --config testFiles=${filename}`);
};

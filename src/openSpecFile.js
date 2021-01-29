const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { getTerminal } = require('./helper/terminal');
const { commandForOpen, commandForRun } = vscode.config();

exports.openSpecFile = (type, filename) => {
  const terminal = getTerminal();
  terminal.show();
  const exec =
    type === 'run'
      ? { command: commandForRun, arg: `--spec "${filename}"` }
      : { command: commandForOpen, arg: `--config testFiles="${filename}"` };
  terminal.sendText(`${exec.command} ${exec.arg}`);
};

const { window, workspace } = require('vscode');
const { getTerminal } = require('./helper/terminal');

const { commandForOpen } = workspace.getConfiguration().cypressHelper;

exports.openSpecFile = () => {
  const spec = window.activeTextEditor.document.fileName;
  const terminal = getTerminal();
  terminal.show();
  terminal.sendText(`${commandForOpen} --config testFiles=${spec}`);
};

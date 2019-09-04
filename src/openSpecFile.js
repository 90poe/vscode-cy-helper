const { window, workspace } = require('vscode');
const { getTerminal } = require('./helper/terminal');

let { commandForOpen } = workspace.getConfiguration().cypressHelper;

exports.openSpecFile = () => {
  let spec = window.activeTextEditor.document.fileName;
  let terminal = getTerminal();
  terminal.show();
  terminal.sendText(`${commandForOpen} --config testFiles=${spec}`);
};

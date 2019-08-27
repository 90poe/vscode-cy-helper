const { window, workspace } = require('vscode');
const { getTerminal } = require('./terminal');

let {
  packageManager,
  commandForOpen
} = workspace.getConfiguration().cypressHelper;

exports.openSpecFile = () => {
  let currentlyOpenTabfilePath = window.activeTextEditor.document.fileName;
  let terminal = getTerminal();
  terminal.show();
  terminal.sendText(
    `${packageManager} ${commandForOpen} --config testFiles=${currentlyOpenTabfilePath}`
  );
};

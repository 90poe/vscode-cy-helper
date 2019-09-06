const { window } = require('vscode');
const { getTerminal } = require('./helper/terminal');
const { config } = require('./helper/utils');
const { commandForOpen } = config;

exports.openSpecFile = () => {
  const spec = window.activeTextEditor.document.fileName;
  const terminal = getTerminal();
  terminal.show();
  terminal.sendText(`${commandForOpen} --config testFiles=${spec}`);
};

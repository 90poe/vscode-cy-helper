const { typeDefinitions, supportFiles } = require('./astParser');
const vscode = require('vscode');
const { workspace, window } = vscode;
const fs = require('fs-extra');

exports.findUnusedCustomCommands = () => {
  let root = workspace.rootPath;
  let workspaceFiles = supportFiles(root);
  let { commandsFound } = typeDefinitions(workspaceFiles, [], {
    includeLocationData: true
  });
  let uniqueCommands = Array.from(new Set(commandsFound.map(c => c.name))).map(
    name => {
      let { path, loc } = commandsFound.find(c => c.name === name);
      return {
        name: name,
        path: path,
        loc: loc
      };
    }
  );
  workspaceFiles.map(file => {
    let content = fs.readFileSync(file.path, 'utf-8');
    uniqueCommands = uniqueCommands.filter(
      command => new RegExp(`\\.${command.name}\\(`, 'g').exec(content) === null
    );
  });
  if (uniqueCommands) {
    let quickPickList = uniqueCommands.map(c => {
      return {
        label: `${c.name}: ${c.path.replace(`${root}/`, '')}:${
          c.loc.start.line
        }`,
        data: c
      };
    });
    quickPickList.unshift({
      label: '',
      description: `Found ${uniqueCommands.length} not used Cypress custom commands`
    });
    window.showQuickPick(quickPickList).then(({ data }) => {
      workspace.openTextDocument(data.path).then(doc => {
        window.showTextDocument(doc).then(doc => {
          let { start, end } = data.loc;
          let p1 = new vscode.Position(start.line - 1, start.column);
          let p2 = new vscode.Position(end.line - 1, end.column);
          let s = new vscode.Selection(p1, p2);
          doc.selection = s;
          doc.revealRange(s, 1);
        });
      });
    });
  } else {
    window.showInformationMessage('No unused Cypress custom commands found');
  }
};

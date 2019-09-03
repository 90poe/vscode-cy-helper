const vscode = require('vscode');
const { window, workspace } = vscode;
const { cypressCommandLocation } = require('./astParser');
const _ = require('lodash');
const { openDocumentAtPosition } = require('./utils');
let { customCommandsFolder } = workspace.getConfiguration().cypressHelper;

const findOverlap = (indexedMatches, target) => {
  return indexedMatches.find(str => target >= str.start && target <= str.end);
};

const findClosestRange = (indexedMatches, target) => {
  return indexedMatches.reduce((prev, curr) =>
    Math.abs(curr.start - target) < Math.abs(prev.start - target) &&
    Math.abs(curr.end - target) < Math.abs(prev.end - target)
      ? curr
      : prev
  );
};

const detectCustomCommand = (opts = { implementation: false }) => {
  let editor = window.activeTextEditor;
  let commandName;
  if (editor.selection.start.character === editor.selection.end.character) {
    let { text: line } = editor.document.lineAt(editor.selection.active.line);
    let commandNamePattern =
      opts.implementation &&
      line.includes("'") &&
      (!line.includes('.') || line.includes('Cypress.Commands.add'))
        ? /['"`].*?['"`]/g
        : /\.(.*?)\(/g;
    let matches = _.flatten(
      line
        .match(commandNamePattern)
        .map(() => commandNamePattern.exec(line).pop())
    );
    const selectionIndex = editor.selection.start.character;
    const indexedMatches = matches.map(m => {
      let index = line.indexOf(m);
      return {
        start: index,
        end: index + m.length,
        match: m
      };
    });
    let closest =
      findOverlap(indexedMatches, selectionIndex) ||
      findClosestRange(indexedMatches, selectionIndex);
    !closest && window.showErrorMessage('Custom command not found');
    commandName = closest.match.trim();
  } else {
    commandName = editor.document.getText(editor.selection);
  }
  return commandName;
};

const openCustomCommand = () => {
  let editor = window.activeTextEditor;
  let root = editor.document.fileName.split('/cypress/').shift();
  let commandName = detectCustomCommand();
  let location = cypressCommandLocation(
    `${root}/${customCommandsFolder}`,
    commandName
  );
  !location && window.showErrorMessage('Custom command not found');
  let openPath = vscode.Uri.file(location.file);
  openDocumentAtPosition(openPath, location.loc);
};

module.exports = {
  openCustomCommand,
  detectCustomCommand
};

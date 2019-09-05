const { window, workspace, Uri } = require('vscode');
const { cypressCommandLocation } = require('./parser/AST');
const _ = require('lodash');
const { openDocumentAtPosition } = require('./helper/utils');
const { customCommandsFolder } = workspace.getConfiguration().cypressHelper;

/**
 * check if target index is inside ranges
 * in case there is several commands used in row
 * @param {*[]} indexedMatches
 * @param {number} target
 */
const findOverlap = (indexedMatches, target) => {
  return indexedMatches.find(str => target >= str.start && target <= str.end);
};

/**
 * in case no overlap found
 * lookup for closest command range
 * in case there is several commands used in row
 * @param {*[]} indexedMatches
 * @param {number} target
 */
const findClosestRange = (indexedMatches, target) => {
  return indexedMatches.reduce((prev, curr) =>
    Math.abs(curr.start - target) < Math.abs(prev.start - target) &&
    Math.abs(curr.end - target) < Math.abs(prev.end - target)
      ? curr
      : prev
  );
};

/**
 *  - find custom command in row with cursor
 *  - check if it declaration: `Cypress.Commands.add('command', ...)`
 * or usage: `.command()`
 * @param {*} opts
 */
const detectCustomCommand = (opts = { implementation: false }) => {
  const editor = window.activeTextEditor;
  let commandName;
  if (editor.selection.start.character === editor.selection.end.character) {
    const { text: line } = editor.document.lineAt(editor.selection.active.line);
    const commandNamePattern =
      opts.implementation &&
      (line.includes("'") || line.includes('"')) &&
      (!line.includes('.') || line.includes('Cypress.Commands.add'))
        ? /['"`].*?['"`]/g
        : /\.(.*?)\(/g;
    const match = line.match(commandNamePattern);
    !match && window.showWarningMessage('Cannot find command');
    const matches = _.flatten(
      match.map(() => commandNamePattern.exec(line).pop())
    );
    const selectionIndex = editor.selection.start.character;
    const indexedMatches = matches.map(m => {
      const index = line.indexOf(m);
      return {
        start: index,
        end: index + m.length,
        match: m
      };
    });
    const closest =
      findOverlap(indexedMatches, selectionIndex) ||
      findClosestRange(indexedMatches, selectionIndex);
    !closest && window.showErrorMessage('Custom command not found');
    commandName = closest.match.trim();
  } else {
    commandName = editor.document.getText(editor.selection);
  }
  return commandName;
};

/**
 *  - get command name
 *  - find its location
 *  - open document with cursor on command definition
 */
const openCustomCommand = () => {
  const editor = window.activeTextEditor;
  const root = editor.document.fileName.split('/cypress/').shift();
  const commandName = detectCustomCommand();
  const location = cypressCommandLocation(
    `${root}/${customCommandsFolder}`,
    commandName
  );
  !location && window.showErrorMessage('Custom command not found');
  const openPath = Uri.file(location.file);
  openDocumentAtPosition(openPath, location.loc);
};

module.exports = {
  openCustomCommand,
  detectCustomCommand
};

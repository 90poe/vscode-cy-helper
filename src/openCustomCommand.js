const _ = require('lodash');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { cypressCommandLocation } = require('./parser/AST');
const { message, regexp, CYPRESS_COMMAND_ADD } = require('./helper/constants');
const { customCommandsFolder } = vscode.config();
const root = vscode.root();

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
 */
const detectCustomCommand = () => {
  const editor = vscode.activeTextEditor();
  let commandName;

  if (editor.selection.start.character === editor.selection.end.character) {
    const { text: line } = editor.document.lineAt(editor.selection.active.line);
    const declarationExpression =
      line.includes(CYPRESS_COMMAND_ADD) ||
      line.endsWith("',") ||
      line.endsWith('",');
    const implementationExpression = line.includes('.') && line.includes('(');

    let pattern;
    if (declarationExpression) {
      pattern = regexp.COMMAND_DECLARATION;
    } else if (implementationExpression) {
      pattern = regexp.COMMAND_USAGE;
    } else {
      pattern = regexp.TS_DEFINITION;
    }

    const match = line.match(pattern);
    if (!match) {
      return undefined;
    }

    const matches = _.flatMap(match, () => pattern.exec(line).pop());
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

    if (!closest) {
      return undefined;
    }

    commandName = closest.match
      .split('.')
      .pop()
      .trim();
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
  const commandName = detectCustomCommand();
  !commandName && vscode.show('err', message.NO_COMMAND);
  const { file, loc } =
    cypressCommandLocation(`${root}/${customCommandsFolder}`, commandName) ||
    vscode.show('err', message.NO_COMMAND);
  !file && vscode.show('err', message.NO_COMMAND);
  vscode.openDocumentAtPosition(file, loc);
};

module.exports = {
  openCustomCommand,
  detectCustomCommand
};

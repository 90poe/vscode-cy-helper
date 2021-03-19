const _ = require('lodash');
const traverse = require('@babel/traverse');
const { parseText } = require('../parser/AST');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();

const keyPressEvents = {
  '{': 'Types the literal { key',
  backspace: 'Deletes character to the left of the cursor',
  del: 'Deletes character to the right of the cursor',
  downarrow: 'Moves cursor down',
  end: 'Moves cursor to the end of the line',
  enter: 'Types the Enter key',
  esc: 'Types the Escape key',
  home: 'Moves cursor to the start of the line',
  insert: 'Inserts character to the right of the cursor',
  leftarrow: 'Moves cursor left',
  movetoend: 'Moves cursor to end of typeable element',
  movetostart: 'Moves cursor to the start of typeable element',
  pagedown: 'Scrolls down',
  pageup: 'Scrolls up',
  rightarrow: 'Moves cursor right',
  selectall: 'Selects all text by creating a selection range',
  uparrow: 'Moves cursor up',
  alt: 'Activates the altKey modifier. Aliases: {option}',
  option: 'Activates the option modifier. Aliases: {alt}',
  ctrl: 'Activates the ctrlKey modifier. Aliases: {control}',
  control: 'Activates the ctrlKey modifier. Aliases: {ctrl}',
  meta: 'Activates the metaKey modifier. Aliases: {command}, {cmd}',
  command: 'Activates the metaKey modifier. Aliases: {meta}, {cmd}',
  cmd: 'Activates the metaKey modifier. Aliases: {meta}, {command}',
  shift: 'Activates the shiftKey modifier.'
};

const isCyTypeArgument = (documentContent, position) => {
  const AST = parseText(documentContent);
  if (!AST) {
    return;
  }
  let isMatched = false;
  traverse.default(AST, {
    CallExpression(path) {
      if (
        // find .type calls
        _.get(path, 'node.callee.property.type') === 'Identifier' &&
        _.get(path, 'node.callee.property.name') === 'type' &&
        ['StringLiteral', 'TemplateLiteral'].includes(
          _.get(path, 'node.arguments[0].type')
        ) &&
        // current position after cy.type argument start
        _.get(path, 'node.arguments[0].loc.start.line') <= position.line + 1 &&
        _.get(path, 'node.arguments[0].loc.start.column') <=
          position.character &&
        // current position before cy.type argument end
        _.get(path, 'node.arguments[0].loc.start.line') >= position.line + 1 &&
        _.get(path, 'node.arguments[0].loc.end.column') >= position.character
      ) {
        isMatched = true;
      }
    }
  });
  return isMatched;
};

class TypeKeypressEventsProvider {
  provideCompletionItems(document, position) {
    if (!isCyTypeArgument(document.getText(), position)) {
      return;
    }

    const nextCharacter = document.getText(
      vscode.Range(
        vscode.Position(position.line, position.character),
        vscode.Position(position.line, position.character + 1)
      )
    );

    return {
      items: Object.keys(keyPressEvents).reduce((completions, name) => {
        completions.push({
          label: name,
          detail: keyPressEvents[name],
          // completion item of enum kind
          kind: 12,
          insertText: `${name}${nextCharacter === '}' ? '' : '}'}`
        });
        return completions;
      }, [])
    };
  }
}

module.exports = TypeKeypressEventsProvider;

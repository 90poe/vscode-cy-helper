const _ = require('lodash');
const path = require('path');
const traverse = require('@babel/traverse');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { readFilesFromDir } = require('../helper/utils');
const { parseJS, parseText } = require('../parser/AST');

const aliasPattern = new RegExp(/\([\"\'](@.*?)[\"\']\)/);

const traverseForAlias = document => {
  const currentFolder = path.dirname(document.fileName);
  const files = readFilesFromDir(currentFolder, {
    extension: `\.[jt]s`
  }).filter(file => file !== document.fileName);
  const aliases = [];

  // add current unsaved file changes to track unsaved aliases also
  files.unshift(document.getText());

  files.forEach((file, index) => {
    const AST = index === 0 ? parseText(file) : parseJS(file);
    if (!AST) {
      return;
    }
    traverse.default(AST, {
      CallExpression(path) {
        if (
          _.get(path, 'node.callee.property.type') === 'Identifier' &&
          _.get(path, 'node.callee.property.name') === 'as'
        ) {
          const literal = _.get(path, 'node.arguments[0]');
          aliases.push({
            name: literal.value,
            loc: literal.loc,
            path: file
          });
        }
      }
    });
  });
  return aliases;
};

class AliasDefinitionProvider {
  provideDefinition(document, position) {
    const line = document.lineAt(position.line);
    const matches = aliasPattern.exec(line.text);
    if (!matches) {
      return;
    }
    const aliases = traverseForAlias(document);
    if (aliases.length) {
      const match = matches.pop().replace('@', '');
      const alias = aliases.find(a => a.name === match);
      if (!alias) {
        return;
      }
      const { start, end } = alias.loc;
      const targetRange = vscode.Range(
        vscode.Position(start.line - 1, start.column),
        vscode.Position(end.line - 1, end.column)
      );
      return vscode.location(vscode.parseUri(alias.path), targetRange);
    }
  }
}

module.exports = {
  AliasDefinitionProvider,
  traverseForAlias
};

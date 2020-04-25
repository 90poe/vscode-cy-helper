const path = require('path');
const _ = require('lodash');
const traverse = require('@babel/traverse');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { parseJS } = require('../parser/AST');
const { readFile, readFilesFromDir } = require('../helper/utils');
const root = vscode.root();
const { fixtureAutocompletionCommands } = vscode.config();

const matchInQuotes = new RegExp('\\"(.*?)\\"');
const matchInExamples = new RegExp('\\|(.*?)\\|');

const traverseForFixture = (file, position) => {
  let fixtureValue;
  const AST = parseJS(file);
  if (!AST) {
    return;
  }
  traverse.default(AST, {
    CallExpression(path) {
      if (
        _.get(path, 'node.callee.object.name') === 'cy' &&
        fixtureAutocompletionCommands.some(
          c => c === _.get(path, 'node.callee.property.name')
        )
      ) {
        const stringLiteral = _.get(path, 'node.arguments[0]');
        const { start, end } = stringLiteral.loc;
        if (
          stringLiteral &&
          position.line + 1 === start.line &&
          position.character >= start.column &&
          position.character <= end.column
        ) {
          fixtureValue = stringLiteral.value;
        }
      }
    }
  });
  return fixtureValue;
};

const parseFixtureFromGherkinFile = (file, position) => {
  const content = readFile(file).split('\n');
  const line = content[position.line];
  const matches = line.includes('|')
    ? matchInExamples.exec(line)
    : matchInQuotes.exec(line);
  if (!matches.length) {
    return;
  }
  const fixtures = readFilesFromDir(path.join(root, 'cypress', 'fixtures'), {
    extension: '*',
    name: '*'
  }).map(f => f.split('fixtures').pop().replace(/^\//, ''));
  const match = matches
    .map(m => m.replace(/\"|\'|\s/g, ''))
    .find(match => fixtures.some(f => f.startsWith(match)));
  return match;
};

class FixtureDefinitionProvider {
  provideDefinition(document, position) {
    const fixtureName =
      document.languageId === 'feature'
        ? parseFixtureFromGherkinFile(document.fileName, position)
        : traverseForFixture(document.fileName, position);
    if (fixtureName) {
      let filePath = path.join(root, 'cypress', 'fixtures', fixtureName);
      !path.extname(filePath) && (filePath += '.json');
      const targetPosition = vscode.Position(0, 0);
      return vscode.location(vscode.parseUri(filePath), targetPosition);
    }
  }
}

module.exports = FixtureDefinitionProvider;

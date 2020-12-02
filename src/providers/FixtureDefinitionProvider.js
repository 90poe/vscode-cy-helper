const path = require('path');
const _ = require('lodash');
const traverse = require('@babel/traverse');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { parseJS } = require('../parser/AST');
const { readFile, fileExist } = require('../helper/utils');
const root = vscode.root();
const { fixtureAutocompletionCommands } = vscode.config();

const matchInQuotes = new RegExp(/\"(.*?)\"|\'(.*?)\'/);
const matchInExamples = new RegExp(/\|(.*?)\|/);

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
  if (position.line === 0) {
    return;
  }
  let isExamples;
  for (let i = position.line - 1; i > 0; i--) {
    const previousLine = content[i].trim();
    if (previousLine.startsWith('Examples')) {
      isExamples = true;
      break;
    }
    if (previousLine.startsWith('Scenario')) {
      isExamples = false;
      break;
    }
  }
  const matches = isExamples
    ? matchInExamples.exec(line)
    : matchInQuotes.exec(line);
  if (!matches.length) {
    return;
  }
  const fixtureName = _.chain(matches)
    .filter(_.identity)
    .map(m => m.replace(/\"|\'|\||\s/g, ''))
    .uniq()
    .pop()
    .value();
  return fixtureName;
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
      if (fileExist(filePath)) {
        const targetPosition = vscode.Position(0, 0);
        return vscode.location(vscode.parseUri(filePath), targetPosition);
      }
    }
  }
}

module.exports = FixtureDefinitionProvider;

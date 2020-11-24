const _ = require('lodash');
const { readFile } = require('../helper/utils');
const { findFixtures } = require('../helper/findFixtures');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { menuItems } = vscode.config();
const { mockAutocomplete } = menuItems;
const gqlMockCommands = ['mockGQL', 'mockGQLRemove'];

/**
 * 90poe internal autocompletion provider
 * to get graphQL operationName from fixtures for mock commands
 */
class GQLMockCompletionProvider {
  provideCompletionItems(document, position, token, context) {
    // break if fixture autocomplete is not needed
    if (!mockAutocomplete) {
      return;
    }
    const start = vscode.Position(position.line, 0);
    const range = vscode.Range(start, position);
    const text = document.getText(range);

    // define mock command
    const mockCommand = gqlMockCommands.find(command => {
      const commandPattern = `.${command}(`;
      return (
        text.includes(commandPattern) &&
        // verify that cursor position is after command that require autocomplete
        // but before next chainer
        text
          .substring(text.indexOf(commandPattern), position.character)
          .split('.').length === 2 // [empty string before `.` or `cy`, command string]
      );
    });
    // break if command not detected
    if (!mockCommand) {
      return;
    }

    // array of fixtures with absolute (to read operationName from json) and relative paths (labels)
    const fixtures = findFixtures(vscode.root(), text, context, {
      absolutePath: true
    });

    if (fixtures) {
      // prepare completion items list
      const fixtureResults = _.uniqBy(fixtures, 'relative').reduce(
        (completions, file) => {
          const { absolute, relative } = file;
          const operationName = relative.includes('.json')
            ? operationNameFromFixture(absolute)
            : null;

          /**
           * FILE: 16
           * FOLDER: 18
           */
          const type = relative.includes('.') ? 16 : 18;
          // don't mention other json which are not used for mocking
          if (relative.includes('.json') && operationName === null) {
            return completions;
          }
          const completion = {
            label: relative,
            kind: type,
            insertText:
              context.triggerCharacter === '/' ? relative : `'${relative}'`
          };
          if (operationName) {
            const startReplacement = vscode.Position(
              position.line,
              text.indexOf('(') + 1
            );
            const endReplacement = vscode.Position(
              position.line,
              position.character + 1
            );
            completion.additionalTextEdits = [
              vscode.replaceText(
                vscode.Range(startReplacement, endReplacement),
                ''
              )
            ];
            // for mockGQL populate next argument also
            completion.insertText =
              mockCommand === 'mockGQL'
                ? `'${operationName}', () => ({})`
                : `'${operationName}'`;
          }
          completions.push(completion);
          return completions;
        },
        []
      );
      return {
        items: fixtureResults
      };
    }
  }
}

const operationNameFromFixture = path => {
  const content = readFile(path);
  try {
    const parsed = JSON.parse(content);
    return parsed.request.operationName || parsed.operationName;
  } catch (e) {
    return null;
  }
};

module.exports = GQLMockCompletionProvider;

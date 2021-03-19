const _ = require('lodash');
const traverse = require('@babel/traverse');
const minimatch = require('minimatch');
const { parseText } = require('../parser/AST');
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { jqueryLocators } = vscode.config();
const {
  enabled,
  commandsForAutocompletion,
  customAttributes,
  includePatterns,
  excludePatterns
} = jqueryLocators;
const {
  prefixes,
  core,
  relative,
  pseudo,
  attributes
} = require('../helper/jqueryDocs');

const positionInside = (loc, position) => {
  if (!loc || !position) {
    return;
  }
  // current position after cy.type argument start
  return (
    _.get(loc, 'start.line') <= position.line + 1 &&
    _.get(loc, 'start.column') <= position.character &&
    // current position before cy.type argument end
    _.get(loc, 'start.line') >= position.line + 1 &&
    _.get(loc, 'end.column') >= position.character
  );
};

const fileMatchPatterns = file => {
  const excluded = excludePatterns.some(pattern => minimatch(file, pattern));
  if (excluded) {
    return false;
  }
  return includePatterns.some(pattern => minimatch(file, pattern));
};

const shouldHaveAutocomplete = (documentContent, position) => {
  const AST = parseText(documentContent);
  if (!AST) {
    return;
  }
  const metrics = {
    insideCyCommand: false,
    insideString: false
  };
  traverse.default(AST, {
    enter(path) {
      // should be in string or template literal element and when position is inside location
      if (
        positionInside(_.get(path, 'node.loc'), position) &&
        (_.get(path, 'node.type') === 'StringLiteral' ||
          _.get(path, 'node.type') === 'TemplateElement')
      ) {
        metrics.insideString = true;
      }

      // should check if it is inside cypress commands
      if (
        positionInside(_.get(path, 'node.arguments[0].loc'), position) &&
        _.get(path, 'node.callee.type') === 'MemberExpression' &&
        commandsForAutocompletion.includes(
          _.get(path, 'node.callee.property.name')
        )
      ) {
        metrics.insideCyCommand = true;
      }
    }
  });
  return metrics;
};

class jQueryLocatorCompletionProvider {
  provideCompletionItems(document, position, _, ctx) {
    if (!enabled) {
      return;
    }

    const { insideCyCommand, insideString } = shouldHaveAutocomplete(
      document.getText(),
      position
    );

    if (!insideString) {
      return;
    }

    /**
     * disallow autocomplete when:
     * - file don't match folder from config
     * - current position is not an argument of cyCommand
     */

    if (!fileMatchPatterns(document.fileName) && !insideCyCommand) {
      return;
    }

    const customAttributesItems =
      customAttributes &&
      customAttributes.reduce((items, attr) => {
        items[attr] = '';
        return items;
      }, {});

    const completionByTrigger = {
      '[': Object.assign(attributes, customAttributesItems),
      ':': pseudo,
      '=': prefixes,
      ' ': Object.assign({}, core, relative)
    };

    const items = completionByTrigger[ctx.triggerCharacter];

    if (!items) {
      return;
    }

    const completionItems = Object.keys(items).reduce((completions, name) => {
      const completion = {
        label: name,
        detail: items[name],
        // completion item of enum kind
        kind: 12,
        insertText: vscode.SnippetString(
          name.endsWith('=') ? `${name}$1` : name
        )
      };

      if (name.endsWith('=') || name.startsWith(':')) {
        const startReplacement = vscode.Position(
          position.line,
          position.character - 1
        );
        const endReplacement = vscode.Position(
          position.line,
          position.character
        );
        completion.additionalTextEdits = [
          vscode.replaceText(vscode.Range(startReplacement, endReplacement), '')
        ];
      }

      completions.push(completion);
      return completions;
    }, []);
    return {
      items: completionItems
    };
  }
}

module.exports = jQueryLocatorCompletionProvider;

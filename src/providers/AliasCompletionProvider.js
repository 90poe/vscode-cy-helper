const { traverseForAlias } = require('./AliasDefinitionProvider');

class AliasCompletionProvider {
  provideCompletionItems(document) {
    // look for aliases
    const aliases = traverseForAlias(document);
    // prepare completions list
    const completions = aliases.map(a => ({
      label: a.name,
      // type of completion is Variable
      kind: 11
    }));
    return {
      items: completions
    };
  }
}

module.exports = AliasCompletionProvider;

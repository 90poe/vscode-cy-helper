const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { allureLabels } = require('../helper/constants');
const { cucumberTagsAutocomplete } = vscode.config();
const { enable, allurePlugin, tags } = cucumberTagsAutocomplete;

const prepareSnippetForLabel = label => {
  let snippet = ['tms', 'issue'].includes(label)
    ? `${label}("\${1:name}","\${2:url}")`
    : `${label}("\${1:value}")`;
  return snippet;
};

class CucumberTagsProvider {
  provideCompletionItems() {
    // break if fixture autocomplete is not needed
    if (!enable) {
      return;
    }
    // prepare completions list
    const completions = tags.map(tag => ({
      label: tag,
      // type of completion is enum
      kind: 12,
      insertText: tag
    }));

    allurePlugin &&
      allureLabels.forEach(label =>
        completions.push({
          label: label,
          // type of completion is function
          documentation: ['tms', 'issue'].includes(label)
            ? `Insert link name and url`
            : `Insert value`,
          kind: 2,
          insertText: vscode.SnippetString(prepareSnippetForLabel(label))
        })
      );
    return {
      items: completions
    };
  }
}

module.exports = CucumberTagsProvider;

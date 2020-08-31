const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const { typeDefinitionOnSave } = vscode.config();

exports.regenerateTypes = document => {
  if (!typeDefinitionOnSave) {
    return;
  }

  if (
    document.languageId !== 'javascript' &&
    document.languageId !== 'typescript'
  ) {
    return;
  }

  vscode.execute('cypressHelper.generateCustomCommandTypes', null, true);
};

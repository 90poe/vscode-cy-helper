const { getTerminal } = require('../helper/terminal');

/**
 * 90poe internal command
 * to execute json schema generator binary
 */
exports.openJsonSchemaGenerator = file => {
  const terminal = getTerminal();
  terminal.show();
  terminal.sendText(
    `cypress/scripts/qa-json-schema-generator -fixture ${file.fsPath}`
  );
};

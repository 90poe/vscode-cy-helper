module.exports = {
  FOCUS_TAG: '@focus',
  TEST_BLOCK: 'it(',
  ONLY_BLOCK: '.only',
  TERMINAL_NAME: 'CypressRun',
  TEST_ONLY_BLOCK: 'it.only(',
  SCENARIO: 'Scenario',
  CYPRESS_COMMAND_ADD: 'Cypress.Commands.add',
  CUCUMBER_KEYWORDS: ['given', 'when', 'then', 'Given', 'When', 'Then'],
  message: {
    NO_COMMAND: 'Custom command not found',
    NO_TEST: 'Test not found',
    NO_STEP: 'Step definition not found',
    NO_COMMAND_DUPLICATES: 'Command duplicates not found',

    INVALID_SYNTAX: subject =>
      `Incorrect command syntax:\n${toString(subject)}`,
    DUPLICATED_COMMANDS: subject =>
      `Duplicated commands:\n${toString(subject)}`,

    GENERATED_TYPES: 'Type definitions generated and saved',
    NEW_COMMANDS: commands => `Added command types:\n${toString(commands)}`,
    REMOVED_COMMANDS: commands =>
      `Removed command types:\n${toString(commands)}`,

    DEFAULT_NO_ITEMS_QUICKMENU: 'Items for quick pick menu not found',

    UNUSED_COMMANDS_FOUND: quantity =>
      `Found ${quantity} not used Cypress custom commands:`,
    UNUSED_COMMANDS_NOT_FOUND: 'No unused Cypress custom commands found',

    REFERENCE_COMMAND_FOUND: (quantity, target) =>
      `Found ${quantity} usages of command "${target}":`,
    REFERENCE_NOT_FOUND: target => `No references found for: "${target}"`,

    UNUSED_STEPS_FOUND: quantity =>
      `Found ${quantity} not used Step Definitions:`,
    UNUSED_STEPS_NOT_FOUND: 'No unused step definitions found',

    REFERENCE_STEPS_FOUND: (quantity, target) =>
      `Found ${quantity} usages of step: "${target}":`,
    REFERECE_STEPS_NOT_FOUND: target => `Not found usage for step: "${target}"`
  },
  regexp: {
    TS_DEFINITION: /^ +(.*)\(.*: Chainable<any>$/m,
    STEP_DEFINITION: /['"`/](.*?)['"`/]/g,
    COMMAND_DECLARATION: /['"`].*?['"`]/g,
    COMMAND_USAGE: /\.(.*?)\(/g,
    QUOTES: /['"`]/g
  }
};

const toString = subject => subject.join('\n');

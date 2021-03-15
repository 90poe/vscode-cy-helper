const Parser = require('@babel/parser');
const _ = require('lodash');
const minimatch = require('minimatch');
const { readFilesFromDir, readFile } = require('../helper/utils');
const { CUCUMBER_KEYWORDS, SPACE, regexp } = require('../helper/constants');
const { parseArguments } = require('./parseArguments');

/**
 * AST tree by file path
 */
const parseJS = filepath => {
  try {
    return (
      Parser.parse(readFile(filepath) || '', {
        sourceType: 'module',
        plugins: ['typescript']
      }) || null
    );
  } catch (e) {
    return null;
  }
};

/**
 *
 * AST tree by text
 */
const parseText = text => {
  try {
    return (
      Parser.parse(text || '', {
        sourceType: 'module',
        plugins: ['typescript']
      }) || null
    );
  } catch (e) {
    return null;
  }
};

/**
 * Check if statement is `Cypress.Commands.add`
 */
const findCypressCommandAddStatements = body => {
  return body.filter(
    statement =>
      _.get(statement, 'type') === 'ExpressionStatement' &&
      _.get(statement, 'expression.callee.object.object.name') === 'Cypress' &&
      _.get(statement, 'expression.callee.object.property.name') ===
        'Commands' &&
      _.get(statement, 'expression.callee.property.name') === 'add'
  );
};

/**
 * Retrieve list of commands with type definitions
 */
const customCommandsAvailable = file => {
  try {
    const fileContent = readFile(file) || '';
    const commands = fileContent
      .split('\n')
      .map(row => regexp.TS_DEFINITION.exec(row));
    return commands
      .filter(_.identity)
      .map(item => item.pop().split('(').shift().trim());
  } catch (e) {
    return [];
  }
};

/**
 * Find custom command implementation
 * @param {string} folder - folder with custom commands
 * @param {string} targetCommand - command for search
 */
const cypressCommandLocation = (folder, targetCommand) => {
  const location = readFilesFromDir(folder)
    .map(path => {
      const AST = parseJS(path);
      if (AST) {
        const commands = findCypressCommandAddStatements(AST.program.body);
        const commandNames = commands.map(c => c.expression.arguments[0].value);
        if (commandNames.includes(targetCommand)) {
          const index = commandNames.indexOf(targetCommand);
          const commandBody = commands[index];
          return {
            file: path,
            loc: commandBody.expression.arguments[0].loc.start
          };
        }
      }
    })
    .filter(_.identity);
  return location[0] || null;
};

/**
 *  - Parse files
 *  - Returns array of commands with types
 */
const typeDefinitions = (
  files,
  excludes,
  options = { includeLocationData: false, includeAnnotations: false }
) => {
  const commandsFound = [];
  const suitableFiles = files.filter(path =>
    excludes.every(s => !minimatch(path, s))
  );

  const typeDefs = _.flatMap(suitableFiles, file => {
    const AST = parseJS(file);
    if (AST) {
      const commands = findCypressCommandAddStatements(AST.program.body);
      const typeDefBody = commands.map(command => {
        const { value: commandName, loc } = command.expression.arguments[0];
        commandsFound.push(
          options.includeLocationData
            ? {
                name: commandName,
                path: file,
                loc: loc
              }
            : commandName
        );

        let annotation = '';
        if (options.includeAnnotations) {
          const commentBlock = _.chain(command)
            .get('leadingComments', [null])
            .last()
            .value();
          const comments = commentBlock ? _.get(commentBlock, 'value') : null;
          annotation = comments
            ? `/*${comments.split('\n').join(SPACE)}*/${SPACE}`
            : null;
        }

        const argsArray = parseArguments(command.expression.arguments);
        return `${annotation || ''}${commandName}(${argsArray.join(
          ', '
        )}): Chainable<any>`;
      });
      return typeDefBody;
    }
  }).filter(_.identity);
  return {
    commandsFound: commandsFound,
    typeDefs: typeDefs
  };
};

/**
 * Parse AST body to find cucumber step definition
 * @param {object} body
 */

const findCucumberStepDefinitions = body => {
  return body.filter(
    statement =>
      _.get(statement, 'type') === 'ExpressionStatement' &&
      _.get(statement, 'expression.type') === 'CallExpression' &&
      _.get(statement, 'expression.callee.type') === 'Identifier' &&
      CUCUMBER_KEYWORDS.includes(_.get(statement, 'expression.callee.name'))
  );
};

/**
 * Parse AST body to find cucumber type definition expression
 * @param {object} body
 */

const findCucumberTypeDefinition = body => {
  return body.filter(
    statement =>
      _.get(statement, 'type') === 'ExpressionStatement' &&
      _.get(statement, 'expression.type') === 'CallExpression' &&
      _.get(statement, 'expression.callee.type') === 'Identifier' &&
      _.get(statement, 'expression.callee.name') === 'defineParameterType'
  );
};

/**
 * Traverse files to find custom types declaration
 * @param {string} path - folder with files
 */

const findCucumberCustomTypes = path => {
  let cucumberTypes = [];
  readFilesFromDir(path).find(file => {
    const AST = parseJS(file);
    if (AST) {
      cucumberTypes = findCucumberTypeDefinition(AST.program.body).map(type => {
        const { properties } = type.expression.arguments[0];
        const name = properties.find(p => p.key.name === 'name').value.value;
        const regexValue = properties.find(p => p.key.name === 'regexp').value
          .pattern;
        return {
          name: name,
          pattern: regexValue
        };
      });
    }
    return cucumberTypes.length;
  });
  return cucumberTypes;
};

/**
 * Find all step definitions in framework
 * @param {string} stepDefinitionPath - path with root
 */

const parseStepDefinitions = stepDefinitionPath =>
  _.flatMap(readFilesFromDir(stepDefinitionPath), file => {
    const AST = parseJS(file);
    if (AST) {
      return findCucumberStepDefinitions(AST.program.body).map(step => {
        const stepValue =
          _.get(step, 'expression.arguments.0.type') === 'TemplateLiteral'
            ? _.get(step, 'expression.arguments.0.quasis.0.value.cooked')
            : _.get(step, 'expression.arguments.0.value');
        return {
          [stepValue]: {
            path: file,
            loc: step.expression.arguments[0].loc.start
          }
        };
      });
    }
  }).filter(_.identity);

module.exports = {
  parseJS,
  parseText,
  cypressCommandLocation,
  typeDefinitions,
  parseStepDefinitions,
  findCucumberCustomTypes,
  customCommandsAvailable
};

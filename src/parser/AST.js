const Parser = require('@babel/parser');
const fs = require('fs-extra');
const _ = require('lodash');
const minimatch = require('minimatch');
const { readFilesFromDir, match } = require('../helper/utils');
const { CUCUMBER_KEYWORDS, regexp } = require('../helper/constants');

/**
 * AST tree by file path
 */
const parseJS = filepath => {
  try {
    return (
      Parser.parse(fs.readFileSync(filepath, 'utf-8'), {
        sourceType: 'module'
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
    const fileContent = fs.readFileSync(file, 'utf-8');
    const commands = fileContent
      .split('\n')
      .map(row => regexp.TS_DEFINITION.exec(row));
    return commands
      .filter(c => c !== null)
      .map(item =>
        item
          .pop()
          .split('(')
          .shift()
          .trim()
      );
  } catch (e) {
    return [];
  }
};

/**
 *  - Parse arguments of custom command
 *  - Cypress.Commands.Add('command', () => {})
 *  - first argument is name of command
 *  - others are parsed for types
 *  - Returns array of arguments already converted to string with type
 *  @param {*[]} args
 */
const parseArguments = args =>
  _.flatten(
    _.tail(args).map(arg =>
      match(arg)
        .when(
          arg => arg.type === 'ObjectExpression',
          () => `${arg.properties[0].key.name}: any`
        )
        .when(
          arg =>
            ['FunctionExpression', 'ArrowFunctionExpression'].includes(
              arg.type
            ),
          () => parseFnParams(arg.params)
        )
        .default(arg => `${arg.value}: any`)
    )
  );

/**
 * Parses arguments from arrow function like:
 * Cypress.Commands.Add('command', (arg1, arg2, arg3) => {})
 * @param {*[]} params
 */
const parseFnParams = params =>
  params.map(param =>
    match(param)
      .when(
        param => param.type === 'AssignmentPattern',
        () => {
          const leftPart = `${param.left.name}?: `;
          const rightPart = parseRightPartOfArgument(param.right);
          return `${leftPart}${rightPart}`;
        }
      )
      .when(
        param => param.type === 'RestElement',
        () => `${param.argument.name}: any[]`
      )
      .default(param => `${param.name}: any`)
  );

/**
 * Parses right side of assignment expression%
 * Cypress.Commands.Add('command', (arg1 = false) => {})
 * @param {object} right
 */
const parseRightPartOfArgument = right =>
  match(right)
    .when(right => right.type === 'ObjectExpression', () => 'object')
    .when(right => right.type === 'ArrayExpression', () => 'any[]')
    .default(right =>
      _.has(right, 'value') ? `${typeof right.value}` : 'any'
    );

/**
 * Find custom command implementation
 * @param {string} folder - folder with custom commands
 * @param {string} targetCommand - command for search
 */
const cypressCommandLocation = (folder, targetCommand) => {
  const location = readFilesFromDir(folder)
    .map(({ path }) => {
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
    .filter(x => Boolean(x));
  return location[0] || null;
};

/**
 *  - Parse files
 *  - Returns array of commands with types
 */
const typeDefinitions = (
  files,
  excludes,
  options = { includeLocationData: false }
) => {
  let commandsFound = [];
  const typeDefs = _.flatten(
    files
      .filter(({ path }) => excludes.every(s => !minimatch(path, s)))
      .map(file => {
        const AST = parseJS(file.path);
        if (AST) {
          const commands = findCypressCommandAddStatements(AST.program.body);
          const typeDefBody = commands.map(command => {
            const { value: commandName, loc } = command.expression.arguments[0];
            commandsFound.push(
              options.includeLocationData
                ? {
                    name: commandName,
                    path: file.path,
                    loc: loc
                  }
                : commandName
            );
            const argsArray = parseArguments(command.expression.arguments);
            return `${commandName}(${argsArray.join(', ')}): Chainable<any>`;
          });
          return typeDefBody;
        }
      })
      .filter(e => !_.isUndefined(e))
  );
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

const defineCucumberTypeDefinition = body => {
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
  const typeDefinitions = [];
  readFilesFromDir(path).find(file => {
    const AST = parseJS(file.path);
    if (AST) {
      defineCucumberTypeDefinition(AST.program.body).map(type => {
        const { properties } = type.expression.arguments[0];
        const name = properties.find(p => p.key.name === 'name').value.value;
        const regexp = properties.find(p => p.key.name === 'regexp').value
          .pattern;
        typeDefinitions.push({
          name: name,
          pattern: regexp
        });
      });
    }
    return typeDefinitions.length;
  });
  return typeDefinitions;
};

/**
 * Find all step definitions in framework
 * @param {string} stepDefinitionPath - path with root
 */

const parseStepDefinitions = stepDefinitionPath => {
  let stepLiterals = [];
  readFilesFromDir(stepDefinitionPath).map(file => {
    const AST = parseJS(file.path);
    findCucumberStepDefinitions(AST.program.body).map(step => {
      const stepValue =
        _.get(step, 'expression.arguments.0.type') === 'TemplateLiteral'
          ? _.get(step, 'expression.arguments.0.quasis.0.value.cooked')
          : _.get(step, 'expression.arguments.0.value');
      stepLiterals.push({
        [stepValue]: {
          path: file.path,
          loc: step.expression.arguments[0].loc.start
        }
      });
    });
  });
  return stepLiterals;
};

module.exports = {
  parseJS,
  cypressCommandLocation,
  typeDefinitions,
  parseStepDefinitions,
  findCucumberCustomTypes,
  customCommandsAvailable
};

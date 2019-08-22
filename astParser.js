const vscode = require('vscode');
let Parser = require('@babel/parser');
const fs = require('fs-extra');
const klawSync = require('klaw-sync');
const _ = require('lodash');

/**
 * Get all support files
 */
const supportFiles = folder =>
  klawSync(folder, {
    traverseAll: true
  }) || [];

/**
 * Constant paths for detecting `Cypress.Commands.add`
 */
const s = {
  calleeParent: 'expression.callee.object.object.name',
  calleeChild: 'expression.callee.object.property.name',
  calleeMethod: 'expression.callee.property.name'
};

/**
 * Check if statement is `Cypress.Commands.add`
 */
const filterCypressCommandAddStatements = body => {
  return body.filter(
    statement =>
      _.get(statement, 'type') === 'ExpressionStatement' &&
      _.get(statement, s.calleeParent) === 'Cypress' &&
      _.get(statement, s.calleeChild) === 'Commands' &&
      _.get(statement, s.calleeMethod) === 'add'
  );
};

/**
 * Template for type definition file
 */
const wrapTemplate = commands => `declare namespace Cypress {
    interface Chainable<Subject> {
        ${commands.join('\n        ')}
  }
}`;

/**
 * Retrieve list of commands with type definitions
 */
const customCommandsAvailable = file => {
  try {
    let fileContent = fs.readFileSync(file, 'utf-8');
    let commandPattern = /^ +.*\(.*: Chainable<any>$/m;
    let commands = fileContent.split('\n').map(row => commandPattern.exec(row));
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
 * Parse arguments of custom command
 * Returns array of arguments already converted to string with type
 */
const parseArguments = args => {
  let parsedArgs = _.tail(args).map(arg => {
    switch (arg.type) {
      case 'ObjectExpression':
        let [property] = arg.properties;
        return `${property.key.name}: any`;
      case 'ArrowFunctionExpression':
        let { params } = arg;
        let parsedParams = params.map(param => {
          let parsedParam = '';
          switch (param.type) {
            case 'AssignmentPattern':
              parsedParam = `${param.left.name}?: `;
              switch (param.right.type) {
                case 'ObjectExpression':
                  parsedParam += 'object';
                  break;
                case 'ArrayExpression':
                  parsedParam += 'any[]';
                  break;
                default:
                  if (_.has(param, 'right.value')) {
                    parsedParam += `${typeof param.right.value}`;
                  } else {
                    parsedParam += 'any';
                  }
                  break;
              }
              break;
            case 'RestElement':
              parsedParam = `${param.argument.name}: any[]`;
              break;
            default:
              parsedParam = `${param.name}: any`;
              break;
          }
          return parsedParam;
        });
        return parsedParams;
      default:
        return `${arg.value}: any`;
    }
  });
  return _.flatten(parsedArgs);
};

/**
 * Find custom command implementation
 * @param {string} folder - folder with custom commands
 * @param {string} targetCommand - command for search
 */
const getCypressCommandImplementation = (folder, targetCommand) => {
  let location = supportFiles(folder)
    .map(file => {
      let stat = fs.lstatSync(file.path);
      if (!stat.isDirectory() && file.path.endsWith('.js')) {
        let AST = Parser.parse(fs.readFileSync(file.path, 'utf-8'), {
          sourceType: 'module'
        });
        let commands = filterCypressCommandAddStatements(AST.program.body);
        let commandNames = commands.map(c => c.expression.arguments[0].value);
        if (commandNames.includes(targetCommand)) {
          let index = commandNames.indexOf(targetCommand);
          let commandBody = commands[index];
          return {
            file: file.path,
            loc: commandBody.expression.arguments[0].loc.start
          };
        }
      }
    })
    .filter(x => Boolean(x));
  return location[0] || null;
};

/**
 * Parse files
 * Returns array of commands with types
 */
const typeDefinitions = (files, excludes) => {
  let commandsFound = [];
  let typeDefs = _.flatten(
    files
      .map(file => {
        let stat = fs.lstatSync(file.path);
        if (
          !stat.isDirectory() &&
          excludes.split(',').every(s => !file.path.includes(s))
        ) {
          let AST = Parser.parse(fs.readFileSync(file.path, 'utf-8'), {
            sourceType: 'module'
          });
          let commands = filterCypressCommandAddStatements(AST.program.body);
          let typeDefBody = commands.map(command => {
            let commandName = command.expression.arguments[0].value;
            commandsFound.push(commandName);
            let argsArray = parseArguments(command.expression.arguments);
            return `${commandName}(${argsArray.join(', ')}): Chainable<any>`;
          });
          return typeDefBody;
        }
      })
      .filter(e => !_.isUndefined(e) && e.length !== 0)
  );
  return {
    commandsFound: commandsFound,
    typeDefs: typeDefs
  };
};

const generateTypeDefinitions = (folder, excludes, typeDefFile) => {
  let files = supportFiles(folder);
  let { window } = vscode;
  let { commandsFound, typeDefs } = typeDefinitions(files, excludes);
  let availableTypeDefinitions = customCommandsAvailable(typeDefFile);
  let added = _.difference(commandsFound, availableTypeDefinitions);
  let deleted = _.difference(availableTypeDefinitions, commandsFound);
  let foundUniqueCommands = _.uniq(commandsFound);
  if (commandsFound.length === foundUniqueCommands.length) {
    if (typeDefs.length) {
      fs.outputFileSync(typeDefFile, wrapTemplate(typeDefs), 'utf-8');
      window.showInformationMessage('Type definitions generated and saved');
      vscode.workspace.openTextDocument(typeDefFile).then(doc => {
        vscode.window.showTextDocument(doc, { preview: false });
      });
    } else {
      window.showWarningMessage('No commands required type definitions found');
    }
    window.showInformationMessage('No duplicates found');
  } else {
    let errorDuplicate = `Command already exist:\n${_.uniq(
      _.filter(commandsFound, (v, i, a) => a.indexOf(v) !== i)
    ).join('\n')}`;
    window.showErrorMessage(errorDuplicate, { modal: true });
  }
  if (added.length) {
    window.showInformationMessage(`New command types added: ${added}`, {
      modal: true
    });
  }
  if (deleted.length) {
    window.showInformationMessage(`Deleted command types: ${deleted}`, {
      modal: true
    });
  }
};

module.exports = {
  getCypressCommandImplementation,
  generateTypeDefinitions
};

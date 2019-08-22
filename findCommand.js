let Parser = require('@babel/parser');
const fs = require('fs-extra');
const klawSync = require('klaw-sync');
const _ = require('lodash');

/**
 * Constant paths for detecting `Cypress.Commands.add`
 */
const s = {
  calleeParent: 'expression.callee.object.object.name',
  calleeChild: 'expression.callee.object.property.name',
  calleeMethod: 'expression.callee.property.name'
};

const getCypressCommandImplementation = (folder, targetCommand) => {
  const supportFiles =
    klawSync(folder, {
      traverseAll: true
    }) || [];
  let location = supportFiles
    .map(file => {
      let stat = fs.lstatSync(file.path);
      if (!stat.isDirectory() && file.path.endsWith('.js')) {
        let AST = Parser.parse(fs.readFileSync(file.path, 'utf-8'), {
          sourceType: 'module'
        });
        let commands = AST.program.body.filter(
          statement =>
            _.get(statement, 'type') === 'ExpressionStatement' &&
            _.get(statement, s.calleeParent) === 'Cypress' &&
            _.get(statement, s.calleeChild) === 'Commands' &&
            _.get(statement, s.calleeMethod) === 'add'
        );
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

module.exports = getCypressCommandImplementation;

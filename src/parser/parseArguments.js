/**
 *  - Parse arguments of custom command
 *  - Cypress.Commands.Add('command', () => {})
 *  - first argument is name of command
 *  - others are parsed for types
 *  - Returns array of arguments already converted to string with type
 *  @param {*[]} commandArguments
 */
const parseArguments = commandArguments =>
  _.flatMap(_.tail(commandArguments), arg =>
    match(arg)
      .when(
        () => arg.type === 'ObjectExpression',
        () => `${arg.properties[0].key.name}: any`
      )
      .when(
        () =>
          arg.type === 'FunctionExpression' ||
          arg.type === 'ArrowFunctionExpression',
        () => parseFnParams(arg.params)
      )
      .default(() => `${arg.value}: any`)
  );

/**
 * Parses arguments from arrow function like:
 * Cypress.Commands.Add('command', (arg1, arg2, arg3) => {})
 * @param {*[]} params
 */
const parseFnParams = functionParameters =>
  functionParameters.map(param =>
    match(param)
      .when(
        () => param.type === 'AssignmentPattern',
        () => {
          const leftPart = `${param.left.name}?: `;
          const rightPart = parseRightPartOfArgument(param.right);
          return `${leftPart}${rightPart}`;
        }
      )
      .when(
        () => param.type === 'RestElement',
        () => `${param.argument.name}: any[]`
      )
      .default(() => `${param.name}: any`)
  );

/**
 * Parses right side of assignment expression%
 * Cypress.Commands.Add('command', (arg1 = false) => {})
 * @param {object} right
 */
const parseRightPartOfArgument = right =>
  match(right)
    .when(() => right.type === 'ObjectExpression', () => 'object')
    .when(() => right.type === 'ArrayExpression', () => 'any[]')
    .default(() =>
      _.has(right, 'value') && !_.isNil(right.value)
        ? `${typeof right.value}`
        : 'any'
    );

const matched = x => ({
  when: () => matched(x),
  default: () => x
});

/**
     * Helper to replace switch statements with:
     * @example
      match(10)
      .when(x => x < 0, () => 0)
      .when(x => x >= 0 && x <= 1, () => 1)
      .default(x => x * 10)
       => 100
     * @param {*} x
     */
const match = x => ({
  when: (pred, fn) => (pred(x) ? matched(fn(x)) : match(x)),
  default: fn => fn(x)
});

module.exports = {
  parseArguments
};

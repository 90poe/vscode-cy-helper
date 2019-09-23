const fs = require('fs-extra');
const _ = require('lodash');
const Gherkin = require('gherkin');
const GherkinParser = new Gherkin.Parser();
const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { parseStepDefinitions, findCucumberCustomTypes } = require('./AST');
const { readFilesFromDir } = require('../helper/utils');
const root = vscode.root();

/**
 *  Find where cucumber step definitions are stored
 *  by checking package.json for configuration
 */
const getCucumberStepsPath = () => {
  const packages = readFilesFromDir(root, {
    name: 'package',
    extension: '.json'
  });

  let cucumberConfig;
  packages.find(p => {
    const content = JSON.parse(fs.readFileSync(p.path));
    cucumberConfig = _.get(content, 'cypress-cucumber-preprocessor');
    return cucumberConfig;
  });

  const path = _.get(cucumberConfig, 'nonGlobalStepDefinitions')
    ? 'cypress/integration'
    : _.get(cucumberConfig, 'step_definitions') ||
      'cypress/support/step_definitions';
  return path;
};

const stepDefinitionPath = getCucumberStepsPath();

const cucumberTypes = [
  {
    name: 'string',
    pattern: '(\\".*\\"|\\\'.*\\\')'
  },
  {
    name: 'word',
    pattern: '[^\\s]+'
  },
  {
    name: 'int',
    pattern: '\\d+'
  },
  {
    name: 'float',
    pattern: '(?=.*d.*)[-+]?d*(?:.(?=d.*))?d*(?:d+[E][+-]?d+)?'
  }
];

const customTypes = findCucumberCustomTypes(`${root}/${stepDefinitionPath}`);

const allTypes = [...cucumberTypes, ...customTypes];

const allTypeRegexp = allTypes.map(({ name, pattern }) => {
  return {
    name: name,
    pattern: pattern,
    replace: new RegExp(`{${name}}`, 'g')
  };
});

const PARAMETER = '<.*>';

const PATTERN = type => {
  return `(${type}|${PARAMETER})`;
};

/**
 * Replace step definition placeholders with types regexp
 * @param {string} literal
 */
const prepareRegexpForLiteral = literal => {
  let basicTypesLiteral = `^${literal.replace(/\//g, '|')}$`;

  allTypeRegexp.map(({ pattern, replace }) => {
    basicTypesLiteral = basicTypesLiteral.replace(replace, PATTERN(pattern));
  });

  const stepDefinitionRegexp = new RegExp(basicTypesLiteral, 'g') || null;
  return stepDefinitionRegexp;
};

/**
 * Read all feature files and return where steps used
 */
const parseFeatures = () =>
  _.flatMap(
    readFilesFromDir(root, {
      extension: '.feature'
    }),
    file => {
      const { feature } = GherkinParser.parse(
        fs.readFileSync(file.path, 'utf-8')
      );
      return _.flatMap(feature.children, child =>
        child.steps.map(step => ({
          step: step.text.replace(/\\/g, ''),
          loc: step.location,
          path: file.path
        }))
      );
    }
  ).filter(_.identity);

/**
 * try parsing step definition and return regexp or null
 * @param {string} literal
 */
const parseRegexp = literal => {
  if (literal.startsWith('/') && literal.endsWith('/')) {
    const pureString = literal.replace(/\//g, '');
    try {
      return new RegExp(pureString);
    } catch (e) {
      return null;
    }
  }
};

/**
 * check where step definitions are used
 * @param {string[]} features - feature files
 * @param {*[]} stepDefinitions - step definitions
 */
const calculateUsage = (features, stepDefinitions) =>
  stepDefinitions.map(step => {
    const literal = Object.keys(step)[0];
    const { path, loc } = step[literal];

    const hasNoTypes = !literal.includes('{') && !literal.includes('}');
    const isStepRegexp = parseRegexp(literal);
    const literalRegexp = isStepRegexp || prepareRegexpForLiteral(literal);

    const usage =
      hasNoTypes && !isStepRegexp
        ? features.filter(s => s.step === literal)
        : features.filter(s => literalRegexp.exec(s.step) !== null);

    const matches = usage.length;

    return {
      step: literal,
      matches: matches,
      usage: usage,
      path: path,
      loc: loc
    };
  });

/**
 * -  parse step definitions
 * -  parse feature files
 * -  compare and return usage array
 */
const composeUsageReport = () => {
  const stepDefinitionsParsed = parseStepDefinitions(
    `${root}/${stepDefinitionPath}`
  );
  const stepsFromFeatures = parseFeatures();
  return calculateUsage(stepsFromFeatures, stepDefinitionsParsed);
};

module.exports = {
  stepDefinitionPath,
  composeUsageReport,
  parseFeatures,
  calculateUsage
};

const fs = require('fs-extra');
const _ = require('lodash');
const Gherkin = require('gherkin');
const GherkinParser = new Gherkin.Parser();
const { parseStepDefinitions, findCucumberCustomTypes } = require('./AST');
const { readFilesFromDir, root } = require('../helper/utils');

const getCucumberStepsPath = () => {
  const packages = readFilesFromDir(root, {
    name: 'package',
    extension: '.json'
  });
  let cucumberConfig;
  packages.find(p => {
    let content = JSON.parse(fs.readFileSync(p.path));
    cucumberConfig = _.get(content, 'cypress-cucumber-preprocessor');
    return cucumberConfig;
  });
  let stepDefinitionPath = _.get(cucumberConfig, 'nonGlobalStepDefinitions')
    ? 'cypress/integration'
    : _.get(cucumberConfig, 'step_definitions') ||
      'cypress/support/step_definitions';
  return stepDefinitionPath;
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

const prepareRegexpForLiteral = literal => {
  let basicTypesLiteral = `^${literal.replace(/\//g, '|')}$`;
  allTypeRegexp.map(({ pattern, replace }) => {
    basicTypesLiteral = basicTypesLiteral.replace(replace, PATTERN(pattern));
  });
  let stepDefinitionRegexp = new RegExp(basicTypesLiteral, 'g') || null;
  return stepDefinitionRegexp;
};

const parseFeatures = () => {
  const features = readFilesFromDir(`${root}/cypress`, {
    extension: '.feature'
  });
  let steps = [];
  features.map(file => {
    let { feature } = GherkinParser.parse(fs.readFileSync(file.path, 'utf-8'));
    feature.children.map(child =>
      child.steps.map(step => {
        steps.push({
          step: step.text.replace(/\\/g, ''),
          loc: step.location,
          path: file.path
        });
      })
    );
  });
  return steps;
};

const calculateUsage = (features, stepDefinitions) =>
  stepDefinitions.map(step => {
    let literal = Object.keys(step)[0];
    let { path, loc } = step[literal];
    let hasNoTypes = !literal.includes('{') && !literal.includes('}');
    let literalRegexp = prepareRegexpForLiteral(literal);
    let usage = hasNoTypes
      ? features.filter(s => s.step === literal)
      : features.filter(s => literalRegexp.exec(s.step) !== null);
    let matches = usage.length;
    return {
      step: literal,
      matches: matches,
      usage: usage,
      path: path,
      loc: loc
    };
  });

const composeUsageReport = () => {
  const stepDefinitionsParsed = parseStepDefinitions(
    `${root}/${stepDefinitionPath}`
  );
  const stepsFromFeatures = parseFeatures();
  return calculateUsage(
    stepsFromFeatures,
    stepDefinitionsParsed,
    stepDefinitionPath
  );
};

module.exports = {
  stepDefinitionPath,
  composeUsageReport,
  parseFeatures,
  calculateUsage
};
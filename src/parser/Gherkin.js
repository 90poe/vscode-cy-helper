const fs = require('fs-extra');
const _ = require('lodash');
const Gherkin = require('gherkin');
const GherkinParser = new Gherkin.Parser();
const { parseStepDefinitions } = require('./AST');
const { readFilesFromDir, root } = require('../helper/utils');

const INTEGER_REGEXP = '\\d+';
const WORD_REGEXP = '[^\\s]+';
const STRING_REGEXP = '(\\".*\\"|\\\'.*\\\')';
const FLOAT_REGEXP = '(?=.*d.*)[-+]?d*(?:.(?=d.*))?d*(?:d+[E][+-]?d+)?';
const PARAMETER = '<.*>';
// TO DO: Find custom cucumber defined types programmatically
// Our framework custom types:
const ARRAY_REGEXP = '\\[.*?\\]';
const BOOLEAN_REGEXP = '(true)|(false)';
const DATE_REGEXP = '(.*)';

const PATTERN = type => {
  return `(${type}|${PARAMETER})`;
};

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
    let literalRegexp =
      new RegExp(
        `^${literal
          .replace(/{string}/g, PATTERN(STRING_REGEXP))
          .replace(/{word}/g, PATTERN(WORD_REGEXP))
          .replace(/{int}/g, PATTERN(INTEGER_REGEXP))
          .replace(/{float}/g, PATTERN(FLOAT_REGEXP))
          .replace(/{array}/g, PATTERN(ARRAY_REGEXP))
          .replace(/{boolean}/g, PATTERN(BOOLEAN_REGEXP))
          .replace(/{date}/g, PATTERN(DATE_REGEXP))
          .replace(/\//g, '|')}$`,
        'g'
      ) || null;
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

const composeUsageReport = stepDefinitionPath => {
  const stepDefinitionsParsed = parseStepDefinitions(
    `${root}/${stepDefinitionPath}`
  );
  const stepsFromFeatures = parseFeatures();
  return calculateUsage(stepsFromFeatures, stepDefinitionsParsed);
};

module.exports = {
  getCucumberStepsPath,
  composeUsageReport,
  parseFeatures,
  calculateUsage
};

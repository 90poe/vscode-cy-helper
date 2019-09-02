const fs = require('fs-extra');
const _ = require('lodash');
const Gherkin = require('gherkin');
const vscode = require('vscode');
const { workspace, window } = vscode;
const GherkinParser = new Gherkin.Parser();

const { parseJS, readFilesFromDir } = require('./astParser');
const { openDocumentAtPosition } = require('./utils');

const s = {
  type: 'ExpressionStatement',
  parent: 'expression.type',
  child: 'expression.callee.type',
  stepname: 'expression.callee.name'
};

const cucumberSteps = ['given', 'when', 'then', 'Given', 'When', 'Then'];

const INTEGER_REGEXP = '\\d+';
const WORD_REGEXP = '[^\\s]+';
const STRING_REGEXP = '(\\".*\\"|\\\'.*\\\')';
const ARRAY_REGEXP = '\\[.*?\\]';
const BOOLEAN_REGEXP = '(true)|(false)';
const DATE_REGEXP = '(.*)';
const FLOAT_REGEXP = '(?=.*d.*)[-+]?d*(?:.(?=d.*))?d*(?:d+[E][+-]?d+)?';
const PARAM = '<.*>';

const PATTERN = type => {
  return `(${type}|${PARAM})`;
};

const cucumberConfigExist = json =>
  _.get(json, 'cypress-cucumber-preprocessor');

const cucumberStepDefinitionConfig = json => _.get(json, 'step_definitions');

const getCucumberStepsPath = () => {
  const packages = readFilesFromDir(workspace.rootPath, {
    name: 'package',
    extension: '.json'
  });
  let cucumberConfig;
  packages.find(p => {
    let content = JSON.parse(fs.readFileSync(p.path));
    cucumberConfig = cucumberConfigExist(content);
    return cucumberConfig;
  });
  let stepDefinitionPath = _.get(cucumberConfig, 'nonGlobalStepDefinitions')
    ? 'cypress/integration'
    : cucumberStepDefinitionConfig(cucumberConfig) ||
      'cypress/support/step_definitions';
  return stepDefinitionPath;
};

const parseStepDefinitions = stepDefinitionPath => {
  const stepDefinitions = readFilesFromDir(
    `${workspace.rootPath}/${stepDefinitionPath}`
  );
  let stepLiterals = [];
  stepDefinitions.map(stepDefFile => {
    let AST = parseJS(stepDefFile.path);
    let steps = AST.program.body.filter(
      statement =>
        _.get(statement, 'type') === 'ExpressionStatement' &&
        _.get(statement, s.parent) === 'CallExpression' &&
        _.get(statement, s.child) === 'Identifier' &&
        cucumberSteps.includes(_.get(statement, s.stepname))
    );
    steps.map(step => {
      let stepValue =
        _.get(step, 'expression.arguments[0].type') === 'TemplateLiteral'
          ? step.expression.arguments[0].quasis[0].value.cooked
          : step.expression.arguments[0].value;
      stepLiterals.push({
        [stepValue]: {
          path: stepDefFile.path,
          loc: step.expression.arguments[0].loc.start
        }
      });
    });
  });
  return stepLiterals;
};

const parseFeatures = () => {
  const features = readFilesFromDir(`${workspace.rootPath}/cypress`, {
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
    let literalRegexp = () => {
      try {
        return new RegExp(
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
        );
      } catch (e) {
        window.showErrorMessage('asdasdqweq xc asdf');
      }
    };
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
  const stepDefinitionsParsed = parseStepDefinitions(stepDefinitionPath);
  let stepsFromFeatures = parseFeatures();
  return calculateUsage(stepsFromFeatures, stepDefinitionsParsed);
};

const findUnusedCucumberSteps = () => {
  let stepDefinitionPath = getCucumberStepsPath();
  const usages = composeUsageReport(stepDefinitionPath);
  // debug not parsed steps:
  // let stepsUsed = _.flatten(usages.map(u => u.usage));
  // const missed = stepsFromFeatures.filter(g => !stepsUsed.includes(g));
  // console.log(missed);
  let unused = usages.filter(u => u.matches === 0);
  if (unused) {
    let quickPickList = unused.map(c => {
      return {
        label: c.step,
        detail: `${c.path.split(stepDefinitionPath)[1].replace('.js', '')}:${
          c.loc.line
        }`,
        data: c
      };
    });
    quickPickList.unshift({
      label: '',
      description: `Found ${unused.length} not used Step Definitions:`,
      data: {}
    });
    window
      .showQuickPick(quickPickList)
      .then(({ data }) => openDocumentAtPosition(data.path, data.loc));
  } else {
    window.showInformationMessage('All step definitions are used');
  }
};

const findCucumberStepUsage = () => {
  let editor = window.activeTextEditor;
  let path = editor.document.uri.fsPath;
  let { text: line, range } = editor.document.lineAt(
    editor.selection.active.line
  );
  let stepDefinitionPattern = /['"`](.*?)[\'\"\`]/g;
  let stepLiteral = line
    .match(stepDefinitionPattern)
    .shift()
    .replace(/['"`]/g, '');
  let stepDefinition = [
    {
      [stepLiteral]: {
        path: path,
        loc: range.start
      }
    }
  ];
  let features = parseFeatures();
  let stats = calculateUsage(features, stepDefinition);
  let usages = _.get(stats, '0.usage');
  if (usages) {
    let quickPickList = usages.map(c => {
      return {
        label: c.step,
        detail: `${c.path.split('/cypress/')[1]}:${c.loc.line}`,
        data: c
      };
    });
    quickPickList.unshift({
      label: '',
      description: `Found ${usages.length} usages of step: "${stepLiteral}"`,
      data: {}
    });
    window
      .showQuickPick(quickPickList)
      .then(({ data }) => openDocumentAtPosition(data.path, data.loc));
  } else {
    window.showInformationMessage(`Not found usage for step: "${stepLiteral}"`);
  }
};

module.exports = {
  findUnusedCucumberSteps,
  findCucumberStepUsage
};

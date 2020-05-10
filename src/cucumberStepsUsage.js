const _ = require('lodash');
const path = require('path');
const VS = require('./helper/vscodeWrapper');
const vscode = new VS();
const {
  composeUsageReport,
  parseFeatures,
  calculateUsage,
  stepDefinitionPath
} = require('./parser/Gherkin');
const { message, regexp } = require('./helper/constants');

const findUnusedCucumberSteps = () => {
  const usages = composeUsageReport();
  const unused = usages.filter(u => u.matches === 0);

  vscode.showQuickPickMenu(unused, {
    mapperFunction: c => {
      return {
        label: c.step,
        detail: `${c.path
          .split(path.normalize(stepDefinitionPath))[1]
          .replace(/\.js|\.ts/, '')}:${c.loc.line}`,
        data: c
      };
    },
    header: message.UNUSED_STEPS_FOUND(unused.length),
    notFoundMessage: message.UNUSED_STEPS_NOT_FOUND
  });
};

const cucumberStepReferences = () => {
  const editor = vscode.activeTextEditor();
  const { fileName } = editor.document;

  const { text: line, range } = editor.document.lineAt(
    editor.selection.active.line
  );

  const stepDefinitionPattern = regexp.STEP_DEFINITION;
  const isRegexStep = line.includes(`(/^`) && line.includes('$/');
  const stepLiteralMatch = isRegexStep
    ? line.match(stepDefinitionPattern)
    : line.replace('/', '|').match(stepDefinitionPattern);

  if (!stepLiteralMatch) {
    return undefined;
  }

  const stepLiteral = stepLiteralMatch[0].replace(regexp.QUOTES, '');
  const stepDefinition = [
    {
      [stepLiteral]: {
        path: fileName,
        loc: range.start
      }
    }
  ];

  const features = parseFeatures();
  const stats = calculateUsage(features, stepDefinition);
  const usages = _.get(stats, '0.usage') || [];
  return {
    stepLiteral: stepLiteral,
    usages: usages
  };
};

const findCucumberStepUsage = () => {
  const references = cucumberStepReferences();
  if (references) {
    const { usages, stepLiteral } = references;
    !stepLiteral && vscode.show('warn', message.NO_STEP);
    vscode.showQuickPickMenu(usages, {
      mapperFunction: c => {
        return {
          label: c.step,
          detail: `${c.path.split(path.normalize('/cypress/'))[1]}:${
            c.loc.line
          }`,
          data: c
        };
      },
      header: message.REFERENCE_STEPS_FOUND(usages.length, stepLiteral),
      notFoundMessage: message.REFERENCE_STEPS_NOT_FOUND(stepLiteral)
    });
  } else {
    vscode.show('err', message.REFERENCE_STEPS_NOT_FOUND());
  }
};

module.exports = {
  findUnusedCucumberSteps,
  findCucumberStepUsage,
  cucumberStepReferences
};

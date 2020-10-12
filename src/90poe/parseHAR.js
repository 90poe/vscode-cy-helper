const VS = require('../helper/vscodeWrapper');
const vscode = new VS();
const { readFile, readFilesFromDir } = require('../helper/utils');
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const { message } = require('../helper/constants');
const { openJsonSchemaGenerator } = require('./openJsonSchemaGenerator');

/**
 * 90poe internal command
 * to generate fixture files for graphql api tests
 * with exported from Chrome HAR file
 */
exports.parseHAR = file => {
  if (!file.fsPath) {
    vscode.show('err', 'Failed to get HAR file', false);
  }
  const harContent = readFile(file.fsPath);
  const currentFolder = path.dirname(file.fsPath);
  const fixtures = readFilesFromDir(currentFolder, {
    extension: '.json'
  });
  const har = JSON.parse(harContent);
  // find graphql requests
  const requests = har.log.entries
    .filter(e => {
      if (_.has(e, 'request.postData.text')) {
        try {
          const parsed = JSON.parse(e.request.postData.text);
          if (_.has(parsed, 'operationName')) {
            return true;
          }
        } catch (e) {
          return false;
        }
      }
    })
    .map(e => {
      const postData = JSON.parse(e.request.postData.text);
      const operation = _.isNil(postData.operationName)
        ? postData.query.split('{')[1].trim()
        : postData.operationName;
      return {
        operationName: operation,
        url: e.request.headers
          .find(header => header.name === ':path')
          .value.substr(1),
        request: postData
      };
    });
  const uniqRequests = _.uniqBy(requests, r => r.operationName);
  const matches = [];
  const updates = [];
  const newFixturePaths = [];
  // check which fixtures should be updated based on graphql query
  fixtures.forEach(fixturePath => {
    const text = readFile(fixturePath);
    const obj = JSON.parse(text);
    const match = uniqRequests.find(
      r =>
        r.operationName === _.get(obj, 'operationName') ||
        r.operationName === _.get(obj, 'request.operationName') ||
        (_.has(obj, 'request.query') &&
          r.operationName === obj.request.query.split('{')[1].trim())
    );
    _.has(match, 'operationName') && matches.push(match.operationName);
    if (
      match &&
      _.get(match, 'request.query') !== _.get(obj, 'request.query')
    ) {
      const newVariables = processVariableChanges(
        obj.request.variables,
        match.request.variables
      );
      const updated = {
        operationName: match.operationName,
        url: match.url,
        request: {
          operationName: match.request.operationName,
          variables: newVariables,
          query: match.request.query
        }
      };
      updates.push(match.operationName);
      writeFixture(fixturePath, updated);
    }
  });
  if (updates.length) {
    vscode.show('info', message.FIXTURES_UPDATED(updates), true);
  }
  // check if some requests are missing fixtures
  if (matches.length < uniqRequests.length) {
    const newFixtures = uniqRequests.filter(
      u => !matches.includes(u.operationName)
    );
    newFixtures.forEach(fixture => {
      const newPath = path.join(currentFolder, `${fixture.operationName}.json`);
      newFixturePaths.push({ fsPath: newPath });
      writeFixture(newPath, fixture);
    });
    vscode.show(
      'info',
      message.FIXTURES_CREATED(newFixtures.map(f => `${f.operationName}`)),
      true
    );

    vscode
      .show(
        'info',
        `Do you want to create schemas for all new fixtures?`,
        false,
        'No',
        'Yes'
      )
      .then(selectedAction => {
        if (selectedAction === 'Yes') {
          newFixturePaths.forEach(path => {
            openJsonSchemaGenerator(path);
          });
        }
      });
  }

  vscode
    .show(
      'info',
      `HAR file parsed, do you want to remove it?`,
      false,
      'No',
      'Yes'
    )
    .then(selectedAction => {
      if (selectedAction === 'Yes') {
        fs.removeSync(file.fsPath);
      }
    });
};

const processVariableChanges = (actual, incoming) => {
  return _.reduce(
    incoming,
    (result, val, key) => {
      const actualKey = _.keys(actual).find(k => k === key);
      if (_.isArray(val)) {
        result[key] = val.map(v => processVariableChanges(actual[key], v));
      } else if (_.isPlainObject(val)) {
        result[key] = processVariableChanges(actual[key], val);
      } else if (
        actualKey &&
        (typeof actual[actualKey] === typeof incoming[actualKey] ||
          _.isNull(val))
      ) {
        result[key] = actual[actualKey];
      } else {
        result[key] = val;
      }
      return result;
    },
    {}
  );
};

const writeFixture = (path, content) => {
  fs.outputFileSync(path, JSON.stringify(content, null, 2), 'utf-8');
};

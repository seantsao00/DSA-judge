import config from '/config';
import fs from 'fs-extra';
import path from 'path';
import {promisify} from 'bluebird';
import jsonfile from 'jsonfile';
import _ from 'lodash';

async function updateMeta (id, prob) {
  await updateTestdata(id, prob);

  const metaFile = path.join(config.dirs.problems, `${id}`, 'meta.json');
  let stat;
  try {
    stat = await fs.stat(metaFile);
  } catch (e) {
    return;
  }
  if (!stat.isFile()) return;
  const json = await promisify(jsonfile.readFile)(metaFile);

  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'name')) prob.name = _.get(json, 'name');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'timeLimit')) prob.timeLimit = _.get(json, 'timeLimit');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'memLimit')) prob.memLimit = _.get(json, 'memLimit');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'hasSpecialJudge')) prob.hasSpecialJudge = _.get(json, 'hasSpecialJudge');
  if (_.has(json, 'uploadOutput')) prob.uploadOutput = _.get(json, 'uploadOutput');
  if (_.has(json, 'problemType')) prob.problemType = _.get(json, 'problemType');
  if (_.has(json, 'hasPartialScorePerTestdata')) prob.hasPartialScorePerTestdata = _.get(json, 'hasPartialScorePerTestdata');
  if (_.has(json, 'testdata')) {
    // eslint-disable-next-line require-atomic-updates
    prob.testdata = {
      count: 0,
      points: 0,
      groups: []
    };
    const groups = prob.testdata.groups;
    for (let group of json.testdata) {
      if (!_.has(group, 'tests')) continue;
      const count = group.tests.length;
      const points = _.get(group, 'points', 0);
      prob.testdata.count += count;
      prob.testdata.points += points;
      groups.push({
        count,
        points,
        tests: group.tests
      });
    }
  }
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXArg')) prob.compileEXArg = _.get(json, 'compileEXArg');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXHeader')) prob.compileEXHeader = _.get(json, 'compileEXHeader');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXFile')) prob.compileEXFile = _.get(json, 'compileEXFile');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXLink')) prob.compileEXLink = _.get(json, 'compileEXLink');

  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXArgForChecker')) prob.compileEXArgForChecker = _.get(json, 'compileEXArgForChecker');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXHeaderForChecker')) prob.compileEXHeaderForChecker = _.get(json, 'compileEXHeaderForChecker');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXFileForChecker')) prob.compileEXFileForChecker = _.get(json, 'compileEXFileForChecker');
  // eslint-disable-next-line require-atomic-updates
  if (_.has(json, 'compileEXLinkForChecker')) prob.compileEXLinkForChecker = _.get(json, 'compileEXLinkForChecker');
  if (_.has(json, 'runtimeEXFile')) prob.runtimeEXFile = _.get(json, 'runtimeEXFile');
}

async function updateTestdata (id, prob) {
  const testsDir = path.join(config.dirs.problems, `${id}`, 'testdata');
  const files = await fs.readdir(testsDir);

  const _in = [], _out = new Set();
  for (let f of files) {
    const [name, ext] = f.split('.');
    if (ext == 'in') _in.push(name);
    else if (ext == 'out') _out.add(name);
  }
  prob.testFiles = _in.filter(x => _out.has(x));
}

export {updateMeta};

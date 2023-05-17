import fs from 'fs-extra';
import { ArgumentParser as Parser } from 'argparse';
import './common';
import config from '/config';
import Homework from '/model/homework';
import Submission from '/model/submission';

const parser = new Parser({
  description: 'Copy submissions of problem id y in homework id x (exclude admin & TA) before deadline to /home/DSA-2023/dsajudge/moss/x_y/'
});

parser.addArgument(['problem_id'], { type: 'int', help: 'id of the problem' });
parser.addArgument(['homework_id'], { type: 'int', help: 'id of the homework' });
parser.addArgument(['late_days'], { type: 'int', help: 'number of days for late submissions' });

function scoreRatio(ts, dl, late_days) {
  if (ts <= dl) return 1;
  return 1 - (ts - dl) / 86400000 / late_days;
}

(async () => {
  const args = parser.parseArgs();

  const homework = await Homework.findOne({$and: [{_id: args.homework_id},{"problems.problem": { $in : [args.problem_id]}}]}, 'due');
  if (!homework) {
    console.log('no such homework_id problem_id pair');
    return;
  }

  const softDL = homework.due;
  const hardDL = new Date(homework.due);
  hardDL.setDate(hardDL.getDate() + args.late_days);

  const submissions = await Submission.aggregate([{
    '$lookup': {
      'from': 'users',
      'localField': 'submittedBy',
      'foreignField': '_id',
      'as': 'roles'
    }
  }, {
    '$project': {
      'ts': 1,
      'problem': 1,
      'points': 1,
      'roles': { '$arrayElemAt': [ '$roles.roles', 0] },
      'id': { '$arrayElemAt': ['$roles.meta.id', 0] }
    }
  }, {
    '$match': {
      '$and': [
        { 'problem': args.problem_id },
        { 'ts': { '$lt': hardDL } },
        { 'roles': { '$nin': [ 'admin', 'TA' ] } }
      ]
    }
  }, {
    '$project': { '_id': 1, 'id': 1, 'points': 1, 'ts': 1 }
  }]);

  const penalised = {};
  submissions.forEach(submission => {
    const ratio = scoreRatio(submission.ts, softDL, args.late_days);
    const score = submission.points * ratio;
    if (!(submission.id in penalised) || score > penalised[submission.id].score) {
      penalised[submission.id] = {
        '_id': submission._id,
        'score': score
      };
    }
  });

  const folder = `/home/DSA-2023/dsajudge/moss/${args.homework_id}_${args.problem_id}`;
  fs.mkdirSync(folder, { recursive: true }, (err) => { if (err) throw err; });

  for (const [uid, submission] of Object.entries(penalised)) {
    fs.copyFileSync(`${config.dirs.submissions}/${submission._id}.cpp`, `${folder}/${uid}_${submission._id}.cpp`, (err) => { if (err) throw err; });
  }

  console.log('done');

  return;
})();

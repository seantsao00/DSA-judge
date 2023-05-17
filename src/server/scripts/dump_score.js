import { ArgumentParser as Parser } from 'argparse';
import './common';
import config from '/config';
import Homework from '/model/homework';
import Submission from '/model/submission';

const parser = new Parser({
  description: 'Dump scores of problem id y in homework id x (exclude admin & TA) before the deadline.'
});
parser.addArgument(['problem_id'], {
  type: 'int',
  help: 'id of the problem'
});
parser.addArgument(['homework_id'], {
  type: 'int',
  help: 'id of the homework'
});
parser.addArgument(['late_days'], {
  type: 'int',
  help: 'number of days for late submissions'
});

function scoreRatio(ts, dl, late_days) {
  if (ts <= dl)
    return 1;
  return 1 - (ts - dl) / 86400000 / late_days;
}

(async() => {
  const args = parser.parseArgs();
  const homework = await Homework.findOne({
    $and: [{
      _id: args.homework_id
    }, {
      'problems.problem': {
        $in: [args.problem_id]
      }
    }]
  }, 'due');

  if (!homework) {
    console.log('no such homework_id problem_id pair');
    return;
  }

  console.log('homework id:', args.homework_id, 'problem id:', args.problem_id);

  const softDL = homework.due;
  const hardDL = new Date(homework.due);
  hardDL.setDate(hardDL.getDate() + args.late_days);
  console.log('soft deadline:', softDL);
  console.log('hard deadline:', hardDL);


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
      'roles': {
        '$arrayElemAt': ['$roles.roles', 0]
      },
      'id': {
        '$arrayElemAt': ['$roles.meta.id', 0]
      }
    }
  }, {
    '$match': {
      '$and': [{
        'problem': args.problem_id
      }, {
        'ts': {
          '$lt': hardDL
        }
      }, {
        'roles': {
          '$nin': ['admin', 'TA']
        }
      }]
    }
  }, {
    '$project': {
      'ts': 1,
      'points': 1,
      'id': 1
    }
  }]);

  const scores = {};

  submissions.forEach((submission) => {
    const ratio = scoreRatio(submission.ts, softDL, args.late_days);
    const score = submission.points * ratio;
    if (!(submission.id in scores) || score > scores[submission.id])
      scores[submission.id] = score;
  });
  for (const key in scores) {
    console.log(key, scores[key]);
  }

})();

import './common';
import config from '/config';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs-extra';
import wrap from 'express-async-wrap';
import { execFile } from 'child_process';
import randomString from 'randomstring';
import prompt from 'prompt';
import _ from 'lodash';
import {promisify} from 'bluebird';
import {ArgumentParser as Parser} from 'argparse';

const GIT_CP = '/home/git/cp';
const tmpDir = '/tmp/judge_git';
const gitRepoDir = '/home/git/repositories';
const gitAdminDir = config.dirs.gitadmin;

function gitCpWrap (opt) {
  return new Promise((resolve, reject) => {
    execFile(GIT_CP, opt, {},
      (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve(_.assignIn({ stdout, stderr }));
      }
    );
  });
}

const parser = new Parser({
  description: 'Add a new user, and send password mail',
  addHelp: true
});

parser.addArgument(['email'], { help: 'account email' });
parser.addArgument(['id'], { help: 'account id' });
parser.addArgument(['name'], { help: 'account (chinese) name' });
parser.addArgument(['role'], { help: 'account role' });
parser.addArgument(['member'], { nargs:'+', help: 'member id of the group'});

(async () => {
  const args = parser.parseArgs();

//  prompt.start();
//  const result = await promisify(prompt.get)({
//    properties: {
//      account: {
//        description: `Your NTU account, don't input @ntu.edu.tw\n (The mail would be send by your account)`,
//        pattern: /^\w+$/,
//        message: 'Input a valid NTU account',
//        required: true
//      },
//      password: {
//        hidden: true
//      },
//      sendMail: {
//        message: 'Do you want to send a mail to user about new account? Y/N',
//        required: true
//      }
//    }
//  });

  const randPass = randomString.generate(10);
  const hashed = await promisify(bcrypt.hash)(randPass, 10);
  const accountType = 'Group';
  const roles = [args.role];

  let user = await User.findOne({ email: args.email });

  if(!user){
    user = new User({
      email: args.email,
      password: hashed,
      roles: roles,
      accountType: accountType,
      meta: {
        id: args.id,
        name: args.name
      },
      groups: args.member
    });
  } else{
    user.password=hashed;
    user.roles=roles;
    user.meta.id=args.id;
    user.meta.name=args.name;
    user.groups=args.member;
  }

//  if (result.sendMail === 'Y') {
//    const smtpConfig = {
//      host: 'smtps.ntu.edu.tw',
//      port: 465,
//      secure: true,
//      auth: {
//        user: result.account,
//        pass: result.password
//      }
//    };
//
//
//    const mailTransporter = nodemailer.createTransport(smtpConfig);
//
//    const text = (
//      `Welcome to DSA2025, this email is to inform you that your DSA Judge account has been created.
//  Here is your account and temporary password. (You can change your password after logging in.)
//
//  - Account: ${args.email}
//  - Password: ${randPass}
//
//  Head on to https://dsa-2025.csie.org/ and try it!
//  `);
//
//    const mailOptions = {
//      from: '"dsa2025" <dsa_ta@csie.ntu.edu.tw >',
//      to: args.email,
//      subject: '[DSA2025]Your DSA Judge Account',
//      text
//    };
//    console.log(user);
//    await user.save();
//    await new Promise((resolve, reject) => {
//      mailTransporter.sendMail(mailOptions, (err, result) => {
//        if (err) return reject(err);
//        resolve(result);
//      });
//    });
//    console.log(`mail send to ${args.email}`);
//  } else {
  console.log(user);
  await user.save();
//  }
  var mems=args.member;
  for(let mem of mems){
    var memuser= await User.findOne({ "meta.id": mem });
    if(!memuser) continue;
    if(!memuser.groups) memuser.groups=[];
    if(memuser.groups.indexOf(args.id)==-1) memuser.groups.push(args.id);
    await memuser.save();
  }

  const userId = user.meta.id;
  const tmpPath = path.join(tmpDir, userId);
  try {
    await fs.stat(path.join(gitRepoDir, userId + '.git'));
  } catch (e) {
    // throw new errors.io.FileNotFoundError(file);
    await gitCpWrap(['-r', path.join(gitRepoDir, 'init.git'), path.join(gitRepoDir, userId + '.git')]);
  }
  const magicStr = randomString.generate(20) + userId;
  await fs.writeFile(
    tmpPath + '.key',
    magicStr
  );
  await gitCpWrap([tmpPath + '.key', path.join(gitRepoDir, userId + '.git', 'hooks', 'key')]);
  user.git_upload_key = magicStr;
  await user.save();

  console.log(`User ${args.email} ${randPass} successfully added`);
  process.exit(0);
})();

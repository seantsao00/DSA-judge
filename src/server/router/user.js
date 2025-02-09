import config from '/config';
import express from 'express';
import { requireLogin } from '/utils';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs-extra';
import wrap from 'express-async-wrap';
import { promisify } from 'bluebird';
import { execFile } from 'child_process';
import _ from 'lodash';
import randomString from 'randomstring';
import User from '/model/user';
const router = express.Router();

const GIT_CP = '/home/git/cp';
const tmpDir = '/tmp/judge_git';
const gitRepoDir = '/home/git/repositories';
const gitAdminDir = config.dirs.gitadmin;
const execFileAsync = promisify(execFile);

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

async function execGit(args, cwd) {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, { cwd });
    if (stderr) console.error(stderr);
    return stdout;
  } catch (e) {
    console.error(`Git command failed: ${e}`);
    throw e;
  }
}

async function updateUserKey (userId, newKey) {
  try {
    const keyPath = path.join(gitAdminDir, 'keydir', `${userId}.pub`);
    await fs.writeFile(keyPath, newKey + '\n');

    await execGit(['add', keyPath], gitAdminDir);
    await execGit(['commit', '--allow-empty', '-m', `Update key for ${userId}`], gitAdminDir);
    await execGit(['push'], gitAdminDir);
  } catch (e) {
    console.error(`Failed to update key for ${userId}: ${e}`);
    throw e;
  }
}

async function createRepo (userId) {
  const gitConfigPath = path.join(gitAdminDir, 'conf', 'gitolite.conf');
  const repoName = `${userId}.git`;

  try {
    // Read the existing configuration file
    let gitConfig = await fs.readFile(gitConfigPath, 'utf8');
  
    // Check if the user is already in the students group
    const studentsGroupPattern = /^@students\s*=\s*(.*)$/m;
    const match = gitConfig.match(studentsGroupPattern);
    console.log(`match: ${match}`);
    let studentsList = match ? match[1].split(/\s+/) : [];
    console.log(`studentsList: ${studentsList}`);

    if (!studentsList.includes(userId)) {
      studentsList.push(userId);
      const newStudentsGroup = `@students = ${studentsList.join(' ')}`;
      gitConfig = gitConfig.replace(studentsGroupPattern, newStudentsGroup);
    }

    await fs.writeFile(gitConfigPath, gitConfig, 'utf8');
    await execGit(['add', gitConfigPath], gitAdminDir);
    await execGit(['commit', '--allow-empty', '-m', `Add repository ${repoName} for ${userId}`], gitAdminDir);
    await execGit(['push'], gitAdminDir);
  } catch (e) {
    console.error(`Failed to create repository for ${userId}: ${e}`);
    throw e;
  }
}

router.get('/me', (req, res) => {
  if (req.user) {
    const user = {};
    user.meta = req.user.meta;
    user.submission_limit = req.user.submission_limit;
    user.roles = req.user.roles;
    user.email = req.user.email;
    user.ssh_key = req.user.ssh_key;
    user.homeworks = req.user.homeworks;
    user.accountType = req.user.accountType;
    user.groups = req.user.groups;
    res.send({
      login: true,
      user: user
    });
  } else {
    res.send({
      login: false
    });
  }
});

router.post('/changePassword', requireLogin, wrap(async (req, res) => {
  const comp = await promisify(bcrypt.compareAsync)(req.body['current-password'], req.user.password);
  if (!comp) { return res.status(403).send('Old password is not correct'); }
  const newPassword = req.body['new-password'];
  let fieldChanged = [];
  if (newPassword.length > 0) {
    if (newPassword !== req.body['confirm-password']) { return res.status(400).send('Two password are not equal.'); }
    if (newPassword.length <= 8) { return res.status(400).send('New password too short'); }
    if (newPassword.length > 30) { return res.status(400).send('New password too long'); }
    try {
      const hash = await promisify(bcrypt.hash)(newPassword, 10);
      // eslint-disable-next-line require-atomic-updates
      req.user.password = hash;
      await req.user.save();
      fieldChanged.push('password');
    } catch (e) {
      return res.status(500).send('Something bad happened... New password may not be saved.');
    }
  }
  let newSshKey = req.body['new-sshkey'];
  const newSshKeys = newSshKey.trim().replace(/\n/g, '').split(' ').filter(s => s !== ' ');
  if (newSshKeys.length >= 2) {
    if (newSshKeys[0] !== 'ssh-rsa' &&
        newSshKeys[0] !== 'ssh-ed25519' &&
        newSshKeys[0] !== 'ecdsa-sha2-nistp256' &&
        newSshKeys[0] !== 'ecdsa-sha2-nistp384' &&
        newSshKeys[0] !== 'ecdsa-sha2-nistp521'
       ) {
      return res.status(400).send('Unsupported SSH Key, only support "rsa", "ed25519", "ecdsa".');
    }
    if (!(/^AAAA[A-Za-z0-9/+]+[=]{0,3}$/i.test(newSshKeys[1]))) {
      return res.status(400).send('Your SSH Key is not valid.');
    }
    newSshKey = newSshKeys[0] + ' ' + newSshKeys[1];
    if (req.user.ssh_key !== newSshKey) {
      if ((await User.find({ ssh_key: newSshKey })).length !== 0) {
        return res.status(403).send('Please don\'t use the same SSH Key with others!');
      }
      try {
        const userId = req.user.meta.id;

        await updateUserKey(userId, newSshKey);

        try {
          await fs.stat(path.join(gitRepoDir, userId + '.git'));
        } catch (e) {
          // Create a new repository for the user
          await createRepo(userId);
        }

        const magicStr = randomString.generate(20) + userId;
        const tmpPath = path.join(tmpDir, userId);
        await fs.writeFile(
          tmpPath + '.key',
          magicStr
        );
        await gitCpWrap([tmpPath + '.key', path.join(gitRepoDir, userId + '.git', 'hooks', 'key')]);
        req.user.ssh_key = newSshKey;
        req.user.git_upload_key = magicStr;
        await req.user.save();
        fieldChanged.push('SSH key');
      } catch (e) {
        console.error(`Failed to update SSH key for ${req.user.meta.id}: ${e}`);
        return res.status(500).send('Something bad happened... New SSH Key may not be saved.');
      }
      // res.send(`SSH Key changed successfully.`);
    }
  } else if (newSshKeys.length === 1) {
    return res.status(400).send('Unsupported SSH Key or it is too short!');
  }
  let newName = req.body['new-name'];
  if (newName !== undefined) {
    if (newName.length == 0) { return res.status(400).send('New name cannot be empty.'); }
    try {
      if (newName.normalize() !== req.user.meta.name.normalize()) {
        if (newName.length > 16) {
          return res.status(400).send('New name should be under 16 characters.');
        } else if (!/^[A-Za-z0-9\u4e00-\u9fff]+$/.test(newName)) {
          return res.status(400).send('New name contains illegal characters.');
        } else {
          req.user.meta.name = newName;
          await req.user.save();
          fieldChanged.push('name');
        }
      }
    } catch (e) {
      return res.status(500).send('Something bad happened... New name may not be saved.');
    }
  }
  if (fieldChanged.length >= 1) {
    res.send('Changed successfully: ' + fieldChanged.join(', '));
  } else {
    res.send('Nothing changed.');
  }
}));

export default router;

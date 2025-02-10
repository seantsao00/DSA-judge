import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import randomString from 'randomstring';
import { promisify } from 'bluebird';
import fs from 'fs';
import { ArgumentParser as Parser } from 'argparse';
import inquirer from 'inquirer';
import csvParser from 'csv-parser';
import { connectDatabase, closeDatabase } from './db';
import User from '/model/user';

const parser = new Parser({
  description: 'Add a users in the CSV file and not exist in the database, and send password mail',
  addHelp: true
});

parser.addArgument(
  ['file'],
  {
    help: 'The CSV file'
  }
);

const main = async () => {
  const args = parser.parseArgs();

  const mailCreds = await inquirer.prompt([
    {
      type: 'input',
      name: 'account',
      message: `Your NTU account (without @ntu.edu.tw):`,
      validate: input => /^\w+$/.test(input) ? true : 'Input a valid NTU account'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your NTU email password:',
      mask: '*',
      validate: input => input.length > 0 ? true : 'Password is required'
    }
  ]);

  const smtpConfig = {
    host: 'smtps.ntu.edu.tw',
    port: 465,
    secure: true,
    auth: {
      user: mailCreds.account,
      pass: mailCreds.password
    }
  };
  const mailTransporter = nodemailer.createTransport(smtpConfig);

  let users = [];

  fs.createReadStream(args.file)
    .pipe(csvParser())
    .on('data', (row) => {
      users.push(row);
    })
    .on('end', async () => {
      console.log(users); // Check if data is correct 

      await connectDatabase();

      for (let user of users) {
        const email = user['email'];
        const id = user['ID'];
        const name = user['name'];
        const role = user['role'];

        if (!email) continue;

        console.log(email, id, name, role);
        await newUserIfNotExist(email, id, name, role, mailTransporter);
      }

      console.log('Processing finished...');

      await closeDatabase();
    });
};

const newUserIfNotExist = async (email, id, name, role, transporter) => {
  const randPass = randomString.generate(10);
  const hashed = await promisify(bcrypt.hash)(randPass, 10);

  let user = await User.findOne({ email: email });

  if (user) {
    console.log(`User ${email} already exists`);
    return;
  }

  user = new User({
    email: email,
    password: hashed,
    roles: [role],
    meta: {
      id,
      name
    }
  });

  const text = (`
Hi ${name},

Welcome to DSA2025! Your DSA Judge account has been successfully created.

Here are your login details:
- Account: ${email}
- Temporary Password: ${randPass}

Please visit https://dsa-2025.csie.org/ to log in and change your password.

Best,  
DSA 2025 TAs
  `);

  const mailOptions = {
    from: '"DSA TAs" <dsa_ta@csie.ntu.edu.tw>',
    to: email,
    subject: '[DSA2025] Your DSA Judge Account',
    text
  };

  console.log(user);
  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

  await user.save();

  console.log(`User ${email} ${randPass} successfully added`);
};

if (require.main === module) {
  main();
}

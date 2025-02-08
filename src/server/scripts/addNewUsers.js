import './common';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prompt from 'prompt';
import randomString from 'randomstring';
import {promisify} from 'bluebird';

import {ArgumentParser as Parser} from 'argparse';
import XLSX from 'xlsx';

const parser = new Parser({
  description: 'Add a new user, and send password mail',
  addHelp: true
});

parser.addArgument(
  [ 'file' ],
  {
    help: 'The xlsx file'
  }
);

const main = async () => {
  const args = parser.parseArgs();

  prompt.start();
  const result = await promisify(prompt.get)({
    properties: {
      account: {
        description: `Your NTU account, don't input @ntu.edu.tw\n (The mail would be send by your account)`,
        pattern: /^\w+$/,
        message: 'Input a valid NTU account',
        required: true
      },
      password: {
        hidden: true
      }
    }
  });

  const smtpConfig = {
    host: 'smtps.ntu.edu.tw',
    port: 465,
    secure: true,
    auth: {
      user: result.account,
      pass: result.password
    }
  };
  const mailTransporter = nodemailer.createTransport(smtpConfig);
  const wb = XLSX.readFile(args.file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_csv(sheet).split('\n').slice(1);

  // Choose the correct columns according to input xls file
  const ID = 3, NAME = 4, EMAIL = 5, ROLE = 0;
  for (let r of rows) {
    if (!r || !r.length) break;
    const td = r.split(',');
    const user = {
      email: td[EMAIL],
      id: td[ID] || '',
      name: td[NAME],
      roles: [td[ROLE]]
    };
    if (!td[EMAIL].length) break;
    console.log(td[EMAIL], td[ID], td[NAME], td[ROLE]);
    await newUser(td[EMAIL], td[ID], td[NAME], td[ROLE], mailTransporter);
  }

  console.log('Ended...');
};

const newUser = async (email, id, name, role, transporter) => {
  const randPass = randomString.generate(10);
  const hashed = await promisify(bcrypt.hash)(randPass, 10);

  let user = await User.findOne({email: email});
  if (!user) {
    user = new User({
      email: email,
      password: hashed,
      roles: [role],
      meta: {
        id,
        name
      }
    });
  } else {
       console.log(`User ${name} ${email} already exists`);
      return;
  }

  const text = (
    `Welcome to DSA2025, this email is to inform you that your DSA Judge account has been created.
Here is your account and temporary password. (You can change your password after logging in.)

- Account: ${email}
- Password: ${randPass}

Head on to https://dsa-2025.csie.org/ and try it!
`);

  const mailOptions = {
    from: '"dsa2025" <dsa_ta@csie.ntu.edu.tw>',
    to: email,
    subject: '[DSA2025]Your DSA Judge Account',
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

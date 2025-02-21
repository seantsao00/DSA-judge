import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import randomString from 'randomstring';
import inquirer from 'inquirer';
import { ArgumentParser as Parser } from 'argparse';
import { connectDatabase, closeDatabase } from './db';
import User from '/model/user';

const parser = new Parser({
  description: 'Reset password for a user',
  addHelp: true
});

parser.addArgument(['email'], { help: 'User email' });

(async () => {
  await connectDatabase();

  const args = parser.parseArgs();

  const { sendMail } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'sendMail',
      message: 'Do you want to send a mail to user about new account?',
      default: false
    }
  ]);

  const randPass = randomString.generate(10);
  const hashed = await bcrypt.hash(randPass, 10);

  let user = await User.findOne({ email: args.email });

  if (!user) {
    console.log(`User ${args.email} not found`);
    await closeDatabase();
    return;
  }

  user.password = hashed;

  if (sendMail) {
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

    await user.save();

    const mailTransporter = nodemailer.createTransport(smtpConfig);

    const text = `
Hi ${args.name},

Welcome to DSA2025! Your DSA Judge account has been successfully created.

Here are your login details:
- Account: ${args.email}
- Temporary Password: ${randPass}

Please visit https://dsa-2025.csie.org/ to log in and change your password.

Best,  
DSA 2025 TAs
    `;

    const mailOptions = {
      from: '"DSA TAs" <dsa_ta@csie.ntu.edu.tw>',
      to: args.email,
      subject: '[DSA2025] Your DSA Judge Account',
      text
    };

    console.log(user);
    await mailTransporter.sendMail(mailOptions);
    console.log(`Mail sent to ${args.email}`);
    mailTransporter.close();
  } else {
    console.log(user);
    await user.save();
  }

  await closeDatabase();

  console.log(`User ${args.email} ${randPass} successfully added`);
})();

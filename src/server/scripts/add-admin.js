import bcrypt from 'bcrypt';
import randomString from 'randomstring';
import { promisify } from 'bluebird';
import { connectDatabase, closeDatabase } from './db';
import User from '/model/user';

(async () => {
  await connectDatabase();

  const randPass = randomString.generate(10);
  const hashed = await promisify(bcrypt.hash)(randPass, 10);
  console.log("this is password:", randPass);

  const roles = ['admin'];
  const user = new User({
    email: 'admin@dsa-2025.csie.org',
    password: hashed,
    roles: roles,
    meta: {
      id: 'admin',
      name: 'Admin'
    }
  });
  await user.save();

  await closeDatabase();
})();

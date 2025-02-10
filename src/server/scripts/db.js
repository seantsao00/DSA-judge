import mongoose from 'mongoose';
import config from '/config';

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    console.log('Database already connected.');
    return mongoose.connection;
  }

  try {
    mongoose.connect(config.mongo.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.set('strictQuery', true);
    mongoose.Promise = Promise;

    isConnected = true;
    console.log('Database connected.');
    return mongoose.connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const closeDatabase = async () => {
  if (!isConnected) {
    console.log('No active database connection.');
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

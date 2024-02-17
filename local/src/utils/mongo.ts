import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

let retryCount = 0;
const WAIT_TIME = 10000;

dotenv.config();

const mongoOptions: mongoose.ConnectOptions = {
  waitQueueTimeoutMS: WAIT_TIME, // max time connection request wait in queue
  dbName: 'translate',
};

const connectWithRetry = () => {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    console.error('DB_URI is not defined in the environment variables');
    return;
  }
  mongoose
    .connect(dbUri, mongoOptions)
    .then(() => {
      console.log('MongoDB connection established');
    })
    .catch((err: any) => {
      console.error('MongoDB connection error:', err);
      console.info(`Retrying connection in ${WAIT_TIME / 10000} seconds...`);
      setTimeout(connectWithRetry, WAIT_TIME); // Retry connection after x sec
    });
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.info('MongoDB reconnected');
});

mongoose.connection.on('connecting', () => {
  retryCount++;
  console.info(`MongoDB connection retry attempt: ${retryCount}`);
});

mongoose.connection.on('error', (error) => {
  console.info(`MongoDB error ${error}`);
});

connectWithRetry();

export default mongoose.connection;

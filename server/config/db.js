import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

let connectionPromise = null;

export function connectDB() {
  if (!env.mongoUri) {
    // eslint-disable-next-line no-console
    console.warn('[db] MONGO_URI is not set. Skipping database connection.');
    return Promise.resolve(null);
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri).then((conn) => {
      // eslint-disable-next-line no-console
      console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    });
  }

  return connectionPromise;
}

export function getDbState() {
  return mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
}

export async function disconnectDB() {
  await mongoose.disconnect();
  connectionPromise = null;
}

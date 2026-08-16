// Firebase configuration and initialization for IoT soil monitoring
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  get,
  set,
  query,
  orderByKey,
  startAt,
  limitToLast,
} from "firebase/database";

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    'Please create a .env file and add your Firebase credentials.'
  );
}

const firebaseConfig = Object.freeze({
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: String(import.meta.env.VITE_FIREBASE_DATABASE_URL),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) : undefined,
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database, ref, onValue, get, set, query, orderByKey, startAt, limitToLast };
export default app;

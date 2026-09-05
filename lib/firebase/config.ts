import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';

// Конфигурация берётся ТОЛЬКО из переменных окружения.
// Заполни .env.local своими значениями из Firebase Console
// (Project settings → General → Your apps → SDK setup and configuration).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function assertConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([key, value]) => key !== 'measurementId' && !value)
    .map(([key]) => key);
  if (missing.length > 0 && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(
      `[firebase] Отсутствуют переменные окружения: ${missing.join(', ')}. ` +
      `Скопируй .env.example в .env.local и заполни значениями из Firebase Console.`
    );
  }
}
assertConfig();

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const firebaseApp = app;
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

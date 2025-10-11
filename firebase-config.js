// Firebase initialization with placeholders. Replace with your project values.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence for faster loads and cached queries
try {
  await enableIndexedDbPersistence(db);
} catch (e) {
  // ignore if multiple tabs or not supported
}



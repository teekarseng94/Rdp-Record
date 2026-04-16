// Firebase initialization with your project configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyBVVXhDCgMxjeVwf3siFEdHrQ5qebvNSaw',
  authDomain: 'rdp-final-677a1.firebaseapp.com',
  projectId: 'rdp-final-677a1',
  storageBucket: 'rdp-final-677a1.firebasestorage.app',
  messagingSenderId: '398537230115',
  appId: '1:398537230115:web:634a176686ea383bf66e96',
  measurementId: 'G-4DKCVHMF1W'
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence for faster loads and cached queries
try {
  await enableIndexedDbPersistence(db);
} catch (e) {
  // ignore if multiple tabs or not supported
}



import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyDygTWuvn7I5gQSNCNZEglY--1w8L6JUkQ',
  authDomain: 'foodrecognition-7219e.firebaseapp.com',
  databaseURL: 'https://foodrecognition-7219e-default-rtdb.firebaseio.com',
  projectId: 'foodrecognition-7219e',
  storageBucket: 'foodrecognition-7219e.appspot.com',
  messagingSenderId: '25257904795',
  appId: '1:25257904795:web:539f7925802a9ffa72943e',
  measurementId: 'G-VCT850W55C',
};

// Avoid reinitializing the Firebase app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
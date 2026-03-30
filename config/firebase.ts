import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA6fw4PKPbmNxoaqngCvlelVtfaLyDIO48",
  authDomain: "skill-learning-app-1bd69.firebaseapp.com",
  databaseURL:
    "https://skill-learning-app-1bd69-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skill-learning-app-1bd69",
  storageBucket: "skill-learning-app-1bd69.appspot.com",
  messagingSenderId: "566742850753",
  appId: "1:566742850753:web:29cf73b5fc196d116cc840",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getDatabase(app);
export const auth = getAuth(app);

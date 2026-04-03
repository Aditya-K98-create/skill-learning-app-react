import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6fw4PKPbmNxoaqngCvlelVtfaLyDIO48",
  authDomain: "skill-learning-app-1bd69.firebaseapp.com",
  projectId: "skill-learning-app-1bd69",
  storageBucket: "skill-learning-app-1bd69.firebasestorage.app",
  messagingSenderId: "566742850753",
  appId: "1:566742850753:web:29cf73b5fc196d116cc840",
};

const app = initializeApp(firebaseConfig);

// 🔥 IMPORTANT
export const auth = getAuth(app);
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCKPxp_6AmMZdZvDvQzbvmht6DVD1TMScQ",
    authDomain: "auction-online-60c23.firebaseapp.com",
    databaseURL: "https://auction-online-60c23-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "auction-online-60c23",
    storageBucket: "auction-online-60c23.firebasestorage.app",
    messagingSenderId: "36366206078",
    appId: "1:36366206078:web:612e78570c97436028c42f",
    measurementId: "G-599NBKGHGJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getDatabase(app);
export const database = getFirestore(app); 

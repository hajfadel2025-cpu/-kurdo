import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, getDocs, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "ضع_هنا_الـ_apiKey_الخاص_بك",
    authDomain: "ضع_هنا_الـ_authDomain_الخاص_بك",
    projectId: "ضع_هنا_الـ_projectId_الخاص_بك",
    storageBucket: "ضع_هنا_الـ_storageBucket_الخاص_بك",
    messagingSenderId: "ضع_هنا_الـ_messagingSenderId_الخاص_بك",
    appId: "ضع_هنا_الـ_appId_الخاص_بك"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, doc, setDoc, addDoc, collection, getDocs, updateDoc, query, where, signInWithEmailAndPassword, signOut, onAuthStateChanged };

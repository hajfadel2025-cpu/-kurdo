import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, addDoc, collection, getDocs, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// الإعدادات الحقيقية الخاصة بمشروعك
const firebaseConfig = {
    apiKey: "AIzaSyBYYTuw5by2RZM27mZynVuvmmWxQNvomKQ",
    authDomain: "haj-fadel-accounting.firebaseapp.com",
    projectId: "haj-fadel-accounting",
    storageBucket: "haj-fadel-accounting.firebasestorage.app",
    messagingSenderId: "449205985318",
    appId: "1:449205985318:web:2dece1e1412165b01f46e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, doc, setDoc, addDoc, collection, getDocs, updateDoc, query, where, signInWithEmailAndPassword, signOut, onAuthStateChanged };

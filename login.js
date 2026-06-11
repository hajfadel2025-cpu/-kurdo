import { auth, db, signInWithEmailAndPassword, collection, query, where, getDocs } from "./firebase-config.js";

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    errorMsg.style.display = 'none';

    try {
        console.log("جاري تسجيل الدخول لـ:", email);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log("تم تسجيل الدخول بنجاح، UID:", user.uid);

        // البحث عن المستخدم في Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let role = "مندوب";
        
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                role = data.role || data.accountType || "مندوب";
                console.log("دور المستخدم:", role);
            });
        } else {
            console.log("لم يتم العثور على المستخدم في users، يتم التوجيه كمندوب");
        }

        // التوجيه حسب الدور
        if (role === "admin" || role === "مدير") {
            console.log("توجيه إلى dashboard.html");
            window.location.href = "dashboard.html";
        } else {
            console.log("توجيه إلى sales.html");
            window.location.href = "sales.html";
        }

    } catch (error) {
        console.error("خطأ في تسجيل الدخول:", error);
        
        let message = "فشل تسجيل الدخول";
        if (error.code === 'auth/user-not-found') {
            message = "❌ البريد الإلكتروني غير مسجل";
        } else if (error.code === 'auth/wrong-password') {
            message = "❌ كلمة المرور غير صحيحة";
        } else if (error.code === 'auth/invalid-email') {
            message = "❌ البريد الإلكتروني غير صالح";
        } else {
            message = "❌ " + error.message;
        }
        
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
});

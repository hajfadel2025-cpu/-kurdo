import { auth, db, signInWithEmailAndPassword, doc, getDocs, collection, query, where, sendPasswordResetEmail } from "./firebase-config.js";

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const loadingSpinner = document.getElementById('loadingSpinner');
const loginBtn = document.getElementById('loginBtn');

// تحميل البريد الإلكتروني المحفوظ (تذكرني)
if (localStorage.getItem('rememberedEmail')) {
    const emailInput = document.getElementById('email');
    const rememberCheck = document.getElementById('rememberCheck');
    if (emailInput && rememberCheck) {
        emailInput.value = localStorage.getItem('rememberedEmail');
        rememberCheck.checked = true;
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberCheck')?.checked || false;
    
    // إظهار رسالة التحميل
    if (errorMsg) errorMsg.style.display = 'none';
    if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
    if (loginBtn) loginBtn.disabled = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // حفظ تذكرني
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // البحث عن دور المستخدم في Firestore
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let role = "مندوب";
        let userData = null;
        
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                userData = doc.data();
                // دعم كل من role و accountType
                role = userData.role || userData.accountType || "مندوب";
            });
        } else {
            // إذا لم يتم العثور على المستخدم، نحاول البحث بالبريد الإلكتروني
            const q2 = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot2 = await getDocs(q2);
            if (!querySnapshot2.empty) {
                querySnapshot2.forEach((doc) => {
                    userData = doc.data();
                    role = userData.role || userData.accountType || "مندوب";
                });
            }
        }

        // التوجيه حسب الدور
        if (role === "admin" || role === "مدير") {
            window.location.href = "dashboard.html";
        } else if (role === "مندوب") {
            window.location.href = "sales.html";
        } else {
            window.location.href = "sales.html";
        }

    } catch (error) {
        console.error("خطأ أثناء تسجيل الدخول:", error);
        
        // عرض رسالة خطأ مناسبة
        let errorMessage = "حدث خطأ في تسجيل الدخول";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "❌ لا يوجد حساب مرتبط بهذا البريد الإلكتروني";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "❌ كلمة المرور غير صحيحة";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "❌ البريد الإلكتروني غير صالح";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "❌ تم تجاوز عدد المحاولات. حاول لاحقاً";
        }
        
        if (errorMsg) {
            errorMsg.textContent = errorMessage;
            errorMsg.style.display = 'block';
        }
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (loginBtn) loginBtn.disabled = false;
    }
});

// وظيفة نسيت كلمة المرور
window.forgotPassword = async function() {
    const email = document.getElementById('email')?.value;
    
    if (!email) {
        if (errorMsg) {
            errorMsg.textContent = "❌ الرجاء إدخال بريدك الإلكتروني أولاً";
            errorMsg.style.display = 'block';
        }
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        if (errorMsg) {
            errorMsg.textContent = "✅ تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني";
            errorMsg.style.background = "#d4edda";
            errorMsg.style.color = "#155724";
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        if (errorMsg) {
            errorMsg.textContent = "❌ حدث خطأ: " + error.message;
            errorMsg.style.display = 'block';
        }
    }
};

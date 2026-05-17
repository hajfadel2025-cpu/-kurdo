import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. تفعيل زر حفظ مستخدم جديد في قاعدة البيانات
document.getElementById('saveUserBtn').addEventListener('click', async function() {
    const name = document.getElementById('employeeName').value;
    const type = document.getElementById('accountType').value;
    
    // قراءة الصلاحيات التي تم تحديدها بعلامة صح
    const viewProfits = document.getElementById('c1').checked;
    const editInventory = document.getElementById('c2').checked;
    const deleteInvoices = document.getElementById('c3').checked;

    if (!name) {
        alert("الرجاء إدخال اسم الموظف أولاً!");
        return;
    }

    try {
        // حفظ البيانات في جدول "users" داخل Firestore
        await addDoc(collection(db, "users"), {
            employeeName: name,
            accountType: type,
            permissions: {
                viewProfits: viewProfits,
                editInventory: editInventory,
                deleteInvoices: deleteInvoices
            },
            createdAt: new Date()
        });

        alert(`تم حفظ الموظف (${name}) وصلاحياته بنجاح في قاعدة البيانات!`);
        
        // تفريغ الخانات بعد الحفظ
        document.getElementById('employeeName').value = "";
        document.getElementById('c1').checked = false;
        document.getElementById('c2').checked = false;
        document.getElementById('c3').checked = false;

    } catch (error) {
        console.error("خطأ أثناء الحفظ: ", error);
        alert("حدث خطأ أثناء الاتصال بالسيرفر: " + error.message);
    }
});

// 2. كود جلب وقراءة إجمالي كميات المخزن تلقائياً من جدول الـ "inventory"
async function fetchTotalInventory() {
    try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        let total = 0;
        
        querySnapshot.forEach((doc) => {
            // يفترض وجود حقل اسمه quantity داخل جدول المخزن الخاص بك
            const data = doc.data();
            total += Number(data.quantity || 0);
        });

        // عرض الرقم الحقيقي المستورد من السيرفر على الشاشة
        document.getElementById('totalItemsCount').innerText = total.toLocaleString('ar-EG');
    } catch (error) {
        console.error("خطأ في قراءة بيانات المخزن: ", error);
        document.getElementById('totalItemsCount').innerText = "خطأ";
    }
}

// تشغيل جلب المخزن بمجرد فتح الصفحة
fetchTotalInventory();

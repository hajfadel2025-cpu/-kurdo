import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. الاستماع لزر "إضافة المادة" وحفظها سحابياً في الـ Firestore
document.getElementById('addItemBtn').addEventListener('click', async function() {
    const name = document.getElementById('itemName').value.trim();
    const qty = document.getElementById('itemQty').value;
    const price = document.getElementById('itemPrice').value;

    // التأكد من إدخال البيانات المطلوبة بشكل صحيح
    if (!name || !qty || !price) {
        alert("الرجاء ملء جميع الخانات (اسم المادة، الكمية، السعر) أولاً!");
        return;
    }

    try {
        // حفظ المادة في جدول "inventory" داخل Firestore
        await addDoc(collection(db, "inventory"), {
            itemName: name,
            quantity: Number(qty),
            price: Number(price),
            createdAt: new Date()
        });

        alert(`تم إضافة المادة (${name}) إلى المخزن بنجاح!`);
        
        // تفريغ خانات الإدخال بعد الحفظ
        document.getElementById('itemName').value = "";
        document.getElementById('itemQty').value = "";
        document.getElementById('itemPrice').value = "";

    } catch (error) {
        console.error("خطأ أثناء إضافة المادة للمخزن: ", error);
        alert("حدث خطأ أثناء الاتصال بالسيرفر: " + error.message);
    }
});

// 2. جلب بضاعة المخزن تلقائياً وتحديث الجدول بشكل لحظي (Realtime)
onSnapshot(collection(db, "inventory"), (snapshot) => {
    const tableBody = document.getElementById('inventoryTable');
    tableBody.innerHTML = ''; // تنظيف الجدول قبل التحديث

    if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id;

            // تحديد شارة الحالة (متوفر أو نفذت الكمية)
            let statusBadge = '';
            if (item.quantity > 0) {
                statusBadge = `<span class="status-badge">متوفر (${item.quantity})</span>`;
            } else {
                statusBadge = `<span class="status-badge status-out">نفذت الكمية</span>`;
            }

            // بناء سطر المادة داخل الجدول مع إضافة زر الحذف
            const row = `
                <tr>
                    <td><strong>${item.itemName}</strong></td>
                    <td>${Number(item.quantity).toLocaleString('ar-EG')}</td>
                    <td>$${Number(item.price).toLocaleString('ar-EG')}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;" 
                                onclick="deleteItem('${id}')">حذف</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">المخزن فارغ حالياً، قم بإضافة مواد جديدة</td></tr>';
    }
});

// 3. وظيفة حذف مادة نهائياً من المخزن السحابي
window.deleteItem = async function(id) {
    if (confirm('هل أنت متأكد من حذف هذه المادة نهائياً من المخزن؟')) {
        try {
            await deleteDoc(doc(db, "inventory", id));
        } catch (error) {
            console.error("خطأ أثناء الحذف: ", error);
            alert("لم يتم الحذف بسبب خطأ: " + error.message);
        }
    }
}

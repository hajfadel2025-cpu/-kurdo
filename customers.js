import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. إضافة عميل جديد يدوياً من خلال الفورم
const addCustomerBtn = document.getElementById('addCustomerBtn');
if (addCustomerBtn) {
    addCustomerBtn.addEventListener('click', async () => {
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        const initialDebt = parseFloat(document.getElementById('custInitialDebt').value) || 0;

        if (!name) {
            alert("الرجاء إدخال اسم العميل أو المحل!");
            return;
        }

        try {
            await addDoc(collection(db, "customers"), {
                customerName: name,
                phone: phone,
                totalDebt: initialDebt,
                createdAt: new Date()
            });
            alert(`تمت إضافة العميل ${name} بنجاح!`);
            document.getElementById('custName').value = '';
            document.getElementById('custPhone').value = '';
            document.getElementById('custInitialDebt').value = '0';
        } catch (error) {
            console.error("خطأ في إضافة العميل:", error);
        }
    });
}

// 2. الاستماع اللحظي لجدول العملاء وعرضهم في الجدول
const customersTable = document.getElementById('customersTable');
if (customersTable) {
    onSnapshot(collection(db, "customers"), (snapshot) => {
        customersTable.innerHTML = '';

        if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
                const cust = docSnap.data();
                const id = docSnap.id;

                let badgeClass = '';
                let badgeText = '';
                let statusIcon = '';

                // فحص حالة الحساب (دين، خالص، أو دفعة مقدمة بالسالب)
                if (cust.totalDebt === 0) {
                    badgeClass = 'debt-badge debt-clean';
                    badgeText = 'خالص الحساب';
                    statusIcon = '✅';
                } else if (cust.totalDebt > 0) {
                    badgeClass = 'debt-badge debt-active';
                    badgeText = `مطلوب $${cust.totalDebt.toFixed(2)}`;
                    statusIcon = '⚠️';
                } else {
                    // إذا كان الحساب أصغر من صفر (بالسالب) يعني دفعة مقدمة للزبون
                    badgeClass = 'debt-badge';
                    badgeText = `له رصيد مدور $${Math.abs(cust.totalDebt).toFixed(2)}`;
                    statusIcon = '💰';
                }

                const row = `
                    <tr>
                        <td><strong>${cust.customerName}</strong></td>
                        <td>${cust.phone || 'غير مسجل'}</td>
                        <td><span class="${badgeClass}" style="${cust.totalDebt < 0 ? 'background: #e3f2fd; color: #0d47a1;' : ''}">${badgeText}</span></td>
                        <td>${statusIcon}</td>
                        <td>
                            <button class="btn-pay" onclick="payDebt('${id}', ${cust.totalDebt})">💸 قبض دفعة</button>
                        </td>
                    </tr>
                `;
                customersTable.innerHTML += row;
            });
        } else {
            customersTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا يوجد عملاء مسجلين حالياً</td></tr>';
        }
    });
}

// 3. دالة سداد وقبض الدفعات المادية (تقبل الدفعات الزائدة الآن)
window.payDebt = async function(id, currentDebt) {
    const amount = parseFloat(prompt(`الحساب الحالي للعميل هو $${currentDebt.toFixed(2)}\nأدخل المبلغ المقبوض ($):`));
    
    if (isNaN(amount) || amount <= 0) {
        alert("الرجاء إدخال مبلغ صحيح!");
        return;
    }

    try {
        const customerRef = doc(db, "customers", id);
        // خصم المبلغ مباشرة حتى لو أصبح الناتج بالسالب
        await updateDoc(customerRef, {
            totalDebt: currentDebt - amount
        });
        alert("تم تسجيل الدفعة بنجاح وتحديث الحساب السحابي!");
    } catch (error) {
        console.error("خطأ في تحديث الدفعة:", error);
    }
};

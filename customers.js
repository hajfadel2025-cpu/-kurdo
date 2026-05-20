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
            // تفريغ الحقول
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

                // تحديد شكل شارة الدين (أخضر إذا صفر، أحمر إذا عليه ديون)
                const badgeClass = cust.totalDebt <= 0 ? 'debt-badge debt-clean' : 'debt-badge debt-active';
                const badgeText = cust.totalDebt <= 0 ? 'خالص الحساب' : `مطلوب $${cust.totalDebt.toFixed(2)}`;

                const row = `
                    <tr>
                        <td><strong>${cust.customerName}</strong></td>
                        <td>${cust.phone || 'غير مسجل'}</td>
                        <td><span class="${badgeClass}">${badgeText}</span></td>
                        <td>${cust.totalDebt <= 0 ? '✅' : '⚠️'}</td>
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

// 3. دالة سداد وقبض الدفعات المادية من العملاء لتحديث الحساب سحابياً
window.payDebt = async function(id, currentDebt) {
    const amount = parseFloat(prompt(`الدين الحالي هو $${currentDebt.toFixed(2)}\nأدخل المبلغ الواصل المراد قبضه من الزبون ($):`));
    
    if (isNaN(amount) || amount <= 0) {
        alert("الرجاء إدخال مبلغ صحيح!");
        return;
    }

    if (amount > currentDebt) {
        alert("المبلغ المدفوع أكبر من الدين المترتب على العميل!");
        return;
    }

    try {
        const customerRef = doc(db, "customers", id);
        await updateDoc(customerRef, {
            totalDebt: currentDebt - amount
        });
        alert("تم تسجيل الدفعة وتحديث حساب العميل بنجاح!");
    } catch (error) {
        console.error("خطأ في تحديث الدفعة:", error);
    }
};

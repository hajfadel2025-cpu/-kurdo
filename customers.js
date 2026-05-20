import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. إضافة عميل جديد
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

let allCustomers = []; // مصفوفة لحفظ البيانات محلياً لتسريع عملية البحث

// 2. الاستماع اللحظي وحساب الإحصائيات الفوقية لـ مكتب حاج فاضل
onSnapshot(collection(db, "customers"), (snapshot) => {
    allCustomers = [];
    let globalDebts = 0;
    let globalCredits = 0;
    
    if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allCustomers.push({ id: docSnap.id, ...data });
            
            if (data.totalDebt > 0) {
                globalDebts += data.totalDebt;
            } else if (data.totalDebt < 0) {
                globalCredits += Math.abs(data.totalDebt);
            }
        });
    }
    
    // تحديث الصناديق الإحصائية في الواجهة
    document.getElementById('totalGlobalDebts').innerText = `$${globalDebts.toFixed(2)}`;
    document.getElementById('totalGlobalCredits').innerText = `$${globalCredits.toFixed(2)}`;
    document.getElementById('totalCustomersCount').innerText = allCustomers.length;
    
    // عرض الجدول المحدث
    renderTable(allCustomers);
});

// دالة بناء ورسم الجدول
function renderTable(customersList) {
    const customersTable = document.getElementById('customersTable');
    if (!customersTable) return;
    
    customersTable.innerHTML = '';
    
    if (customersList.length === 0) {
        customersTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">لا توجد بيانات عملاء تطابق بحثك حالياً</td></tr>';
        return;
    }
    
    customersList.forEach((cust) => {
        let badgeClass = '';
        let badgeText = '';
        let statusIcon = '';

        if (cust.totalDebt === 0) {
            badgeClass = 'badge-custom badge-clean';
            badgeText = 'خالص الحساب';
            statusIcon = '<span class="text-success fw-bold">✅ خالص</span>';
        } else if (cust.totalDebt > 0) {
            badgeClass = 'badge-custom badge-debt';
            badgeText = `مطلوب $${cust.totalDebt.toFixed(2)}`;
            statusIcon = '<span class="text-danger fw-bold">⚠️ عليه دين</span>';
        } else {
            badgeClass = 'badge-custom badge-credit';
            badgeText = `له رصيد مدور $${Math.abs(cust.totalDebt).toFixed(2)}`;
            statusIcon = '<span class="text-primary fw-bold">💰 دفع مقدمة</span>';
        }

        const row = `
            <tr>
                <td><strong><i class="fas fa-store text-muted me-2"></i>${cust.customerName}</strong></td>
                <td><span class="text-muted">${cust.phone || '—'}</span></td>
                <td><span class="${badgeClass}">${badgeText}</span></td>
                <td>${statusIcon}</td>
                <td>
                    <button class="btn-pay shadow-sm" onclick="payDebt('${cust.id}', ${cust.totalDebt})">
                        <i class="fas fa-cash-register me-1"></i> قبض دفعة
                    </button>
                </td>
            </tr>
        `;
        customersTable.innerHTML += row;
    });
}

// 3. محرك البحث الفوري السريع
const searchInput = document.getElementById('searchCustomer');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allCustomers.filter(cust => 
            cust.customerName.toLowerCase().includes(term) || 
            (cust.phone && cust.phone.includes(term))
        );
        renderTable(filtered);
    });
}

// 4. دالة قبض الدفعات (تسمح بقبض مبالغ زائدة وتحويل الحساب لرصيد مدور)
window.payDebt = async function(id, currentDebt) {
    const amount = parseFloat(prompt(`الحساب الجاري للعميل هو: $${currentDebt.toFixed(2)}\nأدخل المبلغ المستلم لتنزيله من حسابه ($):`));
    
    if (isNaN(amount) || amount <= 0) {
        alert("الرجاء إدخال مبلغ صحيح!");
        return;
    }

    try {
        const customerRef = doc(db, "customers", id);
        await updateDoc(customerRef, {
            totalDebt: currentDebt - amount
        });
        alert("تم تقييد الحركة وتحديث الحساب السحابي بنجاح!");
    } catch (error) {
        console.error("خطأ في تحديث الدفعة:", error);
    }
};

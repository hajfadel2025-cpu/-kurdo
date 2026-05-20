import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. إضافة عميل جديد من خلال الفورم العلوي
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
            // تفريغ الحقول بعد الإضافة الناجحة
            document.getElementById('custName').value = '';
            document.getElementById('custPhone').value = '';
            document.getElementById('custInitialDebt').value = '0';
        } catch (error) {
            console.error("خطأ في إضافة العميل:", error);
        }
    });
}

let allCustomers = []; // مصفوفة لتخزين البيانات محلياً لتسريع عملية البحث الفوري

// 2. الاستماع اللحظي وحساب الإحصائيات الفوقية لـ مكتب حاج فاضل
onSnapshot(collection(db, "customers"), (snapshot) => {
    allCustomers = [];
    let globalDebts = 0;
    let globalCredits = 0;
    
    if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allCustomers.push({ id: docSnap.id, ...data });
            
            // حساب الإحصائيات بناءً على حالة الحساب المالي
            if (data.totalDebt > 0) {
                globalDebts += data.totalDebt;
            } else if (data.totalDebt < 0) {
                globalCredits += Math.abs(data.totalDebt);
            }
        });
    }
    
    // تحديث الصناديق الإحصائية العلوية في الواجهة مباشرة
    document.getElementById('totalGlobalDebts').innerText = `$${globalDebts.toFixed(2)}`;
    document.getElementById('totalGlobalCredits').innerText = `$${globalCredits.toFixed(2)}`;
    document.getElementById('totalCustomersCount').innerText = allCustomers.length;
    
    // عرض جدول العملاء المحدث
    renderTable(allCustomers);
});

// دالة بناء ورسم الجدول مع أزرار الإجراءات، التعديل والحذف
function renderTable(customersList) {
    const customersTable = document.getElementById('customersTable');
    if (!customersTable) return;
    
    customersTable.innerHTML = '';
    
    if (customersList.length === 0) {
        customersTable.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">لا توجد بيانات عملاء تطابق بحثك حالياً</td></tr>';
        return;
    }
    
    customersList.forEach((cust) => {
        let badgeClass = '';
        let badgeText = '';
        let statusIcon = '';

        // تحديد نمط الشارة والأيقونة حسب حالة حساب الزبون
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
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editCustomer('${cust.id}', '${cust.customerName}', '${cust.phone || ''}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer('${cust.id}', '${cust.customerName}')">
                        <i class="fas fa-trash-alt"></i> حذف
                    </button>
                </td>
            </tr>
        `;
        customersTable.innerHTML += row;
    });
}

// 3. محرك البحث الفوري السريع في الجدول
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

// 4. دالة قبض الدفعات (مع حماية صارمة لمنع إدخل 0 أو قيم فارغة أو نصوص خاطئة)
window.payDebt = async function(id, currentDebt) {
    const input = prompt(`الحساب الجاري للعميل هو: $${currentDebt.toFixed(2)}\nأدخل المبلغ المستلم لتنزيله من حسابه ($):`);
    
    // في حال قام المستخدم بالضغط على إلغاء الأمر (Cancel)
    if (input === null) return;

    const amount = parseFloat(input);
    
    // التحقق الصارم من صحة المدخلات (تمنع الصفر، الفراغ، والنصوص العشوائية)
    if (isNaN(amount) || amount <= 0) {
        alert("❌ خطأ: يجب إدخل مبلغ صحيح أكبر من صفر لإتمام عملية القبض المالي!");
        return;
    }

    try {
        const customerRef = doc(db, "customers", id);
        await updateDoc(customerRef, {
            totalDebt: currentDebt - amount
        });
        alert("✅ تم تقييد الحركة وتحديث الحساب السحابي بنجاح!");
    } catch (error) {
        console.error("خطأ في تحديث الدفعة المالية:", error);
    }
};

// 5. دالة تعديل بيانات العميل الأساسية (الاسم ورقم الهاتف)
window.editCustomer = async function(id, currentName, currentPhone) {
    const newName = prompt("تعديل اسم العميل / المحل الجاري:", currentName);
    if (!newName || newName.trim() === "") {
        if (newName !== null) alert("لا يمكن ترك اسم العميل فارغاً!");
        return;
    }
    
    const newPhone = prompt("تعديل رقم الهاتف الجاري:", currentPhone);
    if (newPhone === null) return; // إلغاء عملية التعديل بالكامل

    try {
        const customerRef = doc(db, "customers", id);
        await updateDoc(customerRef, {
            customerName: newName.trim(),
            phone: newPhone.trim()
        });
        alert("✅ تم تحديث بيانات العميل السحابية بنجاح!");
    } catch (error) {
        console.error("خطأ في تعديل بيانات العميل:", error);
    }
};

// 6. دالة حذف العميل نهائياً من قاعدة البيانات السحابية
window.deleteCustomer = async function(id, name) {
    const confirmDelete = confirm(`⚠️ تحذير صارم جداً!\nهل أنت متأكد تماماً من حذف العميل "${name}" نهائياً من السحابة؟\nعند التأكيد، سيتم إزالة كافة سجلات هذا العميل ولا يمكن التراجع عنها!`);
    
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "customers", id));
        alert(`🗑️ تم حذف العميل "${name}" وإلغاء قيوده السحابية بنجاح.`);
    } catch (error) {
        console.error("خطأ في حذف بيانات العميل نهائياً:", error);
    }
};

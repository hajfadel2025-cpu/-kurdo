import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. كود إدارة الموظفين والصلاحيات (الحالي عندك)
// ==========================================
const userForm = document.getElementById('userForm'); // أو المعرف الموجود لديك للفورم
if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const employeeName = document.getElementById('employeeName').value.trim();
        const accountType = document.getElementById('accountType').value;
        const viewProfits = document.getElementById('viewProfits').checked;
        const editInventory = document.getElementById('editInventory').checked;
        const deleteInvoices = document.getElementById('deleteInvoices').checked;

        if (!employeeName) {
            alert("الرجاء إدخال اسم الموظف!");
            return;
        }

        try {
            await addDoc(collection(db, "users"), {
                employeeName: employeeName,
                accountType: accountType,
                permissions: {
                    viewProfits: viewProfits,
                    editInventory: editInventory,
                    deleteInvoices: deleteInvoices
                },
                createdAt: new Date()
            });
            alert("تم حفظ المستخدم وصلاحياته بنجاح!");
            userForm.reset();
        } catch (error) {
            console.error("خطأ في حفظ المستخدم: ", error);
            alert("حدث خطأ أثناء الحفظ: " + error.message);
        }
    });
}

// ==========================================
// 2. الكود الجديد المطور: جرد كميات المواد تفصيلياً
// ==========================================
const detailedList = document.getElementById('detailedInventoryList');

if (detailedList) {
    // الاستماع اللحظي للتغيرات في جدول الـ inventory داخل Firestore
    onSnapshot(collection(db, "inventory"), (snapshot) => {
        detailedList.innerHTML = ''; // تنظيف الجدول قبل تعبئته من جديد

        if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
                const item = docSnap.data();
                
                // تحديد لون وتصميم الكمية حسب توفرها
                let qtyStyle = "font-weight: bold; color: #2c3e50;";
                let qtyDisplay = Number(item.quantity).toLocaleString('ar-EG');

                if (item.quantity === 0) {
                    qtyStyle = "font-weight: bold; color: #c62828; background: #ffebee; padding: 2px 8px; border-radius: 4px; font-size: 13px;";
                    qtyDisplay = "نفذت";
                } else if (item.quantity <= 5) {
                    qtyStyle = "font-weight: bold; color: #ef6c00; background: #fff3e0; padding: 2px 8px; border-radius: 4px; font-size: 13px;";
                }

                // بناء السطر وإضافته للجدول الرئيسي
                const row = `
                    <tr style="border-bottom: 1px solid #f8f9fa;">
                        <td style="padding: 10px 6px; text-align: right; font-weight: 500; color: #333;">
                            <i class="fas fa-box-open text-muted ms-1" style="font-size: 12px;"></i> ${item.itemName}
                        </td>
                        <td style="padding: 10px 6px; text-align: center; ${qtyStyle}">
                            ${qtyDisplay}
                        </td>
                    </tr>
                `;
                detailedList.innerHTML += row;
            });
        } else {
            detailedList.innerHTML = '<tr><td colspan="2" class="text-center text-muted" style="padding: 15px;">المخزن فارغ حالياً، قم بإضافة مواد</td></tr>';
        }
    });
}

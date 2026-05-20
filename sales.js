import { db } from './firebase-config.js';
import { collection, getDocs, doc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, get, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// إعدادات الـ Realtime Database لجلب المندوبين (نفس إعدادات مشروعك)
const firebaseConfig = {
    apiKey: "AIzaSyBYYTuw5bY2RZM27mZynVuvmmWxQNvomKQ",
    authDomain: "haj-fadel-accounting.firebaseapp.com",
    projectId: "haj-fadel-accounting",
    storageBucket: "haj-fadel-accounting.firebasestorage.app",
    messagingSenderId: "449205985318",
    appId: "1:449205985318:web:2dece1e1412165b01f46e7"
};
const rtdbApp = initializeApp(firebaseConfig, "rtdbApp");
const rtdb = getDatabase(rtdbApp);

// مصفوفة محلية لتخزين عناصر الفاتورة الحالية قبل الحفظ النهائي
let invoiceItems = [];
let dbProducts = {}; // لتخزين الكميات والأسعار الأصلية القادمة من السيرفر

// 1. توليد رقم فاتورة عشوائي ذكي عند فتح الصفحة
document.getElementById('invoiceNumber').value = 'INV-' + Math.floor(100000 + Math.random() * 900000);

// 2. جلب قائمة المندوبين من الـ Realtime Database وتعبئتها في القائمة المنسدلة
async function loadMandubs() {
    const mandubSelect = document.getElementById('invoiceMandub');
    try {
        const snapshot = await get(ref(rtdb, "mandubs"));
        mandubSelect.innerHTML = '<option value="">-- اختر المندوب --</option>';
        if (snapshot.exists()) {
            const data = snapshot.val();
            for (let id in data) {
                mandubSelect.innerHTML += `<option value="${id}">${data[id].name}</option>`;
            }
        } else {
            mandubSelect.innerHTML = '<option value="">لا يوجد مندوبين مسجلين</option>';
        }
    } catch (error) {
        console.error("خطأ في جلب المندوبين:", error);
    }
}

// 3. جلب بضائع المخزن من Firestore لتعبئة قائمة المواد
async function loadInventory() {
    const productSelect = document.getElementById('productSelect');
    try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        productSelect.innerHTML = '<option value="">-- اختر المادة --</option>';
        dbProducts = {}; // إعادة تهيئة
        
        querySnapshot.forEach((docSnap) => {
            const prod = docSnap.data();
            const id = docSnap.id;
            dbProducts[id] = { id: id, ...prod };
            
            if (prod.quantity > 0) {
                productSelect.innerHTML += `<option value="${id}">${prod.itemName}</option>`;
            }
        });
    } catch (error) {
        console.error("خطأ في جلب بضاعة المخزن:", error);
    }
}

// 4. تحديث تلميح الكمية المتوفرة والسعر الافتراضي عند اختيار مادة
window.updateMaxQty = function() {
    const prodId = document.getElementById('productSelect').value;
    const hintSpan = document.getElementById('availableQtyHint');
    const priceInput = document.getElementById('salePrice');
    
    if (prodId && dbProducts[prodId]) {
        const item = dbProducts[prodId];
        hintSpan.innerText = `المتوفر: ${item.quantity}`;
        priceInput.value = item.price; // وضع السعر الافتراضي للمادة
        document.getElementById('saleQty').max = item.quantity;
    } else {
        hintSpan.innerText = `المتوفر: 0`;
        priceInput.value = '';
    }
};

// 5. إضافة مادة إلى الجدول المؤقت للفاتورة
document.getElementById('addItemToInvoiceBtn').addEventListener('click', function() {
    const prodId = document.getElementById('productSelect').value;
    const qty = parseInt(document.getElementById('saleQty').value);
    const salePrice = parseFloat(document.getElementById('salePrice').value);
    
    if (!prodId || !qty || !salePrice || qty <= 0) {
        alert("الرجاء اختيار المادة وتحديد الكمية والسعر بشكل صحيح!");
        return;
    }
    
    const originalItem = dbProducts[prodId];
    if (qty > originalItem.quantity) {
        alert(`الكمية المطلوبة أكبر من المتوفر بالمخزن! المتاح حالياً هو: ${originalItem.quantity}`);
        return;
    }
    
    // التحقق مما إذا كانت المادة مضافة مسبقاً للفاتورة لتحديثها بدلاً من التكرار
    const existingIndex = invoiceItems.findIndex(i => i.productId === prodId);
    if (existingIndex > -1) {
        if ((invoiceItems[existingIndex].quantity + qty) > originalItem.quantity) {
            alert("مجموع الكمية المضافة لهذه المادة يتجاوز المتوفر بالمخزن!");
            return;
        }
        invoiceItems[existingIndex].quantity += qty;
        invoiceItems[existingIndex].total += (qty * salePrice);
    } else {
        invoiceItems.push({
            productId: prodId,
            itemName: originalItem.itemName,
            quantity: qty,
            price: salePrice,
            costPrice: originalItem.price, // حفظ التكلفة لحساب الأرباح لاحقاً
            total: qty * salePrice
        });
    }
    
    updateInvoiceTable();
    // تفريغ حقول الإدخال الفرعية
    document.getElementById('saleQty').value = '';
});

// 6. تحديث عرض جدول الفاتورة وحساب المجموع النهائي
function updateInvoiceTable() {
    const tableBody = document.getElementById('invoiceItemsTable');
    let totalHTML = 0;
    tableBody.innerHTML = '';
    
    if (invoiceItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="color: #999;">لم يتم إضافة أي مواد للفاتورة بعد</td></tr>';
        document.getElementById('invoiceTotalText').innerText = '0.00';
        return;
    }
    
    invoiceItems.forEach((item, index) => {
        totalHTML += item.total;
        tableBody.innerHTML += `
            <tr>
                <td><strong>${item.itemName}</strong></td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
                <td>$${item.total}</td>
                <td><button style="background:#e74c3c; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;" onclick="removeItemFromInvoice(${index})">إلغاء</button></td>
            </tr>
        `;
    });
    
    document.getElementById('invoiceTotalText').innerText = totalHTML.toFixed(2);
}

// 7. إلغاء عنصر من الجدول قبل حفظ الفاتورة
window.removeItemFromInvoice = function(index) {
    invoiceItems.splice(index, 1);
    updateInvoiceTable();
};

// 8. المعاملة السحابية الكبرى (Transaction): حفظ الفاتورة وخصم المخزن بشكل آمن ولحظي
document.getElementById('saveAndPrintBtn').addEventListener('click', async function() {
    const mandubId = document.getElementById('invoiceMandub').value;
    const mandubName = document.getElementById('invoiceMandub').options[document.getElementById('invoiceMandub').selectedIndex]?.text;
    const customer = document.getElementById('customerName').value.trim();
    const invNum = document.getElementById('invoiceNumber').value;
    const totalAmount = parseFloat(document.getElementById('invoiceTotalText').innerText);
    
    if (!mandubId || !customer || invoiceItems.length === 0) {
        alert("الرجاء اختيار المندوب، كتابة اسم العميل، وإضافة مادة واحدة على الأقل لإتمام الفاتورة!");
        return;
    }
    
    try {
        // إجراء عملية فحص وخصم مخزني موحدة تمنع الأخطاء في حال بيع مادتين بنفس الوقت
        await runTransaction(db, async (transaction) => {
            let totalCost = 0;
            
            // أ. التأكد من توفر الكميات في السيرفر أولاً لكل مادة
            for (let item of invoiceItems) {
                const productRef = doc(db, "inventory", item.productId);
                const productDoc = await transaction.get(productRef);
                
                if (!productDoc.exists()) {
                    throw "المادة غير موجودة في قاعدة البيانات!";
                }
                
                const currentQty = productDoc.data().quantity;
                if (currentQty < item.quantity) {
                    throw `عذراً، المادة (${item.itemName}) نفذت أو تقلصت كميتها بالمخزن أثناء إعدادك للفاتورة!`;
                }
                
                // حساب التكلفة الكلية
                totalCost += (item.quantity * productDoc.data().price);
                
                // ب. خصم الكمية المباعة من المخزن
                transaction.update(productRef, {
                    quantity: currentQty - item.quantity
                });
            }
            
            // ج. حساب صافي أرباح الفاتورة
            const netProfit = totalAmount - totalCost;
            
            // د. حفظ الفاتورة كاملة في جدول المبيعات السحابي بـ Firestore
            const invoiceRef = doc(collection(db, "sales"));
            transaction.set(invoiceRef, {
                invoiceNumber: invNum,
                mandubId: mandubId,
                mandubName: mandubName,
                customerName: customer,
                items: invoiceItems,
                totalAmount: totalAmount,
                netProfit: netProfit,
                createdAt: new Date()
            });
        });
        
        alert(`تم حفظ الفاتورة رقم ${invNum} بنجاح، وتحديث كميات المخزن سحابياً!`);
        window.print(); // فتح نافذة الطباعة الفورية للفاتورة
        
        // إعادة تهيئة الواجهة لعمل فاتورة جديدة
        invoiceItems = [];
        updateInvoiceTable();
        document.getElementById('customerName').value = '';
        document.getElementById('invoiceNumber').value = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        loadInventory(); // إعادة تحميل كميات المخزن الجديدة
        
    } catch (error) {
        console.error("فشلت العملية السحابية:", error);
        alert("خطأ: " + error);
    }
});

// تشغيل جلب البيانات عند فتح الصفحة فوراً
window.onload = function() {
    loadMandubs();
    loadInventory();
};

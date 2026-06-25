// =============================================
// نظام العملات - ملف مشترك
// =============================================

// العملات المدعومة
const CURRENCIES = {
    IQD: {
        code: 'IQD',
        symbol: 'د.ع',
        name: 'دينار عراقي',
        rate: 1
    },
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'دولار أمريكي',
        rate: 1320 // سعر الصرف التقريبي
    }
};

// العملة الافتراضية
let currentCurrency = 'IQD';

// =============================================
// دوال العملة
// =============================================

// الحصول على رمز العملة الحالية
function getCurrencySymbol() {
    return CURRENCIES[currentCurrency]?.symbol || 'د.ع';
}

// الحصول على اسم العملة الحالية
function getCurrencyName() {
    return CURRENCIES[currentCurrency]?.name || 'دينار عراقي';
}

// تنسيق المبلغ مع العملة
function formatCurrency(amount, currencyCode = null) {
    const code = currencyCode || currentCurrency;
    const currency = CURRENCIES[code];
    if (!currency) return amount.toFixed(2) + ' د.ع';
    return amount.toFixed(2) + ' ' + currency.symbol;
}

// تحويل المبلغ إلى العملة المحددة
function convertCurrency(amount, fromCurrency, toCurrency) {
    const from = CURRENCIES[fromCurrency];
    const to = CURRENCIES[toCurrency];
    if (!from || !to) return amount;
    return amount * (from.rate / to.rate);
}

// تعيين العملة الحالية
function setCurrency(currencyCode) {
    if (CURRENCIES[currencyCode]) {
        currentCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        updateCurrencyUI();
    }
}

// تحميل العملة المفضلة من التخزين المحلي
function loadPreferredCurrency() {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved && CURRENCIES[saved]) {
        currentCurrency = saved;
    }
    // تحديث المحدد إذا كان موجوداً
    const select = document.getElementById('currencySelect');
    if (select) {
        select.value = currentCurrency;
    }
    updateCurrencyUI();
}

// تحديث واجهة العملة في الصفحة
function updateCurrencyUI() {
    const symbol = getCurrencySymbol();
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = symbol;
    });
    document.querySelectorAll('.currency-amount').forEach(el => {
        const amount = parseFloat(el.getAttribute('data-amount')) || 0;
        el.textContent = amount.toFixed(2);
    });
}

// إنشاء محدد العملة (HTML)
function createCurrencySelector() {
    const container = document.createElement('div');
    container.className = 'currency-selector';
    container.innerHTML = `
        <label style="font-weight:bold;margin-left:8px;">💰 العملة:</label>
        <select id="currencySelect" onchange="onCurrencyChange(this.value)" style="padding:8px 15px;border-radius:8px;border:1px solid #ddd;background:white;cursor:pointer;">
            <option value="IQD">🇮🇶 دينار عراقي</option>
            <option value="USD">🇺🇸 دولار أمريكي</option>
        </select>
    `;
    return container;
}

// عند تغيير العملة
function onCurrencyChange(value) {
    setCurrency(value);
    // إعادة تحميل الصفحة لتحديث جميع الأرقام
    location.reload();
}

// دالة لحساب سعر الصرف بين العملتين
function getExchangeRate(fromCurrency, toCurrency) {
    const from = CURRENCIES[fromCurrency];
    const to = CURRENCIES[toCurrency];
    if (!from || !to) return 1;
    return from.rate / to.rate;
}

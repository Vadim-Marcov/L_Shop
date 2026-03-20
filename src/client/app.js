import { catalogHTML } from './pages/catalogTemplate.js';
import { getAuthHTML } from './pages/authTemplate.js';
import { cartHTML } from './pages/cartTemplate.js';
import { deliveryHTML } from './pages/deliveryTemplate.js';

const appContainer = document.getElementById('app');
const DELIVERY_COST = 10;

export async function navigateTo(page) {
    appContainer.innerHTML = '';
    const authStatus = await checkAuth();

    if (page === 'catalog') {
        appContainer.innerHTML = catalogHTML;
        loadProducts();
    } 
    else if (page === 'auth') {
        if (authStatus.authorized) {
            renderProfile(authStatus.email);
        } else {
            appContainer.innerHTML = getAuthHTML('login');
            setupAuthForms();
        }
    } 
    else if (page === 'cart') {
        appContainer.innerHTML = cartHTML;
        renderCart(authStatus.authorized);
    }
    else if (page === 'delivery') {
        appContainer.innerHTML = deliveryHTML;
        setupDeliveryPage();
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        return await response.json();
    } catch (err) {
        return { authorized: false };
    }
}

async function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-filter');
    const sortPriceSelect = document.getElementById('sort-price');
    const stockCheckbox = document.getElementById('stock-filter');

    try {
        const response = await fetch('/api/products');
        const allProducts = await response.json();

        const applyAllFilters = () => {
            let filtered = [...allProducts];
            const query = searchInput.value.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(query) || 
                p.description.toLowerCase().includes(query)
            );
            const category = categorySelect.value;
            if (category !== 'all') filtered = filtered.filter(p => p.category === category);
            if (stockCheckbox.checked) filtered = filtered.filter(p => p.inStock === true);
            const sortOrder = sortPriceSelect.value;
            if (sortOrder === 'low') filtered.sort((a, b) => a.price - b.price);
            else if (sortOrder === 'high') filtered.sort((a, b) => b.price - a.price);
            render(filtered);
        };

        const render = (data) => {
            container.innerHTML = data.map(p => `
                <div class="product-card" data-product-id="${p.id}" style="border: 1px solid #ddd; padding: 10px; border-radius: 8px; opacity: ${p.inStock ? 1 : 0.5}">
                    <img src="${p.image}" alt="${p.title}" style="width: 100%; border-radius: 5px;">
                    <h3 data-title>${p.title}</h3>
                    <p style="font-size: 0.9em; color: #666;">${p.description}</p>
                    <p>Категория: <b>${p.category}</b></p>
                    <p><strong><span data-price>${p.price}</span> руб.</strong></p>
                    <p>${p.inStock ? '✅ В наличии' : '❌ Нет на складе'}</p>
                    <button class="btn buy-btn" data-id="${p.id}" data-add-to-cart ${!p.inStock ? 'disabled' : ''}>
                        ${p.inStock ? 'В корзину' : 'Ожидается'}
                    </button>
                </div>
            `).join('');
            setupBuyButtons();
        };

        searchInput.addEventListener('input', applyAllFilters);
        categorySelect.addEventListener('change', applyAllFilters);
        sortPriceSelect.addEventListener('change', applyAllFilters);
        stockCheckbox.addEventListener('change', applyAllFilters);
        render(allProducts);
    } catch (err) {
        container.innerHTML = '<p>Ошибка загрузки товаров</p>';
    }
}

function setupBuyButtons() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = async () => {
            const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: btn.dataset.id })
            });
            const data = await res.json();
            alert(data.message);
            if (res.status === 401) navigateTo('auth');
        };
    });
}

async function renderCart(isAuthorized) {
    const itemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const deliveryCheckbox = document.getElementById('delivery-checkbox');
    const addressContainer = document.getElementById('delivery-address-container');

    if (!isAuthorized) {
        appContainer.innerHTML = '<h2>Пожалуйста, войдите, чтобы увидеть корзину</h2>';
        return;
    }

    try {
        const res = await fetch('/api/cart');
        const cart = await res.json();
        const items = cart.items || [];

        if (items.length === 0) {
            itemsContainer.innerHTML = '<h3>Корзина пуста</h3>';
            totalPriceEl.textContent = '0';
            checkoutBtn.disabled = true;
            return;
        }

        itemsContainer.innerHTML = items.map(i => {
            const isMax = i.quantity >= i.product.count;
            
            return `
            <div class="cart-item" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="flex: 2;">
                    <strong>${i.product.title}</strong><br>
                    <small style="color: ${isMax ? 'red' : '#666'}">
                        ${isMax ? 'Достигнут лимит склада' : `На складе: ${i.product.count} шт.`}
                    </small>
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                    <button class="qty-btn" data-id="${i.product.id}" data-action="decrease">-</button>
                    <span style="font-weight: bold;">${i.quantity}</span>
                    <button class="qty-btn" 
                            data-id="${i.product.id}" 
                            data-action="increase" 
                            ${isMax ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>+</button>
                </div>
                <div style="flex: 1; text-align: right;">
                    <b>${i.product.price * i.quantity} руб.</b>
                    <button class="remove-btn" data-id="${i.product.id}" style="margin-left: 10px; color: red; border: none; background: none; cursor: pointer;">✕</button>
                </div>
            </div>
        `}).join('');

        const updateUI = () => {
            let sum = items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
            if (deliveryCheckbox.checked) sum += DELIVERY_COST;
            totalPriceEl.textContent = sum;
        };

        itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
            btn.onclick = () => updateCartItem(btn.dataset.id, btn.dataset.action);
        });

        itemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => updateCartItem(btn.dataset.id, 'remove');
        });

        deliveryCheckbox.onchange = () => {
            addressContainer.style.display = deliveryCheckbox.checked ? 'block' : 'none';
            updateUI();
        };

        // ИСПРАВЛЕНО: Теперь переходим на форму доставки
        checkoutBtn.onclick = () => {
            navigateTo('delivery');
        };

        updateUI();

    } catch (err) {
        console.error(err);
    }
}

async function updateCartItem(productId, action) {
    if (action === 'remove') {
        await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
    } else {
        const res = await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, action })
        });

        if (!res.ok) {
            const errorData = await res.json();
            alert(errorData.message); 
            return;
        }
    }
    renderCart(true); 
}

async function renderProfile(email) {
    appContainer.innerHTML = `
        <div class="profile-container">
            <h2>Личный кабинет</h2>
            <p>Вы вошли как: <strong>${email}</strong></p>
            <button class="btn" id="logout-btn">Выйти</button>
            <hr>
            <div id="user-orders-section"></div>
        </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', logout);
    renderOrders();
}

async function renderOrders() {
    const section = document.getElementById('user-orders-section');
    if (!section) return;
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        const ordersHTML = orders.length > 0 
            ? orders.map(o => `
                <div class="order-card" style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                    <p>Заказ #${o.id} - ${o.date}</p>
                    <p>Статус: <strong style="color: green;">${o.status}</strong></p>
                    <p>Сумма: ${o.totalPrice} руб.</p>
                </div>
            `).join('')
            : '<p>У вас пока нет доставок.</p>';
        section.innerHTML = `<h3>Ваши доставки:</h3>${ordersHTML}`;
    } catch (err) { console.error(err); }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    navigateTo('auth');
}

function setupAuthForms() {
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const toRegisterLink = document.getElementById('to-register');
    const toLoginLink = document.getElementById('to-login');

    if (toRegisterLink) toRegisterLink.onclick = (e) => { e.preventDefault(); appContainer.innerHTML = getAuthHTML('register'); setupAuthForms(); };
    if (toLoginLink) toLoginLink.onclick = (e) => { e.preventDefault(); appContainer.innerHTML = getAuthHTML('login'); setupAuthForms(); };

    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = regForm.querySelector('input[type="email"]').value;
            const password = regForm.querySelector('input[type="password"]').value;
            const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await res.json();
            alert(data.message);
            if (res.ok) { appContainer.innerHTML = getAuthHTML('login'); setupAuthForms(); }
        };
    }

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            if (res.ok) { alert('Успешный вход!'); navigateTo('catalog'); } 
            else { const data = await res.json(); alert(data.message); }
        };
    }
}

let captchaResult = 0;

function setupDeliveryPage() {
    const form = document.getElementById('delivery-form');
    const backBtn = document.getElementById('back-to-cart');
    const captchaLabel = document.getElementById('captcha-question');

    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    captchaResult = num1 + num2;
    captchaLabel.innerText = `${num1} + ${num2} = ?`;

    if (backBtn) backBtn.onclick = () => navigateTo('cart');

    form.onsubmit = async (e) => {
        e.preventDefault();

        const userAnswer = parseInt(document.getElementById('captcha-input').value);
        if (userAnswer !== captchaResult) {
            alert('Ошибка капчи! Попробуйте снова.');
            setupDeliveryPage(); 
            return;
        }

        const orderData = {
            phone: document.getElementById('delivery-phone').value,
            email: document.getElementById('delivery-email-confirm').value,
            address: document.getElementById('delivery-address-full').value,
            payment: document.getElementById('payment-method').value
        };

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert('Заказ успешно оформлен! Корзина очищена.');
            navigateTo('auth'); 
        } else {
            const err = await res.json();
            alert('Ошибка: ' + err.message);
        }
    };
}

document.getElementById('nav-catalog').addEventListener('click', () => navigateTo('catalog'));
document.getElementById('nav-auth').addEventListener('click', () => navigateTo('auth'));
document.getElementById('nav-cart').addEventListener('click', () => navigateTo('cart'));

navigateTo('catalog');
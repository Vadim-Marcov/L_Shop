import { catalogHTML } from './pages/catalogTemplate.js';
import { getAuthHTML } from './pages/authTemplate.js';
import { cartHTML } from './pages/cartTemplate.js';
import { deliveryHTML } from './pages/deliveryTemplate.js';

const appContainer = document.getElementById('app');
const DELIVERY_COST = 10;

// Глобальное состояние для передачи между страницами (п. 52 ТЗ)
let isDeliveryRequired = false; 
let captchaResult = 0;

export async function navigateTo(page) {
    appContainer.innerHTML = '';
    const authStatus = await checkAuth();

    // Обновляем кнопку в навигации (Вход -> Личный кабинет)
    const navAuthBtn = document.getElementById('nav-auth');
    if (navAuthBtn) {
        navAuthBtn.textContent = authStatus.authorized ? 'Личный кабинет' : 'Войти';
    }

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

// --- КАТАЛОГ И ТОВАРЫ ---
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
                <div class="product-card" data-product-id="${p.id}" style="opacity: ${p.inStock ? 1 : 0.6}">
                    <img src="${p.image}" alt="${p.title}" class="product-img">
                    <h3 data-title>${p.title}</h3>
                    <p>${p.description}</p>
                    <p><strong><span data-price>${p.price}</span> руб.</strong></p>
                    <button class="btn buy-btn" data-id="${p.id}" ${!p.inStock ? 'disabled' : ''}>
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

// --- КОРЗИНА ---
async function renderCart(isAuthorized) {
    const itemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const deliveryCheckbox = document.getElementById('delivery-checkbox');

    if (!isAuthorized) {
        appContainer.innerHTML = '<h2>Пожалуйста, войдите в аккаунт</h2>';
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

        itemsContainer.innerHTML = items.map(i => `
            <div class="cart-item">
                <span>${i.product.title} (${i.quantity} шт.)</span>
                <span><b>${i.product.price * i.quantity} руб.</b></span>
                <div>
                    <button class="qty-btn" data-id="${i.product.id}" data-action="decrease">-</button>
                    <button class="qty-btn" data-id="${i.product.id}" data-action="increase">+</button>
                    <button class="remove-btn" data-id="${i.product.id}" style="color:red">✕</button>
                </div>
            </div>
        `).join('');

        const updateUI = () => {
            let sum = items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
            if (deliveryCheckbox.checked) sum += DELIVERY_COST;
            totalPriceEl.textContent = sum;
            isDeliveryRequired = deliveryCheckbox.checked; // Запоминаем выбор
        };

        deliveryCheckbox.onchange = updateUI;
        
        itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
            btn.onclick = () => updateCartItem(btn.dataset.id, btn.dataset.action);
        });

        itemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => updateCartItem(btn.dataset.id, 'remove');
        });

        checkoutBtn.onclick = () => navigateTo('delivery');

        updateUI();

    } catch (err) { console.error(err); }
}

async function updateCartItem(productId, action) {
    if (action === 'remove') {
        await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
    } else {
        await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, action })
        });
    }
    renderCart(true); 
}

// --- ОФОРМЛЕНИЕ ЗАКАЗА ---
function setupDeliveryPage() {
    const form = document.getElementById('delivery-form');
    const backBtn = document.getElementById('back-to-cart');
    const captchaLabel = document.getElementById('captcha-question');
    const addressGroup = document.getElementById('address-group');
    const addressInput = document.getElementById('delivery-address-full');

    // Логика отображения адреса (твой запрос)
    if (!isDeliveryRequired) {
        addressGroup.style.display = 'none';
        addressInput.removeAttribute('required');
    } else {
        addressGroup.style.display = 'block';
        addressInput.setAttribute('required', 'true');
    }

    // Генерация капчи
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    captchaResult = num1 + num2;
    captchaLabel.innerText = `${num1} + ${num2} = ?`;
    

    if (backBtn) backBtn.onclick = () => navigateTo('cart');

    form.onsubmit = async (e) => {
        e.preventDefault();

        // Проверка капчи
        const userAnswer = parseInt(document.getElementById('captcha-input').value);
        if (userAnswer !== captchaResult) {
            alert('Ошибка подтверждения! Вы робот?');
            return;
        }

        const orderData = {
            phone: document.getElementById('delivery-phone').value,
            email: document.getElementById('delivery-email-confirm').value,
            address: isDeliveryRequired ? addressInput.value : "Самовывоз из магазина",
            payment: document.getElementById('payment-method').value
        };

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert('Заказ принят! Ждем вас.');
            navigateTo('auth'); 
        } else {
            alert('Ошибка при сохранении заказа');
        }
    };
}

// --- ПРОФИЛЬ И ВХОД ---
async function renderProfile(email) {
    appContainer.innerHTML = `
        <div class="profile-container">
            <h2>Личный кабинет</h2>
            <p>Email: <strong>${email}</strong></p>
            <button class="btn" id="logout-btn">Выйти</button>
            <hr>
            <div id="user-orders-section"></div>
        </div>
    `;
    document.getElementById('logout-btn').onclick = logout;
    renderOrders();
}

async function renderOrders() {
    const section = document.getElementById('user-orders-section');
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        section.innerHTML = `<h3>Ваши заказы:</h3>` + (orders.length > 0 
            ? orders.map(o => `<div class="order-card">Заказ #${o.id} - ${o.totalPrice} руб. (${o.status})</div>`).join('')
            : '<p>Заказов нет.</p>');
    } catch (err) { console.error(err); }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    navigateTo('catalog');
}

function setupAuthForms() {
    const regForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = regForm.querySelector('input[type="email"]').value;
            const password = regForm.querySelector('input[type="password"]').value;
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) navigateTo('auth');
            else alert('Ошибка регистрации');
        };
    }

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) navigateTo('catalog');
            else alert('Неверный логин или пароль');
        };
    }
}

document.getElementById('nav-catalog').onclick = () => navigateTo('catalog');
document.getElementById('nav-auth').onclick = () => navigateTo('auth');
document.getElementById('nav-cart').onclick = () => navigateTo('cart');

navigateTo('catalog');
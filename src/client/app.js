import { catalogHTML } from './pages/catalogTemplate.js';
import { getAuthHTML } from './pages/authTemplate.js';
import { cartHTML } from './pages/cartTemplate.js';

const appContainer = document.getElementById('app');

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

    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        container.innerHTML = products.map(p => `
            <div class="product-card">
                <h3>${p.title}</h3>
                <p>${p.description}</p>
                <p><strong>${p.price} руб.</strong></p>
                <button class="btn buy-btn" data-id="${p.id}">В корзину</button>
            </div>
        `).join('');

        container.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const res = await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: btn.dataset.id })
                });
                const data = await res.json();
                alert(data.message);
                if (res.status === 401) navigateTo('auth');
            });
        });
    } catch (err) {
        container.innerHTML = '<p>Ошибка загрузки товаров</p>';
    }
}

async function renderCart(isAuthorized) {
    const container = document.getElementById('cart-container') || appContainer;
    if (!isAuthorized) {
        container.innerHTML = '<h2>Пожалуйста, войдите, чтобы увидеть корзину</h2>';
        return;
    }

    try {
        const res = await fetch('/api/cart');
        const cart = await res.json();

        if (!cart.items || cart.items.length === 0) {
            container.innerHTML = '<h2>Корзина пуста</h2>';
        } else {
            const total = cart.items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
            container.innerHTML = `
                <h2>Ваша корзина</h2>
                <div class="cart-items">
                    ${cart.items.map(i => `
                        <p>${i.product.title} x ${i.quantity} — ${i.product.price * i.quantity} руб.</p>
                    `).join('')}
                </div>
                <hr>
                <h3>Итого: ${total} руб.</h3>
                <button class="btn" id="checkout-btn" style="background: green; color: white;">Оформить заказ</button>
            `;

            document.getElementById('checkout-btn').addEventListener('click', async () => {
                const orderRes = await fetch('/api/orders', { method: 'POST' });
                const orderData = await orderRes.json();
                alert(orderData.message);
                if (orderRes.ok) navigateTo('auth');
            });
        }
    } catch (err) {
        console.error(err);
    }
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
    } catch (err) {
        console.error(err);
    }
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

    if (toRegisterLink) {
        toRegisterLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            appContainer.innerHTML = getAuthHTML('register'); 
            setupAuthForms(); 
        });
    }

    if (toLoginLink) {
        toLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            appContainer.innerHTML = getAuthHTML('login');
            setupAuthForms(); 
        });
    }

    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = regForm.querySelector('input[type="email"]').value;
            const password = regForm.querySelector('input[type="password"]').value;
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                appContainer.innerHTML = getAuthHTML('login');
                setupAuthForms();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            
            const response = await fetch('/api/login', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Успешный вход!');
                navigateTo('catalog'); 
            } else {
                alert(data.message);
            }
        });
    }
}

document.getElementById('nav-catalog').addEventListener('click', () => navigateTo('catalog'));
document.getElementById('nav-auth').addEventListener('click', () => navigateTo('auth'));
document.getElementById('nav-cart').addEventListener('click', () => navigateTo('cart'));

navigateTo('catalog');
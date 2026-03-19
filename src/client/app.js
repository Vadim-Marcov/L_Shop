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
        if (authStatus.authorized) {
            renderOrders();
        }
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
                <button class="btn" data-id="${p.id}">В корзину</button>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p>Ошибка загрузки товаров</p>';
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
    const section = document.getElementById('user-orders-section') || appContainer;
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();

        const ordersHTML = orders.length > 0 
            ? orders.map(o => `
                <div class="order-card" style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                    <p>Заказ #${o.id} - ${o.date}</p>
                    <p>Статус: <strong>${o.status}</strong></p>
                    <p>Сумма: ${o.totalPrice} руб.</p>
                </div>
            `).join('')
            : '<p>У вас пока нет доставок.</p>';

        if (document.getElementById('user-orders-section')) {
            document.getElementById('user-orders-section').innerHTML = `<h3>Ваши доставки:</h3>${ordersHTML}`;
        }
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
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            
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
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
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
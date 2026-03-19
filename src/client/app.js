import { catalogHTML } from './pages/catalogTemplate.js';
import { getAuthHTML } from './pages/authTemplate.js';
import { cartHTML } from './pages/cartTemplate.js';

const appContainer = document.getElementById('app');

export function navigateTo(page) {
    appContainer.innerHTML = '';

    if (page === 'catalog') {
        appContainer.innerHTML = catalogHTML;
        loadProducts();
    } 
    else if (page === 'auth') {
        appContainer.innerHTML = getAuthHTML('login');
        setupAuthForms();
    } 
    else if (page === 'cart') {
        appContainer.innerHTML = cartHTML;
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
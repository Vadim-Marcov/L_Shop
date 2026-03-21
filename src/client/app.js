import { catalogHTML } from './pages/catalogTemplate.js';
import { getAuthHTML } from './pages/authTemplate.js';
import { cartHTML } from './pages/cartTemplate.js';
import { deliveryHTML } from './pages/deliveryTemplate.js';

const appContainer = document.getElementById('app');
const DELIVERY_COST = 10;
let isDeliveryRequired = false; 

export async function navigateTo(page) {
    appContainer.innerHTML = '';
    const authStatus = await checkAuth();

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
            switchAuthMode('login');
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

function switchAuthMode(mode) {
    appContainer.innerHTML = getAuthHTML(mode);
    setupAuthForms();
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
            const query = searchInput ? searchInput.value.toLowerCase() : '';
            
            if (query) {
                filtered = filtered.filter(p => 
                    p.title.toLowerCase().includes(query) || 
                    p.description.toLowerCase().includes(query)
                );
            }

            const category = categorySelect ? categorySelect.value : 'all';
            if (category !== 'all') filtered = filtered.filter(p => p.category === category);
            
            if (stockCheckbox && stockCheckbox.checked) filtered = filtered.filter(p => p.inStock === true);

            const sortOrder = sortPriceSelect ? sortPriceSelect.value : '';
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
                    <p><strong><span data-price>${p.price}</span> BYN</strong></p>
                    <button class="btn buy-btn" data-id="${p.id}" ${!p.inStock ? 'disabled' : ''}>
                        ${p.inStock ? 'В корзину' : 'Ожидается'}
                    </button>
                </div>
            `).join('');
            setupBuyButtons();
        };

        if (searchInput) searchInput.addEventListener('input', applyAllFilters);
        if (categorySelect) categorySelect.addEventListener('change', applyAllFilters);
        if (sortPriceSelect) sortPriceSelect.addEventListener('change', applyAllFilters);
        if (stockCheckbox) stockCheckbox.addEventListener('change', applyAllFilters);
        
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

    if (!isAuthorized) {
        appContainer.innerHTML = '<div class="container"><h2>Войдите в аккаунт для доступа к корзине</h2></div>';
        return;
    }

    try {
        const res = await fetch('/api/cart');
        const cart = await res.json();
        const items = cart.items || [];

        if (items.length === 0) {
            if (itemsContainer) itemsContainer.innerHTML = '<h3>Корзина пуста</h3>';
            if (totalPriceEl) totalPriceEl.textContent = '0';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (itemsContainer) {
            itemsContainer.innerHTML = items.map(i => `
                <div class="cart-item">
                    <span data-title="basket">${i.product.title} (${i.quantity} шт.)</span>
                    <span><b data-price="basket">${i.product.price * i.quantity}</b> BYN</span>
                    <div>
                        <button class="qty-btn" data-id="${i.product.id}" data-action="decrease">-</button>
                        <button class="qty-btn" data-id="${i.product.id}" data-action="increase">+</button>
                        <button class="remove-btn" data-id="${i.product.id}" style="color:red">✕</button>
                    </div>
                </div>
            `).join('');
        }

        const updateUI = () => {
            let sum = items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
            if (deliveryCheckbox && deliveryCheckbox.checked) sum += DELIVERY_COST;
            if (totalPriceEl) totalPriceEl.textContent = sum;
            isDeliveryRequired = deliveryCheckbox ? deliveryCheckbox.checked : false;
        };

        if (deliveryCheckbox) deliveryCheckbox.onchange = updateUI;
        
        if (itemsContainer) {
            itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
                btn.onclick = () => updateCartItem(btn.dataset.id, btn.dataset.action);
            });
            itemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
                btn.onclick = () => updateCartItem(btn.dataset.id, 'remove');
            });
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.onclick = () => navigateTo('delivery');
        }

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

function setupDeliveryPage() {
    const form = document.getElementById('delivery-form');
    const backBtn = document.getElementById('back-to-cart');
    const addressGroup = document.getElementById('address-group');
    const addressInput = document.getElementById('delivery-address-full');

    if (!isDeliveryRequired) {
        if (addressGroup) addressGroup.style.display = 'none';
        if (addressInput) addressInput.removeAttribute('required');
    } else {
        if (addressGroup) addressGroup.style.display = 'block';
        if (addressInput) addressInput.setAttribute('required', 'true');
    }

    if (backBtn) backBtn.onclick = () => navigateTo('cart');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const orderData = {
                phone: document.getElementById('delivery-phone').value,
                email: document.getElementById('delivery-email-confirm').value,
                address: isDeliveryRequired ? addressInput.value : "Самовывоз",
                payment: document.getElementById('payment-method').value
            };

            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (res.ok) {
                    alert('Заказ принят!');
                    navigateTo('auth'); 
                } else {
                    alert('Ошибка при оформлении');
                }
            } catch (err) { alert('Ошибка сети'); }
        };
    }
}

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
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = logout;
    renderOrders();
}

async function renderOrders() {
    const section = document.getElementById('user-orders-section');
    if (!section) return;
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        section.innerHTML = `<h3>Ваши заказы:</h3>` + (orders.length > 0 
            ? orders.map(o => `<div class="order-card">Заказ #${o.id} - ${o.totalPrice} BYN (${o.status})</div>`).join('')
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

    document.getElementById('to-register')?.addEventListener('click', (e) => { e.preventDefault(); switchAuthMode('register'); });
    document.getElementById('to-login')?.addEventListener('click', (e) => { e.preventDefault(); switchAuthMode('login'); });

    const handleAuth = async (form, mode) => {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            const password = form.querySelector('input[type="password"]').value;
            try {
                const res = await fetch(`/api/${mode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (res.ok) {
                    if (mode === 'register') {
                        alert('Успешно! Теперь войдите.');
                        switchAuthMode('login');
                    } else navigateTo('catalog');
                } else alert('Ошибка авторизации');
            } catch (err) { console.error(err); }
        };
    };

    if (regForm) handleAuth(regForm, 'register');
    if (loginForm) handleAuth(loginForm, 'login');
}

document.getElementById('nav-catalog').onclick = () => navigateTo('catalog');
document.getElementById('nav-auth').onclick = () => navigateTo('auth');
document.getElementById('nav-cart').onclick = () => navigateTo('cart');

navigateTo('catalog');
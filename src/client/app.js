import { catalogHTML } from './pages/catalogTemplate.js';
import { authHTML } from './pages/authTemplate.js';
import { cartHTML } from './pages/cartTemplate.js';

const appContainer = document.getElementById('app');

/**
 * @param {string} page
 */
export function navigateTo(page) {
    appContainer.innerHTML = '';

    if (page === 'catalog') {
        appContainer.innerHTML = catalogHTML;
    } 
    else if (page === 'auth') {
        appContainer.innerHTML = authHTML;
        setupAuthForm();
    } 
    else if (page === 'cart') {
        appContainer.innerHTML = cartHTML;
    }
}

function setupAuthForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Данные для сервера:', { email, password });
            alert('Рома молодец! Данные пойманы. Скоро отправим на бэк.');
        });
    }
}

document.getElementById('nav-catalog').addEventListener('click', () => navigateTo('catalog'));
document.getElementById('nav-auth').addEventListener('click', () => navigateTo('auth'));
document.getElementById('nav-cart').addEventListener('click', () => navigateTo('cart'));

navigateTo('catalog');
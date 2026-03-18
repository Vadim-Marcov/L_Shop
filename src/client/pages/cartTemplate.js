export const cartHTML = `
    <div class="cart-container">
        <h2>Ваша корзина</h2>
        <div id="cart-items">
            <p>Корзина пока пуста</p>
        </div>
        <div class="cart-summary">
            <h3>Итого: <span id="total-price" data-total-price>0</span> руб.</h3>
            <button class="btn" id="checkout-btn" data-checkout>Оформить заказ</button>
        </div>
    </div>
`;
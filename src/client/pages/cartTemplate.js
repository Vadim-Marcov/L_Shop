export const cartHTML = `
    <div class="cart-container">
        <h2>Ваша корзина</h2>
        <div id="cart-items">
            <p>Загрузка...</p>
        </div>
        
        <div class="delivery-section" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold;">
                <input type="checkbox" id="delivery-checkbox">
                Нужна доставка курьером (+10 BYN)
            </label>
            <div id="delivery-address-container" style="display: none; margin-top: 10px;">
                <input type="text" id="delivery-address" placeholder="Укажите адрес доставки (г. Минск, ул...)" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        </div>

        <div class="cart-summary" style="margin-top: 20px;">
            <h3>Итого: <span id="total-price" data-total-price>0</span> BYN</h3>
            <button class="btn" id="checkout-btn" data-checkout style="background: green; color: white; width: 100%; margin-top: 10px;">Перейти к оформлению</button>
        </div>
    </div>
`;
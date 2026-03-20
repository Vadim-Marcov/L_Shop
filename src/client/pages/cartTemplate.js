export const cartHTML = `
    <div class="cart-container">
        <h2>Ваша корзина</h2>
        <div id="cart-items">
            <p>Загрузка...</p>
        </div>
        
        <div class="delivery-section" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fff;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="delivery-checkbox"> 
                <strong>Доставка курьером (+10 BYN)</strong>
            </label>
            
            <p style="font-size: 0.85em; color: #666; margin-top: 5px;">
                * Если не выбрано — самовывоз (бесплатно)
            </p>
        </div>

        <div class="cart-summary" style="margin-top: 20px;">
            <h3>Итого: <span id="total-price" data-total-price>0</span> BYN</h3>
            <button class="btn" id="checkout-btn" data-checkout style="background: green; color: white; width: 100%; margin-top: 10px;">Перейти к оформлению</button>
        </div>
    </div>
`;

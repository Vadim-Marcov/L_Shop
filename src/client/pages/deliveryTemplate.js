export const deliveryHTML = `
    <div class="delivery-container">
        <h2>Оформление доставки</h2>
        <form id="delivery-form" data-delivery-form class="auth-form" style="max-width: 500px; margin: 0 auto;">
            <div class="form-group">
                <label>Контактный телефон:</label>
                <input type="tel" id="delivery-phone" placeholder="+375 (__) ___-__-__" required>
            </div>
            
            <div class="form-group">
                <label>Email для чека:</label>
                <input type="email" id="delivery-email-confirm" placeholder="example@mail.by" required>
            </div>

            <div class="form-group" id="address-group">
                <label>Адрес доставки:</label>
                <textarea id="delivery-address-full" placeholder="Область, Город, улица, дом, квартира" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ddd;"></textarea>
            </div>

            <div class="form-group">
                <label>Способ оплаты:</label>
                <select id="payment-method" required style="width: 100%; padding: 10px;">
                    <option value="card">Картой онлайн</option>
                    <option value="cash">Наличными при получении</option>
                    <option value="erip">ЕРИП</option>
                </select>
            </div>


            <button type="submit" class="btn" style="background: #27ae60;">Подтвердить заказ</button>
            <button type="button" class="btn" id="back-to-cart" style="background: #95a5a6; margin-top: 10px;">Вернуться в корзину</button>
        </form>
    </div>
`;

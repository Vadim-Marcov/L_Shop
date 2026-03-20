export const deliveryHTML = `
    <div class="delivery-container">
        <h2>Оформление доставки</h2>
        <form id="delivery-form" class="auth-form" style="max-width: 500px; margin: 0 auto;">
            <div class="form-group">
                <label>Контактный телефон:</label>
                <input type="tel" id="delivery-phone" placeholder="+375 (__) ___-__-__" pattern="\\+375\\s?\\(?\\d{2}\\)?\\s?\\d{3}-?\\d{2}-?\\d{2}" required>
                <small style="color: #666;">Формат: +375 (XX) XXX-XX-XX</small>
            </div>
            
            <div class="form-group">
                <label>Email для чека:</label>
                <input type="email" id="delivery-email-confirm" placeholder="example@mail.by" required>
            </div>

            <div class="form-group">
                <label>Адрес доставки:</label>
                <textarea id="delivery-address-full" placeholder="Область, Город, улица, дом, квартира" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ddd;"></textarea>
            </div>

            <div class="form-group">
                <label>Способ оплаты:</label>
                <select id="payment-method" required style="width: 100%; padding: 10px;">
                    <option value="card">Картой онлайн (WebPay/BePaid)</option>
                    <option value="cash">Наличными курьеру</option>
                    <option value="erip">Через систему ЕРИП</option>
                </select>
            </div>

            <div class="captcha-section" style="background: #eee; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
                <label>Подтвердите, что вы не робот: <br><strong id="captcha-question" style="font-size: 1.2rem;"></strong></label>
                <input type="number" id="captcha-input" placeholder="Ответ" required style="width: 80px; margin-top: 10px;">
            </div>

            <button type="submit" class="btn" style="background: #27ae60;">Подтвердить заказ</button>
            <button type="button" class="btn" id="back-to-cart" style="background: #95a5a6; margin-top: 10px;">Вернуться в корзину</button>
        </form>
    </div>
`;
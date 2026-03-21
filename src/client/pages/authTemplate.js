export const getAuthHTML = (mode = 'login') => {
    if (mode === 'login') {
        return `
            <div class="auth-container">
                <form class="auth-form" id="login-form">
                    <h2>Вход</h2>
                    <input type="email" id="login-email" placeholder="Email" required>
                    <input type="password" id="login-password" placeholder="Пароль" required>
                    <button type="submit" class="btn">Войти</button>
                    <p class="auth-switch">Нет аккаунта? <a href="#" id="to-register">Зарегистрироваться</a></p>
                </form>
            </div>
        `;
    } else {
        return `
            <div class="auth-container">
                <form class="auth-form" id="register-form" data-registration>
                    <h2>Регистрация</h2>
                    <input type="email" id="reg-email" placeholder="Email" required>
                    <input type="password" id="reg-password" placeholder="Пароль" required>
                    <button type="submit" class="btn">Зарегистрироваться</button>
                    <p class="auth-switch">Уже есть аккаунт? <a href="#" id="to-login">Войти</a></p>
                </form>
            </div>
        `;
    }
};
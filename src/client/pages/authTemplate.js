export const authHTML = `
    <div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
        <form class="auth-form" id="register-form">
            <h2>Регистрация</h2>
            <input type="email" id="reg-email" placeholder="Email" required>
            <input type="password" id="reg-password" placeholder="Пароль" required>
            <button type="submit" class="btn">Зарегистрироваться</button>
        </form>

        <form class="auth-form" id="login-form">
            <h2>Вход</h2>
            <input type="email" id="login-email" placeholder="Email" required>
            <input type="password" id="login-password" placeholder="Пароль" required>
            <button type="submit" class="btn">Войти</button>
        </form>
    </div>
`;
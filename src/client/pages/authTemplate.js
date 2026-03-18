export const authHTML = `
    <form class="auth-form" id="login-form">
        <h2>Вход в L_Shop</h2>
        <input type="email" id="email" placeholder="Email" data-email required>
        <input type="password" id="password" placeholder="Пароль" data-password required>
        <button type="submit" class="btn" data-submit>Войти</button>
        <p>Нет аккаунта? <a href="#" id="go-to-reg">Зарегистрироваться</a></p>
    </form>
`;
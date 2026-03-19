import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { db } from './db';
import { setSafeCookie, clearSafeCookie, SESSION_COOKIE_NAME } from './auth';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/products', async (req, res) => {
    try {
        const products = await db.read('products');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при чтении товаров" });
    }
});

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Заполните все поля" });
    }

    const users = await db.read('users');
    
    if (users.find((u: any) => u.email === email)) {
        return res.status(400).json({ message: "Такой пользователь уже существует" });
    }

    const newUser = { id: Date.now().toString(), email, password };
    users.push(newUser);
    await db.write('users', users);
    
    setSafeCookie(res, email);
    res.status(201).json({ message: "Регистрация успешна!" });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const users = await db.read('users'); 
    
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: "Неверный логин или пароль!" });
    }

    setSafeCookie(res, email);
    res.json({ message: "Успешный вход!" });
});

app.post('/api/logout', (req, res) => {
    clearSafeCookie(res);
    res.json({ message: "Вы вышли из системы" });
});

app.get('/api/check-auth', (req, res) => {
    const sessionId = req.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
        res.json({ authorized: true, email: sessionId });
    } else {
        res.json({ authorized: false });
    }
});

app.get('/api/orders', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Не авторизован" });

    try {
        const allOrders = await db.read('orders');
        const userOrders = allOrders.filter((o: any) => o.userId === userEmail);
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ message: "Ошибка при чтении заказов" });
    }
});

app.listen(PORT, () => {
    console.log(`СЕРВЕР ЗАПУЩЕН: http://localhost:${PORT}`);
});
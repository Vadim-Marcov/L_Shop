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
    if (!email || !password) return res.status(400).json({ message: "Заполните все поля" });

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
    
    if (!user) return res.status(401).json({ message: "Неверный логин или пароль!" });

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

app.get('/api/cart', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Не авторизован" });

    const allCarts = await db.read('carts');
    const userCart = allCarts.find((c: any) => c.userId === userEmail) || { userId: userEmail, items: [] };
    res.json(userCart);
});

app.post('/api/cart', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Войдите, чтобы добавить в корзину" });

    const { productId } = req.body;
    const products = await db.read('products');
    const allCarts = await db.read('carts');
    
    const product = products.find((p: any) => p.id === productId);
    if (!product) return res.status(404).json({ message: "Товар не найден" });

    let userCart = allCarts.find((c: any) => c.userId === userEmail);
    if (!userCart) {
        userCart = { userId: userEmail, items: [] };
        allCarts.push(userCart);
    }

    const existingItem = userCart.items.find((i: any) => i.product.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        userCart.items.push({ product, quantity: 1 });
    }

    await db.write('carts', allCarts);
    res.json({ message: "Товар добавлен в корзину!" });
});

app.post('/api/orders', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Не авторизован" });

    const allCarts = await db.read('carts');
    const allOrders = await db.read('orders');
    
    const cartIdx = allCarts.findIndex((c: any) => c.userId === userEmail);
    const userCart = allCarts[cartIdx];

    if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ message: "Ваша корзина пуста" });
    }

    const newOrder = {
        id: "ORD-" + Date.now(),
        userId: userEmail,
        items: userCart.items,
        totalPrice: userCart.items.reduce((sum: number, i: any) => sum + (i.product.price * i.quantity), 0),
        date: new Date().toLocaleDateString('ru-RU'),
        status: "В обработке"
    };

    allOrders.push(newOrder);

    allCarts.splice(cartIdx, 1);

    await db.write('orders', allOrders);
    await db.write('carts', allCarts);

    res.status(201).json({ message: "Заказ успешно оформлен!", order: newOrder });
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
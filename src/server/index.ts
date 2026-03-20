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
        if (existingItem.quantity >= product.count) {
            return res.status(400).json({ message: `Недостаточно товара на складе (макс: ${product.count})` });
        }
        existingItem.quantity += 1;
    } else {
        if (product.count < 1) return res.status(400).json({ message: "Товара нет в наличии" });
        userCart.items.push({ product, quantity: 1 });
    }

    await db.write('carts', allCarts);
    res.json({ message: "Товар добавлен в корзину!" });
});

app.put('/api/cart', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Не авторизован" });

    const { productId, action } = req.body; 
    const allCarts = await db.read('carts');
    const allProducts = await db.read('products');
    const userCart = allCarts.find((c: any) => c.userId === userEmail);
    
    if (!userCart) return res.status(404).json({ message: "Корзина пуста" });

    const item = userCart.items.find((i: any) => i.product.id === productId);
    const product = allProducts.find((p: any) => p.id === productId);
    if (!item || !product) return res.status(404).json({ message: "Товар не найден" });

    if (action === 'increase') {
        if (item.quantity >= product.count) {
            return res.status(400).json({ message: `Максимальное количество на складе: ${product.count}` });
        }
        item.quantity += 1;
    } else if (action === 'decrease' && item.quantity > 1) {
        item.quantity -= 1;
    }

    await db.write('carts', allCarts);
    res.json(userCart);
});

app.delete('/api/cart/:productId', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Не авторизован" });

    const { productId } = req.params;
    const allCarts = await db.read('carts');
    const userCart = allCarts.find((c: any) => c.userId === userEmail);

    if (userCart) {
        userCart.items = userCart.items.filter((i: any) => i.product.id !== productId);
        await db.write('carts', allCarts);
    }
    res.json({ message: "Товар удален", cart: userCart });
});

app.post('/api/orders', async (req, res) => {
    const userEmail = req.cookies[SESSION_COOKIE_NAME];
    if (!userEmail) return res.status(401).json({ message: "Не авторизован" });

    const { phone, email, address, payment } = req.body;

    const allCarts = await db.read('carts');
    const allProducts = await db.read('products');
    const allOrders = await db.read('orders');

    const userCart = allCarts.find((c: any) => c.userId === userEmail);

    if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ message: "Корзина пуста" });
    }

    for (const item of userCart.items) {
        const product = allProducts.find((p: any) => p.id === item.product.id);
        if (!product || product.count < item.quantity) {
            return res.status(400).json({ 
                message: `Ошибка: товара "${item.product.title}" недостаточно на складе!` 
            });
        }
    }

    userCart.items.forEach((item: any) => {
        const product = allProducts.find((p: any) => p.id === item.product.id);
        if (product) {
            product.count -= item.quantity;
            if (product.count <= 0) {
                product.inStock = false;
            }
        }
    });

    let totalPrice = userCart.items.reduce((sum: number, i: any) => sum + (i.product.price * i.quantity), 0);
 
    if (address && address !== 'Самовывоз') {
        totalPrice += 10;
    }

    const newOrder = {
        id: Date.now().toString(),
        userId: userEmail,
        items: [...userCart.items], 
        totalPrice: totalPrice,
        date: new Date().toLocaleString('ru-RU'),
        status: 'pending', 
        deliveryDetails: { 
            phone: phone || '', 
            email: email || '', 
            address: address || 'Не указан', 
            payment: payment || 'Не указан' 
        }
    };

    allOrders.push(newOrder);
    userCart.items = [];

    await db.write('orders', allOrders);
    await db.write('products', allProducts);
    await db.write('carts', allCarts);

    res.json({ message: "Заказ успешно оформлен! Мы свяжемся с вами.", order: newOrder });
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
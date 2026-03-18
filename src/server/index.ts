import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { db } from './db';
import { setSafeCookie } from './auth';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/products', async (req, res) => {
    const products = await db.read('products');
    res.json(products);
});

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const users = await db.read('users');
    
    if (users.find((u: any) => u.email === email)) {
        return res.status(400).json({ message: "Уже есть такой юзер" });
    }

    users.push({ email, password });
    await db.write('users', users);
    
    setSafeCookie(res, email);
    res.status(201).json({ message: "Успех!" });
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const users = await db.read('users'); 
    
  
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (!user) {
    
        return res.status(401).json({ message: "Неверный логин или пароль!" });
    }


    setSafeCookie(res, email);
    res.json({ message: "Успешный вход! Кука установлена." });
});

app.listen(PORT, () => {
    console.log(`СЕРВЕР ЗАПУЩЕН: http://localhost:${PORT}`);
});
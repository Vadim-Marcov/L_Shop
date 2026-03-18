export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string; 
    inStock: boolean; 
}

export interface User {
    id: string;
    email: string;
    password: string;   
}

export interface CartItem {
    product: Product;    
    quantity: number;  
}
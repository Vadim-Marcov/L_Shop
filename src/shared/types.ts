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

export interface Order {
    id: string;       
    userId: string;       
    items: CartItem[];    
    totalPrice: number;   
    date: string;        
    status: 'pending' | 'completed'; 
}
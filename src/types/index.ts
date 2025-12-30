export type UserRole = 'customer' | 'admin' | 'superuser';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  facebook_link?: string;
  facebook_name?: string;
  birthday?: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
  category: string;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  proof_url: string;
  status: PaymentStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
}

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';

export interface CartItem {
  product: Product;
  quantity: number;
}

export type LiveStatus = 'upcoming' | 'live' | 'ended';

export interface Live {
  id: string;
  title: string;
  slug: string;
  cover_image?: string;
  scheduled_at: string;
  facebook_link?: string;
  status: LiveStatus;
  created_at: string;
}

export interface LiveProduct {
  id: string;
  live_id: string;
  product_id: string;
  product?: Product;
}

export interface LiveWithProducts extends Live {
  live_products?: LiveProduct[];
}

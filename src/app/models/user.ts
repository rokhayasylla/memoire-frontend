export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'employee' | 'client';
  is_active: boolean;
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'employee' | 'client';
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'employee' | 'client';
  is_active?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role?: 'admin' | 'employee' | 'client';
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
}

// Vous pouvez aussi ajouter d'autres interfaces utiles :

export interface OrderStatusUpdate {
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  updated_at?: string;
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export type UserRole = 'optometrist' | 'admin';

export interface User {
  id: string;
  optometrist_id: string; // Format: CV-OPT-XXXX
  full_name: string;
  email: string;
  phone: string;
  shop_name: string;
  city: string;
  referral_code: string; // Format: OPT-XXXXXX
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  brand: string;
  product_name: string;
  points_per_unit: number; 
  active: boolean;
  base_price?: number;
  stock_quantity?: number;
}

export type BookingStatus = 'waiting' | 'approved' | 'rejected';

export interface Booking {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  bill_image_url?: string;
  status: BookingStatus;
  points_earned: number;
  created_at: string;
  optometrist_name?: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface Withdrawal {
  id: string;
  user_id: string;
  points: number;
  amount: number;
  upi_id: string;
  status: WithdrawalStatus;
  created_at: string;
}

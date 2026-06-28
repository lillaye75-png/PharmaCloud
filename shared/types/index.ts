export interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  wilaya?: string;
  billing_plan: string;
  is_active: boolean;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: "super_admin" | "owner" | "pharmacist" | "cashier" | "customer";
  onboarding_completed: boolean;
  onboarding_step: number;
  language: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  generic_name?: string;
  barcode?: string;
  description?: string;
  dosage_form?: string;
  dosage_strength?: string;
  requires_prescription: boolean;
  purchase_price?: number;
  selling_price: number;
  current_stock: number;
  min_stock_alert: number;
  expiry_date?: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  sale_number?: string;
  status: string;
  payment_method?: string;
  total_amount: number;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number?: string;
  status: string;
  delivery_type?: string;
  total: number;
  payment_status: string;
  created_at: string;
}

export type UserRole = "super_admin" | "owner" | "pharmacist" | "cashier" | "customer";
export type SaleStatus = "pending" | "completed" | "cancelled" | "refunded";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
export type BillingPlan = "free" | "starter" | "pro" | "enterprise";

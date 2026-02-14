export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  HELPER = 'HELPER'
}

export interface User {
  uid: string;
  displayName: string | null;
  role: UserRole;
  email: string | null;
  photoURL?: string | null;
  subscriptionPlanId?: string;
  subscriptionStatus?: 'active' | 'inactive';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface ServiceRequest {
  serviceType?: string;
  location?: string;
  urgency?: string;
  estimatedPrice?: number;
}

export interface Booking {
  id: string;
  service: string;
  date: string;
  status: 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';
  price: number;
  customerId: string;
  customerName: string;
  helperId?: string;
  helperName?: string;
  location: string;
  createdAt?: any; // Firestore Timestamp
  acceptedAt?: any;
  completedAt?: any;
}

export interface EarningRecord {
  id: string;
  bookingId: string;
  helperId: string;
  customerId: string;
  amount: number;
  timestamp: any;
  serviceName: string;
  status: 'pending' | 'received';
}

export interface EarningsData {
  day: string;
  amount: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  rating: number;
  reviews: number;
  description: string;
  color: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isPopular?: boolean;
}

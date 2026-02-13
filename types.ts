export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  HELPER = 'HELPER'
}

export interface User {
  uid: string; // Changed from id to uid to match Firebase
  displayName: string | null; // Changed from name to displayName
  role: UserRole;
  email: string | null;
  photoURL?: string | null;
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
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  price: number;
  helperName?: string;
  location: string;
  createdAt?: any; // Firestore Timestamp
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

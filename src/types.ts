export interface Gig {
  id: string;
  title: string;
  category: 'Delivery' | 'Tech' | 'Creative' | 'Services' | 'Pet Care' | 'Urgent';
  pay: string;
  distance: string;
  lat: number;
  lng: number;
  description: string;
  duration: string;
  clientName: string;
  clientRating: number;
  status: 'open' | 'applying' | 'accepted' | 'completed';
  ownerEmail?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  isTracking: boolean;
  error?: string;
}

export interface SavedIdDoc {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface ProfileData {
  firstName: string;
  surname: string;
  fullName: string;
  idNumber: string;
  location: string;
  contactNumber: string;
  email: string;
  socialLinks: string[];
  trade: string;
  experiences: string[];
  references: string[];
  isLocked?: boolean;
}

export interface Seeker {
  id: string;
  name: string;
  avatarUrl?: string;
  trade: string;
  rating: number;
  reviewCount?: number;
  distance: string;
  status: 'Online';
  rateType: 'hourly' | 'daily';
  rateAmount: string;
  lat: number;
  lng: number;
  isCurrentUser?: boolean;
  contactNumber?: string;
}

export type TenantTab = 'overview' | 'managed_referrals' | 'verification' | 'tenant_pop' | 'user_pop';

export interface TenantReferral {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  joinedAt: string;
  plan: 'User Subscription (R29.99/mo)';
  status: 'Active' | 'Pending PoP' | 'Inactive';
  monthlyFee: string;
  popSubmitted: boolean;
  popRef?: string;
  lastPaymentDate?: string;
}

export interface TenantPoPRecord {
  id: string;
  referenceNumber: string;
  amount: string; // "R299.99"
  uploadedAt: string;
  documentName: string;
  documentSize: number;
  documentType: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  notes?: string;
}

export interface UserPoPRecord {
  id: string;
  referralId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  referralCode: string;
  amount: string; // "R29.99"
  submittedAt: string;
  documentName: string;
  documentSize: number;
  documentType: string;
  status: 'Pending' | 'Approved' | 'Declined';
  notes?: string;
}

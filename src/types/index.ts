export type HostelType = 'tlnr_mens' | 'bhagya_lakshmi_womens';
export type SharingType = '1-Share' | '2-Share' | '3-Share' | '4-Share' | '5-Share';

export interface Resident {
  id: string;
  hostelId: HostelType;
  name: string;
  roomNumber: string;
  sharingType: SharingType;
  phone: string;
  email: string;
  emergencyContact?: string;
  joiningDate: string;
  monthlyRent: number;
  depositAmount: number;
  status: 'Active' | 'Vacating' | 'Left';
  vacatedDate?: string; // YYYY-MM-DD
  advance500Received?: boolean; // true = Received, false = Not Received
  advance500Notes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMode = 'UPI' | 'Cash' | 'Cash + UPI';
export type PaymentStatus = 'Paid in Full' | 'Partial' | 'Pending';

export interface PaymentRecord {
  id: string;
  hostelId: HostelType;
  receiptNumber: string;
  residentId?: string;
  residentName: string;
  roomNumber: string;
  paymentDate: string;
  month: string; // e.g. "2026-10"
  paymentMode: PaymentMode;
  monthlyRent: number;
  advanceDeposit: number;
  totalInvoiced: number;
  amountReceived: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  residentEmail?: string;
  receiptSentAt?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Grocery'
  | 'Power Bills'
  | 'Maintenance'
  | 'Worker Salary'
  | 'Advance ₹500 Given';

export interface ExpenseItem {
  id: string;
  hostelId: HostelType;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  month: string; // "2026-10"
  paidTo?: string;
  paymentMode: PaymentMode;
  billNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface MonthlyBudget {
  month: string; // "2026-10"
  hostelId: HostelType;
  groceryBudget: number;
  powerBudget: number;
  maintenanceBudget: number;
  salaryBudget: number;
  totalTargetBudget: number;
}

export interface HostelConfig {
  id: HostelType;
  name: string;
  address: string;
  phone1: string;
  phone2: string;
  ownerName: string;
  totalRooms: number;
  totalBeds: number;
}

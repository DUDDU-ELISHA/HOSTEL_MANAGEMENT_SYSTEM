import {
  HostelType,
  Resident,
  PaymentRecord,
  ExpenseItem,
  MonthlyBudget,
  HostelConfig
} from '../types';
import { TLNR_MENS_RESIDENTS, TLNR_MENS_PAYMENTS } from '../data/mensPgData';
import { CloudDbService } from './cloudDb';

const STORAGE_KEY_PREFIX = 'hms_vault_v1_';
const SECRET_SALT = 'HMS_SECURE_ENCRYPTED_2026_KEY';

// Simple symmetric obfuscation/cipher simulating encrypted client-side vault
function encrypt(data: unknown): string {
  try {
    const jsonStr = JSON.stringify(data);
    let output = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      output += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(output));
  } catch (e) {
    console.error('Encryption error', e);
    return JSON.stringify(data);
  }
}

function decrypt<T>(ciphertext: string, fallback: T): T {
  try {
    if (!ciphertext) return fallback;
    const decoded = decodeURIComponent(atob(ciphertext));
    let jsonStr = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      jsonStr += String.fromCharCode(charCode);
    }
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    // If it was stored unencrypted before
    try {
      return JSON.parse(ciphertext) as T;
    } catch {
      return fallback;
    }
  }
}

export const HOSTEL_CONFIGS: Record<HostelType, HostelConfig> = {
  tlnr_mens: {
    id: 'tlnr_mens',
    name: "TLNR MEN'S PG",
    address: 'KPHB Road Number 3, Hyderabad, Telangana',
    phone1: '9908522152',
    phone2: '9133699944',
    ownerName: 'T.Subba Reddy',
    totalRooms: 35,
    totalBeds: 120,
  },
  bhagya_lakshmi_womens: {
    id: 'bhagya_lakshmi_womens',
    name: "BHAGYA LAKHSMI WOMEN'S PG",
    address: 'KPHB Road Number 3, Hyderabad, Telangana',
    phone1: '9908522152',
    phone2: '9133699944',
    ownerName: 'T.Subba Reddy',
    totalRooms: 30,
    totalBeds: 90,
  },
};

// Dispatch real-time cross-component & cross-tab events
function emitChange() {
  window.dispatchEvent(new CustomEvent('hostel_data_sync'));
}

export const StorageService = {
  // Capacity & Hostel Config
  getHostelConfig(hostelId: HostelType): HostelConfig {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}config_${hostelId}`);
    if (!raw) return HOSTEL_CONFIGS[hostelId];
    return decrypt<HostelConfig>(raw, HOSTEL_CONFIGS[hostelId]);
  },

  updateHostelConfig(config: HostelConfig): void {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}config_${config.id}`,
      encrypt(config)
    );
    emitChange();
  },

  // Residents (Initial empty for Women's PG; loaded from registered records for Men's PG)
  getResidents(hostelId: HostelType): Resident[] {
    if (hostelId === 'tlnr_mens') {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}residents_${hostelId}`);
      if (!raw) {
        this.seedMensPgData();
        return TLNR_MENS_RESIDENTS;
      }
      const list = decrypt<Resident[]>(raw, []);
      // If empty or older placeholder (< 10 records), refresh with the 91 records
      if (list.length < 10) {
        this.seedMensPgData();
        return TLNR_MENS_RESIDENTS;
      }
      return list;
    }
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}residents_${hostelId}`);
    if (!raw) return [];
    return decrypt<Resident[]>(raw, []);
  },

  seedMensPgData(): void {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}residents_tlnr_mens`,
      encrypt(TLNR_MENS_RESIDENTS)
    );
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}payments_tlnr_mens`,
      encrypt(TLNR_MENS_PAYMENTS)
    );
    emitChange();
  },

  saveResident(resident: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Resident {
    const current = this.getResidents(resident.hostelId);
    const now = new Date().toISOString();
    let saved: Resident;

    if (resident.id) {
      // Edit
      const updated = current.map((r) =>
        r.id === resident.id ? { ...r, ...resident, updatedAt: now } : r
      );
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}residents_${resident.hostelId}`,
        encrypt(updated)
      );
      saved = updated.find((r) => r.id === resident.id)!;
    } else {
      // Add
      const newResident: Resident = {
        ...resident,
        id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newResident, ...current];
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}residents_${resident.hostelId}`,
        encrypt(updated)
      );
      saved = newResident;
    }
    emitChange();
    // Persist to Cloud Firestore in background
    CloudDbService.saveResident(saved).catch((err) => console.warn('Cloud sync error:', err));
    return saved;
  },

  deleteResident(hostelId: HostelType, residentId: string): void {
    const current = this.getResidents(hostelId);
    const filtered = current.filter((r) => r.id !== residentId);
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}residents_${hostelId}`,
      encrypt(filtered)
    );
    emitChange();
    CloudDbService.deleteResident(hostelId, residentId).catch((err) =>
      console.warn('Cloud delete error:', err)
    );
  },

  toggleAdvance500Status(hostelId: HostelType, residentId: string, received?: boolean): Resident | undefined {
    const current = this.getResidents(hostelId);
    const now = new Date().toISOString();
    const target = current.find((r) => r.id === residentId);
    if (!target) return undefined;
    const newStatus = received !== undefined ? received : !target.advance500Received;
    const updated = current.map((r) =>
      r.id === residentId
        ? {
            ...r,
            advance500Received: newStatus,
            updatedAt: now,
          }
        : r
    );
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}residents_${hostelId}`,
      encrypt(updated)
    );
    emitChange();
    const result = updated.find((r) => r.id === residentId);
    if (result) {
      CloudDbService.saveResident(result).catch((err) =>
        console.warn('Cloud toggle error:', err)
      );
    }
    return result;
  },

  markResidentVacated(
    hostelId: HostelType,
    residentId: string,
    vacatedDate: string,
    advance500Received: boolean,
    notes?: string
  ): Resident | undefined {
    const current = this.getResidents(hostelId);
    const now = new Date().toISOString();
    const target = current.find((r) => r.id === residentId);
    if (!target) return undefined;
    const updated = current.map((r) =>
      r.id === residentId
        ? {
            ...r,
            status: 'Left' as const,
            vacatedDate: vacatedDate || now.slice(0, 10),
            advance500Received,
            notes: notes ? (r.notes ? `${r.notes} | ${notes}` : notes) : r.notes,
            updatedAt: now,
          }
        : r
    );
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}residents_${hostelId}`,
      encrypt(updated)
    );
    emitChange();
    const result = updated.find((r) => r.id === residentId);
    if (result) {
      CloudDbService.saveResident(result).catch((err) =>
        console.warn('Cloud vacate error:', err)
      );
    }
    return result;
  },

  restoreResident(hostelId: HostelType, residentId: string): Resident | undefined {
    const current = this.getResidents(hostelId);
    const now = new Date().toISOString();
    const updated = current.map((r) =>
      r.id === residentId
        ? {
            ...r,
            status: 'Active' as const,
            vacatedDate: undefined,
            updatedAt: now,
          }
        : r
    );
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}residents_${hostelId}`,
      encrypt(updated)
    );
    emitChange();
    const result = updated.find((r) => r.id === residentId);
    if (result) {
      CloudDbService.saveResident(result).catch((err) =>
        console.warn('Cloud restore error:', err)
      );
    }
    return result;
  },

  // Payments (Initial empty for Women's PG; loaded from registered records for Men's PG)
  getPayments(hostelId: HostelType): PaymentRecord[] {
    const DATA_SPLIT_VERSION = 'hms_vault_v3_aug_sep_split_verified';
    if (hostelId === 'tlnr_mens') {
      const versionFlag = localStorage.getItem(DATA_SPLIT_VERSION);
      if (!versionFlag) {
        this.seedMensPgData();
        localStorage.setItem(DATA_SPLIT_VERSION, 'true');
        return TLNR_MENS_PAYMENTS;
      }
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}payments_${hostelId}`);
      if (!raw) {
        this.seedMensPgData();
        return TLNR_MENS_PAYMENTS;
      }
      const list = decrypt<PaymentRecord[]>(raw, []);
      if (list.length < 10) {
        this.seedMensPgData();
        return TLNR_MENS_PAYMENTS;
      }
      // Ensure month strictly matches paymentDate for all records
      return list.map((p) => {
        const strictMonth = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
        return p.month !== strictMonth ? { ...p, month: strictMonth } : p;
      });
    }
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}payments_${hostelId}`);
    if (!raw) return [];
    const list = decrypt<PaymentRecord[]>(raw, []);
    return list.map((p) => {
      const strictMonth = p.paymentDate ? p.paymentDate.slice(0, 7) : p.month;
      return p.month !== strictMonth ? { ...p, month: strictMonth } : p;
    });
  },

  savePayment(
    payment: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'createdAt'> & { id?: string; receiptNumber?: string }
  ): PaymentRecord {
    const current = this.getPayments(payment.hostelId);
    const now = new Date().toISOString();
    // Strictly derive month from paymentDate
    const derivedMonth = payment.paymentDate
      ? payment.paymentDate.slice(0, 7)
      : (payment.month || now.slice(0, 7));
    const normalizedPayment = { ...payment, month: derivedMonth };
    let saved: PaymentRecord;

    if (normalizedPayment.id) {
      // Update
      const updated = current.map((p) =>
        p.id === normalizedPayment.id ? { ...p, ...normalizedPayment } : p
      );
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}payments_${normalizedPayment.hostelId}`,
        encrypt(updated)
      );
      saved = updated.find((p) => p.id === normalizedPayment.id)!;
    } else {
      // Add
      const count = current.length + 1;
      const receiptNumber =
        normalizedPayment.receiptNumber || String(count).padStart(3, '0');
      const newPayment: PaymentRecord = {
        ...normalizedPayment,
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        receiptNumber,
        createdAt: now,
      };
      const updated = [newPayment, ...current];
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}payments_${normalizedPayment.hostelId}`,
        encrypt(updated)
      );
      saved = newPayment;
    }
    emitChange();
    CloudDbService.savePayment(saved).catch((err) =>
      console.warn('Cloud payment sync error:', err)
    );
    return saved;
  },

  deletePayment(hostelId: HostelType, paymentId: string): void {
    const current = this.getPayments(hostelId);
    const filtered = current.filter((p) => p.id !== paymentId);
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}payments_${hostelId}`,
      encrypt(filtered)
    );
    emitChange();
    CloudDbService.deletePayment(hostelId, paymentId).catch((err) =>
      console.warn('Cloud payment delete error:', err)
    );
  },

  markReceiptSent(hostelId: HostelType, paymentId: string): void {
    const current = this.getPayments(hostelId);
    const updated = current.map((p) =>
      p.id === paymentId ? { ...p, receiptSentAt: new Date().toISOString() } : p
    );
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}payments_${hostelId}`,
      encrypt(updated)
    );
    emitChange();
    const result = updated.find((p) => p.id === paymentId);
    if (result) {
      CloudDbService.savePayment(result).catch((err) =>
        console.warn('Cloud receiptSent sync error:', err)
      );
    }
  },

  // Expenses (Initial empty array)
  getExpenses(hostelId: HostelType): ExpenseItem[] {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}expenses_${hostelId}`);
    if (!raw) return [];
    return decrypt<ExpenseItem[]>(raw, []);
  },

  saveExpense(
    expense: Omit<ExpenseItem, 'id' | 'createdAt'> & { id?: string }
  ): ExpenseItem {
    const current = this.getExpenses(expense.hostelId);
    const now = new Date().toISOString();
    let saved: ExpenseItem;

    if (expense.id) {
      const updated = current.map((e) =>
        e.id === expense.id ? { ...e, ...expense } : e
      );
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}expenses_${expense.hostelId}`,
        encrypt(updated)
      );
      saved = updated.find((e) => e.id === expense.id)!;
    } else {
      const newExpense: ExpenseItem = {
        ...expense,
        id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: now,
      };
      const updated = [newExpense, ...current];
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}expenses_${expense.hostelId}`,
        encrypt(updated)
      );
      saved = newExpense;
    }
    emitChange();
    CloudDbService.saveExpense(saved).catch((err) =>
      console.warn('Cloud expense sync error:', err)
    );
    return saved;
  },

  deleteExpense(hostelId: HostelType, expenseId: string): void {
    const current = this.getExpenses(hostelId);
    const filtered = current.filter((e) => e.id !== expenseId);
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}expenses_${hostelId}`,
      encrypt(filtered)
    );
    emitChange();
    CloudDbService.deleteExpense(hostelId, expenseId).catch((err) =>
      console.warn('Cloud expense delete error:', err)
    );
  },

  // Budget
  getBudget(hostelId: HostelType, month: string): MonthlyBudget {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}budget_${hostelId}_${month}`);
    if (!raw) {
      return {
        month,
        hostelId,
        groceryBudget: 0,
        powerBudget: 0,
        maintenanceBudget: 0,
        salaryBudget: 0,
        totalTargetBudget: 0,
      };
    }
    return decrypt<MonthlyBudget>(raw, {
      month,
      hostelId,
      groceryBudget: 0,
      powerBudget: 0,
      maintenanceBudget: 0,
      salaryBudget: 0,
      totalTargetBudget: 0,
    });
  },

  saveBudget(budget: MonthlyBudget): void {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}budget_${budget.hostelId}_${budget.month}`,
      encrypt(budget)
    );
    emitChange();
  },

  // Helper to load sample starter data if explicitly triggered by the user
  seedSampleData(hostelId: HostelType): void {
    const sampleResidents: Resident[] = [
      {
        id: 'res_sample_1',
        hostelId,
        name: 'Hari',
        roomNumber: 'Room 702',
        sharingType: '2-Share',
        phone: '9849012345',
        email: 'hari.resident@gmail.com',
        emergencyContact: '9849098765',
        joiningDate: '2026-10-01',
        monthlyRent: 7000,
        depositAmount: 2000,
        status: 'Active',
        notes: 'Room key issued, AC room',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'res_sample_2',
        hostelId,
        name: 'Kiran Kumar',
        roomNumber: 'Room 501',
        sharingType: '3-Share',
        phone: '9701123456',
        email: 'kiran.k@gmail.com',
        emergencyContact: '9701198765',
        joiningDate: '2026-09-15',
        monthlyRent: 6500,
        depositAmount: 2000,
        status: 'Active',
        notes: 'Non-AC, 3rd floor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'res_sample_vacated_1',
        hostelId,
        name: 'Suresh Varma',
        roomNumber: 'Room 304',
        sharingType: '2-Share',
        phone: '9849554321',
        email: 'suresh.v@gmail.com',
        joiningDate: '2026-08-01',
        monthlyRent: 7000,
        depositAmount: 500,
        status: 'Left',
        vacatedDate: '2026-09-28',
        advance500Received: true,
        notes: 'Keys returned, advance ₹500 settled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const samplePayments: PaymentRecord[] = [
      {
        id: 'pay_sample_1',
        hostelId,
        receiptNumber: '001',
        residentId: 'res_sample_1',
        residentName: 'Hari',
        roomNumber: 'Room 702',
        paymentDate: '2026-10-01',
        month: '2026-10',
        paymentMode: 'UPI',
        monthlyRent: 7000,
        advanceDeposit: 0,
        totalInvoiced: 7000,
        amountReceived: 7000,
        outstandingBalance: 0,
        paymentStatus: 'Paid in Full',
        residentEmail: 'hari.resident@gmail.com',
        notes: 'Full payment via GooglePay',
        createdAt: new Date().toISOString(),
      },
    ];

    const sampleExpenses: ExpenseItem[] = [
      {
        id: 'exp_sample_1',
        hostelId,
        category: 'Grocery',
        title: 'Monthly Rice & Provisions',
        amount: 14500,
        date: '2026-10-02',
        month: '2026-10',
        paidTo: 'Sri Rama Traders',
        paymentMode: 'UPI',
        billNumber: 'INV-8891',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_2',
        hostelId,
        category: 'Power Bills',
        title: 'TSSPDCL Electricity Bill - 1st & 2nd Floor',
        amount: 8200,
        date: '2026-10-05',
        month: '2026-10',
        paidTo: 'Electricity Dept',
        paymentMode: 'UPI',
        billNumber: 'EB-102938',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_3',
        hostelId,
        category: 'Worker Salary',
        title: 'Main Cook Salary',
        amount: 18000,
        date: '2026-10-05',
        month: '2026-10',
        paidTo: 'Ramesh (Head Cook)',
        paymentMode: 'Cash',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_4',
        hostelId,
        category: 'Maintenance',
        title: 'Wi-Fi Fiber Connection & RO Filter Service',
        amount: 3200,
        date: '2026-10-04',
        month: '2026-10',
        paidTo: 'ACT Fibernet & AquaService',
        paymentMode: 'Cash + UPI',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp_sample_5',
        hostelId,
        category: 'Advance ₹500 Given',
        title: 'Advance ₹500 Given to Suresh Varma (Room 304)',
        amount: 500,
        date: '2026-09-28',
        month: '2026-09',
        paidTo: 'Suresh Varma',
        paymentMode: 'UPI',
        billNumber: 'ADV-500-01',
        notes: 'Room vacated, advance settled',
        createdAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem(`${STORAGE_KEY_PREFIX}residents_${hostelId}`, encrypt(sampleResidents));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}payments_${hostelId}`, encrypt(samplePayments));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}expenses_${hostelId}`, encrypt(sampleExpenses));
    emitChange();
  },

  // Clear all data for a hostel
  clearHostelData(hostelId: HostelType): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}residents_${hostelId}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}payments_${hostelId}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}expenses_${hostelId}`);
    emitChange();
  },

  // Pull latest updates from Cloud Firestore into browser/device vault
  async syncFromCloud(hostelId: HostelType): Promise<{
    residentsCount: number;
    paymentsCount: number;
    expensesCount: number;
  }> {
    try {
      const [cloudResidents, cloudPayments, cloudExpenses, cloudConfig] = await Promise.all([
        CloudDbService.fetchResidents(hostelId),
        CloudDbService.fetchPayments(hostelId),
        CloudDbService.fetchExpenses(hostelId),
        CloudDbService.fetchHostelConfig(hostelId),
      ]);

      if (cloudConfig) {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}config_${hostelId}`,
          encrypt(cloudConfig)
        );
      }

      if (cloudResidents && cloudResidents.length > 0) {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}residents_${hostelId}`,
          encrypt(cloudResidents)
        );
      } else if (hostelId === 'tlnr_mens') {
        // If cloud was not seeded yet, seed cloud from current local / master data
        const currentLocal = this.getResidents(hostelId);
        if (currentLocal.length > 0) {
          CloudDbService.batchSyncResidents(hostelId, currentLocal).catch(console.warn);
        }
      }

      if (cloudPayments && cloudPayments.length > 0) {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}payments_${hostelId}`,
          encrypt(cloudPayments)
        );
      } else if (hostelId === 'tlnr_mens') {
        const currentLocal = this.getPayments(hostelId);
        if (currentLocal.length > 0) {
          CloudDbService.batchSyncPayments(hostelId, currentLocal).catch(console.warn);
        }
      }

      if (cloudExpenses && cloudExpenses.length > 0) {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}expenses_${hostelId}`,
          encrypt(cloudExpenses)
        );
      }

      emitChange();
      return {
        residentsCount: cloudResidents.length,
        paymentsCount: cloudPayments.length,
        expensesCount: cloudExpenses.length,
      };
    } catch (e) {
      console.warn('Sync from cloud error:', e);
      return { residentsCount: 0, paymentsCount: 0, expensesCount: 0 };
    }
  },
};

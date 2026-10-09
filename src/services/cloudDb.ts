import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  HostelType,
  Resident,
  PaymentRecord,
  ExpenseItem,
  HostelConfig,
  MonthlyBudget
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'host_admin',
      email: 'dudduelisha7@gmail.com',
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export const CloudDbService = {
  // Sync resident to Firestore
  async saveResident(resident: Resident): Promise<void> {
    const path = `hostels/${resident.hostelId}/residents/${resident.id}`;
    try {
      const docRef = doc(db, 'hostels', resident.hostelId, 'residents', resident.id);
      // Clean undefined fields for Firestore compatibility
      const payload: Record<string, any> = { ...resident };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteResident(hostelId: HostelType, residentId: string): Promise<void> {
    const path = `hostels/${hostelId}/residents/${residentId}`;
    try {
      const docRef = doc(db, 'hostels', hostelId, 'residents', residentId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async fetchResidents(hostelId: HostelType): Promise<Resident[]> {
    const path = `hostels/${hostelId}/residents`;
    try {
      const colRef = collection(db, 'hostels', hostelId, 'residents');
      const snap = await getDocs(colRef);
      const results: Resident[] = [];
      snap.forEach((d) => {
        results.push(d.data() as Resident);
      });
      return results;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Sync payment to Firestore
  async savePayment(payment: PaymentRecord): Promise<void> {
    const path = `hostels/${payment.hostelId}/payments/${payment.id}`;
    try {
      const docRef = doc(db, 'hostels', payment.hostelId, 'payments', payment.id);
      const payload: Record<string, any> = { ...payment };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deletePayment(hostelId: HostelType, paymentId: string): Promise<void> {
    const path = `hostels/${hostelId}/payments/${paymentId}`;
    try {
      const docRef = doc(db, 'hostels', hostelId, 'payments', paymentId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async fetchPayments(hostelId: HostelType): Promise<PaymentRecord[]> {
    const path = `hostels/${hostelId}/payments`;
    try {
      const colRef = collection(db, 'hostels', hostelId, 'payments');
      const snap = await getDocs(colRef);
      const results: PaymentRecord[] = [];
      snap.forEach((d) => {
        results.push(d.data() as PaymentRecord);
      });
      return results;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Sync expense to Firestore
  async saveExpense(expense: ExpenseItem): Promise<void> {
    const path = `hostels/${expense.hostelId}/expenses/${expense.id}`;
    try {
      const docRef = doc(db, 'hostels', expense.hostelId, 'expenses', expense.id);
      const payload: Record<string, any> = { ...expense };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteExpense(hostelId: HostelType, expenseId: string): Promise<void> {
    const path = `hostels/${hostelId}/expenses/${expenseId}`;
    try {
      const docRef = doc(db, 'hostels', hostelId, 'expenses', expenseId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async fetchExpenses(hostelId: HostelType): Promise<ExpenseItem[]> {
    const path = `hostels/${hostelId}/expenses`;
    try {
      const colRef = collection(db, 'hostels', hostelId, 'expenses');
      const snap = await getDocs(colRef);
      const results: ExpenseItem[] = [];
      snap.forEach((d) => {
        results.push(d.data() as ExpenseItem);
      });
      return results;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Sync hostel config
  async saveHostelConfig(config: HostelConfig): Promise<void> {
    const path = `hostels/${config.id}/configs/profile`;
    try {
      const docRef = doc(db, 'hostels', config.id, 'configs', 'profile');
      await setDoc(docRef, config, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async fetchHostelConfig(hostelId: HostelType): Promise<HostelConfig | null> {
    const path = `hostels/${hostelId}/configs/profile`;
    try {
      const colRef = collection(db, 'hostels', hostelId, 'configs');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs[0].data() as HostelConfig;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Batch seed or sync up collection
  async batchSyncResidents(hostelId: HostelType, residents: Resident[]): Promise<void> {
    if (residents.length === 0) return;
    try {
      // Chunk batches by 400 (Firestore limit is 500)
      for (let i = 0; i < residents.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = residents.slice(i, i + 400);
        chunk.forEach((r) => {
          const docRef = doc(db, 'hostels', hostelId, 'residents', r.id);
          const payload: Record<string, any> = { ...r };
          Object.keys(payload).forEach((k) => {
            if (payload[k] === undefined) delete payload[k];
          });
          batch.set(docRef, payload, { merge: true });
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn('Batch resident sync warning:', e);
    }
  },

  async batchSyncPayments(hostelId: HostelType, payments: PaymentRecord[]): Promise<void> {
    if (payments.length === 0) return;
    try {
      for (let i = 0; i < payments.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = payments.slice(i, i + 400);
        chunk.forEach((p) => {
          const docRef = doc(db, 'hostels', hostelId, 'payments', p.id);
          const payload: Record<string, any> = { ...p };
          Object.keys(payload).forEach((k) => {
            if (payload[k] === undefined) delete payload[k];
          });
          batch.set(docRef, payload, { merge: true });
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn('Batch payment sync warning:', e);
    }
  },
};

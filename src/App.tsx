import React, { useState, useEffect, useCallback } from 'react';
import { HostelType, Resident, PaymentRecord, ExpenseItem, HostelConfig } from './types';
import { StorageService, HOSTEL_CONFIGS } from './services/storage';
import { HostLogin } from './components/HostLogin';
import { HostelSelector } from './components/HostelSelector';
import { Navbar } from './components/Navbar';
import { ResidentSection } from './components/ResidentSection';
import { VacatedResidentsSection } from './components/VacatedResidentsSection';
import { PaymentSection } from './components/PaymentSection';
import { InvestmentSection } from './components/InvestmentSection';
import { MonthlyReportingSection } from './components/MonthlyReportingSection';
import { ShieldCheck, Database, RefreshCw, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hms_host_session_active') === 'true';
  });

  // Selected Hostel Dashboard State (null means showing the two CSS cards selector)
  const [selectedHostel, setSelectedHostel] = useState<HostelType | null>(null);

  // Active Section in Dashboard: 'residents' | 'vacated' | 'payments' | 'investments' | 'reports'
  const [activeSection, setActiveSection] = useState<
    'residents' | 'vacated' | 'payments' | 'investments' | 'reports'
  >('residents');

  // Fast-track state: e.g. clicking "Collect Fee" on a resident card switches to payment tab with preselected resident
  const [preselectedResidentForPayment, setPreselectedResidentForPayment] =
    useState<Resident | null>(null);

  // Data State
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [config, setConfig] = useState<HostelConfig>(
    HOSTEL_CONFIGS.tlnr_mens
  );
  const [syncTime, setSyncTime] = useState<string>('Live Sync Active');

  // Load data for the selected hostel
  const loadHostelData = useCallback(() => {
    if (!selectedHostel) return;
    const currentConfig = StorageService.getHostelConfig(selectedHostel);
    const currentResidents = StorageService.getResidents(selectedHostel);
    const currentPayments = StorageService.getPayments(selectedHostel);
    const currentExpenses = StorageService.getExpenses(selectedHostel);

    setConfig(currentConfig);
    setResidents(currentResidents);
    setPayments(currentPayments);
    setExpenses(currentExpenses);
    setSyncTime(
      `Synced ${new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`
    );
  }, [selectedHostel]);

  // Initial and reactive sync
  useEffect(() => {
    loadHostelData();

    // Listen to real-time events across tabs & storage updates
    const handleSync = () => {
      loadHostelData();
    };

    window.addEventListener('hostel_data_sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('hostel_data_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadHostelData]);

  // Auth Handlers
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hms_host_session_active');
    setIsAuthenticated(false);
    setSelectedHostel(null);
  };

  // Navigate to Dashboard
  const handleSelectHostel = (hostelId: HostelType) => {
    setSelectedHostel(hostelId);
    setActiveSection('residents');
  };

  // Quick pay handler from resident card
  const handleQuickPay = (res: Resident) => {
    setPreselectedResidentForPayment(res);
    setActiveSection('payments');
  };

  // Optional: Seed sample data if host wants to test
  const handleSeedSample = () => {
    if (!selectedHostel) return;
    StorageService.seedSampleData(selectedHostel);
    loadHostelData();
  };

  // Clear data
  const handleClearData = () => {
    if (!selectedHostel) return;
    if (
      window.confirm(
        `Are you sure you want to clear all resident, payment, and expense records for ${config.name}?`
      )
    ) {
      StorageService.clearHostelData(selectedHostel);
      loadHostelData();
    }
  };

  // 1. If not logged in -> Host Login Screen
  if (!isAuthenticated) {
    return <HostLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If no hostel selected -> Show the Two CSS cards
  if (!selectedHostel) {
    return (
      <HostelSelector
        onSelectHostel={handleSelectHostel}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Main Dashboard for Selected Hostel
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        currentHostel={selectedHostel}
        config={config}
        activeSection={activeSection}
        onSectionChange={(sec) => {
          setActiveSection(sec);
          if (sec !== 'payments') {
            setPreselectedResidentForPayment(null);
          }
        }}
        onSwitchHostel={(hostel) => setSelectedHostel(hostel)}
        onGoToHostelSelector={() => setSelectedHostel(null)}
        onLogout={handleLogout}
      />

      {/* Real-time Status Banner */}
      <div className="bg-purple-950 text-purple-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">{config.name}</span>
            <span>·</span>
            <span>{config.address}</span>
            <span>·</span>
            <span>Owner: {config.ownerName} ({config.phone1})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono">{syncTime}</span>
            <span className="flex items-center gap-1 text-emerald-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Encrypted Vault Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section 1: Resident Section */}
        {activeSection === 'residents' && (
          <ResidentSection
            hostelId={selectedHostel}
            config={config}
            residents={residents}
            payments={payments}
            onRefresh={loadHostelData}
            onQuickPay={handleQuickPay}
            onNavigateToVacated={() => setActiveSection('vacated')}
          />
        )}

        {/* Section 2: Vacated Residents Section */}
        {activeSection === 'vacated' && (
          <VacatedResidentsSection
            hostelId={selectedHostel}
            config={config}
            residents={residents}
            onRefresh={loadHostelData}
            onNavigateToActive={() => setActiveSection('residents')}
          />
        )}

        {/* Section 2: Payment Section */}
        {activeSection === 'payments' && (
          <PaymentSection
            hostelId={selectedHostel}
            config={config}
            residents={residents}
            payments={payments}
            onRefresh={loadHostelData}
            preselectedResidentForPayment={preselectedResidentForPayment}
            onClearPreselectedResident={() =>
              setPreselectedResidentForPayment(null)
            }
          />
        )}

        {/* Section 3: Investment Section */}
        {activeSection === 'investments' && (
          <InvestmentSection
            hostelId={selectedHostel}
            config={config}
            expenses={expenses}
            onRefresh={loadHostelData}
          />
        )}

        {/* Section 4: Monthly Reporting Section */}
        {activeSection === 'reports' && (
          <MonthlyReportingSection
            hostelId={selectedHostel}
            config={config}
            residents={residents}
            payments={payments}
            expenses={expenses}
          />
        )}
      </main>

      {/* Operational Utility Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>Official Portal for </span>
            <strong className="text-slate-700 font-semibold">{config.name}</strong>
            <span> · Authorized Signatory: </span>
            <strong className="text-slate-700 font-semibold">{config.ownerName}</strong>
          </div>

          <div className="flex items-center gap-3">
            {residents.length === 0 && payments.length === 0 && (
              <button
                onClick={handleSeedSample}
                className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium cursor-pointer"
                title="Populate sample resident & receipt records for testing"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Records</span>
              </button>
            )}
            {(residents.length > 0 || payments.length > 0 || expenses.length > 0) && (
              <button
                onClick={handleClearData}
                className="text-slate-400 hover:text-red-600 cursor-pointer"
                title="Reset this hostel to initial clean state"
              >
                Reset to Clean State
              </button>
            )}
            <span>·</span>
            <span>Host: dudduelisha7@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { HostelType, HostelConfig } from '../types';
import {
  Users,
  CreditCard,
  ShoppingBag,
  FileText,
  Building2,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Menu,
  X,
  UserMinus
} from 'lucide-react';

interface NavbarProps {
  currentHostel: HostelType;
  config: HostelConfig;
  activeSection: 'residents' | 'vacated' | 'payments' | 'investments' | 'reports';
  onSectionChange: (section: 'residents' | 'vacated' | 'payments' | 'investments' | 'reports') => void;
  onSwitchHostel: (hostel: HostelType) => void;
  onGoToHostelSelector: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentHostel,
  config,
  activeSection,
  onSectionChange,
  onSwitchHostel,
  onGoToHostelSelector,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hostelDropdownOpen, setHostelDropdownOpen] = useState(false);

  const sections = [
    { id: 'residents', label: 'Resident Section', icon: Users },
    { id: 'vacated', label: 'Vacated Residents', icon: UserMinus },
    { id: 'payments', label: 'Payment Section', icon: CreditCard },
    { id: 'investments', label: 'Investment Section', icon: ShoppingBag },
    { id: 'reports', label: 'Monthly Reporting Section', icon: FileText },
  ] as const;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ZONE 1: Brand Wordmark & Hostel Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => setHostelDropdownOpen(!hostelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#4a0e4e] font-bold text-sm sm:text-base border border-purple-200 transition-colors cursor-pointer"
                title="Click to switch between Men's PG and Women's PG"
              >
                <Building2 className="w-4 h-4 shrink-0 text-[#4a0e4e]" />
                <span className="truncate max-w-[170px] sm:max-w-none">
                  {config.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              </button>

              {/* Hostel Switcher Dropdown */}
              {hostelDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Property Dashboard
                  </div>
                  <button
                    onClick={() => {
                      onSwitchHostel('tlnr_mens');
                      setHostelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      currentHostel === 'tlnr_mens'
                        ? 'text-[#4a0e4e] bg-purple-50'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>TLNR MEN'S PG</span>
                    {currentHostel === 'tlnr_mens' && (
                      <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded text-purple-900 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchHostel('bhagya_lakshmi_womens');
                      setHostelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      currentHostel === 'bhagya_lakshmi_womens'
                        ? 'text-[#4a0e4e] bg-purple-50'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>BHAGYA LAKHSMI WOMEN'S PG</span>
                    {currentHostel === 'bhagya_lakshmi_womens' && (
                      <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded text-purple-900 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setHostelDropdownOpen(false);
                        onGoToHostelSelector();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-purple-700 font-medium hover:bg-purple-50 cursor-pointer"
                    >
                      ← Back to Properties Overview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ZONE 2: The 4 Main Navigation Sections */}
          <nav className="hidden lg:flex items-center gap-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => onSectionChange(sec.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4a0e4e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: Host Auth Status & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                dudduelisha7@gmail.com
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3" /> Host Admin
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="Sign out of host portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  onSectionChange(sec.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-[#4a0e4e] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onGoToHostelSelector();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-purple-800 hover:bg-purple-50 rounded-lg cursor-pointer"
            >
              Switch Property Overview Card
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

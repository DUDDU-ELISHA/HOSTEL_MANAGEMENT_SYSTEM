import React, { useRef } from 'react';
import { PaymentRecord, HostelConfig } from '../types';
import { Printer, Mail, X, CheckCircle, Download } from 'lucide-react';
import { formatReceiptNumber, downloadReceiptAsPDF } from '../services/pdfGenerator';

interface ReceiptModalProps {
  payment: PaymentRecord;
  config: HostelConfig;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail?: (payment: PaymentRecord) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  config,
  isOpen,
  onClose,
  onSendEmail,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const receiptNum = formatReceiptNumber(payment.receiptNumber);

  const handleDownloadPDF = () => {
    downloadReceiptAsPDF(payment, config);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Payment Receipt: #{receiptNum}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">{payment.residentName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer"
              title="Download official receipt as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            {onSendEmail && (
              <button
                onClick={() => onSendEmail(payment)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                title="Send receipt to resident email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send to Mail</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT CANVAS (Exactly matching sample receipt) */}
        <div className="p-6 md:p-8 bg-white" ref={receiptRef}>
          <div className="receipt-container border border-purple-200 rounded-lg p-6 bg-white shadow-sm">
            {/* Top Purple Banner */}
            <div className="bg-[#4a0e4e] text-white rounded-lg py-5 px-6 text-center shadow-sm">
              <h1 className="text-2xl font-bold tracking-wide uppercase">
                {config.name}
              </h1>
              <p className="text-xs text-purple-100 mt-1 font-medium">
                {config.address}
              </p>
              <p className="text-xs text-purple-200 mt-0.5">
                Owner Contact: {config.phone1} / {config.phone2}
              </p>
            </div>

            {/* Official Header & Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-6 pb-2 border-b border-slate-200">
              <h2 className="text-base font-bold text-[#4a0e4e] tracking-tight uppercase">
                OFFICIAL PAYMENT RECEIPT
              </h2>
              <div className="text-right text-xs text-slate-600 font-mono">
                <div>
                  <span className="text-slate-500">Receipt No:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {receiptNum}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {payment.paymentDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Resident Information Box */}
            <div className="mt-5 p-4 rounded-lg bg-purple-50/50 border border-purple-200">
              <div className="text-[11px] font-bold text-[#6b21a8] tracking-wider uppercase mb-2">
                RESIDENT INFORMATION
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-900">
                    <span className="text-slate-500 text-xs">Resident Name: </span>
                    <strong className="font-semibold">{payment.residentName}</strong>
                  </div>
                  <div className="text-slate-900 mt-1">
                    <span className="text-slate-500 text-xs">Room Number: </span>
                    <span className="font-medium">{payment.roomNumber}</span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-slate-900">
                    <span className="text-slate-500 text-xs">Payment Mode: </span>
                    <strong className="font-semibold text-[#4a0e4e]">
                      {payment.paymentMode}
                    </strong>
                  </div>
                  {payment.residentEmail && (
                    <div className="text-xs text-slate-600 mt-1 truncate">
                      <span className="text-slate-500">Email: </span>
                      {payment.residentEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="mt-6 border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#4a0e4e] text-white">
                    <th className="py-2.5 px-4 font-semibold uppercase text-xs tracking-wider">
                      DESCRIPTION
                    </th>
                    <th className="py-2.5 px-4 font-semibold uppercase text-xs tracking-wider text-right">
                      AMOUNT (INR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-white">
                    <td className="py-2 px-4 text-slate-700">Monthly Room Rent</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-900">
                      INR {payment.monthlyRent.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2 px-4 text-slate-700">
                      Advance / Security Deposit
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-900">
                      INR {(payment.advanceDeposit || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-purple-50/70 font-semibold text-[#4a0e4e]">
                    <td className="py-2.5 px-4">Total Invoiced Amount</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      INR {payment.totalInvoiced.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold text-emerald-800">
                    <td className="py-2.5 px-4">Amount Received</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      INR {payment.amountReceived.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2 px-4 text-slate-700">Outstanding Balance</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-900">
                      INR {payment.outstandingBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status & Signature */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <div>
                <div
                  className={`inline-flex items-center px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-sm ${
                    payment.outstandingBalance === 0
                      ? 'bg-emerald-600'
                      : payment.amountReceived > 0
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {payment.outstandingBalance === 0
                    ? 'PAID IN FULL'
                    : `PARTIAL (DUE: ₹${payment.outstandingBalance.toLocaleString('en-IN')})`}
                </div>
              </div>

              <div className="text-right w-full sm:w-auto">
                <div className="text-xs text-slate-500 mb-1">
                  Authorized Signature:
                </div>
                <div className="font-serif text-lg font-bold text-purple-900 tracking-wide">
                  {config.ownerName}
                </div>
                <div className="w-48 sm:w-56 h-[1.5px] bg-purple-900 ml-auto my-1" />
                <div className="text-[11px] text-slate-600">
                  Owner / Management, {config.name}
                </div>
              </div>
            </div>

            {/* Hostel Amenities Footer */}
            <div className="mt-8 pt-4 border-t border-purple-200 text-center">
              <div className="text-[10px] font-bold text-slate-700 tracking-wider uppercase mb-1">
                HOSTEL AMENITIES INCLUDED:
              </div>
              <p className="text-[11px] text-slate-600">
                CCTV Security | High-Speed Wi-Fi | Washing Machine | Elevator/Lift | Refrigerator & In-room Freezer
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Note: This is an official digital receipt for {config.name}. For queries contact {config.phone1} / {config.phone2}.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Official digital receipt formatted for {config.name}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PaymentRecord, HostelConfig } from '../types';
import { Mail, Check, Copy, ExternalLink, X, Send } from 'lucide-react';
import { StorageService } from '../services/storage';

interface EmailReceiptModalProps {
  payment: PaymentRecord;
  config: HostelConfig;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmailReceiptModal: React.FC<EmailReceiptModalProps> = ({
  payment,
  config,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(
    payment.residentEmail || ''
  );
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const subject = `Fee Payment Receipt #${payment.receiptNumber} - ${config.name}`;
  
  const bodyText = `Dear ${payment.residentName},

Greetings from ${config.name}!

Here are the official details for your hostel fee payment:

---------------------------------------------------
OFFICIAL PAYMENT RECEIPT: #${payment.receiptNumber}
Date: ${payment.paymentDate}
Hostel: ${config.name}
Address: ${config.address}
Owner Contact: ${config.phone1} / ${config.phone2}
---------------------------------------------------
RESIDENT INFORMATION:
Resident Name: ${payment.residentName}
Room Number: ${payment.roomNumber}
Payment Mode: ${payment.paymentMode}

FINANCIAL BREAKDOWN:
• Monthly Room Rent: INR ${payment.monthlyRent.toLocaleString('en-IN')}
• Advance / Security Deposit: INR ${(payment.advanceDeposit || 0).toLocaleString('en-IN')}
• Total Invoiced Amount: INR ${payment.totalInvoiced.toLocaleString('en-IN')}
• Amount Received: INR ${payment.amountReceived.toLocaleString('en-IN')}
• Outstanding Balance: INR ${payment.outstandingBalance.toLocaleString('en-IN')}
• Status: ${payment.paymentStatus.toUpperCase()}

AMENITIES INCLUDED:
CCTV Security | High-Speed Wi-Fi | Washing Machine | Elevator/Lift | Refrigerator & In-room Freezer

Authorized Signatory:
${config.ownerName}
Owner / Management, ${config.name}
---------------------------------------------------
This is an official digital receipt. Thank you for prompt payment!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendMailto = () => {
    setIsSending(true);
    const mailtoUrl = `mailto:${encodeURIComponent(
      recipientEmail
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyText
    )}`;
    window.location.href = mailtoUrl;

    // Record receipt as sent in the storage
    StorageService.markReceiptSent(payment.hostelId, payment.id);
    setTimeout(() => {
      setIsSending(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-base">Send Receipt to Resident Mail</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Resident Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. resident@gmail.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Receipt will be dispatched for {payment.residentName} (Room {payment.roomNumber})
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Official Receipt Email Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-800 font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {bodyText}
            </div>
          </div>

          {payment.receiptSentAt && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Previously dispatched on{' '}
                {new Date(payment.receiptSentAt).toLocaleDateString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendMailto}
            disabled={isSending || !recipientEmail}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#4a0e4e] hover:bg-[#380b3b] text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Email Receipt Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import { CreditCard, User, DollarSign, FileText, Hash } from 'lucide-react';
import type { PaymentDetails } from '../../api/types';

interface PaymentSummaryCardProps {
  details: PaymentDetails;
}

export default function PaymentSummaryCard({ details }: PaymentSummaryCardProps) {
  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" />
        Payment Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {details.payment_type && (
          <DetailItem icon={Hash} label="Type" value={details.payment_type} />
        )}
        {details.payee_name && (
          <DetailItem icon={User} label="Recipient" value={details.payee_name} />
        )}
        {details.payee_vpa && (
          <DetailItem icon={User} label="VPA" value={details.payee_vpa} mono />
        )}
        {details.amount && (
          <DetailItem icon={DollarSign} label="Amount" value={`${details.amount} ${details.currency || ''}`} />
        )}
        {details.note && (
          <DetailItem icon={FileText} label="Note" value={details.note} />
        )}
        {details.merchant_code && details.merchant_code !== '0000' && (
          <DetailItem icon={Hash} label="Merchant Code" value={details.merchant_code} mono />
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, mono = false }: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm text-gray-300 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

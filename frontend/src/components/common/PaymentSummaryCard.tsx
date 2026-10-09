import { CreditCard, User, DollarSign, FileText, Hash } from 'lucide-react';
import type { PaymentDetails } from '../../api/types';

interface PaymentSummaryCardProps {
  details: PaymentDetails;
}

export default function PaymentSummaryCard({ details }: PaymentSummaryCardProps) {
  return (
    <div className="glass-card rounded-2xl border border-white/20 p-5">
      <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        Payment Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
      <Icon className="w-4 h-4 text-cyan mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-sm text-gray-100 font-semibold ${mono ? 'font-mono text-cyan' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

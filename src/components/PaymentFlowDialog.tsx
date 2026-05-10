import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PaymentFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: 'moonpay' | 'paysh';
  externalUrl: string;
  amountLabel?: string;
  reason?: string;
}

const providerMeta = {
  moonpay: {
    title: 'Moonpay On-Ramp',
    eyebrow: 'Wallet funding',
    accent: 'text-cyan',
    buttonClass: 'bg-cyan text-black hover:bg-cyan/90',
    steps: ['Choose amount', 'Confirm wallet destination', 'Top up for the next escrow flow'],
  },
  paysh: {
    title: 'Pay.sh Escrow',
    eyebrow: 'Payment handoff',
    accent: 'text-purple',
    buttonClass: 'bg-gradient-primary text-white hover:opacity-90',
    steps: ['Review milestone terms', 'Launch checkout or escrow', 'Mark the workflow demo-ready'],
  },
} as const;

const PaymentFlowDialog = ({
  open,
  onOpenChange,
  provider,
  externalUrl,
  amountLabel,
  reason,
}: PaymentFlowDialogProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const meta = providerMeta[provider];

  const summary = useMemo(
    () => amountLabel || (provider === 'moonpay' ? 'Flexible top-up amount' : 'Milestone escrow ready'),
    [amountLabel, provider],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setIsConfirmed(false);
        }
      }}
    >
      <DialogContent className="max-w-xl rounded-none border-border bg-[#050505] p-0 text-foreground">
        <div className="border-b border-border bg-surface-1 p-6">
          <DialogHeader>
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${meta.accent}`}>
              {meta.eyebrow}
            </p>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {meta.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {reason || 'This flow is configured for a polished demo experience and can hand off to the live provider in a new tab.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-border bg-surface-1 p-4">
              <Wallet className={`mb-3 h-4 w-4 ${meta.accent}`} />
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Amount
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">{summary}</div>
            </div>
            <div className="border border-border bg-surface-1 p-4">
              <ShieldCheck className={`mb-3 h-4 w-4 ${meta.accent}`} />
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Mode
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">Demo-safe handoff</div>
            </div>
            <div className="border border-border bg-surface-1 p-4">
              <CreditCard className={`mb-3 h-4 w-4 ${meta.accent}`} />
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Result
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {provider === 'moonpay' ? 'Wallet top-up path' : 'Escrow launch path'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {meta.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 border border-border bg-surface-1 px-4 py-3 text-sm"
              >
                <span className="flex h-6 w-6 items-center justify-center border border-border text-[10px] font-black">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {isConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              Payment flow marked ready for demo narration.
            </motion.div>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-surface-1 p-6">
          <Button
            type="button"
            variant="outline"
            className="rounded-none border-border"
            onClick={() => setIsConfirmed(true)}
          >
            Mark Ready
          </Button>
          <Button
            type="button"
            className={`rounded-none ${meta.buttonClass}`}
            onClick={() => window.open(externalUrl, '_blank', 'noopener,noreferrer')}
          >
            Launch Provider
            <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentFlowDialog;

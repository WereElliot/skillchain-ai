import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Coins,
  Briefcase,
  Star,
  Copy,
  Check,
  Award,
  TrendingUp,
  CreditCard,
  Zap,
} from 'lucide-react';
import { mockProfile } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/lib/auth';
import { appConfig } from '@/lib/config';
import { getPrivyWalletAddress } from '@/lib/privy';
import PaymentFlowDialog from '@/components/PaymentFlowDialog';

const reputationHistory = [
  { job: 'DEX Frontend Build', score: '+5', date: 'Apr 2026', status: 'completed' },
  { job: 'NFT Marketplace Audit', score: '+8', date: 'Mar 2026', status: 'completed' },
  { job: 'Token Launch Dashboard', score: '+4', date: 'Feb 2026', status: 'completed' },
  { job: 'DeFi Analytics API', score: '+6', date: 'Jan 2026', status: 'completed' },
];

const ProfilePage = () => {
  const { authenticated, user, mode } = useAppAuth();
  const [copied, setCopied] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<null | 'moonpay' | 'paysh'>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reputation' | 'history'>(
    'overview'
  );

  const walletAddress = getPrivyWalletAddress(user as never);
  const address = walletAddress || mockProfile.address;
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : mockProfile.address;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 bg-[#050505]">
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-1 border border-border rounded-none p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <User className="h-32 w-32" />
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-8 relative z-10">
            <div className="relative">
              <div className="h-24 w-24 flex items-center justify-center bg-gradient-primary rounded-none shadow-glow-purple">
                <User className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-6 w-6 flex items-center justify-center bg-emerald-500 rounded-none border-2 border-[#050505]">
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                  {authenticated ? (user?.email?.address?.split('@')[0] || 'User') : mockProfile.name}
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-purple/10 border border-purple/20 text-purple">
                  {mockProfile.level}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-cyan/10 border border-cyan/20 text-cyan">
                  {mode === 'privy' ? 'Privy' : 'Demo Auth'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground font-mono transition-colors"
                >
                  {shortAddress}
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                {authenticated && (
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Agent
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mb-6 font-medium">
                {mockProfile.bio}
              </p>

              <div className="flex flex-wrap gap-6">
                {[
                  {
                    icon: Star,
                    label: 'REP',
                    value: `${mockProfile.reputation}/100`,
                    color: 'text-purple',
                  },
                  {
                    icon: Briefcase,
                    label: 'GIGS',
                    value: mockProfile.completedJobs.toString(),
                    color: 'text-cyan',
                  },
                  {
                    icon: Coins,
                    label: 'USDC',
                    value: mockProfile.earnings,
                    color: 'text-emerald-400',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}:</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 sm:flex-col w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="rounded-none border-border h-10 px-4 text-[10px] font-black uppercase tracking-widest gap-2"
                onClick={() => setPaymentDialog('moonpay')}
              >
                <CreditCard className="h-3.5 w-3.5 text-cyan" />
                Buy
              </Button>
              <Button 
                className="rounded-none bg-gradient-primary text-white h-10 px-4 text-[10px] font-black uppercase tracking-widest gap-2 shadow-glow-purple"
                onClick={() => setPaymentDialog('paysh')}
              >
                <Zap className="h-3.5 w-3.5" />
                Pay.sh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-1 border border-border rounded-none p-6 mb-8"
        >
          <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-4">
            Skill Set
          </h2>
          <div className="flex flex-wrap gap-2">
            {mockProfile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-surface-2 border border-border rounded-none text-muted-foreground hover:text-foreground hover:border-purple/30 transition-colors cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-1 mb-8 border-b border-border">
            {(['overview', 'reputation', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  activeTab === tab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="profile-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Reputation Score',
                  value: `${mockProfile.reputation}/100`,
                  subtitle: 'Top 6% Global Rank',
                  color: 'text-purple',
                },
                {
                  icon: Award,
                  title: 'Success Rate',
                  value: '98%',
                  subtitle: '46 Gigs Completed',
                  color: 'text-cyan',
                },
                {
                  icon: TrendingUp,
                  title: 'Response Time',
                  value: '< 2H',
                  subtitle: 'High Activity Tier',
                  color: 'text-emerald-400',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className={`p-6 bg-surface-1 border border-border rounded-none relative group hover:border-purple/30 transition-colors`}
                >
                  <card.icon className={`h-6 w-6 ${card.color} mb-4`} />
                  <div className="text-3xl font-black text-foreground mb-1 font-mono uppercase tracking-tighter">
                    {card.value}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1">
                    {card.title}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{card.subtitle}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-4">
              <div className="bg-surface-1 border border-border rounded-none p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    On-Chain Identity Trust
                  </span>
                  <span className="text-xl font-black text-purple font-mono uppercase tracking-tighter">
                    {mockProfile.reputation}%
                  </span>
                </div>
                <div className="h-1 bg-surface-2 rounded-none overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${mockProfile.reputation}%` }}
                    transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-primary"
                  />
                </div>
              </div>

              <div className="bg-surface-1 border border-border rounded-none p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground mb-4">
                  Recent Ledger Entries
                </h3>
                <div className="space-y-1">
                  {reputationHistory.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-tight text-foreground">
                          {item.job}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{item.date}</div>
                      </div>
                      <span className="text-[11px] font-black font-mono text-emerald-400">
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {reputationHistory.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-surface-1 border border-border rounded-none p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center bg-surface-2 border border-border rounded-none">
                      <Briefcase className="h-4 w-4 text-purple" />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight text-foreground">{item.job}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{item.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black font-mono text-emerald-400">
                      {item.score}
                    </span>
                    <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-none">
                      {item.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <PaymentFlowDialog
        open={paymentDialog === 'moonpay'}
        onOpenChange={(open) => !open && setPaymentDialog(null)}
        provider="moonpay"
        externalUrl={appConfig.moonpayUrl}
        amountLabel="Top up for agent applications"
        reason="Prepare a wallet balance for proposal fees or escrow funding."
      />
      <PaymentFlowDialog
        open={paymentDialog === 'paysh'}
        onOpenChange={(open) => !open && setPaymentDialog(null)}
        provider="paysh"
        externalUrl={appConfig.payShUrl}
        amountLabel="Escrow milestone flow"
        reason="Launch the payment handoff for milestone escrow and checkout."
      />
    </div>
  );
};

export default ProfilePage;

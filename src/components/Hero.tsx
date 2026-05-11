import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Coins, Brain, Zap, Wallet, CreditCard, Bot, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppAuth } from '@/lib/auth';
import { appConfig } from '@/lib/config';
import { toast } from '@/hooks/use-toast';

const stats = [
  { label: 'ACTIVE GIGS', value: '2,400+' },
  { label: 'FREELANCERS', value: '18K+' },
  { label: 'PAID OUT', value: '$4.2M' },
  { label: 'DAOS HIRING', value: '340+' },
];

const features = [
  {
    icon: Brain,
    title: 'AI AGENT MATCHING',
    desc: 'NATURAL LANGUAGE JOB SEARCH POWERED BY INTELLIGENT SKILL ANALYSIS.',
  },
  {
    icon: Shield,
    title: 'ESCROW PAYMENTS',
    desc: 'SMART CONTRACT ESCROW WITH MILESTONE-BASED RELEASES ON SOLANA.',
  },
  {
    icon: Coins,
    title: 'ON-CHAIN REPUTATION',
    desc: 'VERIFIABLE REPUTATION SCORES THAT GROW WITH EVERY COMPLETED GIG.',
  },
  {
    icon: Sparkles,
    title: 'AI PROPOSALS',
    desc: 'ONE-CLICK APPLY WITH AI-GENERATED PROPOSALS TAILORED TO EACH JOB.',
  },
];

const Hero = () => {
  const [query, setQuery] = useState('');
  const { authenticated, login, mode } = useAppAuth();
  const agentHref = query.trim()
    ? `/agent?prompt=${encodeURIComponent(query.trim())}`
    : '/agent';

  const handleLogin = async () => {
    const result = await login();
    if (result.ok) return;

    toast({
      title: 'Login unavailable',
      description: result.error || 'Authentication could not be started right now.',
    });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#050505] pt-16">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute top-0 left-1/2 h-full w-full -translate-x-1/2 bg-gradient-radial from-purple/10 to-transparent opacity-40 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-2.5 border border-border bg-surface-1 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground shadow-glow-purple/5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Autonomous Economy / Live on Devnet
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-8 max-w-5xl text-center"
        >
          <h1 className="text-5xl font-black uppercase italic leading-[0.9] tracking-tighter sm:text-7xl lg:text-9xl">
            Next-Gen
            <br />
            <span className="text-gradient drop-shadow-glow-purple">Talent Agent</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mb-12 max-w-xl text-center text-sm font-bold uppercase leading-relaxed tracking-widest text-muted-foreground opacity-60 sm:text-base"
        >
          Connect your wallet. Describe your project. Let Agent 01 execute the rest.
          Escrow secured. Reputation verified.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mb-24 max-w-2xl"
        >
          <div className="group relative">
            <div className="absolute -inset-[2px] rounded-none bg-gradient-primary opacity-20 transition-opacity duration-500 group-focus-within:opacity-100" />
            <div className="relative flex h-14 items-center overflow-hidden border border-border bg-surface-1 px-2">
              <Zap className="ml-4 h-4 w-4 flex-shrink-0 text-purple" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='QUERY: "SOLANA FRONTEND GIGS..."'
                className="flex-1 bg-transparent px-4 py-3 text-xs font-bold uppercase text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
              />
              <Link
                to={agentHref}
                className="flex items-center gap-2 rounded-none bg-gradient-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-glow-purple transition-all hover:opacity-90 active:scale-95"
              >
                EXECUTE
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-auto mb-20 grid max-w-5xl gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"
        >
          <div className="border border-border bg-surface-1 p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-purple">
              <Sparkles className="h-3.5 w-3.5" />
              Onboarding Flow
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
              Start In Three Smooth Moves
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Wallet, title: authenticated ? 'Wallet Ready' : 'Connect', copy: authenticated ? 'Your profile is ready to work.' : 'Sign in and unlock the hiring flow.' },
                { icon: CreditCard, title: 'Fund', copy: 'Open Moonpay instantly for top-up and escrow prep.' },
                { icon: Bot, title: 'Ask', copy: 'Describe a role or skill and let Agent 01 shortlist the best matches.' },
              ].map((step, index) => (
                <div key={step.title} className="border border-border bg-surface-2 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <step.icon className="h-4 w-4 text-cyan" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                    {step.title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {step.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogin()}
            className="flex flex-col items-start justify-between border border-border bg-surface-1 p-6 text-left transition-colors hover:border-purple/40"
          >
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-border bg-surface-2">
                {mode === 'supabase' ? (
                  <Github className="h-4 w-4 text-purple" />
                ) : (
                  <Wallet className="h-4 w-4 text-purple" />
                )}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Welcome
              </div>
              <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-foreground">
                {authenticated ? 'Account Connected' : mode === 'supabase' ? 'Login With GitHub' : 'Connect Wallet'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {authenticated
                  ? 'Your onboarding is complete. Jump straight into matching, proposals, and escrow flows.'
                  : 'Enter the marketplace with one clean step and unlock a guided hiring journey.'}
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple">
              {authenticated ? 'Ready to use' : 'Start onboarding'}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>

          <a
            href={appConfig.moonpayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-start justify-between border border-cyan/20 bg-cyan/10 p-6 text-left transition-colors hover:bg-cyan/15"
          >
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-cyan/20 bg-black/20">
                <CreditCard className="h-4 w-4 text-cyan" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan">
                Easy Access
              </div>
              <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-foreground">
                Open Moonpay
              </h3>
              <p className="mt-2 text-sm text-cyan/80">
                Top up quickly before proposals, escrow funding, or wallet-based job acceptance.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan">
              Launch on-ramp
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-32 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative border border-border bg-surface-1 px-4 py-6 text-center transition-colors hover:border-purple/30"
            >
              <div className="font-mono text-2xl font-black uppercase tracking-tighter text-white sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto max-w-6xl pb-32"
        >
          <div className="mb-16 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-border" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple">
              System Capabilities
            </h2>
            <div className="h-px w-12 bg-border" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group border border-border bg-surface-1 p-8 transition-all duration-300 hover:border-purple/40 hover:shadow-glow-purple/5"
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center border border-border bg-surface-2 transition-colors group-hover:border-purple/50">
                  <feature.icon className="h-5 w-5 text-purple" />
                </div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-foreground">
                  {feature.title}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

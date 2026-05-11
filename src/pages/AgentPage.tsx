import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  ArrowRight,
  Copy,
  Check,
  Wallet,
  CreditCard,
  Zap,
  Loader2,
  ShieldCheck,
  BrainCircuit,
  Mic,
  Github,
  Trophy,
} from 'lucide-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSearchParams } from 'react-router-dom';
import ElevenVoiceAgent from '@/components/ElevenVoiceAgent';
import PaymentFlowDialog from '@/components/PaymentFlowDialog';
import JobCard from '@/components/JobCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { appConfig, demoMode } from '@/lib/config';
import {
  buildDemoOutcome,
  getApplication,
  getJobsWithApplications,
  upsertApplication,
} from '@/lib/applications';
import {
  streamAgentResponse,
  type AgentAction,
  type AgentChatMessage,
  type AgentDonePayload,
} from '@/lib/agent';
import { useAppAuth } from '@/lib/auth';
import { mockJobs, mockProfile, type Job } from '@/lib/mockData';
import { getPrivyWalletAddress } from '@/lib/privy';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  jobs?: Job[];
  proposal?: string;
  actions?: AgentAction[];
  highlights?: string[];
}

const defaultSuggestedQueries = [
  'Find high-paying frontend gigs on Solana',
  'Check my wallet balance and suggest top-up options',
  'Generate a premium proposal for a Rust audit role',
  'Map the apply to escrow flow for my next gig',
];

const AgentPage = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(searchParams.get('prompt') || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolActivity, setToolActivity] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [autoPromptSent, setAutoPromptSent] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{
    provider: 'moonpay' | 'paysh';
    reason?: string;
    amountLabel?: string;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const applicationTimeoutsRef = useRef<number[]>([]);
  const [applicationVersion, setApplicationVersion] = useState(0);
  void applicationVersion;

  const { authenticated, user, login, mode } = useAppAuth();
  const walletAddress = getPrivyWalletAddress(user as never);
  const jobsWithApplications = getJobsWithApplications(mockJobs);
  const applyMode = searchParams.get('mode') === 'apply';

  const selectedJob = useMemo(() => {
    const jobId = searchParams.get('jobId');
    return jobsWithApplications.find((job) => job.id === jobId);
  }, [jobsWithApplications, searchParams]);

  const suggestedQueries = selectedJob
    ? [
        `Generate a winning proposal for ${selectedJob.title}`,
        `Why am I a fit for ${selectedJob.company}'s ${selectedJob.title} role?`,
        `Prepare my apply to escrow flow for ${selectedJob.title}`,
        'Check my wallet balance before I apply',
      ]
    : defaultSuggestedQueries;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolActivity]);

  useEffect(() => {
    const timeoutIds = applicationTimeoutsRef.current;
    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const getTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return null;

    try {
      const connection = new Connection(appConfig.solanaRpcUrl);
      const pubKey = new PublicKey(walletAddress);
      const lamports = await connection.getBalance(pubKey);
      const nextBalance = lamports / LAMPORTS_PER_SOL;
      setBalance(nextBalance);
      return nextBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }, [walletAddress]);

  const updateAssistantMessage = useCallback((
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage,
  ) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === messageId ? updater(message) : message)),
    );
  }, []);

  const refreshApplications = useCallback(() => {
    setApplicationVersion((value) => value + 1);
  }, []);

  const decorateJobs = useCallback((jobs?: Job[]) => {
    if (!jobs?.length) return jobs;
    const currentJobs = getJobsWithApplications(jobs);
    return currentJobs;
  }, []);

  const appendSystemAssistantMessage = useCallback((content: string, jobs?: Job[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-system-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: getTimestamp(),
        jobs: decorateJobs(jobs),
      },
    ]);
  }, [decorateJobs]);

  const appendDonePayload = useCallback((messageId: string, payload: AgentDonePayload) => {
    updateAssistantMessage(messageId, (message) => ({
      ...message,
      content: message.content.trim() || 'Workflow prepared. Review the recommended next steps below.',
      jobs: payload.jobs?.length ? decorateJobs(payload.jobs) : decorateJobs(message.jobs),
      proposal: payload.proposal || message.proposal,
      actions: payload.actions?.length ? payload.actions : message.actions,
      highlights: payload.highlights?.length ? payload.highlights : message.highlights,
    }));
    if (applyMode && payload.jobs?.[0]) {
      upsertApplication(payload.jobs[0].id, 'draft', {
        proposal: payload.proposal,
        job: payload.jobs[0],
      });
      refreshApplications();
    }
  }, [applyMode, decorateJobs, refreshApplications, updateAssistantMessage]);

  const runAction = async (action: AgentAction) => {
    if (action.type === 'open_url' && action.href) {
      if (action.intent === 'moonpay' || action.intent === 'paysh') {
        setPaymentDialog({
          provider: action.intent,
          reason:
            action.intent === 'moonpay'
              ? 'Top up the wallet before applications or escrow funding.'
              : 'Review and launch the escrow or checkout handoff.',
          amountLabel:
            action.intent === 'moonpay' ? 'Wallet top-up path' : 'Escrow milestone flow',
        });
        return;
      }

      window.open(action.href, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.type === 'refresh_balance') {
      const nextBalance = await fetchBalance();
      toast({
        title: 'Wallet refreshed',
        description:
          nextBalance !== null
            ? `Current balance: ${nextBalance.toFixed(4)} SOL`
            : 'Unable to refresh balance right now.',
      });
      return;
    }

    if (action.type === 'suggest_prompt' && action.prompt) {
      setInput(action.prompt);
    }
  };

  const finalizeHire = useCallback((job: Job, proposal?: string) => {
    upsertApplication(job.id, 'hired', { proposal, job });
    refreshApplications();
    appendSystemAssistantMessage(
      `${job.company} approved the application and moved the role into kickoff. You're hired for ${job.title}, and the next step is opening Pay.sh to confirm the escrow milestones.`,
      [job],
    );
    toast({
      title: 'You got the role',
      description: `${job.company} accepted your proposal and the gig is ready for escrow kickoff.`,
    });
  }, [appendSystemAssistantMessage, refreshApplications]);

  const submitApplication = useCallback((job: Job, proposal?: string) => {
    const existingApplication = getApplication(job.id);
    if (existingApplication?.status === 'hired') {
      toast({
        title: 'Role already won',
        description: `You're already marked as hired for ${job.title}.`,
      });
      return;
    }

    upsertApplication(job.id, 'submitted', { proposal, job });
    refreshApplications();
    appendSystemAssistantMessage(
      `Application submitted to ${job.company}. The proposal, delivery timeline, and milestone plan are now attached to your profile.`,
      [job],
    );
    toast({
      title: 'Application submitted',
      description: `Your proposal for ${job.title} is now in ${job.company}'s queue.`,
    });

    const firstOutcome = buildDemoOutcome(job);
    const progressTimeout = window.setTimeout(() => {
      upsertApplication(job.id, firstOutcome, { proposal, job });
      refreshApplications();

      if (firstOutcome === 'hired') {
        finalizeHire(job, proposal);
        return;
      }

      appendSystemAssistantMessage(
        firstOutcome === 'interviewing'
          ? `${job.company} moved you into final review for ${job.title}. The profile fit and proposal quality both scored highly.`
          : `${job.company} shortlisted your application and requested a rapid follow-up. Your fit score is keeping you near the top of the stack.`,
        [job],
      );

      const hireTimeout = window.setTimeout(() => {
        finalizeHire(job, proposal);
      }, 1400);

      applicationTimeoutsRef.current.push(hireTimeout);
    }, 1100);

    applicationTimeoutsRef.current.push(progressTimeout);
  }, [appendSystemAssistantMessage, finalizeHire, refreshApplications]);

  const sendMessage = useCallback(async (rawInput?: string) => {
    const prompt = (rawInput ?? input).trim();
    if (!prompt || isStreaming) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: getTimestamp(),
    };

    const assistantMessageId = `assistant-${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: getTimestamp(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsStreaming(true);
    setToolActivity([]);

    try {
      const latestBalance = walletAddress ? await fetchBalance() : balance;
      const payloadMessages: AgentChatMessage[] = nextMessages.map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      }));

      await streamAgentResponse({
        messages: payloadMessages,
        context: {
          jobs: jobsWithApplications,
          profile: mockProfile,
          wallet: {
            authenticated,
            address: walletAddress,
            balance: latestBalance,
            network: appConfig.networkLabel,
          },
          integrations: {
            moonpayUrl: appConfig.moonpayUrl,
            payShUrl: appConfig.payShUrl,
          },
        },
        signal: controller.signal,
        onEvent: (type, payload) => {
          if (type === 'assistant_delta') {
            updateAssistantMessage(assistantMessageId, (message) => ({
              ...message,
              content: `${message.content}${payload.delta}`,
            }));
          }

          if (type === 'tool_call') {
            setToolActivity((prev) => [...prev, `Running ${payload.name.replaceAll('_', ' ')}...`]);
          }

          if (type === 'tool_result') {
            setToolActivity((prev) => [...prev, payload.summary]);
          }

          if (type === 'done') {
            appendDonePayload(assistantMessageId, payload);
          }

          if (type === 'error') {
            updateAssistantMessage(assistantMessageId, (message) => ({
              ...message,
              content:
                message.content ||
                'The live agent paused mid-workflow. Switching to a stable local response path.',
            }));
          }
        },
      });
    } catch {
      updateAssistantMessage(assistantMessageId, (assistantMessageState) => ({
        ...assistantMessageState,
        content: demoMode.agent
          ? 'The assistant is temporarily unavailable. Please try again in a moment.'
          : 'The live agent is unavailable right now, so we switched to a local demo workflow.',
      }));

      toast({
        title: 'Agent switched modes',
        description: demoMode.agent
          ? 'The assistant could not complete that request just now.'
          : 'Live AI is unavailable, so a local demo workflow was used instead.',
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [appendDonePayload, authenticated, balance, fetchBalance, input, isStreaming, jobsWithApplications, messages, updateAssistantMessage, walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      void fetchBalance();
    }
  }, [fetchBalance, walletAddress]);

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !autoPromptSent) {
      setAutoPromptSent(true);
      void sendMessage(prompt);
    }
  }, [autoPromptSent, searchParams, sendMessage]);

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoiceMessage = async (voiceText: string) => {
    await sendMessage(voiceText);
  };

  const handleAuthPrompt = async () => {
    const result = await login();

    if (!result.ok) {
      toast({
        title: 'Login unavailable',
        description: result.error || 'Authentication could not be started right now.',
      });
    }
  };

  return (
    <div className="noise-overlay flex min-h-screen flex-col bg-[#050505] pt-16">
      <div className="container mx-auto flex max-w-5xl flex-1 flex-col px-4 lg:px-8">
        <div className="border-b border-border py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-gradient-primary shadow-glow-purple">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-foreground">
                  Agent <span className="text-purple">01</span>
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {demoMode.agent
                      ? 'Demo intelligence / wallet-aware / talent matching'
                      : 'Streaming orchestration / wallet-aware / talent matching'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="border border-border bg-surface-1 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <BrainCircuit className="h-3.5 w-3.5 text-purple" />
                  Agent State
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {isStreaming
                    ? demoMode.agent
                      ? 'Thinking in demo mode...'
                      : 'Thinking live...'
                    : 'Ready for the next workflow'}
                </div>
              </div>
              <div className="border border-border bg-surface-1 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 text-cyan" />
                  Wallet
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {authenticated
                    ? `${balance?.toFixed(4) ?? '...'} SOL on ${appConfig.networkLabel}`
                    : 'Sign in to enable balance-aware flows'}
                </div>
              </div>
              <div className="border border-border bg-surface-1 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Demo Flow
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {'Agent -> Apply -> Escrow -> Reputation'}
                </div>
              </div>
            </div>
          </div>

          {selectedJob && (
            <div className="mt-6 border border-purple/20 bg-purple/5 p-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-purple">
                Active Job Context
              </div>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black uppercase tracking-tight text-foreground">
                    {selectedJob.title}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {selectedJob.company} / {selectedJob.budget}
                  </div>
                  {selectedJob.applicationStatus ? (
                    <div className="mt-2 inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
                      <Trophy className="h-3 w-3" />
                      {selectedJob.applicationStatus}
                    </div>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-purple/20 bg-transparent text-[10px] font-black uppercase"
                  onClick={() => {
                    const existingApplication = getApplication(selectedJob.id);
                    if (existingApplication?.proposal) {
                      submitApplication(selectedJob, existingApplication.proposal);
                      return;
                    }
                    setInput(`Generate a premium proposal for ${selectedJob.title} at ${selectedJob.company}`);
                  }}
                >
                  {selectedJob.applicationStatus ? 'Advance Application' : 'Load Proposal Prompt'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ElevenVoiceAgent onMessageReceived={handleVoiceMessage} />
              <div className="mt-8 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void handleAuthPrompt()}
                  className="border border-border bg-surface-1 p-4 text-left transition-colors hover:border-purple/40"
                >
                  <div className="mb-3 flex items-center justify-between">
                    {mode === 'supabase' ? (
                      <Github className="h-4 w-4 text-purple" />
                    ) : (
                      <Wallet className="h-4 w-4 text-purple" />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Step 01
                    </span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                    {authenticated ? 'Account Ready' : 'Sign In First'}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {authenticated
                      ? 'Your profile is ready for wallet-aware matching and proposal generation.'
                      : mode === 'supabase'
                        ? 'Continue with GitHub for the smoothest onboarding path.'
                        : 'Connect now to unlock balance-aware workflows.'}
                  </p>
                </button>

                <a
                  href={appConfig.moonpayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-cyan/20 bg-cyan/10 p-4 text-left transition-colors hover:bg-cyan/15"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <CreditCard className="h-4 w-4 text-cyan" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan">
                      Step 02
                    </span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                    Open Moonpay
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-cyan/85">
                    Top up quickly before applications, escrow funding, or milestone narration.
                  </p>
                </a>

                <button
                  type="button"
                  onClick={() => setInput('Find the best high-confidence Solana frontend jobs and draft the strongest proposal.')}
                  className="border border-border bg-surface-1 p-4 text-left transition-colors hover:border-purple/40"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Mic className="h-4 w-4 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Step 03
                    </span>
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-foreground">
                    Start With Voice
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Tap the microphone or preload a high-value prompt to jump straight into matches.
                  </p>
                </button>
              </div>
              <h2 className="mb-4 mt-8 text-lg font-black uppercase tracking-widest text-foreground">
                Initialize Workflow
              </h2>
              <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
                Ask for job discovery, proposal generation, wallet checks, or a full pay-to-escrow
                plan. The agent will stream a polished response and use live or demo marketplace
                tools behind the scenes.
              </p>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {suggestedQueries.map((query) => (
                  <button
                    key={query}
                    onClick={() => setInput(query)}
                    className="group flex items-center justify-between border border-border bg-surface-1 px-4 py-3 text-left transition-all hover:border-purple/40"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground">
                      {query}
                    </span>
                    <ArrowRight className="h-3 w-3 text-purple opacity-0 transition-all group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mb-6 flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center border border-border bg-surface-2">
                    <Bot className="h-4 w-4 text-purple" />
                  </div>
                )}

                <div className={`max-w-[88%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`border px-5 py-4 text-sm font-medium leading-relaxed ${
                      message.role === 'user'
                        ? 'border-purple/20 bg-purple/5 text-foreground'
                        : 'border-border bg-surface-1 text-foreground'
                    }`}
                  >
                    {message.content || (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Streaming response...
                      </div>
                    )}
                  </div>

                  {message.highlights?.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {message.highlights.map((highlight) => (
                        <div
                          key={highlight}
                          className="border border-border bg-surface-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          {highlight}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {message.actions?.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {message.actions.map((action) => (
                        <Button
                          key={`${message.id}-${action.label}`}
                          onClick={() => void runAction(action)}
                          variant={action.intent === 'moonpay' ? 'outline' : 'default'}
                          className={`h-11 rounded-none text-[10px] font-black uppercase tracking-widest ${
                            action.intent === 'moonpay'
                              ? 'border-cyan/20 bg-cyan/10 text-cyan hover:bg-cyan/15'
                              : 'bg-gradient-primary text-primary-foreground shadow-glow-purple'
                          }`}
                        >
                          {action.intent === 'moonpay' ? (
                            <CreditCard className="mr-2 h-3.5 w-3.5" />
                          ) : (
                            <Zap className="mr-2 h-3.5 w-3.5" />
                          )}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}

                  {message.proposal && (
                    <div className="group relative mt-4 border border-border bg-surface-2 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan">
                          Proposal Draft
                        </span>
                        <button
                          onClick={() => handleCopy(message.proposal!, message.id)}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs leading-loose text-muted-foreground font-mono">
                        {message.proposal}
                      </pre>
                      {message.jobs?.[0] ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            onClick={() => submitApplication(message.jobs![0], message.proposal)}
                            className="h-10 rounded-none bg-gradient-primary px-4 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-glow-purple"
                          >
                            Submit Application
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setInput(`Refine my proposal for ${message.jobs![0].title} and make it more technical.`)
                            }
                            className="h-10 rounded-none border-cyan/20 bg-transparent px-4 text-[10px] font-black uppercase tracking-widest text-cyan"
                          >
                            Refine Draft
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {message.jobs?.length ? (
                    <div className="mt-4 space-y-3">
                      {decorateJobs(message.jobs)?.map((job, index) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          index={index}
                          compact
                          actionLabel={
                            job.applicationStatus
                              ? job.applicationStatus === 'hired'
                                ? 'Role Won'
                                : 'Continue Application'
                              : 'Generate Proposal'
                          }
                          onAction={(selectedJobCard) => {
                            const existingApplication = getApplication(selectedJobCard.id);
                            if (existingApplication?.proposal) {
                              submitApplication(selectedJobCard, existingApplication.proposal);
                              return;
                            }
                            void sendMessage(`Generate a premium proposal for ${selectedJobCard.title} at ${selectedJobCard.company}`);
                          }}
                        />
                      ))}
                    </div>
                  ) : null}

                  <span className="mt-2 block text-[9px] font-mono uppercase opacity-50 text-muted-foreground">
                    [{message.timestamp}] / VERIFIED
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center border border-border bg-surface-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {toolActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 border border-border bg-surface-1 p-4"
            >
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-purple">
                Tool Activity
              </div>
              <div className="space-y-2">
                {toolActivity.slice(-4).map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-border pb-8 pt-4">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && void sendMessage()}
                placeholder="EXECUTE WORKFLOW..."
                className="w-full border border-border bg-surface-1 px-5 py-3 text-sm uppercase text-foreground placeholder:text-muted-foreground focus:border-purple/50 focus:outline-none transition-colors font-mono"
              />
            </div>
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="flex h-12 w-12 items-center justify-center bg-gradient-primary text-primary-foreground shadow-glow-purple transition-transform active:scale-95 disabled:opacity-30"
            >
              {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-purple" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                Browser voice assist
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-cyan" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                Pay.sh + Moonpay flow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-emerald-400" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                {demoMode.agent ? 'Local agent fallback active' : 'Live edge agent active'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-amber-400" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                One-click proposal generation
              </span>
            </div>
          </div>
        </div>
      </div>
      <PaymentFlowDialog
        open={paymentDialog?.provider === 'moonpay'}
        onOpenChange={(open) => !open && setPaymentDialog(null)}
        provider="moonpay"
        externalUrl={appConfig.moonpayUrl}
        amountLabel={paymentDialog?.provider === 'moonpay' ? paymentDialog.amountLabel : undefined}
        reason={paymentDialog?.provider === 'moonpay' ? paymentDialog.reason : undefined}
      />
      <PaymentFlowDialog
        open={paymentDialog?.provider === 'paysh'}
        onOpenChange={(open) => !open && setPaymentDialog(null)}
        provider="paysh"
        externalUrl={appConfig.payShUrl}
        amountLabel={paymentDialog?.provider === 'paysh' ? paymentDialog.amountLabel : undefined}
        reason={paymentDialog?.provider === 'paysh' ? paymentDialog.reason : undefined}
      />
    </div>
  );
};

export default AgentPage;

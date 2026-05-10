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
  Sparkles,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSearchParams } from 'react-router-dom';
import ElevenVoiceAgent from '@/components/ElevenVoiceAgent';
import PaymentFlowDialog from '@/components/PaymentFlowDialog';
import JobCard from '@/components/JobCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { appConfig, demoMode, integrationWarnings } from '@/lib/config';
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

  const { authenticated, user } = useAppAuth();
  const walletAddress = getPrivyWalletAddress(user as never);

  const selectedJob = useMemo(() => {
    const jobId = searchParams.get('jobId');
    return mockJobs.find((job) => job.id === jobId);
  }, [searchParams]);

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

  const appendDonePayload = useCallback((messageId: string, payload: AgentDonePayload) => {
    updateAssistantMessage(messageId, (message) => ({
      ...message,
      content: message.content.trim() || 'Workflow prepared. Review the recommended next steps below.',
      jobs: payload.jobs?.length ? payload.jobs : message.jobs,
      proposal: payload.proposal || message.proposal,
      actions: payload.actions?.length ? payload.actions : message.actions,
      highlights: payload.highlights?.length ? payload.highlights : message.highlights,
    }));
  }, [updateAssistantMessage]);

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
          jobs: mockJobs,
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
                'The live agent hit an error before it could finish the workflow. Check your Supabase and xAI configuration.',
            }));
          }
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The agent request failed unexpectedly.';

      updateAssistantMessage(assistantMessageId, (assistantMessageState) => ({
        ...assistantMessageState,
        content: demoMode.agent ? `Demo agent unavailable: ${message}` : `Live agent unavailable: ${message}`,
      }));

      toast({
        title: 'Agent request failed',
        description: message,
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [appendDonePayload, authenticated, balance, fetchBalance, input, isStreaming, messages, updateAssistantMessage, walletAddress]);

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
                    : 'Connect Privy to enable balance-aware flows'}
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

          {integrationWarnings.length > 0 && (
            <div className="mt-6 border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Setup Checklist
              </div>
              <div className="space-y-1 text-xs text-amber-100/80">
                {integrationWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          )}

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
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-purple/20 bg-transparent text-[10px] font-black uppercase"
                  onClick={() =>
                    setInput(`Generate a premium proposal for ${selectedJob.title} at ${selectedJob.company}`)
                  }
                >
                  Load Proposal Prompt
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
                    </div>
                  )}

                  {message.jobs?.length ? (
                    <div className="mt-4 space-y-3">
                      {message.jobs.map((job, index) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          index={index}
                          compact
                          actionLabel="Apply with Agent"
                          onAction={(selectedJobCard) =>
                            setInput(`Generate a premium proposal for ${selectedJobCard.title}`)
                          }
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
                {demoMode.voice ? 'Voice demo mode' : 'ElevenLabs voice'}
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

import type {
  AgentAction,
  AgentChatMessage,
  AgentContext,
  AgentDonePayload,
  AgentStreamEventMap,
} from '@/lib/agent';

const STREAM_DELAY_MS = 18;

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function parseBudget(budget: string) {
  const numeric = Number((budget.match(/[\d,.]+/)?.[0] || '0').replaceAll(',', ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function scoreJob(job: AgentContext['jobs'][number], query: string) {
  const haystack = `${job.title} ${job.company} ${job.description} ${job.skills.join(' ')}`.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let score = Math.min(parseBudget(job.budget) / 1000, 8);

  for (const term of terms) {
    if (haystack.includes(term)) score += 3;
  }

  if (job.urgent) score += 1.5;
  if (job.remote) score += 1;
  return score;
}

function getLatestUserPrompt(messages: AgentChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
}

function getBestMatches(context: AgentContext, query: string) {
  return [...context.jobs]
    .map((job) => ({ job, score: scoreJob(job, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ job }) => job);
}

function findReferencedJob(context: AgentContext, prompt: string) {
  const lowered = prompt.toLowerCase();
  return (
    context.jobs.find(
      (job) =>
        lowered.includes(job.title.toLowerCase()) || lowered.includes(job.company.toLowerCase()),
    ) ?? getBestMatches(context, prompt)[0]
  );
}

function buildProposal(context: AgentContext, prompt: string) {
  const job = findReferencedJob(context, prompt);
  if (!job) return { job: undefined, proposal: '' };

  const proposal = [
    `Hello ${job.company} team,`,
    '',
    `I’m excited to apply for the ${job.title} role. ${context.profile.bio}`,
    '',
    'Why I fit this brief:',
    `- ${context.profile.level} builder with ${context.profile.completedJobs}+ completed gigs and a ${context.profile.reputation}/100 on-chain reputation score.`,
    `- Hands-on delivery experience across ${job.skills.slice(0, 4).join(', ')} with polished, production-minded execution.`,
    '- Clear milestone planning, fast communication, and demo-quality shipping discipline from kickoff through escrow closeout.',
    '',
    'I would approach this engagement with a practical build plan, visible progress checkpoints, and a strong final handoff.',
    '',
    'Best,',
    context.profile.name,
  ].join('\n');

  return { job, proposal };
}

function buildHighlights(
  context: AgentContext,
  job: AgentContext['jobs'][number] | undefined,
  reason: string,
) {
  return [
    job ? `Target: ${job.company} / ${job.budget}` : `Wallet network: ${context.wallet.network}`,
    reason,
    context.wallet.authenticated
      ? `Wallet ready: ${context.wallet.address?.slice(0, 4)}...${context.wallet.address?.slice(-4)}`
      : 'Wallet not connected yet',
    'Escrow path: AI proposal -> acceptance -> Pay.sh milestones -> reputation update',
  ];
}

function buildActions(
  context: AgentContext,
  intent: 'jobs' | 'proposal' | 'wallet' | 'payment',
  job?: AgentContext['jobs'][number],
): AgentAction[] {
  const actions: AgentAction[] = [];

  if (intent === 'jobs' && job) {
    actions.push({
      type: 'suggest_prompt',
      label: 'Draft proposal',
      prompt: `Generate a premium proposal for ${job.title} at ${job.company}`,
      intent: 'apply',
    });
  }

  if (intent === 'proposal' && job) {
    actions.push({
      type: 'suggest_prompt',
      label: 'Make it more technical',
      prompt: `Refine my proposal for ${job.title} and make it more technical.`,
      intent: 'apply',
    });
  }

  if (intent === 'wallet' || intent === 'payment') {
    actions.push({
      type: 'refresh_balance',
      label: 'Refresh wallet',
      intent: 'wallet',
    });
    actions.push({
      type: 'open_url',
      label: 'Open Moonpay top-up',
      href: context.integrations.moonpayUrl,
      intent: 'moonpay',
    });
  }

  actions.push({
    type: 'open_url',
    label: 'Open Pay.sh escrow',
    href: context.integrations.payShUrl,
    intent: 'paysh',
  });

  return actions;
}

function createDemoResponse(
  messages: AgentChatMessage[],
  context: AgentContext,
): { text: string; payload: AgentDonePayload; toolSummary: string } {
  const prompt = getLatestUserPrompt(messages);
  const lowered = prompt.toLowerCase();

  if (
    lowered.includes('proposal') ||
    lowered.includes('apply') ||
    lowered.includes('fit for') ||
    lowered.includes('cover letter')
  ) {
    const { job, proposal } = buildProposal(context, prompt);
    return {
      text: job
        ? `I’ve drafted a high-conviction proposal for ${job.title} and mapped the fastest path into escrow. Review the draft, tighten the technical emphasis if needed, then open Pay.sh to package the engagement terms.`
        : 'I prepared a proposal flow and next-step escrow plan based on the current marketplace context.',
      toolSummary: job ? `Generated proposal for ${job.title}.` : 'Generated proposal draft.',
      payload: {
        proposal,
        jobs: job ? [job] : undefined,
        highlights: buildHighlights(context, job, 'Proposal draft prepared'),
        actions: buildActions(context, 'proposal', job),
      },
    };
  }

  if (
    lowered.includes('wallet') ||
    lowered.includes('balance') ||
    lowered.includes('moonpay') ||
    lowered.includes('top up') ||
    lowered.includes('pay.sh') ||
    lowered.includes('escrow')
  ) {
    const job = findReferencedJob(context, prompt);
    return {
      text: context.wallet.authenticated
        ? `Your wallet flow is ready. I’ve paired the current balance context with a clean top-up and escrow path so you can move from funding to acceptance without friction.`
        : `I’ve prepared the funding and escrow flow. Connect a wallet or stay in demo mode, then use Moonpay for top-up and Pay.sh for milestone escrow setup.`,
      toolSummary: 'Prepared wallet-aware payment flow.',
      payload: {
        jobs: job ? [job] : undefined,
        highlights: buildHighlights(context, job, 'Wallet and payment flow prepared'),
        actions: buildActions(context, 'payment', job),
      },
    };
  }

  const jobs = getBestMatches(context, prompt || 'solana gigs');
  const [topJob] = jobs;
  return {
    text: topJob
      ? `I found the strongest matches for your brief, with ${topJob.title} leading the pack. The shortlist below is optimized for budget, urgency, and overlap with your profile, and I’ve included the fastest route to generate a proposal from here.`
      : 'I scanned the marketplace context and prepared the best available matches.',
    toolSummary: `Matched ${jobs.length} job(s) against the current brief.`,
    payload: {
      jobs,
      highlights: buildHighlights(context, topJob, 'Shortlist ranked by budget, urgency, and skill overlap'),
      actions: buildActions(context, 'jobs', topJob),
    },
  };
}

export async function streamDemoAgentResponse({
  messages,
  context,
  signal,
  onEvent,
}: {
  messages: AgentChatMessage[];
  context: AgentContext;
  signal?: AbortSignal;
  onEvent: <T extends keyof AgentStreamEventMap>(
    type: T,
    payload: AgentStreamEventMap[T],
  ) => void;
}) {
  const response = createDemoResponse(messages, context);

  onEvent('tool_call', { name: 'demo_planner' });
  await delay(120, signal);
  onEvent('tool_result', { name: 'demo_planner', summary: response.toolSummary });

  const words = response.text.split(' ');
  let chunk = '';

  for (const word of words) {
    chunk += `${word} `;
    if (chunk.trim().length > 28) {
      onEvent('assistant_delta', { delta: chunk });
      chunk = '';
      await delay(STREAM_DELAY_MS, signal);
    }
  }

  if (chunk.trim()) {
    onEvent('assistant_delta', { delta: chunk });
  }

  await delay(80, signal);
  onEvent('done', response.payload);
}

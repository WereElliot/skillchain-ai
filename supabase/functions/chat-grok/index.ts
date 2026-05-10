import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Job = {
  id: string;
  title: string;
  company: string;
  type: string;
  budget: string;
  skills: string[];
  description: string;
  postedAgo: string;
  applicants: number;
  milestones: number;
  remote: boolean;
  urgent: boolean;
};

type Profile = {
  name: string;
  bio: string;
  level: string;
  reputation: number;
  completedJobs: number;
  skills: string[];
  github: string;
  earnings: string;
};

type AgentContext = {
  jobs: Job[];
  profile: Profile;
  wallet: {
    authenticated: boolean;
    address?: string;
    balance?: number | null;
    network: string;
  };
  integrations: {
    moonpayUrl: string;
    payShUrl: string;
  };
};

type ToolCall = {
  id?: string;
  function: {
    name: string;
    arguments: string;
  };
};

const XAI_API_KEY = Deno.env.get("GROK_API_KEY");
const XAI_MODEL = Deno.env.get("XAI_MODEL") || "grok-3-mini-fast";

const SYSTEM_PROMPT = `
You are SkillChain Agent 01, a premium AI operator for a Solana-native talent marketplace.

Your responsibilities:
- Match users to the best jobs from the provided marketplace context.
- Generate convincing, concise proposals tailored to the selected job.
- Explain the flow from discovery to application to escrow to reputation.
- Be decisive, polished, and hackathon-demo friendly.

Rules:
- Use tools whenever the user asks about jobs, proposals, payments, wallet state, or application flows.
- Reference concrete details from tool results.
- Keep answers crisp, helpful, and action-oriented.
- Never fabricate wallet balances or marketplace data when a tool can provide it.
`;

const tools = [
  {
    type: "function",
    function: {
      name: "search_jobs",
      description: "Find the best matching jobs from the current marketplace context.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What the user is looking for." },
          limit: { type: "number", description: "How many jobs to return.", default: 3 },
          skills: {
            type: "array",
            items: { type: "string" },
            description: "Optional skills to prioritize.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wallet_snapshot",
      description: "Return the connected wallet address, current balance, and network status.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_proposal",
      description: "Create a tailored application proposal for a selected job.",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "string", description: "The target job ID." },
          tone: { type: "string", description: "Desired tone such as premium, concise, or technical." },
          userHighlights: {
            type: "array",
            items: { type: "string" },
            description: "Optional user strengths to emphasize.",
          },
        },
        required: ["jobId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_application_flow",
      description: "Create the next-step flow from AI proposal to escrow creation for a selected job.",
      parameters: {
        type: "object",
        properties: {
          jobId: { type: "string", description: "The job to apply for." },
        },
        required: ["jobId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_payment_plan",
      description: "Prepare Moonpay and Pay.sh actions for wallet top-ups, proposal fees, or escrow funding.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["moonpay_topup", "proposal_fee", "escrow_funding"],
            description: "What payment flow to prepare.",
          },
          amountUsd: { type: "number", description: "Optional USD amount to display." },
          reason: { type: "string", description: "Why the payment is needed." },
        },
        required: ["kind"],
      },
    },
  },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createSseResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function sseChunk(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function parseBudget(budget: string) {
  const numeric = Number((budget.match(/[\d,.]+/)?.[0] || "0").replaceAll(",", ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function scoreJob(job: Job, query: string, skills: string[] = []) {
  const haystack = `${job.title} ${job.company} ${job.description} ${job.skills.join(" ")}`.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += 3;
  }

  for (const skill of skills) {
    if (job.skills.some((jobSkill) => jobSkill.toLowerCase() === skill.toLowerCase())) score += 6;
  }

  score += Math.min(parseBudget(job.budget) / 1000, 8);
  if (job.urgent) score += 1.5;
  if (job.remote) score += 1;
  return score;
}

function searchJobs(context: AgentContext, args: Record<string, unknown>) {
  const query = String(args.query || "solana jobs");
  const limit = Math.max(1, Math.min(5, Number(args.limit || 3)));
  const skills = Array.isArray(args.skills) ? args.skills.map(String) : [];

  const jobs = [...context.jobs]
    .map((job) => ({ job, score: scoreJob(job, query, skills) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ job, score }) => ({
      ...job,
      matchScore: Number(score.toFixed(1)),
      rationale: `Strong fit for ${query} with ${job.skills.slice(0, 3).join(", ")}.`,
    }));

  return {
    summary: `Found ${jobs.length} strong matches for "${query}".`,
    jobs,
  };
}

function walletSnapshot(context: AgentContext) {
  return {
    summary: context.wallet.authenticated
      ? `Wallet connected on ${context.wallet.network}.`
      : "Wallet not connected yet.",
    authenticated: context.wallet.authenticated,
    address: context.wallet.address,
    balance: context.wallet.balance ?? null,
    network: context.wallet.network,
  };
}

function generateProposal(context: AgentContext, args: Record<string, unknown>) {
  const job = context.jobs.find((item) => item.id === String(args.jobId || ""));
  if (!job) {
    return {
      summary: "No matching job found for proposal generation.",
      proposal: "",
    };
  }

  const tone = String(args.tone || "premium");
  const userHighlights = Array.isArray(args.userHighlights)
    ? args.userHighlights.map(String)
    : [];

  const proposal = [
    `Hello ${job.company} team,`,
    "",
    `I would love to take on your ${job.title} opportunity. My background aligns tightly with this brief: ${context.profile.bio}`,
    "",
    `Why I am a strong fit:`,
    `- ${context.profile.level} operator with ${context.profile.completedJobs}+ completed marketplace engagements and a ${context.profile.reputation}/100 reputation score.`,
    `- Direct experience across ${job.skills.slice(0, 4).join(", ")} and shipping polished, production-ready Web3 experiences.`,
    `- A delivery style built around clear milestones, proactive communication, and fast iteration for high-visibility launches.`,
    ...(userHighlights.length ? ["", `Additional highlights: ${userHighlights.join("; ")}.`] : []),
    "",
    `For this project, I would focus on a clean execution plan, milestone-based reporting, and a final result that is demo-ready as well as production-conscious.`,
    "",
    `If selected, I can move quickly from kickoff into scoped milestones and align with your escrow flow immediately.`,
    "",
    `Best,`,
    `${context.profile.name}`,
  ].join("\n");

  return {
    summary: `Generated a ${tone} proposal draft for ${job.title}.`,
    proposal,
    job,
  };
}

function prepareApplicationFlow(context: AgentContext, args: Record<string, unknown>) {
  const job = context.jobs.find((item) => item.id === String(args.jobId || ""));
  if (!job) {
    return {
      summary: "Unable to prepare the application flow because the job was not found.",
      highlights: [],
      actions: [],
    };
  }

  return {
    summary: `Prepared the apply-to-escrow flow for ${job.title}.`,
    highlights: [
      `Match: ${job.company} · ${job.budget}`,
      "Step 1: Submit AI proposal",
      "Step 2: Confirm Pay.sh escrow terms",
      "Step 3: Fund milestones after acceptance",
      `Reputation upside: ${job.milestones} milestone(s) can raise on-chain trust`,
    ],
    actions: [
      {
        type: "suggest_prompt",
        label: "Refine proposal",
        prompt: `Refine my proposal for ${job.title} and make it more technical.`,
        intent: "apply",
      },
      {
        type: "open_url",
        label: "Open Pay.sh escrow",
        href: context.integrations.payShUrl,
        intent: "paysh",
      },
    ],
    job,
  };
}

function buildPaymentPlan(context: AgentContext, args: Record<string, unknown>) {
  const kind = String(args.kind || "proposal_fee");
  const amountUsd = Number(args.amountUsd || (kind === "escrow_funding" ? 250 : 25));
  const reason = String(args.reason || "SkillChain workflow");

  const actions = [];

  if (kind === "moonpay_topup" || kind === "escrow_funding") {
    actions.push({
      type: "open_url",
      label: "Top up with Moonpay",
      href: context.integrations.moonpayUrl,
      intent: "moonpay",
    });
  }

  actions.push({
    type: "open_url",
    label: kind === "proposal_fee" ? "Open Pay.sh checkout" : "Open Pay.sh escrow",
    href: context.integrations.payShUrl,
    intent: "paysh",
  });

  return {
    summary: `Prepared a ${kind.replaceAll("_", " ")} plan for $${amountUsd}.`,
    highlights: [
      `Amount: $${amountUsd}`,
      `Reason: ${reason}`,
      "Moonpay handles wallet top-up if needed",
      "Pay.sh handles the checkout or escrow handoff",
    ],
    actions,
  };
}

function executeTool(context: AgentContext, toolCall: ToolCall) {
  const args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;

  switch (toolCall.function.name) {
    case "search_jobs":
      return searchJobs(context, args);
    case "wallet_snapshot":
      return walletSnapshot(context);
    case "generate_proposal":
      return generateProposal(context, args);
    case "prepare_application_flow":
      return prepareApplicationFlow(context, args);
    case "build_payment_plan":
      return buildPaymentPlan(context, args);
    default:
      return { summary: `Tool ${toolCall.function.name} is not implemented.` };
  }
}

async function callXai(messages: unknown[], stream = false, includeTools = true) {
  if (!XAI_API_KEY) {
    throw new Error("GROK_API_KEY is not configured.");
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      stream,
      messages,
      ...(includeTools ? { tools } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI API error ${response.status}: ${errorText}`);
  }

  return response;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { messages, context } = await req.json() as {
      messages: ChatMessage[];
      context: AgentContext;
    };

    if (!messages?.length) {
      return json({ error: "Missing messages payload." }, 400);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const write = (event: string, payload: unknown) =>
          controller.enqueue(encoder.encode(sseChunk(event, payload)));

        try {
          const workingMessages: unknown[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ];

          const donePayload: {
            jobs?: Job[];
            proposal?: string;
            actions?: unknown[];
            highlights?: string[];
          } = {};

          for (let iteration = 0; iteration < 4; iteration += 1) {
            const toolResponse = await callXai(workingMessages, false, true);
            const toolJson = await toolResponse.json();
            const choice = toolJson.choices?.[0]?.message;
            const toolCalls = (choice?.tool_calls || []) as ToolCall[];

            if (!toolCalls.length) {
              break;
            }

            workingMessages.push({
              role: "assistant",
              content: choice.content || "",
              tool_calls: toolCalls,
            });

            for (const toolCall of toolCalls) {
              write("tool_call", {
                name: toolCall.function.name,
                arguments: JSON.parse(toolCall.function.arguments || "{}"),
              });

              const result = executeTool(context, toolCall);

              if ("jobs" in result && Array.isArray(result.jobs)) {
                donePayload.jobs = result.jobs;
              }
              if ("proposal" in result && typeof result.proposal === "string" && result.proposal) {
                donePayload.proposal = result.proposal;
              }
              if ("actions" in result && Array.isArray(result.actions)) {
                donePayload.actions = result.actions;
              }
              if ("highlights" in result && Array.isArray(result.highlights)) {
                donePayload.highlights = result.highlights;
              }

              write("tool_result", {
                name: toolCall.function.name,
                summary: result.summary || `${toolCall.function.name} completed.`,
              });

              workingMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify(result),
              });
            }
          }

          const finalMessages = [
            ...workingMessages,
            {
              role: "system",
              content:
                "Write the final user-facing answer using the tool outputs already in the conversation. Keep it concise, premium, and action-oriented. Do not call more tools.",
            },
          ];

          const finalResponse = await callXai(finalMessages, true, false);
          const reader = finalResponse.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          if (!reader) {
            throw new Error("xAI stream did not include a readable body.");
          }

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;

              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                write("assistant_delta", { delta });
              }
            }
          }

          write("done", donePayload);
          controller.close();
        } catch (error) {
          write("error", {
            message: error instanceof Error ? error.message : "Unknown agent error.",
          });
          controller.close();
        }
      },
    });

    return createSseResponse(stream);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unknown request error." },
      500,
    );
  }
});

import { appConfig } from '@/lib/config';
import type { Job, Profile } from '@/lib/mockData';
import { streamDemoAgentResponse } from '@/lib/demoAgent';
import { getSupabaseAuthHeaders, getSupabaseFunctionUrl } from '@/lib/supabase';

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentContext {
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
}

export interface AgentAction {
  type: 'open_url' | 'refresh_balance' | 'suggest_prompt';
  label: string;
  href?: string;
  prompt?: string;
  intent?: 'moonpay' | 'paysh' | 'apply' | 'wallet';
}

export interface AgentDonePayload {
  jobs?: Job[];
  proposal?: string;
  actions?: AgentAction[];
  highlights?: string[];
}

export interface AgentStreamEventMap {
  assistant_delta: { delta: string };
  tool_call: { name: string; arguments?: Record<string, unknown> };
  tool_result: { name: string; summary: string };
  done: AgentDonePayload;
  error: { message: string };
}

interface StreamAgentResponseArgs {
  messages: AgentChatMessage[];
  context: AgentContext;
  signal?: AbortSignal;
  onEvent: <T extends keyof AgentStreamEventMap>(
    type: T,
    payload: AgentStreamEventMap[T],
  ) => void;
}

function parseSseEvent(rawEvent: string) {
  const lines = rawEvent
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  let event = 'message';
  const dataParts: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    }
    if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).trim());
    }
  }

  return {
    event,
    data: dataParts.join('\n'),
  };
}

export async function streamAgentResponse({
  messages,
  context,
  signal,
  onEvent,
}: StreamAgentResponseArgs) {
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    await streamDemoAgentResponse({ messages, context, signal, onEvent });
    return;
  }

  try {
    const response = await fetch(getSupabaseFunctionUrl('chat-grok'), {
      method: 'POST',
      headers: getSupabaseAuthHeaders(),
      body: JSON.stringify({ messages, context }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Agent request failed with ${response.status}.`);
    }

    if (!response.body) {
      throw new Error('The agent response did not include a readable stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let liveStreamFailed = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const chunk = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        if (chunk.trim()) {
          const parsed = parseSseEvent(chunk);
          if (!parsed.data) {
            separatorIndex = buffer.indexOf('\n\n');
            continue;
          }

          try {
            const payload = JSON.parse(parsed.data);
            const eventName = parsed.event as keyof AgentStreamEventMap;
            if (eventName === 'error') {
              const errorPayload = payload as AgentStreamEventMap['error'];
              throw new Error(errorPayload.message || 'Live agent stream failed.');
            }
            onEvent(eventName, payload);
          } catch (error) {
            liveStreamFailed = true;
            throw error;
          }
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }

    if (liveStreamFailed) {
      throw new Error('Live agent stream failed.');
    }
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    onEvent('tool_result', {
      name: 'live_agent_fallback',
      summary: 'Live agent unavailable. Switched to local demo intelligence.',
    });
    await streamDemoAgentResponse({ messages, context, signal, onEvent });
  }
}

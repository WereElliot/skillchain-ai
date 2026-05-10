const env = import.meta.env;

function hasRealConfigValue(value?: string) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();

  if (!normalized) return false;

  return ![
    'demo-privy-app-id',
    'your_privy_app_id',
    'your_elevenlabs_agent_id',
    'your_supabase_anon_key',
  ].includes(normalized);
}

export const appConfig = {
  privyAppId: env.VITE_PRIVY_APP_ID || 'demo-privy-app-id',
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  elevenLabsAgentId: env.VITE_ELEVENLABS_AGENT_ID || '',
  moonpayUrl: env.VITE_MOONPAY_URL || 'https://buy.moonpay.com',
  payShUrl: env.VITE_PAYSH_URL || 'https://pay.sh',
  solanaRpcUrl: env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  networkLabel: env.VITE_SOLANA_NETWORK_LABEL || 'Devnet',
};

export const integrationStatus = {
  privy: hasRealConfigValue(appConfig.privyAppId),
  supabase:
    hasRealConfigValue(appConfig.supabaseUrl) &&
    hasRealConfigValue(appConfig.supabaseAnonKey) &&
    !appConfig.supabaseUrl.includes('your-project.supabase.co'),
  elevenLabs: hasRealConfigValue(appConfig.elevenLabsAgentId),
  moonpay: /^https?:\/\//.test(appConfig.moonpayUrl),
  paySh: /^https?:\/\//.test(appConfig.payShUrl),
};

export const demoMode = {
  auth: !integrationStatus.privy,
  agent: !integrationStatus.supabase,
  voice: !integrationStatus.elevenLabs,
  payments: !integrationStatus.moonpay || !integrationStatus.paySh,
};

export const integrationWarnings = [
  !integrationStatus.privy &&
    'Set `VITE_PRIVY_APP_ID` to enable real Privy auth. Demo wallet mode is active until then.',
  !integrationStatus.supabase &&
    'Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable the live AI agent. A local demo agent is active for now.',
  !integrationStatus.elevenLabs &&
    'Set `VITE_ELEVENLABS_AGENT_ID` to enable the ElevenLabs voice session. Voice demo mode is active for now.',
].filter(Boolean) as string[];

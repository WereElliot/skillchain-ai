# SkillChain AI

SkillChain AI is a premium Web3 talent marketplace demo built for the Dev3pack Global Hackathon. It combines AI-assisted job discovery, proposal generation, voice interaction, wallet-aware flows, and polished payment handoffs in a dark, demo-ready interface.

## Features

- AI agent with streaming replies, context-aware job matching, proposal drafting, and escrow-flow guidance
- Multi-page application for home, jobs, agent, post gig, and profile flows
- Stable demo-mode fallbacks for auth, AI, voice, and payments when live credentials are not present
- Privy-ready authentication and wallet connection support
- ElevenLabs-ready voice workflow with browser-native fallback
- Supabase Edge Function support for the live `chat-grok` backend
- Moonpay and Pay.sh demo handoff dialogs for wallet funding and escrow storytelling

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Radix UI
- Supabase Edge Functions
- Privy
- ElevenLabs
- Solana Web3.js

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Start the local development server:

```bash
npm run dev
```

4. Create a production build:

```bash
npm run build
```

## Environment Variables

Frontend environment variables:

```bash
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
VITE_MOONPAY_URL=https://buy.moonpay.com
VITE_PAYSH_URL=https://pay.sh
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK_LABEL=Devnet
```

Supabase Edge Function secrets:

```bash
GROK_API_KEY=your_xai_api_key
XAI_MODEL=grok-3-mini-fast
```

## Supabase Setup

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Authenticate and link your project:

```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Add edge-function secrets:

```bash
supabase secrets set GROK_API_KEY=your_xai_api_key
supabase secrets set XAI_MODEL=grok-3-mini-fast
```

4. Deploy the edge function:

```bash
supabase functions deploy chat-grok
```

## Vercel Deployment

This project is configured for Vercel as a static Vite deployment with SPA rewrites.

```bash
vercel
vercel --prod
```

Add the frontend environment variables in the Vercel dashboard before production promotion.

## Running Modes

- No external keys: polished demo mode stays fully usable
- Supabase configured: live AI edge-agent streaming can be enabled
- Privy configured: real authentication and wallet connection become available
- ElevenLabs configured: live voice service can be connected

## Demo Link

Add the live deployment URL here after deployment:

```text
Demo: pending deployment
```

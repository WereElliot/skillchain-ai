export interface Job {
  id: string;
  title: string;
  company: string;
  type: 'Bounty' | 'Gig' | 'Full-time' | 'Part-time';
  budget: string;
  skills: string[];
  description: string;
  postedAgo: string;
  applicants: number;
  milestones: number;
  remote: boolean;
  urgent: boolean;
  location?: string;
  timeline?: string;
  clientRating?: number;
  deliverables?: string[];
  paymentTerms?: string;
  matchScore?: number;
  rationale?: string;
  applicationStatus?: 'draft' | 'submitted' | 'shortlisted' | 'interviewing' | 'hired';
}

export interface Profile {
  address: string;
  name: string;
  bio: string;
  avatar: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Expert';
  reputation: number;
  completedJobs: number;
  skills: string[];
  github: string;
  earnings: string;
  joinedDate: string;
}

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Ship Solana Swap Interface for Consumer Wallet Launch',
    company: 'HelioFi',
    type: 'Gig',
    budget: '4,800 USDC',
    skills: ['React', 'TypeScript', 'Solana', 'Tailwind CSS'],
    description:
      'Build a polished swap experience with wallet connect, route preview, slippage controls, token search, and transaction feedback for a new consumer wallet product.',
    postedAgo: '47m ago',
    applicants: 7,
    milestones: 4,
    remote: true,
    urgent: true,
    location: 'Remote / EU overlap',
    timeline: '2 weeks',
    clientRating: 4.9,
    deliverables: ['Swap UI', 'Wallet integration', 'Responsive mobile states'],
    paymentTerms: '40% upfront / 60% on production handoff',
  },
  {
    id: '2',
    title: 'Anchor Security Review for NFT Lending Protocol',
    company: 'Canopy Finance',
    type: 'Bounty',
    budget: '6,500 USDC',
    skills: ['Rust', 'Anchor', 'Security', 'Solana'],
    description:
      'Review collateral vault, liquidation, and oracle handling logic in our Anchor-based NFT lending contracts. Deliver a written report with fixes ranked by severity.',
    postedAgo: '3h ago',
    applicants: 5,
    milestones: 3,
    remote: true,
    urgent: false,
    location: 'Remote',
    timeline: '10 days',
    clientRating: 4.8,
    deliverables: ['Audit report', 'Severity matrix', 'Retest notes'],
    paymentTerms: 'Milestone escrow by findings + retest signoff',
  },
  {
    id: '3',
    title: 'Design and Prototype Token Launch Dashboard',
    company: 'Atlas Launchpad',
    type: 'Gig',
    budget: '2,750 USDC',
    skills: ['Figma', 'UI/UX', 'Web3 Design', 'Motion'],
    description:
      'Create a premium launchpad experience with allocation screens, vesting summaries, investor analytics, and animated onboarding for new token launches.',
    postedAgo: '7h ago',
    applicants: 11,
    milestones: 3,
    remote: true,
    urgent: false,
    location: 'Remote / US friendly',
    timeline: '12 days',
    clientRating: 4.7,
    deliverables: ['Figma prototype', 'Design system tokens', 'Mobile launch flow'],
    paymentTerms: 'Escrow released per approved design milestone',
  },
  {
    id: '4',
    title: 'Rust Backend for Solana DeFi Analytics API',
    company: 'Helius',
    type: 'Full-time',
    budget: '9,500 USDC/mo',
    skills: ['Rust', 'PostgreSQL', 'Solana', 'APIs'],
    description:
      'Build indexers and analytics endpoints for swaps, LP positions, and wallet PnL. Focus on high-throughput ingestion, clean schema design, and API reliability.',
    postedAgo: '1d ago',
    applicants: 6,
    milestones: 5,
    remote: true,
    urgent: false,
    location: 'Remote / Americas overlap',
    timeline: 'Long-term',
    clientRating: 4.9,
    deliverables: ['Indexer services', 'Metrics API', 'Monitoring handoff'],
    paymentTerms: 'Monthly payout with quarterly bonus review',
  },
  {
    id: '5',
    title: 'Create Generative Collectibles Pipeline for Mint Campaign',
    company: 'Circuit House',
    type: 'Bounty',
    budget: '2,200 USDC',
    skills: ['Generative Art', 'Python', 'Solana', 'Metaplex'],
    description:
      'Generate a 4,000 piece collection with rarity balancing, metadata generation, and mint-ready upload preparation for a community collectibles drop.',
    postedAgo: '9h ago',
    applicants: 9,
    milestones: 2,
    remote: true,
    urgent: true,
    location: 'Remote',
    timeline: '1 week',
    clientRating: 4.6,
    deliverables: ['Art output', 'Metadata set', 'Mint config'],
    paymentTerms: '50% at preview approval / 50% before mint',
  },
  {
    id: '6',
    title: 'Integrate Jupiter Routing into Existing Staking App',
    company: 'Marinade Finance',
    type: 'Gig',
    budget: '1,850 USDC',
    skills: ['TypeScript', 'Jupiter SDK', 'React', 'Solana'],
    description:
      'Integrate Jupiter routing into our staking product with quote handling, route transparency, slippage settings, and success states that feel native to the app.',
    postedAgo: '4h ago',
    applicants: 4,
    milestones: 2,
    remote: true,
    urgent: false,
    location: 'Remote / CET preferred',
    timeline: '5 days',
    clientRating: 5,
    deliverables: ['Swap embed', 'Slippage controls', 'QA checklist'],
    paymentTerms: 'Single escrow release on QA approval',
  },
];

export const mockProfile: Profile = {
  address: '7xKX...m3Fp',
  name: 'Alex Chen',
  bio: 'Full-stack Solana developer specializing in DeFi protocols and NFT platforms. 3+ years building on Solana with Anchor, React, and TypeScript.',
  avatar: '',
  level: 'Senior',
  reputation: 94,
  completedJobs: 47,
  skills: [
    'Rust',
    'TypeScript',
    'React',
    'Solana',
    'Anchor',
    'Node.js',
    'PostgreSQL',
    'GraphQL',
  ],
  github: 'alexchen',
  earnings: '42,500 USDC',
  joinedDate: 'Jan 2024',
};

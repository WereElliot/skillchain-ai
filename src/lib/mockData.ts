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
    title: 'Build Solana DEX Frontend with React and TypeScript',
    company: 'Phantom Labs',
    type: 'Gig',
    budget: '3,500 USDC',
    skills: ['React', 'TypeScript', 'Solana', 'Tailwind CSS'],
    description:
      'Build a clean, performant DEX interface with wallet integration, token swap UI, and real-time price charts. Must support Phantom and Solflare wallets.',
    postedAgo: '2h ago',
    applicants: 12,
    milestones: 3,
    remote: true,
    urgent: true,
  },
  {
    id: '2',
    title: 'Smart Contract Audit for NFT Marketplace',
    company: 'MetaDAO',
    type: 'Bounty',
    budget: '5,000 USDC',
    skills: ['Rust', 'Anchor', 'Security', 'Solana'],
    description:
      'Conduct a thorough security audit of our NFT marketplace smart contracts built with Anchor framework. Looking for experienced auditors with proven track record.',
    postedAgo: '5h ago',
    applicants: 8,
    milestones: 2,
    remote: true,
    urgent: false,
  },
  {
    id: '3',
    title: 'Design Token Launch Dashboard UI/UX',
    company: 'Raydium',
    type: 'Gig',
    budget: '2,000 USDC',
    skills: ['Figma', 'UI/UX', 'Web3 Design', 'Motion'],
    description:
      'Design a premium token launch platform dashboard with analytics, holder tracking, and liquidity pool management interfaces.',
    postedAgo: '1d ago',
    applicants: 24,
    milestones: 2,
    remote: true,
    urgent: false,
  },
  {
    id: '4',
    title: 'Rust Backend for On-chain Analytics API',
    company: 'Helius',
    type: 'Full-time',
    budget: '8,000 USDC/mo',
    skills: ['Rust', 'PostgreSQL', 'Solana', 'APIs'],
    description:
      'Build a high-performance analytics API that indexes Solana transactions, computes DeFi metrics, and serves data via GraphQL endpoints.',
    postedAgo: '3d ago',
    applicants: 6,
    milestones: 5,
    remote: true,
    urgent: false,
  },
  {
    id: '5',
    title: 'Create Generative NFT Art Collection',
    company: 'DeGods DAO',
    type: 'Bounty',
    budget: '1,500 USDC',
    skills: ['Generative Art', 'Python', 'Solana', 'Metaplex'],
    description:
      'Generate a 5,000 piece PFP collection using trait layering with rarity distribution. Deliverables include assets, metadata, and Metaplex-compatible config.',
    postedAgo: '6h ago',
    applicants: 18,
    milestones: 2,
    remote: true,
    urgent: true,
  },
  {
    id: '6',
    title: 'Integrate Jupiter Swap into Existing DApp',
    company: 'Marinade Finance',
    type: 'Gig',
    budget: '1,200 USDC',
    skills: ['TypeScript', 'Jupiter SDK', 'React', 'Solana'],
    description:
      'Integrate Jupiter aggregator swap functionality into our existing staking platform. Include slippage controls, route display, and transaction confirmation UI.',
    postedAgo: '12h ago',
    applicants: 9,
    milestones: 2,
    remote: true,
    urgent: false,
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
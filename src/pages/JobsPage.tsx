import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Grid3x3, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobCard from '@/components/JobCard';
import { mockJobs } from '@/lib/mockData';

const jobTypes = ['All', 'Bounty', 'Gig', 'Full-time', 'Part-time'];
const skillFilters = ['Solana', 'Rust', 'React', 'TypeScript', 'Anchor', 'UI/UX', 'Security'];

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const toggleSkill = (skill: string) => {
    setActiveSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const filteredJobs = mockJobs.filter((job) => {
    const matchesType = activeType === 'All' || job.type === activeType;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkills =
      activeSkills.length === 0 || activeSkills.some((s) => job.skills.includes(s));
    return matchesType && matchesSearch && matchesSkills;
  });

  const handleApplyWithAgent = (jobId: string, jobTitle: string) => {
    navigate(
      `/agent?prompt=${encodeURIComponent(`Generate a winning proposal for ${jobTitle}`)}&jobId=${jobId}&mode=apply`,
    );
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Browse Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            {mockJobs.length} active jobs and bounties from top Web3 teams
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, companies, skills..."
                className="w-full bg-surface-1 border border-border rounded-sm pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
              />
            </div>
            <div className="flex items-center border border-border rounded-sm overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-surface-2 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-surface-2 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {jobTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium border rounded-sm transition-all ${
                  activeType === type
                    ? 'bg-purple/10 border-purple/30 text-purple'
                    : 'bg-surface-1 border-border text-muted-foreground hover:text-foreground hover:border-purple/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {skillFilters.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-medium border rounded-sm transition-all ${
                  activeSkills.includes(skill)
                    ? 'bg-cyan/10 border-cyan/30 text-cyan'
                    : 'bg-surface-1 border-border text-muted-foreground hover:text-foreground hover:border-cyan/20'
                }`}
              >
                {skill}
              </button>
            ))}
            {activeSkills.length > 0 && (
              <button
                onClick={() => setActiveSkills([])}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">
            Showing {filteredJobs.length} of {mockJobs.length} opportunities
          </span>
        </div>

        {filteredJobs.length > 0 ? (
          <div
            className={`${
              viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-3'
            }`}
          >
            {filteredJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                actionLabel="Apply with Agent"
                onAction={(selectedJob) => handleApplyWithAgent(selectedJob.id, selectedJob.title)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 flex items-center justify-center bg-surface-1 border border-border rounded-sm mb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No results found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;

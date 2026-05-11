import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Grid3x3, List, Briefcase, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobCard from '@/components/JobCard';
import { getApplications, getJobsWithApplications } from '@/lib/applications';
import { mockJobs } from '@/lib/mockData';

const jobTypes = ['All', 'Bounty', 'Gig', 'Full-time', 'Part-time'];
const skillFilters = ['Solana', 'Rust', 'React', 'TypeScript', 'Anchor', 'UI/UX', 'Security'];

const JobsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [applicationVersion, setApplicationVersion] = useState(0);

  useEffect(() => {
    const handleFocus = () => setApplicationVersion((value) => value + 1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  void applicationVersion;
  const jobs = getJobsWithApplications(mockJobs);
  const applications = Object.values(getApplications());
  const hiredCount = applications.filter((application) => application.status === 'hired').length;

  const toggleSkill = (skill: string) => {
    setActiveSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesType = activeType === 'All' || job.type === activeType;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
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
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-1 text-2xl font-bold text-foreground">Browse Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} active jobs and bounties from real-looking Web3 teams
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 grid gap-3 sm:grid-cols-2"
        >
          <div className="border border-border bg-surface-1 p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 text-cyan" />
              Application Pipeline
            </div>
            <div className="text-lg font-black uppercase tracking-tight text-foreground">
              {applications.length} live application{applications.length === 1 ? '' : 's'}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Start with the agent, generate a proposal, and track the hiring state across the app.
            </p>
          </div>
          <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
              <Trophy className="h-3.5 w-3.5" />
              Won Roles
            </div>
            <div className="text-lg font-black uppercase tracking-tight text-foreground">
              {hiredCount} hired role{hiredCount === 1 ? '' : 's'}
            </div>
            <p className="mt-1 text-[11px] text-emerald-200/80">
              Top matches can move all the way to hired state for the demo workflow.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, companies, skills..."
                className="w-full rounded-sm border border-border bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-purple/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center overflow-hidden rounded-sm border border-border">
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
            <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            {jobTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-shrink-0 rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeType === type
                    ? 'border-purple/30 bg-purple/10 text-purple'
                    : 'border-border bg-surface-1 text-muted-foreground hover:border-purple/20 hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            {skillFilters.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`flex-shrink-0 rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-all ${
                  activeSkills.includes(skill)
                    ? 'border-cyan/30 bg-cyan/10 text-cyan'
                    : 'border-border bg-surface-1 text-muted-foreground hover:border-cyan/20 hover:text-foreground'
                }`}
              >
                {skill}
              </button>
            ))}
            {activeSkills.length > 0 && (
              <button
                onClick={() => setActiveSkills([])}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium text-destructive transition-colors hover:text-destructive/80"
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {filteredJobs.length} of {jobs.length} opportunities
          </span>
        </div>

        {filteredJobs.length > 0 ? (
          <div className={`${viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}`}>
            {filteredJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                actionLabel={job.applicationStatus ? 'Continue Application' : 'Apply with Agent'}
                onAction={(selectedJob) => handleApplyWithAgent(selectedJob.id, selectedJob.title)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-surface-1">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">No results found</p>
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

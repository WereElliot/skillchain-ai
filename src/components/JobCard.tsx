import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Zap, ArrowUpRight, Sparkles, Target, Star, Timer } from 'lucide-react';
import type { Job } from '@/lib/mockData';

interface JobCardProps {
  job: Job;
  index?: number;
  compact?: boolean;
  actionLabel?: string;
  onAction?: (job: Job) => void;
}

const typeColors: Record<string, string> = {
  Bounty: 'bg-cyan/10 text-cyan border-cyan/20',
  Gig: 'bg-purple/10 text-purple border-purple/20',
  'Full-time': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Part-time': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const applicationStatusStyles: Record<NonNullable<Job['applicationStatus']>, string> = {
  draft: 'bg-purple/10 text-purple border-purple/20',
  submitted: 'bg-cyan/10 text-cyan border-cyan/20',
  shortlisted: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  interviewing: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  hired: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
};

const JobCard = ({ job, index = 0, compact = false, actionLabel, onAction }: JobCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative bg-surface-1 border border-border rounded-none p-5 hover:border-purple/40 transition-all duration-300 hover:shadow-glow-purple/5 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] border rounded-none ${typeColors[job.type]}`}
            >
              {job.type}
            </span>
            {job.urgent && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] bg-destructive/10 text-destructive border border-destructive/20 rounded-none">
                <Zap className="h-2.5 w-2.5" />
                Urgent
              </span>
            )}
            {typeof job.matchScore === 'number' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-none">
                <Target className="h-2.5 w-2.5" />
                {job.matchScore}% Match
              </span>
            )}
            {job.applicationStatus && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] border rounded-none ${applicationStatusStyles[job.applicationStatus]}`}
              >
                {job.applicationStatus}
              </span>
            )}
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight text-foreground leading-snug group-hover:text-purple transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{job.company}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-black text-purple font-mono uppercase tracking-tighter">{job.budget}</div>
          <div className="h-8 w-8 flex items-center justify-center bg-surface-2 border border-border group-hover:border-purple/30 group-hover:bg-purple/5 transition-all">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-purple" />
          </div>
        </div>
      </div>

      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 font-medium">
          {job.description}
        </p>
      )}

      {job.rationale && (
        <div className="mb-4 border border-purple/15 bg-purple/5 px-3 py-2">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-purple">
            <Sparkles className="h-3 w-3" />
            Why It Matches
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {job.rationale}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.slice(0, compact ? 3 : 4).map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-surface-2 border border-border rounded-none"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-4 border-t border-border/50">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {job.postedAgo}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          {job.applicants}
        </span>
        {job.clientRating ? (
          <span className="flex items-center gap-1.5 text-amber-300">
            <Star className="h-3 w-3" />
            {job.clientRating.toFixed(1)}
          </span>
        ) : null}
        {job.remote && (
          <span className="flex items-center gap-1.5 text-cyan">
            <MapPin className="h-3 w-3" />
            {job.location || 'Remote'}
          </span>
        )}
        {job.timeline ? (
          <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
            <Timer className="h-3 w-3" />
            {job.timeline}
          </span>
        ) : null}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={() => onAction(job)}
          className="mt-4 inline-flex items-center gap-2 border border-purple/20 bg-purple/8 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-purple transition-colors hover:border-cyan/30 hover:text-cyan"
        >
          {actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default JobCard;

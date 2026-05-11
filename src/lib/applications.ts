import type { Job } from '@/lib/mockData';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'shortlisted'
  | 'interviewing'
  | 'hired';

export interface JobApplication {
  jobId: string;
  proposal?: string;
  status: ApplicationStatus;
  updatedAt: string;
  timeline: string[];
}

const STORAGE_KEY = 'skillchain-applications';

function isBrowser() {
  return typeof window !== 'undefined';
}

function getNowLabel() {
  return new Date().toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function readAll() {
  if (!isBrowser()) return {} as Record<string, JobApplication>;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, JobApplication>) : {};
  } catch {
    return {};
  }
}

function writeAll(applications: Record<string, JobApplication>) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function createTimelineEntry(status: ApplicationStatus, job?: Job) {
  const label = getNowLabel();

  switch (status) {
    case 'draft':
      return `${label}: Agent prepared a tailored application draft${job ? ` for ${job.company}` : ''}.`;
    case 'submitted':
      return `${label}: Application submitted with professional proposal and delivery plan.`;
    case 'shortlisted':
      return `${label}: Client shortlisted the profile for technical review.`;
    case 'interviewing':
      return `${label}: Final interview and milestone alignment in progress.`;
    case 'hired':
      return `${label}: Offer accepted and kickoff moved into escrow.`;
  }
}

export function getApplications() {
  return readAll();
}

export function getApplication(jobId: string) {
  return readAll()[jobId];
}

export function upsertApplication(
  jobId: string,
  status: ApplicationStatus,
  options?: {
    proposal?: string;
    job?: Job;
  },
) {
  const applications = readAll();
  const current = applications[jobId];
  const timeline = current?.timeline ? [...current.timeline] : [];
  const nextEntry = createTimelineEntry(status, options?.job);

  if (!timeline.includes(nextEntry)) {
    timeline.unshift(nextEntry);
  }

  const nextApplication: JobApplication = {
    jobId,
    proposal: options?.proposal ?? current?.proposal,
    status,
    updatedAt: getNowLabel(),
    timeline,
  };

  applications[jobId] = nextApplication;
  writeAll(applications);
  return nextApplication;
}

export function getApplicationStatus(jobId: string): ApplicationStatus | null {
  return getApplication(jobId)?.status ?? null;
}

export function getJobsWithApplications(jobs: Job[]) {
  const applications = readAll();
  return jobs.map((job) => ({
    ...job,
    applicationStatus: applications[job.id]?.status ?? undefined,
  }));
}

export function getHiredApplications(jobs: Job[]) {
  const applications = readAll();
  return jobs
    .filter((job) => applications[job.id]?.status === 'hired')
    .map((job) => ({
      job,
      application: applications[job.id],
    }));
}

export function getActiveApplications(jobs: Job[]) {
  const applications = readAll();
  return jobs
    .filter((job) => {
      const status = applications[job.id]?.status;
      return status && status !== 'hired';
    })
    .map((job) => ({
      job,
      application: applications[job.id],
    }));
}

export function buildDemoOutcome(job: Job) {
  const matchScore = job.matchScore ?? 86;
  if (matchScore >= 94 || job.urgent) return 'hired' as const;
  if (matchScore >= 88) return 'interviewing' as const;
  return 'shortlisted' as const;
}

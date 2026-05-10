import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, X, DollarSign, Tag, FileText, Flag, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const PostGigPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [type, setType] = useState('Gig');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [milestones, setMilestones] = useState([{ title: '', amount: '' }]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills((prev) => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const addMilestone = () => {
    setMilestones((prev) => [...prev, { title: '', amount: '' }]);
  };

  const updateMilestone = (
    index: number,
    field: 'title' | 'amount',
    value: string
  ) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) {
      toast({
        title: 'Missing details',
        description: 'Add a title, company, and project description before posting the gig.',
      });
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSubmitted(true);
    setSubmitting(false);
    window.setTimeout(() => setSubmitted(false), 3000);
  };

  const handleOpenAgent = () => {
    const jobSummary = title || 'my newly posted gig';
    navigate(
      `/agent?prompt=${encodeURIComponent(`Create a hiring brief and shortlist plan for ${jobSummary}`)}`,
    );
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Post a Gig</h1>
          <p className="text-sm text-muted-foreground">
            Create a job listing for your DAO, startup, or project
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-purple" />
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Solana DEX Frontend"
              className="w-full bg-surface-1 border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
            />
          </div>

          {/* Company + Type */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Company / DAO
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Phantom Labs"
                className="w-full bg-surface-1 border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Job Type
              </label>
              <div className="flex gap-2">
                {['Bounty', 'Gig', 'Full-time', 'Part-time'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 px-2 py-2.5 text-xs font-medium border rounded-sm transition-all ${
                      type === t
                        ? 'bg-purple/10 border-purple/30 text-purple'
                        : 'bg-surface-1 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job requirements, deliverables, and any relevant context..."
              rows={5}
              className="w-full bg-surface-1 border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors resize-none"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-cyan" />
              Budget (USDC)
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 3,500"
              className="w-full bg-surface-1 border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
            />
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-purple" />
              Required Skills
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="flex-1 bg-surface-1 border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
              />
              <button
                type="button"
                onClick={addSkill}
                className="h-10 px-3 bg-surface-1 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-purple/30 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple/10 border border-purple/20 text-purple rounded-sm"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Flag className="h-3 w-3 text-cyan" />
              Milestones
            </label>
            {milestones.map((ms, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-6 text-center flex-shrink-0">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={ms.title}
                  onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                  placeholder="Milestone description"
                  className="flex-1 bg-surface-1 border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
                />
                <input
                  type="text"
                  value={ms.amount}
                  onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                  placeholder="USDC"
                  className="w-24 bg-surface-1 border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple/30 transition-colors"
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestone}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground bg-surface-1 border border-border border-dashed rounded-sm hover:text-foreground hover:border-purple/20 transition-colors w-full justify-center"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Milestone
            </button>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center justify-center gap-2 w-full py-3 text-primary-foreground text-sm font-semibold rounded-sm transition-all ${
                submitted
                  ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                  : 'bg-gradient-primary hover:opacity-90'
              } disabled:opacity-70`}
            >
              {submitting ? (
                'Creating gig...'
              ) : submitted ? (
                'Gig Posted Successfully!'
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Gig & Create Escrow
                </>
              )}
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Escrow will be created on-chain when a freelancer is selected.
            </p>
            {submitted && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
                <div className="border border-emerald-500/20 bg-emerald-500/10 p-4 text-left">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    Demo Ready
                  </div>
                  <p className="mt-2 text-sm text-emerald-100/85">
                    The gig brief has been staged successfully. Open the agent to generate a hiring brief, shortlist plan, and escrow next steps.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleOpenAgent}
                  className="w-full border border-cyan/30 bg-cyan/10 py-3 text-[11px] font-black uppercase tracking-widest text-cyan transition-colors hover:bg-cyan/15"
                >
                  Open Agent Shortlist Flow
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default PostGigPage;

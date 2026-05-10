import { Zap, Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface-1">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 flex items-center justify-center bg-gradient-primary rounded-sm">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">
                Skill<span className="text-gradient">Chain</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              The AI-native talent marketplace for Web3. Find work, hire talent, and build
              reputation on-chain.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
              Platform
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Browse Jobs', to: '/jobs' },
                { label: 'Post a Gig', to: '/post' },
                { label: 'AI Agent', to: '/agent' },
                { label: 'Profile', to: '/profile' },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
              Resources
            </h4>
            <div className="space-y-2">
              {['Documentation', 'API Reference', 'Smart Contracts', 'FAQ'].map((l) => (
                <div
                  key={l}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
              Community
            </h4>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="#"
                className="h-8 w-8 flex items-center justify-center bg-surface-2 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-purple/30 transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                className="h-8 w-8 flex items-center justify-center bg-surface-2 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-purple/30 transition-colors"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            &copy; 2026 SkillChain AI. Built on Solana.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[11px] text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

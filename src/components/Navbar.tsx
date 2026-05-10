import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, Briefcase, User, PlusCircle, Bot, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/lib/auth';
import { getPrivyWalletAddress } from '@/lib/privy';

const navLinks = [
  { to: '/', label: 'Home', icon: Zap },
  { to: '/agent', label: 'AI Agent', icon: Bot },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/post', label: 'Post Gig', icon: PlusCircle },
  { to: '/profile', label: 'Profile', icon: User },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { login, logout, authenticated, user, mode } = useAppAuth();
  const walletAddress = getPrivyWalletAddress(user as never);
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-8 w-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-primary rounded-sm opacity-90 group-hover:opacity-100 transition-opacity" />
            <Zap className="relative h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Skill<span className="text-gradient">Chain</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-gradient-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {authenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-surface-1 border border-border rounded-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                <span className="text-[10px] font-mono font-medium text-muted-foreground">
                  {shortAddress || (user?.email?.address)}
                </span>
              </div>
              <div className="hidden lg:flex items-center rounded-sm border border-cyan/20 bg-cyan/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-cyan">
                {mode === 'privy' ? 'Privy' : 'Demo'}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="h-9 px-3 border-border hover:bg-surface-2 gap-2 text-xs font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          ) : (
            <Button 
              onClick={login}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground rounded-sm h-9 px-5 text-xs font-bold gap-2 shadow-glow-purple"
            >
              <Wallet className="h-3.5 w-3.5" />
              {mode === 'privy' ? 'Connect' : 'Demo Login'}
            </Button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-sm transition-colors ${
                      isActive
                        ? 'bg-surface-1 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              {!authenticated && (
                <button
                  onClick={login}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-purple bg-purple/10 rounded-sm mt-4"
                >
                  <Wallet className="h-4 w-4" />
                  {mode === 'privy' ? 'Connect Wallet' : 'Enter Demo Mode'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

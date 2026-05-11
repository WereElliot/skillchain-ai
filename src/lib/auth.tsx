import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { appConfig, integrationStatus } from '@/lib/config';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type AuthUser = {
  id?: string;
  email?: {
    address?: string;
  };
  github?: {
    username?: string;
    avatarUrl?: string;
  };
  wallet?: {
    address?: string;
  };
  linkedAccounts?: Array<{
    type?: string;
    address?: string;
  }>;
};

type AuthContextValue = {
  authenticated: boolean;
  user?: AuthUser | null;
  login: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isConfigured: boolean;
  mode: 'privy' | 'supabase' | 'demo';
};

const DEMO_STORAGE_KEY = 'skillchain-demo-auth';
const demoUser: AuthUser = {
  email: {
    address: 'demo@skillchain.ai',
  },
  github: {
    username: 'skillchain-demo',
  },
  wallet: {
    address: '7xKX5cD9r2P8mT4qY2Fw9gHb4N3eL8a2QpVm3Fp4demo',
  },
  linkedAccounts: [
    {
      type: 'wallet',
      address: '7xKX5cD9r2P8mT4qY2Fw9gHb4N3eL8a2QpVm3Fp4demo',
    },
  ],
};

const fallbackAuthValue: AuthContextValue = {
  authenticated: false,
  user: null,
  login: async () => ({ ok: false, error: 'Authentication is unavailable.' }),
  logout: () => undefined,
  isConfigured: false,
  mode: 'demo',
};

const FallbackAuthContext = createContext<AuthContextValue>(fallbackAuthValue);

type PrivyModule = typeof import('@privy-io/react-auth');

function PrivyAuthBridge({
  children,
  privyModule,
}: {
  children: ReactNode;
  privyModule: PrivyModule;
}) {
  const privy = privyModule.usePrivy();

  return (
    <FallbackAuthContext.Provider
      value={{
        authenticated: privy.authenticated,
        user: privy.user as AuthUser | null,
        login: async () => {
          privy.login();
          return { ok: true };
        },
        logout: privy.logout,
        isConfigured: true,
        mode: 'privy',
      }}
    >
      {children}
    </FallbackAuthContext.Provider>
  );
}

function LivePrivyProvider({ children }: { children: ReactNode }) {
  const [privyModule, setPrivyModule] = useState<PrivyModule | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void import('@privy-io/react-auth')
      .then((module) => {
        if (active) {
          setPrivyModule(module);
        }
      })
      .catch((error) => {
        console.error('Failed to load Privy runtime:', error);
        if (active) {
          setLoadFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loadFailed) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

  if (!privyModule) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

  const PrivyProvider = privyModule.PrivyProvider;

  return (
    <PrivyProvider
      appId={appConfig.privyAppId}
      config={{
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#a855f7',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <PrivyAuthBridge privyModule={privyModule}>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(DEMO_STORAGE_KEY);
    setAuthenticated(storedValue === 'true');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      user: authenticated ? demoUser : null,
      login: async () => {
        window.localStorage.setItem(DEMO_STORAGE_KEY, 'true');
        setAuthenticated(true);
        return { ok: true };
      },
      logout: () => {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
        setAuthenticated(false);
      },
      isConfigured: false,
      mode: 'demo',
    }),
    [authenticated],
  );

  return <FallbackAuthContext.Provider value={value}>{children}</FallbackAuthContext.Provider>;
}

function mapSupabaseUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const metadata = user.user_metadata || {};
  const userName =
    typeof metadata.user_name === 'string'
      ? metadata.user_name
      : typeof metadata.preferred_username === 'string'
        ? metadata.preferred_username
        : typeof metadata.name === 'string'
          ? metadata.name
          : undefined;
  const avatarUrl =
    typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined;

  return {
    id: user.id,
    email: user.email ? { address: user.email } : undefined,
    github: {
      username: userName,
      avatarUrl,
    },
  };
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return undefined;

    let mounted = true;

    void client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextUser = data.session?.user ? mapSupabaseUser(data.session.user) : null;
      setAuthenticated(Boolean(nextUser));
      setUser(nextUser);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ? mapSupabaseUser(session.user) : null;
      setAuthenticated(Boolean(nextUser));
      setUser(nextUser);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      user,
      login: async () => {
        const client = createSupabaseBrowserClient();
        if (!client) {
          return { ok: false, error: 'Supabase authentication is unavailable.' };
        }

        const { error } = await client.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/profile`,
          },
        });

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      },
      logout: () => {
        const client = createSupabaseBrowserClient();
        if (!client) return;

        void client.auth.signOut();
      },
      isConfigured: true,
      mode: 'supabase',
    }),
    [authenticated, user],
  );

  return <FallbackAuthContext.Provider value={value}>{children}</FallbackAuthContext.Provider>;
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (integrationStatus.privy) {
    return <LivePrivyProvider>{children}</LivePrivyProvider>;
  }

  if (integrationStatus.supabase) {
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
  }

  return <DemoAuthProvider>{children}</DemoAuthProvider>;
}

export function useAppAuth() {
  return useContext(FallbackAuthContext);
}

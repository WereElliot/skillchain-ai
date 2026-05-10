import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { appConfig, integrationStatus } from '@/lib/config';

type AuthUser = {
  email?: {
    address?: string;
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
  login: () => void;
  logout: () => void;
  isConfigured: boolean;
  mode: 'privy' | 'demo';
};

const DEMO_STORAGE_KEY = 'skillchain-demo-auth';
const demoUser: AuthUser = {
  email: {
    address: 'demo@skillchain.ai',
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
  login: () => undefined,
  logout: () => undefined,
  isConfigured: false,
  mode: 'demo',
};

const FallbackAuthContext = createContext<AuthContextValue>(fallbackAuthValue);

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy();

  return (
    <FallbackAuthContext.Provider
      value={{
        authenticated: privy.authenticated,
        user: privy.user as AuthUser | null,
        login: privy.login,
        logout: privy.logout,
        isConfigured: true,
        mode: 'privy',
      }}
    >
      {children}
    </FallbackAuthContext.Provider>
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
      login: () => {
        window.localStorage.setItem(DEMO_STORAGE_KEY, 'true');
        setAuthenticated(true);
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

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (!integrationStatus.privy) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

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
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

export function useAppAuth() {
  return useContext(FallbackAuthContext);
}

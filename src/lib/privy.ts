interface PrivyLikeUser {
  wallet?: {
    address?: string;
  };
  linkedAccounts?: Array<{
    type?: string;
    address?: string;
  }>;
}

export function getPrivyWalletAddress(user?: PrivyLikeUser | null) {
  if (!user) return undefined;

  if (user.wallet?.address) {
    return user.wallet.address;
  }

  const linkedWallet = user.linkedAccounts?.find(
    (account) => account.type?.toLowerCase().includes('wallet') && account.address,
  );

  return linkedWallet?.address;
}

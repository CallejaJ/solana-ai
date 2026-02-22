"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
})

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium text-foreground">
            Missing Privy App ID
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Set NEXT_PUBLIC_PRIVY_APP_ID in your environment variables. Get one
            at dashboard.privy.io
          </p>
        </div>
      </div>
    )
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#9945ff",
          walletChainType: "solana-only",
        },
        loginMethods: ["email", "wallet", "google"],
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

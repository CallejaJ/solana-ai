"use client"

import Image from "next/image"
import { usePrivy } from "@privy-io/react-auth"
import { useConnectedStandardWallets } from "@privy-io/react-auth/solana"
import { LogOut, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SolanaHeaderProps {
  network: "devnet" | "mainnet"
  onNetworkChange: (n: "devnet" | "mainnet") => void
}

export function SolanaHeader({ network, onNetworkChange }: SolanaHeaderProps) {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useConnectedStandardWallets()
  const activeWallet = wallets[0] ?? null

  const shortAddress = activeWallet?.address
    ? `${activeWallet.address.slice(0, 4)}...${activeWallet.address.slice(-4)}`
    : null

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-3 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden text-muted-foreground" />
        <Image src="/solana-logo.png" alt="Solana" width={18} height={18} />
        <span className="text-sm font-semibold text-foreground">Solana</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNetworkChange(network === "devnet" ? "mainnet" : "devnet")}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            network === "devnet"
              ? "bg-[#00c2ff]/10 text-[#00c2ff] hover:bg-[#00c2ff]/20"
              : "bg-accent/10 text-accent hover:bg-accent/20"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${network === "devnet" ? "bg-[#00c2ff]" : "bg-accent"}`} />
          {network}
        </button>
        {authenticated && shortAddress && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
            <Wallet className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-xs text-muted-foreground">
              {shortAddress}
            </span>
          </div>
        )}
        {ready && !authenticated && (
          <Button
            onClick={login}
            variant="ghost"
            size="sm"
            className="btn-solana-connect text-xs px-3"
          >
            Connect
          </Button>
        )}
        {authenticated && (
          <Button
            onClick={logout}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Disconnect</span>
          </Button>
        )}
      </div>
    </header>
  )
}

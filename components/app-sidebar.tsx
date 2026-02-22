"use client";

import { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, MessageSquare, Plus, Trash2, Droplets, History } from "lucide-react";
import type { ChatSession } from "@/hooks/use-chat-history";


interface AppSidebarProps {
  walletAddress: string | null;
  authenticated: boolean;
  network: "devnet" | "mainnet";
  onQuickAction: (prompt: string) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

const quickActions = [
  { label: "Check balance", prompt: "Check my wallet balance", icon: Wallet, color: "#9945ff" },
  { label: "Request airdrop", prompt: "Request 1 SOL airdrop to my wallet", icon: Droplets, color: "#00c2ff" },
  { label: "Recent transactions", prompt: "Show my recent transactions", icon: History, color: "#9945ff" },
];

function relativeTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AppSidebar({
  walletAddress,
  authenticated,
  network,
  onQuickAction,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: AppSidebarProps) {
  const { setOpen, isMobile } = useSidebar();
  const [balance, setBalance] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }
    const rpc =
      network === "mainnet"
        ? "https://api.mainnet-beta.solana.com"
        : "https://api.devnet.solana.com";
    new Connection(rpc, "confirmed")
      .getBalance(new PublicKey(walletAddress))
      .then((b: number) => setBalance(b / LAMPORTS_PER_SOL))
      .catch(() => setBalance(null));
  }, [walletAddress, network]);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={() => {
        if (!isMobile) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!isMobile) setOpen(false);
      }}
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="icon-solana-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
            <MessageSquare className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Solana Chat
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Wallet Info — hidden in icon mode */}
        {authenticated && walletAddress && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Wallet</SidebarGroupLabel>
              <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <div className="space-y-1.5 rounded-lg bg-sidebar-accent px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-sidebar-foreground/60">
                      {shortAddress}
                    </span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      Devnet
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold">
                    {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
                  </div>
                </div>
              </div>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Quick Actions — icons visible in icon mode, with tooltips */}
        {authenticated && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
              <SidebarMenu>
                {quickActions.filter(a => network === "mainnet" ? a.label !== "Request airdrop" : true).map((action) => (
                  <SidebarMenuItem key={action.label}>
                    <SidebarMenuButton
                      tooltip={action.label}
                      onClick={() => onQuickAction(action.prompt)}
                    >
                      <action.icon className={`h-4 w-4 ${action.color === "#00c2ff" ? "text-[#00c2ff]" : "text-accent"}`} />
                      <span>{action.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {/* Chat History — hidden in icon mode */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between px-1">
            <SidebarGroupLabel>Chat History</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={onNewSession}
              title="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <SidebarMenu>
            {sessions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-sidebar-foreground/40">
                No saved chats yet
              </p>
            ) : (
              sessions.map((session) => (
                <SidebarMenuItem
                  key={session.id}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center">
                    <SidebarMenuButton
                      isActive={session.id === currentSessionId}
                      onClick={() => onSelectSession(session)}
                      className="h-auto flex-1 py-2"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-xs leading-tight">
                          {session.title}
                        </span>
                        <span className="text-[10px] text-sidebar-foreground/40">
                          {relativeTime(session.updatedAt)}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    {hoveredId === session.id && (
                      <button
                        type="button"
                        title="Cerrar chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="ml-1 shrink-0 rounded p-0.5 text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

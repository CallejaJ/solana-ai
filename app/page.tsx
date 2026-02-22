"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePrivy } from "@privy-io/react-auth";
import {
  useConnectedStandardWallets,
  useStandardSignTransaction,
} from "@privy-io/react-auth/solana";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { SolanaHeader } from "@/components/solana-header";
import { ChatMessage } from "@/components/chat-message";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useChatHistory } from "@/hooks/use-chat-history";
import {
  ArrowUp,
  MessageSquare,
  Wallet,
  Droplets,
  Send,
  History,
  ShieldCheck,
  Mail,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [input, setInput] = useState("");
  const [network, setNetwork] = useState<"devnet" | "mainnet">("devnet");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authenticated, login } = usePrivy();

  const connection = useMemo(
    () =>
      new Connection(
        network === "mainnet"
          ? "https://api.mainnet-beta.solana.com"
          : "https://api.devnet.solana.com",
        "confirmed",
      ),
    [network],
  );
  const { wallets } = useConnectedStandardWallets();
  const { signTransaction } = useStandardSignTransaction();
  const activeWallet = wallets[0] ?? null;
  const walletAddress = activeWallet?.address ?? null;

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    saveSession,
    newSession,
    deleteSession,
  } = useChatHistory();

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
    }),
  );

  const { messages, sendMessage, addToolOutput, status, setMessages } = useChat(
    {
      transport: transport.current,
    },
  );

  const isLoading = status === "streaming" || status === "submitted";

  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [messages]);

  // Auto-save session on message changes
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      saveSession(currentSessionId, messages);
    }
  }, [messages, currentSessionId, saveSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input }, { body: { walletAddress, network } });
    setInput("");
  };

  const handleAddToolOutput = useCallback(
    (params: { tool: string; toolCallId: string; output: unknown }) => {
      addToolOutput(params);
    },
    [addToolOutput],
  );

  const handleSignAndSend = useCallback(
    async (recipientAddress: string, amount: number) => {
      if (!activeWallet) throw new Error("No wallet connected");

      const fromPubkey = new PublicKey(activeWallet.address);
      const toPubkey = new PublicKey(recipientAddress);
      const lamports = Math.round(amount * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports }),
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      const { signedTransaction } = await signTransaction({
        transaction: transaction.serialize({ verifySignatures: false }),
        wallet: activeWallet,
      });

      const txId = await connection.sendRawTransaction(signedTransaction);
      await connection.confirmTransaction(txId, "confirmed");
      return txId;
    },
    [activeWallet, signTransaction, connection],
  );

  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage({ text: prompt }, { body: { walletAddress, network } });
    },
    [sendMessage, walletAddress],
  );

  const handleNewSession = useCallback(() => {
    newSession();
    setMessages([]);
  }, [newSession, setMessages]);

  const handleSelectSession = useCallback(
    (session: { id: string; messages: unknown[] }) => {
      setCurrentSessionId(session.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessages(session.messages as any);
    },
    [setCurrentSessionId, setMessages],
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        walletAddress={walletAddress}
        authenticated={authenticated}
        network={network}
        onQuickAction={handleQuickAction}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={deleteSession}
      />
      <SidebarInset>
        <div className="flex h-svh min-w-0 flex-col overflow-hidden bg-background">
          <SolanaHeader network={network} onNetworkChange={setNetwork} />

          <main className="flex flex-1 flex-col overflow-hidden">
            {uniqueMessages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 pb-8 pt-32 sm:gap-10 sm:px-6 sm:pt-32 sm:pb-10">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="icon-solana-gradient flex h-14 w-14 items-center justify-center rounded-2xl sm:h-20 sm:w-20 sm:rounded-3xl">
                    <MessageSquare className="h-7 w-7 text-black sm:h-10 sm:w-10" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <h2 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">
                      Solana Chat Assistant
                    </h2>
                    <p className="max-w-xs text-pretty text-sm text-muted-foreground sm:max-w-md sm:text-base">
                      {authenticated
                        ? "Your AI-powered Solana wallet assistant. Use the sidebar to get started quickly."
                        : "Connect your wallet to get started with Solana operations."}
                    </p>
                  </div>
                  {!authenticated && (
                    <Button
                      onClick={login}
                      variant="ghost"
                      className="btn-solana-connect px-6 text-sm sm:px-8 sm:py-5 sm:text-base"
                    >
                      Connect Wallet
                    </Button>
                  )}
                </div>

                {/* FAQ / Features grid */}
                <div className="w-full max-w-3xl">
                  <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What can you do?
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
                    {[
                      {
                        icon: Wallet,
                        title: "Check Balance",
                        desc: "View your SOL balance in real time",
                      },
                      {
                        icon: Droplets,
                        title: "Free Airdrop",
                        desc: "Get devnet SOL instantly for testing",
                      },
                      {
                        icon: Send,
                        title: "Send SOL",
                        desc: "Transfer SOL to any Solana address",
                      },
                      {
                        icon: History,
                        title: "Tx History",
                        desc: "Browse your recent transactions",
                      },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-3 sm:gap-3 sm:p-4"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <p className="text-xs font-semibold text-foreground sm:text-sm">
                          {title}
                        </p>
                        <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-3xl">
                  <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Why Privy?
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-3">
                    {[
                      {
                        icon: Mail,
                        title: "No wallet needed",
                        desc: "Sign in with email or Google — a Solana wallet is created automatically for you.",
                      },
                      {
                        icon: Plug,
                        title: "Phantom & Backpack",
                        desc: "Already have a wallet? Connect it directly alongside your embedded wallet.",
                      },
                      {
                        icon: ShieldCheck,
                        title: "Secure key management",
                        desc: "Privy handles your keys securely. You never expose your seed phrase.",
                      },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3 sm:gap-4 sm:p-4"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 sm:h-8 sm:w-8">
                          <Icon className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground sm:text-sm">
                            {title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground sm:mt-1 sm:text-xs">
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/70">
                  {network === "mainnet"
                    ? "Running on Solana Mainnet · Real funds · Be careful"
                    : "Running on Solana Devnet · Test network only · No real funds"}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
                <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:gap-4">
                  {uniqueMessages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      addToolOutput={handleAddToolOutput}
                      signAndSend={activeWallet ? handleSignAndSend : null}
                    />
                  ))}
                  {isLoading &&
                    uniqueMessages[uniqueMessages.length - 1]?.role === "user" && (
                      <div className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                          <span className="text-xs font-bold text-accent">
                            AI
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-2xl bg-secondary px-4 py-3">
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            <div className="border-t border-border bg-background px-3 py-3 sm:px-4">
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex max-w-2xl items-end gap-2"
              >
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder={
                      authenticated
                        ? "Ask about your wallet..."
                        : "Connect wallet to start..."
                    }
                    disabled={isLoading || !authenticated}
                    rows={1}
                    className="w-full resize-none overflow-hidden rounded-xl border border-border bg-secondary px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading || !authenticated}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-opacity hover:bg-accent/90 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

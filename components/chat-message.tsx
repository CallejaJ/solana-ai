"use client";

import { useState, useCallback } from "react";
import type { UIMessage } from "ai";
import {
  ExternalLink,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: UIMessage;
  addToolOutput: (params: {
    tool: string;
    toolCallId: string;
    output: unknown;
  }) => void;
  signAndSend:
    | ((recipientAddress: string, amount: number) => Promise<string>)
    | null;
}

function SendTransactieonCard({
  toolCallId,
  args,
  state,
  result,
  addToolOutput,
  signAndSend,
}: {
  toolCallId: string;
  args: { recipientAddress: string; amount: number };
  state: string;
  result?: {
    confirmed: boolean;
    signature: string | null;
    error: string | null;
  };
  addToolOutput: (params: {
    tool: string;
    toolCallId: string;
    output: unknown;
  }) => void;
  signAndSend:
    | ((recipientAddress: string, amount: number) => Promise<string>)
    | null;
}) {
  const [signing, setSigning] = useState(false);

  const handleSign = useCallback(async () => {
    if (!signAndSend) return;
    setSigning(true);
    try {
      const signature = await signAndSend(args.recipientAddress, args.amount);
      addToolOutput({
        tool: "sendTransaction",
        toolCallId,
        output: { confirmed: true, signature, error: null },
      });
    } catch (err) {
      addToolOutput({
        tool: "sendTransaction",
        toolCallId,
        output: {
          confirmed: false,
          signature: null,
          error: err instanceof Error ? err.message : "Transaction failed",
        },
      });
    } finally {
      setSigning(false);
    }
  }, [signAndSend, args, toolCallId, addToolOutput]);

  if (state === "output" && result) {
    if (result.confirmed && result.signature) {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Transaction confirmed
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {result.signature.slice(0, 20)}...
            </p>
            <a
              href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p className="text-sm text-foreground">
          {result.error ?? "Transaction failed"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Send SOL
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">To</span>
          <span className="font-mono text-xs text-foreground">
            {args.recipientAddress.slice(0, 8)}...
            {args.recipientAddress.slice(-8)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="text-sm font-semibold text-foreground">
            {args.amount} SOL
          </span>
        </div>
      </div>
      {signAndSend ? (
        <Button
          size="sm"
          className="w-full"
          onClick={handleSign}
          disabled={signing}
        >
          {signing ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Signing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-3.5 w-3.5" /> Sign & Send
            </>
          )}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Connect wallet to send</p>
      )}
    </div>
  );
}

function ToolResult({
  toolName,
  result,
}: {
  toolName: string;
  result: unknown;
}) {
  if (toolName === "getBalance") {
    const r = result as {
      address?: string;
      balance?: number;
      cluster?: string;
      error?: string;
    };
    if (r.error) return <p className="text-sm text-destructive">{r.error}</p>;
    return (
      <div className="space-y-1 rounded-xl border border-border bg-secondary/40 p-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Balance
        </p>
        <p className="text-2xl font-bold text-foreground">
          {r.balance?.toFixed(4)} SOL
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {r.address?.slice(0, 8)}...{r.address?.slice(-8)} · {r.cluster}
        </p>
      </div>
    );
  }

  if (toolName === "requestAirdrop") {
    const r = result as {
      success?: boolean;
      signature?: string;
      amount?: number;
      explorerUrl?: string;
      error?: string;
    };
    if (!r.success) {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">{r.error}</p>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Airdrop successful — {r.amount} SOL received
          </p>
          {r.explorerUrl && (
            <a
              href={r.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (toolName === "getTransactionHistory") {
    const r = result as {
      transactions?: Array<{
        signature: string;
        fullSignature: string;
        err: string;
        explorerUrl: string;
      }>;
      error?: string;
    };
    if (r.error) return <p className="text-sm text-destructive">{r.error}</p>;
    if (!r.transactions?.length)
      return (
        <p className="text-sm text-muted-foreground">No transactions found</p>
      );
    return (
      <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent Transactions
        </p>
        <div className="space-y-1.5">
          {r.transactions.map((tx) => (
            <div
              key={tx.fullSignature}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    tx.err === "Success" ? "bg-green-500" : "bg-destructive"
                  }`}
                />
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {tx.signature}
                </span>
              </div>
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on Explorer"
                className="shrink-0 text-accent hover:text-accent/80"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function ChatMessage({
  message,
  addToolOutput,
  signAndSend,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    const textPart = message.parts?.find((p) => p.type === "text");
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-accent px-4 py-2.5">
          <p className="text-sm text-accent-foreground">
            {textPart ? textPart.text : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <span className="text-xs font-bold text-accent">AI</span>
      </div>
      <div className="flex max-w-[85%] flex-col gap-2">
        {message.parts?.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="rounded-2xl bg-secondary px-4 py-2.5">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {part.text}
                </p>
              </div>
            );
          }

          if (part.type === "tool-invocation") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { toolName, toolCallId, state, args, result } = (part as any).toolInvocation;

            if (toolName === "sendTransaction") {
              return (
                <SendTransactieonCard
                  key={toolCallId}
                  toolCallId={toolCallId}
                  args={args as { recipientAddress: string; amount: number }}
                  state={state === "result" ? "output" : "input"}
                  result={result}
                  addToolOutput={addToolOutput}
                  signAndSend={signAndSend}
                />
              );
            }

            if (state === "partial-call" || state === "call") {
              const label =
                toolName === "getBalance"
                  ? "Fetching balance..."
                  : toolName === "requestAirdrop"
                    ? "Requesting airdrop..."
                    : toolName === "getTransactionHistory"
                      ? "Loading transactions..."
                      : `Running ${toolName}...`;
              return (
                <div
                  key={toolCallId}
                  className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              );
            }

            if (state === "result") {
              return (
                <ToolResult
                  key={toolCallId}
                  toolName={toolName}
                  result={result}
                />
              );
            }
          }

          return null;
        })}
      </div>
    </div>
  );
}

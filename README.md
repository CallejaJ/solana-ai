# Solana AI Chat Assistant

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Solana](https://img.shields.io/badge/Solana-web3.js-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1-F55036?style=for-the-badge)](https://groq.com)
[![Privy](https://img.shields.io/badge/Privy-Auth-6B48FF?style=for-the-badge)](https://privy.io)
[![Vercel AI SDK](https://img.shields.io/badge/AI_SDK-v6-000000?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai)

*A conversational interface for Solana. Check balances, request airdrops, send SOL, and view transaction history — all through natural language, with no blockchain knowledge required.*

## The Problem It Solves

Interacting with Solana is technical by default. To do anything you need to understand public keys, lamports, transaction signing, RPC endpoints, and block explorers. Most users give up before they start.

This app removes that friction. You type "check my balance" and the AI queries the blockchain, converts lamports to SOL, and renders the result as a UI card. You type "send 0.5 SOL to X" and the AI prepares the transaction — you just approve it in one click. Combined with Privy's embedded wallets, even getting a wallet requires no setup: sign in with email or Google and one is created for you automatically.

## AI Tools

The model has access to four tools that execute real on-chain operations.

| Tool | Trigger | Execution |
|------|---------|-----------|
| `getBalance` | "check my balance", "how much SOL do I have" | Server-side via `connection.getBalance()` |
| `requestAirdrop` | "get free SOL", "airdrop me 1 SOL" | Server-side via `connection.requestAirdrop()` — devnet only |
| `sendTransaction` | "send SOL to...", "transfer..." | Client-side signing via Privy, then broadcast |
| `getTransactionHistory` | "show my transactions", "recent activity" | Server-side via `connection.getSignaturesForAddress()` |

`sendTransaction` is a human-in-the-loop tool: the model prepares the parameters but the transaction is never broadcast without explicit user approval.

## Authentication & Wallets

Powered by [Privy](https://privy.io), the app supports three connection methods.

| Method | Description |
|--------|-------------|
| **Email / Google** | A Solana embedded wallet is created automatically — no extension needed |
| **Phantom** | Connect an existing Phantom wallet directly |
| **Backpack** | Connect an existing Backpack wallet directly |

## Networks

| Network | Use case | Airdrop |
|---------|----------|---------|
| **Devnet** | Testing with free SOL | Available (up to 2 SOL) |
| **Mainnet** | Real funds | Not available |

Switch networks from the toggle in the header. The AI system prompt, RPC endpoint, and available tools all update automatically.

## System Architecture

| Component | Role |
|-----------|------|
| `app/api/chat/route.ts` | AI route: constructs tools per network, streams responses via Groq |
| `app/page.tsx` | Main chat UI: message rendering, session management, transaction signing |
| `components/app-sidebar.tsx` | Sidebar: wallet info, quick action shortcuts, chat history |
| `components/chat-message.tsx` | Renders messages and tool results as typed UI cards |
| `components/solana-header.tsx` | Header with network toggle and connected wallet address |
| `hooks/use-chat-history.ts` | localStorage session persistence |
| `lib/solana-tools.ts` | Zod schemas for AI tool input validation |

## Technology Stack

- **Framework**: Next.js 16, React 19, TypeScript 5.7
- **AI**: Vercel AI SDK v6, Groq (`llama-3.1-8b-instant`)
- **Blockchain**: `@solana/web3.js` v1
- **Auth & Wallets**: `@privy-io/react-auth` v2
- **UI**: shadcn/ui, Tailwind CSS v4, Lucide icons

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
GROQ_API_KEY=your_groq_api_key
```

Get a free Groq key at [console.groq.com](https://console.groq.com) and a Privy app at [dashboard.privy.io](https://dashboard.privy.io).

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Considerations

1. **RPC endpoints** — Public Solana endpoints are rate-limited. For production use a dedicated provider like [Helius](https://helius.dev) or [QuickNode](https://quicknode.com).
2. **Groq rate limits** — The free tier allows 14,400 requests/day and 131,072 tokens/min on `llama-3.1-8b-instant`. Upgrade to a paid plan for higher traffic.
3. **Chat history** — Sessions are stored in the browser's localStorage. Replace with a server-side store for multi-device access.
4. **Mainnet safety** — Consider adding an explicit confirmation dialog before any mainnet transaction to prevent accidental fund loss.

---

Built as a reference implementation for AI-powered blockchain interfaces using the Vercel AI SDK, Privy, and Solana Web3.js.

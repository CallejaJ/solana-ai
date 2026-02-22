import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
} from "ai"
import { groq } from "@ai-sdk/groq"
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import {
  getBalanceSchema,
  requestAirdropSchema,
  sendTransactionSchema,
  getTransactionHistorySchema,
} from "@/lib/solana-tools"

export const maxDuration = 30

function makeTools(connection: Connection, network: "devnet" | "mainnet") {
  const clusterParam = network === "mainnet" ? "" : "?cluster=devnet"

  const baseTools = {
    getBalance: tool({
      description:
        "Get the SOL balance for a Solana wallet address. Use this when the user asks to check their balance or any wallet balance.",
      inputSchema: getBalanceSchema,
      async execute({ address }) {
        try {
          const publicKey = new PublicKey(address)
          const balance = await connection.getBalance(publicKey)
          const solBalance = balance / LAMPORTS_PER_SOL
          return {
            address,
            balance: solBalance,
            lamports: balance,
            cluster: network,
          }
        } catch {
          return { error: "Invalid address or failed to fetch balance" }
        }
      },
    }),

    sendTransaction: tool({
      description:
        "Prepare a SOL transfer transaction. This will ask the user to confirm and sign on the client side. Use when the user wants to send SOL to another address.",
      inputSchema: sendTransactionSchema,
    }),

    getTransactionHistory: tool({
      description:
        "Get recent transaction signatures for a wallet address. Use when the user asks about their transaction history or recent activity.",
      inputSchema: getTransactionHistorySchema,
      async execute({ address, limit }) {
        try {
          const publicKey = new PublicKey(address)
          const signatures = await connection.getSignaturesForAddress(publicKey, {
            limit,
          })
          return {
            address,
            transactions: signatures.map((sig) => ({
              signature: sig.signature.slice(0, 20) + "...",
              fullSignature: sig.signature,
              slot: sig.slot,
              err: sig.err ? "Failed" : "Success",
              blockTime: sig.blockTime
                ? new Date(sig.blockTime * 1000).toISOString()
                : null,
              explorerUrl: `https://explorer.solana.com/tx/${sig.signature}${clusterParam}`,
            })),
          }
        } catch {
          return { error: "Failed to fetch transaction history" }
        }
      },
    }),
  }

  if (network === "devnet") {
    return {
      ...baseTools,
      requestAirdrop: tool({
        description:
          "Request a devnet SOL airdrop (faucet) to a wallet address. Only works on devnet. Use when user asks for free SOL or test tokens.",
        inputSchema: requestAirdropSchema,
        async execute({ address, amount }) {
          try {
            const publicKey = new PublicKey(address)
            const signature = await connection.requestAirdrop(
              publicKey,
              Math.round(amount * LAMPORTS_PER_SOL)
            )
            await connection.confirmTransaction(signature, "confirmed")
            return {
              success: true,
              signature,
              amount,
              address,
              explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
            }
          } catch {
            return {
              success: false,
              error:
                "Airdrop failed. Devnet faucet may be rate-limited, try again later.",
            }
          }
        },
      }),
    }
  }

  return baseTools
}

export async function POST(req: Request) {
  const body = await req.json()
  const messages = body.messages ?? []
  const walletAddress: string | null = body.walletAddress ?? null
  const network: "devnet" | "mainnet" = body.network === "mainnet" ? "mainnet" : "devnet"

  const rpcUrl =
    network === "mainnet"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com"
  const connection = new Connection(rpcUrl, "confirmed")
  const tools = makeTools(connection, network)

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system: `You are a Solana blockchain assistant. You help users manage their Solana wallets on ${network}.

Current network: ${network}
Current user wallet address: ${walletAddress || "Not connected"}

IMPORTANT: You MUST always call the appropriate tool for ANY blockchain question. Never answer blockchain data from memory or make assumptions — always invoke a tool to get real data.
- Balance questions → call getBalance
- Airdrop/faucet requests → call requestAirdrop${network === "mainnet" ? " (NOT available on mainnet, tell the user)" : ""}
- Send/transfer SOL → call sendTransaction
- Transaction history/recent activity → call getTransactionHistory

Rules:
- When the user asks about "my balance" or "my wallet", use their wallet address: ${walletAddress || "Not connected"}
- If no wallet is connected, ask the user to connect using the button in the header
- For sending transactions, always confirm recipient and amount before proceeding
- ${network === "mainnet" ? "This is MAINNET — real funds are at stake. Always warn before any send transaction." : "This is devnet (test network) — no real funds involved."}
- Be concise. Format SOL amounts to 4 decimal places
- Always include explorer links when showing transaction results`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}

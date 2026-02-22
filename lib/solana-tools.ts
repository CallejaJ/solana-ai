import { z } from "zod"

export const getBalanceSchema = z.object({
  address: z
    .string()
    .describe("The Solana wallet public key address to check balance for"),
})

export const requestAirdropSchema = z.object({
  address: z
    .string()
    .describe("The Solana wallet public key address to airdrop SOL to"),
  amount: z
    .number()
    .min(0.1)
    .max(2)
    .describe("Amount of SOL to airdrop (0.1 to 2)"),
})

export const sendTransactionSchema = z.object({
  recipientAddress: z.string().describe("The recipient Solana wallet address"),
  amount: z.number().positive().describe("Amount of SOL to send"),
})

export const sendTransactionOutputSchema = z.object({
  confirmed: z.boolean(),
  signature: z.string().nullable(),
  error: z.string().nullable(),
})

export const getTransactionHistorySchema = z.object({
  address: z
    .string()
    .describe("The Solana wallet address to get transaction history for"),
  limit: z
    .number()
    .min(1)
    .max(10)
    .describe("Number of recent transactions to fetch (1-10)"),
})

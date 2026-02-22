"use client"

import { useState, useEffect, useCallback } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChatSession = { id: string; title: string; messages: any[]; updatedAt: number }

const STORAGE_KEY = "solana-chat-sessions"

function loadFromStorage(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(messages: any[]): string {
  const first = messages.find((m) => m.role === "user")
  if (!first) return "New chat"
  if (typeof first.content === "string") return first.content.slice(0, 45)
  if (Array.isArray(first.content)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = first.content.find((p: any) => p.type === "text")
    return part?.text?.slice(0, 45) ?? "New chat"
  }
  if (Array.isArray(first.parts)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = first.parts.find((p: any) => p.type === "text")
    return part?.text?.slice(0, 45) ?? "New chat"
  }
  return "New chat"
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")

  useEffect(() => {
    setSessions(loadFromStorage())
    setCurrentSessionId(crypto.randomUUID())
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveSession = useCallback((id: string, messages: any[]) => {
    if (!id || messages.length === 0) return
    const title = extractTitle(messages)
    setSessions((prev) => {
      const without = prev.filter((s) => s.id !== id)
      const updated: ChatSession = { id, title, messages, updatedAt: Date.now() }
      const next = [updated, ...without]
      persist(next)
      return next
    })
  }, [])

  const newSession = useCallback(() => {
    const id = crypto.randomUUID()
    setCurrentSessionId(id)
    return id
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { sessions, currentSessionId, setCurrentSessionId, saveSession, newSession, deleteSession }
}

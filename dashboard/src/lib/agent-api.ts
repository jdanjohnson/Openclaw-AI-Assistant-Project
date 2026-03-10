import type { Task, EmailSummaryData, SyncStatus } from './types'

type MessageHandler = (data: Record<string, unknown>) => void

interface AgentConnection {
  ws: WebSocket | null
  connected: boolean
  onMessage: MessageHandler | null
  onStatusChange: ((connected: boolean) => void) | null
}

const connection: AgentConnection = {
  ws: null,
  connected: false,
  onMessage: null,
  onStatusChange: null,
}

let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_DELAY = 30000
const BASE_RECONNECT_DELAY = 2000

export function connectToAgent(
  gatewayUrl: string,
  onMessage: MessageHandler,
  onStatusChange: (connected: boolean) => void
): () => void {
  connection.onMessage = onMessage
  connection.onStatusChange = onStatusChange

  function getReconnectDelay(): number {
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts),
      MAX_RECONNECT_DELAY
    )
    return delay
  }

  function connect() {
    if (connection.ws) {
      try { connection.ws.close() } catch { /* ignore */ }
    }

    let ws: WebSocket
    try {
      ws = new WebSocket(gatewayUrl)
    } catch (err) {
      console.error('[agent-api] Failed to create WebSocket:', err)
      onStatusChange(false)
      reconnectTimer = setTimeout(connect, getReconnectDelay())
      reconnectAttempts++
      return
    }
    connection.ws = ws

    ws.onopen = () => {
      connection.connected = true
      reconnectAttempts = 0
      onStatusChange(true)
      console.log('[agent-api] Connected to gateway')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (connection.onMessage) {
          connection.onMessage(data)
        }
      } catch {
        if (connection.onMessage) {
          connection.onMessage({ type: 'raw', text: event.data })
        }
      }
    }

    ws.onclose = (event) => {
      const wasConnected = connection.connected
      connection.connected = false
      onStatusChange(false)
      if (wasConnected) {
        console.log('[agent-api] Connection closed (code:', event.code, '). Reconnecting...')
      } else {
        console.log('[agent-api] Connection failed. Gateway may not be running. Retrying in', Math.round(getReconnectDelay() / 1000), 's...')
      }
      reconnectTimer = setTimeout(connect, getReconnectDelay())
      reconnectAttempts++
    }

    ws.onerror = () => {
      // onclose will fire after this — don't double-handle
    }
  }

  connect()

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (connection.ws) {
      try { connection.ws.close() } catch { /* ignore */ }
    }
    connection.ws = null
    connection.connected = false
    reconnectAttempts = 0
  }
}

export function sendMessage(message: string): boolean {
  if (!connection.ws || !connection.connected) return false
  connection.ws.send(JSON.stringify({
    type: 'chat.send',
    content: message,
  }))
  return true
}

export function isConnected(): boolean {
  return connection.connected
}

export function sendCommand(command: string): boolean {
  return sendMessage(command)
}

export function requestTasks(filters?: {
  status?: string
  assignee?: string
  project?: string
}): boolean {
  const parts = ['list tasks']
  if (filters?.status) parts.push(`status:${filters.status}`)
  if (filters?.assignee) parts.push(`assignee:${filters.assignee}`)
  if (filters?.project) parts.push(`project:${filters.project}`)
  return sendMessage(parts.join(' '))
}

export function requestEmailSummary(): boolean {
  return sendMessage('show email summary')
}

export function requestTriage(opts?: {
  limit?: number
  timeframe?: string
}): boolean {
  const parts = ['triage my inbox']
  if (opts?.limit) parts.push(`limit:${opts.limit}`)
  if (opts?.timeframe) parts.push(`timeframe:${opts.timeframe}`)
  return sendMessage(parts.join(' '))
}

export function requestFollowUps(): boolean {
  return sendMessage('check follow-ups')
}

export function parseTasksFromResponse(data: Record<string, unknown>): Task[] | null {
  if (data.type === 'tool_result' && data.toolName === 'list_tasks') {
    const details = data.details as { tasks?: Task[] }
    return details?.tasks || null
  }
  return null
}

export function parseEmailSummaryFromResponse(data: Record<string, unknown>): EmailSummaryData | null {
  if (data.type === 'tool_result' && data.toolName === 'run_email_triage') {
    const details = data.details as { summary?: Record<string, number> }
    if (details?.summary) {
      return {
        counts: details.summary as Record<string, number> as EmailSummaryData['counts'],
        followUps: { needsReply: 0, awaitingReply: 0, needsAction: 0, overdue: 0 },
      }
    }
  }
  return null
}

export function parseSyncStatus(data: Record<string, unknown>): SyncStatus | null {
  if (data.type === 'sync_status') {
    return data as unknown as SyncStatus
  }
  return null
}

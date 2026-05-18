export interface AgentActivity {
  id: string
  action: string
  target: string
  time: string
  status: 'success' | 'running' | 'failed'
  duration?: string
  result?: string
  steps?: string[]
}

export interface Agent {
  id: string
  name: string
  avatar: string
  description: string
  status: 'online' | 'busy' | 'offline'
  capabilities: string[]
  model: string
  lastUsed: string
  totalRuns: number
  activities: AgentActivity[]
  currentTask?: string
  workspaceId?: string
}

export interface Workspace {
  id: string
  name: string
  agent?: Agent
  messages: Message[]
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

export interface User {
  id: string
  name: string
  avatar?: string
  phone?: string
  email?: string
  plan: string
  remainingQuota: number
  totalQuota: number
  createdAt: string
}

export interface ExecStep {
  title: string
  status: 'pending' | 'running' | 'done' | 'error'
  logs: string[]
}

export interface WorkspaceExecution {
  steps: ExecStep[]
  progress: number
  logs: string[]
  running: boolean
  startedAt: number
}

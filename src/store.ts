import { create } from 'zustand'
import type { Agent, AgentActivity, Workspace, Message, ExecStep, WorkspaceExecution, User, HistoryResultItem } from './types'

const defaultReplies = [
  '收到你的任务，正在处理中…\n\n初步分析完成，以下是结果摘要：\n\n1. 任务目标已确认\n2. 数据采集完毕\n3. 分析报告生成中\n\n需要我继续深入分析吗？',
  '已完成你的请求。摘要如下：\n\n- 关键信息已提取\n- 结构化数据已整理\n- 输出文档已准备就绪\n\n你可以继续提出更多需求。',
  '任务执行完毕，以下是概要：\n\n- 处理了 3 个子任务\n- 所有步骤均通过验证\n- 结果已保存\n\n如有需要调整的地方请告诉我。',
]

function getAgentReply(): string {
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function getTime() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const cancelledExecs = new Set<string>()

interface AppStore {
  isLoggedIn: boolean
  user: User | null
  showLoginModal: boolean
  loginSource: 'sidebar' | 'build'
  setShowLoginModal: (v: boolean, source?: 'sidebar' | 'build') => void
  login: (user: User) => void
  logout: () => void
  mockLogin: () => void

  agents: Agent[]
  workspaces: Workspace[]
  selectedWorkspaceId: string
  selectedAgentId: string
  sidebarCollapsed: boolean
  detailVisible: boolean

  executions: Record<string, WorkspaceExecution>

  selectWorkspace: (id: string) => void
  createWorkspace: (name: string) => void
  renameWorkspace: (id: string, name: string) => void
  deleteWorkspace: (id: string) => void
  clearWorkspaceMessages: (id: string) => void

  selectAgent: (id: string) => void
  createAgent: (name: string, description: string, model?: string, capabilities?: string[], workspaceId?: string) => string
  deleteAgent: (id: string) => void
  addAgentActivity: (agentId: string, activity: AgentActivity) => void
  updateAgentActivity: (agentId: string, activityId: string, update: Partial<AgentActivity>) => void
  updateAgentStatus: (agentId: string, status: Agent['status'], currentTask?: string) => void

  sendMessage: (content: string) => void

  toggleSidebar: () => void
  toggleDetail: () => void
  setDetailVisible: (v: boolean) => void

  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  agentHistoryOpen: boolean
  setAgentHistoryOpen: (v: boolean) => void

  pendingActivityModal: { agentId: string; activityId: string } | null
  setPendingActivityModal: (data: { agentId: string; activityId: string } | null) => void

  detailDefaultTab: 'detail' | 'history' | null
  setDetailDefaultTab: (tab: 'detail' | 'history' | null) => void

  historyResults: HistoryResultItem[]
  addHistoryResult: (item: HistoryResultItem) => void
  pendingHistoryId: string | null
  setPendingHistoryId: (id: string | null) => void

  startExecution: (wsId: string, steps: ExecStep[], onComplete: () => void) => void
  cancelExecution: (wsId: string) => void
  clearExecution: (wsId: string) => void
}

export const useStore = create<AppStore>((set, get) => ({
  isLoggedIn: false,
  user: null,
  showLoginModal: false,
  loginSource: 'sidebar',
  setShowLoginModal: (v, source) => set({ showLoginModal: v, ...(source ? { loginSource: source } : {}) }),

  login: (user) => set({ isLoggedIn: true, user, showLoginModal: false }),

  logout: () => set({ isLoggedIn: false, user: null }),

  mockLogin: () => {
    set({
      isLoggedIn: true,
      user: {
        id: 'u_mock_001',
        name: 'Fly',
        phone: '138****8888',
        email: undefined,
        plan: '个人版',
        remainingQuota: 3,
        totalQuota: 3,
        createdAt: '2026-05-18',
      },
    })
  },

  agents: [],
  workspaces: [],
  selectedWorkspaceId: '',
  selectedAgentId: '',
  sidebarCollapsed: false,
  detailVisible: false,

  executions: {},

  selectWorkspace: (id) => {
    const prev = get().selectedWorkspaceId
    if (prev !== id) {
      set({ selectedWorkspaceId: id, detailVisible: false })
    }
  },

  createWorkspace: (name) => {
    const ws: Workspace = {
      id: generateId(),
      name,
      messages: [],
      updatedAt: getTime(),
    }
    set((state) => ({
      workspaces: [ws, ...state.workspaces],
      selectedWorkspaceId: ws.id,
    }))
  },

  renameWorkspace: (id, name) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, name } : w,
      ),
    }))
  },

  deleteWorkspace: (id) => {
    set((state) => {
      const filtered = state.workspaces.filter((w) => w.id !== id)
      const newSelected = state.selectedWorkspaceId === id
        ? (filtered[0]?.id || '')
        : state.selectedWorkspaceId
      const { [id]: _, ...remainingExecs } = state.executions
      return { workspaces: filtered, selectedWorkspaceId: newSelected, executions: remainingExecs }
    })
  },

  clearWorkspaceMessages: (id) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, messages: [] } : w,
      ),
    }))
  },

  selectAgent: (id) => {
    set({ selectedAgentId: id, detailVisible: true })
  },

  createAgent: (name, description, model = 'GPT-4o', capabilities = [], workspaceId) => {
    const initials = name.length >= 2
      ? name.slice(0, 2).toUpperCase()
      : name.toUpperCase()
    const agent: Agent = {
      id: generateId(),
      name,
      avatar: initials,
      description,
      status: 'busy',
      capabilities: capabilities.length > 0 ? capabilities : ['通用任务'],
      model,
      lastUsed: '刚刚',
      totalRuns: 0,
      activities: [],
      workspaceId,
    }
    set((state) => ({
      agents: [...state.agents, agent],
      selectedAgentId: agent.id,
      detailVisible: true,
    }))
    return agent.id
  },

  deleteAgent: (id) => {
    set((state) => {
      const filtered = state.agents.filter((a) => a.id !== id)
      const newSelected = state.selectedAgentId === id
        ? (filtered[0]?.id || '')
        : state.selectedAgentId
      return {
        agents: filtered,
        selectedAgentId: newSelected,
        detailVisible: newSelected ? state.detailVisible : false,
      }
    })
  },

  addAgentActivity: (agentId, activity) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, activities: [activity, ...a.activities] } : a,
      ),
    }))
  },

  updateAgentActivity: (agentId, activityId, update) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { ...a, activities: a.activities.map((act) => act.id === activityId ? { ...act, ...update } : act) }
          : a,
      ),
    }))
  },

  updateAgentStatus: (agentId, status, currentTask) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, status, currentTask, lastUsed: '刚刚' } : a,
      ),
    }))
  },

  sendMessage: (content) => {
    const state = get()
    let wsId = state.selectedWorkspaceId
    let ws = state.workspaces.find((w) => w.id === wsId)

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: getTime(),
    }

    if (!ws) {
      const wsName = content.length > 20 ? content.slice(0, 20) + '…' : content
      const newWs: Workspace = {
        id: generateId(),
        name: wsName,
        messages: [userMsg],
        updatedAt: getTime(),
      }
      set((prev) => ({
        workspaces: [newWs, ...prev.workspaces],
        selectedWorkspaceId: newWs.id,
      }))
      wsId = newWs.id
    } else {
      set((prev) => ({
        workspaces: prev.workspaces.map((w) =>
          w.id === wsId
            ? { ...w, messages: [...w.messages, userMsg], updatedAt: getTime() }
            : w,
        ),
      }))
    }

    const delay = 800 + Math.random() * 700
    const targetWsId = wsId
    setTimeout(() => {
      const agentMsg: Message = {
        id: generateId(),
        role: 'agent',
        content: getAgentReply(),
        timestamp: getTime(),
      }

      set((prev) => ({
        workspaces: prev.workspaces.map((w) =>
          w.id === targetWsId
            ? { ...w, messages: [...w.messages, agentMsg], updatedAt: getTime() }
            : w,
        ),
      }))
    }, delay)
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDetail: () => set((s) => ({ detailVisible: !s.detailVisible })),
  setDetailVisible: (v) => set({ detailVisible: v }),

  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v, agentHistoryOpen: false }),
  agentHistoryOpen: false,
  setAgentHistoryOpen: (v) => set({ agentHistoryOpen: v, settingsOpen: false }),

  pendingActivityModal: null,
  setPendingActivityModal: (data) => set({ pendingActivityModal: data }),

  detailDefaultTab: null,
  setDetailDefaultTab: (tab) => set({ detailDefaultTab: tab }),

  historyResults: [],
  addHistoryResult: (item) => set((state) => ({
    historyResults: [item, ...state.historyResults],
  })),
  pendingHistoryId: null,
  setPendingHistoryId: (id) => set({ pendingHistoryId: id }),

  startExecution: async (wsId, steps, onComplete) => {
    cancelledExecs.delete(wsId)

    const initialSteps = steps.map(s => ({ ...s, status: 'pending' as const, logs: [...s.logs] }))
    set((state) => ({
      executions: {
        ...state.executions,
        [wsId]: { steps: initialSteps, progress: 0, logs: [], running: true, startedAt: Date.now() },
      },
    }))

    for (let i = 0; i < initialSteps.length; i++) {
      if (cancelledExecs.has(wsId)) {
        cancelledExecs.delete(wsId)
        set((state) => {
          const { [wsId]: _, ...rest } = state.executions
          return { executions: rest }
        })
        return
      }

      set((state) => {
        const exec = state.executions[wsId]
        if (!exec) return state
        const newSteps = exec.steps.map((s, idx) =>
          idx === i ? { ...s, status: 'running' as const } : s
        )
        return { executions: { ...state.executions, [wsId]: { ...exec, steps: newSteps } } }
      })

      for (const log of steps[i].logs) {
        if (cancelledExecs.has(wsId)) {
          cancelledExecs.delete(wsId)
          set((state) => {
            const { [wsId]: _, ...rest } = state.executions
            return { executions: rest }
          })
          return
        }
        await new Promise(r => setTimeout(r, 250 + Math.random() * 350))
        set((state) => {
          const exec = state.executions[wsId]
          if (!exec) return state
          return {
            executions: {
              ...state.executions,
              [wsId]: { ...exec, logs: [...exec.logs, `[${getTime()}] ${log}`] },
            },
          }
        })
      }

      set((state) => {
        const exec = state.executions[wsId]
        if (!exec) return state
        const newSteps = exec.steps.map((s, idx) =>
          idx === i ? { ...s, status: 'done' as const } : s
        )
        const progress = Math.round(((i + 1) / initialSteps.length) * 100)
        return { executions: { ...state.executions, [wsId]: { ...exec, steps: newSteps, progress } } }
      })
    }

    set((state) => {
      const exec = state.executions[wsId]
      if (!exec) return state
      return { executions: { ...state.executions, [wsId]: { ...exec, running: false } } }
    })

    onComplete()
  },

  cancelExecution: (wsId) => {
    cancelledExecs.add(wsId)
  },

  clearExecution: (wsId) => {
    set((state) => {
      const { [wsId]: _, ...rest } = state.executions
      return { executions: rest }
    })
  },
}))

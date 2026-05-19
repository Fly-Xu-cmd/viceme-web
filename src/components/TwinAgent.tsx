import { useState, useRef, useEffect, useCallback } from 'react'
import { Input, Tooltip, message, Modal, notification, Popover } from 'antd'
import { useStore } from '../store'
import {
  ReloadOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  EllipsisOutlined,
  ThunderboltOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  ExclamationCircleFilled,
  RocketOutlined,
  FileTextOutlined,
  CloseOutlined,
  PlusOutlined,
  RightOutlined,
  PictureOutlined,
  AudioOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  SearchOutlined,
  LinkOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  WechatOutlined,
  AppleOutlined,
  GoogleOutlined,
  MailOutlined,
  MobileOutlined,
  ScanOutlined,
  DownOutlined,
  NotificationOutlined,
  CloudOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'

import type { ExecStep } from '../types'

const { TextArea } = Input

type Phase = 'idle' | 'clarifying' | 'planning' | 'executing' | 'completed'

interface TwinMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  type: 'text' | 'options' | 'plan' | 'result'
  options?: OptionCard
  plan?: WorkflowPlan
  researchResult?: ResearchResult
  historyResultId?: string
}

interface OptionCard {
  question: string
  choices: { id: string; label: string; description?: string }[]
  allowCustom: boolean
  dismissed: boolean
  selected?: string
  customValue?: string
}

interface WorkflowPlan {
  summary: string
  steps: { title: string; description: string; icon: string }[]
  estimatedTime: string
}

interface SavedConversation {
  phase: Phase
  messages: TwinMessage[]
  userTask: string
  selectedTier: string
  clarifyStep: number
  guideAnswered: boolean
  logsExpanded: boolean
  currentAgentId: string | null
}

const savedConversations = new Map<string, SavedConversation>()

interface ResearchResult {
  personName: string
  summary: string
  contactCount: number
  socialPlatformCount: number
  researchDepth: string
  duration: string
  topChannels: { rank: number; name: string; reason: string }[]
  contacts: { type: string; value: string }[]
  socialPlatforms: { name: string; active: boolean; frequency: string }[]
  notionLink: string
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function ts() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  search: <SearchOutlined />,
  globe: <GlobalOutlined />,
  link: <LinkOutlined />,
  file: <FileTextOutlined />,
  team: <TeamOutlined />,
  safe: <SafetyCertificateOutlined />,
}

const QUICK_PROMPTS = [
  '帮我做一份行业竞品分析报告',
  '整理上周会议纪要并提取待办',
  '写一封正式的商务合作邮件',
  '调研某个领域的最新技术趋势',
  '帮我搭建一个项目排期计划',
  '生成一份数据分析可视化方案',
]


const CLARIFICATION_STEPS: { question: string; choices: { id: string; label: string; description?: string }[] }[] = [
  {
    question: '请选择调研档位：',
    choices: [
      { id: 'quick', label: '快速版', description: '约 5 分钟 · 基础信息 + 主流社交账号' },
      { id: 'full', label: '完整版', description: '约 10-15 分钟 · 全维度分析 + 精准触达策略' },
    ],
  },
  {
    question: '调研文档存储到哪里？',
    choices: [
      { id: 'new-notion', label: '新建 Notion 文档', description: '自动创建一份新的结构化文档' },
      { id: 'existing-notion', label: '指定已有 Notion 文档', description: '追加到你选择的现有文档中' },
    ],
  },
]

function buildMockPlan(userTask: string, tier: string): WorkflowPlan {
  const isFull = tier === 'full' || tier === '完整版'
  return {
    summary: `基于你的调研需求「${userTask.length > 40 ? userTask.slice(0, 40) + '…' : userTask}」，我制定了以下调研计划：`,
    steps: [
      { title: '全网社交账号检索', description: '搜索 LinkedIn、Twitter/X、YouTube、微信公众号、知乎等主流平台', icon: 'search' },
      { title: '公开信息采集', description: '从个人网站、新闻报道、演讲视频、博客文章中提取关键信息', icon: 'globe' },
      { title: '联系方式提取与验证', description: '提取邮箱、社交 DM、助理联系方式等，并交叉验证有效性', icon: 'link' },
      ...(isFull ? [
        { title: '渠道活跃度分析', description: '分析各平台发文频率、互动率、最近活跃时间，评估触达成功率', icon: 'team' },
        { title: '触达策略生成', description: '基于活跃度数据生成最优触达渠道排序和破冰话术建议', icon: 'safe' },
      ] : []),
      { title: '结构化文档输出', description: '生成中英双语 Notion 人物档案，包含所有调研数据', icon: 'file' },
    ],
    estimatedTime: isFull ? '10-15 分钟' : '约 5 分钟',
  }
}

const EXEC_STEPS_QUICK: ExecStep[] = [
  { title: '初始化调研环境', status: 'pending', logs: [
    '[init] 启动 AI 调研引擎…',
    '[init] 加载搜索工具: LinkedIn Search, Twitter API, Google Custom Search…',
    '[init] 调研环境就绪',
  ]},
  { title: '全网社交账号检索', status: 'pending', logs: [
    '[search] 正在搜索 LinkedIn…',
    '[search] 找到匹配的 LinkedIn 主页',
    '[search] 正在搜索 Twitter/X…',
    '[search] 找到 Twitter 账号，粉丝 12.3K',
    '[search] 正在搜索其他平台…',
    '[search] 共发现 6 个社交平台账号',
  ]},
  { title: '公开信息采集', status: 'pending', logs: [
    '[crawl] 抓取个人网站内容…',
    '[crawl] 抓取近期新闻报道 (3 篇)',
    '[crawl] 提取演讲 & 播客信息',
    '[crawl] 信息采集完成，共 47 条有效数据',
  ]},
  { title: '联系方式提取与验证', status: 'pending', logs: [
    '[extract] 从公开信息中提取联系方式…',
    '[extract] 发现邮箱地址 2 个',
    '[extract] 发现社交 DM 入口 3 个',
    '[verify] 邮箱有效性验证通过',
    '[extract] 共提取 5 种联系方式',
  ]},
  { title: '生成结构化文档', status: 'pending', logs: [
    '[doc] 生成中文版人物档案…',
    '[doc] 生成英文版人物档案…',
    '[doc] 写入 Notion 文档…',
    '[doc] Notion 文档创建成功 ✓',
  ]},
]

const EXEC_STEPS_FULL: ExecStep[] = [
  ...EXEC_STEPS_QUICK.slice(0, 4),
  { title: '渠道活跃度分析', status: 'pending', logs: [
    '[analyze] 分析 LinkedIn 发文频率: 平均 3 次/周',
    '[analyze] 分析 Twitter 互动率: 2.8%',
    '[analyze] 分析最近活跃时间: LinkedIn 2 小时前',
    '[analyze] 生成渠道活跃度评分…',
    '[analyze] 活跃度分析完成',
  ]},
  { title: '触达策略生成', status: 'pending', logs: [
    '[strategy] 综合分析触达成功率…',
    '[strategy] 生成 TOP3 最优触达渠道排序',
    '[strategy] 生成破冰话术建议 (中/英)',
    '[strategy] 策略报告就绪',
  ]},
  { title: '生成结构化文档', status: 'pending', logs: [
    '[doc] 生成中文版人物档案…',
    '[doc] 生成英文版人物档案…',
    '[doc] 附加触达策略到档案…',
    '[doc] 写入 Notion 文档…',
    '[doc] Notion 文档创建成功 ✓',
  ]},
]

function buildMockResult(userTask: string): ResearchResult {
  const nameMatch = userTask.match(/[\u4e00-\u9fa5]{2,4}|[A-Z][a-z]+ [A-Z][a-z]+/)
  const personName = nameMatch?.[0] || '目标人物'

  return {
    personName,
    summary: `${personName} 的全网调研已完成，共找到 5 种有效联系方式和 8 个社交平台账号。`,
    contactCount: 5,
    socialPlatformCount: 8,
    researchDepth: '完整版',
    duration: '12 分 35 秒',
    topChannels: [
      { rank: 1, name: 'LinkedIn', reason: '最活跃平台，平均每周发文 3 次，回复 DM 概率约 40%' },
      { rank: 2, name: 'Twitter/X', reason: '定期参与行业讨论，适合通过评论互动建立初始连接' },
      { rank: 3, name: '个人网站', reason: '设有联系表单，通常 48 小时内回复商务合作类邮件' },
    ],
    contacts: [
      { type: '商务邮箱', value: 'b]z@***.com' },
      { type: 'LinkedIn DM', value: '可直接发送' },
      { type: 'Twitter DM', value: '需对方关注后开放' },
      { type: '网站联系表单', value: 'https://***.com/contact' },
      { type: '助理邮箱', value: 'asst@***.com' },
    ],
    socialPlatforms: [
      { name: 'LinkedIn', active: true, frequency: '每周 3 次' },
      { name: 'Twitter/X', active: true, frequency: '每周 5 次' },
      { name: '个人博客', active: true, frequency: '每月 2 篇' },
      { name: '微信公众号', active: true, frequency: '每月 1 篇' },
      { name: '知乎', active: false, frequency: '近 3 月无更新' },
      { name: 'YouTube', active: false, frequency: '近 6 月无更新' },
      { name: '小红书', active: false, frequency: '未发现账号' },
      { name: '抖音', active: false, frequency: '未发现账号' },
    ],
    notionLink: 'https://notion.so/twin-research/mock-doc-id',
  }
}

export default function TwinAgent() {
  const {
    selectedWorkspaceId, workspaces, createWorkspace, createAgent,
    addAgentActivity, updateAgentActivity, updateAgentStatus,
    executions, startExecution: storeStartExecution, cancelExecution, clearExecution,
    isLoggedIn, mockLogin, showLoginModal, setShowLoginModal, loginSource,
    sidebarCollapsed, toggleSidebar,
    addHistoryResult,
    agents, selectAgent,
  } = useStore()

  const wsExec = executions[selectedWorkspaceId]
  const execSteps = wsExec?.steps ?? []
  const execProgress = wsExec?.progress ?? 0
  const execLogs = wsExec?.logs ?? []

  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<TwinMessage[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [clarifyStep, setClarifyStep] = useState(0)
  const [userTask, setUserTask] = useState('')
  const [selectedTier, setSelectedTier] = useState('')
  const [logsExpanded, setLogsExpanded] = useState(false)

  const [loginStep, setLoginStep] = useState<'login' | 'phone' | 'code' | 'notion'>('login')
  const [guideAnswered, setGuideAnswered] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', ''])
  const [codeSending, setCodeSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [codeError, setCodeError] = useState(false)
  const [agreeChecked, setAgreeChecked] = useState(false)
  const [notionPending, setNotionPending] = useState(false)
  const [plusPopoverOpen, setPlusPopoverOpen] = useState(false)
  const [agentPopoverOpen, setAgentPopoverOpen] = useState(false)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const handleVisibility = () => {
      if (!document.hidden) document.title = 'Viceme'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typing])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [execLogs.length])

  const addMessage = useCallback((msg: Omit<TwinMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: uid(), timestamp: ts() }])
  }, [])

  const updateLastOptionCard = useCallback((update: Partial<OptionCard>) => {
    setMessages(prev => {
      let idx = -1
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].type === 'options' && prev[i].options && !prev[i].options!.dismissed) {
          idx = i
          break
        }
      }
      if (idx === -1) return prev
      const copy = [...prev]
      copy[idx] = { ...copy[idx], options: { ...copy[idx].options!, ...update } }
      return copy
    })
  }, [])

  const simulateTyping = useCallback((content: string, type: TwinMessage['type'], extra?: Partial<TwinMessage>) => {
    setTyping(true)
    const delay = 500 + Math.random() * 600
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setTyping(false)
        addMessage({ role: 'agent', content, type, ...extra })
        resolve()
      }, delay)
    })
  }, [addMessage])

  const advanceClarification = useCallback(async (answer: string, choiceId?: string) => {
    addMessage({ role: 'user', content: answer, type: 'text' })

    if (clarifyStep === 0 && choiceId) {
      setSelectedTier(choiceId)
    }

    const nextStep = clarifyStep + 1
    if (nextStep < CLARIFICATION_STEPS.length) {
      setClarifyStep(nextStep)
      const step = CLARIFICATION_STEPS[nextStep]
      await simulateTyping(step.question, 'options', {
        options: {
          question: step.question,
          choices: step.choices,
          allowCustom: false,
          dismissed: false,
        },
      })
    } else {
      setPhase('planning')
      setGuideAnswered(false)
      const tier = selectedTier || choiceId || 'full'
      const plan = buildMockPlan(userTask, tier)
      await simulateTyping(plan.summary, 'plan', { plan })
    }
  }, [clarifyStep, simulateTyping, addMessage, userTask, selectedTier])

  const handleOptionSelect = useCallback((choiceId: string, label: string) => {
    updateLastOptionCard({ selected: choiceId, dismissed: true })
    advanceClarification(label, choiceId)
  }, [updateLastOptionCard, advanceClarification])

  const handleOptionCustomSubmit = useCallback((value: string) => {
    if (!value.trim()) return
    updateLastOptionCard({ customValue: value, dismissed: true })
    advanceClarification(value)
  }, [updateLastOptionCard, advanceClarification])

  const handleDismissCard = useCallback(() => {
    updateLastOptionCard({ dismissed: true })
    advanceClarification('跳过')
  }, [updateLastOptionCard, advanceClarification])

  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const prevWsId = useRef(selectedWorkspaceId)

  const stateRef = useRef({ phase, messages, userTask, selectedTier, clarifyStep, guideAnswered, logsExpanded, currentAgentId })
  stateRef.current = { phase, messages, userTask, selectedTier, clarifyStep, guideAnswered, logsExpanded, currentAgentId }

  useEffect(() => {
    if (prevWsId.current !== selectedWorkspaceId) {
      const prevId = prevWsId.current
      if (prevId) {
        savedConversations.set(prevId, { ...stateRef.current })
      }

      if (!prevId && selectedWorkspaceId) {
        prevWsId.current = selectedWorkspaceId
        return
      }

      const saved = savedConversations.get(selectedWorkspaceId)
      if (saved) {
        setPhase(saved.phase)
        setMessages(saved.messages)
        setUserTask(saved.userTask)
        setSelectedTier(saved.selectedTier)
        setClarifyStep(saved.clarifyStep)
        setGuideAnswered(saved.guideAnswered)
        setLogsExpanded(saved.logsExpanded)
        setCurrentAgentId(saved.currentAgentId)
      } else {
        setPhase('idle')
        setMessages([])
        setUserTask('')
        setSelectedTier('')
        setClarifyStep(0)
        setGuideAnswered(false)
        setLogsExpanded(false)
        setCurrentAgentId(null)
      }

      setTyping(false)
      prevWsId.current = selectedWorkspaceId
    }
  }, [selectedWorkspaceId])

  const ensureWorkspace = useCallback((firstMessage: string) => {
    if (!selectedWorkspaceId || !workspaces.find(w => w.id === selectedWorkspaceId)) {
      const name = firstMessage.length > 20 ? firstMessage.slice(0, 20) + '…' : firstMessage
      createWorkspace(name)
    }
  }, [selectedWorkspaceId, workspaces, createWorkspace])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')

    if (phase === 'idle') {
      ensureWorkspace(text)
      setUserTask(text)
      addMessage({ role: 'user', content: text, type: 'text' })
      setPhase('clarifying')
      setClarifyStep(0)
      const step = CLARIFICATION_STEPS[0]
      await simulateTyping(
        `收到你的任务：「${text}」\n\n在开始之前，需要确认一些信息：`,
        'text'
      )
      await simulateTyping(step.question, 'options', {
        options: {
          question: step.question,
          choices: step.choices,
          allowCustom: false,
          dismissed: false,
        },
      })
    } else if (phase === 'clarifying') {
      updateLastOptionCard({ customValue: text, dismissed: true })
      advanceClarification(text)
    } else {
      addMessage({ role: 'user', content: text, type: 'text' })
      await simulateTyping('收到，我会在调研过程中考虑你的补充要求。', 'text')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleStartBuild = () => {
    if (!isLoggedIn) {
      setLoginStep('login')
      setShowLoginModal(true, 'build')
      return
    }
    startExecution()
  }

  const handleLogin = () => {
    if (!agreeChecked) {
      message.warning('请先阅读并同意用户协议、隐私政策')
      return
    }
    mockLogin()
    setShowLoginModal(false)
    if (loginSource === 'build') {
      setNotionPending(true)
    }
  }

  const handlePhoneLogin = () => {
    setPhoneNumber('')
    setVerifyCode(['', '', '', '', '', ''])
    setCodeError(false)
    setLoginStep('phone')
  }

  const isPhoneValid = /^1[3-9]\d{9}$/.test(phoneNumber.trim())

  const handleSendCode = () => {
    if (!agreeChecked) {
      message.warning('请先阅读并同意用户协议、隐私政策')
      return
    }
    if (!isPhoneValid) return
    setCodeSending(true)
    setTimeout(() => {
      setCodeSending(false)
      setCountdown(60)
      setLoginStep('code')
      message.success('验证码已发送')
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100)
    }, 600)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)
    const newCode = [...verifyCode]
    newCode[index] = digit
    setVerifyCode(newCode)
    setCodeError(false)

    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }

    const fullCode = newCode.join('')
    if (fullCode.length === 6) {
      if (fullCode === '123456') {
        message.success('验证成功')
        mockLogin()
        setShowLoginModal(false)
        if (loginSource === 'build') {
          setNotionPending(true)
        }
      } else {
        setCodeError(true)
        message.error('验证码错误，请重新输入')
      }
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verifyCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newCode = [...verifyCode]
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setVerifyCode(newCode)
    setCodeError(false)

    const focusIdx = Math.min(pasted.length, 5)
    codeInputRefs.current[focusIdx]?.focus()

    if (pasted.length === 6) {
      if (pasted === '123456') {
        message.success('验证成功')
        mockLogin()
        setShowLoginModal(false)
        if (loginSource === 'build') {
          setNotionPending(true)
        }
      } else {
        setCodeError(true)
        message.error('验证码错误，请重新输入')
      }
    }
  }

  const handleNotionAuth = () => {
    setShowLoginModal(false)
    message.success('Notion 授权成功')
    setTimeout(() => startExecution(), 300)
  }

  const startExecution = () => {
    const execWsId = selectedWorkspaceId
    const capturedTask = userTask

    setPhase('executing')

    const isFull = selectedTier === 'full' || selectedTier === '完整版'
    const steps = (isFull ? EXEC_STEPS_FULL : EXEC_STEPS_QUICK).map(s => ({
      ...s, status: 'pending' as const, logs: [...s.logs],
    }))

    const agentName = capturedTask.length > 10 ? capturedTask.slice(0, 10) + '…' : capturedTask
    const agentId = createAgent(
      agentName,
      `基于任务「${capturedTask}」自动创建的执行 Agent`,
      'GPT-4o',
      ['调研分析', '信息检索', '报告生成'],
      execWsId,
    )
    setCurrentAgentId(agentId)
    updateAgentStatus(agentId, 'busy', capturedTask)
    addMessage({ role: 'agent', content: '任务已启动，Agent 正在执行…', type: 'text' })

    storeStartExecution(execWsId, steps, () => {
      const activityId = uid()
      const totalDuration = `${(5 + Math.random() * 10).toFixed(0)}s`
      addAgentActivity(agentId, {
        id: activityId,
        action: capturedTask,
        target: `完成 · ${steps.length} 个步骤`,
        time: ts(),
        status: 'success',
        duration: totalDuration,
        result: buildMockResult(capturedTask).summary,
        steps: steps.map(s => s.title),
      })
      updateAgentStatus(agentId, 'online')

      const result = buildMockResult(capturedTask)
      const historyId = uid()
      addHistoryResult({
        id: historyId,
        title: `${result.personName} 调研`,
        personName: result.personName,
        time: ts(),
        status: 'success',
        contactCount: result.contactCount,
        platformCount: result.socialPlatformCount,
        duration: result.duration,
        summary: result.summary,
        topChannels: result.topChannels,
        contacts: result.contacts,
      })

      const resultMsg: TwinMessage = {
        id: uid(), timestamp: ts(), role: 'agent',
        content: result.summary,
        type: 'result', researchResult: result,
        historyResultId: historyId,
      }

      const store = useStore.getState()
      const isActive = store.selectedWorkspaceId === execWsId
      if (isActive) {
        clearExecution(execWsId)
        setPhase('completed')
        setGuideAnswered(false)
        setMessages(prev => [...prev, resultMsg])
      } else {
        clearExecution(execWsId)
        const saved = savedConversations.get(execWsId)
        if (saved) {
          saved.phase = 'completed'
          saved.guideAnswered = false
          saved.messages = [...saved.messages, resultMsg]
        }

        notification.success({
          message: `「${capturedTask}」调研完成`,
          description: null,
          placement: 'topRight',
          duration: 5,
          onClick: () => {
            const s = useStore.getState()
            s.selectWorkspace(execWsId)
            s.selectAgent(agentId)
            s.setPendingActivityModal({ agentId, activityId })
            notification.destroy()
          },
          style: { cursor: 'pointer', padding: '12px 16px', width: 280 },
        })
      }

      try {
        if (document.hidden && Notification.permission === 'granted') {
          new Notification('Viceme 调研完成', { body: `「${capturedTask}」调研已完成`, icon: '/favicon.ico' })
        }
      } catch {}
      if (document.hidden) {
        document.title = `✅ 调研完成 - Viceme`
      }
    })
  }

  const handleAdjust = () => {
    addMessage({ role: 'agent', content: '请告诉我你想调整的地方，比如调研范围、重点方向、输出格式等：', type: 'text' })
  }

  const handleReset = () => {
    if (wsExec?.running) {
      cancelExecution(selectedWorkspaceId)
    }
    clearExecution(selectedWorkspaceId)
    setPhase('idle')
    setMessages([])
    setInput('')
    setTyping(false)
    setClarifyStep(0)
    setUserTask('')
    setSelectedTier('')
    setLogsExpanded(false)
    setGuideAnswered(false)
    setCurrentAgentId(null)
    message.success('已重置，可以开始新的调研任务')
  }

  const activeOptionCard = messages.find(m => m.options && !m.options.dismissed)?.options || null

  const renderOptionCard = (opts: OptionCard) => {
    if (opts.dismissed) {
      const selectedLabel = opts.choices.find(c => c.id === opts.selected)?.label || opts.customValue || '跳过'
      return (
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-[12px] font-medium">
            <CheckCircleFilled style={{ fontSize: 12 }} /> {selectedLabel}
          </span>
        </div>
      )
    }
    return null
  }

  const renderPlan = (plan: WorkflowPlan) => (
    <PlanTree plan={plan} />
  )

  const renderExecPanel = () => {
    if (execSteps.length === 0) return null
    return (
      <ExecTree
        steps={execSteps}
        logs={execLogs}
        progress={execProgress}
        running={wsExec?.running ?? false}
        onReset={handleReset}
      />
    )
  }

  const handleViewResultDetail = (historyResultId?: string) => {
    if (currentAgentId) {
      const { selectAgent, setDetailDefaultTab, setPendingHistoryId } = useStore.getState()
      selectAgent(currentAgentId)
      setDetailDefaultTab('history')
      if (historyResultId) {
        setPendingHistoryId(historyResultId)
      }
    }
  }

  const renderResearchResult = (result: ResearchResult, historyResultId?: string) => (
    <div style={{ marginTop: 8 }}>
      {/* 概述入口卡片 */}
      <div
        className="rounded-xl bg-white hover:bg-[#FAFBFC] cursor-pointer transition-all group"
        style={{ padding: '16px 20px', border: '1px solid #F0F1F3', marginTop: 12 }}
        onClick={() => handleViewResultDetail(historyResultId)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #00B42A, #34D399)' }}
            >
              <CheckCircleFilled style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{result.personName} · 调研报告</div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {result.contactCount} 种联系方式 · {result.socialPlatformCount} 个社交平台 · 耗时 {result.duration}
              </div>
            </div>
          </div>
          <RightOutlined
            className="group-hover:translate-x-0.5 transition-transform"
            style={{ fontSize: 11, color: '#C9CDD4' }}
          />
        </div>
      </div>
    </div>
  )

  const planningGuide: OptionCard | null = phase === 'planning' && !typing && !guideAnswered ? {
    question: '调研方案已生成，是否开始？',
    choices: [
      { id: 'start', label: '开始构建', description: '启动 AI 全网调研任务' },
      { id: 'adjust', label: '我想调整', description: '修改调研范围或重点方向' },
    ],
    allowCustom: true,
    dismissed: false,
  } : null

  const completedGuide: OptionCard | null = phase === 'completed' && !typing && !guideAnswered ? {
    question: '调研完成，下一步？',
    choices: [
      { id: 'satisfied', label: '满意', description: '调研结果符合预期' },
      { id: 'more-research', label: '补充定向调研', description: '在现有结果基础上深入挖掘' },
      { id: 'new-person', label: '套用模板调研新人物', description: '使用相同模板调研其他人' },
    ],
    allowCustom: true,
    dismissed: false,
  } : null

  const notionGuide: OptionCard | null = notionPending ? {
    question: '授权 Notion 以存储调研结果',
    choices: [
      { id: 'auth-notion', label: '一键授权 Notion', description: '调研结果将自动生成为结构化 Notion 文档' },
      { id: 'skip-notion', label: '暂时跳过', description: '结果将以页面形式展示' },
    ],
    allowCustom: false,
    dismissed: false,
  } : null

  const bottomGuide = activeOptionCard || notionGuide || planningGuide || completedGuide

  const handleBottomSelect = (choiceId: string, label: string) => {
    if (activeOptionCard) {
      handleOptionSelect(choiceId, label)
      return
    }

    if (notionGuide) {
      setNotionPending(false)
      addMessage({ role: 'user', content: label, type: 'text' })
      if (choiceId === 'auth-notion') {
        message.success('Notion 授权成功')
      } else {
        message.info('跳过授权，结果将以页面形式展示')
      }
      setTimeout(() => startExecution(), 300)
      return
    }

    setGuideAnswered(true)
    addMessage({ role: 'user', content: label, type: 'text' })

    if (planningGuide) {
      if (choiceId === 'start') {
        handleStartBuild()
      } else if (choiceId === 'adjust') {
        simulateTyping('请告诉我你想调整的地方，比如调研范围、重点方向、输出格式等：', 'text')
      }
    } else if (completedGuide) {
      if (choiceId === 'satisfied') {
        simulateTyping('感谢反馈！你可以随时输入新的调研需求。', 'text')
      } else if (choiceId === 'more-research') {
        simulateTyping('请补充你想要进一步调研的方向，例如特定平台深挖、历史动态追踪等：', 'text')
      } else if (choiceId === 'new-person') {
        handleReset()
      }
    }
  }

  const handleBottomCustomSubmit = (value: string) => {
    if (activeOptionCard) {
      handleOptionCustomSubmit(value)
      return
    }

    setGuideAnswered(true)
    addMessage({ role: 'user', content: value, type: 'text' })

    if (planningGuide) {
      simulateTyping('收到，我会根据你的要求调整方案。请稍等…', 'text')
    } else if (completedGuide) {
      simulateTyping('好的，我来处理你的补充需求。', 'text')
    }
  }

  const handleBottomSkip = () => {
    if (activeOptionCard) {
      handleDismissCard()
    } else if (notionGuide) {
      setNotionPending(false)
      message.info('跳过授权，结果将以页面形式展示')
      setTimeout(() => startExecution(), 300)
    } else {
      setGuideAnswered(true)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between bg-bg-white border-b border-border shrink-0"
        style={{ height: 52, padding: '0 20px' }}
      >
        <div className="flex items-center gap-2.5">
          <Tooltip title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}>
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-secondary"
            >
              {sidebarCollapsed ? <MenuUnfoldOutlined style={{ fontSize: 14 }} /> : <MenuFoldOutlined style={{ fontSize: 14 }} />}
            </button>
          </Tooltip>
          <h2 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">
            {workspaces.find(w => w.id === selectedWorkspaceId)?.name || '新建对话'}
          </h2>
          {phase !== 'idle' && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: phase === 'executing' ? '#FFF7E6' : phase === 'completed' ? '#E8F5E9' : '#EFF5FF',
                color: phase === 'executing' ? '#FF7D00' : phase === 'completed' ? '#00B42A' : '#4C8BF5',
              }}
            >
              {phase === 'clarifying' ? '需求确认' :
               phase === 'planning' ? '方案预览' :
               phase === 'executing' ? '调研中' : '已完成'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isLoggedIn && (
            <Tooltip title="下载移动端 App">
              <button
                onClick={() => message.info('移动端 App 即将上线，敬请期待')}
                className="flex items-center gap-1.5 rounded-lg text-[12px] font-medium hover:opacity-85 transition-opacity"
                style={{ padding: '5px 12px', background: '#F0F0FF', color: '#6366F1', border: '1px solid #E0E0FF' }}
              >
                <MobileOutlined style={{ fontSize: 14 }} />
                <span>下载 App</span>
              </button>
            </Tooltip>
          )}
          {(() => {
            const wsAgents = agents.filter(a => a.workspaceId === selectedWorkspaceId)
            if (wsAgents.length === 0) return null
            return (
              <Popover
                open={agentPopoverOpen}
                onOpenChange={setAgentPopoverOpen}
                trigger="click"
                placement="bottomRight"
                arrow={false}
                overlayInnerStyle={{ padding: 6, borderRadius: 12 }}
                content={
                  <div style={{ width: 220 }}>
                    <div className="flex items-center justify-between" style={{ padding: '6px 8px 8px' }}>
                      <span className="text-[12px] font-semibold text-text-primary">Workspace Agents</span>
                      <span className="text-[10px] text-text-tertiary">{wsAgents.length} 个</span>
                    </div>
                    {wsAgents.map(a => (
                      <button
                        key={a.id}
                        className="w-full flex items-center gap-2.5 rounded-lg hover:bg-[#F2F3F5] transition-colors text-left"
                        style={{ padding: '8px 8px' }}
                        onClick={() => {
                          setAgentPopoverOpen(false)
                          selectAgent(a.id)
                        }}
                      >
                        <span
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold"
                          style={{
                            background: a.status === 'online' ? '#4C8BF5' : a.status === 'busy' ? '#FF7D00' : '#E8E8E8',
                            color: a.status === 'offline' ? '#6E7681' : '#fff',
                          }}
                        >
                          {a.avatar.slice(0, 2)}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[12px] font-medium text-text-primary truncate">{a.name}</span>
                          <span className="text-[10px] text-text-tertiary truncate">{a.status === 'busy' ? '执行中' : a.status === 'online' ? '在线' : '离线'}</span>
                        </div>
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: a.status === 'online' ? '#00B42A' : a.status === 'busy' ? '#FF7D00' : '#C9CDD4' }}
                        />
                      </button>
                    ))}
                  </div>
                }
              >
                <button
                  className="flex items-center gap-1.5 rounded-lg text-[12px] text-text-tertiary hover:text-text-secondary hover:bg-[#F2F3F5] transition-colors"
                  style={{ padding: '6px 12px' }}
                >
                  <TeamOutlined style={{ fontSize: 13 }} /> Agents <span className="text-[10px] text-text-quaternary">{wsAgents.length}</span>
                </button>
              </Popover>
            )
          })()}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-fade flex justify-center" style={{ padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1" style={{ paddingTop: 100 }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1D2129', marginBottom: 10 }}>
                我可以为你做什么？
              </h2>
              <p style={{ fontSize: 16, color: '#86909C', marginBottom: 48 }}>
                描述你的任务，AI 智能体为你高效完成
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '14px 18px', justifyContent: 'center' }}>
                {QUICK_PROMPTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    style={{
                      background: '#F7F8FA',
                      border: '1px solid #F0F1F3',
                      borderRadius: 999,
                      padding: '12px 24px',
                      fontSize: 15,
                      fontWeight: 400,
                      color: '#4E5969',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#EFF5FF'
                      e.currentTarget.style.borderColor = '#D0E0FF'
                      e.currentTarget.style.color = '#4C8BF5'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#F7F8FA'
                      e.currentTarget.style.borderColor = '#F0F1F3'
                      e.currentTarget.style.color = '#4E5969'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div style={{
                maxWidth: msg.type === 'result' ? '66%' : msg.type === 'plan' ? '80%' : '80%',
              }}>
                <div
                  className="whitespace-pre-wrap"
                  style={{
                    padding: (msg.type === 'plan' || msg.type === 'result') ? '18px 22px' : '12px 18px',
                    fontSize: 15,
                    lineHeight: 1.75,
                    ...(msg.role === 'user'
                      ? { background: '#F2F3F5', borderRadius: '18px 18px 4px 18px', color: '#1D2129' }
                      : { borderRadius: '18px 18px 18px 4px', color: '#1D2129' }),
                  }}
                >
                  {msg.role === 'agent' ? <RichContent text={msg.content} /> : msg.content}
                  {msg.options && renderOptionCard(msg.options)}
                  {msg.plan && renderPlan(msg.plan)}
                  {msg.researchResult && renderResearchResult(msg.researchResult, msg.historyResultId)}
                </div>
                <div className={`flex items-center mt-1.5 ${msg.role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                  <span style={{ fontSize: 11, color: '#C9CDD4', marginRight: msg.role === 'agent' ? 8 : 0 }}>{msg.timestamp}</span>
                  {msg.role === 'agent' && (
                    <>
                      <Tooltip title="复制">
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.content); message.success('已复制到剪贴板') }}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
                          style={{ color: '#C9CDD4' }}
                        >
                          <CopyOutlined style={{ fontSize: 12 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="重新生成">
                        <button
                          onClick={() => message.info('重新生成中…')}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
                          style={{ color: '#C9CDD4' }}
                        >
                          <ReloadOutlined style={{ fontSize: 12 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="有帮助">
                        <button
                          onClick={() => message.success('感谢反馈')}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
                          style={{ color: '#C9CDD4' }}
                        >
                          <LikeOutlined style={{ fontSize: 12 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="没帮助">
                        <button
                          onClick={() => message.info('已记录反馈')}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
                          style={{ color: '#C9CDD4' }}
                        >
                          <DislikeOutlined style={{ fontSize: 12 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="更多">
                        <button
                          onClick={() => message.info('更多操作开发中')}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
                          style={{ color: '#C9CDD4' }}
                        >
                          <EllipsisOutlined style={{ fontSize: 14 }} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-[4px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {renderExecPanel()}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 flex justify-center" style={{ padding: '12px 20px 20px' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          {bottomGuide ? (
            <InlineGuideCard
              opts={bottomGuide}
              onSelect={handleBottomSelect}
              onCustomSubmit={handleBottomCustomSubmit}
              onSkip={handleBottomSkip}
            />
          ) : (
            <div
              className="bg-bg-white overflow-hidden border border-[#E5E6EB] input-focus-ring transition-all"
              style={{ borderRadius: 20 }}
            >
              <div style={{ padding: '14px 20px 8px' }}>
                <TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    phase === 'idle' ? '描述你需要完成的任务…' :
                    phase === 'clarifying' ? '输入自定义要求，或点击上方选项…' :
                    phase === 'completed' ? '继续提出新的需求…' :
                    '随时输入补充要求…'
                  }
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  variant="borderless"
                  className="chat-input !text-[14px] !leading-[1.6] !p-0"
                  style={{ resize: 'none' }}
                />
              </div>
              <div className="flex items-center justify-between" style={{ padding: '4px 16px 12px' }}>
                <div className="flex items-center min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  <Popover
                    open={plusPopoverOpen}
                    onOpenChange={setPlusPopoverOpen}
                    trigger="click"
                    placement="topLeft"
                    arrow={false}
                    overlayInnerStyle={{ padding: 6, borderRadius: 12 }}
                    content={
                      <div style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="w-full flex items-center gap-3 rounded-lg hover:bg-[#F2F3F5] transition-colors text-left"
                          style={{ padding: '10px 12px' }}
                          onClick={() => {
                            setPlusPopoverOpen(false)
                            message.info('选择云盘文件功能开发中')
                          }}
                        >
                          <CloudOutlined style={{ fontSize: 18, color: '#4E5969' }} />
                          <span className="text-[14px] text-[#1D2129]">选择云盘文件</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 rounded-lg hover:bg-[#F2F3F5] transition-colors text-left"
                          style={{ padding: '10px 12px' }}
                          onClick={() => {
                            setPlusPopoverOpen(false)
                            message.info('选择文件或图片功能开发中')
                          }}
                        >
                          <FolderOpenOutlined style={{ fontSize: 18, color: '#4E5969' }} />
                          <span className="text-[14px] text-[#1D2129]">选择文件或图片</span>
                        </button>
                      </div>
                    }
                  >
                    <button className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors shrink-0">
                      <PlusOutlined style={{ fontSize: 16, color: '#1D2129' }} />
                    </button>
                  </Popover>
                </div>
                {input.trim() ? (
                  <button
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 36, height: 36, background: '#1677FF' }}
                    onClick={handleSend}
                  >
                    <ArrowUpOutlined style={{ fontSize: 16, color: '#fff' }} />
                  </button>
                ) : voiceActive ? (
                  <button
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 36, height: 36, background: '#1677FF' }}
                    onClick={() => setVoiceActive(false)}
                  >
                    <VoiceWaveIcon />
                  </button>
                ) : (
                  <button
                    className="flex items-center justify-center rounded-full shrink-0 voice-btn-idle"
                    style={{ width: 36, height: 36, background: '#F2F3F5' }}
                    onClick={() => {
                      setVoiceActive(true)
                      message.info('语音输入已开启')
                    }}
                  >
                    <AudioOutlined style={{ fontSize: 16, color: '#1D2129' }} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login & Notion Auth Modal */}
      <Modal
        open={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        footer={null}
        centered
        width={680}
        closable
        title={null}
        className="login-modal"
        styles={{ body: { padding: 0 } }}
      >
        {loginStep === 'code' ? (
          <div className="flex flex-col items-center" style={{ padding: '32px 24px 20px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D2129', marginBottom: 4 }}>输入验证码</h3>
            <p style={{ fontSize: 13, color: '#86909C', marginBottom: 24 }}>
              验证码已发送至 <span style={{ color: '#1D2129', fontWeight: 500 }}>{phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {verifyCode.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { codeInputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  className="text-center outline-none transition-all"
                  style={{
                    width: 46, height: 52, borderRadius: 12,
                    border: `2px solid ${codeError ? '#F53F3F' : digit ? '#4C8BF5' : '#E5E6EB'}`,
                    fontSize: 22, fontWeight: 600, color: '#1D2129',
                    background: codeError ? '#FFF5F5' : '#FAFAFA',
                  }}
                />
              ))}
            </div>
            {codeError && (
              <p style={{ fontSize: 13, color: '#F53F3F', marginBottom: 12 }}>
                <ExclamationCircleFilled style={{ marginRight: 4 }} />验证码错误，请重新输入
              </p>
            )}
            <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
              {countdown > 0 ? (
                <span style={{ fontSize: 13, color: '#C9CDD4' }}>{countdown}s 后可重新发送</span>
              ) : (
                <button
                  onClick={() => { setVerifyCode(['', '', '', '', '', '']); setCodeError(false); setCountdown(60); message.success('验证码已重新发送') }}
                  className="hover:opacity-80 transition-opacity"
                  style={{ fontSize: 13, color: '#4C8BF5', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  重新发送
                </button>
              )}
            </div>
            <button
              onClick={() => setLoginStep('login')}
              className="hover:text-text-primary transition-colors"
              style={{ fontSize: 13, color: '#86909C', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
            >
              返回登录
            </button>
          </div>
        ) : (
          <div className="flex" style={{ minHeight: 390 }}>
            <div className="flex-1 flex flex-col" style={{ padding: '40px 36px 32px' }}>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1D2129', marginBottom: 36, lineHeight: 1.3 }}>
                登录以解锁更多功能
              </h3>

              <div
                className="flex items-center gap-3 rounded-xl border border-[#E5E6EB] focus-within:border-[#4C8BF5] transition-colors"
                style={{ padding: '0 16px', height: 48, marginBottom: 16 }}
              >
                <div className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                  <span style={{ fontSize: 15, color: '#1D2129', fontWeight: 500 }}>+86</span>
                  <DownOutlined style={{ fontSize: 8, color: '#86909C' }} />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendCode() }}
                  placeholder="请输入手机号"
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{ fontSize: 14, color: '#1D2129' }}
                />
              </div>

              <button
                onClick={handleSendCode}
                disabled={codeSending || !isPhoneValid}
                className="w-full flex items-center justify-center transition-all"
                style={{
                  height: 48,
                  borderRadius: 999,
                  background: isPhoneValid && !codeSending ? '#1D2129' : '#E8E9EC',
                  color: isPhoneValid && !codeSending ? '#fff' : '#9DA3AB',
                  fontSize: 16,
                  fontWeight: 500,
                  border: 'none',
                  cursor: isPhoneValid && !codeSending ? 'pointer' : 'default',
                  marginBottom: 24,
                }}
              >
                {codeSending ? <><LoadingOutlined style={{ fontSize: 16, marginRight: 8 }} /> 发送中…</> : '下一步'}
              </button>

              <label className="flex items-start gap-2 cursor-pointer select-none" style={{ marginBottom: 22 }}>
                <input
                  type="checkbox"
                  checked={agreeChecked}
                  onChange={e => setAgreeChecked(e.target.checked)}
                  className="shrink-0"
                  style={{ width: 15, height: 15, marginTop: 1, accentColor: '#4C8BF5', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, color: '#86909C', lineHeight: 1.6 }}>
                  已阅读并同意{' '}
                  <span className="text-text-primary cursor-pointer hover:underline">用户协议</span>、
                  <span className="text-text-primary cursor-pointer hover:underline">隐私政策</span>、
                  <span className="text-text-primary cursor-pointer hover:underline">Viceme 服务须知</span>
                </span>
              </label>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleLogin}
                  className="hover:opacity-80 transition-opacity"
                  style={{ fontSize: 14, color: '#4C8BF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  微信一键登录
                </button>
              </div>
            </div>

            <div
              className="flex flex-col items-center justify-center shrink-0"
              style={{ width: 280, padding: '32px 28px' }}
            >
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{ width: 200, height: 200, border: '1px solid #F0F1F3', marginBottom: 16 }}
              >
                <div style={{ width: 160, height: 160, background: '#F2F3F5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanOutlined style={{ fontSize: 40, color: '#C9CDD4' }} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#86909C', textAlign: 'center' }}>
                打开 Viceme App · <span style={{ color: '#4C8BF5', cursor: 'pointer' }}>点击扫一扫</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function VoiceWaveIcon() {
  return (
    <div className="voice-wave-icon">
      <span className="voice-bar" style={{ animationDelay: '0ms' }} />
      <span className="voice-bar" style={{ animationDelay: '150ms' }} />
      <span className="voice-bar voice-bar-tall" style={{ animationDelay: '80ms' }} />
      <span className="voice-bar" style={{ animationDelay: '220ms' }} />
      <span className="voice-bar" style={{ animationDelay: '100ms' }} />
    </div>
  )
}

function InlineGuideCard({
  opts,
  onSelect,
  onCustomSubmit,
  onSkip,
}: {
  opts: OptionCard
  onSelect: (id: string, label: string) => void
  onCustomSubmit: (value: string) => void
  onSkip: () => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [customValue, setCustomValue] = useState('')
  const customRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const total = opts.allowCustom ? opts.choices.length + 1 : opts.choices.length
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setActiveIdx(prev => (prev - 1 + total) % total)
          break
        case 'ArrowDown':
          e.preventDefault()
          setActiveIdx(prev => (prev + 1) % total)
          break
        case 'Enter':
          e.preventDefault()
          if (activeIdx < opts.choices.length) {
            const c = opts.choices[activeIdx]
            onSelect(c.id, c.label)
          } else if (opts.allowCustom && customValue.trim()) {
            onCustomSubmit(customValue.trim())
          } else if (opts.allowCustom) {
            customRef.current?.focus()
          }
          break
        case 'Escape':
          e.preventDefault()
          onSkip()
          break
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activeIdx, opts, customValue, onSelect, onCustomSubmit, onSkip])

  return (
    <div
      className="bg-white overflow-hidden"
      style={{ borderRadius: 20, border: '1px solid #E5E6EB' }}
    >
      <div className="flex items-center justify-between" style={{ padding: '16px 20px 8px' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1D2129' }}>
          {opts.question}
        </span>
        <button
          onClick={onSkip}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
        >
          <CloseOutlined style={{ fontSize: 11, color: '#86909C' }} />
        </button>
      </div>

      <div style={{ padding: '4px 12px' }}>
        {opts.choices.map((choice, i) => (
          <button
            key={choice.id}
            className="w-full flex items-center justify-between rounded-xl transition-colors"
            style={{
              height: 48,
              padding: '0 12px',
              background: activeIdx === i ? '#F7F8FA' : 'transparent',
            }}
            onClick={() => onSelect(choice.id, choice.label)}
            onMouseEnter={() => setActiveIdx(i)}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: activeIdx === i ? '#1D2129' : '#F2F3F5',
                  color: activeIdx === i ? '#fff' : '#86909C',
                  transition: 'all 0.15s',
                }}
              >
                {i + 1}
              </span>
              <div className="flex flex-col items-start">
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1D2129' }}>{choice.label}</span>
                {choice.description && (
                  <span style={{ fontSize: 11, color: '#86909C', marginTop: 1 }}>{choice.description}</span>
                )}
              </div>
            </div>
            {activeIdx === i && (
              <RightOutlined style={{ fontSize: 10, color: '#86909C' }} />
            )}
          </button>
        ))}

        {opts.allowCustom && (
          <div
            className="flex items-center gap-2 rounded-xl transition-colors"
            style={{
              height: 48,
              padding: '0 12px',
              background: activeIdx === opts.choices.length ? '#F7F8FA' : 'transparent',
            }}
            onMouseEnter={() => setActiveIdx(opts.choices.length)}
          >
            <input
              ref={customRef}
              type="text"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customValue.trim()) {
                  e.preventDefault()
                  e.stopPropagation()
                  onCustomSubmit(customValue.trim())
                }
              }}
              placeholder="输入自定义要求…"
              className="flex-1 bg-transparent border-none outline-none"
              style={{ fontSize: 13, color: '#1D2129' }}
            />
            {customValue.trim() && (
              <button
                onClick={() => onCustomSubmit(customValue.trim())}
                className="shrink-0 rounded-lg hover:opacity-90 transition-opacity"
                style={{ padding: '7px 16px', fontSize: 13, fontWeight: 500, background: '#1D2129', color: '#fff' }}
              >
                确定
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ padding: '6px 20px 14px' }}>
        <span style={{ fontSize: 11, color: '#C9CDD4' }}>
          ↑↓ 导航 · Enter 选择 · Esc 跳过
        </span>
        <button
          onClick={onSkip}
          className="hover:bg-[#F2F3F5] rounded-lg transition-colors"
          style={{ fontSize: 13, color: '#86909C', padding: '6px 14px', border: 'none', background: 'transparent' }}
        >
          跳过
        </button>
      </div>
    </div>
  )
}

function PlanTree({ plan }: { plan: WorkflowPlan }) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(() => new Set())

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div style={{ marginTop: 14, marginBottom: 4 }}>
      <div style={{ padding: '4px 0' }}>
        {plan.steps.map((step, i) => {
          const isLast = i === plan.steps.length - 1
          const isExpanded = expandedSteps.has(i)
          return (
            <div key={i} className="flex" style={{ minHeight: 36 }}>
              <div className="flex flex-col items-center shrink-0" style={{ width: 24, marginRight: 10 }}>
                <span
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#F2F3F5', marginTop: 2 }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#86909C' }}>{i + 1}</span>
                </span>
                {!isLast && (
                  <div style={{ width: 1.5, flex: 1, background: '#E5E6EB', marginTop: 2, marginBottom: 2 }} />
                )}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : 4, flex: 1, minWidth: 0 }}>
                <div
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleStep(i)}
                  style={{ userSelect: 'none' }}
                >
                  <RightOutlined
                    style={{
                      fontSize: 9,
                      color: '#C9CDD4',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#86909C', display: 'flex' }}>
                    {STEP_ICONS[step.icon] || <SearchOutlined />}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#1D2129', lineHeight: 1.4 }}>{step.title}</span>
                </div>
                {isExpanded && (
                  <div style={{ fontSize: 12, color: '#86909C', marginTop: 4, marginLeft: 22, lineHeight: 1.6, paddingBottom: 4 }}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2" style={{ marginTop: 12, padding: '2px 2px 4px' }}>
        <button
          onClick={() => {
            if (expandedSteps.size === plan.steps.length) {
              setExpandedSteps(new Set())
            } else {
              setExpandedSteps(new Set(plan.steps.map((_, i) => i)))
            }
          }}
          className="hover:opacity-80 transition-opacity"
          style={{ fontSize: 12, color: '#4C8BF5', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          {expandedSteps.size === plan.steps.length ? '全部折叠' : '全部展开'}
        </button>
        <span style={{ fontSize: 12, color: '#86909C', background: '#F2F3F5', borderRadius: 6, padding: '4px 12px' }}>
          预计耗时 {plan.estimatedTime}
        </span>
      </div>
    </div>
  )
}

function ExecTree({
  steps,
  logs,
  progress,
  running,
  onReset,
}: {
  steps: ExecStep[]
  logs: string[]
  progress: number
  running: boolean
  onReset: () => void
}) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set())
  const logEndRef = useRef<HTMLDivElement>(null)

  const doneCount = steps.filter(s => s.status === 'done').length

  const toggleStep = (idx: number) => {
    setExpandedIdx(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const getStepLogs = (stepIdx: number) => {
    let logOffset = 0
    for (let i = 0; i < stepIdx; i++) {
      logOffset += steps[i].logs.length
    }
    return logs.slice(logOffset, logOffset + steps[stepIdx].logs.length)
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="flex justify-start" style={{ margin: '8px 0' }}>
      <div
        style={{
          maxWidth: '70%',
          width: '100%',
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #F0F1F3',
          padding: '18px 22px',
        }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <SearchOutlined style={{ color: '#fff', fontSize: 11 }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1D2129' }}>AI 调研进行中</span>
          {running && progress < 100 && (
            <span style={{ fontSize: 12, color: '#86909C', marginLeft: 'auto' }}>
              可离开页面，完成后通知你
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => {
            const isExpanded = expandedIdx.has(i)
            const stepLogs = getStepLogs(i)
            const isClickable = step.status === 'done' || step.status === 'running'
            const isLast = i === steps.length - 1

            return (
              <div key={i}>
                <div
                  className={`flex items-center gap-2.5 ${isClickable ? 'cursor-pointer hover:bg-[#F7F8FA]' : ''} rounded-lg transition-colors`}
                  style={{ minHeight: 40, padding: '0 10px' }}
                  onClick={isClickable ? () => toggleStep(i) : undefined}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {step.status === 'done' && (
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: '#00B42A' }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
                      </span>
                    )}
                    {step.status === 'running' && (
                      <span className="exec-step-running w-[18px] h-[18px] rounded-full border-2 border-[#4C8BF5] shrink-0" />
                    )}
                    {step.status === 'pending' && (
                      <span className="w-[18px] h-[18px] rounded-full border-2 border-[#E5E6EB] shrink-0" />
                    )}
                    {step.status === 'error' && (
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: '#F53F3F' }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>!</span>
                      </span>
                    )}
                    <span style={{
                      fontSize: 15,
                      color: step.status === 'running' ? '#1D2129' : step.status === 'done' ? '#6E7681' : '#C9CDD4',
                      fontWeight: step.status === 'running' ? 500 : 400,
                    }}>
                      {step.title}
                    </span>
                  </div>
                  {isClickable && (
                    <RightOutlined
                      style={{
                        fontSize: 9,
                        color: '#C9CDD4',
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.15s',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                {isExpanded && stepLogs.length > 0 && (
                  <div style={{
                    borderLeft: '2px solid #E5E6EB',
                    marginLeft: 19,
                    paddingLeft: 16,
                    marginBottom: 4,
                    maxHeight: 160,
                    overflowY: 'auto',
                  }}>
                    {stepLogs.map((log, j) => (
                      <div key={j} style={{ fontSize: 11, color: '#86909C', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{log}</div>
                    ))}
                  </div>
                )}
                {!isLast && step.status !== 'pending' && (
                  <div style={{ width: 1.5, height: 4, background: '#E5E6EB', marginLeft: 18 }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 14, padding: '0 10px' }}>
          {running && progress < 100 ? (
            <button
              onClick={onReset}
              style={{
                fontSize: 13,
                color: '#F53F3F',
                border: '1px solid #FFCDD2',
                background: 'transparent',
                borderRadius: 8,
                padding: '6px 16px',
                cursor: 'pointer',
              }}
            >
              暂停
            </button>
          ) : (
            <span />
          )}
          <span style={{ fontSize: 12, color: '#C9CDD4' }}>
            {doneCount} / {steps.length}
          </span>
        </div>
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

function RichContent({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim()

        if (!trimmed) return <div key={i} style={{ height: 8 }} />

        if (/^\d+\.\s\*\*/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s\*\*(.+?)\*\*(.*)$/)
          if (match) {
            return (
              <div key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1D2129' }}>
                  {match[1]}. {match[2]}
                </span>
                {match[3] && <span>{renderInline(match[3])}</span>}
              </div>
            )
          }
        }

        if (/^\*\*(.+?)\*\*/.test(trimmed) && !trimmed.startsWith('-')) {
          const boldMatch = trimmed.match(/^\*\*(.+?)\*\*(.*)$/)
          if (boldMatch) {
            return (
              <div key={i} style={{ fontSize: 16, fontWeight: 600, color: '#1D2129', marginTop: i > 0 ? 8 : 0, marginBottom: 2 }}>
                {boldMatch[1]}
                {boldMatch[2] && <span style={{ fontWeight: 400, fontSize: 15 }}>{renderInline(boldMatch[2])}</span>}
              </div>
            )
          }
        }

        if (/^[-•]\s/.test(trimmed)) {
          return (
            <div key={i} style={{ paddingLeft: 12, marginTop: 3 }}>
              <span style={{ color: '#86909C', marginRight: 6 }}>•</span>
              {renderInline(trimmed.replace(/^[-•]\s/, ''))}
            </div>
          )
        }

        return <div key={i}>{renderInline(line)}</div>
      })}
    </>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 600, color: '#1D2129' }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{ background: '#F2F3F5', padding: '1px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', color: '#4C8BF5' }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar, Badge, Modal, message, Popover, Tooltip } from 'antd'
import {
  CloseOutlined,
  DownOutlined,
  RightOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  RightCircleOutlined,
  ShareAltOutlined,
  CopyOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  SearchOutlined,
  LinkOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useStore } from '../store'

const statusColor: Record<string, string> = {
  online: '#00B42A',
  busy: '#FF7D00',
  offline: '#C9CDD4',
}

const statusText: Record<string, string> = {
  online: '在线',
  busy: '执行中',
  offline: '离线',
}

interface TriggerItem {
  id: string
  name: string
  schedule: string
  enabled: boolean
}

const defaultTriggers: TriggerItem[] = [
  { id: '1', name: '定时巡检', schedule: '每日 08:00', enabled: true },
  { id: '2', name: 'PR 代码审查', schedule: 'Git Push 触发', enabled: true },
  { id: '3', name: '错误告警响应', schedule: 'Sentry 错误 > 10/min', enabled: false },
  { id: '4', name: '依赖更新检测', schedule: '每周一 09:00', enabled: true },
  { id: '5', name: '安全扫描', schedule: '每日 02:00', enabled: false },
]

const defaultPlan = [
  { step: 1, title: '分析项目结构', status: 'done' as const },
  { step: 2, title: '识别重构目标', status: 'done' as const },
  { step: 3, title: '拆分组件目录', status: 'done' as const },
  { step: 4, title: '更新引用路径', status: 'current' as const },
  { step: 5, title: '运行测试验证', status: 'pending' as const },
  { step: 6, title: '生成变更报告', status: 'pending' as const },
]

const defaultRoutes = [
  { from: '用户指令', to: '任务解析', type: 'input' },
  { from: '任务解析', to: '上下文收集', type: 'process' },
  { from: '上下文收集', to: '方案生成', type: 'process' },
  { from: '方案生成', to: '代码执行', type: 'process' },
  { from: '代码执行', to: '结果验证', type: 'process' },
  { from: '结果验证', to: '用户反馈', type: 'output' },
]

interface CheckItem {
  id: string
  label: string
  checked: boolean
}

const defaultChecklist: CheckItem[] = [
  { id: '1', label: '代码风格检查', checked: true },
  { id: '2', label: '单元测试通过', checked: true },
  { id: '3', label: '类型安全验证', checked: true },
  { id: '4', label: 'E2E 测试覆盖', checked: false },
  { id: '5', label: '性能基准对比', checked: false },
  { id: '6', label: '安全漏洞扫描', checked: false },
]

import type { HistoryResultItem } from '../types'

const mockHistoryResults: HistoryResultItem[] = [
  {
    id: 'hr1', title: '张三 人脉调研', personName: '张三', time: '今天 14:30', status: 'success',
    contactCount: 5, platformCount: 8, duration: '12 分 35 秒',
    summary: '张三的全网调研已完成，共找到 5 种有效联系方式和 8 个社交平台账号。',
    topChannels: [
      { rank: 1, name: 'LinkedIn', reason: '最活跃平台，平均每周发文 3 次' },
      { rank: 2, name: 'Twitter/X', reason: '定期参与行业讨论' },
      { rank: 3, name: '个人网站', reason: '设有联系表单' },
    ],
    contacts: [
      { type: '商务邮箱', value: 'zh***@***.com' },
      { type: 'LinkedIn DM', value: '可直接发送' },
    ],
  },
  {
    id: 'hr2', title: 'John Smith 深度调研', personName: 'John Smith', time: '今天 10:15', status: 'success',
    contactCount: 7, platformCount: 6, duration: '15 分 12 秒',
    summary: 'John Smith 的全网调研已完成，共找到 7 种有效联系方式和 6 个社交平台账号。',
    topChannels: [
      { rank: 1, name: 'Twitter/X', reason: '日均发文 2 条，互动率 4.2%' },
      { rank: 2, name: '个人博客', reason: '每月更新 3-4 篇深度文章' },
      { rank: 3, name: 'LinkedIn', reason: '接受连接请求概率高' },
    ],
    contacts: [
      { type: '商务邮箱', value: 'jo***@***.com' },
      { type: 'Twitter DM', value: '开放 DM' },
      { type: '助理邮箱', value: 'as***@***.com' },
    ],
  },
  {
    id: 'hr3', title: '李明 快速调研', personName: '李明', time: '昨天 16:40', status: 'partial',
    contactCount: 2, platformCount: 4, duration: '5 分 03 秒',
    summary: '快速版调研完成，找到 2 种联系方式和 4 个社交平台。部分平台信息待补充。',
    topChannels: [
      { rank: 1, name: '微信公众号', reason: '每周更新 1-2 篇' },
      { rank: 2, name: '知乎', reason: '活跃回答者' },
    ],
    contacts: [
      { type: '公众号留言', value: '可直接留言' },
    ],
  },
  {
    id: 'hr4', title: 'Emily Chen 调研', personName: 'Emily Chen', time: '3 天前', status: 'success',
    contactCount: 4, platformCount: 5, duration: '11 分 48 秒',
    summary: 'Emily Chen 全网调研完成，投资人背景信息详尽。',
    topChannels: [
      { rank: 1, name: 'LinkedIn', reason: '投资人身份活跃' },
      { rank: 2, name: 'Medium', reason: '定期发布投资观点' },
    ],
    contacts: [
      { type: '商务邮箱', value: 'em***@***.vc' },
      { type: 'LinkedIn DM', value: '可直接发送' },
    ],
  },
]

type DetailTab = 'detail' | 'history'
type SectionKey = 'activities' | 'triggers' | 'plan' | 'routes' | 'checklist'
const statusColorMap = { success: '#00B42A', running: '#4C8BF5', failed: '#F53F3F' }
const statusLabelMap = { success: '完成', running: '进行中', failed: '失败' }
const planStatusColor = { done: '#00B42A', current: '#4C8BF5', pending: '#C9CDD4' }
const historyStatusColor = { success: '#00B42A', partial: '#FF7D00', failed: '#F53F3F' }
const historyStatusLabel = { success: '完成', partial: '部分完成', failed: '失败' }

export default function DetailPanel() {
  const { agents, selectedAgentId, detailVisible, toggleDetail, pendingActivityModal, setPendingActivityModal, sidebarCollapsed, toggleSidebar, detailDefaultTab, setDetailDefaultTab, historyResults: storeHistoryResults, pendingHistoryId, setPendingHistoryId } = useStore()
  const agent = agents.find((a) => a.id === selectedAgentId)

  const [activeTab, setActiveTab] = useState<DetailTab>('detail')
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    activities: true,
    triggers: false,
    plan: false,
    routes: false,
    checklist: false,
  })
  const [modalData, setModalData] = useState<{ title: string; content: React.ReactNode } | null>(null)
  const [triggers, setTriggers] = useState(defaultTriggers)
  const [checklist, setChecklist] = useState(defaultChecklist)
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [historyListOpen, setHistoryListOpen] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  const [panelWidth, setPanelWidth] = useState(() => Math.round(window.innerWidth * 0.6))
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(Math.round(window.innerWidth * 0.6))
  const prevSidebarState = useRef(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = startX.current - e.clientX
    const newWidth = Math.min(600, Math.max(240, startWidth.current + delta))
    setPanelWidth(newWidth)
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [panelWidth])

  const toggle = (key: SectionKey) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  const prevVisible = useRef(false)
  useEffect(() => {
    const wasVisible = prevVisible.current
    prevVisible.current = detailVisible

    if (detailVisible && !wasVisible) {
      prevSidebarState.current = sidebarCollapsed
      if (!sidebarCollapsed) {
        useStore.getState().toggleSidebar()
      }
    }
    if (!detailVisible && wasVisible) {
      if (!prevSidebarState.current && useStore.getState().sidebarCollapsed) {
        useStore.getState().toggleSidebar()
      }
    }
  }, [detailVisible])

  useEffect(() => {
    if (detailDefaultTab && detailVisible) {
      handleTabChange(detailDefaultTab)
      setDetailDefaultTab(null)
    }
  }, [detailDefaultTab, detailVisible])

  useEffect(() => {
    if (!pendingActivityModal || !agent) return
    if (pendingActivityModal.agentId !== agent.id) return
    const act = agent.activities.find(a => a.id === pendingActivityModal.activityId)
    if (!act) return
    setActiveTab('detail')
    setExpanded(prev => ({ ...prev, activities: true }))
    setModalData({
      title: act.action,
      content: renderActivityModalContent(act),
    })
    setPendingActivityModal(null)
  }, [pendingActivityModal, agent, setPendingActivityModal])

  const toggleTrigger = (id: string) => {
    setTriggers((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t))
    message.success('调度器状态已更新')
  }

  const toggleCheckItem = (id: string) => {
    setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, checked: !c.checked } : c))
  }

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab)
    if (tab === 'history') {
      setHistoryListOpen(true)
      setSelectedHistoryId(null)
    } else {
      setHistoryListOpen(false)
      setSelectedHistoryId(null)
    }
  }

  const handleSelectHistory = (id: string) => {
    setSelectedHistoryId(id)
  }

  const allHistoryResults = storeHistoryResults.length > 0
    ? storeHistoryResults
    : mockHistoryResults

  useEffect(() => {
    if (pendingHistoryId && detailVisible) {
      setSelectedHistoryId(pendingHistoryId)
      setHistoryListOpen(true)
      setPendingHistoryId(null)
    }
  }, [pendingHistoryId, detailVisible])

  if (!detailVisible || !agent) return null

  const checkedCount = checklist.filter((c) => c.checked).length
  const selectedHistory = allHistoryResults.find(h => h.id === selectedHistoryId)

  const agentPrompt = agent.currentTask
    ? `你是 ${agent.name}，一个专注于「${agent.currentTask}」的 AI Agent。\n\n你的核心能力包括：${agent.capabilities.join('、')}。\n\n请根据用户的调研需求，系统性地完成全网信息检索、联系方式提取、渠道活跃度分析，并生成结构化的调研报告。`
    : `你是 ${agent.name}，${agent.description}。\n\n你的核心能力包括：${agent.capabilities.join('、')}。\n\n请高效完成用户交给你的任务，输出结构化、可操作的结果。`

  const sections: { key: SectionKey; label: string; icon: React.ReactNode; count?: string | number; content: React.ReactNode }[] = [
    {
      key: 'activities',
      label: '元数据',
      icon: <HistoryOutlined style={{ fontSize: 14 }} />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <MetaRow label="模型" value={agent.model} />
          <MetaRow label="状态" value={<span style={{ color: statusColor[agent.status] }}>{statusText[agent.status]}</span>} />
          <MetaRow label="总运行" value={`${agent.totalRuns} 次`} />
          <MetaRow label="最近使用" value={agent.lastUsed} />
          <MetaRow label="能力标签" value={agent.capabilities.join('、')} />
          {agent.workspaceId && <MetaRow label="Workspace" value={agent.workspaceId} />}
        </div>
      ),
    },
    {
      key: 'plan',
      label: '系统提示词',
      icon: <ApartmentOutlined style={{ fontSize: 14 }} />,
      content: (
        <div style={{ padding: '8px 10px' }}>
          <div
            className="rounded-lg bg-[#F7F8FA] text-[12px] text-text-secondary whitespace-pre-wrap"
            style={{ padding: '14px 16px', lineHeight: 1.8, fontFamily: 'monospace' }}
          >
            {agentPrompt}
          </div>
        </div>
      ),
    },
    {
      key: 'routes',
      label: '活动历史',
      icon: <NodeIndexOutlined style={{ fontSize: 14 }} />,
      count: agent.activities.length,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {agent.activities.length === 0 ? (
            <div className="text-center" style={{ padding: '16px 10px' }}>
              <span className="text-[11px] text-text-tertiary">暂无活动记录</span>
            </div>
          ) : (
            agent.activities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="rounded-[8px] hover:bg-[#F7F8FA] cursor-pointer transition-colors"
                style={{ padding: '10px 10px' }}
                onClick={() => setModalData({ title: act.action, content: renderActivityModalContent(act) })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColorMap[act.status], flexShrink: 0 }} />
                    <span className="text-[12px] font-medium text-text-primary truncate">{act.action}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {act.duration && <span className="text-[10px] text-text-tertiary">{act.duration}</span>}
                    <span className="text-[11px] text-text-tertiary">{act.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
  ]

  const schedulerContent = (
    <div style={{ width: 240 }}>
      <div className="flex items-center justify-between" style={{ padding: '8px 4px 10px' }}>
        <span className="text-[13px] font-semibold text-text-primary">调度器列表</span>
        <span className="text-[11px] text-text-tertiary">{triggers.filter(t => t.enabled).length} 已启用</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {triggers.map(trigger => (
          <div
            key={trigger.id}
            className="flex items-center justify-between rounded-lg hover:bg-[#F7F8FA] transition-colors"
            style={{ padding: '10px 8px' }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <ClockCircleOutlined style={{ fontSize: 13, color: trigger.enabled ? '#4C8BF5' : '#C9CDD4' }} />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-text-primary truncate">{trigger.name}</span>
                <span className="text-[10px] text-text-tertiary">{trigger.schedule}</span>
              </div>
            </div>
            <button
              onClick={() => toggleTrigger(trigger.id)}
              className="shrink-0 rounded-full transition-colors"
              style={{
                width: 36, height: 20,
                background: trigger.enabled ? '#4C8BF5' : '#E5E6EB',
                position: 'relative',
                border: 'none', cursor: 'pointer',
              }}
            >
              <span
                className="block rounded-full bg-white transition-transform"
                style={{
                  width: 16, height: 16,
                  position: 'absolute', top: 2,
                  left: trigger.enabled ? 18 : 2,
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <div className="detail-panel-responsive flex shrink-0 overflow-hidden relative">
        {/* Main detail panel */}
        <div className="flex flex-col bg-bg-white border-l border-border shrink-0 overflow-hidden relative" style={{ width: panelWidth }}>
          <div className="detail-resize-handle" onMouseDown={handleResizeStart} />

          {/* Header: Tabs + Actions */}
          <div className="shrink-0 border-b border-border" style={{ height: 52, padding: '0 12px' }}>
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => handleTabChange('detail')}
                  className="flex items-center gap-1.5 rounded-lg transition-colors"
                  style={{
                    padding: '6px 12px', fontSize: 13, fontWeight: 500,
                    color: activeTab === 'detail' ? '#1D2129' : '#86909C',
                    background: activeTab === 'detail' ? '#F2F3F5' : 'transparent',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 13 }} />
                  详情
                </button>
                <button
                  onClick={() => handleTabChange('history')}
                  className="flex items-center gap-1.5 rounded-lg transition-colors"
                  style={{
                    padding: '6px 12px', fontSize: 13, fontWeight: 500,
                    color: activeTab === 'history' ? '#1D2129' : '#86909C',
                    background: activeTab === 'history' ? '#F2F3F5' : 'transparent',
                  }}
                >
                  <HistoryOutlined style={{ fontSize: 13 }} />
                  历史结果
                </button>
              </div>
              <div className="flex items-center gap-0.5">
                <Popover
                  open={schedulerOpen}
                  onOpenChange={setSchedulerOpen}
                  trigger="click"
                  placement="bottomRight"
                  arrow={false}
                  overlayInnerStyle={{ padding: '6px 8px', borderRadius: 12 }}
                  content={schedulerContent}
                >
                  <Tooltip title="调度器">
                    <button className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary">
                      <ThunderboltOutlined style={{ fontSize: 13 }} />
                    </button>
                  </Tooltip>
                </Popover>
                <Tooltip title="分享">
                  <button
                    onClick={() => message.info('分享功能开发中')}
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"
                  >
                    <ShareAltOutlined style={{ fontSize: 13 }} />
                  </button>
                </Tooltip>
                <Tooltip title="复制">
                  <button
                    onClick={() => { navigator.clipboard.writeText(agent.name + ' - ' + agent.description); message.success('已复制') }}
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"
                  >
                    <CopyOutlined style={{ fontSize: 13 }} />
                  </button>
                </Tooltip>
                <Tooltip title="关闭">
                  <button onClick={toggleDetail} className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary">
                    <CloseOutlined style={{ fontSize: 11 }} />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'detail' ? (
              <>
                {/* Agent Profile Card */}
                <div className="flex flex-col items-center" style={{ padding: '22px 20px 14px' }}>
                  <Badge dot color={statusColor[agent.status]} offset={[-4, 48]}>
                    <Avatar size={52} style={{ backgroundColor: '#4C8BF5', color: '#fff', fontSize: 18, fontWeight: 700 }}>{agent.avatar}</Avatar>
                  </Badge>
                  <h4 className="text-[15px] font-semibold text-text-primary" style={{ marginTop: 10 }}>{agent.name}</h4>
                  <p className="text-[12px] text-text-secondary text-center" style={{ marginTop: 4, lineHeight: 1.6, maxWidth: 220 }}>{agent.description}</p>
                  <div className="flex items-center" style={{ gap: 6, marginTop: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[agent.status] }} />
                    <span className="text-[12px] text-text-secondary">{statusText[agent.status]}</span>
                    {agent.totalRuns > 0 && <span className="text-[11px] text-text-tertiary" style={{ marginLeft: 8 }}>执行 {agent.totalRuns} 次</span>}
                  </div>
                  {agent.currentTask && agent.status === 'busy' && (
                    <div className="text-[11px] text-brand bg-brand-light rounded-md text-center truncate" style={{ marginTop: 8, padding: '4px 12px', maxWidth: 240 }}>
                      正在执行：{agent.currentTask}
                    </div>
                  )}
                </div>

                {/* Collapsible Sections */}
                {sections.map((section) => (
                  <div key={section.key} style={{ borderTop: '1px solid #F0F1F3' }}>
                    <button onClick={() => toggle(section.key)} className="flex items-center justify-between w-full hover:bg-[#F7F8FA] transition-colors" style={{ padding: '12px 20px' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary">{section.icon}</span>
                        <span className="text-[13px] font-medium text-text-primary">{section.label}</span>
                        {section.count !== undefined && <span className="text-[11px] text-text-tertiary">{section.count}</span>}
                      </div>
                      {expanded[section.key] ? <DownOutlined style={{ fontSize: 10, color: '#86909C' }} /> : <RightOutlined style={{ fontSize: 10, color: '#86909C' }} />}
                    </button>
                    {expanded[section.key] && <div style={{ padding: '0 10px 12px' }}>{section.content}</div>}
                  </div>
                ))}
              </>
            ) : (
              /* History result content */
              selectedHistory ? (
                <div style={{ padding: '20px 18px' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setSelectedHistoryId(null)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"
                    >
                      <RightOutlined style={{ fontSize: 10, transform: 'rotate(180deg)' }} />
                    </button>
                    <span className="text-[14px] font-semibold text-text-primary">{selectedHistory.personName}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full ml-auto"
                      style={{
                        background: selectedHistory.status === 'success' ? '#E8F5E9' : selectedHistory.status === 'partial' ? '#FFF7E6' : '#FFECEC',
                        color: historyStatusColor[selectedHistory.status],
                      }}
                    >
                      {historyStatusLabel[selectedHistory.status]}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 16 }}>
                    <div className="bg-[#F7F8FA] rounded-lg text-center" style={{ padding: '12px 8px' }}>
                      <div className="text-[18px] font-bold text-text-primary">{selectedHistory.contactCount}</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">联系方式</div>
                    </div>
                    <div className="bg-[#F7F8FA] rounded-lg text-center" style={{ padding: '12px 8px' }}>
                      <div className="text-[18px] font-bold text-text-primary">{selectedHistory.platformCount}</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">社交平台</div>
                    </div>
                    <div className="bg-[#F7F8FA] rounded-lg text-center" style={{ padding: '12px 8px' }}>
                      <div className="text-[18px] font-bold text-brand">{selectedHistory.duration}</div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">耗时</div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-lg bg-[#F7F8FA] text-[12px] text-text-secondary" style={{ padding: '12px 14px', lineHeight: 1.7, marginBottom: 16 }}>
                    {selectedHistory.summary}
                  </div>

                  {/* Top channels */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="text-[12px] font-semibold text-text-primary" style={{ marginBottom: 8 }}>最优触达渠道</div>
                    {selectedHistory.topChannels.map(ch => (
                      <div key={ch.rank} className="flex items-start gap-2 mb-2">
                        <span
                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                          style={{
                            background: ch.rank === 1 ? '#FFD700' : ch.rank === 2 ? '#C0C0C0' : '#CD7F32',
                            color: '#fff', marginTop: 1,
                          }}
                        >
                          {ch.rank}
                        </span>
                        <div>
                          <div className="text-[12px] font-medium text-text-primary">{ch.name}</div>
                          <div className="text-[10px] text-text-tertiary">{ch.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Contacts */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="text-[12px] font-semibold text-text-primary" style={{ marginBottom: 8 }}>联系方式</div>
                    {selectedHistory.contacts.map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-[#F7F8FA]" style={{ padding: '8px 12px', marginBottom: 4 }}>
                        <span className="text-[11px] text-text-tertiary">{c.type}</span>
                        <span className="text-[11px] text-text-primary font-medium">{c.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => message.info('Notion 文档跳转功能开发中')}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors hover:opacity-90"
                      style={{ padding: '8px 0', background: '#4C8BF5', color: '#fff' }}
                    >
                      <EyeOutlined style={{ fontSize: 12 }} /> 查看文档
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(selectedHistory.summary); message.success('已复制') }}
                      className="flex items-center justify-center gap-1.5 rounded-lg text-[12px] text-text-secondary hover:bg-[#F2F3F5] transition-colors"
                      style={{ padding: '8px 14px', border: '1px solid #E5E6EB' }}
                    >
                      <CopyOutlined style={{ fontSize: 12 }} /> 复制
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1" style={{ padding: '60px 20px' }}>
                  <SearchOutlined style={{ fontSize: 32, color: '#E5E6EB', marginBottom: 12 }} />
                  <span className="text-[13px] text-text-tertiary">从右侧选择一条历史记录查看详情</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* History list - right side panel */}
        {historyListOpen && activeTab === 'history' && (
          <div
            className="flex flex-col bg-[#FAFBFC] border-l border-border shrink-0 overflow-hidden"
            style={{ width: 200 }}
          >
            <div className="shrink-0 flex items-center justify-between border-b border-border" style={{ height: 52, padding: '0 12px' }}>
              <span className="text-[12px] font-semibold text-text-primary">历史记录</span>
              <span className="text-[10px] text-text-tertiary">{allHistoryResults.length} 条</span>
            </div>
            <div className="flex-1 overflow-y-auto scroll-fade">
              {allHistoryResults.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistory(item.id)}
                  className={`cursor-pointer transition-colors border-b border-[#F0F1F3] ${
                    selectedHistoryId === item.id ? 'bg-white' : 'hover:bg-[#F2F3F5]'
                  }`}
                  style={{ padding: '12px 12px' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: historyStatusColor[item.status], flexShrink: 0 }} />
                    <span className="text-[12px] font-medium text-text-primary truncate">{item.personName}</span>
                  </div>
                  <div className="text-[10px] text-text-tertiary truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-text-tertiary">{item.time}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: item.status === 'success' ? '#E8F5E9' : item.status === 'partial' ? '#FFF7E6' : '#FFECEC',
                        color: historyStatusColor[item.status],
                      }}
                    >
                      {historyStatusLabel[item.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal title={modalData?.title} open={!!modalData} onCancel={() => setModalData(null)} footer={null} width={520} centered>
        {modalData?.content}
      </Modal>
    </>
  )
}

function renderActivityModalContent(act: { action: string; status: 'success' | 'running' | 'failed'; duration?: string; time: string; steps?: string[]; result?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flex items-center gap-3">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColorMap[act.status] }} />
        <span className="text-[15px] font-medium">{act.action}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
          <div className="text-[11px] text-text-tertiary">耗时</div>
          <div className="text-[14px] font-semibold text-text-primary mt-0.5">{act.duration || '-'}</div>
        </div>
        <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
          <div className="text-[11px] text-text-tertiary">状态</div>
          <div className="text-[14px] font-semibold mt-0.5" style={{ color: statusColorMap[act.status] }}>{statusLabelMap[act.status]}</div>
        </div>
        <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
          <div className="text-[11px] text-text-tertiary">时间</div>
          <div className="text-[14px] font-semibold text-text-primary mt-0.5">{act.time}</div>
        </div>
      </div>
      {act.steps && act.steps.length > 0 && (
        <div>
          <div className="text-[13px] font-medium text-text-primary" style={{ marginBottom: 8 }}>执行步骤</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {act.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5" style={{ padding: '5px 0' }}>
                <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B42A' }} />
                  {i < act.steps!.length - 1 && <div style={{ width: 1, height: 16, background: '#E5E6EB', marginTop: 2 }} />}
                </div>
                <span className="text-[12px] text-text-secondary" style={{ lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {act.result && (
        <div>
          <div className="text-[13px] font-medium text-text-primary" style={{ marginBottom: 6 }}>执行结果</div>
          <div className="rounded-lg bg-[#F7F8FA] text-[12px] text-text-secondary" style={{ padding: '12px 14px', lineHeight: 1.7 }}>
            {act.result}
          </div>
        </div>
      )}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between" style={{ padding: '8px 10px', borderBottom: '1px solid #F7F8FA' }}>
      <span className="text-[12px] text-text-tertiary shrink-0" style={{ width: 70 }}>{label}</span>
      <span className="text-[12px] text-text-primary text-right" style={{ wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

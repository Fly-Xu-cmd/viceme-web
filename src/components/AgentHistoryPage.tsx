import { useState, useEffect, useRef } from 'react'
import { message, Tooltip, Avatar, Badge } from 'antd'
import {
  SearchOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useStore } from '../store'

type TabKey = 'recent' | 'all'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'recent', label: '最近' },
  { key: 'all', label: '全部' },
]

interface AgentItem {
  id: string
  name: string
  avatar: string
  description: string
  status: 'online' | 'busy' | 'offline'
  lastUsed: string
  totalRuns: number
  model: string
  tab: TabKey[]
}

const statusBadge: Record<string, 'success' | 'warning' | 'default'> = {
  online: 'success',
  busy: 'warning',
  offline: 'default',
}

const statusLabel: Record<string, string> = {
  online: '在线',
  busy: '执行中',
  offline: '离线',
}

const statusColor: Record<string, string> = {
  online: '#00B42A',
  busy: '#FF7D00',
  offline: '#C9CDD4',
}

function getAgentList(): AgentItem[] {
  const store = useStore.getState()
  const agents = store.agents

  if (agents.length > 0) {
    return agents.map((a) => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      description: a.description,
      status: a.status,
      lastUsed: a.lastUsed,
      totalRuns: a.totalRuns,
      model: a.model,
      tab: ['recent', 'all'] as TabKey[],
    }))
  }

  return [
    { id: 'a1', name: 'CodePilot', avatar: 'CP', description: '全栈开发助手，擅长代码编写、审查与重构', status: 'online', lastUsed: '2 分钟前', totalRuns: 1284, model: 'GPT-4o', tab: ['recent', 'all'] },
    { id: 'a2', name: 'DataBot', avatar: 'DB', description: '数据处理与分析专家，支持 SQL、Python 数据管道', status: 'busy', lastUsed: '执行中…', totalRuns: 567, model: 'Claude 3.5', tab: ['recent', 'all'] },
    { id: 'a3', name: 'DevOps Agent', avatar: 'DO', description: '运维部署助手，管理 CI/CD、容器与基础设施', status: 'online', lastUsed: '15 分钟前', totalRuns: 342, model: 'GPT-4o', tab: ['recent', 'all'] },
    { id: 'a4', name: 'DocWriter', avatar: 'DW', description: '技术文档撰写助手，生成 API 文档与使用指南', status: 'offline', lastUsed: '3 小时前', totalRuns: 89, model: 'Claude 3.5', tab: ['all'] },
    { id: 'a5', name: 'TestRunner', avatar: 'TR', description: '自动化测试助手，编写和运行测试用例', status: 'online', lastUsed: '30 分钟前', totalRuns: 456, model: 'GPT-4o', tab: ['recent', 'all'] },
    { id: 'a6', name: 'SecurityBot', avatar: 'SB', description: '安全审计助手，漏洞扫描与合规检查', status: 'offline', lastUsed: '昨天', totalRuns: 78, model: 'Claude 3.5', tab: ['all'] },
    { id: 'a7', name: '张三调研', avatar: '张三', description: '基于任务「调研张三的全网人脉」自动创建的执行 Agent', status: 'offline', lastUsed: '今天 14:30', totalRuns: 1, model: 'GPT-4o', tab: ['recent', 'all'] },
    { id: 'a8', name: 'John Smith 深度调研', avatar: 'JS', description: '基于任务「Deep research on John Smith」自动创建', status: 'offline', lastUsed: '今天 10:15', totalRuns: 1, model: 'GPT-4o', tab: ['recent', 'all'] },
  ]
}

export default function AgentHistoryPage() {
  const { sidebarCollapsed, toggleSidebar } = useStore()

  const [activeTab, setActiveTab] = useState<TabKey>('recent')
  const [searchOpen, setSearchOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const allAgents = getAgentList()
  const filteredAgents = allAgents.filter((a) => a.tab.includes(activeTab))

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-white h-full">
      <div className="flex-1 overflow-y-auto scroll-fade">
        <div style={{ width: '100%', padding: '0 32px' }}>
          {/* Top toolbar */}
          <div className="flex items-center gap-3" style={{ padding: '28px 0 20px' }}>
            <Tooltip title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}>
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-[#86909C] shrink-0"
              >
                {sidebarCollapsed ? <MenuUnfoldOutlined style={{ fontSize: 15 }} /> : <MenuFoldOutlined style={{ fontSize: 15 }} />}
              </button>
            </Tooltip>
            <h2 className="text-[16px] font-semibold text-[#1D2129]">Agents 历史</h2>
            <div className="flex-1" />
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 text-[13px] text-[#4E5969] hover:bg-[#F2F3F5] transition-colors"
              style={{ padding: '7px 14px', border: '1px solid #E5E6EB', borderRadius: 8 }}
            >
              <SearchOutlined style={{ fontSize: 13 }} />
              搜索
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1" style={{ borderBottom: '1px solid #F0F1F3', marginBottom: 4 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative transition-colors"
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? '#1D2129' : '#86909C',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{ width: 20, height: 2, background: '#1D2129', borderRadius: 1 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Column header */}
          <div
            className="flex items-center justify-between"
            style={{ padding: '10px 16px', fontSize: 12, color: '#C9CDD4' }}
          >
            <span>Agent</span>
            <span>最近活跃</span>
          </div>

          {/* Agent list */}
          <div>
            {filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: '60px 0' }}>
                <span className="text-[32px]" style={{ marginBottom: 12 }}>🤖</span>
                <span className="text-[13px] text-[#C9CDD4]">暂无 Agent 记录</span>
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const isHovered = hoveredId === agent.id

                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between transition-colors hover:bg-[#F7F8FA] cursor-pointer"
                    style={{ padding: '10px 16px', borderRadius: 8 }}
                    onMouseEnter={() => setHoveredId(agent.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => message.info(`查看 ${agent.name} 详情`)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge dot status={statusBadge[agent.status]} offset={[-2, 28]}>
                        <Avatar
                          size={34}
                          style={{
                            backgroundColor: agent.status === 'online' ? '#4C8BF5' : agent.status === 'busy' ? '#FF7D00' : '#E8E8E8',
                            color: agent.status === 'offline' ? '#6E7681' : '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {agent.avatar.length > 2 ? agent.avatar.slice(0, 2) : agent.avatar}
                        </Avatar>
                      </Badge>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-[#1D2129] truncate">{agent.name}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              background: agent.status === 'online' ? '#E8F5E9' : agent.status === 'busy' ? '#FFF7E6' : '#F7F8FA',
                              color: statusColor[agent.status],
                            }}
                          >
                            {statusLabel[agent.status]}
                          </span>
                          <span className="text-[11px] text-[#C9CDD4] shrink-0">{agent.model}</span>
                        </div>
                        <span className="text-[12px] text-[#86909C] truncate" style={{ marginTop: 2 }}>
                          {agent.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isHovered && (
                        <div className="flex items-center gap-0.5">
                          <Tooltip title="更多">
                            <button
                              onClick={(e) => { e.stopPropagation(); message.info('更多操作开发中') }}
                              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#E5E6EB] transition-colors"
                            >
                              <EllipsisOutlined style={{ fontSize: 14, color: '#86909C' }} />
                            </button>
                          </Tooltip>
                          <Tooltip title="删除">
                            <button
                              onClick={(e) => { e.stopPropagation(); message.info('删除功能开发中') }}
                              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#FFECEC] transition-colors"
                            >
                              <DeleteOutlined style={{ fontSize: 13, color: '#F53F3F' }} />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                      <div className="flex flex-col items-end" style={{ minWidth: 80 }}>
                        <span className="text-[12px] text-[#C9CDD4] whitespace-nowrap">{agent.lastUsed}</span>
                        <span className="text-[10px] text-[#C9CDD4]">{agent.totalRuns} 次运行</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <SearchModal
          agents={allAgents}
          onClose={() => setSearchOpen(false)}
          onSelect={(agent) => {
            setSearchOpen(false)
            message.info(`查看 ${agent.name} 详情`)
          }}
        />
      )}
    </div>
  )
}

function SearchModal({
  agents,
  onClose,
  onSelect,
}: {
  agents: AgentItem[]
  onClose: () => void
  onSelect: (agent: AgentItem) => void
}) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? agents.filter((a) =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      )
    : agents.slice(0, 6)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setActiveIdx(0) }, [query])
  useEffect(() => {
    const el = listRef.current?.children[activeIdx + 1] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx((prev) => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[activeIdx]) onSelect(results[activeIdx])
        break
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', paddingTop: '15vh' }}
      onClick={onClose}
    >
      <div
        className="bg-white overflow-hidden"
        style={{
          width: 620,
          maxWidth: '90vw',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
          animation: 'slideUp 0.15s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#F0F1F3]" style={{ padding: '14px 18px' }}>
          <SearchOutlined style={{ fontSize: 18, color: '#86909C' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索 Agent..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#1D2129]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors">
              <CloseOutlined style={{ fontSize: 11, color: '#86909C' }} />
            </button>
          )}
          <kbd className="text-[11px] text-[#C9CDD4] border border-[#E5E6EB] rounded" style={{ padding: '2px 6px', fontFamily: 'inherit' }}>ESC</kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 400 }}>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ padding: '40px 0' }}>
              <SearchOutlined style={{ fontSize: 28, color: '#E5E6EB', marginBottom: 8 }} />
              <span className="text-[13px] text-[#C9CDD4]">没有找到匹配的 Agent</span>
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 18px 4px' }}>
                <span className="text-[11px] text-[#C9CDD4] font-medium">
                  {query ? `${results.length} 个结果` : '最近使用'}
                </span>
              </div>
              {results.map((agent, i) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 cursor-pointer transition-colors"
                  style={{ padding: '10px 18px', background: i === activeIdx ? '#F2F3F5' : 'transparent' }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => onSelect(agent)}
                >
                  <Avatar
                    size={28}
                    style={{
                      backgroundColor: agent.status === 'online' ? '#4C8BF5' : agent.status === 'busy' ? '#FF7D00' : '#E8E8E8',
                      color: agent.status === 'offline' ? '#6E7681' : '#fff',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {agent.avatar.length > 2 ? agent.avatar.slice(0, 2) : agent.avatar}
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-[#1D2129] truncate">{agent.name}</span>
                    <span className="text-[11px] text-[#86909C] truncate">{agent.description}</span>
                  </div>
                  <span className="text-[11px] text-[#C9CDD4] shrink-0">{agent.lastUsed}</span>
                  {i === activeIdx && <span className="text-[11px] text-[#C9CDD4] shrink-0">↵</span>}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#F0F1F3]" style={{ padding: '8px 18px' }}>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#C9CDD4]">↑↓ 导航</span>
            <span className="text-[11px] text-[#C9CDD4]">↵ 打开</span>
            <span className="text-[11px] text-[#C9CDD4]">ESC 关闭</span>
          </div>
          <span className="text-[11px] text-[#C9CDD4]">{agents.length} 个 Agent</span>
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Avatar, Badge, Tooltip, Input, message } from 'antd'
import {
  PlusOutlined,
  SettingOutlined,
  UserOutlined,
  FolderOutlined,
  DownOutlined,
  UpOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  LogoutOutlined,
  HistoryOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useStore } from '../store'

const statusBadge: Record<string, 'success' | 'warning' | 'default'> = {
  online: 'success',
  busy: 'warning',
  offline: 'default',
}

const statusText: Record<string, string> = {
  online: '在线',
  busy: '执行中',
  offline: '离线',
}

const DEFAULT_SHOW = 4

export default function Sidebar() {
  const {
    agents,
    workspaces,
    selectedWorkspaceId,
    selectedAgentId,
    sidebarCollapsed,
    selectWorkspace,
    selectAgent,
    createWorkspace,
    deleteWorkspace,
    toggleSidebar,
    executions,
    isLoggedIn,
    user,
    logout,
    setShowLoginModal,
    setSettingsOpen,
    setAgentHistoryOpen,
  } = useStore()

  const [wsExpanded, setWsExpanded] = useState(false)
  const [agentExpanded, setAgentExpanded] = useState(false)
  const [toolbarOpen, setToolbarOpen] = useState(false)
  const [authInfoOpen, setAuthInfoOpen] = useState(false)

  const [renamingWsId, setRenamingWsId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const visibleWs = wsExpanded ? workspaces : workspaces.slice(0, DEFAULT_SHOW)
  const visibleAgents = agentExpanded ? agents : agents.slice(0, DEFAULT_SHOW)

  const { renameWorkspace } = useStore()

  const handleNewConversation = () => {
    selectWorkspace('')
    setAgentHistoryOpen(false)
  }

  const handleStartRename = (wsId: string, currentName: string) => {
    setRenamingWsId(wsId)
    setRenameValue(currentName)
  }

  const handleFinishRename = () => {
    if (renamingWsId && renameValue.trim()) {
      renameWorkspace(renamingWsId, renameValue.trim())
    }
    setRenamingWsId(null)
    setRenameValue('')
  }

  if (sidebarCollapsed) {
    return null
  }

  return (
    <>
      <div className="sidebar-expanded flex flex-col w-[240px] bg-[#F7F8FA] border-r border-border shrink-0 transition-all duration-200">
        {/* Brand */}
        <div className="flex items-center" style={{ padding: '18px 16px' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-brand flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">V</span>
            </div>
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">Viceme</span>
          </div>
        </div>

        {/* 新建 Workspace - 固定 */}
        <div className="shrink-0" style={{ padding: '0 8px 4px' }}>
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 transition-colors hover:opacity-90"
            style={{ height: 38, borderRadius: 999, background: '#FFFFFF', border: '1px solid #E5E6EB' }}
          >
            <EditOutlined style={{ fontSize: 13, color: '#1D2129' }} />
            <span className="text-[13px] font-semibold" style={{ color: '#1D2129' }}>新建 Workspace</span>
          </button>
        </div>

        <div className="shrink-0" style={{ margin: '4px 16px', borderTop: '1px solid #F0F1F3' }} />

        <div className="flex-1 overflow-y-auto scroll-fade">
          {/* Agents 历史 */}
          <div style={{ padding: '0 8px' }}>
            <button
              onClick={() => setAgentHistoryOpen(true)}
              className="w-full flex items-center gap-3 rounded-[8px] hover:bg-[#F2F3F5] transition-colors"
              style={{ height: 40, padding: '0 8px' }}
            >
              <HistoryOutlined style={{ fontSize: 14, color: '#86909C' }} />
              <span className="text-[13px] font-medium text-text-primary">Agents 历史</span>
              {agents.length > 0 && <span className="text-[11px] text-text-tertiary ml-auto">{agents.length}</span>}
            </button>
          </div>

          {/* 历史记录区 - Agents */}
          <div style={{ padding: '0 8px' }}>
            <div className="flex items-center justify-between" style={{ padding: '8px 8px' }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-text-tertiary">Agents</span>
                {agents.length > 0 && <span className="text-[11px] text-text-tertiary">{agents.length}</span>}
              </div>
              <Tooltip title="Workspace 中自动生成">
                <QuestionCircleOutlined style={{ fontSize: 12, color: '#C9CDD4' }} />
              </Tooltip>
            </div>
            {agents.length === 0 ? (
              <div className="text-center" style={{ padding: '12px 8px 16px' }}>
                <span className="text-[11px] text-text-tertiary">在 Workspace 中对话后自动生成</span>
              </div>
            ) : (
              <>
                {visibleAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => selectAgent(agent.id)}
                    className={`flex items-center gap-3 rounded-[8px] cursor-pointer transition-colors ${
                      selectedAgentId === agent.id ? 'bg-[#F2F3F5]' : 'hover:bg-[#F7F8FA]'
                    }`}
                    style={{ height: 44, padding: '0 8px' }}
                  >
                    <Badge dot status={statusBadge[agent.status]} offset={[-1, 24]}>
                      <Avatar
                        size={32}
                        style={{
                          backgroundColor: selectedAgentId === agent.id ? '#4C8BF5' : '#E8E8E8',
                          color: selectedAgentId === agent.id ? '#fff' : '#6E7681',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {agent.avatar}
                      </Avatar>
                    </Badge>
                    <span className={`text-[13px] truncate flex-1 ${
                      selectedAgentId === agent.id ? 'font-medium text-text-primary' : 'text-text-primary'
                    }`}>
                      {agent.name}
                    </span>
                    <span className="text-[11px] text-text-tertiary shrink-0">{statusText[agent.status]}</span>
                  </div>
                ))}
                {agents.length > DEFAULT_SHOW && (
                  <button
                    onClick={() => setAgentExpanded((v) => !v)}
                    className="flex items-center justify-center gap-1 w-full text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
                    style={{ padding: '8px 0' }}
                  >
                    {agentExpanded ? <><UpOutlined style={{ fontSize: 9 }} /> 收起</> : <><DownOutlined style={{ fontSize: 9 }} /> 展开更多 ({agents.length - DEFAULT_SHOW})</>}
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{ margin: '4px 16px', borderTop: '1px solid #F0F1F3' }} />

          {/* 历史记录区 - Workspaces */}
          <div style={{ padding: '0 8px' }}>
            <div className="flex items-center justify-between" style={{ padding: '12px 8px 8px' }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-text-tertiary">Workspaces</span>
                {workspaces.length > 0 && <span className="text-[11px] text-text-tertiary">{workspaces.length}</span>}
              </div>
            </div>
            {workspaces.length === 0 ? (
              <div className="text-center" style={{ padding: '16px 8px' }}>
                <span className="text-[11px] text-text-tertiary">输入消息自动创建 Workspace</span>
              </div>
            ) : (
              <>
                {visibleWs.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => { if (renamingWsId !== ws.id) { selectWorkspace(ws.id); setAgentHistoryOpen(false) } }}
                    className={`flex items-center gap-3 rounded-[8px] cursor-pointer transition-colors group ${
                      selectedWorkspaceId === ws.id ? 'bg-[#F2F3F5]' : 'hover:bg-[#F7F8FA]'
                    }`}
                    style={{ height: 44, padding: '0 8px' }}
                  >
                    {executions[ws.id]?.running ? (
                      <LoadingOutlined style={{ fontSize: 16, color: '#4C8BF5' }} spin />
                    ) : (
                      <FolderOutlined style={{ fontSize: 16, color: '#86909C' }} />
                    )}
                    {renamingWsId === ws.id ? (
                      <Input
                        size="small"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onPressEnter={handleFinishRename}
                        onBlur={handleFinishRename}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 !text-[13px]"
                        style={{ height: 28 }}
                      />
                    ) : (
                      <span className={`text-[13px] truncate flex-1 ${selectedWorkspaceId === ws.id ? 'font-medium' : ''}`}>
                        {ws.name}
                      </span>
                    )}
                    {renamingWsId !== ws.id && (() => {
                      const agentCount = agents.filter(a => a.workspaceId === ws.id).length
                      return <>
                        {agentCount > 0 && (
                          <span className="w-[18px] h-[18px] rounded-full bg-[#F2F3F5] text-[10px] text-text-tertiary flex items-center justify-center shrink-0 group-hover:hidden">
                            {agentCount}
                          </span>
                        )}
                        <div className="items-center gap-0.5 shrink-0 hidden group-hover:flex">
                          <Tooltip title="重命名">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartRename(ws.id, ws.name) }}
                              className="w-[20px] h-[20px] rounded flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
                            >
                              <EditOutlined style={{ fontSize: 11 }} />
                            </button>
                          </Tooltip>
                          <Tooltip title="删除">
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteWorkspace(ws.id) }}
                              className="w-[20px] h-[20px] rounded flex items-center justify-center text-text-tertiary hover:text-red-500 transition-colors"
                            >
                              <DeleteOutlined style={{ fontSize: 11 }} />
                            </button>
                          </Tooltip>
                        </div>
                      </>
                    })()}
                  </div>
                ))}
                {workspaces.length > DEFAULT_SHOW && (
                  <button
                    onClick={() => setWsExpanded((v) => !v)}
                    className="flex items-center justify-center gap-1 w-full text-[12px] text-text-tertiary hover:text-text-secondary transition-colors"
                    style={{ padding: '8px 0' }}
                  >
                    {wsExpanded ? <><UpOutlined style={{ fontSize: 9 }} /> 收起</> : <><DownOutlined style={{ fontSize: 9 }} /> 展开更多 ({workspaces.length - DEFAULT_SHOW})</>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* User */}
        <div className="border-t border-border relative">
          {isLoggedIn && user ? (
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-[#F7F8FA] transition-colors"
              style={{ padding: '14px 16px 24px' }}
              onClick={() => setToolbarOpen(v => !v)}
            >
              <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#E8E8E8', color: '#6E7681' }} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-medium truncate leading-tight">{user.name}</span>
                <span className="text-[11px] text-text-tertiary leading-tight mt-0.5">{user.plan}</span>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-[#F7F8FA] transition-colors"
              style={{ padding: '14px 16px 24px' }}
              onClick={() => setAuthInfoOpen(v => !v)}
            >
              <div
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FFF7E6', fontSize: 18 }}
              >
                🐵
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] text-text-secondary leading-tight">嘿，来聊聊？</span>
                <span className="text-[11px] text-text-tertiary leading-tight mt-0.5">点击登录解锁更多</span>
              </div>
            </div>
          )}

          {toolbarOpen && isLoggedIn && (
            <UserToolbar
              isLoggedIn={isLoggedIn}
              onClose={() => setToolbarOpen(false)}
              onSettings={() => { setToolbarOpen(false); setSettingsOpen(true) }}
              onAgentsHistory={() => { setToolbarOpen(false); setAgentHistoryOpen(true) }}
              onLogout={() => { setToolbarOpen(false); logout(); setSettingsOpen(false) }}
              onLogin={() => { setToolbarOpen(false); setShowLoginModal(true) }}
            />
          )}

          {authInfoOpen && !isLoggedIn && (
            <AuthInfoPanel
              onClose={() => setAuthInfoOpen(false)}
              onLogin={() => { setAuthInfoOpen(false); setShowLoginModal(true) }}
            />
          )}
        </div>
      </div>

    </>
  )
}

function UserToolbar({
  isLoggedIn,
  onClose,
  onSettings,
  onAgentsHistory,
  onLogout,
  onLogin,
}: {
  isLoggedIn: boolean
  onClose: () => void
  onSettings: () => void
  onAgentsHistory: () => void
  onLogout: () => void
  onLogin: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const itemClass =
    'w-full flex items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-[#F2F3F5] text-[13px]'
  const itemStyle = { padding: '9px 12px', color: '#1D2129' }

  return (
    <div
      ref={ref}
      className="absolute left-2 right-2 bg-white rounded-xl z-50"
      style={{
        bottom: '100%',
        marginBottom: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #F0F1F3',
        padding: '6px',
      }}
    >
      {!isLoggedIn && (
        <>
          <button onClick={onLogin} className={itemClass} style={itemStyle}>
            <UserOutlined style={{ fontSize: 14, color: '#86909C' }} />
            登录 / 注册
          </button>
          <div style={{ margin: '4px 8px', borderTop: '1px solid #F0F1F3' }} />
        </>
      )}

      <button onClick={onSettings} className={itemClass} style={itemStyle}>
        <SettingOutlined style={{ fontSize: 14, color: '#86909C' }} />
        设置
      </button>
      <button onClick={onAgentsHistory} className={itemClass} style={itemStyle}>
        <HistoryOutlined style={{ fontSize: 14, color: '#86909C' }} />
        Agents 历史
      </button>

      <div style={{ margin: '4px 8px', borderTop: '1px solid #F0F1F3' }} />

      <button
        onClick={() => { onClose(); message.info('移动端 APP 即将上线，敬请期待') }}
        className={itemClass}
        style={itemStyle}
      >
        <AppstoreOutlined style={{ fontSize: 14, color: '#86909C' }} />
        下载手机应用
      </button>

      {isLoggedIn && (
        <>
          <div style={{ margin: '4px 8px', borderTop: '1px solid #F0F1F3' }} />
          <button onClick={onLogout} className={itemClass} style={{ ...itemStyle, color: '#F53F3F' }}>
            <LogoutOutlined style={{ fontSize: 14 }} />
            退出登录
          </button>
        </>
      )}
    </div>
  )
}

const AUTH_FEATURES = [
  { icon: '🔍', text: '启动 AI 深度调研任务' },
  { icon: '📋', text: '生成结构化人物档案' },
  { icon: '📝', text: '对接 Notion 自动存储报告' },
  { icon: '📊', text: '查看完整调研运行日志' },
]

function AuthInfoPanel({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-2 right-2 bg-white rounded-xl z-50"
      style={{
        bottom: '100%',
        marginBottom: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #F0F1F3',
        padding: '20px 18px',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[32px] h-[32px] rounded-[8px] bg-brand flex items-center justify-center shrink-0">
          <span className="text-white text-[12px] font-bold">V</span>
        </div>
        <div>
          <div className="text-[15px] font-semibold text-text-primary leading-tight">Viceme</div>
          <div className="text-[12px] text-text-tertiary leading-tight mt-1">AI 全网人脉深度调研平台</div>
        </div>
      </div>

      <div style={{ margin: '0 0 14px', borderTop: '1px solid #F0F1F3' }} />

      <div className="text-[12px] text-text-tertiary font-medium mb-3" style={{ padding: '0 4px' }}>
        登录后可使用以下功能
      </div>
      <div className="flex flex-col gap-0.5 mb-4">
        {AUTH_FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5" style={{ padding: '7px 4px' }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span className="text-[13px] text-text-secondary">{f.text}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: '0 0 14px', borderTop: '1px solid #F0F1F3' }} />

      <div className="flex flex-col gap-2 mb-4" style={{ padding: '0 4px' }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-tertiary">主体：</span>
          <span className="text-[12px] text-text-secondary">ViceMe Inc.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-tertiary">安全：</span>
          <span className="text-[12px] text-text-secondary">数据加密存储，不共享第三方</span>
        </div>
      </div>

      <button
        onClick={onLogin}
        className="w-full flex items-center justify-center text-[13px] transition-colors hover:bg-[#F2F3F5]"
        style={{ background: '#F7F8FA', color: '#4C8BF5', padding: '10px 0', borderRadius: 8, border: '1px solid #E5E6EB' }}
      >
        登录 / 注册
      </button>
      <div className="text-center mt-2.5">
        <span className="text-[11px] text-text-tertiary">首次调研免费体验</span>
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <button onClick={() => message.info('隐私政策页面开发中')} className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          隐私政策
        </button>
        <span className="text-[11px] text-text-tertiary">·</span>
        <button onClick={() => message.info('用户协议页面开发中')} className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          用户协议
        </button>
      </div>
    </div>
  )
}

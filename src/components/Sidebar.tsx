import { useState, useRef, useEffect } from 'react'
import { Avatar, Badge, Tooltip, Input, message } from 'antd'
import {
  PlusOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  FolderOutlined,
  DownOutlined,
  UpOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  CrownOutlined,
  BellOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
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
  } = useStore()

  const [wsExpanded, setWsExpanded] = useState(false)
  const [agentExpanded, setAgentExpanded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [renamingWsId, setRenamingWsId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const visibleWs = wsExpanded ? workspaces : workspaces.slice(0, DEFAULT_SHOW)
  const visibleAgents = agentExpanded ? agents : agents.slice(0, DEFAULT_SHOW)

  const { renameWorkspace } = useStore()

  const handleNewConversation = () => {
    selectWorkspace('')
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
    return (
      <div className="flex flex-col items-center w-[56px] bg-bg-white border-r border-border gap-2 shrink-0" style={{ paddingTop: 18, paddingBottom: 16 }}>
        <Tooltip title="展开侧栏" placement="right">
          <button onClick={toggleSidebar} className="w-8 h-8 rounded-[8px] bg-brand flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-white text-[11px] font-bold">V</span>
          </button>
        </Tooltip>
        <div className="flex-1" />
        {isLoggedIn ? (
          <Tooltip title="设置" placement="right">
            <button className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-secondary">
              <SettingOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
        ) : (
          <Tooltip title="登录 / 注册" placement="right">
            <button onClick={() => setShowLoginModal(true)} className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary">
              <UserOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="sidebar-expanded flex flex-col w-[240px] bg-bg-white border-r border-border shrink-0">
        {/* Brand */}
        <div className="flex items-center justify-between" style={{ padding: '18px 16px' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-brand flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">V</span>
            </div>
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">Viceme</span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="新建 Workspace">
              <button onClick={handleNewConversation} className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-secondary">
                <PlusOutlined style={{ fontSize: 13 }} />
              </button>
            </Tooltip>
            <Tooltip title="收起">
              <button onClick={toggleSidebar} className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-secondary">
                <MenuFoldOutlined style={{ fontSize: 13 }} />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-fade">
          {/* Agents */}
          <div style={{ padding: '0 8px' }}>
            <div className="flex items-center justify-between" style={{ padding: '12px 8px' }}>
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

          {/* Workspaces */}
          <div style={{ padding: '0 8px' }}>
            <div className="flex items-center justify-between" style={{ padding: '12px 8px' }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-text-tertiary">Workspaces</span>
                {workspaces.length > 0 && <span className="text-[11px] text-text-tertiary">{workspaces.length}</span>}
              </div>
              <Tooltip title="新建 Workspace">
                <button onClick={handleNewConversation} className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary">
                  <PlusOutlined style={{ fontSize: 10 }} />
                </button>
              </Tooltip>
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
                    onClick={() => { if (renamingWsId !== ws.id) selectWorkspace(ws.id) }}
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
              onClick={() => setSettingsOpen(v => !v)}
            >
              <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#E8E8E8', color: '#6E7681' }} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-medium truncate leading-tight">{user.name}</span>
                <span className="text-[11px] text-text-tertiary leading-tight mt-0.5">{user.plan}</span>
              </div>
              <button
                className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"
                onClick={e => { e.stopPropagation(); setSettingsOpen(v => !v) }}
              >
                <SettingOutlined style={{ fontSize: 14 }} />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-[#F7F8FA] transition-colors"
              style={{ padding: '14px 16px 24px' }}
              onClick={() => setShowLoginModal(true)}
            >
              <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#F2F3F5', color: '#C9CDD4' }} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] text-text-secondary leading-tight">未登录</span>
                <span className="text-[11px] text-brand leading-tight mt-0.5 hover:underline">登录 / 注册</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && isLoggedIn && user && (
        <UserSettingsPanel user={user} onClose={() => setSettingsOpen(false)} onLogout={() => { logout(); setSettingsOpen(false) }} />
      )}
    </>
  )
}

type SettingsTab = 'account' | 'plan' | 'notification' | 'preference' | 'about'

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'account', label: '账号信息', icon: <UserOutlined style={{ fontSize: 14 }} /> },
  { key: 'plan', label: '套餐与余额', icon: <CrownOutlined style={{ fontSize: 14 }} /> },
  { key: 'notification', label: '通知设置', icon: <BellOutlined style={{ fontSize: 14 }} /> },
  { key: 'preference', label: '偏好设置', icon: <GlobalOutlined style={{ fontSize: 14 }} /> },
  { key: 'about', label: '关于', icon: <InfoCircleOutlined style={{ fontSize: 14 }} /> },
]

function UserSettingsPanel({ user, onClose, onLogout }: { user: import('../types').User; onClose: () => void; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
      <div
        ref={panelRef}
        className="bg-white rounded-2xl overflow-hidden"
        style={{
          width: 580,
          boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #F0F1F3',
        }}
      >
        <div className="flex" style={{ height: 420 }}>
        {/* Left tabs */}
        <div className="flex flex-col shrink-0 bg-[#FAFAFA] border-r border-[#F0F1F3]" style={{ width: 160, padding: '16px 8px' }}>
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2.5 rounded-lg transition-colors text-left"
              style={{
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 500 : 400,
                color: activeTab === tab.key ? '#1D2129' : '#6E7681',
                background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span style={{ color: activeTab === tab.key ? '#4C8BF5' : '#86909C' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 rounded-lg transition-colors text-left hover:bg-[#FFF5F5]"
            style={{ padding: '10px 12px', fontSize: 13, color: '#F53F3F' }}
          >
            <LogoutOutlined style={{ fontSize: 14 }} />
            退出登录
          </button>
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
          {activeTab === 'account' && <AccountContent user={user} />}
          {activeTab === 'plan' && <PlanContent user={user} />}
          {activeTab === 'notification' && <NotificationContent />}
          {activeTab === 'preference' && <PreferenceContent />}
          {activeTab === 'about' && <AboutContent />}
        </div>
      </div>
      </div>
    </div>
  )
}

function SettingsRow({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid #F7F8FA' }}>
      <span className="text-[13px] text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-text-primary font-medium">{value}</span>
        {action}
      </div>
    </div>
  )
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick || (() => message.info('功能开发中'))}
      className="text-[12px] text-brand hover:text-brand-hover transition-colors"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {children}
    </button>
  )
}

function AccountContent({ user }: { user: import('../types').User }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D2129', marginBottom: 16 }}>账号信息</h3>
      <SettingsRow label="昵称" value={user.name} action={<SmallBtn>修改</SmallBtn>} />
      <SettingsRow label="手机号" value={user.phone || '未绑定'} action={<SmallBtn>{user.phone ? '换绑' : '绑定'}</SmallBtn>} />
      <SettingsRow label="邮箱" value={user.email || '未绑定'} action={<SmallBtn>{user.email ? '换绑' : '绑定'}</SmallBtn>} />
      <SettingsRow label="微信" value="已绑定" action={<SmallBtn>解绑</SmallBtn>} />
      <SettingsRow label="注册时间" value={user.createdAt} />
    </div>
  )
}

function PlanContent({ user }: { user: import('../types').User }) {
  const used = user.totalQuota - user.remainingQuota
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D2129', marginBottom: 16 }}>套餐与余额</h3>
      <div className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/80 text-[12px]">当前套餐</span>
          <span className="text-white text-[12px] bg-white/20 rounded-full px-3 py-0.5">{user.plan}</span>
        </div>
        <div className="text-white text-[28px] font-bold">{user.remainingQuota} <span className="text-[14px] font-normal text-white/70">次剩余</span></div>
        <div className="text-white/60 text-[12px] mt-1">首次注册赠送 {user.totalQuota} 次完整调研额度</div>
      </div>
      <SettingsRow label="已使用" value={`${used} 次`} />
      <SettingsRow label="总额度" value={`${user.totalQuota} 次`} />
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => message.info('充值功能开发中')}
          className="w-full flex items-center justify-center rounded-xl text-[14px] font-medium transition-colors hover:opacity-90"
          style={{ background: '#4C8BF5', color: '#fff', padding: '11px 0' }}
        >
          充值额度
        </button>
      </div>
    </div>
  )
}

function NotificationContent() {
  const [browser, setBrowser] = useState(true)
  const [email, setEmail] = useState(false)
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D2129', marginBottom: 16 }}>通知设置</h3>
      <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid #F7F8FA' }}>
        <div>
          <div className="text-[13px] text-text-primary font-medium">浏览器通知</div>
          <div className="text-[11px] text-text-tertiary mt-1">调研完成时发送桌面通知</div>
        </div>
        <button
          onClick={() => setBrowser(v => !v)}
          className="rounded-full transition-colors"
          style={{ width: 40, height: 22, background: browser ? '#4C8BF5' : '#E5E6EB', position: 'relative' }}
        >
          <span className="block rounded-full bg-white transition-transform" style={{ width: 18, height: 18, position: 'absolute', top: 2, left: browser ? 20 : 2 }} />
        </button>
      </div>
      <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid #F7F8FA' }}>
        <div>
          <div className="text-[13px] text-text-primary font-medium">邮件通知</div>
          <div className="text-[11px] text-text-tertiary mt-1">调研完成时发送邮件摘要</div>
        </div>
        <button
          onClick={() => setEmail(v => !v)}
          className="rounded-full transition-colors"
          style={{ width: 40, height: 22, background: email ? '#4C8BF5' : '#E5E6EB', position: 'relative' }}
        >
          <span className="block rounded-full bg-white transition-transform" style={{ width: 18, height: 18, position: 'absolute', top: 2, left: email ? 20 : 2 }} />
        </button>
      </div>
    </div>
  )
}

function PreferenceContent() {
  const [lang, setLang] = useState('zh')
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D2129', marginBottom: 16 }}>偏好设置</h3>
      <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid #F7F8FA' }}>
        <span className="text-[13px] text-text-secondary">界面语言</span>
        <div className="flex gap-2">
          {[{ k: 'zh', l: '中文' }, { k: 'en', l: 'English' }].map(opt => (
            <button
              key={opt.k}
              onClick={() => setLang(opt.k)}
              className="rounded-lg text-[12px] transition-colors"
              style={{
                padding: '5px 14px',
                background: lang === opt.k ? '#EFF5FF' : '#F7F8FA',
                color: lang === opt.k ? '#4C8BF5' : '#6E7681',
                fontWeight: lang === opt.k ? 500 : 400,
              }}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
      <SettingsRow label="调研报告语言" value="中英双语" action={<SmallBtn>修改</SmallBtn>} />
      <SettingsRow label="默认调研档位" value="完整版" action={<SmallBtn>修改</SmallBtn>} />
    </div>
  )
}

function AboutContent() {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D2129', marginBottom: 16 }}>关于 Viceme</h3>
      <SettingsRow label="版本" value="V0.1 Beta" />
      <SettingsRow label="更新日期" value="2026-05-18" />
      <div style={{ marginTop: 20 }}>
        <p className="text-[12px] text-text-tertiary" style={{ lineHeight: 1.8 }}>
          Viceme 是面向创始人的 AI 全网人物深度调研工具。
          一句话下达需求，自动完成人脉信息搜集、渠道分析、触达策略生成。
        </p>
      </div>
      <div className="flex gap-4" style={{ marginTop: 16 }}>
        <SmallBtn>使用帮助</SmallBtn>
        <SmallBtn>联系我们</SmallBtn>
        <SmallBtn>隐私政策</SmallBtn>
      </div>
    </div>
  )
}

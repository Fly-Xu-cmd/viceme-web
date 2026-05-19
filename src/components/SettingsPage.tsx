import { useState, useEffect, useRef } from 'react'
import { message, Avatar } from 'antd'
import {
  LeftOutlined,
  UserOutlined,
  RightOutlined,
  LockOutlined,
  GlobalOutlined,
  SoundOutlined,
  QuestionCircleOutlined,
  HeartOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useStore } from '../store'

interface SettingRowProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value?: React.ReactNode
  onClick?: () => void
  toggle?: { checked: boolean; onChange: (v: boolean) => void }
  noBorder?: boolean
}

function SettingRow({ icon, iconBg, label, value, onClick, toggle, noBorder }: SettingRowProps) {
  return (
    <div
      className={`flex items-center justify-between transition-colors ${onClick || toggle ? 'cursor-pointer hover:bg-[#F7F8FA]' : ''}`}
      style={{
        padding: '14px 20px',
        borderBottom: noBorder ? 'none' : '1px solid #F7F8FA',
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </span>
        <span className="text-[14px] text-[#1D2129] font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[13px] text-[#86909C]">{value}</span>}
        {toggle ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggle.onChange(!toggle.checked) }}
            className="rounded-full transition-colors shrink-0"
            style={{
              width: 44,
              height: 24,
              background: toggle.checked ? '#00B42A' : '#E5E6EB',
              position: 'relative',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="block rounded-full bg-white transition-all shadow-sm"
              style={{
                width: 20,
                height: 20,
                position: 'absolute',
                top: 2,
                left: toggle.checked ? 22 : 2,
              }}
            />
          </button>
        ) : onClick ? (
          <RightOutlined style={{ fontSize: 12, color: '#C9CDD4' }} />
        ) : null}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout, setSettingsOpen } = useStore()

  const [langDropdown, setLangDropdown] = useState(false)
  const [selectedLang, setSelectedLang] = useState('中文（简体）')
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [autoCookie, setAutoCookie] = useState(true)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [setSettingsOpen])

  if (!user) return null

  const languages = ['中文（简体）', '中文（繁體）', 'English', '日本語']

  const handleLogout = () => {
    logout()
    setSettingsOpen(false)
  }

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 flex items-center h-[56px] px-4 bg-white/80 backdrop-blur-md">
        <button
          onClick={() => setSettingsOpen(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F2F3F5] transition-colors"
        >
          <LeftOutlined style={{ fontSize: 16, color: '#1D2129' }} />
        </button>
        <span className="flex-1 text-center text-[17px] font-semibold text-[#1D2129] pr-8">设置</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex justify-center scroll-fade">
        <div style={{ width: '100%', maxWidth: 520, padding: '0 24px' }}>
          {/* User profile header */}
          <div className="flex flex-col items-center" style={{ padding: '24px 0 28px' }}>
            <Avatar
              size={80}
              icon={<UserOutlined style={{ fontSize: 36 }} />}
              style={{ backgroundColor: '#E8E8E8', color: '#6E7681', marginBottom: 16 }}
            />
            <h3 className="text-[20px] font-semibold text-[#1D2129]" style={{ marginBottom: 4 }}>
              {user.name}
            </h3>
            <span className="text-[13px] text-[#C9CDD4]" style={{ marginBottom: 16 }}>
              user_{user.id}
            </span>
            <button
              onClick={() => message.info('账号管理功能开发中')}
              className="rounded-full border border-[#E5E6EB] text-[13px] text-[#4E5969] font-medium hover:bg-[#F7F8FA] transition-colors"
              style={{ padding: '8px 24px' }}
            >
              Viceme 账号管理
            </button>
          </div>

          {/* Group 1: Privacy */}
          <div style={{ marginBottom: 10 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0F1F3' }}>
              <SettingRow
                icon={<LockOutlined style={{ fontSize: 15, color: '#fff' }} />}
                iconBg="#00B42A"
                label="隐私与权限"
                onClick={() => message.info('隐私与权限页面开发中')}
                noBorder
              />
            </div>
          </div>

          {/* Group 2: Profile & Preferences */}
          <div style={{ marginBottom: 10 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0F1F3' }}>
              <SettingRow
                icon={<UserOutlined style={{ fontSize: 15, color: '#fff' }} />}
                iconBg="#4C8BF5"
                label="编辑个人资料"
                onClick={() => message.info('个人资料编辑页面开发中')}
              />
              <div className="relative">
                <SettingRow
                  icon={<GlobalOutlined style={{ fontSize: 15, color: '#fff' }} />}
                  iconBg="#00B42A"
                  label="语言设置"
                  value={
                    <span className="flex items-center gap-1">
                      {selectedLang}
                      <DownOutlined style={{ fontSize: 10, color: '#C9CDD4' }} />
                    </span>
                  }
                  onClick={() => setLangDropdown((v) => !v)}
                />
                {langDropdown && (
                  <LangDropdown
                    languages={languages}
                    selected={selectedLang}
                    onSelect={(lang) => {
                      setSelectedLang(lang)
                      setLangDropdown(false)
                      message.success(`语言已切换为 ${lang}`)
                    }}
                    onClose={() => setLangDropdown(false)}
                  />
                )}
              </div>
              <SettingRow
                icon={<SoundOutlined style={{ fontSize: 15, color: '#fff' }} />}
                iconBg="#00B42A"
                label="声音选择"
                value={
                  <span className="flex items-center gap-2">
                    <span
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: '#FFE8D6' }}
                    >
                      🍑
                    </span>
                    温柔桃子
                  </span>
                }
                onClick={() => message.info('声音选择页面开发中')}
              />
              <SettingRow
                icon={<MemoryIcon />}
                iconBg="#7B61FF"
                label="记忆"
                value={memoryEnabled ? '已启用' : '已关闭'}
                onClick={() => message.info('记忆管理页面开发中')}
                noBorder
              />
            </div>
          </div>

          {/* Group 3: Help & Share */}
          <div style={{ marginBottom: 10 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0F1F3' }}>
              <SettingRow
                icon={<QuestionCircleOutlined style={{ fontSize: 15, color: '#fff' }} />}
                iconBg="#4C8BF5"
                label="帮助与反馈"
                onClick={() => message.info('帮助与反馈页面开发中')}
              />
              <SettingRow
                icon={<HeartOutlined style={{ fontSize: 15, color: '#fff' }} />}
                iconBg="#F53F3F"
                label="分享 Viceme 给好友"
                onClick={() => {
                  navigator.clipboard.writeText('https://viceme.ai')
                  message.success('分享链接已复制到剪贴板')
                }}
                noBorder
              />
            </div>
          </div>

          {/* Group 4: Toggle settings */}
          <div style={{ marginBottom: 10 }}>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F0F1F3' }}>
              <SettingRow
                icon={<RobotIcon />}
                iconBg="#00B42A"
                label="超能模式下，自动保存 Cookie"
                toggle={{ checked: autoCookie, onChange: setAutoCookie }}
                noBorder
              />
            </div>
          </div>

          {/* Logout */}
          <div style={{ paddingBottom: 40, marginTop: 8 }}>
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl text-[14px] font-medium text-[#F53F3F] hover:bg-[#FFF5F5] transition-colors"
              style={{
                padding: '14px 0',
                border: '1px solid #F0F1F3',
                background: '#fff',
              }}
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LangDropdown({
  languages,
  selected,
  onSelect,
  onClose,
}: {
  languages: string[]
  selected: string
  onSelect: (lang: string) => void
  onClose: () => void
}) {
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
      className="absolute right-5 bg-white rounded-xl z-20"
      style={{
        top: '100%',
        marginTop: -4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #F0F1F3',
        padding: 4,
        minWidth: 160,
      }}
    >
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className="w-full text-left rounded-lg transition-colors hover:bg-[#F7F8FA] flex items-center justify-between"
          style={{
            padding: '10px 14px',
            fontSize: 13,
            color: selected === lang ? '#4C8BF5' : '#1D2129',
            fontWeight: selected === lang ? 500 : 400,
          }}
        >
          {lang}
          {selected === lang && (
            <span style={{ color: '#4C8BF5', fontSize: 12, fontWeight: 700 }}>✓</span>
          )}
        </button>
      ))}
    </div>
  )
}

function MemoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M10 21h4" />
      <path d="M9 17h6" />
    </svg>
  )
}

function RobotIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  )
}

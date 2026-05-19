import { useState, useRef, useEffect } from 'react'
import { Input, Tooltip, Tag, message } from 'antd'
import {
  DeleteOutlined,
  ShareAltOutlined,
  SettingOutlined,
  CopyOutlined,
  ReloadOutlined,
  LikeOutlined,
  DislikeOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  RightOutlined,
  FileTextOutlined,
  PictureOutlined,
  AudioOutlined,
  CodeOutlined,
  CustomerServiceOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useStore } from '../store'

const { TextArea } = Input

export default function ChatArea() {
  const {
    workspaces,
    selectedWorkspaceId,
    sendMessage,
    clearWorkspaceMessages,
  } = useStore()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentWs = workspaces.find((w) => w.id === selectedWorkspaceId)
  const messages = currentWs?.messages || []
  const currentAgent = currentWs?.agent

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    message.success('已复制到剪贴板')
  }

  const handleClear = () => {
    if (!currentWs) return
    clearWorkspaceMessages(currentWs.id)
    message.success('对话已清空')
  }

  const suggestions = ['继续处理', '生成报告', '运行测试']

  const toolbarItems = [
    { icon: <ThunderboltOutlined style={{ fontSize: 16 }} />, label: '快速', suffix: <RightOutlined style={{ fontSize: 10, marginLeft: 1 }} /> },
    { icon: <FileTextOutlined style={{ fontSize: 16 }} />, label: '帮我写作' },
    { icon: <PictureOutlined style={{ fontSize: 16 }} />, label: '图像生成' },
    { icon: <CustomerServiceOutlined style={{ fontSize: 16 }} />, label: 'AI播客' },
    { icon: <CodeOutlined style={{ fontSize: 16 }} />, label: '编程' },
    { icon: <CustomerServiceOutlined style={{ fontSize: 16 }} />, label: '音乐生成' },
    { icon: <AppstoreOutlined style={{ fontSize: 16 }} />, label: '更多' },
  ]

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg-page">
      {/* Top nav */}
      <div
        className="flex items-center justify-between bg-bg-white border-b border-border shrink-0"
        style={{ height: 56, padding: '0 20px' }}
      >
        <h2 className="text-[14px] font-semibold truncate text-text-primary">
          {currentAgent ? currentAgent.name : '新建对话'}
          {currentWs && <span className="text-text-tertiary font-normal text-[12px] ml-2">· {currentWs.name}</span>}
        </h2>
        <div className="flex items-center" style={{ gap: 18 }}>
          <Tooltip title="清空对话">
            <button onClick={handleClear} className="text-text-tertiary hover:text-text-secondary transition-colors">
              <DeleteOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
          <Tooltip title="分享">
            <button onClick={() => message.info('分享功能开发中')} className="text-text-tertiary hover:text-text-secondary transition-colors">
              <ShareAltOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
          <Tooltip title="设置">
            <button onClick={() => message.info('设置功能开发中')} className="text-text-tertiary hover:text-text-secondary transition-colors">
              <SettingOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex justify-center" style={{ padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1" style={{ paddingTop: 120 }}>
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center" style={{ marginBottom: 16 }}>
                <span className="text-brand text-2xl font-bold">V</span>
              </div>
              <h3 className="text-[16px] font-semibold text-text-primary" style={{ marginBottom: 4 }}>
                开始与 {currentAgent?.name || 'Agent'} 对话
              </h3>
              <p className="text-[13px] text-text-tertiary">输入你的问题或任务描述</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div style={{ maxWidth: '85%' }}>
                    <div
                      className="whitespace-pre-wrap"
                      style={{
                        padding: '12px 16px',
                        fontSize: 13,
                        lineHeight: 1.7,
                        borderRadius: 16,
                        borderBottomRightRadius: 4,
                        background: '#F2F3F5',
                        color: '#1D2129',
                      }}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center mt-1.5 justify-end" style={{ gap: 2 }}>
                      <span style={{ fontSize: 11, color: '#86909C' }}>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <div
                    className="whitespace-pre-wrap"
                    style={{
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: '#1D2129',
                      padding: '4px 0',
                    }}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center mt-2" style={{ gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#86909C', marginRight: 6 }}>{msg.timestamp}</span>
                    <Tooltip title="复制"><button onClick={() => handleCopy(msg.content)} className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"><CopyOutlined style={{ fontSize: 12 }} /></button></Tooltip>
                    <Tooltip title="重新生成"><button onClick={() => message.info('重新生成中…')} className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"><ReloadOutlined style={{ fontSize: 12 }} /></button></Tooltip>
                    <Tooltip title="有帮助"><button onClick={() => message.success('感谢反馈')} className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"><LikeOutlined style={{ fontSize: 12 }} /></button></Tooltip>
                    <Tooltip title="没帮助"><button onClick={() => message.info('已记录反馈')} className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary"><DislikeOutlined style={{ fontSize: 12 }} /></button></Tooltip>
                  </div>
                  {msg.id === messages[messages.length - 1]?.id && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {suggestions.map((s) => (
                        <Tag
                          key={s}
                          onClick={() => { setInput(s); }}
                          className="!rounded-full !px-3 !py-1 !text-[12px] !border-border !text-text-secondary !bg-white hover:!bg-[#F2F3F5] !cursor-pointer !transition-colors !m-0"
                        >
                          {s}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 flex justify-center" style={{ padding: '12px 20px 20px' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <div
            className="bg-bg-white overflow-hidden focus-within:border-[#D0E0FF] transition-colors"
            style={{ borderRadius: 20, border: '1px solid #E5E6EB' }}
          >
            <div style={{ padding: '14px 20px 8px' }}>
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入指令，或描述你需要 Agent 完成的任务…"
                autoSize={{ minRows: 1, maxRows: 4 }}
                variant="borderless"
                className="chat-input !text-[14px] !leading-[1.6] !p-0"
                style={{ resize: 'none' }}
              />
            </div>
            <div className="flex items-center justify-between" style={{ padding: '4px 16px 12px' }}>
              <div className="flex items-center">
                <button className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors">
                  <PlusOutlined style={{ fontSize: 16, color: '#1D2129' }} />
                </button>
                <div style={{ width: 1, height: 16, background: '#E5E6EB', margin: '0 8px' }} />
                <div className="flex items-center" style={{ gap: 2 }}>
                  {toolbarItems.map((item) => (
                    <button
                      key={item.label}
                      className="flex items-center rounded-[8px] hover:bg-[#F2F3F5] transition-colors"
                      style={{ height: 32, gap: 4, padding: '0 8px' }}
                      onClick={() => message.info(`${item.label} 功能开发中`)}
                    >
                      <span style={{ color: '#1D2129', display: 'flex' }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1D2129' }}>{item.label}</span>
                      {item.suffix && <span style={{ color: '#86909C', display: 'flex' }}>{item.suffix}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 34, height: 34, background: '#F2F3F5' }}
                onClick={() => message.info('语音输入功能开发中')}
              >
                <AudioOutlined style={{ fontSize: 16, color: '#1D2129' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

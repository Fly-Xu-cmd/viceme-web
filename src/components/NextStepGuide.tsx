import { useState, useEffect, useCallback, useRef } from 'react'
import { CloseOutlined, RightOutlined } from '@ant-design/icons'

export interface GuideChoice {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface NextStepGuideProps {
  open: boolean
  title?: string
  choices: GuideChoice[]
  allowCustom?: boolean
  onSelect: (id: string, label: string) => void
  onCustomSubmit?: (value: string) => void
  onSkip: () => void
}

export default function NextStepGuide({
  open,
  title = '下一步你想做什么？',
  choices,
  allowCustom = false,
  onSelect,
  onCustomSubmit,
  onSkip,
}: NextStepGuideProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [customValue, setCustomValue] = useState('')
  const [isCustomFocused, setIsCustomFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  const totalItems = allowCustom ? choices.length + 1 : choices.length

  useEffect(() => {
    if (open) {
      setActiveIdx(0)
      setCustomValue('')
      setIsCustomFocused(false)
    }
  }, [open])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx(prev => (prev - 1 + totalItems) % totalItems)
        setIsCustomFocused(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx(prev => (prev + 1) % totalItems)
        setIsCustomFocused(false)
        break
      case 'Enter':
        e.preventDefault()
        if (isCustomFocused && customValue.trim()) {
          onCustomSubmit?.(customValue.trim())
        } else if (activeIdx < choices.length) {
          const c = choices[activeIdx]
          onSelect(c.id, c.label)
        } else if (allowCustom) {
          setIsCustomFocused(true)
          customInputRef.current?.focus()
        }
        break
      case 'Escape':
        e.preventDefault()
        onSkip()
        break
    }
  }, [open, activeIdx, totalItems, choices, allowCustom, isCustomFocused, customValue, onSelect, onCustomSubmit, onSkip])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!open) return null

  return (
    <div className="nsg-overlay" onClick={onSkip}>
      <div
        ref={containerRef}
        className="nsg-container"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="nsg-header">
          <h3 className="nsg-title">{title}</h3>
          <button className="nsg-close" onClick={onSkip}>
            <CloseOutlined style={{ fontSize: 12 }} />
          </button>
        </div>

        {/* Options */}
        <div className="nsg-options">
          {choices.map((choice, i) => (
            <button
              key={choice.id}
              className={`nsg-option ${activeIdx === i ? 'nsg-option-active' : ''}`}
              onClick={() => onSelect(choice.id, choice.label)}
              onMouseEnter={() => { setActiveIdx(i); setIsCustomFocused(false) }}
            >
              <div className="nsg-option-left">
                {choice.icon ? (
                  <span className="nsg-option-icon">{choice.icon}</span>
                ) : (
                  <span className="nsg-option-num">{i + 1}</span>
                )}
                <div className="nsg-option-text">
                  <span className="nsg-option-label">{choice.label}</span>
                  {choice.description && (
                    <span className="nsg-option-desc">{choice.description}</span>
                  )}
                </div>
              </div>
              {activeIdx === i && (
                <RightOutlined style={{ fontSize: 10, color: '#86909C' }} />
              )}
            </button>
          ))}

          {allowCustom && (
            <div
              className={`nsg-custom ${activeIdx === choices.length ? 'nsg-option-active' : ''}`}
              onMouseEnter={() => setActiveIdx(choices.length)}
              onClick={() => {
                setIsCustomFocused(true)
                customInputRef.current?.focus()
              }}
            >
              <input
                ref={customInputRef}
                type="text"
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                onFocus={() => setIsCustomFocused(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customValue.trim()) {
                    e.preventDefault()
                    e.stopPropagation()
                    onCustomSubmit?.(customValue.trim())
                  }
                }}
                placeholder="输入自定义要求…"
                className="nsg-custom-input"
              />
              {customValue.trim() && (
                <button
                  className="nsg-custom-send"
                  onClick={e => {
                    e.stopPropagation()
                    onCustomSubmit?.(customValue.trim())
                  }}
                >
                  确定
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="nsg-footer">
          <span className="nsg-shortcuts">
            ↑↓ 导航 · Enter 选择 · Esc 跳过
          </span>
          <button className="nsg-skip" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

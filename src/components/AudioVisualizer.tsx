import { useEffect, useRef, useCallback, useState } from 'react'

interface AudioVisualizerProps {
  active: boolean
  onStop?: () => void
  style?: 'bars' | 'wave' | 'circle'
  barCount?: number
  color?: string
  height?: number
}

interface AudioState {
  context: AudioContext | null
  analyser: AnalyserNode | null
  stream: MediaStream | null
  source: MediaStreamAudioSourceNode | null
}

export default function AudioVisualizer({
  active,
  onStop,
  style = 'bars',
  barCount = 32,
  color = '#4C8BF5',
  height = 120,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<AudioState>({ context: null, analyser: null, stream: null, source: null })
  const animationRef = useRef<number>(0)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const [permissionDenied, setPermissionDenied] = useState(false)

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animationRef.current)
    const { stream, context } = audioRef.current
    stream?.getTracks().forEach(t => t.stop())
    context?.close().catch(() => {})
    audioRef.current = { context: null, analyser: null, stream: null, source: null }
    if (timerRef.current) clearInterval(timerRef.current)
    setDuration(0)
  }, [])

  const startAudio = useCallback(async () => {
    try {
      setPermissionDenied(false)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      const source = context.createMediaStreamSource(stream)
      source.connect(analyser)
      audioRef.current = { context, analyser, stream, source }

      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      setPermissionDenied(true)
    }
  }, [])

  useEffect(() => {
    if (active) {
      startAudio()
    } else {
      stopAudio()
    }
    return stopAudio
  }, [active, startAudio, stopAudio])

  const drawBars = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array) => {
    ctx.clearRect(0, 0, w, h)
    const len = Math.min(barCount, data.length)
    const gap = 2
    const barW = Math.max(2, (w - gap * (len - 1)) / len)
    const centerY = h / 2

    for (let i = 0; i < len; i++) {
      const v = data[i] / 255
      const barH = Math.max(3, v * centerY * 0.9)
      const x = i * (barW + gap)
      const alpha = 0.4 + v * 0.6

      const grad = ctx.createLinearGradient(0, centerY - barH, 0, centerY + barH)
      grad.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`)
      grad.addColorStop(0.5, color)
      grad.addColorStop(1, `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`)
      ctx.fillStyle = grad

      const radius = Math.min(barW / 2, 3)
      roundRect(ctx, x, centerY - barH, barW, barH * 2, radius)
    }
  }, [barCount, color])

  const drawWave = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array) => {
    ctx.clearRect(0, 0, w, h)
    const centerY = h / 2
    const step = w / data.length

    ctx.beginPath()
    ctx.moveTo(0, centerY)

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 255 - 0.5) * 2
      const y = centerY + v * centerY * 0.8
      const x = i * step
      if (i === 0) ctx.moveTo(x, y)
      else {
        const cpx = (x + (i - 1) * step) / 2
        ctx.quadraticCurveTo(cpx, centerY + ((data[i - 1] / 255 - 0.5) * 2) * centerY * 0.8, x, y)
      }
    }

    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.lineTo(w, centerY)
    ctx.lineTo(0, centerY)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, `${color}18`)
    grad.addColorStop(0.5, `${color}30`)
    grad.addColorStop(1, `${color}08`)
    ctx.fillStyle = grad
    ctx.fill()
  }, [color])

  const drawCircle = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, data: Uint8Array) => {
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const baseR = Math.min(cx, cy) * 0.35
    const maxR = Math.min(cx, cy) * 0.9
    const sliceAngle = (Math.PI * 2) / data.length

    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255
      const r = baseR + v * (maxR - baseR)
      const angle = i * sliceAngle - Math.PI / 2
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    const grad = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, maxR)
    grad.addColorStop(0, `${color}20`)
    grad.addColorStop(1, `${color}08`)
    ctx.fillStyle = grad
    ctx.fill()

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, baseR * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = `${color}15`
    ctx.fill()
    ctx.strokeStyle = `${color}40`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [color])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const { analyser } = audioRef.current
      if (!analyser) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      if (style === 'wave') {
        analyser.getByteTimeDomainData(dataArray)
      } else {
        analyser.getByteFrequencyData(dataArray)
      }

      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth * dpr
      const h = canvas.clientHeight * dpr
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const drawW = canvas.clientWidth
      const drawH = canvas.clientHeight

      switch (style) {
        case 'wave': drawWave(ctx, drawW, drawH, dataArray); break
        case 'circle': drawCircle(ctx, drawW, drawH, dataArray); break
        default: drawBars(ctx, drawW, drawH, dataArray)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationRef.current)
  }, [active, style, drawBars, drawWave, drawCircle])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (!active) return null

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <span className="text-[13px] text-red-500">麦克风权限被拒绝，请在浏览器设置中允许</span>
        <button
          onClick={onStop}
          className="px-4 py-1.5 rounded-lg text-[12px] text-text-secondary bg-[#F2F3F5] hover:bg-[#E5E6EB] transition-colors"
        >
          关闭
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height, display: 'block' }}
      />
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-mono text-text-secondary tabular-nums">
          {formatTime(duration)}
        </span>
        <button
          onClick={onStop}
          className="voice-stop-btn w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/20"
        >
          <span className="w-3.5 h-3.5 rounded-[3px] bg-white" />
        </button>
        <div className="flex items-center gap-1">
          <span className="voice-pulse w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[12px] text-red-500 font-medium">录制中</span>
        </div>
      </div>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}
